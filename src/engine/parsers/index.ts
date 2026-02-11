import type { IdType, ParseResult } from '@/types';
import { parseUuid } from './uuid';
import { parseUlid } from './ulid';
import { parseTypeId } from './typeid';
import { parseObjectId } from './objectid';
import { parseXid } from './xid';
import { parseKsuid } from './ksuid';
import { parseSnowflake } from './snowflake';
import { parseTsid } from './tsid';
import { parseCuid } from './cuid';
import { parseCuid2 } from './cuid2';
import { parseNanoid } from './nanoid';

type ParserEntry = (
  input: string,
  normalizedInput: string,
  bytes?: Uint8Array,
) => ParseResult | ParseResult[];

const parserRegistry = new Map<IdType, ParserEntry>();

// UUID parser returns an array of results (one per version)
parserRegistry.set('uuid_v1', parseUuid as ParserEntry);
parserRegistry.set('uuid_v3', parseUuid as ParserEntry);
parserRegistry.set('uuid_v4', parseUuid as ParserEntry);
parserRegistry.set('uuid_v5', parseUuid as ParserEntry);
parserRegistry.set('uuid_v6', parseUuid as ParserEntry);
parserRegistry.set('uuid_v7', parseUuid as ParserEntry);
parserRegistry.set('uuid_nil', parseUuid as ParserEntry);
parserRegistry.set('uuid_max', parseUuid as ParserEntry);

parserRegistry.set('ulid', parseUlid as ParserEntry);
parserRegistry.set('typeid', parseTypeId as ParserEntry);
parserRegistry.set('objectid', parseObjectId as ParserEntry);
parserRegistry.set('xid', parseXid as ParserEntry);
parserRegistry.set('ksuid', parseKsuid as ParserEntry);
parserRegistry.set('snowflake', parseSnowflake as ParserEntry);
parserRegistry.set('tsid', parseTsid as ParserEntry);
parserRegistry.set('cuid', parseCuid as ParserEntry);
parserRegistry.set('cuid2', parseCuid2 as ParserEntry);
parserRegistry.set('nanoid', parseNanoid as ParserEntry);

// UUID types all share the same parser — deduplicate
const UUID_TYPES: IdType[] = ['uuid_v1', 'uuid_v3', 'uuid_v4', 'uuid_v5', 'uuid_v6', 'uuid_v7', 'uuid_nil', 'uuid_max'];

export function runParsers(
  candidates: IdType[],
  input: string,
  normalizedInput: string,
  bytes?: Uint8Array,
): ParseResult[] {
  const results: ParseResult[] = [];
  const uuidAlreadyRun = new Set<string>();

  for (const candidate of candidates) {
    // Deduplicate UUID parser calls
    if (UUID_TYPES.includes(candidate)) {
      const key = 'uuid';
      if (uuidAlreadyRun.has(key)) continue;
      uuidAlreadyRun.add(key);
    }

    const parser = parserRegistry.get(candidate);
    if (!parser) continue;

    try {
      const result = parser(input, normalizedInput, bytes);
      if (Array.isArray(result)) {
        results.push(...result);
      } else {
        results.push(result);
      }
    } catch {
      // Parser threw — skip it
    }
  }

  return results;
}

export { parserRegistry };
