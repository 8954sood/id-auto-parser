import { describe, it, expect } from 'vitest';
import { parseSnowflake } from '@/engine/parsers/snowflake';

describe('parseSnowflake', () => {
  it('detects Twitter Snowflake', () => {
    const result = parseSnowflake('1541815603606036480', '1541815603606036480');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('snowflake');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.timestamp).toBeTruthy();
  });

  it('detects Discord Snowflake', () => {
    const result = parseSnowflake('175928847299117063', '175928847299117063');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('snowflake');
  });

  it('rejects short numbers', () => {
    const result = parseSnowflake('12345', '12345');
    expect(result.ok).toBe(false);
  });

  it('rejects non-numeric', () => {
    const result = parseSnowflake('abcde12345678901234', 'abcde12345678901234');
    expect(result.ok).toBe(false);
  });
});
