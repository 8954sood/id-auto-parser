import { describe, it, expect } from 'vitest';
import { parseObjectId } from '@/engine/parsers/objectid';

describe('parseObjectId', () => {
  it('detects standard ObjectId', () => {
    const result = parseObjectId('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439011');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('objectid');
    expect(result.timestamp).toBeTruthy();
  });

  it('detects recent ObjectId', () => {
    const result = parseObjectId('65a1b2c3d4e5f6a7b8c9d0e1', '65a1b2c3d4e5f6a7b8c9d0e1');
    expect(result.ok).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it('rejects wrong length', () => {
    const result = parseObjectId('507f1f77bcf86cd7994390', '507f1f77bcf86cd7994390');
    expect(result.ok).toBe(false);
  });
});
