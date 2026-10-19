import type { DecodingType } from '@/types';

export type ExtraDecode = { encoding: DecodingType; bytes: Uint8Array; notes?: string[] };
const bytes = (s: string) => new TextEncoder().encode(s);
const named: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  copy: '\u00a9', reg: '\u00ae', trade: '\u2122', euro: '\u20ac',
  hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
};
export function decodeTextFormats(input: string): ExtraDecode[] {
  const results: ExtraDecode[] = [];
  if (/%[0-9a-f]{2}/i.test(input)) {
    try {
      const decoded = decodeURIComponent(input);
      if (decoded !== input) results.push({ encoding: 'url-encoded', bytes: bytes(decoded) });
    } catch { /* malformed percent encoding */ }
  }
  if (/&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/i.test(input)) {
    let changed = false;
    const decoded = input.replace(/&(?:#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi, token => {
      let value: string | undefined;
      if (token.startsWith('&#')) {
        const isHex = token[2].toLowerCase() === 'x';
        const n = Number.parseInt(token.slice(isHex ? 3 : 2, -1), isHex ? 16 : 10);
        if (Number.isFinite(n) && n > 0 && n <= 0x10ffff && (n < 0xd800 || n > 0xdfff)) value = String.fromCodePoint(n);
      } else {
        value = named[token.slice(1, -1)];
        if (value === undefined && typeof document !== 'undefined') {
          // Browser's built-in WHATWG HTML entity table, without executing markup.
          const elem = document.createElement('textarea');
          elem.innerHTML = token;
          if (elem.value !== token) value = elem.value;
        }
      }
      if (value !== undefined && value !== token) changed = true;
      return value ?? token;
    });
    if (changed) results.push({ encoding: 'html-entity', bytes: bytes(decoded) });
  }
  if (/\\(?:x[0-9a-f]{2}|u\{[0-9a-f]{1,6}\})/i.test(input)) {
    let changed = false;
    const decoded = input.replace(/\\(?:x([0-9a-f]{2})|u\{([0-9a-f]{1,6})\})/gi, (raw, h: string | undefined, cp: string | undefined) => {
      const n = Number.parseInt(h ?? cp, 16);
      if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return raw;
      changed = true;
      return String.fromCodePoint(n);
    });
    if (changed) results.push({ encoding: 'javascript-escape', bytes: bytes(decoded) });
  }
  let hex: string | undefined;
  if (/^0x(?:[0-9a-f]{2})+$/i.test(input)) hex = input.slice(2);
  else if (/^(?:0x)?[0-9a-f]{2}(?:(?:\s+|[:,;-]\s*)(?:0x)?[0-9a-f]{2})+$/i.test(input))
    hex = input.replace(/0x|[\s,:;-]/gi, '');
  if (hex) {
    const data = new Uint8Array(hex.length / 2);
    for (let i = 0; i < data.length; i++) data[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    results.push({ encoding: 'hex', bytes: data });
  }
  return results;
}
export function decodeBase36(input: string): ExtraDecode | null {
  if (!/^(?=.*[a-z])(?=.*\d)[0-9a-z]{4,}$/i.test(input)) return null;
  let num = 0n;
  for (const c of input.toLowerCase()) num = num * 36n + BigInt(parseInt(c, 36));
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i++) result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return { encoding: 'base36', bytes: result };
}
export function decodeBase45(input: string): ExtraDecode | null {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  if (input.length < 2 || input.length % 3 === 1 || !/^[0-9A-Z $%*+\-./:]+$/.test(input) || !/[$%*+\-./: ]/.test(input)) return null;
  const data: number[] = [];
  for (let i = 0; i < input.length;) {
    const width = Math.min(3, input.length - i);
    let n = 0;
    for (let j = 0; j < width; j++) n += alphabet.indexOf(input[i + j]) * (45 ** j);
    if (width === 3 && n > 65535 || width === 2 && n > 255) return null;
    if (width === 3) data.push(n >> 8, n & 255);
    else data.push(n);
    i += width;
  }
  return { encoding: 'base45', bytes: Uint8Array.from(data) };
}
