import { decodeTextFormats, decodeBase36, decodeBase45 } from './utils/extra-text';
import { decodeBase85Variants } from './utils/base85-variants';
import { decodeJwt, decodeBase58Check } from './utils/structured';
import type { DecodeResult, DecodedEntry, DecodingType } from '@/types';
import { isHex, isBase62, isCrockfordBase32, isBase32Hex, isBase32Std, isBase58 } from './utils/charset';
import { hexToBytes, bytesToHex } from './utils/hex';
import { decodeCrockfordBase32, decodeBase32Std, decodeBase32Hex } from './utils/base32';
import { decodeBase58ToBytes } from './utils/base58';
import { decodeBase62ToBytes } from './utils/base62';

const BASE64_STANDARD_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const BASE64_URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;
const HEX4_RE = /^[0-9a-fA-F]{4}$/;

function bytesToUtf8(bytes: Uint8Array, charset = 'utf-8'): string | null {
  try {
    const decoder = new TextDecoder(charset, { fatal: true });
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

function decodeUnicodeEscapes(input: string): string | null {
  let output = '';
  let changed = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char !== '\\' || i + 1 >= input.length) {
      output += char;
      continue;
    }

    const escape = input[i + 1];

    if (escape === 'u') {
      const hex = input.slice(i + 2, i + 6);
      if (!HEX4_RE.test(hex)) {
        output += char;
        continue;
      }

      const codeUnit = Number.parseInt(hex, 16);

      // Decode valid UTF-16 surrogate pairs as one Unicode code point.
      if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
        const nextPrefix = input.slice(i + 6, i + 8);
        const lowHex = input.slice(i + 8, i + 12);
        if (nextPrefix === '\\u' && HEX4_RE.test(lowHex)) {
          const low = Number.parseInt(lowHex, 16);
          if (low >= 0xdc00 && low <= 0xdfff) {
            const codePoint = 0x10000 + ((codeUnit - 0xd800) << 10) + (low - 0xdc00);
            output += String.fromCodePoint(codePoint);
            i += 11;
            changed = true;
            continue;
          }
        }

        // Preserve malformed/unpaired surrogate escapes verbatim.
        output += input.slice(i, i + 6);
        i += 5;
        continue;
      }

      if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
        output += input.slice(i, i + 6);
        i += 5;
        continue;
      }

      output += String.fromCharCode(codeUnit);
      i += 5;
      changed = true;
      continue;
    }

    const simpleEscapes: Record<string, string> = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    };

    if (Object.hasOwn(simpleEscapes, escape)) {
      output += simpleEscapes[escape];
      i += 1;
      changed = true;
      continue;
    }

    output += char;
  }

  return changed ? output : null;
}

// eslint-disable-next-line no-control-regex
const NON_PRINTABLE_RE = /[\x00-\x08\x0e-\x1f\x7f]/;

const SPECIFICITY: Record<DecodingType, number> = {
  'unicode-escape': 4,
  'url-encoded': 6,
  'html-entity': 6,
  'javascript-escape': 6,
  'jwt': 9,
  'base58check': 8,
  'base36': -4,
  'base45': -3,
  'ascii85': 1,
  'base85': 0,
  'z85': 0,
  hex: 3,
  base32std: 2,
  base58: 2,
  base32: 1,
  base32hex: 1,
  base64: 0,
  base62: 0,
};

function scoreEntry(entry: DecodedEntry, hasPadding: boolean): number {
  let s = 0;
  if (entry.decoded_text !== null) {
    s += 10;
    if (!NON_PRINTABLE_RE.test(entry.decoded_text)) s += 10;
  }
  if (hasPadding && (entry.encoding === 'base32std' || entry.encoding === 'base64')) {
    s += 5;
  }
  s += SPECIFICITY[entry.encoding];
  return s;
}

function makeEntry(encoding: DecodingType, bytes: Uint8Array, charset = 'utf-8', notes?: string[]): DecodedEntry {
  return {
    encoding,
    decoded_bytes: bytes,
    decoded_text: bytesToUtf8(bytes, charset),
    notes,
    hex_string: bytesToHex(bytes),
    byte_length: bytes.length,
    bit_length: bytes.length * 8,
  };
}

