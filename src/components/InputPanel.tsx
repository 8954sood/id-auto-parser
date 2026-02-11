import { useState, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { LABELS } from '../constants/i18n';

interface InputPanelProps {
  onAnalyze: (input: string, mode: 'analyze' | 'decode') => void;
}

export function InputPanel({ onAnalyze }: InputPanelProps) {
  const [value, setValue] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const modeRef = useRef(autoAnalyze);
  modeRef.current = autoAnalyze;

  const debouncedAction = useDebounce((text: string) => {
    if (text.trim().length > 0) {
      onAnalyze(text, modeRef.current ? 'analyze' : 'decode');
    }
  }, 300);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.slice(0, 2048);
      setValue(newValue);
      debouncedAction(newValue);
    },
    [debouncedAction],
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
          maxLength={2048}
          aria-label="ID 입력"
        />
        <span className="char-count" aria-live="polite">
          {LABELS.charCount(value.length)}
        </span>
      </div>
      <div className="input-actions">
        <label className="auto-analyze-toggle" title={LABELS.smartAnalysis.description}>
          <input
            type="checkbox"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
          />
          <span className="toggle-label">
            {LABELS.smartAnalysis.label}
            <span className="toggle-description">{LABELS.smartAnalysis.description}</span>
          </span>
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
