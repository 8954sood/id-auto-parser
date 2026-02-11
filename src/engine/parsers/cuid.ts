import type { ParseResult, CuidDetails } from '@/types';
import { isBase36 } from '../utils/charset';

export function parseCuid(
  input: string,
  _normalizedInput: string,
): ParseResult {
  const trimmed = input.trim();

  // CUID v1: 25 chars, starts with 'c', base36
  if (trimmed.length !== 25) {
    return { ok: false, score: 0, type: 'cuid', evidence: ['length is not 25'] };
  }

  if (trimmed[0] !== 'c') {
    return { ok: false, score: 0, type: 'cuid', evidence: ['does not start with "c"'] };
  }

  if (!isBase36(trimmed)) {
    return { ok: false, score: 0, type: 'cuid', evidence: ['not valid base36'] };
  }

  // CUID structure: c + timestamp(8) + counter(4) + fingerprint(4) + random(8)
  const details: CuidDetails = {
    prefix: 'c',
  };

  return {
    ok: true,
    score: 0.85,
    type: 'cuid',
    evidence: [
      '25 chars',
      'starts with "c"',
      'all base36 characters',
    ],
    type_specific: details,
    canonical: trimmed,
    bit_length: 128,
    sortable: 'partial',
    timestamp: null,
  };
}
