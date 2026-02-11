import type { Details } from '../types';
import { LABELS } from '../constants/i18n';

interface DetailsTabProps {
  details: Details;
}

export function DetailsTab({ details }: DetailsTabProps) {
  return (
    <div className="details-tab">
      <dl className="detail-fields">
        <div className="field-row">
          <dt>{LABELS.detailFields.length}</dt>
          <dd>{details.length}</dd>
        </div>
        {details.bit_length !== null && (
          <div className="field-row">
            <dt>{LABELS.detailFields.bit_length}</dt>
            <dd>{details.bit_length}bit</dd>
          </div>
        )}
        {details.byte_length !== null && (
          <div className="field-row">
            <dt>{LABELS.detailFields.byte_length}</dt>
            <dd>{details.byte_length}B</dd>
          </div>
        )}
        <div className="field-row">
          <dt>{LABELS.detailFields.charset}</dt>
          <dd>{details.charset}</dd>
        </div>
        <div className="field-row">
          <dt>{LABELS.detailFields.encoding_detected}</dt>
          <dd>{details.encoding_detected}</dd>
        </div>
        <div className="field-row">
          <dt>{LABELS.detailFields.decoded_from_base64}</dt>
          <dd>{LABELS.boolean[details.decoded_from_base64 ? 'true' : 'false']}</dd>
        </div>
        {details.separators.length > 0 && (
          <div className="field-row">
            <dt>{LABELS.detailFields.separators}</dt>
            <dd>{details.separators.map((s) => JSON.stringify(s)).join(', ')}</dd>
          </div>
        )}
        <div className="field-row">
          <dt>{LABELS.detailFields.normalized_input}</dt>
          <dd className="mono">{details.normalized_input}</dd>
        </div>
      </dl>

      {details.type_specific && (
        <div className="type-specific-section">
          <h3>타입 상세 정보</h3>
          <dl className="detail-fields">
            {Object.entries(details.type_specific).map(([key, val]) => (
              <div className="field-row" key={key}>
                <dt>{key}</dt>
                <dd className="mono">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {details.notes.length > 0 && (
        <div className="notes-section">
          <h3>{LABELS.detailFields.notes}</h3>
          <ul>
            {details.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
