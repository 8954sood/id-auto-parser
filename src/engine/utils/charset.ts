import type { Charset } from '@/types';

const HEX_RE = /^[0-9a-fA-F]+$/;
const DECIMAL_RE = /^[0-9]+$/;
const BASE32_CROCKFORD_RE = /^[0-9A-HJKMNP-TV-Z]+$/i;
const BASE32_HEX_RE = /^[0-9a-v]+$/;
const BASE32_STD_RE = /^[A-Za-z2-7]+=*$/;
const BASE36_RE = /^[0-9a-z]+$/i;
const BASE58_RE = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
const BASE62_RE = /^[0-9A-Za-z]+$/;
const BASE64_RE = /^[A-Za-z0-9+/]+=*$/;
const BASE64_URL_RE = /^[A-Za-z0-9_-]+=*$/;

export function isHex(s: string): boolean {
  return HEX_RE.test(s);
}

export function isDecimal(s: string): boolean {
  return DECIMAL_RE.test(s);
}

export function isCrockfordBase32(s: string): boolean {
  return BASE32_CROCKFORD_RE.test(s);
}

export function isBase32Hex(s: string): boolean {
  return BASE32_HEX_RE.test(s);
}

export function isBase32Std(s: string): boolean {
  return BASE32_STD_RE.test(s);
}

export function isBase58(s: string): boolean {
  return BASE58_RE.test(s);
}

export function isBase36(s: string): boolean {
  return BASE36_RE.test(s);
}

export function isBase62(s: string): boolean {
  return BASE62_RE.test(s);
}

export function isBase64(s: string): boolean {
  return BASE64_RE.test(s) || BASE64_URL_RE.test(s);
}

export function detectCharset(s: string): Charset {
  if (isDecimal(s)) return 'decimal';
  if (isHex(s)) return 'hex';
  if (isBase32Hex(s)) return 'base32hex';
  if (isBase62(s)) return 'base62';
  if (isBase64(s)) return 'base64';
  return 'unknown';
}
