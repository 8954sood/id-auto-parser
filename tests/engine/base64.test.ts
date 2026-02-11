import { describe, it, expect } from 'vitest';
import { tryBase64Decode } from '@/engine/base64';

describe('tryBase64Decode', () => {
  it('decodes valid base64 to 16 bytes (UUID-like)', () => {
    // 16 bytes → 24 base64 chars (with padding)
    const b64 = btoa(String.fromCharCode(...new Uint8Array(16).fill(0x42)));
    const result = tryBase64Decode(b64);
    expect(result).not.toBeNull();
    expect(result!.decoded.length).toBe(16);
    expect(result!.candidates).toContain('uuid_v4');
  });

  it('decodes valid base64 to 8 bytes (Snowflake-like)', () => {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(8).fill(0x42)));
    const result = tryBase64Decode(b64);
    expect(result).not.toBeNull();
    expect(result!.decoded.length).toBe(8);
    expect(result!.candidates).toContain('snowflake');
  });

  it('returns null for non-base64', () => {
    const result = tryBase64Decode('!@#$%^&*()');
    expect(result).toBeNull();
  });

  it('returns unmatched for wrong byte length', () => {
    // 3 bytes → no matching candidate but still decoded
    const b64 = btoa(String.fromCharCode(...new Uint8Array(3).fill(0x42)));
    const result = tryBase64Decode(b64);
    expect(result).not.toBeNull();
    expect(result!.unmatchedByteLength).toBe(true);
    expect(result!.candidates).toHaveLength(0);
    expect(result!.decoded.length).toBe(3);
  });

  it('returns null for too short input', () => {
    const result = tryBase64Decode('AB');
    expect(result).toBeNull();
  });
});
