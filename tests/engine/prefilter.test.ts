import { describe, it, expect } from 'vitest';
import { prefilter } from '@/engine/prefilter';

describe('prefilter', () => {
  it('identifies UUID candidates from hyphenated hex', () => {
    const result = prefilter('550e8400-e29b-41d4-a716-446655440000');
    expect(result.candidates).toContain('uuid_v4');
    expect(result.separators).toContain('-');
  });

  it('identifies ULID candidates from 26-char Crockford', () => {
    const result = prefilter('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.candidates).toContain('ulid');
  });

  it('identifies Snowflake from 19-digit decimal', () => {
    const result = prefilter('1541815603606036480');
    expect(result.candidates).toContain('snowflake');
  });

  it('identifies ObjectId from 24-hex', () => {
    const result = prefilter('507f1f77bcf86cd799439011');
    expect(result.candidates).toContain('objectid');
  });

  it('identifies TypeID with prefix', () => {
    const result = prefilter('user_2x4y6z8a0b1c2d3e4f5g6h7j8k');
    expect(result.candidates).toContain('typeid');
    expect(result.hasPrefix).toBe(true);
  });

  it('identifies KSUID from 27-char base62', () => {
    const result = prefilter('0ujtsYcgvSTl8PAuAdqWYSMnLOv');
    expect(result.candidates).toContain('ksuid');
  });

  it('returns empty candidates for unknown input', () => {
    const result = prefilter('this is just a random string!');
    expect(result.candidates.length).toBe(0);
  });
});
