import { describe, it, expect } from 'vitest';
import { scoreCandidates } from '@/engine/scorer';
import type { ParseResult } from '@/types';

describe('scoreCandidates', () => {
  it('returns high confidence for strong single result', () => {
    const results: ParseResult[] = [
      { ok: true, score: 0.95, type: 'uuid_v4', evidence: [] },
      { ok: true, score: 0.3, type: 'nanoid', evidence: [] },
    ];
    const scoring = scoreCandidates(results);
    expect(scoring.detectedType).toBe('uuid_v4');
    expect(scoring.confidence).toBe('high');
  });

  it('returns medium confidence for moderate gap', () => {
    const results: ParseResult[] = [
      { ok: true, score: 0.7, type: 'objectid', evidence: [] },
      { ok: true, score: 0.5, type: 'cuid2', evidence: [] },
    ];
    const scoring = scoreCandidates(results);
    expect(scoring.detectedType).toBe('objectid');
    expect(scoring.confidence).toBe('medium');
  });

  it('returns ambiguous for close scores', () => {
    const results: ParseResult[] = [
      { ok: true, score: 0.7, type: 'snowflake', evidence: [] },
      { ok: true, score: 0.65, type: 'tsid', evidence: [] },
    ];
    const scoring = scoreCandidates(results);
    expect(scoring.detectedType).toBe('ambiguous');
    expect(scoring.confidence).toBe('ambiguous');
  });

  it('returns unknown for all failures', () => {
    const results: ParseResult[] = [
      { ok: false, score: 0, type: 'uuid_v4', evidence: [] },
      { ok: false, score: 0, type: 'ulid', evidence: [] },
    ];
    const scoring = scoreCandidates(results);
    expect(scoring.detectedType).toBe('unknown');
    expect(scoring.confidence).toBe('unknown');
  });
});
