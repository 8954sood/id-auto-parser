import type { ParseResult, Cuid2Details } from '@/types';
import { isBase36 } from '../utils/charset';

export function parseCuid2(
  input: string,
  _normalizedInput: string,
): ParseResult {
  const trimmed = input.trim();

  // CUID2: default 24 chars, range 21-32, starts with [a-z], all lowercase base36
  if (trimmed.length < 21 || trimmed.length > 32) {
    return { ok: false, score: 0, type: 'cuid2', evidence: ['length not in range 21-32'] };
  }

  if (!/^[a-z]/.test(trimmed)) {
    return { ok: false, score: 0, type: 'cuid2', evidence: ['does not start with lowercase letter'] };
  }

  // CUID2 is all lowercase
  if (trimmed !== trimmed.toLowerCase()) {
    return { ok: false, score: 0, type: 'cuid2', evidence: ['contains uppercase characters'] };
  }

  if (!isBase36(trimmed)) {
    return { ok: false, score: 0, type: 'cuid2', evidence: ['not valid base36'] };
  }

  // CUID2 is purely random (hash-based), no embedded timestamp
  // Heuristic: starts with a-z and all lowercase base36
  // Differentiate from CUID v1: CUID v1 is always 25 chars starting with 'c'
  let score = 0.7;

  // Default length is 24
  if (trimmed.length === 24) {
    score = 0.8;
  }

  // If it's 25 chars and starts with 'c', it's more likely CUID v1
  if (trimmed.length === 25 && trimmed[0] === 'c') {
    score = 0.5; // Lower score, likely CUID v1
  }

  const details: Cuid2Details = {
    length: trimmed.length,
  };

  return {
    ok: true,
    score,
    type: 'cuid2',
    evidence: [
      `${trimmed.length} chars`,
      'starts with lowercase letter',
      'all lowercase base36',
      'no embedded structure (hash-based)',
    ],
    type_specific: details,
    canonical: trimmed,
    bit_length: Math.floor(trimmed.length * Math.log2(36)),
    sortable: false,
    timestamp: null,
  };
}
