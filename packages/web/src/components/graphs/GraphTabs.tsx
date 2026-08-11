import { useState } from 'react';
import type { MotionSample } from 'physics-engine';
import { UPlotChart } from './UPlotChart';

type GraphKind = 'position' | 'velocity' | 'acceleration' | 'energy' | 'trajectory' | 'forces';

interface GraphTabsProps {
  samples: MotionSample[];
  isProjectile?: boolean;
  g: number;
  mass: number;
}

export function GraphTabs({ samples, isProjectile = false, g, mass }: GraphTabsProps) {
  const [tab, setTab] = useState<GraphKind>('position');
  const t = samples.map((s) => s.t);

  const tabs: { id: GraphKind; label: string }[] = isProjectile
    ? [
        { id: 'trajectory', label: 'Trajectory' },
        { id: 'velocity', label: 'Velocity' },
        { id: 'energy', label: 'Energy' },
        { id: 'forces', label: 'Forces' },
      ]
    : [
        { id: 'position', label: 'Position' },
        { id: 'velocity', label: 'Velocity' },
        { id: 'acceleration', label: 'Acceleration' },
        { id: 'energy', label: 'Energy' },
        { id: 'forces', label: 'Forces' },
      ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {tabs.map((tb) => (
          <button key={tb.id} type="button" className={tab === tb.id ? 'active' : ''} onClick={() => setTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {samples.length > 0 && (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Total mechanical energy is constant (idealized model, no air resistance).
        </p>
      )}

      {tab === 'position' && !isProjectile && (
        <UPlotChart
          title="Height vs time"
          xLabel="t (s)"
          yLabel="y (m)"
          xData={t}
          series={[{ label: 'y', data: samples.map((s) => s.y), color: '#4da3ff' }]}
        />
      )}

      {tab === 'trajectory' && isProjectile && (
        <UPlotChart
          title="Trajectory"
          xLabel="x (m)"
          yLabel="y (m)"
          xData={samples.map((s) => s.x)}
          series={[{ label: 'path', data: samples.map((s) => s.y), color: '#4da3ff' }]}
        />
      )}

      {tab === 'velocity' && (
        <UPlotChart
          title={isProjectile ? 'Velocity components' : 'Velocity vs time'}
          xLabel="t (s)"
          yLabel="v (m/s)"
          xData={t}
          series={
            isProjectile
              ? [
                  { label: 'vx', data: samples.map((s) => s.vx), color: '#4da3ff' },
                  { label: 'vy', data: samples.map((s) => s.vy), color: '#3dd68c' },
                  { label: '|v|', data: samples.map((s) => s.speed), color: '#f0b429' },
                ]
              : [{ label: 'v', data: samples.map((s) => s.vy), color: '#4da3ff' }]
          }
        />
      )}

      {tab === 'acceleration' && !isProjectile && (
        <UPlotChart
          title="Acceleration vs time"
          xLabel="t (s)"
          yLabel="a (m/s²)"
          xData={t}
          series={[{ label: 'ay', data: samples.map((s) => s.ay), color: '#f87171' }]}
        />
      )}

      {tab === 'energy' && (
        <UPlotChart
          title="Energy vs time"
          xLabel="t (s)"
          yLabel="E (J)"
          xData={t}
          series={[
            { label: 'Ek', data: samples.map((s) => s.kineticEnergy), color: '#4da3ff' },
            { label: 'Ep', data: samples.map((s) => s.potentialEnergy), color: '#3dd68c' },
            { label: 'Etotal', data: samples.map((s) => s.totalMechanicalEnergy), color: '#f0b429' },
          ]}
        />
      )}

      {tab === 'forces' && (
        <UPlotChart
          title="Gravitational force vs time"
          xLabel="t (s)"
          yLabel="F (N)"
          xData={t}
          series={[
            { label: 'Fg', data: samples.map(() => mass * g), color: '#4da3ff' },
          ]}
        />
      )}
    </div>
  );
}
