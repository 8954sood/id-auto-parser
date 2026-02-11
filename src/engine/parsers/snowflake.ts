import type { ParseResult, SnowflakeDetails } from '@/types';
import { isDecimal } from '../utils/charset';
import { snowflakeTimestampToDate, isReasonableDate } from '../utils/time';
import { bytesToBigInt } from '../utils/hex';

export function parseSnowflake(
  input: string,
  _normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult {
  let value: bigint;

  if (bytes && bytes.length === 8) {
    value = bytesToBigInt(bytes);
  } else {
    const trimmed = input.trim();
    if (trimmed.length < 17 || trimmed.length > 20 || !isDecimal(trimmed)) {
      return { ok: false, score: 0, type: 'snowflake', evidence: ['not 17-20 digit decimal'] };
    }
    try {
      value = BigInt(trimmed);
    } catch {
      return { ok: false, score: 0, type: 'snowflake', evidence: ['failed to parse as BigInt'] };
    }
  }

  // Snowflake: bit 63 (sign) should be 0
  if (value < 0n || value >= 2n ** 63n) {
    return { ok: false, score: 0, type: 'snowflake', evidence: ['value out of 63-bit range'] };
  }

  // Try Twitter epoch (most common)
  const twitterTimestamp = value >> 22n;
  const twitterDate = snowflakeTimestampToDate(twitterTimestamp, 'twitter');
  const twitterReasonable = isReasonableDate(twitterDate);

  // Try Discord epoch
  const discordTimestamp = value >> 22n;
  const discordDate = snowflakeTimestampToDate(discordTimestamp, 'discord');
  const discordReasonable = isReasonableDate(discordDate);

  // Extract worker/sequence (Twitter format: 10bit worker, 12bit sequence)
  const workerId = Number((value >> 12n) & 0x3ffn);
  const sequence = Number(value & 0xfffn);

  let bestEpoch: 'twitter' | 'discord';
  let bestDate: Date;
  let bestScore: number;

  if (twitterReasonable && discordReasonable) {
    // Both reasonable — prefer Twitter as it's more common
    bestEpoch = 'twitter';
    bestDate = twitterDate;
    bestScore = 0.85;
  } else if (twitterReasonable) {
    bestEpoch = 'twitter';
    bestDate = twitterDate;
    bestScore = 0.9;
  } else if (discordReasonable) {
    bestEpoch = 'discord';
    bestDate = discordDate;
    bestScore = 0.9;
  } else {
    // Neither reasonable — low confidence
    bestEpoch = 'twitter';
    bestDate = twitterDate;
    bestScore = 0.4;
  }

  const details: SnowflakeDetails = {
    timestamp_ms: Number(bestEpoch === 'twitter' ? twitterTimestamp : discordTimestamp),
    timestamp_iso: bestDate.toISOString(),
    worker_id: workerId,
    sequence,
    epoch_type: bestEpoch,
  };

  return {
    ok: true,
    score: bestScore,
    type: 'snowflake',
    evidence: [
      `${bytes ? '8 bytes' : input.trim().length + '-digit decimal'} / 64-bit integer`,
      `epoch: ${bestEpoch}`,
      `timestamp: ${details.timestamp_iso}`,
      bestScore >= 0.8 ? 'reasonable date' : 'unreasonable date',
      `worker_id: ${workerId}, sequence: ${sequence}`,
    ],
    type_specific: details,
    canonical: value.toString(),
    bit_length: 64,
    sortable: true,
    timestamp: details.timestamp_iso,
  };
}
