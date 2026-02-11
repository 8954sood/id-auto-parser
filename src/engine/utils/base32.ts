// Crockford Base32 decoding
// Alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CROCKFORD_MAP = new Map<string, number>();
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CROCKFORD_MAP.set(CROCKFORD_ALPHABET[i], i);
}
// Handle lowercase and common substitutions
CROCKFORD_MAP.set('O', 0); // O → 0
CROCKFORD_MAP.set('I', 1); // I → 1
CROCKFORD_MAP.set('L', 1); // L → 1
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CROCKFORD_MAP.set(CROCKFORD_ALPHABET[i].toLowerCase(), i);
}
CROCKFORD_MAP.set('o', 0);
CROCKFORD_MAP.set('i', 1);
CROCKFORD_MAP.set('l', 1);

export function decodeCrockfordBase32(input: string): Uint8Array | null {
  const values: number[] = [];
  for (const ch of input) {
    const val = CROCKFORD_MAP.get(ch);
    if (val === undefined) return null;
    values.push(val);
  }

  // Each character is 5 bits
  const totalBits = values.length * 5;
  const byteLength = Math.floor(totalBits / 8);
  const result = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (const val of values) {
    bitBuffer = (bitBuffer << 5) | val;
    bitsInBuffer += 5;

    while (bitsInBuffer >= 8 && byteIndex < byteLength) {
      bitsInBuffer -= 8;
      result[byteIndex++] = (bitBuffer >> bitsInBuffer) & 0xff;
    }
  }

  return result;
}

export function decodeCrockfordBase32ToBigInt(input: string): bigint | null {
  let result = 0n;
  for (const ch of input) {
    const val = CROCKFORD_MAP.get(ch);
    if (val === undefined) return null;
    result = (result << 5n) | BigInt(val);
  }
  return result;
}

// Standard Base32 decoding (RFC 4648)
// Alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
const STD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STD_MAP = new Map<string, number>();
for (let i = 0; i < STD_ALPHABET.length; i++) {
  STD_MAP.set(STD_ALPHABET[i], i);
  STD_MAP.set(STD_ALPHABET[i].toLowerCase(), i);
}

export function decodeBase32Std(input: string): Uint8Array | null {
  // Strip padding
  const stripped = input.replace(/=+$/, '');
  const values: number[] = [];
  for (const ch of stripped) {
    const val = STD_MAP.get(ch);
    if (val === undefined) return null;
    values.push(val);
  }

  const totalBits = values.length * 5;
  const byteLength = Math.floor(totalBits / 8);
  const result = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (const val of values) {
    bitBuffer = (bitBuffer << 5) | val;
    bitsInBuffer += 5;

    while (bitsInBuffer >= 8 && byteIndex < byteLength) {
      bitsInBuffer -= 8;
      result[byteIndex++] = (bitBuffer >> bitsInBuffer) & 0xff;
    }
  }

  return result;
}

// Base32hex decoding (RFC 4648 extended hex alphabet)
// Alphabet: 0123456789abcdefghijklmnopqrstuv
const BASE32HEX_ALPHABET = '0123456789abcdefghijklmnopqrstuv';
const BASE32HEX_MAP = new Map<string, number>();
for (let i = 0; i < BASE32HEX_ALPHABET.length; i++) {
  BASE32HEX_MAP.set(BASE32HEX_ALPHABET[i], i);
}

export function decodeBase32Hex(input: string): Uint8Array | null {
  const lower = input.toLowerCase();
  const values: number[] = [];
  for (const ch of lower) {
    const val = BASE32HEX_MAP.get(ch);
    if (val === undefined) return null;
    values.push(val);
  }

  const totalBits = values.length * 5;
  const byteLength = Math.floor(totalBits / 8);
  const result = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (const val of values) {
    bitBuffer = (bitBuffer << 5) | val;
    bitsInBuffer += 5;

    while (bitsInBuffer >= 8 && byteIndex < byteLength) {
      bitsInBuffer -= 8;
      result[byteIndex++] = (bitBuffer >> bitsInBuffer) & 0xff;
    }
  }

  return result;
}
