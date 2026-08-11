import { useState } from 'react';
import type { CelestialBodyId, MotionSample, SolveStatus } from 'physics-engine';
import { getCelestialBody } from 'physics-engine';
import { EquationBlock } from './equations/EquationBlock';
import { SolveStepsList } from './equations/SubstitutionLine';
import { DerivativeChain } from './equations/DerivativeChain';
import { GraphTabs } from './graphs/GraphTabs';

type TabId = 'graphs' | 'equations' | 'assumptions';

interface WorkspaceTabsProps {
  samples: MotionSample[];
  vacuumSamples?: MotionSample[];
  solveResult: SolveStatus;
  isProjectile?: boolean;
  g: number;
  mass: number;
  planet: CelestialBodyId;
  dragEnabled?: boolean;
  impactEnabled?: boolean;
}

export function WorkspaceTabs({
  samples,
  vacuumSamples,
  solveResult,
  isProjectile,
  g,
  mass,
  planet,
  dragEnabled,
  impactEnabled,
}: WorkspaceTabsProps) {
  const [tab, setTab] = useState<TabId>('graphs');
  const body = getCelestialBody(planet);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['graphs', 'equations', 'assumptions'] as TabId[]).map((t) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'graphs' && (
        <GraphTabs samples={samples} vacuumSamples={vacuumSamples} isProjectile={isProjectile} g={g} mass={mass} dragEnabled={dragEnabled} />
      )}

      {tab === 'equations' && (
        <div>
          <EquationBlock latex="y = h_0 + v_0 t - \frac{1}{2} g t^2" description="Position under constant gravity" />
          <EquationBlock latex="v = v_0 - g t" description="Velocity under constant gravity" />
          <EquationBlock latex="E_k = \frac{1}{2} m v^2" description="Kinetic energy" />
          <EquationBlock latex="E_p = m g h" description="Gravitational potential energy" />
          <EquationBlock latex="F_g = m g" description="Gravitational force" />
          {dragEnabled && (
            <>
              <EquationBlock latex="F_{drag} = \frac{1}{2} \rho C_d A v^2" description="Quadratic drag force" />
              <EquationBlock latex="v_t = \sqrt{\frac{2 m g}{\rho C_d A}}" description="Terminal velocity (vertical fall)" />
            </>
          )}
          {impactEnabled && (
            <>
              <EquationBlock latex="F_{avg} = \frac{\Delta p}{\Delta t}" description="Average impact force (stopping time)" />
              <EquationBlock latex="F_{avg} \approx \frac{m v^2}{2 d}" description="Average impact force (stopping distance)" />
              <EquationBlock latex="P = \frac{F}{A}" description="Impact pressure" />
            </>
          )}
          {solveResult.status === 'solved' && <SolveStepsList steps={solveResult.steps} />}
          <DerivativeChain />
        </div>
      )}

      {tab === 'assumptions' && (
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
          <li>
            {body ? `${body.name}: g = ${body.surfaceGravity} m/s²` : `Custom: g = ${g} m/s²`}
            {body && ` (${body.referenceNote})`}
          </li>
          <li>Constant g at object altitude; no variation with height</li>
          {dragEnabled ? (
            <>
              <li>Quadratic drag, constant ρ, no wind, lift, or spin</li>
              <li>Numerical RK4 integration with 0.05 s timestep</li>
            </>
          ) : (
            <li>No air resistance</li>
          )}
          <li>Point-like object</li>
          <li>Flat ground at y = 0</li>
          <li>SI units throughout</li>
          {!dragEnabled && <li>Inverse solving applies to idealized model only</li>}
          {impactEnabled && (
            <>
              <li>Rigid-body stopping model; uniform deceleration assumed</li>
              <li>Peak impact force can be much higher than average</li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
