import type { Summary } from '../types';
import { LABELS } from '../constants/i18n';
import { useClipboard } from '../hooks/useClipboard';

interface SummaryTabProps {
  summary: Summary;
}

export function SummaryTab({ summary }: SummaryTabProps) {
  const { copy, copied } = useClipboard();

  const summaryText = Object.entries({
    [LABELS.summaryFields.detected_type]: summary.detected_type,
    [LABELS.summaryFields.confidence]: LABELS.confidence[summary.confidence as keyof typeof LABELS.confidence] ?? summary.confidence,
    [LABELS.summaryFields.bit_length]: summary.bit_length !== null ? `${summary.bit_length}bit` : '-',
    [LABELS.summaryFields.sortable]: summary.sortable === null ? '-' : LABELS.sortable[String(summary.sortable) as keyof typeof LABELS.sortable],
    [LABELS.summaryFields.timestamp]: summary.timestamp ?? '-',
    [LABELS.summaryFields.canonical]: summary.canonical ?? '-',
  })
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return (
    <div className="summary-tab">
      <div className="summary-header">
        <span className={`confidence-badge confidence-${summary.confidence}`}>
          {LABELS.confidence[summary.confidence as keyof typeof LABELS.confidence] ?? summary.confidence}
        </span>
        <button className="copy-button" onClick={() => copy(summaryText)}>
          {copied ? LABELS.copied : LABELS.copy}
        </button>
      </div>
      <dl className="summary-fields">
        <div className="field-row">
          <dt>{LABELS.summaryFields.detected_type}</dt>
          <dd className="type-value">{summary.detected_type}</dd>
        </div>
        <div className="field-row">
          <dt>{LABELS.summaryFields.confidence}</dt>
          <dd>{LABELS.confidence[summary.confidence as keyof typeof LABELS.confidence] ?? summary.confidence}</dd>
        </div>
        {summary.bit_length !== null && (
          <div className="field-row">
            <dt>{LABELS.summaryFields.bit_length}</dt>
            <dd>{summary.bit_length}bit</dd>
          </div>
        )}
        {summary.sortable !== null && (
          <div className="field-row">
            <dt>{LABELS.summaryFields.sortable}</dt>
            <dd>{LABELS.sortable[String(summary.sortable) as keyof typeof LABELS.sortable]}</dd>
          </div>
        )}
        {summary.timestamp && (
          <div className="field-row">
            <dt>{LABELS.summaryFields.timestamp}</dt>
            <dd className="mono">{summary.timestamp}</dd>
          </div>
        )}
        {summary.canonical && (
          <div className="field-row">
            <dt>{LABELS.summaryFields.canonical}</dt>
            <dd className="mono">{summary.canonical}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
