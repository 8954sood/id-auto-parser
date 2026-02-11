export type IdType =
  | 'uuid_v1'
  | 'uuid_v3'
  | 'uuid_v4'
  | 'uuid_v5'
  | 'uuid_v6'
  | 'uuid_v7'
  | 'uuid_nil'
  | 'uuid_max'
  | 'ulid'
  | 'typeid'
  | 'nanoid'
  | 'cuid'
  | 'cuid2'
  | 'ksuid'
  | 'objectid'
  | 'xid'
  | 'snowflake'
  | 'tsid';

export type Confidence = 'high' | 'medium' | 'low';

export type Charset =
  | 'hex'
  | 'base32'
  | 'base32hex'
  | 'base36'
  | 'base62'
  | 'base64'
  | 'decimal'
  | 'unknown';

export interface UuidDetails {
  version: number;
  variant: string;
  is_nil: boolean;
  is_max: boolean;
  timestamp?: string;
  timestamp_ms?: number;
}

export interface UlidDetails {
  time_ms: number;
  time_iso: string;
  randomness_bits: number;
}

export interface TypeIdDetails {
  prefix: string;
  suffix: string;
  uuid_version: number;
  uuid_variant: string;
  timestamp?: string;
  timestamp_ms?: number;
}

export interface NanoidDetails {
  alphabet_type: string;
  estimated_entropy_bits: number;
}

export interface CuidDetails {
  prefix: string;
}

export interface Cuid2Details {
  length: number;
}

export interface KsuidDetails {
  timestamp: string;
  timestamp_s: number;
  payload_bits: number;
}

export interface ObjectIdDetails {
  timestamp: string;
  timestamp_s: number;
  machine_identifier: string;
  process_identifier: number;
  counter: number;
}

export interface XidDetails {
  timestamp: string;
  timestamp_s: number;
  machine_id: string;
  process_id: number;
  counter: number;
}

export interface SnowflakeDetails {
  timestamp_ms: number;
  timestamp_iso: string;
  worker_id: number;
  sequence: number;
  epoch_type: string;
}

export interface TsidDetails {
  timestamp_ms: number;
  timestamp_iso: string;
  random_bits: number;
}

export type TypeSpecificDetails =
  | UuidDetails
  | UlidDetails
  | TypeIdDetails
  | NanoidDetails
  | CuidDetails
  | Cuid2Details
  | KsuidDetails
  | ObjectIdDetails
  | XidDetails
  | SnowflakeDetails
  | TsidDetails;
