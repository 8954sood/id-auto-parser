import { describe, it, expect } from 'vitest';
import { parseTypeId } from '@/engine/parsers/typeid';

describe('parseTypeId', () => {
  it('detects TypeID with prefix', () => {
    const result = parseTypeId('user_2x4y6z8a0b1c2d3e4f5g6h7j8k', 'user_2x4y6z8a0b1c2d3e4f5g6h7j8k');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('typeid');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('rejects without prefix', () => {
    const result = parseTypeId('2x4y6z8a0b1c2d3e4f5g6h7j8k', '2x4y6z8a0b1c2d3e4f5g6h7j8k');
    expect(result.ok).toBe(false);
  });
});
