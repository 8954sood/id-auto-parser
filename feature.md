# 기능명세서: ID 자동 분석 웹페이지 (TypeScript 전용, 기명)

## 0. 문서 정보
- 문서명: ID 자동 분석 웹페이지 기능명세서
- 작성자: ByungJun Park
- 작성일: 2026-02-11
- 대상: Web FE 개발자, QA
- 배포 환경: GitHub Pages (정적 호스팅)
- 실행 환경: 브라우저 단독 실행 (Serverless)

---

## 1. 목적
사용자가 임의의 ID 문자열을 입력하면, 시스템이 ID 타입을 자동 판별하고(가능한 경우), 구조/시간/유효성 등 분석 결과를 웹 UI로 제공한다.

> 참고 아이디어: ID inspect CLI 컨셉을 웹 UX로 재구성 (구현은 TypeScript 전용)

---

## 2. 범위

### 2.1 포함(MVP)
- 단일 ID 입력
- 자동 타입 판별(Detection)
- 분석 결과 출력(요약/상세/JSON)
- Base64 표현 지원 (디코딩 후 재판별 포함)
- 오류/불명확(ambiguous) 처리
- 결과 복사(요약/JSON)
- GitHub Pages에서 정적 사이트로 동작해야 함
- 서버 없이 브라우저 단독 실행 가능해야 함

### 2.2 제외(후순위)
- ID 생성(gen)
- 변환(convert)
- 비교(compare)
- 배치 입력(여러 ID 동시)
- 로그인/저장/히스토리

---

## 3. 제품 요구사항 (PRD)

### 3.1 주요 사용자 시나리오
1) 사용자가 서비스에 접속한다.
2) 입력창에 ID를 붙여넣는다.
3) [분석] 클릭(또는 자동 분석 ON일 때 디바운스 후 자동 실행).
4) 결과를 확인하고, 필요 시 JSON을 복사하여 디버깅/로그 분석에 활용한다.

### 3.2 성공 지표
- 지원 타입 입력의 95% 이상에서 정확한 detected_type 표시
- unknown/invalid 상황에서도 명확한 실패 이유 제공
- 평균 분석 시간 200ms 이내 (클라이언트 기준)

---

## 4. 기능 요구사항 (FRD)

## FR-1. 입력(Input)
- 텍스트 형태로 ID 1개 입력
- trim 처리
- 1~512자 제한
- 초과 시 즉시 오류 표시

---

## FR-2. 자동 판별(Detection)

### 2.1 지원 타입

#### [UUID 계열 - 128bit]
- uuid_v1 (Timestamp + MAC)
- uuid_v3 (MD5 namespace hash)
- uuid_v4 (Random)
- uuid_v5 (SHA-1 namespace hash)
- uuid_v6 (Reordered timestamp)
- uuid_v7 (Unix timestamp + random)
- uuid_nil (All zeros)
- uuid_max (All ones)

#### [기타 128bit 계열]
- ulid (Crockford Base32, lexicographically sortable)
- nanoid (~126bit)
- typeid (Type-prefixed sortable ID)
- cuid (Partial sortable)
- cuid2

#### [160bit]
- ksuid (K-Sortable Unique Identifier)

#### [96bit]
- objectid (MongoDB ObjectId, Partial sortable)
- xid (Globally unique sortable ID)

#### [64bit]
- snowflake (Twitter/Discord-style distributed ID)
- tsid (Time-sorted unique identifier)

#### [표현 형식]
- base64 (raw 64/96/128/160bit 바이너리 표현)

> base64는 독립 ID 타입이 아니라 "인코딩 표현"으로 간주하며  
> 디코딩 후 바이트 길이 기반으로 재판별 수행

---

### 2.2 판별 전략

1) 프리필터:
   - 문자열 길이
   - 문자셋(hex/base32/base58/base62/base64/decimal)
   - 하이픈 등 구분자
   - prefix 패턴(typeid 등)
   - base64 정규식 검사

2) base64 처리:
   - base64 디코딩 시도
   - 성공 시 바이트 길이 기반 후보군 생성:

        8 bytes  → snowflake / tsid  
        12 bytes → objectid / xid  
        16 bytes → uuid / ulid / typeid / cuid / cuid2  
        20 bytes → ksuid  

   - 이후 각 타입별 정밀 파싱 수행

