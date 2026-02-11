import { describe, it, expect } from 'vitest';
import { decode } from '@/engine/decode';

describe('decode', () => {
  it('decodes base64 string', () => {
    const result = decode('dGVzdHF3ZWFzZGFzd3Fl');
    const base64 = result.entries.find((e) => e.encoding === 'base64');
    expect(base64).toBeDefined();
    expect(base64!.decoded_text).toBe('testqweasdaswqe');
    expect(base64!.byte_length).toBe(15);
    expect(base64!.bit_length).toBe(120);
  });

  it('decodes base64 with padding', () => {
    const result = decode('aGVsbG8=');
    const base64 = result.entries.find((e) => e.encoding === 'base64');
    expect(base64).toBeDefined();
    expect(base64!.decoded_text).toBe('hello');
    expect(base64!.byte_length).toBe(5);
  });

  it('decodes hex string', () => {
    const result = decode('48656c6c6f');
    const hex = result.entries.find((e) => e.encoding === 'hex');
    expect(hex).toBeDefined();
    expect(hex!.decoded_text).toBe('Hello');
    expect(hex!.byte_length).toBe(5);
    expect(hex!.hex_string).toBe('48656c6c6f');
  });

  it('decodes Crockford Base32', () => {
    const result = decode('91JPRV3F');
    const base32 = result.entries.find((e) => e.encoding === 'base32');
    expect(base32).toBeDefined();
    expect(base32!.byte_length).toBeGreaterThan(0);
    expect(base32!.hex_string).toBeTruthy();
  });

  it('returns all possible decodings for ambiguous input', () => {
    // '91JPRV3F' is valid as both base64 and crockford base32
    const result = decode('91JPRV3F');
    const encodings = result.entries.map((e) => e.encoding);
    expect(encodings).toContain('base64');
    expect(encodings).toContain('base32');
  });

  it('returns error for invalid input', () => {
    const result = decode('!@#$');
    expect(result.entries).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });

  it('returns error for empty input', () => {
    const result = decode('');
    expect(result.entries).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });

  it('returns error for whitespace-only input', () => {
    const result = decode('   ');
    expect(result.entries).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });

  it('hex string also returns base64 alternative', () => {
    // 'aabb' is valid hex AND valid base64
    const result = decode('aabb');
    const encodings = result.entries.map((e) => e.encoding);
    expect(encodings).toContain('hex');
    expect(encodings).toContain('base64');
  });

  it('base64 with non-hex chars only returns base64', () => {
    const result = decode('SGVsbG8=');
    const base64 = result.entries.find((e) => e.encoding === 'base64');
    expect(base64).toBeDefined();
    expect(base64!.decoded_text).toBe('Hello');
    // Should not have hex entry (contains non-hex chars)
    expect(result.entries.find((e) => e.encoding === 'hex')).toBeUndefined();
  });

  it('decodes standard Base32 (RFC 4648) with padding', () => {
    // ORSXG5DUMVZXI=== is base32 for "testtest"
    const result = decode('ORSXG5DUMVZXI===');
    const base32std = result.entries.find((e) => e.encoding === 'base32std');
    expect(base32std).toBeDefined();
    expect(base32std!.decoded_text).toBe('testtest');
    expect(base32std!.byte_length).toBe(8);
  });

  it('decodes standard Base32 without padding', () => {
    // JBSWY3DP is base32 for "Hello"
    const result = decode('JBSWY3DP');
    const base32std = result.entries.find((e) => e.encoding === 'base32std');
    expect(base32std).toBeDefined();
    expect(base32std!.decoded_text).toBe('Hello');
  });

  it('decodes Base58 (Bitcoin alphabet)', () => {
    // iTbjKgYc is a Base58 string
    const result = decode('iTbjKgYc');
    const base58 = result.entries.find((e) => e.encoding === 'base58');
    expect(base58).toBeDefined();
    expect(base58!.byte_length).toBeGreaterThan(0);
    expect(base58!.hex_string).toBeTruthy();
  });

  it('Base58 with leading 1s preserves leading zero bytes', () => {
    // Leading '1' in base58 = leading 0x00 byte
    const result = decode('11');
    const base58 = result.entries.find((e) => e.encoding === 'base58');
    expect(base58).toBeDefined();
    expect(base58!.decoded_bytes[0]).toBe(0);
    expect(base58!.decoded_bytes[1]).toBe(0);
  });

  describe('ranking', () => {
    it('hex with readable text ranks first for pure hex input', () => {
      // 48656c6c6f = "Hello" in hex
      const result = decode('48656c6c6f');
      expect(result.entries[0].encoding).toBe('hex');
    });

    it('base32std with padding ranks first over base64', () => {
      // ORSXG5DUMVZXI=== has 3 padding chars (not valid base64)
      const result = decode('ORSXG5DUMVZXI===');
      expect(result.entries[0].encoding).toBe('base32std');
    });

    it('base64 producing readable text ranks above base32 producing binary', () => {
      // dGVzdA== is base64 for "test"
      const result = decode('dGVzdA==');
      expect(result.entries[0].encoding).toBe('base64');
      expect(result.entries[0].decoded_text).toBe('test');
    });

    it('encoding producing readable UTF-8 ranks above one producing binary', () => {
      // JBSWY3DP: base32std→"Hello", base64→binary
      const result = decode('JBSWY3DP');
      expect(result.entries[0].encoding).toBe('base32std');
      expect(result.entries[0].decoded_text).toBe('Hello');
    });
  });
});
