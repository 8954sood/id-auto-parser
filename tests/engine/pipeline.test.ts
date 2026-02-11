import { describe, it, expect } from 'vitest';
import { inspect } from '@/engine';
import { ALL_VECTORS } from '../fixtures/known-ids';

describe('pipeline end-to-end', () => {
  it('handles empty input', () => {
    const result = inspect('');
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('EMPTY');
  });

  it('handles too long input', () => {
    const result = inspect('a'.repeat(513));
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('TOO_LONG');
  });

  it('handles whitespace-only input', () => {
    const result = inspect('   ');
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('EMPTY');
  });

  it('handles unknown input', () => {
    const result = inspect('hello-world-this-is-not-an-id');
    expect(result.valid).toBe(false);
  });

  it('detects UUID v4', () => {
    const result = inspect('550e8400-e29b-41d4-a716-446655440000');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('uuid_v4');
    expect(result.confidence).toBe('high');
  });

  it('detects UUID v7', () => {
    const result = inspect('018e4a1e-5f04-7293-ae5a-3b8c6e2f1d40');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('uuid_v7');
    expect(result.summary.timestamp).toBeTruthy();
  });

  it('detects ULID', () => {
    const result = inspect('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('ulid');
  });

  it('detects Snowflake', () => {
    const result = inspect('1541815603606036480');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('snowflake');
  });

  it('detects ObjectId', () => {
    const result = inspect('507f1f77bcf86cd799439011');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('objectid');
  });

  it('detects KSUID', () => {
    const result = inspect('0ujtsYcgvSTl8PAuAdqWYSMnLOv');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('ksuid');
  });

  it('detects CUID', () => {
    const result = inspect('cjld2cyuq0000t3rmniod1foy');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('cuid');
  });

  it('detects NanoID', () => {
    const result = inspect('V1StGXR8_Z5jdHi6B-myT');
    expect(result.valid).toBe(true);
    expect(result.detected_type).toBe('nanoid');
  });

  it('caches repeated input', () => {
    const input = '550e8400-e29b-41d4-a716-446655440000';
    const r1 = inspect(input);
    const r2 = inspect(input);
    expect(r1).toBe(r2); // Same reference (cached)
  });

  describe('test vectors', () => {
    for (const vec of ALL_VECTORS) {
      it(`${vec.description}: ${vec.input.slice(0, 30)}...`, () => {
        const result = inspect(vec.input);
        const expected = Array.isArray(vec.expectedType) ? vec.expectedType : [vec.expectedType];
        expect(expected).toContain(result.detected_type);
      });
    }
  });

  describe('mode=decode', () => {
    it('UUID direct input still works in decode mode', () => {
      const result = inspect('550e8400-e29b-41d4-a716-446655440000', 'decode');
      expect(result.valid).toBe(true);
      expect(result.detected_type).toBe('uuid_v4');
    });

    it('ULID direct input still works in decode mode', () => {
      const result = inspect('01ARZ3NDEKTSV4RRFFQ69G5FAV', 'decode');
      expect(result.valid).toBe(true);
      expect(result.detected_type).toBe('ulid');
    });

    it('base64 input returns unknown in decode mode (no ID re-identification)', () => {
      // dGVzdHF3ZWFzZGFzd3Fl is base64 for "testqweasdaswqe" (15 bytes, not a known ID length)
      const result = inspect('dGVzdHF3ZWFzZGFzd3Fl', 'decode');
      expect(result.valid).toBe(false);
      expect(result.detected_type).toBe('unknown');
    });
  });

  it('average analysis time < 200ms', () => {
    const inputs = ALL_VECTORS.map((v) => v.input);
    const start = performance.now();
    for (const input of inputs) {
      inspect(input + ' '); // Add space to avoid cache
    }
    const elapsed = performance.now() - start;
    const avg = elapsed / inputs.length;
    expect(avg).toBeLessThan(200);
  });
});
