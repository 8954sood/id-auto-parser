import { describe, it, expect } from 'vitest';
import { parseXid } from '@/engine/parsers/xid';

describe('parseXid', () => {
  it('detects standard XID', () => {
    const result = parseXid('9m4e2mr0ui3e8a215n4g', '9m4e2mr0ui3e8a215n4g');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('xid');
    expect(result.timestamp).toBeTruthy();
  });

  it('rejects wrong length', () => {
    const result = parseXid('9m4e2mr0ui3e8a215n', '9m4e2mr0ui3e8a215n');
    expect(result.ok).toBe(false);
  });

  it('rejects invalid characters', () => {
    const result = parseXid('9m4e2mr0ui3e8a215nXX', '9m4e2mr0ui3e8a215nXX');
    expect(result.ok).toBe(false);
  });
});
