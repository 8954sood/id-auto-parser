import type { IdType } from '@/types';
import { isHex, isDecimal, isCrockfordBase32, isBase32Hex, isBase62, isBase36 } from './utils/charset';

export interface PrefilterResult {
  candidates: IdType[];
  normalized: string;
  separators: string[];
  hasPrefix: boolean;
  prefixValue?: string;
}

export function prefilter(input: string): PrefilterResult {
  const trimmed = input.trim();
  const candidates: IdType[] = [];
  const separators: string[] = [];

  // Detect separators (hyphens in UUID-style)
  if (trimmed.includes('-')) separators.push('-');
  if (trimmed.includes('_')) separators.push('_');

  // Check for TypeID prefix_suffix pattern
  const typeIdMatch = trimmed.match(/^([a-z][a-z0-9_]*[a-z0-9])_([0-9a-hjkmnp-tv-z]{26})$/i);
  if (typeIdMatch) {
    candidates.push('typeid');
    return {
      candidates,
      normalized: trimmed,
      separators,
      hasPrefix: true,
      prefixValue: typeIdMatch[1],
    };
  }

  // Normalize: remove hyphens for UUID-like
  const normalized = trimmed.replace(/-/g, '');
  const len = normalized.length;

  // UUID: 32 hex chars (with or without hyphens, 36 with hyphens)
  if ((len === 32 && isHex(normalized)) || (trimmed.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed))) {
    candidates.push('uuid_v1', 'uuid_v3', 'uuid_v4', 'uuid_v5', 'uuid_v6', 'uuid_v7', 'uuid_nil', 'uuid_max');
  }

  // ULID: 26 chars Crockford Base32
  if (trimmed.length === 26 && isCrockfordBase32(trimmed)) {
    candidates.push('ulid');
  }

  // NanoID: 21 chars [A-Za-z0-9_-]
  if (trimmed.length === 21 && /^[A-Za-z0-9_-]+$/.test(trimmed)) {
    candidates.push('nanoid');
  }

  // CUID: 25 chars, starts with 'c', base36
  if (trimmed.length === 25 && trimmed[0] === 'c' && isBase36(trimmed)) {
    candidates.push('cuid');
  }

  // CUID2: 24 chars (default), starts with [a-z], all base36
  if (trimmed.length >= 21 && trimmed.length <= 32 && /^[a-z]/.test(trimmed) && isBase36(trimmed)) {
    candidates.push('cuid2');
  }

  // KSUID: 27 chars base62
  if (trimmed.length === 27 && isBase62(trimmed)) {
    candidates.push('ksuid');
  }

  // ObjectId: 24 hex chars
  if (trimmed.length === 24 && isHex(trimmed)) {
    candidates.push('objectid');
  }

  // XID: 20 chars base32hex [0-9a-v]
  if (trimmed.length === 20 && isBase32Hex(trimmed)) {
    candidates.push('xid');
  }

  // Snowflake: 17-20 digit decimal
  if (trimmed.length >= 17 && trimmed.length <= 20 && isDecimal(trimmed)) {
    candidates.push('snowflake');
  }

  // TSID: 13 chars Crockford Base32 or 17-18 digit decimal
  if (trimmed.length === 13 && isCrockfordBase32(trimmed)) {
    candidates.push('tsid');
  }
  if (trimmed.length >= 17 && trimmed.length <= 18 && isDecimal(trimmed)) {
    if (!candidates.includes('tsid')) {
      candidates.push('tsid');
    }
  }

  return {
    candidates,
    normalized,
    separators,
    hasPrefix: false,
  };
}
