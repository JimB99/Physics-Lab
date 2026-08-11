import type { ComparisonSeries } from 'physics-engine';
import { UPlotChart } from '../graphs/UPlotChart';

interface CompareGraphsProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

export function CompareGraphs({ series, isProjectile }: CompareGraphsProps) {
  if (series.length === 0) return <p className="muted">Configure variants to compare.</p>;

  const maxLen = Math.max(...series.map((s) => s.samples.length));
  const xData = Array.from({ length: maxLen }, (_, i) => series[0]!.samples[i]?.t ?? i * 0.05);

  return (
    <div>
      {isProjectile ? (
        <UPlotChart
          title="Trajectory comparison"
          xLabel="x (m)"
          yLabel="y (m)"
          xData={series[0]!.samples.map((s) => s.x)}
          series={series.map((s) => ({ label: s.label, data: s.samples.map((p) => p.y), color: s.color }))}
        />
      ) : (
        <UPlotChart
          title="Height comparison"
          xLabel="t (s)"
          yLabel="y (m)"
          xData={xData}
          series={series.map((s) => ({
            label: s.label,
            data: xData.map((_, i) => s.samples[i]?.y ?? NaN),
            color: s.color,
          }))}
        />
      )}
      <UPlotChart
        title="Velocity magnitude"
        xLabel="t (s)"
        yLabel="|v| (m/s)"
        xData={xData}
        series={series.map((s) => ({
          label: s.label,
          data: xData.map((_, i) => s.samples[i]?.speed ?? NaN),
          color: s.color,
        }))}
      />
    </div>
  );
}
