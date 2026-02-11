import { useState } from 'react';
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

const ENCODING_COLORS: Record<string, string> = {
  base64: 'badge-blue',
  hex: 'badge-green',
  base32std: 'badge-purple',
  base32: 'badge-purple',
  base32hex: 'badge-purple',
  base58: 'badge-orange',
  base62: 'badge-orange',
};

function EncodingBadge({ encoding }: { encoding: string }) {
  return (
    <span className={`encoding-badge ${ENCODING_COLORS[encoding] ?? 'badge-gray'}`}>
      {encoding.toUpperCase()}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useClipboard();
  return (
    <button className="copy-button" onClick={() => copy(text)}>
      {copied ? LABELS.copied : LABELS.copy}
    </button>
  );
}

function PrimaryEntry({ entry }: { entry: DecodedEntry }) {
  const dm = LABELS.decodeMode;
  const nonPrintable = entry.decoded_text !== null && hasNonPrintable(entry.decoded_text);

  return (
    <div className="decode-primary">
      <div className="decode-primary-header">
        <EncodingBadge encoding={entry.encoding} />
        <span className="decode-meta">
          {entry.byte_length} bytes ({entry.bit_length}bit)
        </span>
      </div>

      {entry.decoded_text !== null && (
        <div className="decode-block">
          <div className="decode-block-header">
            <span className="decode-block-label">
              {dm.utf8Text}
              {nonPrintable && <span className="decode-warning-badge">{dm.nonPrintable}</span>}
            </span>
            <CopyButton text={entry.decoded_text} />
          </div>
          <pre className="decode-block-value">{entry.decoded_text}</pre>
        </div>
      )}

      <div className="decode-block">
        <div className="decode-block-header">
          <span className="decode-block-label">{dm.hexString}</span>
          <CopyButton text={entry.hex_string} />
        </div>
        <pre className="decode-block-value decode-hex">{entry.hex_string}</pre>
      </div>
    </div>
  );
}

function AltEntry({ entry }: { entry: DecodedEntry }) {
  const dm = LABELS.decodeMode;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="decode-alt">
      <button className="decode-alt-header" onClick={() => setExpanded(!expanded)}>
        <div className="decode-alt-left">
          <span className={`decode-alt-arrow ${expanded ? 'expanded' : ''}`}>&#9654;</span>
          <EncodingBadge encoding={entry.encoding} />
          <span className="decode-meta">
            {entry.byte_length} bytes
          </span>
        </div>
        {entry.decoded_text !== null && !expanded && (
          <span className="decode-alt-preview">{entry.decoded_text.slice(0, 30)}{entry.decoded_text.length > 30 ? '...' : ''}</span>
        )}
      </button>
      {expanded && (
        <div className="decode-alt-body">
          {entry.decoded_text !== null && (
            <div className="decode-block">
              <div className="decode-block-header">
                <span className="decode-block-label">{dm.utf8Text}</span>
                <CopyButton text={entry.decoded_text} />
              </div>
              <pre className="decode-block-value">{entry.decoded_text}</pre>
            </div>
          )}
          <div className="decode-block">
            <div className="decode-block-header">
              <span className="decode-block-label">{dm.hexString}</span>
              <CopyButton text={entry.hex_string} />
            </div>
            <pre className="decode-block-value decode-hex">{entry.hex_string}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function DecodePanel({ result }: DecodePanelProps) {
  const dm = LABELS.decodeMode;

  if (result.error) {
    return (
      <section className="decode-panel" aria-label="디코딩 결과">
        <div className="decode-error-card">
          <div className="decode-error-icon">?</div>
          <span className="decode-error-text">{result.error}</span>
        </div>
      </section>
    );
  }

  const [primary, ...alternatives] = result.entries;

  return (
    <section className="decode-panel" aria-label="디코딩 결과">
      <PrimaryEntry entry={primary} />
      {alternatives.length > 0 && (
        <div className="decode-alternatives">
          <h3 className="decode-alternatives-title">{dm.otherInterpretations}</h3>
          {alternatives.map((entry) => (
            <AltEntry key={entry.encoding} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
