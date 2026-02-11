import type { ParseResult, TypeIdDetails } from '@/types';
import { decodeCrockfordBase32 } from '../utils/base32';
import { bytesToHex } from '../utils/hex';
import { isReasonableDateMs } from '../utils/time';

const TYPEID_REGEX = /^([a-z][a-z0-9_]*[a-z0-9])?_?([0-9a-hjkmnp-tv-z]{26})$/i;

export function parseTypeId(
  input: string,
  _normalizedInput: string,
): ParseResult {
  const trimmed = input.trim();
  const match = trimmed.match(TYPEID_REGEX);

  if (!match) {
    return { ok: false, score: 0, type: 'typeid', evidence: ['does not match TypeID pattern'] };
  }

  const prefix = match[1] || '';
  const suffix = match[2];

  if (!prefix && !trimmed.includes('_')) {
    // Without prefix, it's ambiguous — could be a plain ULID
    return { ok: false, score: 0, type: 'typeid', evidence: ['no prefix found, could be ULID'] };
  }

  // Decode suffix as Crockford Base32 → 16 bytes (UUID)
  const bytes = decodeCrockfordBase32(suffix);
  if (!bytes || bytes.length < 16) {
    return { ok: false, score: 0, type: 'typeid', evidence: ['failed to decode suffix as Base32'] };
  }

  const uuidBytes = bytes.slice(0, 16);
  const hex32 = bytesToHex(uuidBytes);
  const canonical = `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20)}`;

  // Check if underlying UUID is v7
  const version = (uuidBytes[6] >> 4) & 0x0f;
  const variantByte = uuidBytes[8];
  const isRfc4122 = (variantByte & 0xc0) === 0x80;
  const variant = isRfc4122 ? 'RFC4122' : 'other';

  let timestamp: string | undefined;
  let timestampMs: number | undefined;
  let score = 0.8;

  if (version === 7 && isRfc4122) {
    // UUIDv7 timestamp
    const ms =
      uuidBytes[0] * 2 ** 40 +
      uuidBytes[1] * 2 ** 32 +
      uuidBytes[2] * 2 ** 24 +
      uuidBytes[3] * 2 ** 16 +
      uuidBytes[4] * 2 ** 8 +
      uuidBytes[5];
    if (isReasonableDateMs(ms)) {
      timestamp = new Date(ms).toISOString();
      timestampMs = ms;
      score = 0.95;
    }
  }

  const details: TypeIdDetails = {
    prefix,
    suffix,
    uuid_version: version,
    uuid_variant: variant,
    ...(timestamp ? { timestamp, timestamp_ms: timestampMs } : {}),
  };

  return {
    ok: true,
    score,
    type: 'typeid',
    evidence: [
      `prefix: "${prefix}"`,
      `suffix: ${suffix}`,
      `underlying UUID version: ${version}`,
      ...(timestamp ? [`timestamp: ${timestamp}`] : []),
    ],
    type_specific: details,
    canonical: `${prefix}_${canonical}`,
    bit_length: 128,
    sortable: version === 7,
    timestamp: timestamp ?? null,
  };
}
