import type { ParseResult, UlidDetails } from '@/types';
import { isCrockfordBase32 } from '../utils/charset';
import { decodeCrockfordBase32ToBigInt } from '../utils/base32';
import { isReasonableDateMs } from '../utils/time';

export function parseUlid(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  // From bytes (base64 decoded, 16 bytes)
  if (bytes && bytes.length === 16) {
    // Extract 48-bit timestamp from first 6 bytes
    const tsMs =
      bytes[0] * 2 ** 40 +
      bytes[1] * 2 ** 32 +
      bytes[2] * 2 ** 24 +
      bytes[3] * 2 ** 16 +
      bytes[4] * 2 ** 8 +
      bytes[5];
    const reasonable = isReasonableDateMs(tsMs);

    const details: UlidDetails = {
      time_ms: tsMs,
      time_iso: new Date(tsMs).toISOString(),
      randomness_bits: 80,
    };

    return {
      ok: true,
      score: reasonable ? 0.6 : 0.3, // Lower score from bytes since we can't be sure it's ULID vs UUID
      type: 'ulid',
      evidence: [
        '16 bytes decoded from base64',
        `timestamp: ${details.time_iso}`,
        reasonable ? 'reasonable date' : 'unreasonable date',
      ],
      type_specific: details,
      canonical: undefined,
      bit_length: 128,
      sortable: true,
      timestamp: details.time_iso,
    };
  }

  const trimmed = input.trim();

  // ULID: exactly 26 chars Crockford Base32
  if (trimmed.length !== 26) {
    return { ok: false, score: 0, type: 'ulid', evidence: ['length is not 26'] };
  }

  if (!isCrockfordBase32(trimmed)) {
    return { ok: false, score: 0, type: 'ulid', evidence: ['not valid Crockford Base32'] };
  }

  // First character must be 0-7 (to fit in 128 bits)
  const firstChar = trimmed[0].toUpperCase();
  const firstVal = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'.indexOf(firstChar);
  if (firstVal > 7) {
    return { ok: false, score: 0, type: 'ulid', evidence: ['first character exceeds 7 (overflow)'] };
  }

  // Decode timestamp (first 10 chars = 50 bits, but only 48 used)
  const timeChars = trimmed.substring(0, 10);
  const timeValue = decodeCrockfordBase32ToBigInt(timeChars);
  if (timeValue === null) {
    return { ok: false, score: 0, type: 'ulid', evidence: ['failed to decode timestamp portion'] };
  }

  const tsMs = Number(timeValue);
  const reasonable = isReasonableDateMs(tsMs);

  const details: UlidDetails = {
    time_ms: tsMs,
    time_iso: new Date(tsMs).toISOString(),
    randomness_bits: 80,
  };

  return {
    ok: true,
    score: reasonable ? 0.95 : 0.7,
    type: 'ulid',
    evidence: [
      '26-char Crockford Base32',
      `timestamp: ${details.time_iso}`,
      reasonable ? 'reasonable date' : 'unreasonable date',
    ],
    type_specific: details,
    canonical: trimmed.toUpperCase(),
    bit_length: 128,
    sortable: true,
    timestamp: details.time_iso,
  };
}
