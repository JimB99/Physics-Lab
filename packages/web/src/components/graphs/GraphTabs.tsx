import { useMemo, useState } from 'react';
import type { MotionSample } from 'physics-engine';
import { terminalVelocity } from 'physics-engine';
import { UPlotChart } from './UPlotChart';
import { TabStrip } from '../layout/TabStrip';

type GraphKind = 'position' | 'velocity' | 'acceleration' | 'energy' | 'trajectory' | 'forces' | 'compare';

interface GraphTabsProps {
  samples: MotionSample[];
  vacuumSamples?: MotionSample[];
  isProjectile?: boolean;
  g: number;
  mass: number;
  dragEnabled?: boolean;
  rho?: number;
  cd?: number;
  area?: number;
}

export function GraphTabs({ samples, vacuumSamples, isProjectile = false, g, mass, dragEnabled, rho, cd, area }: GraphTabsProps) {
  const tabs: { id: GraphKind; label: string }[] = useMemo(
    () => [
      ...(dragEnabled ? [{ id: 'compare' as GraphKind, label: 'Vacuum vs drag' }] : []),
      ...(isProjectile
        ? [
            { id: 'trajectory' as GraphKind, label: 'Trajectory' },
            { id: 'velocity' as GraphKind, label: 'Velocity' },
            { id: 'energy' as GraphKind, label: 'Energy' },
            { id: 'forces' as GraphKind, label: 'Forces' },
          ]
        : [
            { id: 'position' as GraphKind, label: 'Position' },
            { id: 'velocity' as GraphKind, label: 'Velocity' },
            { id: 'acceleration' as GraphKind, label: 'Acceleration' },
            { id: 'energy' as GraphKind, label: 'Energy' },
            { id: 'forces' as GraphKind, label: 'Forces' },
          ]),
    ],
    [dragEnabled, isProjectile],
  );

  const [requestedTab, setRequestedTab] = useState<GraphKind>(tabs[0]!.id);
  const tab = tabs.some((t) => t.id === requestedTab) ? requestedTab : tabs[0]!.id;

  const vTerminal =
    dragEnabled && rho !== undefined && cd !== undefined && area !== undefined && area > 0 && rho > 0
      ? terminalVelocity(mass, g, rho, cd, area)
      : null;

  const t = samples.map((s) => s.t);
  const vac = vacuumSamples ?? samples;

  return (
    <div>
      <TabStrip ariaLabel="Graph type" tabs={tabs} active={tab} onChange={setRequestedTab} />

      {dragEnabled && (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          With drag, total mechanical energy decreases over time.
        </p>
      )}
      {!dragEnabled && samples.length > 0 && (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Total mechanical energy is constant (idealized model, no air resistance).
        </p>
      )}

      {tab === 'compare' && dragEnabled && (
        <>
          <UPlotChart
            title="Height: vacuum vs drag"
            xLabel="t (s)"
            yLabel="y (m)"
            xData={vac.map((s) => s.t)}
            series={[
              { label: 'vacuum', data: vac.map((s) => s.y), color: '#4da3ff' },
              { label: 'drag', data: samples.map((s) => s.y), color: '#f0b429' },
            ]}
          />
          {isProjectile && (
            <UPlotChart
              title="Horizontal position: vacuum vs drag"
              xLabel="t (s)"
              yLabel="x (m)"
              xData={vac.map((s) => s.t)}
              series={[
                { label: 'vacuum', data: vac.map((s) => s.x), color: '#4da3ff' },
                { label: 'drag', data: samples.map((s) => s.x), color: '#f0b429' },
              ]}
            />
          )}
          <UPlotChart
            title="Total energy"
            xLabel="t (s)"
            yLabel="E (J)"
            xData={samples.map((s) => s.t)}
            series={[
              { label: 'vacuum E', data: vac.map((s) => s.totalMechanicalEnergy), color: '#4da3ff' },
              { label: 'drag E', data: samples.map((s) => s.totalMechanicalEnergy), color: '#f87171' },
            ]}
          />
        </>
      )}

      {tab === 'position' && !isProjectile && (
        <UPlotChart title="Height vs time" xLabel="t (s)" yLabel="y (m)" xData={t} series={[{ label: 'y', data: samples.map((s) => s.y), color: '#4da3ff' }]} />
      )}

      {tab === 'trajectory' && isProjectile && (
        <UPlotChart title="Trajectory" xLabel="x (m)" yLabel="y (m)" xData={samples.map((s) => s.x)} series={[{ label: 'path', data: samples.map((s) => s.y), color: '#4da3ff' }]} />
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
              : [
                  { label: 'v', data: samples.map((s) => s.vy), color: '#4da3ff' },
                  ...(vTerminal !== null && Number.isFinite(vTerminal)
                    ? [
                        {
                          label: 'terminal −v_t',
                          data: samples.map(() => -vTerminal),
                          color: '#f87171',
                        },
                      ]
                    : []),
                ]
          }
        />
      )}
      {tab === 'velocity' && vTerminal !== null && Number.isFinite(vTerminal) && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Terminal velocity v_t = √(2mg / ρC_dA) = {vTerminal.toFixed(2)} m/s. A falling object
          approaches −v_t asymptotically and never exceeds it.
        </p>
      )}

      {tab === 'acceleration' && !isProjectile && (
        <UPlotChart title="Acceleration vs time" xLabel="t (s)" yLabel="a (m/s²)" xData={t} series={[{ label: 'ay', data: samples.map((s) => s.ay), color: '#f87171' }]} />
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
            ...(dragEnabled && samples.length > 0
              ? [
                  {
                    label: 'E lost to drag',
                    data: samples.map(
                      (s) => samples[0]!.totalMechanicalEnergy - s.totalMechanicalEnergy,
                    ),
                    color: '#f87171',
                  },
                ]
              : []),
          ]}
        />
      )}

      {tab === 'forces' && (
        <UPlotChart
          title="Forces vs time"
          xLabel="t (s)"
          yLabel="F (N)"
          xData={t}
          series={[
            { label: 'Fg', data: samples.map(() => mass * g), color: '#4da3ff' },
            ...(dragEnabled
              ? [
                  { label: 'Fdrag', data: samples.map((s) => s.dragForce ?? 0), color: '#f0b429' },
                  { label: 'Fnet', data: samples.map((s) => s.netForce ?? mass * g), color: '#f87171' },
                ]
              : [{ label: 'Fnet', data: samples.map(() => mass * g), color: '#f87171' }]),
          ]}
        />
      )}
    </div>
  );
}
