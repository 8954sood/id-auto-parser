import type { ParseResult, IdType, UuidDetails } from '@/types';
import { hexToBytes } from '../utils/hex';
import { uuidTimestampToMs, isReasonableDateMs } from '../utils/time';

const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function formatCanonical(hex32: string): string {
  const h = hex32.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function parseUuid(
  input: string,
  normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult[] {
  let hex32: string;

  if (bytes && bytes.length === 16) {
    hex32 = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    if (!UUID_REGEX.test(input)) {
      return [];
    }
    hex32 = normalizedInput.replace(/-/g, '').toLowerCase();
    if (hex32.length !== 32) return [];
  }

  const uuidBytes = bytes ?? hexToBytes(hex32);
  const canonical = formatCanonical(hex32);

  // Check nil
  if (hex32 === '00000000000000000000000000000000') {
    return [makeResult('uuid_nil', 1.0, uuidBytes, canonical, {
      version: 0,
      variant: 'nil',
      is_nil: true,
      is_max: false,
    })];
  }

  // Check max
  if (hex32 === 'ffffffffffffffffffffffffffffffff') {
    return [makeResult('uuid_max', 1.0, uuidBytes, canonical, {
      version: 0,
      variant: 'max',
      is_nil: false,
      is_max: true,
    })];
  }

  // Extract version and variant
  const versionNibble = (uuidBytes[6] >> 4) & 0x0f;
  const variantByte = uuidBytes[8];

  let variant: string;
  if ((variantByte & 0x80) === 0) {
    variant = 'NCS';
  } else if ((variantByte & 0xc0) === 0x80) {
    variant = 'RFC4122';
  } else if ((variantByte & 0xe0) === 0xc0) {
    variant = 'Microsoft';
  } else {
    variant = 'Future';
  }

  const results: ParseResult[] = [];

  const baseDetails: UuidDetails = {
    version: versionNibble,
    variant,
    is_nil: false,
    is_max: false,
  };

  if (variant !== 'RFC4122') {
    // Still might be valid but with low score
    if (versionNibble >= 1 && versionNibble <= 7) {
      const idType = `uuid_v${versionNibble}` as IdType;
      results.push(makeResult(idType, 0.3, uuidBytes, canonical, baseDetails));
    }
    return results;
  }

  switch (versionNibble) {
    case 1: {
      const ts = extractV1Timestamp(uuidBytes);
      const tsMs = ts !== null ? uuidTimestampToMs(ts) : null;
      const reasonable = tsMs !== null && isReasonableDateMs(tsMs);
      results.push(makeResult('uuid_v1', reasonable ? 0.95 : 0.85, uuidBytes, canonical, {
        ...baseDetails,
        ...(tsMs !== null ? { timestamp: new Date(tsMs).toISOString(), timestamp_ms: tsMs } : {}),
      }));
      break;
    }
    case 3:
      results.push(makeResult('uuid_v3', 0.85, uuidBytes, canonical, baseDetails));
      break;
    case 4:
      results.push(makeResult('uuid_v4', 0.95, uuidBytes, canonical, baseDetails));
      break;
    case 5:
      results.push(makeResult('uuid_v5', 0.85, uuidBytes, canonical, baseDetails));
      break;
    case 6: {
      const ts = extractV6Timestamp(uuidBytes);
      const tsMs = ts !== null ? uuidTimestampToMs(ts) : null;
      const reasonable = tsMs !== null && isReasonableDateMs(tsMs);
      results.push(makeResult('uuid_v6', reasonable ? 0.95 : 0.85, uuidBytes, canonical, {
        ...baseDetails,
        ...(tsMs !== null ? { timestamp: new Date(tsMs).toISOString(), timestamp_ms: tsMs } : {}),
      }));
      break;
    }
    case 7: {
      const tsMs = extractV7Timestamp(uuidBytes);
      const reasonable = tsMs !== null && isReasonableDateMs(tsMs);
      results.push(makeResult('uuid_v7', reasonable ? 0.95 : 0.85, uuidBytes, canonical, {
        ...baseDetails,
        ...(tsMs !== null ? { timestamp: new Date(tsMs).toISOString(), timestamp_ms: tsMs } : {}),
      }));
      break;
    }
    default:
      // Unknown version
      break;
  }

  return results;
}

function makeResult(
  type: IdType,
  score: number,
  _bytes: Uint8Array,
  canonical: string,
  details: UuidDetails,
): ParseResult {
  const evidence: string[] = [`UUID version ${details.version}`, `variant: ${details.variant}`];
  if (details.timestamp) evidence.push(`timestamp: ${details.timestamp}`);
  if (details.is_nil) evidence.push('all zeros (nil UUID)');
  if (details.is_max) evidence.push('all ones (max UUID)');

  return {
    ok: true,
    score,
    type,
    evidence,
    type_specific: details,
    canonical,
    bit_length: 128,
    sortable: type === 'uuid_v6' || type === 'uuid_v7' ? true : type === 'uuid_v1' ? 'partial' : false,
    timestamp: details.timestamp ?? null,
  };
}

function extractV1Timestamp(bytes: Uint8Array): bigint | null {
  // time_low (4 bytes) at offset 0-3
  // time_mid (2 bytes) at offset 4-5
  // time_hi_and_version (2 bytes) at offset 6-7, version in top 4 bits
  const timeLow = BigInt(bytes[0]) << 24n | BigInt(bytes[1]) << 16n | BigInt(bytes[2]) << 8n | BigInt(bytes[3]);
  const timeMid = BigInt(bytes[4]) << 8n | BigInt(bytes[5]);
  const timeHi = BigInt(bytes[6] & 0x0f) << 8n | BigInt(bytes[7]);
  return (timeHi << 48n) | (timeMid << 32n) | timeLow;
}

function extractV6Timestamp(bytes: Uint8Array): bigint | null {
  // V6: time is stored in order: high(32) mid(16) low(12)
  const timeHigh = BigInt(bytes[0]) << 24n | BigInt(bytes[1]) << 16n | BigInt(bytes[2]) << 8n | BigInt(bytes[3]);
  const timeMid = BigInt(bytes[4]) << 8n | BigInt(bytes[5]);
  const timeLow = BigInt(bytes[6] & 0x0f) << 8n | BigInt(bytes[7]);
  return (timeHigh << 28n) | (timeMid << 12n) | timeLow;
}

function extractV7Timestamp(bytes: Uint8Array): number | null {
  // V7: first 48 bits are Unix timestamp in milliseconds
  const ms = (bytes[0] * 2 ** 40) +
    (bytes[1] * 2 ** 32) +
    (bytes[2] * 2 ** 24) +
    (bytes[3] * 2 ** 16) +
    (bytes[4] * 2 ** 8) +
    bytes[5];
  return ms;
}
