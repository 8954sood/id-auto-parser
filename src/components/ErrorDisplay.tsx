import type { InspectResponse } from '../types';
import { LABELS } from '../constants/i18n';

interface ErrorDisplayProps {
  response: InspectResponse;
}

export function ErrorDisplay({ response }: ErrorDisplayProps) {
  const error = response.error;
  if (!error) return null;

  const isAmbiguous = error.code === 'AMBIGUOUS';
  const successfulCandidates = response.candidates
    .filter((c) => c.ok && c.score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <section className="error-display" role="alert">
      <div className="error-icon">!</div>
      <div className="error-content">
        <p className="error-message">{error.message}</p>
        {error.hint && <p className="error-hint">{error.hint}</p>}

        {isAmbiguous && successfulCandidates.length > 0 && (
          <div className="candidates-list">
            <h3>{LABELS.ambiguousCandidates}</h3>
            <ul>
              {successfulCandidates.map((c) => (
                <li key={c.type} className="candidate-item">
                  <span className="candidate-type">{c.type}</span>
                  <span className="candidate-score">
                    {(c.score * 100).toFixed(0)}%
                  </span>
                  {c.evidence && c.evidence.length > 0 && (
                    <ul className="candidate-evidence">
                      {c.evidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
