import type { InspectResponse } from '../types';
import { useClipboard } from '../hooks/useClipboard';
import { LABELS } from '../constants/i18n';

interface JsonTabProps {
  response: InspectResponse;
}

export function JsonTab({ response }: JsonTabProps) {
  const { copy, copied } = useClipboard();
  const json = JSON.stringify(response, null, 2);

  return (
    <div className="json-tab">
      <div className="json-header">
        <button className="copy-button" onClick={() => copy(json)}>
          {copied ? LABELS.copied : LABELS.copy}
        </button>
      </div>
      <pre className="json-content"><code>{json}</code></pre>
    </div>
  );
}
