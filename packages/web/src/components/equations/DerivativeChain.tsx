import { useState } from 'react';
import { EquationBlock } from './EquationBlock';

export function DerivativeChain() {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel-section">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
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
