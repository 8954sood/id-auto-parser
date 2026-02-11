import type { IdType } from '@/types';

export interface TestVector {
  input: string;
  expectedType: IdType | IdType[];
  description: string;
}

// UUID test vectors
export const UUID_VECTORS: TestVector[] = [
  {
    input: '00000000-0000-0000-0000-000000000000',
    expectedType: 'uuid_nil',
    description: 'nil UUID',
  },
  {
    input: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    expectedType: 'uuid_max',
    description: 'max UUID',
  },
  {
    input: 'f47ac10b-58cc-1171-8000-00c04fd430c8',
    expectedType: 'uuid_v1',
    description: 'UUID v1 with timestamp',
  },
  {
    input: '6ba7b810-9dad-31d1-80b4-00c04fd430c8',
    expectedType: 'uuid_v3',
    description: 'UUID v3 (MD5)',
  },
  {
    input: '550e8400-e29b-41d4-a716-446655440000',
    expectedType: 'uuid_v4',
    description: 'UUID v4 (random)',
  },
  {
    input: '3d813cbb-47fb-52ba-91df-831e1593ac29',
    expectedType: 'uuid_v5',
    description: 'UUID v5 (SHA-1)',
  },
  {
    input: '1ef21d2f-1207-6130-9a58-5b5b5b5b5b5b',
    expectedType: 'uuid_v6',
    description: 'UUID v6 (reordered timestamp)',
  },
  {
    input: '018e4a1e-5f04-7293-ae5a-3b8c6e2f1d40',
    expectedType: 'uuid_v7',
    description: 'UUID v7 (Unix timestamp)',
  },
  // Without hyphens
  {
    input: '550e8400e29b41d4a716446655440000',
    expectedType: 'uuid_v4',
    description: 'UUID v4 without hyphens',
  },
];

// ULID test vectors
export const ULID_VECTORS: TestVector[] = [
  {
    input: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    expectedType: 'ulid',
    description: 'standard ULID',
  },
  {
    input: '01HXZQN0G09FBEZNX8B4F2XJAV',
    expectedType: 'ulid',
    description: 'recent ULID',
  },
];

// TypeID test vectors
export const TYPEID_VECTORS: TestVector[] = [
  {
    input: 'user_2x4y6z8a0b1c2d3e4f5g6h7j8k',
    expectedType: 'typeid',
    description: 'TypeID with user prefix',
  },
];

// Snowflake test vectors
export const SNOWFLAKE_VECTORS: TestVector[] = [
  {
    input: '1541815603606036480',
    expectedType: 'snowflake',
    description: 'Twitter Snowflake ID',
  },
  {
    input: '175928847299117063',
    expectedType: ['snowflake', 'ambiguous'],
    description: 'Discord Snowflake ID',
  },
];

// ObjectId test vectors
export const OBJECTID_VECTORS: TestVector[] = [
  {
    input: '507f1f77bcf86cd799439011',
    expectedType: 'objectid',
    description: 'MongoDB ObjectId',
  },
  {
    input: '65a1b2c3d4e5f6a7b8c9d0e1',
    expectedType: 'objectid',
    description: 'recent ObjectId',
  },
];

// XID test vectors
export const XID_VECTORS: TestVector[] = [
  {
    input: '9m4e2mr0ui3e8a215n4g',
    expectedType: 'xid',
    description: 'standard XID',
  },
];

// KSUID test vectors
export const KSUID_VECTORS: TestVector[] = [
  {
    input: '0ujtsYcgvSTl8PAuAdqWYSMnLOv',
    expectedType: 'ksuid',
    description: 'standard KSUID',
  },
];

// CUID test vectors
export const CUID_VECTORS: TestVector[] = [
  {
    input: 'cjld2cyuq0000t3rmniod1foy',
    expectedType: 'cuid',
    description: 'CUID v1',
  },
];

// CUID2 test vectors
export const CUID2_VECTORS: TestVector[] = [
  {
    input: 'tz4a98xxat96iws9zmbrgj3a',
    expectedType: 'cuid2',
    description: 'CUID2 (24 chars)',
  },
];

// NanoID test vectors
export const NANOID_VECTORS: TestVector[] = [
  {
    input: 'V1StGXR8_Z5jdHi6B-myT',
    expectedType: 'nanoid',
    description: 'NanoID with _ and -',
  },
];

// TSID test vectors
export const TSID_VECTORS: TestVector[] = [
  {
    input: '0HZFRCNG6AP1Q',
    expectedType: 'tsid',
    description: 'TSID in Crockford Base32',
  },
];

export const ALL_VECTORS: TestVector[] = [
  ...UUID_VECTORS,
  ...ULID_VECTORS,
  ...TYPEID_VECTORS,
  ...SNOWFLAKE_VECTORS,
  ...OBJECTID_VECTORS,
  ...XID_VECTORS,
  ...KSUID_VECTORS,
  ...CUID_VECTORS,
  ...CUID2_VECTORS,
  ...NANOID_VECTORS,
  ...TSID_VECTORS,
];
