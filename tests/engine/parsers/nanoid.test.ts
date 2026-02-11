import { describe, it, expect } from 'vitest';
import { parseNanoid } from '@/engine/parsers/nanoid';

describe('parseNanoid', () => {
  it('detects NanoID with special chars', () => {
    const result = parseNanoid('V1StGXR8_Z5jdHi6B-myT', 'V1StGXR8_Z5jdHi6B-myT');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('nanoid');
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('rejects wrong length', () => {
    const result = parseNanoid('V1StGXR8_Z5jdHi6B', 'V1StGXR8_Z5jdHi6B');
    expect(result.ok).toBe(false);
  });
});
