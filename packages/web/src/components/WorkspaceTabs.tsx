import { useState } from 'react';
import type { MotionSample, SolveStatus } from 'physics-engine';
import { EquationBlock } from './equations/EquationBlock';
import { SolveStepsList } from './equations/SubstitutionLine';
import { DerivativeChain } from './equations/DerivativeChain';
import { GraphTabs } from './graphs/GraphTabs';

type TabId = 'graphs' | 'equations' | 'assumptions';

interface WorkspaceTabsProps {
  samples: MotionSample[];
  solveResult: SolveStatus;
  isProjectile?: boolean;
  g: number;
  mass: number;
}

export function WorkspaceTabs({ samples, solveResult, isProjectile, g, mass }: WorkspaceTabsProps) {
  const [tab, setTab] = useState<TabId>('graphs');

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['graphs', 'equations', 'assumptions'] as TabId[]).map((t) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'graphs' && <GraphTabs samples={samples} isProjectile={isProjectile} g={g} mass={mass} />}

      {tab === 'equations' && (
        <div>
          <EquationBlock latex="y = h_0 + v_0 t - \frac{1}{2} g t^2" description="Position under constant gravity" />
          <EquationBlock latex="v = v_0 - g t" description="Velocity under constant gravity" />
          <EquationBlock latex="E_k = \frac{1}{2} m v^2" description="Kinetic energy" />
          <EquationBlock latex="E_p = m g h" description="Gravitational potential energy" />
          <EquationBlock latex="F_g = m g" description="Gravitational force" />
          {solveResult.status === 'solved' && <SolveStepsList steps={solveResult.steps} />}
          <DerivativeChain />
        </div>
      )}

      {tab === 'assumptions' && (
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
          <li>Constant gravitational acceleration (g = {g} m/s² on this planet)</li>
          <li>No air resistance</li>
          <li>Point-like object</li>
          <li>Flat ground at y = 0</li>
          <li>SI units throughout</li>
          <li>Inverse solving applies to idealized model only</li>
        </ul>
      )}
    </div>
  );
}
