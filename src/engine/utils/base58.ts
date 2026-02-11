// Base58 (Bitcoin alphabet) decoding
// Alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
// Excludes: 0, O, I, l

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map<string, bigint>();
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP.set(BASE58_ALPHABET[i], BigInt(i));
}

export function decodeBase58ToBytes(input: string): Uint8Array | null {
  // Count leading '1's (they represent leading zero bytes)
  let leadingZeros = 0;
  for (const ch of input) {
    if (ch === '1') leadingZeros++;
    else break;
  }

  let num = 0n;
  for (const ch of input) {
    const val = BASE58_MAP.get(ch);
    if (val === undefined) return null;
    num = num * 58n + val;
  }

  if (num === 0n) {
    return new Uint8Array(leadingZeros || 1);
  }

  // Convert bigint to bytes
  const hex = num.toString(16);
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  const dataBytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < dataBytes.length; i++) {
    dataBytes[i] = parseInt(padded.substring(i * 2, i * 2 + 2), 16);
  }

  // Prepend leading zero bytes
  if (leadingZeros > 0) {
    const result = new Uint8Array(leadingZeros + dataBytes.length);
    result.set(dataBytes, leadingZeros);
    return result;
  }

  return dataBytes;
}
