import type { ParseResult, KsuidDetails } from '@/types';
import { isBase62 } from '../utils/charset';
import { decodeBase62ToBytes } from '../utils/base62';
import { ksuidTimestampToDate, isReasonableDate } from '../utils/time';

export function parseKsuid(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  let ksuidBytes: Uint8Array;

  if (bytes && bytes.length === 20) {
    ksuidBytes = bytes;
  } else {
    const trimmed = input.trim();
    if (trimmed.length !== 27 || !isBase62(trimmed)) {
      return { ok: false, score: 0, type: 'ksuid', evidence: ['not 27 base62 chars'] };
    }
    const decoded = decodeBase62ToBytes(trimmed);
    if (!decoded || decoded.length > 20) {
      return { ok: false, score: 0, type: 'ksuid', evidence: ['base62 decoding failed or wrong length'] };
    }
    // Pad to 20 bytes (left-pad with zeros)
    ksuidBytes = new Uint8Array(20);
    ksuidBytes.set(decoded, 20 - decoded.length);
  }

  // First 4 bytes: KSUID timestamp (seconds since 2014-05-13T16:53:20Z)
  const ts =
    ((ksuidBytes[0] << 24) | (ksuidBytes[1] << 16) | (ksuidBytes[2] << 8) | ksuidBytes[3]) >>> 0;
  const date = ksuidTimestampToDate(ts);
  const reasonable = isReasonableDate(date);

  const details: KsuidDetails = {
    timestamp: date.toISOString(),
    timestamp_s: ts,
    payload_bits: 128,
  };

  return {
    ok: true,
    score: reasonable ? 0.95 : 0.5,
    type: 'ksuid',
    evidence: [
      '27 base62 chars / 20 bytes',
      `timestamp: ${details.timestamp}`,
      reasonable ? 'reasonable date (KSUID epoch)' : 'unreasonable date',
      '128-bit payload',
    ],
    type_specific: details,
    canonical: input.trim(),
    bit_length: 160,
    sortable: true,
    timestamp: details.timestamp,
  };
}
