import type { IdType } from '@/types';

const BASE64_STANDARD_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const BASE64_URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;

export interface Base64DecodeResult {
  decoded: Uint8Array;
  candidates: IdType[];
  /** true when base64 decoded successfully but byte length doesn't match any known ID format */
  unmatchedByteLength: boolean;
}

export function tryBase64Decode(input: string): Base64DecodeResult | null {
  if (input.length < 4) return null;
  if (!BASE64_STANDARD_RE.test(input) && !BASE64_URL_RE.test(input)) return null;

  try {
    // Normalize URL-safe to standard base64
    const standard = input.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
    const binaryStr = atob(padded);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const candidates = byteLengthToCandidates(bytes.length);

    return { decoded: bytes, candidates, unmatchedByteLength: candidates.length === 0 };
  } catch {
    return null;
  }
}

function byteLengthToCandidates(byteLen: number): IdType[] {
  switch (byteLen) {
    case 8:
      return ['snowflake', 'tsid'];
    case 12:
      return ['objectid', 'xid'];
    case 16:
      return ['uuid_v1', 'uuid_v3', 'uuid_v4', 'uuid_v5', 'uuid_v6', 'uuid_v7', 'uuid_nil', 'uuid_max', 'ulid'];
    case 20:
      return ['ksuid'];
    default:
      return [];
  }
}
