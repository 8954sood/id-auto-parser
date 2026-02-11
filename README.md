# ID Auto Parser

ID 문자열을 자동으로 판별하고 구조를 분석하는 웹 도구입니다. 다양한 인코딩(Base64, Hex, Base32, Base58 등)의 디코딩도 지원합니다.

**https://8954sood.github.io/id-auto-parser/**

## 지원 ID 타입

| 타입 | 예시 |
|------|------|
| UUID (v1~v7) | `550e8400-e29b-41d4-a716-446655440000` |
| ULID | `01ARZ3NDEKTSV4RRFFQ69G5FAV` |
| Snowflake | `175928847299117063` |
| KSUID | `2OJsGZQRZEmnAmEf0eSLkQPSmFY` |
| TSID | `0ARYZ1G30HDCFCD` |
| TypeID | `user_2x4y6z8a0b1c2d3e4f5g6h7j8k` |
| ObjectId | `507f1f77bcf86cd799439011` |
| Xid | `9m4e2mr0ui3e8a215n4g` |
| NanoID | `V1StGXR8_Z5jdHi6B-myT` |
| CUID / CUID2 | `clh3am0g20000ml08ni68ixnv` |

## 디코딩 지원

| 인코딩 | 설명 |
|--------|------|
| Base64 | 표준 + URL-safe |
| Hex | 16진수 문자열 |
| Base32 (RFC 4648) | A-Z, 2-7 |
| Crockford Base32 | 0-9, A-Z (I, L, O, U 제외) |
| Base32Hex | 0-9, A-V |
| Base58 | Bitcoin 알파벳 |
| Base62 | 0-9, A-Z, a-z |

## 개발

```bash
npm install
npm run dev
npm run test
npm run build
```
