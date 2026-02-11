import { describe, it, expect } from 'vitest';
import { parseUuid } from '@/engine/parsers/uuid';

describe('parseUuid', () => {
  it('detects nil UUID', () => {
    const results = parseUuid('00000000-0000-0000-0000-000000000000', '00000000000000000000000000000000');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_nil');
    expect(results[0].score).toBe(1.0);
  });

  it('detects max UUID', () => {
    const results = parseUuid('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffffffffffffffffffffffffffff');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_max');
    expect(results[0].score).toBe(1.0);
  });

  it('detects UUID v4', () => {
    const results = parseUuid('550e8400-e29b-41d4-a716-446655440000', '550e8400e29b41d4a716446655440000');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v4');
    expect(results[0].ok).toBe(true);
    expect(results[0].score).toBeGreaterThanOrEqual(0.9);
  });

  it('detects UUID v1', () => {
    const results = parseUuid('f47ac10b-58cc-1171-8000-00c04fd430c8', 'f47ac10b58cc1171800000c04fd430c8');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v1');
    expect(results[0].ok).toBe(true);
  });

  it('detects UUID v7', () => {
    const results = parseUuid('018e4a1e-5f04-7293-ae5a-3b8c6e2f1d40', '018e4a1e5f047293ae5a3b8c6e2f1d40');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v7');
    expect(results[0].ok).toBe(true);
    expect(results[0].timestamp).toBeTruthy();
  });

  it('detects UUID v3', () => {
    const results = parseUuid('6ba7b810-9dad-31d1-80b4-00c04fd430c8', '6ba7b8109dad31d180b400c04fd430c8');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v3');
  });

  it('detects UUID v5', () => {
    const results = parseUuid('3d813cbb-47fb-52ba-91df-831e1593ac29', '3d813cbb47fb52ba91df831e1593ac29');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v5');
  });

  it('detects UUID without hyphens', () => {
    const results = parseUuid('550e8400e29b41d4a716446655440000', '550e8400e29b41d4a716446655440000');
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('uuid_v4');
  });

  it('returns empty for non-UUID input', () => {
    const results = parseUuid('hello-world', 'helloworld');
    expect(results.length).toBe(0);
  });
});
