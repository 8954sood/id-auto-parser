import { useState, useCallback } from 'react';
import { inspect, decode } from './engine';
import type { InspectResponse, DecodeResult } from './types';
import { InputPanel } from './components/InputPanel';
import { ResultPanel } from './components/ResultPanel';
import { ErrorDisplay } from './components/ErrorDisplay';
import { DecodePanel } from './components/DecodePanel';

export default function App() {
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [charset, setCharset] = useState('utf-8');
  const [depth, setDepth] = useState(1);
  const [lastInput, setLastInput] = useState('');
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);

  const handleAction = useCallback((input: string, mode: 'analyze' | 'decode') => {
    setLastInput(input);
    setDecodeResult(null);
    setResult(null);

    const response = inspect(input, mode);

    if (mode === 'decode' && !response.valid) {
      // ID matching failed in decode mode → show pure decode result
      const dr = decode(input, charset, depth);
      setDecodeResult(dr);
    } else {
      setResult(response);
    }
  }, [charset, depth]);

  const updateDecode = (nextCharset: string, nextDepth: number) => {
    setCharset(nextCharset);
    setDepth(nextDepth);
    if (decodeResult && lastInput) setDecodeResult(decode(lastInput, nextCharset, nextDepth));
  };
  const hasError = result && !result.valid && result.error;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ID 자동 분석기</h1>
        <p className="app-subtitle">ID 문자열을 입력하면 타입을 자동 판별하고 구조를 분석합니다</p>
      </header>
      <main className="app-main">
        <InputPanel onAnalyze={handleAction} />
        {decodeResult && (
          <>
            <div className="input-actions">
              <label>문자 인코딩 <select aria-label="문자 인코딩" value={charset} onChange={e => updateDecode(e.target.value, depth)}>
                <option value="utf-8">UTF-8</option>
                <option value="utf-16le">UTF-16LE</option>
                <option value="utf-16be">UTF-16BE</option>
                <option value="euc-kr">EUC-KR / CP949</option>
              </select></label>
              <label>디코딩 단계 <select aria-label="디코딩 단계" value={depth} onChange={e => updateDecode(charset, Number(e.target.value))}>
                <option value={1}>1단계</option><option value={2}>2단계</option><option value={3}>3단계</option>
              </select></label>
            </div>
            <DecodePanel result={decodeResult} />
          </>
        )}
        {result && hasError && <ErrorDisplay response={result} />}
        {result && result.valid && <ResultPanel response={result} />}
      </main>
    </div>
  );
}
