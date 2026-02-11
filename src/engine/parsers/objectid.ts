import type { ParseResult, ObjectIdDetails } from '@/types';
import { isHex } from '../utils/charset';
import { hexToBytes } from '../utils/hex';
import { isReasonableDate } from '../utils/time';

export function parseObjectId(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  let objectIdBytes: Uint8Array;

  if (bytes && bytes.length === 12) {
    objectIdBytes = bytes;
  } else {
    const trimmed = input.trim();
    if (trimmed.length !== 24 || !isHex(trimmed)) {
      return { ok: false, score: 0, type: 'objectid', evidence: ['not 24 hex chars'] };
    }
    objectIdBytes = hexToBytes(trimmed);
  }

  // First 4 bytes: Unix timestamp
  const timestampS =
    (objectIdBytes[0] << 24) |
    (objectIdBytes[1] << 16) |
    (objectIdBytes[2] << 8) |
    objectIdBytes[3];
  // Treat as unsigned
  const ts = timestampS >>> 0;
  const date = new Date(ts * 1000);
  const reasonable = isReasonableDate(date);

  // Bytes 4-6: machine identifier (or random in newer versions)
  const machineId = Array.from(objectIdBytes.slice(4, 7))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Bytes 7-8: process identifier
  const processId = (objectIdBytes[7] << 8) | objectIdBytes[8];

  // Bytes 9-11: counter
  const counter = (objectIdBytes[9] << 16) | (objectIdBytes[10] << 8) | objectIdBytes[11];

  const details: ObjectIdDetails = {
    timestamp: date.toISOString(),
    timestamp_s: ts,
    machine_identifier: machineId,
    process_identifier: processId,
    counter,
  };

  return {
    ok: true,
    score: reasonable ? 0.9 : 0.5,
    type: 'objectid',
    evidence: [
      '24 hex chars / 12 bytes',
      `timestamp: ${details.timestamp}`,
      reasonable ? 'reasonable date' : 'unreasonable date',
      `counter: ${counter}`,
    ],
    type_specific: details,
    canonical: Array.from(objectIdBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    bit_length: 96,
    sortable: 'partial',
    timestamp: details.timestamp,
  };
}
