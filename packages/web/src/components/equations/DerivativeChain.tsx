import { useState } from 'react';
import { EquationBlock } from './EquationBlock';

export function DerivativeChain() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ marginBottom: '0.5rem' }}>
        {open ? '▼' : '▶'} Derivatives and integrals
      </button>
      {open && (
        <div>
          <EquationBlock latex="a(t) = \frac{dv}{dt}" description="Acceleration is the derivative of velocity" />
          <EquationBlock latex="v(t) = \int a(t)\,dt" description="Velocity is the integral of acceleration" />
          <EquationBlock latex="v(t) = \frac{dh}{dt}" description="Velocity is the derivative of position" />
          <EquationBlock latex="h(t) = \int v(t)\,dt" description="Position is the integral of velocity" />
        </div>
      )}
    </div>
  );
}