export function decode(input: string, charset = 'utf-8', maxDepth = 1): DecodeResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { input, entries: [], error: '입력이 비어있습니다' };
  }

  const entries: DecodedEntry[] = [];

  // 1. JSON-style Unicode/string escapes (e.g. \ud655\uc778, \n, \", surrogate pairs)
  const unicodeDecoded = decodeUnicodeEscapes(trimmed);
  if (unicodeDecoded !== null) {
    entries.push(makeEntry('unicode-escape', new TextEncoder().encode(unicodeDecoded)));
  }

  // Strip padding for charset checks (padding '=' is not part of the data alphabet)
  const stripped = trimmed.replace(/=+$/, '');

  // 2. Pure hex (0-9a-fA-F only, even length)
  if (isHex(trimmed) && trimmed.length % 2 === 0 && trimmed.length >= 2) {
    entries.push(makeEntry('hex', hexToBytes(trimmed)));
  }

  // 3. Base64 (standard + URL-safe)
  if (trimmed.length >= 4 && (BASE64_STANDARD_RE.test(trimmed) || BASE64_URL_RE.test(trimmed))) {
    try {
      const standard = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
      const binaryStr = atob(padded);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      entries.push(makeEntry('base64', bytes));
    } catch {
      // skip
    }
  }

  // 4. Standard Base32 (RFC 4648: A-Z2-7, with optional = padding)
  if (isBase32Std(stripped) && stripped.length >= 2) {
    const bytes = decodeBase32Std(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32std', bytes));
    }
  }

  // 5. Crockford Base32
  if (isCrockfordBase32(stripped) && stripped.length >= 2) {
    const bytes = decodeCrockfordBase32(stripped);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32', bytes));
    }
  }

  // 6. Base32Hex
  if (isBase32Hex(stripped) && stripped.length >= 2) {
    const bytes = decodeBase32Hex(stripped);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32hex', bytes));
    }
  }

  // 7. Base58 (Bitcoin alphabet: excludes 0, O, I, l)
  if (isBase58(trimmed) && trimmed.length >= 2) {
    const bytes = decodeBase58ToBytes(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base58', bytes));
    }
  }

  // 8. Base62 (skip if already matched as hex — same result)
  if (isBase62(trimmed) && !isHex(trimmed) && trimmed.length >= 2) {
    const bytes = decodeBase62ToBytes(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base62', bytes));
    }
  }

  // Strongly signaled formats precede generic alphabet-based alternatives.
  const extras = [
    ...decodeTextFormats(trimmed),
    ...decodeBase85Variants(trimmed),
    decodeBase58Check(trimmed),
    decodeJwt(trimmed),
    decodeBase45(trimmed),
    decodeBase36(trimmed),
  ];
  for (const extra of extras) {
    if (extra) entries.push(makeEntry(extra.encoding, extra.bytes, charset, extra.notes));
  }
  // The original decode path uses UTF-8; reinterpret bytes using the selected charset.
  for (const entry of entries) entry.decoded_text = bytesToUtf8(entry.decoded_bytes, charset);

  if (entries.length === 0) {
    return { input, entries: [], error: '디코딩할 수 없는 형식입니다' };
  }

  const hasPadding = /=+$/.test(trimmed);
  entries.sort((a, b) => scoreEntry(b, hasPadding) - scoreEntry(a, hasPadding));

  // Bounded exploration. Avoid cycles and exponential explosion from overlapping alphabets.
  if (maxDepth > 1) {
    const seen = new Set([trimmed]);
    const queue = entries.slice(0, 8).map(entry => ({ entry, depth: 1, path: [entry.encoding] }));
    const nested: DecodedEntry[] = [];
    let processed = 0;
    while (queue.length && processed < 32) {
      const node = queue.shift()!;
      processed++;
      const value = node.entry.decoded_text;
      if (!value || node.depth >= Math.min(3, maxDepth) || value.length > 512 || seen.has(value) || !/^[\x20-\x7e]+$/.test(value)) continue;
      seen.add(value);
      const children = decode(value, charset, 1).entries.slice(0, 4);
      for (const child of children) {
        if (child.decoded_text === value) continue;
        const path = [...node.path, child.encoding];
        const enhanced = { ...child, depth: node.depth + 1, path };
        nested.push(enhanced);
        if (queue.length + nested.length < 32) queue.push({ entry: enhanced, depth: node.depth + 1, path });
      }
    }
    entries.push(...nested);
  }
  return { input, entries };
}
