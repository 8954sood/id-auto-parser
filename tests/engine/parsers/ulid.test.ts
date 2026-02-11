import { describe, it, expect } from 'vitest';
import { parseUlid } from '@/engine/parsers/ulid';

describe('parseUlid', () => {
  it('detects standard ULID', () => {
    const result = parseUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV', '01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('ulid');
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('rejects wrong length', () => {
    const result = parseUlid('01ARZ3NDEK', '01ARZ3NDEK');
    expect(result.ok).toBe(false);
  });

  it('rejects invalid characters', () => {
    const result = parseUlid('01ARZ3NDEKTSV4RRFFQ69G5FA!', '01ARZ3NDEKTSV4RRFFQ69G5FA!');
    expect(result.ok).toBe(false);
  });

  it('rejects overflow (first char > 7)', () => {
    const result = parseUlid('Z1ARZ3NDEKTSV4RRFFQ69G5FAV', 'Z1ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.ok).toBe(false);
  });
});
