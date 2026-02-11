import type { DecodeResult, DecodedEntry } from '../types';
import { useClipboard } from '../hooks/useClipboard';
import { LABELS } from '../constants/i18n';

interface DecodePanelProps {
  result: DecodeResult;
}

function hasNonPrintable(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0e-\x1f\x7f]/.test(text);
}

function EntryCard({ entry }: { entry: DecodedEntry }) {
  const textClip = useClipboard();
  const hexClip = useClipboard();
  const dm = LABELS.decodeMode;

  return (
    <div className="decode-entry">
      <dl className="decode-fields">
        <div className="field-row">
          <dt>{dm.encoding}</dt>
          <dd><span className="type-value">{entry.encoding.toUpperCase()}</span></dd>
        </div>
        <div className="field-row">
          <dt>{dm.byteLength}</dt>
          <dd className="mono">{entry.byte_length} ({entry.bit_length}bit)</dd>
        </div>
      </dl>

      {entry.decoded_text !== null && (
        <div className="decode-section">
          <div className="decode-section-header">
            <span className="decode-section-label">
              {dm.utf8Text}
              {hasNonPrintable(entry.decoded_text) && (
                <span className="decode-warning"> {dm.nonPrintable}</span>
              )}
            </span>
            <button className="copy-button" onClick={() => textClip.copy(entry.decoded_text!)}>
              {textClip.copied ? LABELS.copied : LABELS.copy}
            </button>
          </div>
          <pre className="decode-value">{entry.decoded_text}</pre>
        </div>
      )}

      <div className="decode-section">
        <div className="decode-section-header">
          <span className="decode-section-label">{dm.hexString}</span>
          <button className="copy-button" onClick={() => hexClip.copy(entry.hex_string)}>
            {hexClip.copied ? LABELS.copied : LABELS.copy}
          </button>
        </div>
        <pre className="decode-value">{entry.hex_string}</pre>
      </div>
    </div>
  );
}

export function DecodePanel({ result }: DecodePanelProps) {
  if (result.error) {
    return (
      <div className="decode-panel">
        <div className="decode-error">{result.error}</div>
      </div>
    );
  }

  return (
    <div className="decode-panel">
      {result.entries.map((entry) => (
        <EntryCard key={entry.encoding} entry={entry} />
      ))}
    </div>
  );
}
