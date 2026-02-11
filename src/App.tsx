import { useState, useCallback } from 'react';
import { inspect, decode } from './engine';
import type { InspectResponse, DecodeResult } from './types';
import { InputPanel } from './components/InputPanel';
import { ResultPanel } from './components/ResultPanel';
import { ErrorDisplay } from './components/ErrorDisplay';
import { DecodePanel } from './components/DecodePanel';

export default function App() {
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);

  const handleAction = useCallback((input: string, mode: 'analyze' | 'decode') => {
    setDecodeResult(null);
    setResult(null);

    const response = inspect(input, mode);

    if (mode === 'decode' && !response.valid) {
      // ID matching failed in decode mode → show pure decode result
      const dr = decode(input);
      setDecodeResult(dr);
    } else {
      setResult(response);
    }
  }, []);

  const hasError = result && !result.valid && result.error;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ID 자동 분석기</h1>
        <p className="app-subtitle">ID 문자열을 입력하면 타입을 자동 판별하고 구조를 분석합니다</p>
      </header>
      <main className="app-main">
        <InputPanel onAnalyze={handleAction} />
        {decodeResult && <DecodePanel result={decodeResult} />}
        {result && hasError && <ErrorDisplay response={result} />}
        {result && result.valid && <ResultPanel response={result} />}
      </main>
    </div>
  );
}
