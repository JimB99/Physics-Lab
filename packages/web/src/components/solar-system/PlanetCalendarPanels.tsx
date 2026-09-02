import { useState } from 'react';
import type { AlignmentMetric, DisplayScaleMode, PlanetPosition } from 'physics-engine';
import { formatNumber, metricLabel } from 'physics-engine';
import { EquationBlock } from '../equations/EquationBlock';
import { TabStrip } from '../layout/TabStrip';

type TabId = 'equations' | 'assumptions';

interface PlanetCalendarTabsProps {
  scaleMode: DisplayScaleMode;
  alignmentMetric: AlignmentMetric;
}

export function PlanetCalendarTabs({ scaleMode, alignmentMetric }: PlanetCalendarTabsProps) {
  const [tab, setTab] = useState<TabId>('equations');

  return (
    <div>
      <TabStrip
        ariaLabel="Planet calendar detail"
        tabs={[
          { id: 'equations', label: 'Equations' },
          { id: 'assumptions', label: 'Assumptions' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'equations' && (
        <div>
          <EquationBlock
            latex="\vec{r}(t) = \mathrm{HelioVector}(\mathrm{body}, t)"
            description="Heliocentric position from VSOP87 via astronomy-engine"
          />
          <EquationBlock
            latex="(x, y, z)_{\mathrm{ecl}} = \mathrm{Ecliptic}(\vec{r})"
            description="Projected into the true ecliptic of date (AU)"
          />
          <EquationBlock
            latex="\lambda = \mathrm{atan2}(y, x)"
            description="Ecliptic longitude used for schematic orbit angles"
          />
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Alignment metric: {metricLabel(alignmentMetric)}
          </p>
        </div>
      )}

      {tab === 'assumptions' && (
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
          <li>Positions from astronomy-engine (VSOP87 theory), not a live API</li>
          <li>Heliocentric, true ecliptic of date; Sun fixed at origin</li>
          <li>
            Display scale:{' '}
            {scaleMode === 'true'
              ? 'true AU in the ecliptic plane'
              : scaleMode === 'log'
                ? 'log₁₀ of the true distance, with accurate ecliptic angles'
                : 'fixed schematic radii with accurate ecliptic angles'}
          </li>
          <li>Moon, Pluto, and asteroids are not shown in this view</li>
          <li>Alignment search uses fixed-budget optimization (coarse grid + golden-section refine), not day stepping</li>
          <li>Final cluster score uses true 3D AU distances regardless of display scale</li>
          <li>UTC noon dates to reduce timezone drift</li>
        </ul>
      )}
    </div>
  );
}

export function ScaleEducationCallout({ scaleMode }: { scaleMode: DisplayScaleMode }) {
  return (
    <p className="muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0 0.5rem' }}>
      {scaleMode === 'true'
        ? 'True AU distances — inner planets crowd near the Sun.'
        : scaleMode === 'log'
          ? 'Log radii keep Mercury and Neptune both visible. Angles are still VSOP87.'
          : 'Evenly spaced orbits for readability. Angles are still VSOP87.'}{' '}
      Alignment scores always use true 3D AU (or degrees for the Sun-axis metric).
    </p>
  );
}

interface PlanetCalendarResultsProps {
  positions: PlanetPosition[];
  highlightId?: string | null;
  footer?: string;
}

export function PlanetCalendarResults({ positions, highlightId, footer }: PlanetCalendarResultsProps) {
  const planets = positions.filter((p) => p.id !== 'sun');

  return (
    <div>
      <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Ecliptic state</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr className="muted">
              <th style={{ textAlign: 'left', padding: '0.25rem' }}>Body</th>
              <th style={{ textAlign: 'right', padding: '0.25rem' }}>λ (°)</th>
              <th style={{ textAlign: 'right', padding: '0.25rem' }}>β (°)</th>
              <th style={{ textAlign: 'right', padding: '0.25rem' }}>r (AU)</th>
            </tr>
          </thead>
          <tbody>
            {planets.map((p) => (
              <tr
                key={p.id}
                style={{
                  color: highlightId === p.id ? p.color : undefined,
                  fontWeight: highlightId === p.id ? 600 : 400,
                }}
              >
                <td style={{ padding: '0.25rem' }}>{p.name}</td>
                <td style={{ textAlign: 'right', padding: '0.25rem' }}>{formatNumber(p.longitudeDeg, 1)}</td>
                <td style={{ textAlign: 'right', padding: '0.25rem' }}>{formatNumber(p.latitudeDeg, 2)}</td>
                <td style={{ textAlign: 'right', padding: '0.25rem' }}>{formatNumber(p.distanceAu, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem', marginBottom: 0 }}>
          {footer}
        </p>
      )}
    </div>
  );
}
