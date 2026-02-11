import type { ParseResult, XidDetails } from '@/types';
import { isBase32Hex } from '../utils/charset';
import { decodeBase32Hex } from '../utils/base32';
import { isReasonableDate } from '../utils/time';

export function parseXid(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  let xidBytes: Uint8Array;

  if (bytes && bytes.length === 12) {
    xidBytes = bytes;
  } else {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length !== 20 || !isBase32Hex(trimmed)) {
      return { ok: false, score: 0, type: 'xid', evidence: ['not 20 base32hex chars'] };
    }
    const decoded = decodeBase32Hex(trimmed);
    if (!decoded || decoded.length < 12) {
      return { ok: false, score: 0, type: 'xid', evidence: ['base32hex decoding failed'] };
    }
    xidBytes = decoded.slice(0, 12);
  }

  // First 4 bytes: Unix timestamp (seconds)
  const ts =
    ((xidBytes[0] << 24) | (xidBytes[1] << 16) | (xidBytes[2] << 8) | xidBytes[3]) >>> 0;
  const date = new Date(ts * 1000);
  const reasonable = isReasonableDate(date);

  // Bytes 4-6: machine ID
  const machineId = Array.from(xidBytes.slice(4, 7))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Bytes 7-8: process ID
  const processId = (xidBytes[7] << 8) | xidBytes[8];

  // Bytes 9-11: counter (3 bytes, big endian)
  const counter = (xidBytes[9] << 16) | (xidBytes[10] << 8) | xidBytes[11];

  const details: XidDetails = {
    timestamp: date.toISOString(),
    timestamp_s: ts,
    machine_id: machineId,
    process_id: processId,
    counter,
  };

  return {
    ok: true,
    score: reasonable ? 0.9 : 0.5,
    type: 'xid',
    evidence: [
      '20 base32hex chars / 12 bytes',
      `timestamp: ${details.timestamp}`,
      reasonable ? 'reasonable date' : 'unreasonable date',
      `counter: ${counter}`,
    ],
    type_specific: details,
    canonical: input.trim().toLowerCase(),
    bit_length: 96,
    sortable: true,
    timestamp: details.timestamp,
  };
}
