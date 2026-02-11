import type { IdType, Confidence, Charset, TypeSpecificDetails } from './id-types';

export type { IdType, Confidence, Charset, TypeSpecificDetails };
export * from './id-types';

export interface CandidateResult {
  type: IdType;
  ok: boolean;
  score: number;
  reason?: string;
  evidence?: string[];
}

export interface Summary {
  valid: boolean;
  detected_type: IdType | 'unknown' | 'ambiguous';
  confidence: Confidence | 'ambiguous' | 'unknown';
  bit_length: number | null;
  sortable: boolean | 'partial' | null;
  timestamp: string | null;
  canonical: string | null;
}

export interface Details {
  length: number;
  bit_length: number | null;
  byte_length: number | null;
  charset: Charset;
  encoding_detected: Charset;
  decoded_from_base64: boolean;
  separators: string[];
  normalized_input: string;
  notes: string[];
  type_specific?: TypeSpecificDetails;
}

export interface InspectError {
  code: 'EMPTY' | 'TOO_LONG' | 'UNKNOWN' | 'INVALID' | 'AMBIGUOUS';
  message: string;
  hint?: string;
}

export interface InspectResponse {
  input: string;
  normalized_input: string;
  detected_type: IdType | 'unknown' | 'ambiguous';
  confidence: Confidence | 'ambiguous' | 'unknown';
  valid: boolean;
  candidates: CandidateResult[];
  summary: Summary;
  details: Details;
  error?: InspectError;
}

export interface ParseResult {
  ok: boolean;
  score: number;
  type: IdType;
  evidence: string[];
  type_specific?: TypeSpecificDetails;
  canonical?: string;
  bit_length?: number;
  sortable?: boolean | 'partial';
  timestamp?: string | null;
}

export type ParserFn = (
  input: string,
  normalizedInput: string,
  bytes?: Uint8Array,
) => ParseResult;

export type DecodingType = 'base64' | 'hex' | 'base32' | 'base32std' | 'base32hex' | 'base58' | 'base62';

export interface DecodedEntry {
  encoding: DecodingType;
  decoded_bytes: Uint8Array;
  decoded_text: string | null;
  hex_string: string;
  byte_length: number;
  bit_length: number;
}

export interface DecodeResult {
  input: string;
  entries: DecodedEntry[];
  error?: string;
}
