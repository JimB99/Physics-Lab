import type { ComparisonSeries } from 'physics-engine';
import { UPlotChart } from '../graphs/UPlotChart';

interface CompareGraphsProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

export function CompareGraphs({ series, isProjectile }: CompareGraphsProps) {
  if (series.length === 0) return <p className="muted">Configure variants to compare.</p>;

  let maxLen = 0;
  for (const s of series) maxLen = Math.max(maxLen, s.samples.length);
  const longest = series.find((s) => s.samples.length === maxLen) ?? series[0]!;
  const xData = Array.from({ length: maxLen }, (_, i) => longest.samples[i]?.t ?? i * 0.05);

  return (
    <div>
      {isProjectile ? (
        <>
          {series.map((s) => (
            <UPlotChart
              key={s.label}
              title={`Trajectory — ${s.label}`}
              xLabel="x (m)"
              yLabel="y (m)"
              xData={s.samples.map((p) => p.x)}
              series={[{ label: s.label, data: s.samples.map((p) => p.y), color: s.color }]}
            />
          ))}
          <UPlotChart
            title="Height vs time"
            xLabel="t (s)"
            yLabel="y (m)"
            xData={xData}
            series={series.map((s) => ({
              label: s.label,
              data: xData.map((_, i) => s.samples[i]?.y ?? null) as unknown as number[],
              color: s.color,
            }))}
          />
        </>
      ) : (
        <UPlotChart
          title="Height comparison"
          xLabel="t (s)"
          yLabel="y (m)"
          xData={xData}
          series={series.map((s) => ({
            label: s.label,
            data: xData.map((_, i) => s.samples[i]?.y ?? null) as unknown as number[],
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
          data: xData.map((_, i) => s.samples[i]?.speed ?? null) as unknown as number[],
          color: s.color,
        }))}
      />
    </div>
  );
}
