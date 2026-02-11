import type { CandidateResult, Confidence, IdType } from '@/types';
import type { ParseResult } from '@/types';

export interface ScoringResult {
  detectedType: IdType | 'unknown' | 'ambiguous';
  confidence: Confidence | 'ambiguous' | 'unknown';
  candidates: CandidateResult[];
  bestResult?: ParseResult;
}

export function scoreCandidates(results: ParseResult[]): ScoringResult {
  const successful = results.filter((r) => r.ok && r.score > 0);
  const candidates: CandidateResult[] = results.map((r) => ({
    type: r.type,
    ok: r.ok,
    score: r.score,
    evidence: r.evidence,
  }));

  // Sort by score descending
  successful.sort((a, b) => b.score - a.score);

  if (successful.length === 0) {
    return {
      detectedType: 'unknown',
      confidence: 'unknown',
      candidates,
    };
  }

  const first = successful[0];
  const second = successful.length > 1 ? successful[1] : null;
  const scoreDiff = second ? first.score - second.score : 1;

  // Ambiguous: top 2 within 0.1 of each other and both >= 0.5
  if (second && scoreDiff <= 0.1 && first.score >= 0.5 && second.score >= 0.5) {
    return {
      detectedType: 'ambiguous',
      confidence: 'ambiguous',
      candidates,
      bestResult: first,
    };
  }

  // High confidence: score >= 0.8 and gap >= 0.2
  if (first.score >= 0.8 && scoreDiff >= 0.2) {
    return {
      detectedType: first.type,
      confidence: 'high',
      candidates,
      bestResult: first,
    };
  }

  // Medium confidence: score >= 0.6 and gap >= 0.15
  if (first.score >= 0.6 && scoreDiff >= 0.15) {
    return {
      detectedType: first.type,
      confidence: 'medium',
      candidates,
      bestResult: first,
    };
  }

  // Low confidence
  if (first.score >= 0.3) {
    return {
      detectedType: first.type,
      confidence: 'low',
      candidates,
      bestResult: first,
    };
  }

  return {
    detectedType: 'unknown',
    confidence: 'unknown',
    candidates,
  };
}
