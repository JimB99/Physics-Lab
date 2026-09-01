import type { ComparisonSeries } from 'physics-engine';
import { formatNumber, summarizeSamples } from 'physics-engine';

interface CompareSummaryTableProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

export function CompareSummaryTable({ series, isProjectile }: CompareSummaryTableProps) {
  const rows = series.map((s) => ({
    label: s.label,
    color: s.color,
    summary: summarizeSamples(s.samples),
  }));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr className="muted">
            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Variant</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Flight time (s)</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Impact speed (m/s)</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Max height (m)</th>
            {isProjectile && <th style={{ textAlign: 'right', padding: '0.35rem' }}>Range (m)</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={{ padding: '0.35rem', color: row.color }}>{row.label}</td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.flightTime, 2) : '—'}
              </td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.impactSpeed, 2) : '—'}
              </td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.maxHeight, 2) : '—'}
              </td>
              {isProjectile && (
                <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                  {row.summary?.horizontalDistance !== undefined
                    ? formatNumber(row.summary.horizontalDistance, 2)
                    : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
