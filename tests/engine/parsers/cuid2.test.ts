import { describe, it, expect } from 'vitest';
import { parseCuid2 } from '@/engine/parsers/cuid2';

describe('parseCuid2', () => {
  it('detects CUID2 (24 chars)', () => {
    const result = parseCuid2('tz4a98xxat96iws9zmbrgj3a', 'tz4a98xxat96iws9zmbrgj3a');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('cuid2');
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('rejects uppercase start', () => {
    const result = parseCuid2('Tz4a98xxat96iws9zmbrgj3a', 'Tz4a98xxat96iws9zmbrgj3a');
    expect(result.ok).toBe(false);
  });

  it('rejects too short', () => {
    const result = parseCuid2('tz4a98xxat96iws9zmb', 'tz4a98xxat96iws9zmb');
    expect(result.ok).toBe(false);
  });
});
