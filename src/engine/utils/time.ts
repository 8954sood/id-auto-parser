// UUID v1/v6 epoch: 1582-10-15 (100-nanosecond intervals since)
const UUID_EPOCH_OFFSET = 122192928000000000n; // offset from Unix epoch in 100-ns ticks

// KSUID epoch: 2014-05-13T16:53:20Z
const KSUID_EPOCH = 1400000000;

// Snowflake epochs
const TWITTER_EPOCH = 1288834974657n; // 2010-11-04T01:42:54.657Z
const DISCORD_EPOCH = 1420070400000n; // 2015-01-01T00:00:00.000Z

// TSID epoch: 2020-01-01T00:00:00Z
const TSID_EPOCH = 1577836800000n;

export function uuidTimestampToMs(timestamp100ns: bigint): number {
  const unixMs = Number((timestamp100ns - UUID_EPOCH_OFFSET) / 10000n);
  return unixMs;
}

export function ksuidTimestampToDate(seconds: number): Date {
  return new Date((seconds + KSUID_EPOCH) * 1000);
}

export function snowflakeTimestampToDate(
  timestampMs: bigint,
  epoch: 'twitter' | 'discord',
): Date {
  const epochOffset = epoch === 'twitter' ? TWITTER_EPOCH : DISCORD_EPOCH;
  return new Date(Number(timestampMs + epochOffset));
}

export function tsidTimestampToDate(timestampMs: bigint): Date {
  return new Date(Number(timestampMs + TSID_EPOCH));
}

export function isReasonableDate(date: Date): boolean {
  const year = date.getFullYear();
  return year >= 2000 && year <= 2100;
}

export function isReasonableDateMs(ms: number): boolean {
  return isReasonableDate(new Date(ms));
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export { KSUID_EPOCH, TWITTER_EPOCH, DISCORD_EPOCH, TSID_EPOCH, UUID_EPOCH_OFFSET };
