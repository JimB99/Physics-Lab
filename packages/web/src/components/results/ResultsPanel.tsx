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
}

export function ResultsPanel({ items, error, hint }: ResultsPanelProps) {
  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Results</h3>
      {error && <p className="error">{error}</p>}
      {hint && <p className="muted" style={{ fontSize: '0.85rem' }}>{hint}</p>}
      <dl style={{ margin: 0 }}>
        {items.map((item) => (
          <div key={item.label} style={{ marginBottom: '0.6rem' }}>
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
    </div>
  );
}
