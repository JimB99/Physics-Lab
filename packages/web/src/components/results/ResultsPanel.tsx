import type { ReactNode } from 'react';
import { formatNumber } from 'physics-engine';

export interface ResultItem {
  label: string;
  value: number | undefined;
  unit?: string;
  multi?: number[];
}

interface ResultsPanelProps {
  items: ResultItem[];
  error?: string;
  hint?: string;
  actions?: ReactNode;
}

export function ResultsPanel({ items, error, hint, actions }: ResultsPanelProps) {
  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Results</h3>
      {error && <p className="error">{error}</p>}
      {hint && <p className="muted" style={{ fontSize: '0.8rem' }}>{hint}</p>}
      <dl className="results-list">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="muted" style={{ fontSize: '0.8rem' }}>{item.label}</dt>
            <dd style={{ margin: '0.1rem 0 0', fontFamily: 'var(--mono)', fontSize: '1rem' }}>
              {item.multi && item.multi.length > 1 ? (
                item.multi.map((v, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {formatNumber(v)}
                  </span>
                ))
              ) : item.value !== undefined ? (
                <>
                  {formatNumber(item.value)}
                  {item.unit && <span className="muted"> {item.unit}</span>}
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>
        ))}
      </dl>
      {actions}
    </div>
  );
}
