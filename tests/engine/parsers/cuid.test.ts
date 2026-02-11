import { describe, it, expect } from 'vitest';
import { parseCuid } from '@/engine/parsers/cuid';

describe('parseCuid', () => {
  it('detects CUID v1', () => {
    const result = parseCuid('cjld2cyuq0000t3rmniod1foy', 'cjld2cyuq0000t3rmniod1foy');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('cuid');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('rejects wrong prefix', () => {
    const result = parseCuid('ajld2cyuq0000t3rmniod1foy', 'ajld2cyuq0000t3rmniod1foy');
    expect(result.ok).toBe(false);
  });

  it('rejects wrong length', () => {
    const result = parseCuid('cjld2cyuq0000t3rmnio', 'cjld2cyuq0000t3rmnio');
    expect(result.ok).toBe(false);
  });
});
