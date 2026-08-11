import type { PlanetId } from 'physics-engine';
import { NumberField } from './NumberField';
import { PlanetSelector } from './PlanetSelector';

interface EnvironmentPanelProps {
  planet: PlanetId;
  customG: number;
  mass: number;
  onPlanetChange: (planet: PlanetId) => void;
  onCustomGChange: (g: number) => void;
  onMassChange: (mass: number) => void;
}

export function EnvironmentPanel({
  planet,
  customG,
  mass,
  onPlanetChange,
  onCustomGChange,
  onMassChange,
}: EnvironmentPanelProps) {
  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Environment</h3>
      <PlanetSelector
        planet={planet}
        customG={customG}
        onPlanetChange={onPlanetChange}
        onCustomGChange={onCustomGChange}
      />
      <NumberField label="Object mass" unit="kg" value={mass} min={0.001} step={0.1} onChange={onMassChange} />
    </div>
  );
}
