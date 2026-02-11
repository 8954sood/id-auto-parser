import { describe, it, expect } from 'vitest';
import { parseKsuid } from '@/engine/parsers/ksuid';

describe('parseKsuid', () => {
  it('detects standard KSUID', () => {
    const result = parseKsuid('0ujtsYcgvSTl8PAuAdqWYSMnLOv', '0ujtsYcgvSTl8PAuAdqWYSMnLOv');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('ksuid');
    expect(result.timestamp).toBeTruthy();
  });

  it('rejects wrong length', () => {
    const result = parseKsuid('0ujtsYcgvSTl8PAuAdqW', '0ujtsYcgvSTl8PAuAdqW');
    expect(result.ok).toBe(false);
  });
});
