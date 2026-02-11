import { useState } from 'react';
import type { InspectResponse } from '../types';
import { LABELS } from '../constants/i18n';
import { SummaryTab } from './SummaryTab';
import { DetailsTab } from './DetailsTab';
import { JsonTab } from './JsonTab';

interface ResultPanelProps {
  response: InspectResponse;
}

type Tab = 'summary' | 'details' | 'json';

export function ResultPanel({ response }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  return (
    <section className="result-panel" aria-label="분석 결과">
      <nav className="tab-bar" role="tablist">
        {(['summary', 'details', 'json'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {LABELS.tabs[tab]}
          </button>
        ))}
      </nav>
      <div className="tab-content" role="tabpanel">
        {activeTab === 'summary' && <SummaryTab summary={response.summary} />}
        {activeTab === 'details' && <DetailsTab details={response.details} />}
        {activeTab === 'json' && <JsonTab response={response} />}
      </div>
    </section>
  );
}