3) 정밀 파싱
   - 각 타입별 parse 함수 실행
   - 성공/실패 기록
   - 스코어 계산

4) 결과 결정
   - 단일 우세 후보 → detected_type 확정
   - 복수 후보 근접 → ambiguous
   - 전부 실패 → unknown

---

## FR-3. 분석(Inspection)

### 3.1 Summary 필드
- valid: boolean
- detected_type
- confidence: "high" | "medium" | "low"
- bit_length: number
- sortable: boolean | "partial" | null
- timestamp: string | null (ISO)
- canonical: string | null

---

### 3.2 Details 공통 필드
- length: number
- bit_length: number
- byte_length: number
- charset: string
- encoding_detected:
    "hex"
  | "base32"
  | "base58"
  | "base62"
  | "base64"
  | "decimal"
  | "unknown"
- decoded_from_base64: boolean
- separators: string[]
- normalized_input: string
- notes: string[]

---

### 3.3 타입별 상세 정보

#### UUID
- version: number
- variant: string
- is_nil: boolean
- is_max: boolean
- timestamp (v1/v6/v7 가능 시)

#### ULID
- time_ms
- time_iso
- randomness_bits

#### NanoID
- alphabet_type
- estimated_entropy_bits

#### Snowflake
- timestamp_ms
- timestamp_iso
- worker_id
- sequence
- epoch_type

#### KSUID
- timestamp
- payload_bits

#### ObjectId
- timestamp
- machine_identifier
- process_identifier
- counter

---

## FR-4. 오류 처리

에러 코드:
- EMPTY
- TOO_LONG
- UNKNOWN
- INVALID
- AMBIGUOUS

AMBIGUOUS 예시:
"Base64로 디코딩 가능하지만 여러 타입으로 해석 가능해요."

candidates 배열에 각 타입별 근거 포함

---

## FR-5. 데이터 모델 (TS 설계 기준)

### CandidateResult
- type: string
- ok: boolean
- score: number (0~1)
- reason?: string
- evidence?: string[]

### InspectResponse
- input: string
- normalized_input: string
- detected_type: string
- confidence: string
- valid: boolean
- candidates: CandidateResult[]
- summary: object
- details: object
- error?: {
    code: string
    message: string
    hint?: string
  }

---

## 7. 구현 원칙 (TS Only)

- 모든 detection/inspection 로직은 TypeScript로 구현
- GitHub Pages에서 동작 가능한 **정적 빌드 결과물**이어야 함
- 서버 API 의존 금지 (외부 API 호출 없음)
- 모든 detection/inspection 로직은 브라우저에서 실행
- 빌드 산출물은 `/dist` 정적 파일(html/js/css) 형태
- 자동 분석 시 500ms 디바운스
- 동일 입력 재분석 방지 캐시 적용

---

7.1 빌드/배포 요구사항

### GitHub Pages 배포 요구사항
- SPA 또는 Static Site 형태
- basePath 설정 가능해야 함 (예: /repo-name/)
- hash 라우팅 또는 relative path 지원
- 빌드 시 정적 자원 경로가 절대 경로("/")에 의존하지 않도록 구성
- GitHub Actions 자동 배포 파이프라인 구성 가능 구조

권장:
- Vite + TS
- next export (static) 금지: 서버 기능 사용 금지
- CSR 기반 앱

---

## 8. 비기능 요구사항

- 입력 최대 512자
- 정규식 DoS 방지
- 평균 분석 시간 200ms 이하
- 키보드 접근성 보장
- 한국어 기본 UI
- 외부 서버/DB/API 의존 없음
- 네트워크 없이도 로컬에서 동작 가능
- 번들 크기 300KB 이하 목표 (gzip 기준 권장)

---

## 9. 보안 요구사항

- 사용자 입력은 서버로 전송되지 않음
- 모든 분석은 클라이언트에서 수행
- 개인정보/로그 저장 없음

---

## 10. 수용 기준

- uuid_v1~v7, ulid, nanoid, ksuid, snowflake, objectid, xid, cuid, cuid2, tsid 정상 분석
- base64 인코딩된 64/96/128/160bit 값 디코딩 후 재판별 가능
- unknown/invalid에서도 크래시 없이 오류 메시지 표시
- JSON 복사 정상 동작

---
