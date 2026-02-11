import { describe, it, expect } from 'vitest';
import { parseTsid } from '@/engine/parsers/tsid';

describe('parseTsid', () => {
  it('detects TSID in Crockford Base32', () => {
    const result = parseTsid('0HZFRCNG6AP1Q', '0HZFRCNG6AP1Q');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('tsid');
    expect(result.timestamp).toBeTruthy();
  });

  it('rejects wrong format', () => {
    const result = parseTsid('hello', 'hello');
    expect(result.ok).toBe(false);
  });
});
