import type { DecodeResult, DecodedEntry, DecodingType } from '@/types';
import { isHex, isBase62, isCrockfordBase32, isBase32Hex, isBase32Std, isBase58 } from './utils/charset';
import { hexToBytes, bytesToHex } from './utils/hex';
import { decodeCrockfordBase32, decodeBase32Std, decodeBase32Hex } from './utils/base32';
import { decodeBase58ToBytes } from './utils/base58';
import { decodeBase62ToBytes } from './utils/base62';

const BASE64_STANDARD_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const BASE64_URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;

function bytesToUtf8(bytes: Uint8Array): string | null {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

// eslint-disable-next-line no-control-regex
const NON_PRINTABLE_RE = /[\x00-\x08\x0e-\x1f\x7f]/;

const SPECIFICITY: Record<DecodingType, number> = {
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

function makeEntry(encoding: DecodingType, bytes: Uint8Array): DecodedEntry {
  return {
    encoding,
    decoded_bytes: bytes,
    decoded_text: bytesToUtf8(bytes),
    hex_string: bytesToHex(bytes),
    byte_length: bytes.length,
    bit_length: bytes.length * 8,
  };
}

export function decode(input: string): DecodeResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { input, entries: [], error: '입력이 비어있습니다' };
  }

  const entries: DecodedEntry[] = [];

  // Strip padding for charset checks (padding '=' is not part of the data alphabet)
  const stripped = trimmed.replace(/=+$/, '');

  // 1. Pure hex (0-9a-fA-F only, even length)
  if (isHex(trimmed) && trimmed.length % 2 === 0 && trimmed.length >= 2) {
    entries.push(makeEntry('hex', hexToBytes(trimmed)));
  }

  // 2. Base64 (standard + URL-safe)
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

  // 3. Standard Base32 (RFC 4648: A-Z2-7, with optional = padding)
  if (isBase32Std(stripped) && stripped.length >= 2) {
    const bytes = decodeBase32Std(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32std', bytes));
    }
  }

  // 4. Crockford Base32
  if (isCrockfordBase32(stripped) && stripped.length >= 2) {
    const bytes = decodeCrockfordBase32(stripped);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32', bytes));
    }
  }

  // 5. Base32Hex
  if (isBase32Hex(stripped) && stripped.length >= 2) {
    const bytes = decodeBase32Hex(stripped);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base32hex', bytes));
    }
  }

  // 6. Base58 (Bitcoin alphabet: excludes 0, O, I, l)
  if (isBase58(trimmed) && trimmed.length >= 2) {
    const bytes = decodeBase58ToBytes(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base58', bytes));
    }
  }

  // 7. Base62 (skip if already matched as hex — same result)
  if (isBase62(trimmed) && !isHex(trimmed) && trimmed.length >= 2) {
    const bytes = decodeBase62ToBytes(trimmed);
    if (bytes && bytes.length > 0) {
      entries.push(makeEntry('base62', bytes));
    }
  }

  if (entries.length === 0) {
    return { input, entries: [], error: '디코딩할 수 없는 형식입니다' };
  }

  const hasPadding = /=+$/.test(trimmed);
  entries.sort((a, b) => scoreEntry(b, hasPadding) - scoreEntry(a, hasPadding));

  return { input, entries };
}
