import type { ParseResult, NanoidDetails } from '@/types';

// NanoID default: 21 chars from alphabet [A-Za-z0-9_-]
const NANOID_REGEX = /^[A-Za-z0-9_-]+$/;

export function parseNanoid(
  input: string,
  _normalizedInput: string,
): ParseResult {
  const trimmed = input.trim();

  // Default NanoID is 21 chars
  if (trimmed.length !== 21) {
    return { ok: false, score: 0, type: 'nanoid', evidence: ['length is not 21'] };
  }

  if (!NANOID_REGEX.test(trimmed)) {
    return { ok: false, score: 0, type: 'nanoid', evidence: ['contains invalid characters'] };
  }

  // NanoID has no structure — purely random
  // Score is heuristic-based
  const hasUnderscore = trimmed.includes('_');
  const hasDash = trimmed.includes('-');
  const hasUpperAndLower = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed);
  const hasDigit = /[0-9]/.test(trimmed);

  // URL-safe alphabet indicators (having _ or - makes it more likely NanoID)
  let score = 0.6;
  if (hasUnderscore || hasDash) {
    score = 0.8; // Strong indicator of URL-safe alphabet (NanoID default)
  }
  if (hasUpperAndLower && hasDigit) {
    score = Math.max(score, 0.7);
  }

  const alphabetSize = 64; // [A-Za-z0-9_-]
  const entropyBits = Math.floor(trimmed.length * Math.log2(alphabetSize));

  const details: NanoidDetails = {
    alphabet_type: 'url-safe (A-Za-z0-9_-)',
    estimated_entropy_bits: entropyBits,
  };

  return {
    ok: true,
    score,
    type: 'nanoid',
    evidence: [
      '21 chars',
      'URL-safe alphabet',
      `estimated entropy: ${entropyBits} bits`,
      'no embedded structure (heuristic match)',
    ],
    type_specific: details,
    canonical: trimmed,
    bit_length: entropyBits,
    sortable: false,
    timestamp: null,
  };
}
