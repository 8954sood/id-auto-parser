import type { IdType, ParseResult, Charset, Details, Summary, InspectResponse, InspectError } from '@/types';
import { prefilter } from './prefilter';
import { tryBase64Decode } from './base64';
import { runParsers } from './parsers';
import { scoreCandidates } from './scorer';
import { detectCharset } from './utils/charset';

export function runPipeline(input: string, mode: 'analyze' | 'decode' = 'analyze'): InspectResponse {
  const trimmed = input.trim();

  // Validation
  if (trimmed.length === 0) {
    return makeErrorResponse(input, '', 'EMPTY', '입력이 비어있습니다', 'ID 문자열을 입력해주세요');
  }

  // Step 1: Prefilter
  const pf = prefilter(trimmed);

  // Step 2: Run parsers for prefiltered candidates
  let allResults: ParseResult[] = [];

  if (pf.candidates.length > 0) {
    allResults = runParsers(pf.candidates, trimmed, pf.normalized);
  }

  // Step 3: Try base64 decode if no good results yet or few candidates
  // In 'decode' mode, skip base64→ID re-identification entirely
  const bestDirect = allResults.filter((r) => r.ok).sort((a, b) => b.score - a.score)[0];
  let decodedFromBase64 = false;
  let base64Bytes: Uint8Array | undefined;

  let base64DecodedByteLength: number | null = null;

  if (mode === 'analyze' && (!bestDirect || bestDirect.score < 0.7)) {
    const b64 = tryBase64Decode(trimmed);
    if (b64) {
      base64DecodedByteLength = b64.decoded.length;

      if (b64.candidates.length > 0) {
        const b64Results = runParsers(b64.candidates, trimmed, pf.normalized, b64.decoded);
        if (b64Results.some((r) => r.ok)) {
          allResults.push(...b64Results);
          decodedFromBase64 = true;
          base64Bytes = b64.decoded;
        }
      }
    }
  }

  // Filter to successful results for scoring
  const scoring = scoreCandidates(allResults);

  // Build response
  const charset = detectCharset(pf.normalized);
  const bestResult = scoring.bestResult;

  const details: Details = {
    length: trimmed.length,
    bit_length: bestResult?.bit_length ?? null,
    byte_length: bestResult?.bit_length ? bestResult.bit_length / 8 : (base64Bytes ? base64Bytes.length : null),
    charset,
    encoding_detected: decodedFromBase64 ? 'base64' : charset,
    decoded_from_base64: decodedFromBase64,
    separators: pf.separators,
    normalized_input: pf.normalized,
    notes: [],
    type_specific: bestResult?.type_specific,
  };

  if (decodedFromBase64) {
    details.notes.push('Base64 디코딩 후 분석됨');
  } else if (base64DecodedByteLength !== null) {
    details.notes.push(`Base64 디코딩 성공 (${base64DecodedByteLength}바이트), 그러나 알려진 ID 바이트 길이(8/12/16/20)와 일치하지 않음`);
    details.encoding_detected = 'base64';
    details.byte_length = base64DecodedByteLength;
    details.bit_length = base64DecodedByteLength * 8;
  }

  const summary: Summary = {
    valid: scoring.detectedType !== 'unknown',
    detected_type: scoring.detectedType,
    confidence: scoring.confidence,
    bit_length: bestResult?.bit_length ?? null,
    sortable: bestResult?.sortable ?? null,
    timestamp: bestResult?.timestamp ?? null,
    canonical: bestResult?.canonical ?? null,
  };

  const response: InspectResponse = {
    input,
    normalized_input: pf.normalized,
    detected_type: scoring.detectedType,
    confidence: scoring.confidence,
    valid: scoring.detectedType !== 'unknown' && scoring.detectedType !== 'ambiguous',
    candidates: scoring.candidates,
    summary,
    details,
  };

  // Add error for non-ok results
  if (scoring.detectedType === 'unknown') {
    response.valid = false;
    const isBase64Unmatched = base64DecodedByteLength !== null && !decodedFromBase64;
    response.error = {
      code: 'UNKNOWN',
      message: isBase64Unmatched
        ? `Base64로 디코딩되었지만 (${base64DecodedByteLength}바이트) 알려진 ID 형식과 일치하지 않습니다`
        : '입력된 문자열의 ID 타입을 판별할 수 없습니다',
      hint: isBase64Unmatched
        ? `지원되는 바이트 길이: 8(Snowflake/TSID), 12(ObjectId/XID), 16(UUID/ULID), 20(KSUID)`
        : '지원되는 ID 형식을 확인해주세요',
    };
  } else if (scoring.detectedType === 'ambiguous') {
    response.valid = false;
    response.error = {
      code: 'AMBIGUOUS',
      message: '여러 ID 타입으로 해석될 수 있습니다',
      hint: '후보 목록을 확인해주세요',
    };
  }

  return response;
}

function makeErrorResponse(
  input: string,
  normalized: string,
  code: InspectError['code'],
  message: string,
  hint: string,
): InspectResponse {
  return {
    input,
    normalized_input: normalized,
    detected_type: 'unknown',
    confidence: 'unknown',
    valid: false,
    candidates: [],
    summary: {
      valid: false,
      detected_type: 'unknown',
      confidence: 'unknown',
      bit_length: null,
      sortable: null,
      timestamp: null,
      canonical: null,
    },
    details: {
      length: normalized.length,
      bit_length: null,
      byte_length: null,
      charset: 'unknown',
      encoding_detected: 'unknown',
      decoded_from_base64: false,
      separators: [],
      normalized_input: normalized,
      notes: [],
    },
    error: { code, message, hint },
  };
}
