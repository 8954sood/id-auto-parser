import type { ParseResult, TsidDetails } from '@/types';
import { isDecimal, isCrockfordBase32 } from '../utils/charset';
import { decodeCrockfordBase32ToBigInt } from '../utils/base32';
import { tsidTimestampToDate, isReasonableDate } from '../utils/time';
import { bytesToBigInt } from '../utils/hex';

export function parseTsid(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  let value: bigint;

  if (bytes && bytes.length === 8) {
    value = bytesToBigInt(bytes);
  } else {
    const trimmed = input.trim();

    if (trimmed.length === 13 && isCrockfordBase32(trimmed)) {
      // 13 chars Crockford Base32
      const decoded = decodeCrockfordBase32ToBigInt(trimmed);
      if (decoded === null) {
        return { ok: false, score: 0, type: 'tsid', evidence: ['Base32 decoding failed'] };
      }
      value = decoded;
    } else if (trimmed.length >= 17 && trimmed.length <= 18 && isDecimal(trimmed)) {
      // Decimal representation
      try {
        value = BigInt(trimmed);
      } catch {
        return { ok: false, score: 0, type: 'tsid', evidence: ['failed to parse as BigInt'] };
      }
    } else {
      return { ok: false, score: 0, type: 'tsid', evidence: ['not 13 Crockford Base32 or 17-18 decimal digits'] };
    }
  }

  // TSID: upper 42 bits = timestamp (ms since 2020-01-01), lower 22 bits = random
  const timestampMs = value >> 22n;
  const randomBits = Number(value & 0x3fffffn);
  const date = tsidTimestampToDate(timestampMs);
  const reasonable = isReasonableDate(date);

  const details: TsidDetails = {
    timestamp_ms: Number(timestampMs),
    timestamp_iso: date.toISOString(),
    random_bits: randomBits,
  };

  return {
    ok: true,
    score: reasonable ? 0.85 : 0.4,
    type: 'tsid',
    evidence: [
      '64-bit TSID',
      `timestamp: ${details.timestamp_iso}`,
      reasonable ? 'reasonable date (2020 epoch)' : 'unreasonable date',
      `random bits: ${randomBits}`,
    ],
    type_specific: details,
    canonical: value.toString(),
    bit_length: 64,
    sortable: true,
    timestamp: details.timestamp_iso,
  };
}
