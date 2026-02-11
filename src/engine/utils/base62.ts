// Base62 decoding: 0-9A-Za-z
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE62_MAP = new Map<string, bigint>();
for (let i = 0; i < BASE62_ALPHABET.length; i++) {
  BASE62_MAP.set(BASE62_ALPHABET[i], BigInt(i));
}

export function decodeBase62ToBigInt(input: string): bigint | null {
  let result = 0n;
  for (const ch of input) {
    const val = BASE62_MAP.get(ch);
    if (val === undefined) return null;
    result = result * 62n + val;
  }
  return result;
}

export function decodeBase62ToBytes(input: string): Uint8Array | null {
  const num = decodeBase62ToBigInt(input);
  if (num === null) return null;

  if (num === 0n) return new Uint8Array([0]);

  const hex = num.toString(16).padStart(2, '0');
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
