import { useState, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { LABELS } from '../constants/i18n';

interface InputPanelProps {
  onAnalyze: (input: string, mode: 'analyze' | 'decode') => void;
}

export function InputPanel({ onAnalyze }: InputPanelProps) {
  const [value, setValue] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const debouncedAnalyze = useDebounce((text: string) => {
    if (text.trim().length > 0) {
      onAnalyze(text, 'analyze');
    }
  }, 500);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.slice(0, 512);
      setValue(newValue);
      if (autoAnalyze) {
        debouncedAnalyze(newValue);
      }
    },
    [autoAnalyze, debouncedAnalyze],
  );

  const handleActionClick = useCallback(() => {
    if (value.trim().length > 0) {
      onAnalyze(value, autoAnalyze ? 'analyze' : 'decode');
    }
  }, [value, onAnalyze, autoAnalyze]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleActionClick();
      }
    },
    [handleActionClick],
  );

  return (
    <section className="input-panel" aria-label="ID 입력">
      <div className="input-wrapper">
        <textarea
          className="input-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={LABELS.inputPlaceholder}
          rows={2}
          maxLength={512}
          aria-label="ID 입력"
        />
        <span className="char-count" aria-live="polite">
          {LABELS.charCount(value.length)}
        </span>
      </div>
      <div className="input-actions">
        <label className="auto-analyze-toggle">
          <input
            type="checkbox"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
          />
          자동 분석
        </label>
        <button
          className="analyze-button"
          onClick={handleActionClick}
          disabled={value.trim().length === 0}
        >
          {autoAnalyze ? LABELS.analyzeButton : LABELS.executeButton}
        </button>
      </div>
    </section>
  );
}
