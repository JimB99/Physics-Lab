# Physics Lab Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 30 confirmed defects in the Physics Lab monorepo (broken URL state, unusable number inputs, wrong moon-phase rendering, sub-ground integrator overshoot, vacuum results shown for drag runs, silently-wrong solver, unreliable alignment search), then land targeted UI, accessibility, and feature improvements — without changing the app's architecture.

**Architecture:** Two-package npm workspace. `packages/physics-engine` is pure TypeScript with zero React/DOM imports and is the only place physics or ephemeris logic may live; it is unit-tested with Vitest. `packages/web` is a Vite + React 19 SPA that reads all state from the URL query string via hooks, and renders through presentational components. Every fix in this plan preserves that split: new maths goes in the engine behind a tested pure function, and the web package only wires it up. A new Vitest + jsdom harness is added to `packages/web` in Task 1 so that UI-layer bugs (URL keys, input handling) can be fixed test-first.

**Tech Stack:** TypeScript 5.7 (strict), React 19, React Router 7.18, Vite 6, uPlot 1.6, KaTeX 0.16, astronomy-engine 2.1 (VSOP87), Vitest 3, jsdom, @testing-library/react 16.

## Global Constraints

- Node.js 20+. CI uses Node 22 (`.github/workflows/ci.yml`).
- `packages/physics-engine` must not import React, `react-dom`, `react-router-dom`, or touch `window`/`document`/`canvas`. It is consumed by the web app through the Vite alias in `packages/web/vite.config.ts` and the workspace symlink.
- SI units everywhere in the engine. Angles are degrees at API boundaries, radians internally.
- Client and engine field names must match exactly. Do not introduce a second name for an existing quantity (for example, do not add `impactVel` next to `impactSpeed`).
- Everything user-visible that changes the result must be encoded in the URL query string, so links are shareable. Use `{ replace: true }` for continuous edits so the browser history is not flooded.
- Dates displayed to the user use ISO `YYYY-MM-DD` (UTC). Dates in URL params use `YYYY-MM-DD`. The existing `d.m.yyyy` format is being removed.
- Never write physics or date maths inline in a React component. Put it in the engine and import it.
- `npm test` and `npm run build` must both pass at the end of every task. Commit after every task.
- Do not reformat or restructure files beyond what the task asks for. Smallest correct diff.
- All new colours must come from CSS custom properties in `packages/web/src/styles/global.css`. No new hard-coded hex values in `.tsx` files except inside the engine's `ORBITAL_BODIES` / `COMPARE_COLORS` data tables.

## Findings index

Each finding was confirmed by reading the code, and the ones marked *(measured)* were confirmed by executing the engine.

| ID | Severity | Finding | Task |
|----|----------|---------|------|
| F-01 | Critical | `usePlanetCalendarParams` reads URL keys `scale`/`metric` but writes `scaleMode`/`alignmentMetric`, so the Display-scale and Cluster-metric dropdowns on Planet Calendar are silent no-ops | 2 |
| F-02 | Critical | `NumberField.onChange` does `parseFloat(e.target.value) \|\| 0`, so typing `1.5` is impossible (`"1."` collapses to `1`) and `-` collapses to `0`. Affects every numeric input in the app | 3 |
| F-03 | Critical | `MoonPhaseCanvas` offsets a same-radius shadow circle by at most `r`, so First Quarter renders fully dark and Full Moon renders ~60% lit. The terminator model is wrong for every phase | 4 |
| F-04 | Critical | RK4 integrators stop *after* passing through the ground. A 100 m drag fall ends at `y = -0.561 m`, `t = 4.750 s`; the vacuum control ends at `y = -1.511 m`, `t = 4.550 s` vs analytic `4.516 s` *(measured)* | 5 |
| F-05 | Critical | With air resistance on, `summary` still comes from the analytic vacuum model, so flight time, impact velocity, max height, and the whole Impact-analysis panel report vacuum numbers for a drag run | 6 |
| F-06 | Critical | `verifyGiven` in `solve/vertical-1d.ts` compares `state` against `given`, but `state` was seeded from `given`, so it can never detect a conflict. Given `h0=100, v0=0, impactTime=1` the solver returns `status: 'solved'` *(measured)* | 7 |
| F-07 | High | `findBestAlignment` minimises an ecliptic-longitude proxy but reports a 3D AU score, and samples only 80 coarse points regardless of span (≈68 days over 15 years, vs Mercury's 88-day period). Over 2026-2041 it returns 2037-12-14 / 383.294 AU where a 10-day scan finds 2036-01-09 / 379.076 AU *(measured)* | 15 |
| F-08 | High | GitHub Pages deep links are lost: `public/404.html` stores `sessionStorage.redirect` and nothing ever reads it; there is also no catch-all route, so unknown paths render an empty page | 10 |
| F-09 | High | `SimulationCanvas` calls `Math.min(...xs)` / `Math.max(...ys)`; with drag the sample array can reach `MAX_STEPS = 100_000`, which throws `RangeError: Maximum call stack size exceeded` | 12 |
| F-10 | High | `UPlotChart` lists `xData` and `series` (new arrays every render) in its `useEffect` deps, so it destroys and reconstructs the chart on every keystroke | 11 |
| F-11 | High | uPlot's stylesheet is light-themed; axis ticks, labels, and legend render near-black on the `#0f1419` background | 11 |
| F-12 | High | `GraphTabs` initialises `tab` from `dragEnabled` once. Turning drag off while the "Vacuum vs drag" tab is active renders an empty graphs panel | 13 |
| F-13 | High | Compare page state (`scenario`, `type`, all variants) is React state only. The URL is never written, so Compare links are not shareable — contradicting the README | 14 |
| F-14 | High | `ComparePage.addVariant` hard-codes `id: 'c'`. Remove variant `a` from three, then add, and two variants share the key `c`: React key collision and both rows edit together | 14 |
| F-15 | High | Compare's trajectory chart passes `series[0].samples.map(s => s.x)` as the shared x-axis, plotting variant B's and C's heights against variant A's horizontal positions | 14 |
| F-16 | High | Compare offers a `custom` body with no way to enter `g`, so it silently uses the stale default 9.80665 | 14 |
| F-17 | High | `DragPanel`'s terminal-velocity readout uses `settings.customRho` while the simulation uses the resolved preset ρ, so with `?atmosphere=marsThin` the panel shows an Earth-density figure | 16 |
| F-18 | Medium | `validateVertical1DInputs` and `validateProjectileInputs` exist but are never called. Negative mass, negative `h0`, and θ > 90° all reach the physics unchecked; `Number(values.mass) \|\| 1` silently rewrites a mass of 0 to 1 | 9 |
| F-19 | Medium | `solveProjectile` has no duplicate-given check and no conflict check (unlike the 1D solver), cannot solve for `angle`, never computes `v`, and ignores `vx`/`vy` as inputs | 8 |
| F-20 | Medium | The Projectile page shows `solveResult.message` without the `missing` field list and has no multi-root display, both of which the vertical page has | 8 |
| F-21 | Medium | `scoreChainByLongitude3D` and `clusterScore('chainByLongitude')` sort longitudes and sum consecutive gaps without handling the 0°/360° wrap, so a cluster straddling 0° scores as maximally spread | 15 |
| F-22 | Medium | `findUpcomingQuarters` has an unbounded `while` loop with no iteration cap | 18 |
| F-23 | Medium | Every `<canvas>` uses a fixed backing store (500×280, 560×560, 240×240) stretched by `width: 100%`, so all four visualisations are blurry on HiDPI displays and mis-scaled on wide layouts | 12 |
| F-24 | Medium | `ORBITAL_BODIES` gives Neptune `#000080`, which is invisible against the `#0f1419` page background | 17 |
| F-25 | Medium | `SimulationCanvas` playback uses `setInterval(50)` independent of the sample timestep, so playback speed silently depends on the scenario; there is no speed control and `prefers-reduced-motion` is ignored | 12 |
| F-26 | Medium | `formatDateString` returns ambiguous `d.m.yyyy`, and moon quarter events lose their time of day even though quarters are instants | 18 |
| F-27 | Medium | Free Fall and Vertical Throw render byte-identical UI from the same component with different copy; Free Fall does not pin `v₀ = 0` | 19 |
| F-28 | Medium | `illuminationFromAngle` hand-rolls `(1 − cos φ)/2` instead of using astronomy-engine's `Illumination()`, which accounts for the actual Sun-Moon-Earth geometry | 18 |
| F-29 | Medium | Moon Phases keeps its date in React state, so the page is the only one in the app whose view cannot be linked to | 18 |
| F-30 | Medium | No accessibility affordances: no `:focus-visible` styling, tab strips are plain buttons without `role="tab"`/`aria-selected`, toggle buttons lack `aria-pressed`, canvases expose no data alternative | 17 |
| F-31 | Low | Dead code: `parseDragFromParams`, `parseImpactFromParams`, `getShapeCd`, `isPositiveFinite`, `isFiniteNumber`, `PLANET_GRAVITY`, `motion/vertical-throw.ts`, `SolvableField`'s hidden `<input>`, `deriveBasics`' duplicated fourth branch | 16 |
| F-32 | Low | `VerticalScenarioPage` and `ProjectilePage` duplicate ~90 lines of identical drag/impact URL plumbing | 16 |
| F-33 | Low | Alignment search runs on the main thread inside `setTimeout(0)`, freezing the UI; it gets worse once sampling density is fixed | 15 |
| F-34 | Low | `index.html` has no favicon (browser logs a 404), no meta description, and no theme-color; there is no per-route `<title>` and no error boundary | 10 |
| F-35 | Low | `tsconfig.app.json` is an unused project-reference stub that points at the real config, and neither package enables `noUncheckedIndexedAccess` despite the code being written with non-null assertions as if it were on | 20 |
| F-36 | Low | Editing `Cd` by hand leaves the shape dropdown claiming "Sphere"; selecting the `moonVacuum` atmosphere with drag enabled silently disables drag with no explanation | 16 |
| F-37 | Low | `EquationBlock` calls `katex.renderToString` on every render; `DateFields` renders its caption below its inputs; `PlaybackControls` is labelled in seconds but drives an integer frame index on Planet Calendar | 12, 18 |

Feature additions are Tasks 21-25. Deliberately deferred items are listed at the end.

---

## Phase 1 — Test harness and critical correctness

### Task 1: Vitest + jsdom harness for the web package

There is currently no way to test anything in `packages/web`. Tasks 2, 3, and 14 need one.

**Files:**
- Modify: `packages/web/package.json`
- Create: `packages/web/vitest.config.ts`
- Create: `packages/web/tests/smoke.test.tsx`
- Modify: `packages/web/tsconfig.json`
- Modify: `package.json` (repo root)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `npm test -w web` runs Vitest with jsdom; `npm test` at the root runs both packages. Later tasks put web tests in `packages/web/tests/*.test.tsx` and may import from `@testing-library/react`.

- [ ] **Step 1: Install the test dependencies**

```bash
npm install -D -w web vitest@^3.0.5 jsdom@^26.0.0 @testing-library/react@^16.1.0 @testing-library/user-event@^14.5.2
```

- [ ] **Step 2: Create `packages/web/vitest.config.ts`**

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'physics-engine': path.resolve(__dirname, '../physics-engine/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Add the scripts**

In `packages/web/package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vitest run"
  },
```

In the root `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "npm run dev -w web",
    "build": "npm run build -w web",
    "test": "npm run test -w physics-engine && npm run test -w web",
    "test:engine": "npm run test -w physics-engine",
    "test:web": "npm run test -w web",
    "preview": "npm run preview -w web"
  }
```

- [ ] **Step 4: Let `tsc` see the tests**

In `packages/web/tsconfig.json`, add `"types": ["vitest/globals"]` inside `compilerOptions` and change the last line from `"include": ["src"]` to `"include": ["src", "tests"]`.

- [ ] **Step 5: Write the smoke test**

Create `packages/web/tests/smoke.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../src/pages/HomePage';

describe('web test harness', () => {
  it('renders a page inside a router', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Physics Lab');
  });
});
```

- [ ] **Step 6: Run it**

Run: `npm test -w web`
Expected: `Test Files 1 passed (1)`, `Tests 1 passed (1)`.

- [ ] **Step 7: Add the web tests to CI**

In `.github/workflows/ci.yml`, the `- run: npm test` line now covers both packages because of the root script change. No edit is needed to the workflow; verify by reading the file and confirming it still says `- run: npm test`. Then run the full suite:

Run: `npm test`
Expected: physics-engine reports `Tests 45 passed (45)` and web reports `Tests 1 passed (1)`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json packages/web/package.json packages/web/tsconfig.json packages/web/vitest.config.ts packages/web/tests/smoke.test.tsx
git commit -m "test: add vitest + jsdom harness for the web package"
```

---

### Task 2: Fix the Planet Calendar URL key mismatch (F-01)

`usePlanetCalendarParams` reads `scale` and `metric` from the query string but `setParams` writes the property names `scaleMode` and `alignmentMetric`. The Display-scale and Cluster-metric dropdowns therefore do nothing at all.

**Files:**
- Modify: `packages/web/src/hooks/usePlanetCalendarParams.ts`
- Test: `packages/web/tests/usePlanetCalendarParams.test.tsx`

**Interfaces:**
- Consumes: the Vitest harness from Task 1.
- Produces: `PLANET_CALENDAR_PARAM_KEYS: Record<keyof PlanetCalendarParams, string>` exported from `packages/web/src/hooks/usePlanetCalendarParams.ts`. The public signature of `usePlanetCalendarParams()` does not change: `[PlanetCalendarParams, (patch: Partial<PlanetCalendarParams>) => void]`.

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/usePlanetCalendarParams.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { usePlanetCalendarParams } from '../src/hooks/usePlanetCalendarParams';

function Probe() {
  const [params, setParams] = usePlanetCalendarParams();
  const [search] = useSearchParams();
  return (
    <div>
      <span data-testid="scale">{params.scaleMode}</span>
      <span data-testid="metric">{params.alignmentMetric}</span>
      <span data-testid="pairA">{params.pairA}</span>
      <span data-testid="query">{search.toString()}</span>
      <button
        type="button"
        onClick={() => setParams({ scaleMode: 'true', alignmentMetric: 'maxPairwise' })}
      >
        set
      </button>
    </div>
  );
}

function renderProbe(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Probe />
    </MemoryRouter>,
  );
}

describe('usePlanetCalendarParams', () => {
  it('round-trips the display scale that setParams wrote', async () => {
    renderProbe('/solar-system/planet-calendar');
    expect(screen.getByTestId('scale').textContent).toBe('schematic');

    await userEvent.click(screen.getByRole('button', { name: 'set' }));

    expect(screen.getByTestId('scale').textContent).toBe('true');
    expect(screen.getByTestId('metric').textContent).toBe('maxPairwise');
  });

  it('reads the short query keys', () => {
    renderProbe('/solar-system/planet-calendar?scale=true&metric=chainByLongitude');
    expect(screen.getByTestId('scale').textContent).toBe('true');
    expect(screen.getByTestId('metric').textContent).toBe('chainByLongitude');
  });

  it('falls back to a valid planet when pairA is garbage', () => {
    renderProbe('/solar-system/planet-calendar?pairA=banana');
    expect(screen.getByTestId('pairA').textContent).toBe('mars');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w web -- usePlanetCalendarParams`
Expected: FAIL. The first test reports `expected 'schematic' to be 'true'` and the third reports `expected 'banana' to be 'mars'`.

- [ ] **Step 3: Add the key map and use it in both directions**

In `packages/web/src/hooks/usePlanetCalendarParams.ts`, add this after the `defaults` object:

```ts
export const PLANET_CALENDAR_PARAM_KEYS: Record<keyof PlanetCalendarParams, string> = {
  mode: 'mode',
  day: 'day',
  month: 'month',
  year: 'year',
  startDay: 'startDay',
  startMonth: 'startMonth',
  startYear: 'startYear',
  endDay: 'endDay',
  endMonth: 'endMonth',
  endYear: 'endYear',
  stepDays: 'stepDays',
  scaleMode: 'scale',
  alignmentMetric: 'metric',
  pairA: 'pairA',
  pairB: 'pairB',
};

const ORBITAL_PLANET_IDS = new Set<string>(ORBITAL_PLANETS.map((p) => p.id));

function parsePlanetParam(value: string | null, fallback: OrbitalPlanetId): OrbitalPlanetId {
  return value !== null && ORBITAL_PLANET_IDS.has(value) ? (value as OrbitalPlanetId) : fallback;
}
```

Change the top import so `ORBITAL_PLANETS` is available (it is a value, not a type, so it needs its own import statement):

```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ORBITAL_PLANETS } from 'physics-engine';
import type { AlignmentMetric, DisplayScaleMode, OrbitalPlanetId } from 'physics-engine';
```

Inside the `params` `useMemo`, replace every `searchParams.get('<literal>')` with the mapped key and use the new planet parser. The full replacement for the `useMemo` body is:

```ts
    const keys = PLANET_CALENDAR_PARAM_KEYS;
    const modeParam = searchParams.get(keys.mode);
    const mode: PlanetCalendarMode =
      modeParam === 'alignment' || modeParam === 'animate' ? modeParam : 'snapshot';
    const scaleParam = searchParams.get(keys.scaleMode);
    const scaleMode: DisplayScaleMode = scaleParam === 'true' ? 'true' : 'schematic';
    const metricParam = searchParams.get(keys.alignmentMetric);
    const alignmentMetric: AlignmentMetric =
      metricParam === 'maxPairwise' || metricParam === 'chainByLongitude' ? metricParam : 'pairwiseSum';

    return {
      mode,
      day: parseIntParam(searchParams.get(keys.day), defaults.day),
      month: parseIntParam(searchParams.get(keys.month), defaults.month),
      year: parseIntParam(searchParams.get(keys.year), defaults.year),
      startDay: parseIntParam(searchParams.get(keys.startDay), defaults.startDay),
      startMonth: parseIntParam(searchParams.get(keys.startMonth), defaults.startMonth),
      startYear: parseIntParam(searchParams.get(keys.startYear), defaults.startYear),
      endDay: parseIntParam(searchParams.get(keys.endDay), defaults.endDay),
      endMonth: parseIntParam(searchParams.get(keys.endMonth), defaults.endMonth),
      endYear: parseIntParam(searchParams.get(keys.endYear), defaults.endYear),
      stepDays: Math.max(1, parseIntParam(searchParams.get(keys.stepDays), defaults.stepDays)),
      scaleMode,
      alignmentMetric,
      pairA: parsePlanetParam(searchParams.get(keys.pairA), defaults.pairA),
      pairB: parsePlanetParam(searchParams.get(keys.pairB), defaults.pairB),
    };
```

Then change the writer inside `setParams`:

```ts
          for (const [key, value] of Object.entries(patch)) {
            const paramKey = PLANET_CALENDAR_PARAM_KEYS[key as keyof PlanetCalendarParams];
            if (!paramKey) continue;
            next.set(paramKey, String(value));
          }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w web -- usePlanetCalendarParams`
Expected: PASS, 3 tests.

- [ ] **Step 5: Confirm the whole suite and the build are still green**

Run: `npm test && npm run build`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/hooks/usePlanetCalendarParams.ts packages/web/tests/usePlanetCalendarParams.test.tsx
git commit -m "fix: map planet calendar params to their URL keys so scale and metric selects work"
```

---

### Task 3: Make numeric inputs actually typeable (F-02)

`NumberField` is controlled by a `number` and commits `parseFloat(e.target.value) || 0` on every keystroke. Typing `1.5` produces `1` (because `"1."` parses to `1`, re-rendering the input as `"1"`), and typing `-` produces `0`. The same anti-pattern appears in `PlanetSelector`'s custom-`g` input and in `PlanetCalendarPage`'s `DateFields`.

The fix is to hold the in-progress text in local state, commit only parseable values upward, and re-sync from the prop only when the prop itself changes. The input type becomes `text` with `inputMode="decimal"`: a `type="number"` input reports `""` for intermediate text like `"1."`, which makes a draft-string approach impossible.

**Files:**
- Modify: `packages/web/src/components/inputs/NumberField.tsx`
- Modify: `packages/web/src/components/inputs/PlanetSelector.tsx:64-76`
- Modify: `packages/web/src/pages/PlanetCalendarPage.tsx:29-80`
- Modify: `packages/web/src/components/inputs/SolvableField.tsx:44-50`
- Test: `packages/web/tests/NumberField.test.tsx`

**Interfaces:**
- Produces: 

```ts
interface NumberFieldProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;      // retained for callers, used only as the hint text suffix
  integer?: boolean;  // when true, commits Math.round and rejects decimals on blur
}
```

`min`/`max` are enforced on blur by clamping and calling `onChange` with the clamped value, never mid-keystroke.

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/NumberField.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from '../src/components/inputs/NumberField';

describe('NumberField', () => {
  it('lets the user type a decimal value', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Initial height" value={10} onChange={onChange} />);
    const input = screen.getByLabelText('Initial height') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '1.5');

    expect(input.value).toBe('1.5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
  });

  it('lets the user type a negative value', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Initial velocity" value={0} onChange={onChange} />);
    const input = screen.getByLabelText('Initial velocity') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-4.25');

    expect(input.value).toBe('-4.25');
    expect(onChange).toHaveBeenLastCalledWith(-4.25);
  });

  it('does not emit a value while the text is not a number yet', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Mass" value={1} onChange={onChange} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-');

    expect(input.value).toBe('-');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('restores the prop value when the field is left empty', async () => {
    render(<NumberField label="Mass" value={2.5} onChange={() => {}} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.tab();

    expect(input.value).toBe('2.5');
  });

  it('clamps to min on blur', async () => {
    const onChange = vi.fn();
    render(<NumberField label="Mass" value={1} min={0.001} onChange={onChange} />);
    const input = screen.getByLabelText('Mass') as HTMLInputElement;

    await userEvent.clear(input);
    await userEvent.type(input, '-5');
    await userEvent.tab();

    expect(onChange).toHaveBeenLastCalledWith(0.001);
  });

  it('re-syncs when the prop changes from outside', () => {
    const { rerender } = render(<NumberField label="Mass" value={1} onChange={() => {}} />);
    rerender(<NumberField label="Mass" value={42} onChange={() => {}} />);
    expect((screen.getByLabelText('Mass') as HTMLInputElement).value).toBe('42');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w web -- NumberField`
Expected: FAIL. The first test reports `expected '15' to be '1.5'`.

- [ ] **Step 3: Rewrite `NumberField`**

Replace the entire contents of `packages/web/src/components/inputs/NumberField.tsx` with:

```tsx
import { useEffect, useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
}

function clamp(value: number, min?: number, max?: number): number {
  let out = value;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

export function NumberField({
  label,
  value,
  unit,
  onChange,
  disabled,
  min,
  max,
  integer = false,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() => String(value));

  // Only re-sync when the prop itself changes, so a half-typed value like "1." survives.
  useEffect(() => {
    setDraft((current) => (Number(current) === value ? current : String(value)));
  }, [value]);

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(integer ? Math.round(parsed) : parsed);
  };

  const handleBlur = () => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const settled = clamp(integer ? Math.round(parsed) : parsed, min, max);
    setDraft(String(settled));
    if (settled !== value) onChange(settled);
  };

  return (
    <label className="field">
      {label !== '' && (
        <span className="field__label">
          {label}
          {unit && <span className="muted"> ({unit})</span>}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        className="field__input"
        value={draft}
        disabled={disabled}
        aria-label={label === '' ? undefined : label}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />
    </label>
  );
}
```

- [ ] **Step 4: Give the new class names real styles**

Append to `packages/web/src/styles/global.css`:

```css
.field {
  display: block;
  margin-bottom: 0.75rem;
}

.field__label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.field__input,
input[type='text'].field__input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-family: var(--mono);
}

.field__input:focus {
  outline: 2px solid var(--accent-dim);
  border-color: var(--accent);
}
```

- [ ] **Step 5: Fix `SolvableField`'s use of the label-less variant**

In `packages/web/src/components/inputs/SolvableField.tsx`, the `mode === 'given'` branch passes `label=""`, which now removes the accessible name. Replace lines 43-50 (the `<NumberField ... />` call) with:

```tsx
        <NumberField
          label={label}
          value={value}
          onChange={onValueChange}
          min={min}
          step={step}
        />
```

and delete the now-duplicated visible label by giving the wrapper `span` at line 35-38 `aria-hidden="true"`:

```tsx
        <span style={{ fontSize: '0.875rem' }} aria-hidden="true">
```

Also delete the dead hidden input at the end of the component (lines 83-85):

```tsx
      {mode === 'solve' && solvedValue !== undefined && (
        <input type="hidden" value={displayValue} />
      )}
```

and delete the now-unused `displayValue` constant on line 30.

- [ ] **Step 6: Fix the custom-g input in `PlanetSelector`**

In `packages/web/src/components/inputs/PlanetSelector.tsx`, replace the whole `{planet === 'custom' && ( ... )}` block (lines 64-76) with:

```tsx
      {planet === 'custom' && (
        <NumberField
          label="g"
          unit="m/s²"
          value={customG}
          min={0.01}
          onChange={onCustomGChange}
        />
      )}
```

and add the import at the top of the file:

```tsx
import { NumberField } from './NumberField';
```

- [ ] **Step 7: Fix `DateFields` in `PlanetCalendarPage`**

In `packages/web/src/pages/PlanetCalendarPage.tsx`, replace the whole `DateFields` component (lines 29-80) with:

```tsx
function DateFields({
  legend,
  day,
  month,
  year,
  onChange,
}: {
  legend: string;
  day: number;
  month: number;
  year: number;
  onChange: (patch: { day?: number; month?: number; year?: number }) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: '0 0 0.75rem' }}>
      <legend className="muted" style={{ fontSize: '0.75rem', padding: 0 }}>
        {legend}
      </legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '0.5rem' }}>
        <NumberField
          label="Day"
          value={day}
          min={1}
          max={31}
          integer
          onChange={(next) => onChange({ day: next })}
        />
        <NumberField
          label="Month"
          value={month}
          min={1}
          max={12}
          integer
          onChange={(next) => onChange({ month: next })}
        />
        <NumberField
          label="Year"
          value={year}
          min={1}
          max={9999}
          integer
          onChange={(next) => onChange({ year: next })}
        />
      </div>
    </fieldset>
  );
}
```

Add the import at the top of the same file:

```tsx
import { NumberField } from '../components/inputs/NumberField';
```

Then rename the prop at the three call sites: `prefix="Selected date (UTC noon)"` becomes `legend="Selected date (UTC noon)"`, `prefix="Range start"` becomes `legend="Range start"`, and `prefix="Range end (exclusive)"` becomes `legend="Range end (exclusive)"`. Also replace the animate-mode step input (the raw `<input type="number">` around line 336) with:

```tsx
              <NumberField
                label="Step (days, minimum)"
                value={params.stepDays}
                min={1}
                integer
                onChange={(next) => setParams({ stepDays: Math.max(1, next) })}
              />
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -w web -- NumberField`
Expected: PASS, 6 tests.

Run: `npm test && npm run build`
Expected: both exit 0.

- [ ] **Step 9: Manually verify in the browser**

Run: `npm run dev`, open `http://localhost:5173/Physics-Lab/motion/free-fall`, and confirm you can type `12.75` into "Initial height h₀" and `-3.5` into "Initial velocity v₀". Then open `/solar-system/planet-calendar` and confirm the Day/Month/Year fields accept multi-digit years such as `2031`.

- [ ] **Step 10: Commit**

```bash
git add packages/web/src/components/inputs/NumberField.tsx packages/web/src/components/inputs/PlanetSelector.tsx packages/web/src/components/inputs/SolvableField.tsx packages/web/src/pages/PlanetCalendarPage.tsx packages/web/src/styles/global.css packages/web/tests/NumberField.test.tsx
git commit -m "fix: allow decimal and negative entry in every numeric input"
```

---

### Task 4: Correct the moon terminator geometry (F-03)

`MoonPhaseCanvas` fills the disc, then covers it with a same-radius circle offset by at most `r`. Offsetting a same-radius circle needs `2r` to uncover the disc completely, so Full Moon renders ~60% lit, and at exactly half phase the offset is `0`, which covers the disc entirely — First Quarter renders black. The real terminator is a half-ellipse whose semi-minor axis is `r·|cos φ|`.

The geometry is physics, so it goes in the engine as a tested pure function; the canvas only draws it.

**Files:**
- Create: `packages/physics-engine/src/orbital/moon-disk.ts`
- Modify: `packages/physics-engine/src/orbital/index.ts`
- Modify: `packages/web/src/components/solar-system/MoonPhaseCanvas.tsx`
- Test: `packages/physics-engine/tests/moon-disk.test.ts`

**Interfaces:**
- Produces:

```ts
export interface MoonDiskGeometry {
  /** Normalised phase angle in [0, 360): 0 new, 90 first quarter, 180 full, 270 last quarter. */
  phaseAngleDeg: number;
  /** True when the illuminated limb is on the right of the disk (waxing, northern view). */
  litOnRight: boolean;
  /** True when more than half the disk is lit, so the terminator bulges away from the lit limb. */
  gibbous: boolean;
  /** Terminator semi-minor axis as a fraction of the disk radius, in [0, 1]. */
  terminatorAxisRatio: number;
  /** Geometric illuminated fraction in [0, 1]. */
  illuminatedFraction: number;
}

export function moonDiskGeometry(phaseAngleDeg: number): MoonDiskGeometry;
```

- [ ] **Step 1: Write the failing test**

Create `packages/physics-engine/tests/moon-disk.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { moonDiskGeometry } from '../src/orbital/moon-disk';

describe('moonDiskGeometry', () => {
  it('new moon is fully dark with a full-width terminator', () => {
    const g = moonDiskGeometry(0);
    expect(g.illuminatedFraction).toBeCloseTo(0, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(1, 6);
    expect(g.gibbous).toBe(false);
  });

  it('first quarter is half lit on the right with a straight terminator', () => {
    const g = moonDiskGeometry(90);
    expect(g.illuminatedFraction).toBeCloseTo(0.5, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(0, 6);
    expect(g.litOnRight).toBe(true);
    expect(g.gibbous).toBe(false);
  });

  it('full moon is fully lit', () => {
    const g = moonDiskGeometry(180);
    expect(g.illuminatedFraction).toBeCloseTo(1, 6);
    expect(g.terminatorAxisRatio).toBeCloseTo(1, 6);
    expect(g.gibbous).toBe(true);
  });

  it('last quarter is half lit on the left', () => {
    const g = moonDiskGeometry(270);
    expect(g.illuminatedFraction).toBeCloseTo(0.5, 6);
    expect(g.litOnRight).toBe(false);
    expect(g.gibbous).toBe(false);
  });

  it('waxing gibbous is lit on the right and bulging', () => {
    const g = moonDiskGeometry(135);
    expect(g.litOnRight).toBe(true);
    expect(g.gibbous).toBe(true);
    expect(g.illuminatedFraction).toBeGreaterThan(0.5);
  });

  it('waning crescent is lit on the left and not bulging', () => {
    const g = moonDiskGeometry(315);
    expect(g.litOnRight).toBe(false);
    expect(g.gibbous).toBe(false);
    expect(g.illuminatedFraction).toBeLessThan(0.5);
  });

  it('normalises out-of-range angles', () => {
    expect(moonDiskGeometry(450).phaseAngleDeg).toBeCloseTo(90, 6);
    expect(moonDiskGeometry(-90).phaseAngleDeg).toBeCloseTo(270, 6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -w physics-engine -- moon-disk`
Expected: FAIL with `Failed to resolve import "../src/orbital/moon-disk"`.

- [ ] **Step 3: Write the implementation**

Create `packages/physics-engine/src/orbital/moon-disk.ts`:

```ts
export interface MoonDiskGeometry {
  phaseAngleDeg: number;
  litOnRight: boolean;
  gibbous: boolean;
  terminatorAxisRatio: number;
  illuminatedFraction: number;
}

/**
 * Geometry for drawing a lunar disk. The terminator is the projection of the
 * day/night great circle, which is a half-ellipse with semi-minor axis
 * r·|cos φ| and semi-major axis r.
 */
export function moonDiskGeometry(phaseAngleDeg: number): MoonDiskGeometry {
  const phase = ((phaseAngleDeg % 360) + 360) % 360;
  const rad = (phase * Math.PI) / 180;
  const cos = Math.cos(rad);
  return {
    phaseAngleDeg: phase,
    litOnRight: phase < 180,
    gibbous: phase > 90 && phase < 270,
    terminatorAxisRatio: Math.abs(cos),
    illuminatedFraction: (1 - cos) / 2,
  };
}
```

- [ ] **Step 4: Export it and run the test**

Add to `packages/physics-engine/src/orbital/index.ts`, after the `./moon` line:

```ts
export * from './moon-disk';
```

Run: `npm test -w physics-engine -- moon-disk`
Expected: PASS, 7 tests.

- [ ] **Step 5: Redraw the canvas using the geometry**

Replace the entire contents of `packages/web/src/components/solar-system/MoonPhaseCanvas.tsx` with:

```tsx
import { useEffect, useRef } from 'react';
import type { MoonPhaseInfo } from 'physics-engine';
import { moonDiskGeometry } from 'physics-engine';

interface MoonPhaseCanvasProps {
  phase: MoonPhaseInfo;
  size?: number;
}

const SHADOW = '#1a2332';
const SURFACE = '#f5f3ce';
const LIMB = '#8b9cb3';

export function MoonPhaseCanvas({ phase, size = 240 }: MoonPhaseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    const geometry = moonDiskGeometry(phase.phaseAngleDeg);
    const a = r * geometry.terminatorAxisRatio;
    const { litOnRight, gibbous } = geometry;

    ctx.fillStyle = SHADOW;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SURFACE;
    ctx.beginPath();
    if (litOnRight) {
      ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(cx, cy, a, r, 0, Math.PI / 2, -Math.PI / 2, !gibbous);
    } else {
      ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, false);
      ctx.ellipse(cx, cy, a, r, 0, -Math.PI / 2, Math.PI / 2, !gibbous);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = LIMB;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [phase, size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      style={{ display: 'block', margin: '0 auto', width: size, height: size }}
      aria-label={`${phase.name}, ${(phase.illuminationFraction * 100).toFixed(0)} percent illuminated`}
    />
  );
}
```

- [ ] **Step 6: Verify visually**

Run: `npm run dev` and open `http://localhost:5173/Physics-Lab/solar-system/moon-phases`. Step the date forward one day at a time across a full month and confirm: no date renders a fully black or fully lit disk except within a day of New Moon / Full Moon, half phases render as a straight-edged half disk, and the lit limb flips sides after Full Moon.

- [ ] **Step 7: Run the whole suite and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

```bash
git add packages/physics-engine/src/orbital/moon-disk.ts packages/physics-engine/src/orbital/index.ts packages/physics-engine/tests/moon-disk.test.ts packages/web/src/components/solar-system/MoonPhaseCanvas.tsx
git commit -m "fix: draw the lunar terminator as a half-ellipse instead of an offset circle"
```

---

### Task 5: Stop the integrators below ground level (F-04)

Both RK4 loops take a full step past `y = 0` and then break, so the final sample — which the UI reports as impact — sits below ground. Measured: a 100 m fall with drag ends at `y = -0.561 m`, and the drag-free control ends at `t = 4.550 s` against an analytic `4.516 s`.

Fix: when a step would cross the ground, bisect the step to find the crossing and emit a final sample at exactly `y = 0`.

**Files:**
- Modify: `packages/physics-engine/src/simulation/integrator.ts`
- Test: `packages/physics-engine/tests/drag-integration.test.ts`

**Interfaces:**
- The exported signatures of `integrateVertical1D` and `integrateProjectile2D` do not change. Their last sample now always satisfies `y === 0` whenever the body started above ground and reached the ground within `maxTime`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/physics-engine/tests/drag-integration.test.ts` (inside the existing `describe('drag integration', ...)` block):

```ts
  it('lands exactly on the ground with drag', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(100, 0, env, drag, { step: 0.05 });
    expect(samples[samples.length - 1]!.y).toBe(0);
  });

  it('rho=0 matches the analytical impact time within 0.1%', () => {
    const analytical = firstImpactTime(100, 0, env.g)!;
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(100, 0, env, drag, { step: 0.05 });
    const numerical = samples[samples.length - 1]!.t;
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(Math.abs(numerical - analytical) / analytical).toBeLessThan(0.001);
  });

  it('a body thrown upward from the ground still lands on the ground', () => {
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(0, 20, env, drag, { step: 0.05 });
    expect(samples.length).toBeGreaterThan(2);
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(samples[samples.length - 1]!.t).toBeCloseTo((2 * 20) / env.g, 2);
  });

  it('a body already on the ground at rest produces a single sample', () => {
    const drag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateVertical1D(0, 0, env, drag, { step: 0.05 });
    expect(samples).toHaveLength(1);
    expect(samples[0]!.t).toBe(0);
  });
```

Also append a new `describe` block at the end of the same file:

```ts
describe('projectile integration', () => {
  it('lands exactly on the ground', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const samples = integrateProjectile2D(0, 30, 45, env, drag, { step: 0.05 });
    expect(samples[samples.length - 1]!.y).toBe(0);
    expect(samples[samples.length - 1]!.x).toBeGreaterThan(0);
  });

  it('rho=0 matches the analytical range within 0.5%', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const samples = integrateProjectile2D(0, 20, 45, env, noDrag, { step: 0.05 });
    const analyticalRange = (20 * 20 * Math.sin((2 * 45 * Math.PI) / 180)) / env.g;
    const numericalRange = samples[samples.length - 1]!.x;
    expect(Math.abs(numericalRange - analyticalRange) / analyticalRange).toBeLessThan(0.005);
  });
});
```

Update the imports at the top of the file to:

```ts
import { describe, expect, it } from 'vitest';
import { firstImpactTime } from '../src/motion/kinematics';
import { integrateProjectile2D, integrateVertical1D } from '../src/simulation/integrator';
import { terminalVelocity } from '../src/forces/drag';
```

Delete the original `it('rho=0 matches analytical impact time within 2%', ...)` test, which the stricter 0.1% version replaces.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -w physics-engine -- drag-integration`
Expected: FAIL. `expected -0.5613... to be +0` and `expected 0.0075... to be less than 0.001`.

- [ ] **Step 3: Add the crossing refinement helpers**

In `packages/physics-engine/src/simulation/integrator.ts`, add these two functions immediately after `rk4Step1D` (after line 60):

```ts
const CROSSING_BISECTIONS = 40;

/** Bisects a single RK4 step to find the sub-step at which y reaches 0. */
function refineGroundCrossing1D(
  y: number,
  v: number,
  dt: number,
  drag: DragConfig,
): { dt: number; v: number } {
  let lo = 0;
  let hi = dt;
  let vAtCrossing = rk4Step1D(y, v, hi, drag).v;
  for (let i = 0; i < CROSSING_BISECTIONS; i++) {
    const mid = (lo + hi) / 2;
    const probe = rk4Step1D(y, v, mid, drag);
    if (probe.y > 0) {
      lo = mid;
    } else {
      hi = mid;
      vAtCrossing = probe.v;
    }
  }
  return { dt: hi, v: vAtCrossing };
}
```

and this one immediately after `rk4Step2D` (after line 134):

```ts
/** Bisects a single RK4 step to find the sub-step at which y reaches 0. */
function refineGroundCrossing2D(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  drag: DragConfig,
): { dt: number; x: number; vx: number; vy: number } {
  let lo = 0;
  let hi = dt;
  let best = rk4Step2D(x, y, vx, vy, hi, drag);
  for (let i = 0; i < CROSSING_BISECTIONS; i++) {
    const mid = (lo + hi) / 2;
    const probe = rk4Step2D(x, y, vx, vy, mid, drag);
    if (probe.y > 0) {
      lo = mid;
    } else {
      hi = mid;
      best = probe;
    }
  }
  return { dt: hi, x: best.x, vx: best.vx, vy: best.vy };
}
```

- [ ] **Step 4: Use them in `integrateVertical1D`**

In `integrateVertical1D`, insert this guard immediately after `samples.push(buildSample(0, 0, y, 0, v, env, initDrag, -Fg - Math.sign(v || -1) * initDrag, 0));` (after line 78):

```ts
  if (h0 <= 0 && v0 <= 0) return samples;
```

Then replace the whole loop body (lines 80-93) with:

```ts
  for (let i = 0; i < MAX_STEPS && t < maxTime; i++) {
    const next = rk4Step1D(y, v, step, drag);
    const crossesGround = next.y <= 0 && y > 0;

    if (crossesGround) {
      const crossing = refineGroundCrossing1D(y, v, step, drag);
      t += crossing.dt;
      v = crossing.v;
      y = 0;
    } else {
      t += step;
      y = next.y;
      v = next.v;
    }

    const speed = Math.abs(v);
    const Fd = speed > 0 ? dragForceQuadratic(drag.rho, drag.cd, drag.area, speed) : 0;
    const netFy = -Fg - Math.sign(v) * Fd;

    samples.push(buildSample(t, 0, y, 0, v, env, Fd, netFy, 0));

    if (y <= 0) break;
  }
```

- [ ] **Step 5: Use them in `integrateProjectile2D`**

In `integrateProjectile2D`, insert this guard immediately after the initial `samples.push(...)` call (after line 159):

```ts
  if (h0 <= 0 && vy <= 0) return samples;
```

Then replace the whole loop body (lines 161-179) with:

```ts
  for (let i = 0; i < MAX_STEPS && t < maxTime; i++) {
    const next = rk4Step2D(x, y, vx, vy, step, drag);
    const crossesGround = next.y <= 0 && y > 0;

    if (crossesGround) {
      const crossing = refineGroundCrossing2D(x, y, vx, vy, step, drag);
      t += crossing.dt;
      x = crossing.x;
      y = 0;
      vx = crossing.vx;
      vy = crossing.vy;
    } else {
      t += step;
      x = next.x;
      y = next.y;
      vx = next.vx;
      vy = next.vy;
    }

    const speed = Math.sqrt(vx * vx + vy * vy);
    const Fd = speed > 0 ? dragForceQuadratic(drag.rho, drag.cd, drag.area, speed) : 0;
    const Fdx = speed > 0 ? -(Fd * vx) / speed : 0;
    const Fdy = speed > 0 ? -(Fd * vy) / speed : 0;

    samples.push(buildSample(t, x, y, vx, vy, env, Fd, -Fg + Fdy, Fdx));

    if (y <= 0) break;
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -w physics-engine -- drag-integration`
Expected: PASS, 7 tests.

Run: `npm test`
Expected: all green. If `tests/compare.test.ts` now fails on its final-time assertion, that means the analytic and numerical paths disagree — do not relax the test; re-read Step 4.

- [ ] **Step 7: Commit**

```bash
git add packages/physics-engine/src/simulation/integrator.ts packages/physics-engine/tests/drag-integration.test.ts
git commit -m "fix: end RK4 trajectories exactly at ground level instead of overshooting"
```

---

### Task 6: Report drag results, not vacuum results, when drag is on (F-05)

`useMotionScenario` computes `summary` with `computeVertical1DSummary` / `computeProjectileSummary` — the closed-form vacuum model — even on the drag branch. The Results panel, the "Impact" marker in the simulation, and the whole Impact-analysis panel therefore show vacuum figures for a drag run. A 1 kg, 0.01 m², Cd 0.47 sphere dropped 100 m in air actually lands at about 38.7 m/s; the UI currently claims 44.3 m/s.

`ScenarioSummary.impactVelocity` also carries two different meanings today: `computeVertical1DSummary` returns a signed velocity (negative on the way down) while `computeProjectileSummary` returns a magnitude. Both call sites then do `Math.abs(...)`. Fix the naming at the same time.

**Files:**
- Create: `packages/physics-engine/src/simulation/summary.ts`
- Modify: `packages/physics-engine/src/types.ts:61-68`
- Modify: `packages/physics-engine/src/motion/free-fall.ts:20-35`
- Modify: `packages/physics-engine/src/motion/projectile.ts:23-44`
- Modify: `packages/physics-engine/src/index.ts`
- Modify: `packages/web/src/hooks/useMotionScenario.ts`
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx:156`
- Modify: `packages/web/src/pages/ProjectilePage.tsx:151`
- Test: `packages/physics-engine/tests/summary.test.ts`
- Modify: `packages/physics-engine/tests/free-fall.test.ts:19`
- Modify: `packages/physics-engine/tests/vertical-throw.test.ts:17`

**Interfaces:**
- Produces:

```ts
// packages/physics-engine/src/types.ts
export interface ScenarioSummary {
  flightTime: number;
  /** Always a non-negative magnitude. */
  impactSpeed: number;
  /** Signed vertical velocity at impact (negative when descending). */
  impactVelocityY: number;
  maxHeight: number;
  timeToMaxHeight?: number;
  impactAngle?: number;
  horizontalDistance?: number;
}

// packages/physics-engine/src/simulation/summary.ts
export function summarizeSamples(samples: MotionSample[]): ScenarioSummary | null;
```

`impactVelocity` is removed entirely. Search the repo for it after the change: the only remaining hits must be the solver field id `'impactVelocity'` in `solve/types.ts`, `solve/vertical-1d.ts`, `solve/projectile.ts`, the field label maps in the two pages, and `tests/solve-*.test.ts`. Those are a different concept (a solvable quantity) and must not be renamed.

- [ ] **Step 1: Write the failing test**

Create `packages/physics-engine/tests/summary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { integrateProjectile2D, integrateVertical1D } from '../src/simulation/integrator';
import { summarizeSamples } from '../src/simulation/summary';
import { computeVertical1DSummary } from '../src/motion/free-fall';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('summarizeSamples', () => {
  it('returns null for an empty sample set', () => {
    expect(summarizeSamples([])).toBeNull();
  });

  it('reports a slower impact with drag than in vacuum', () => {
    const drag = { mass: 1, g: env.g, rho: 1.225, cd: 0.47, area: 0.01 };
    const dragSummary = summarizeSamples(integrateVertical1D(100, 0, env, drag, { step: 0.05 }))!;
    const vacuumSummary = computeVertical1DSummary({ h0: 100, v0: 0 }, env)!;

    expect(dragSummary.impactSpeed).toBeGreaterThan(0);
    expect(dragSummary.impactSpeed).toBeLessThan(vacuumSummary.impactSpeed);
    expect(dragSummary.flightTime).toBeGreaterThan(vacuumSummary.flightTime);
    expect(dragSummary.impactVelocityY).toBeLessThan(0);
  });

  it('finds the apex of an upward throw', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateVertical1D(0, 20, env, noDrag, { step: 0.01 }))!;
    expect(summary.maxHeight).toBeCloseTo((20 * 20) / (2 * env.g), 1);
    expect(summary.timeToMaxHeight).toBeCloseTo(20 / env.g, 1);
  });

  it('reports horizontal distance and impact angle for a 2D run', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateProjectile2D(0, 20, 45, env, noDrag, { step: 0.01 }))!;
    expect(summary.horizontalDistance).toBeCloseTo(40.8, 0);
    expect(summary.impactAngle).toBeCloseTo(-45, 0);
  });

  it('omits horizontal fields for a purely vertical run', () => {
    const noDrag = { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 };
    const summary = summarizeSamples(integrateVertical1D(10, 0, env, noDrag, { step: 0.01 }))!;
    expect(summary.horizontalDistance).toBeUndefined();
    expect(summary.impactAngle).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w physics-engine -- summary`
Expected: FAIL with `Failed to resolve import "../src/simulation/summary"`.

- [ ] **Step 3: Rename the summary fields**

In `packages/physics-engine/src/types.ts`, replace the `ScenarioSummary` interface (lines 61-68) with:

```ts
export interface ScenarioSummary {
  flightTime: number;
  /** Always a non-negative magnitude. */
  impactSpeed: number;
  /** Signed vertical velocity at impact (negative when descending). */
  impactVelocityY: number;
  maxHeight: number;
  timeToMaxHeight?: number;
  impactAngle?: number;
  horizontalDistance?: number;
}
```

In `packages/physics-engine/src/motion/free-fall.ts`, replace the `return` block of `computeVertical1DSummary` (lines 29-34) with:

```ts
  return {
    flightTime: impact,
    maxHeight: maxH,
    impactSpeed: Math.abs(impactVelocity),
    impactVelocityY: impactVelocity,
    timeToMaxHeight: tMax ?? undefined,
  };
```

In `packages/physics-engine/src/motion/projectile.ts`, replace the `return` block of `computeProjectileSummary` (lines 36-43) with:

```ts
  return {
    flightTime: impact,
    maxHeight: maxH,
    impactSpeed,
    impactVelocityY: end.vy,
    impactAngle,
    horizontalDistance: end.x,
    timeToMaxHeight: tMax ?? undefined,
  };
```

- [ ] **Step 4: Write `summarizeSamples`**

Create `packages/physics-engine/src/simulation/summary.ts`:

```ts
import { radToDeg } from '../units';
import type { MotionSample, ScenarioSummary } from '../types';

/**
 * Derives a scenario summary from an already-integrated trajectory. Use this
 * whenever the trajectory came from numerical integration, so the reported
 * flight time and impact speed match the samples the user is looking at.
 */
export function summarizeSamples(samples: MotionSample[]): ScenarioSummary | null {
  if (samples.length === 0) return null;

  const first = samples[0]!;
  const last = samples[samples.length - 1]!;

  let maxHeight = first.y;
  let timeToMaxHeight = first.t;
  let movesHorizontally = false;

  for (const sample of samples) {
    if (sample.y > maxHeight) {
      maxHeight = sample.y;
      timeToMaxHeight = sample.t;
    }
    if (sample.x !== 0) movesHorizontally = true;
  }

  const summary: ScenarioSummary = {
    flightTime: last.t,
    maxHeight,
    impactSpeed: last.speed,
    impactVelocityY: last.vy,
    timeToMaxHeight,
  };

  if (movesHorizontally) {
    summary.horizontalDistance = last.x;
    summary.impactAngle = radToDeg(Math.atan2(last.vy, last.vx));
  }

  return summary;
}
```

Add to `packages/physics-engine/src/index.ts`, immediately after the `./simulation/compare` line:

```ts
export * from './simulation/summary';
```

- [ ] **Step 5: Update the two engine tests that used the old field name**

In `packages/physics-engine/tests/free-fall.test.ts` line 19, change

```ts
    expect(summary!.impactVelocity).toBeCloseTo(-14.0, 0);
```

to

```ts
    expect(summary!.impactVelocityY).toBeCloseTo(-14.0, 0);
    expect(summary!.impactSpeed).toBeCloseTo(14.0, 0);
```

In `packages/physics-engine/tests/vertical-throw.test.ts` line 17, change

```ts
    expect(summary!.impactVelocity).toBeLessThan(-5);
```

to

```ts
    expect(summary!.impactVelocityY).toBeLessThan(-5);
```

- [ ] **Step 6: Run the engine tests**

Run: `npm test -w physics-engine`
Expected: PASS, 50 tests.

- [ ] **Step 7: Use the sample-derived summary on the drag branch**

In `packages/web/src/hooks/useMotionScenario.ts`:

Add `summarizeSamples` to the `physics-engine` import list (alphabetically it belongs after `solveProjectile`; exact placement does not matter as long as it compiles).

In the `if (dragEnabled)` / `kind === 'vertical1d'` branch, replace

```ts
        const summary = computeVertical1DSummary({ h0, v0 }, env);
```

with

```ts
        const summary = summarizeSamples(samples);
```

In the `if (dragEnabled)` projectile branch, replace

```ts
      const summary = computeProjectileSummary({ h0, v0, angleDeg }, env);
```

with

```ts
      const summary = summarizeSamples(samples);
```

Leave the two non-drag branches using the analytic `computeVertical1DSummary` / `computeProjectileSummary` — those are exact there and cheaper.

- [ ] **Step 8: Use `impactSpeed` in the two pages**

In `packages/web/src/components/VerticalScenarioPage.tsx` line 156, replace

```tsx
  const impactSpeed = scenario.summary ? Math.abs(scenario.summary.impactVelocity) : undefined;
```

with

```tsx
  const impactSpeed = scenario.summary?.impactSpeed;
```

Make the identical replacement in `packages/web/src/pages/ProjectilePage.tsx` line 151.

- [ ] **Step 9: Verify no stale references remain**

Run: `git grep -n "impactVelocity" -- packages`
Expected: hits only in `solve/types.ts`, `solve/vertical-1d.ts`, `solve/projectile.ts`, `VerticalScenarioPage.tsx` (the `FIELD_LABELS` / `VERTICAL_FIELDS` entries), `ProjectilePage.tsx` (same), `tests/solve-vertical-1d.test.ts`, and `tests/solve-projectile.test.ts`. No hits in `types.ts`, `motion/`, `simulation/`, or `useMotionScenario.ts`.

Run: `npm test && npm run build`
Expected: both exit 0.

- [ ] **Step 10: Verify in the browser**

Run: `npm run dev` and open `http://localhost:5173/Physics-Lab/motion/free-fall?h0=100&drag=1&atmosphere=earthSeaLevel&cd=0.47&area=0.01&impact=1`. Confirm the Results panel's flight time is longer than 4.5 s and that the Impact-analysis panel's "Impact speed" reads about 38.7 m/s, not 44.3 m/s.

- [ ] **Step 11: Commit**

```bash
git add packages/physics-engine/src/types.ts packages/physics-engine/src/motion/free-fall.ts packages/physics-engine/src/motion/projectile.ts packages/physics-engine/src/simulation/summary.ts packages/physics-engine/src/index.ts packages/physics-engine/tests/summary.test.ts packages/physics-engine/tests/free-fall.test.ts packages/physics-engine/tests/vertical-throw.test.ts packages/web/src/hooks/useMotionScenario.ts packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx
git commit -m "fix: derive the results summary from the drag trajectory and split impactSpeed from impactVelocityY"
```

---

### Task 7: Make the 1D solver detect contradictory inputs (F-06)

`verifyGiven(state, given)` compares `state[key]` with `given[key]`, but `state` was initialised as `{ ...given }`, so the two are equal by construction and the function always returns an empty array. `setValue` already refuses to overwrite a conflicting value but throws the information away. Measured: `h0=100, v0=0, impactTime=1` (true value 4.516 s) returns `status: 'solved'`.

Fix: have `setValue` record conflicts into a shared array and report them.

**Files:**
- Modify: `packages/physics-engine/src/solve/vertical-1d.ts`
- Test: `packages/physics-engine/tests/solve-vertical-1d.test.ts`

**Interfaces:**
- `solveVertical1D(fields, env)` keeps its signature. It now returns `{ status: 'overconstrained', message: 'Given values are inconsistent', conflicts: string[] }` when a derived value contradicts a given one. Each conflict string has the form `` `${field}: given ${given}, computed ${computed}` ``.

- [ ] **Step 1: Write the failing test**

Append to `packages/physics-engine/tests/solve-vertical-1d.test.ts`, inside the existing `describe('solveVertical1D', ...)`:

```ts
  it('reports contradictory given values as overconstrained', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 100],
        ['v0', 'given', 0],
        ['impactTime', 'given', 1],
        ['impactVelocity', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
    if (result.status === 'overconstrained') {
      expect(result.conflicts.join(' ')).toContain('impactTime');
    }
  });

  it('accepts consistent redundant given values', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['v0', 'given', 0],
        ['impactTime', 'given', 1.4278],
        ['impactVelocity', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
  });

  it('still reports a duplicated field with different values', () => {
    const result = solveVertical1D(
      fields([
        ['h0', 'given', 10],
        ['h0', 'given', 20],
        ['impactTime', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w physics-engine -- solve-vertical-1d`
Expected: FAIL on the first new test: `expected 'solved' to be 'overconstrained'`.

- [ ] **Step 3: Thread a conflicts array through `setValue`**

In `packages/physics-engine/src/solve/vertical-1d.ts`, replace the `setValue` function (lines 19-29) with:

```ts
function setValue(
  state: State,
  field: Vertical1DFieldId,
  value: number,
  steps: SolveStep[],
  step: SolveStep,
  conflicts: string[],
): boolean {
  const existing = state[field];
  if (existing !== undefined) {
    if (!approxEqual(existing, value)) {
      conflicts.push(`${field}: given ${existing}, computed ${value}`);
    }
    return false;
  }
  state[field] = value;
  addStep(steps, step);
  return true;
}
```

Note the change from `field in state` to `state[field] !== undefined`: both are equivalent here because the state map is only ever populated with numbers, and the explicit check reads better.

- [ ] **Step 4: Pass the array down and delete the dead verifier**

Change the two derive helpers' signatures and every `setValue(...)` call inside them to take `conflicts` as the last argument:

```ts
function deriveFromBasics(state: State, g: number, steps: SolveStep[], conflicts: string[]): boolean {
```

```ts
function deriveBasics(state: State, g: number, steps: SolveStep[], conflicts: string[]): boolean {
```

There are 10 `setValue(` calls between the two functions; append `, conflicts` to the argument list of each (after the step object literal).

Delete the `verifyGiven` function entirely (lines 165-174).

In `solveVertical1D`, replace the fixed-point loop and the conflict check (lines 207-220) with:

```ts
  const state: State = { ...given };
  const conflicts: string[] = [];
  let iterations = 0;
  let changed = true;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;
    changed = deriveBasics(state, g, steps, conflicts) || changed;
    changed = deriveFromBasics(state, g, steps, conflicts) || changed;
  }

  if (conflicts.length > 0) {
    return {
      status: 'overconstrained',
      message: 'Given values are inconsistent',
      conflicts: [...new Set(conflicts)],
    };
  }
```

The `new Set` dedupe matters because the fixed-point loop runs the derivations repeatedly and would otherwise push the same conflict up to 20 times.

- [ ] **Step 5: Remove the fourth dead branch in `deriveBasics`**

The block at lines 136-147 (`v0 !== undefined && t !== undefined && v !== undefined && h0 === undefined`) recomputes exactly what the preceding block computes, and only when `y` is also known — `v` is not used at all. Delete the whole block. Physically, `v₀`, `t`, and `v` do not determine `h₀`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -w physics-engine -- solve-vertical-1d`
Expected: PASS, 7 tests.

Run: `npm test && npm run build`
Expected: both exit 0.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev` and open `http://localhost:5173/Physics-Lab/motion/free-fall?h0=100&h0_mode=given&v0=0&v0_mode=given&impactTime=1&impactTime_mode=given&impactVelocity_mode=solve`. Confirm the Results panel shows the red error text "Given values are inconsistent" instead of a number.

- [ ] **Step 8: Commit**

```bash
git add packages/physics-engine/src/solve/vertical-1d.ts packages/physics-engine/tests/solve-vertical-1d.test.ts
git commit -m "fix: detect contradictory given values in the 1D solver"
```

---

## Phase 2 — Solver parity, validation, shell, and rendering

### Task 8: Bring the projectile solver up to parity with the 1D solver (F-19, F-20)

`solveProjectile` is missing four things the 1D solver has: a duplicate-given check, conflict detection, a computed speed `v`, and any way to work backwards from the velocity components. It also cannot solve for `angle`, which is one of the most natural projectile questions ("what angle do I need for a 50 m range?").

**Files:**
- Modify: `packages/physics-engine/src/solve/projectile.ts`
- Modify: `packages/physics-engine/src/solve/types.ts:27-35`
- Modify: `packages/web/src/pages/ProjectilePage.tsx`
- Test: `packages/physics-engine/tests/solve-projectile.test.ts`

**Interfaces:**
- Produces: `solveProjectile` keeps its signature `(fields: FieldSpec<ProjectileFieldId>[], env: Environment) => SolveStatus`. New capabilities:
  - Given `vx` and `vy`, it derives `v0 = hypot(vx, vy)` and `angle = radToDeg(atan2(vy, vx))`.
  - Given `h0 = 0`, `v0`, and `range`, it derives `angle` from `sin(2θ) = R·g / v₀²`, returning the low-angle solution in `values.angle` and both solutions in `multiValues.angle`.
  - It computes `v` (speed at time `t`) whenever `t` is known.
  - It returns `overconstrained` with the same conflict-string format as the 1D solver.

- [ ] **Step 1: Write the failing tests**

Append to `packages/physics-engine/tests/solve-projectile.test.ts`, inside the existing `describe`:

```ts
  it('derives v0 and angle from the velocity components', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['vx', 'given', 10],
        ['vy', 'given', 10],
        ['v0', 'solve'],
        ['angle', 'solve'],
        ['range', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.v0).toBeCloseTo(Math.SQRT2 * 10, 4);
      expect(result.values.angle).toBeCloseTo(45, 4);
      expect(result.values.range).toBeCloseTo(20.394, 2);
    }
  });

  it('solves for the launch angle that produces a given range', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['range', 'given', 40.7886],
        ['angle', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.angle).toBeCloseTo(45, 1);
      expect(result.multiValues?.angle?.length).toBe(2);
    }
  });

  it('rejects a range that exceeds the maximum for the given speed', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 10],
        ['range', 'given', 1000],
        ['angle', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('noSolution');
  });

  it('computes the speed at a given time', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 90],
        ['t', 'given', 1],
        ['v', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.values.v).toBeCloseTo(20 - earthEnv.g, 3);
    }
  });

  it('reports contradictory given values as overconstrained', () => {
    const result = solveProjectile(
      fields([
        ['h0', 'given', 0],
        ['v0', 'given', 20],
        ['angle', 'given', 45],
        ['range', 'given', 5],
        ['flightTime', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
  });

  it('reports a field given twice with different values', () => {
    const result = solveProjectile(
      fields([
        ['v0', 'given', 20],
        ['v0', 'given', 30],
        ['range', 'solve'],
      ]),
      earthEnv,
    );
    expect(result.status).toBe('overconstrained');
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -w physics-engine -- solve-projectile`
Expected: FAIL on all six new tests (mostly `expected 'underdetermined' to be 'solved'`).

- [ ] **Step 3: Add the missing field id**

In `packages/physics-engine/src/solve/types.ts`, the `ProjectileFieldId` union already contains `'vx'`, `'vy'`, and inherits `'v'` from `Vertical1DFieldId`. No change is required — confirm this by reading lines 16-35, then move on.

- [ ] **Step 4: Rewrite `solveProjectile`**

Replace the entire contents of `packages/physics-engine/src/solve/projectile.ts` with:

```ts
import { degToRad, radToDeg } from '../units';
import type { Environment } from '../types';
import { firstImpactTime, maxHeight1D, positionProjectile } from '../motion/kinematics';
import type { FieldSpec, ProjectileFieldId, SolveStatus, SolveStep, Vertical1DFieldId } from './types';
import { approxEqual } from './types';
import { solveVertical1D } from './vertical-1d';

type State = Partial<Record<ProjectileFieldId, number>>;

const VERTICAL_FIELD_IDS: string[] = [
  'h0',
  'v0',
  't',
  'y',
  'v',
  'impactTime',
  'impactVelocity',
  'maxHeight',
  'timeToMaxHeight',
];

function setValue(
  state: State,
  field: ProjectileFieldId,
  value: number,
  steps: SolveStep[],
  step: SolveStep,
  conflicts: string[],
): void {
  const existing = state[field];
  if (existing !== undefined) {
    if (!approxEqual(existing, value)) {
      conflicts.push(`${field}: given ${existing}, computed ${value}`);
    }
    return;
  }
  state[field] = value;
  steps.push(step);
}

/** Launch angles (deg, ascending) that give `range` for `v0` on flat ground. */
function anglesForRange(v0: number, range: number, g: number): number[] {
  if (v0 <= 0 || range <= 0) return [];
  const sin2Theta = (range * g) / (v0 * v0);
  if (sin2Theta > 1) return [];
  const low = radToDeg(Math.asin(sin2Theta)) / 2;
  const high = 90 - low;
  return approxEqual(low, high) ? [low] : [low, high];
}

export function solveProjectile(
  fields: FieldSpec<ProjectileFieldId>[],
  env: Environment,
): SolveStatus {
  const given: State = {};
  const toSolve = new Set<ProjectileFieldId>();
  const steps: SolveStep[] = [];
  const conflicts: string[] = [];

  for (const f of fields) {
    if (f.mode === 'given') {
      if (f.value === undefined || !Number.isFinite(f.value)) {
        return { status: 'noSolution', message: `Given field "${f.id}" needs a numeric value` };
      }
      const existing = given[f.id];
      if (existing !== undefined && !approxEqual(existing, f.value)) {
        return {
          status: 'overconstrained',
          message: 'Conflicting given values',
          conflicts: [`${f.id} specified twice with different values`],
        };
      }
      given[f.id] = f.value;
    } else {
      toSolve.add(f.id);
    }
  }

  if (toSolve.size === 0) {
    return { status: 'underdetermined', message: 'Mark at least one field as solve for', missing: [] };
  }

  const g = env.g;
  const state: State = { ...given };
  const multiValues: Record<string, number[]> = {};

  // Recover the launch vector from whatever the user supplied.
  if (state.v0 === undefined && state.vx !== undefined && state.vy !== undefined) {
    const speed = Math.hypot(state.vx, state.vy);
    setValue(state, 'v0', speed, steps, {
      equation: 'v₀ = √(v_x² + v_y²)',
      description: 'Launch speed from components',
      field: 'v0',
      result: speed,
    }, conflicts);
    const derivedAngle = radToDeg(Math.atan2(state.vy, state.vx));
    setValue(state, 'angle', derivedAngle, steps, {
      equation: 'θ = atan2(v_y, v_x)',
      description: 'Launch angle from components',
      field: 'angle',
      result: derivedAngle,
    }, conflicts);
  }

  if (
    state.angle === undefined &&
    state.v0 !== undefined &&
    state.range !== undefined &&
    (state.h0 === undefined || approxEqual(state.h0, 0))
  ) {
    const angles = anglesForRange(state.v0, state.range, g);
    if (angles.length === 0) {
      return {
        status: 'noSolution',
        message: 'That range is not reachable at this launch speed on flat ground',
      };
    }
    multiValues.angle = angles;
    setValue(state, 'angle', angles[0]!, steps, {
      equation: 'sin(2θ) = R g / v₀²',
      description: 'Launch angle from range (flat ground; low-angle solution)',
      field: 'angle',
      result: angles[0]!,
    }, conflicts);
  }

  const h0 = state.h0;
  const v0 = state.v0;
  const angle = state.angle;

  if (h0 !== undefined && v0 !== undefined && angle !== undefined) {
    const angleRad = degToRad(angle);
    const vy0 = v0 * Math.sin(angleRad);

    if (state.t !== undefined) {
      const pos = positionProjectile(h0, v0, angleRad, g, state.t);
      const speedAtT = Math.hypot(pos.vx, pos.vy);
      setValue(state, 'x', pos.x, steps, {
        equation: 'x = v₀ cos(θ) t',
        description: 'Horizontal position at t',
        field: 'x',
        result: pos.x,
      }, conflicts);
      setValue(state, 'y', pos.y, steps, {
        equation: 'y = h₀ + v₀ sin(θ) t − ½gt²',
        description: 'Vertical position at t',
        field: 'y',
        result: pos.y,
      }, conflicts);
      setValue(state, 'vx', pos.vx, steps, {
        equation: 'v_x = v₀ cos(θ)',
        description: 'Horizontal velocity',
        field: 'vx',
        result: pos.vx,
      }, conflicts);
      setValue(state, 'vy', pos.vy, steps, {
        equation: 'v_y = v₀ sin(θ) − gt',
        description: 'Vertical velocity at t',
        field: 'vy',
        result: pos.vy,
      }, conflicts);
      setValue(state, 'v', speedAtT, steps, {
        equation: '|v| = √(v_x² + v_y²)',
        description: 'Speed at t',
        field: 'v',
        result: speedAtT,
      }, conflicts);
    }

    const impact = firstImpactTime(h0, vy0, g);
    if (impact !== null) {
      const end = positionProjectile(h0, v0, angleRad, g, impact);
      const impactSpeed = Math.hypot(end.vx, end.vy);
      const impactAngle = radToDeg(Math.atan2(end.vy, end.vx));
      setValue(state, 'flightTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Flight time',
        field: 'flightTime',
        result: impact,
      }, conflicts);
      setValue(state, 'impactTime', impact, steps, {
        equation: 'y(t) = 0',
        description: 'Impact time',
        field: 'impactTime',
        result: impact,
      }, conflicts);
      setValue(state, 'range', end.x, steps, {
        equation: 'R = v₀ cos(θ) · t_impact',
        description: 'Horizontal range',
        field: 'range',
        result: end.x,
      }, conflicts);
      setValue(state, 'impactVelocity', impactSpeed, steps, {
        equation: '|v| at impact',
        description: 'Impact speed',
        field: 'impactVelocity',
        result: impactSpeed,
      }, conflicts);
      setValue(state, 'impactAngle', impactAngle, steps, {
        equation: 'atan2(v_y, v_x)',
        description: 'Impact angle',
        field: 'impactAngle',
        result: impactAngle,
      }, conflicts);
    }

    const maxH = maxHeight1D(h0, vy0, g);
    setValue(state, 'maxHeight', maxH, steps, {
      equation: 'h_max = h₀ + (v₀ sin θ)²/(2g)',
      description: 'Maximum height',
      field: 'maxHeight',
      result: maxH,
    }, conflicts);

    if (vy0 > 0) {
      setValue(state, 'timeToMaxHeight', vy0 / g, steps, {
        equation: 't_max = v₀ sin(θ) / g',
        description: 'Time to max height',
        field: 'timeToMaxHeight',
        result: vy0 / g,
      }, conflicts);
    }
  } else {
    const verticalFields = fields.filter((f) => VERTICAL_FIELD_IDS.includes(f.id));
    if (verticalFields.length > 0) {
      const vResult = solveVertical1D(verticalFields as FieldSpec<Vertical1DFieldId>[], env);
      if (vResult.status === 'solved') {
        Object.assign(state, vResult.values);
      }
    }
  }

  if (conflicts.length > 0) {
    return {
      status: 'overconstrained',
      message: 'Given values are inconsistent',
      conflicts: [...new Set(conflicts)],
    };
  }

  const missing: string[] = [];
  for (const id of toSolve) {
    if (state[id] === undefined && multiValues[id] === undefined) missing.push(id);
  }

  if (missing.length > 0) {
    if (state.h0 === undefined || state.v0 === undefined || state.angle === undefined) {
      return {
        status: 'underdetermined',
        message: 'Need h₀, v₀, and launch angle (or enough info to derive them)',
        missing,
      };
    }
    return {
      status: 'underdetermined',
      message: 'Not enough information to solve for all fields',
      missing,
    };
  }

  const values: Record<string, number> = {};
  for (const id of toSolve) {
    const resolved = state[id];
    if (resolved !== undefined) values[id] = resolved;
  }

  return {
    status: 'solved',
    values,
    multiValues: Object.keys(multiValues).length > 0 ? multiValues : undefined,
    steps,
  };
}

export function resolvedProjectileInputs(
  solveResult: Extract<SolveStatus, { status: 'solved' }>,
  given: Partial<Record<ProjectileFieldId, number>>,
): { h0: number; v0: number; angleDeg: number } | null {
  const h0 = given.h0 ?? solveResult.values.h0;
  const v0 = given.v0 ?? solveResult.values.v0;
  const angleDeg = given.angle ?? solveResult.values.angle;
  if (h0 === undefined || v0 === undefined || angleDeg === undefined) return null;
  return { h0, v0, angleDeg };
}
```

Note the deliberate behaviour change in the `else` branch: the old code returned the 1D solver's failure status directly, which masked projectile-specific messages. It now only merges a successful 1D result and lets the shared `missing` logic below produce the message.

- [ ] **Step 5: Run the tests**

Run: `npm test -w physics-engine -- solve-projectile`
Expected: PASS, 8 tests.

- [ ] **Step 6: Surface `missing` and multi-values on the Projectile page**

In `packages/web/src/pages/ProjectilePage.tsx`, replace the `error` computation (lines 135-139) with the same shape the vertical page uses:

```tsx
  const multi = scenario.solveResult.status === 'solved' ? scenario.solveResult.multiValues : undefined;

  const error = scenario.dragEnabled
    ? undefined
    : scenario.solveResult.status === 'underdetermined'
      ? scenario.solveResult.message +
        (scenario.solveResult.missing.length ? `: ${scenario.solveResult.missing.join(', ')}` : '')
      : scenario.solveResult.status === 'overconstrained'
        ? `${scenario.solveResult.message} (${scenario.solveResult.conflicts.join('; ')})`
        : scenario.solveResult.status === 'noSolution'
          ? scenario.solveResult.message
          : undefined;
```

and replace the `resultItems` mapping (lines 141-145) with:

```tsx
  const resultItems = PROJECTILE_FIELDS.filter((f) => modes[f] === 'solve').map((f) => ({
    label: FIELD_LABELS[f]!.label,
    value: solved[f],
    unit: FIELD_LABELS[f]!.unit,
    multi: multi?.[f],
  }));
```

Apply the same `overconstrained` conflict-string improvement to `packages/web/src/components/VerticalScenarioPage.tsx` — replace its line 140 (`? scenario.solveResult.message`, in the `overconstrained` position) with:

```tsx
        ? `${scenario.solveResult.message} (${scenario.solveResult.conflicts.join('; ')})`
```

- [ ] **Step 7: Add `vx` and `vy` to the projectile field list**

In `packages/web/src/pages/ProjectilePage.tsx`, add the two new fields so the new solver capability is reachable from the UI.

Change `PROJECTILE_FIELDS` (lines 16-19) to:

```tsx
const PROJECTILE_FIELDS = [
  'h0', 'v0', 'angle', 'vx', 'vy', 't', 'x', 'y', 'v', 'range', 'flightTime',
  'maxHeight', 'impactVelocity', 'impactAngle', 'timeToMaxHeight',
] as const;
```

Add to `FIELD_LABELS`:

```tsx
  vx: { label: 'Horizontal velocity vₓ', unit: 'm/s', default: 14.14 },
  vy: { label: 'Vertical velocity v_y', unit: 'm/s', default: 14.14 },
  v: { label: 'Speed at time t', unit: 'm/s', default: 0 },
```

Add to `DEFAULT_MODES`:

```tsx
  vx: 'solve',
  vy: 'solve',
  v: 'solve',
```

- [ ] **Step 8: Verify and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and open `http://localhost:5173/Physics-Lab/motion/projectile`. Set `v₀` to Given 20, `range` to Given 40.79, and `angle` to Solve; confirm the angle result reads about 45 and lists both 45 and 45 (or, with range 30, both 24.6 and 65.4).

```bash
git add packages/physics-engine/src/solve/projectile.ts packages/physics-engine/tests/solve-projectile.test.ts packages/web/src/pages/ProjectilePage.tsx packages/web/src/components/VerticalScenarioPage.tsx
git commit -m "feat: solve for launch angle and speed components, and detect projectile conflicts"
```

---

### Task 9: Validate and clamp physical inputs (F-18)

`validateVertical1DInputs` and `validateProjectileInputs` are exported from the engine and never called. The UI accepts negative mass, negative initial height, and launch angles outside 0-90°, and `Number(values.mass) || 1` silently rewrites a mass of 0 to 1 rather than telling the user it is invalid.

**Files:**
- Modify: `packages/physics-engine/src/motion/free-fall.ts:11-18`
- Modify: `packages/physics-engine/src/motion/projectile.ts:10-21`
- Modify: `packages/web/src/hooks/useMotionScenario.ts`
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx`
- Modify: `packages/web/src/pages/ProjectilePage.tsx`
- Test: `packages/physics-engine/tests/validation.test.ts`

**Interfaces:**
- Produces:

```ts
// packages/physics-engine/src/motion/free-fall.ts
export function validateVertical1DInputs(inputs: Vertical1DInputs): ValidationResult;
// packages/physics-engine/src/motion/projectile.ts
export function validateProjectileInputs(inputs: ProjectileInputs): ValidationResult;
export function validateEnvironment(env: Environment): ValidationResult;  // new, in free-fall.ts
```

`MotionScenarioResult` gains `inputErrors: string[]`. When it is non-empty, `samples` is `[]` and `summary` is `null`.

- [ ] **Step 1: Write the failing test**

Create `packages/physics-engine/tests/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateEnvironment, validateVertical1DInputs } from '../src/motion/free-fall';
import { validateProjectileInputs } from '../src/motion/projectile';

describe('validateEnvironment', () => {
  it('rejects non-positive mass', () => {
    const result = validateEnvironment({ planet: 'earth', g: 9.80665, mass: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Mass');
  });

  it('rejects non-positive gravity', () => {
    expect(validateEnvironment({ planet: 'custom', g: 0, mass: 1 }).valid).toBe(false);
    expect(validateEnvironment({ planet: 'custom', g: -3, mass: 1 }).valid).toBe(false);
  });

  it('accepts a sane environment', () => {
    expect(validateEnvironment({ planet: 'earth', g: 9.80665, mass: 2 }).valid).toBe(true);
  });
});

describe('validateVertical1DInputs', () => {
  it('rejects a negative initial height', () => {
    expect(validateVertical1DInputs({ h0: -1, v0: 0 }).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateVertical1DInputs({ h0: Number.NaN, v0: 0 }).valid).toBe(false);
  });

  it('accepts a downward throw', () => {
    expect(validateVertical1DInputs({ h0: 10, v0: -5 }).valid).toBe(true);
  });
});

describe('validateProjectileInputs', () => {
  it('rejects an angle above 90 degrees', () => {
    expect(validateProjectileInputs({ h0: 0, v0: 10, angleDeg: 120 }).valid).toBe(false);
  });

  it('rejects a negative launch speed', () => {
    expect(validateProjectileInputs({ h0: 0, v0: -10, angleDeg: 45 }).valid).toBe(false);
  });

  it('accepts a level launch', () => {
    expect(validateProjectileInputs({ h0: 5, v0: 10, angleDeg: 0 }).valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w physics-engine -- validation`
Expected: FAIL with `validateEnvironment is not a function`.

- [ ] **Step 3: Tighten the validators**

In `packages/physics-engine/src/motion/free-fall.ts`, replace `validateVertical1DInputs` (lines 11-18) with:

```ts
export function validateVertical1DInputs(inputs: Vertical1DInputs): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(inputs.h0) || !Number.isFinite(inputs.v0)) {
    errors.push('Initial height and velocity must be finite numbers');
  } else if (inputs.h0 < 0) {
    errors.push('Initial height must be non-negative (the ground is at y = 0)');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEnvironment(env: Environment): ValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(env.mass) || env.mass <= 0) {
    errors.push('Mass must be a positive number');
  }
  if (!Number.isFinite(env.g) || env.g <= 0) {
    errors.push('Gravitational acceleration must be a positive number');
  }
  return { valid: errors.length === 0, errors };
}
```

In `packages/physics-engine/src/motion/projectile.ts`, replace `validateProjectileInputs` (lines 10-21) with:

```ts
export function validateProjectileInputs(inputs: ProjectileInputs): ValidationResult {
  const errors: string[] = [];
  if (
    !Number.isFinite(inputs.h0) ||
    !Number.isFinite(inputs.v0) ||
    !Number.isFinite(inputs.angleDeg)
  ) {
    errors.push('All inputs must be finite numbers');
    return { valid: false, errors };
  }
  if (inputs.h0 < 0) errors.push('Initial height must be non-negative (the ground is at y = 0)');
  if (inputs.v0 < 0) errors.push('Launch speed must be non-negative');
  if (inputs.angleDeg < 0 || inputs.angleDeg > 90) {
    errors.push('Launch angle must be between 0° and 90°');
  }
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w physics-engine -- validation`
Expected: PASS, 9 tests.

- [ ] **Step 5: Call the validators from the scenario hook**

In `packages/web/src/hooks/useMotionScenario.ts`:

Add `validateEnvironment`, `validateVertical1DInputs`, and `validateProjectileInputs` to the `physics-engine` import list.

Add `inputErrors: string[];` to the `MotionScenarioResult` interface.

Immediately after `const env: Environment = { planet, g, mass };` inside the `useMemo`, insert:

```ts
    const h0Raw = values.h0 ?? 0;
    const v0Raw = values.v0 ?? 0;
    const angleRaw = values.angle ?? 45;

    const inputErrors = [
      ...validateEnvironment(env).errors,
      ...(kind === 'vertical1d'
        ? validateVertical1DInputs({ h0: h0Raw, v0: v0Raw }).errors
        : validateProjectileInputs({ h0: h0Raw, v0: v0Raw, angleDeg: angleRaw }).errors),
    ];

    if (inputErrors.length > 0) {
      return {
        env,
        solveResult: { status: 'noSolution' as const, message: inputErrors.join('; ') },
        summary: null,
        samples: [],
        vacuumSamples: [],
        h0: h0Raw,
        v0: v0Raw,
        angleDeg: kind === 'projectile' ? angleRaw : undefined,
        dragEnabled: false,
        inputErrors,
      };
    }
```

Then add `inputErrors: []` to each of the four remaining `return` statements in the hook.

Important: the validators run on the *given* inputs, so if `h0` is in Solve mode its stale URL value is still checked. Guard against that by only validating fields that are in Given mode. Replace the `inputErrors` construction above with:

```ts
    const h0ForCheck = modes.h0 === 'given' ? (values.h0 ?? 0) : 0;
    const v0ForCheck = modes.v0 === 'given' ? (values.v0 ?? 0) : 0;
    const angleForCheck = modes.angle === 'given' ? (values.angle ?? 45) : 45;

    const inputErrors = [
      ...validateEnvironment(env).errors,
      ...(kind === 'vertical1d'
        ? validateVertical1DInputs({ h0: h0ForCheck, v0: v0ForCheck }).errors
        : validateProjectileInputs({ h0: h0ForCheck, v0: v0ForCheck, angleDeg: angleForCheck }).errors),
    ];
```

- [ ] **Step 6: Stop silently rewriting mass and g in the pages**

In both `packages/web/src/components/VerticalScenarioPage.tsx` (lines 116-117) and `packages/web/src/pages/ProjectilePage.tsx` (lines 117-118), replace

```tsx
  const customG = Number(values.customG) || 9.80665;
  const mass = Number(values.mass) || 1;
```

with

```tsx
  const rawCustomG = Number(values.customG);
  const rawMass = Number(values.mass);
  const customG = Number.isFinite(rawCustomG) ? rawCustomG : 9.80665;
  const mass = Number.isFinite(rawMass) ? rawMass : 1;
```

`resolveGravity` throws for a non-positive custom `g`, so also guard that call. In `useMotionScenario`, replace

```ts
    const g = resolveGravity(planet, customG);
```

with

```ts
    const g = planet === 'custom' && !(customG > 0) ? Number.NaN : resolveGravity(planet, customG);
```

`validateEnvironment` then reports the NaN as "Gravitational acceleration must be a positive number" instead of the app crashing on an uncaught throw.

- [ ] **Step 7: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and open `http://localhost:5173/Physics-Lab/motion/free-fall?mass=0`. Confirm the Results panel shows "Mass must be a positive number" and the simulation panel shows the "Run a valid scenario" placeholder rather than rendering nonsense. Then try `?planet=custom&customG=-5` and `?h0=-10&h0_mode=given`.

- [ ] **Step 8: Commit**

```bash
git add packages/physics-engine/src/motion/free-fall.ts packages/physics-engine/src/motion/projectile.ts packages/physics-engine/tests/validation.test.ts packages/web/src/hooks/useMotionScenario.ts packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx
git commit -m "fix: validate mass, gravity, height, and launch angle before running a scenario"
```

---

### Task 10: Fix GitHub Pages deep links and harden the app shell (F-08, F-34)

`public/404.html` saves the requested URL into `sessionStorage.redirect` and then hard-redirects to the app root, but nothing ever reads that value, so every deep link on the deployed site silently lands on the home page. There is also no catch-all route (unknown paths render an empty `<main>`), no error boundary, no favicon, and no per-route document title.

**Files:**
- Modify: `packages/web/public/404.html`
- Modify: `packages/web/index.html`
- Create: `packages/web/public/favicon.svg`
- Create: `packages/web/src/components/layout/ErrorBoundary.tsx`
- Create: `packages/web/src/pages/NotFoundPage.tsx`
- Create: `packages/web/src/hooks/useDocumentTitle.ts`
- Modify: `packages/web/src/routes.tsx`
- Modify: `packages/web/src/components/layout/AppShell.tsx`

**Interfaces:**
- Produces: `useDocumentTitle(title: string): void` — sets `document.title` to `` `${title} · Physics Lab` `` and restores `'Physics Lab'` on unmount. `ErrorBoundary` is a class component with props `{ children: ReactNode }`.

- [ ] **Step 1: Make the 404 shim encode the path and have the app consume it**

Replace the entire contents of `packages/web/public/404.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Physics Lab</title>
    <script>
      // GitHub Pages serves this file for any unknown path under /Physics-Lab/.
      // Encode the requested route into a query param and let the SPA restore it.
      (function () {
        var base = '/Physics-Lab/';
        var path = window.location.pathname;
        var route = path.indexOf(base) === 0 ? path.slice(base.length) : '';
        var target =
          base +
          '?spaRedirect=' +
          encodeURIComponent(route + window.location.search.replace(/^\?/, '&').replace(/^&/, '?') + window.location.hash);
        window.location.replace(target);
      })();
    </script>
  </head>
  <body></body>
</html>
```

The `search` juggling above is fiddly; use this simpler and equivalent form instead:

```html
      (function () {
        var base = '/Physics-Lab/';
        var path = window.location.pathname;
        var route = path.indexOf(base) === 0 ? path.slice(base.length) : '';
        var payload = route + window.location.search + window.location.hash;
        window.location.replace(base + '?spaRedirect=' + encodeURIComponent(payload));
      })();
```

- [ ] **Step 2: Restore the route before React Router mounts**

In `packages/web/src/main.tsx`, insert this block immediately after the imports and before `createRoot(...)`:

```tsx
const BASENAME = '/Physics-Lab';

/** Restores a deep link that GitHub Pages bounced through public/404.html. */
function consumeSpaRedirect(): void {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('spaRedirect');
  if (redirect === null) return;
  const target = redirect.startsWith('/') ? redirect : `/${redirect}`;
  window.history.replaceState(null, '', `${BASENAME}${target}`);
}

consumeSpaRedirect();
```

and change the `BrowserRouter` line to use the constant:

```tsx
    <BrowserRouter basename={BASENAME}>
```

- [ ] **Step 3: Add the head metadata and a favicon**

Create `packages/web/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0f1419" />
  <path d="M4 6 Q16 6 28 26" stroke="#4da3ff" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <circle cx="24" cy="21" r="3.5" fill="#f0b429" />
</svg>
```

Replace the `<head>` of `packages/web/index.html` with:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f1419" />
    <meta
      name="description"
      content="Interactive physics playground: free fall, vertical throw, projectile motion, air resistance, impact analysis, and VSOP87 solar-system positions — with live equations, graphs, and simulations."
    />
    <link rel="icon" type="image/svg+xml" href="/Physics-Lab/favicon.svg" />
    <title>Physics Lab</title>
  </head>
```

- [ ] **Step 4: Add the title hook**

Create `packages/web/src/hooks/useDocumentTitle.ts`:

```ts
import { useEffect } from 'react';

const SUFFIX = 'Physics Lab';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === SUFFIX ? SUFFIX : `${title} · ${SUFFIX}`;
    return () => {
      document.title = SUFFIX;
    };
  }, [title]);
}
```

Call it once per page component. Add the import and a single call as the first statement of the component body in each of these files, with these exact titles:

| File | Call |
|------|------|
| `src/pages/HomePage.tsx` | `useDocumentTitle('Physics Lab');` |
| `src/pages/MotionHubPage.tsx` | `useDocumentTitle('Motion');` |
| `src/pages/ProjectilePage.tsx` | `useDocumentTitle('Projectile Motion');` |
| `src/pages/ComparePage.tsx` | `useDocumentTitle('Comparison Mode');` |
| `src/pages/SolarSystemHubPage.tsx` | `useDocumentTitle('Solar System');` |
| `src/pages/PlanetCalendarPage.tsx` | `useDocumentTitle('Planet Calendar');` |
| `src/pages/MoonPhasesPage.tsx` | `useDocumentTitle('Moon Phases');` |
| `src/components/VerticalScenarioPage.tsx` | `useDocumentTitle(title);` |

- [ ] **Step 5: Add the error boundary**

Create `packages/web/src/components/layout/ErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error in Physics Lab', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.message === null) return this.props.children;
    return (
      <div className="card" style={{ margin: '2rem 1.5rem' }}>
        <h1>Something went wrong</h1>
        <p className="error">{this.state.message}</p>
        <p className="muted">
          The inputs in the address bar may describe an impossible scenario. Try removing the query
          string, or reload the page.
        </p>
        <button type="button" onClick={() => this.setState({ message: null })}>
          Try again
        </button>
      </div>
    );
  }
}
```

- [ ] **Step 6: Add the 404 page and wire both into the shell and routes**

Create `packages/web/src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Page not found</h1>
      <p className="muted">That route does not exist. Try one of these:</p>
      <ul>
        <li><Link to="/motion">Motion scenarios</Link></li>
        <li><Link to="/compare">Comparison mode</Link></li>
        <li><Link to="/solar-system">Solar system</Link></li>
      </ul>
    </div>
  );
}
```

In `packages/web/src/components/layout/AppShell.tsx`, wrap the outlet:

```tsx
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { NavBar } from './NavBar';

export function AppShell() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
```

In `packages/web/src/routes.tsx`, add the import

```tsx
import { NotFoundPage } from './pages/NotFoundPage';
```

and add this as the last entry of the `children` array:

```tsx
      { path: '*', element: <NotFoundPage /> },
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run preview` and open `http://localhost:4173/Physics-Lab/nope`. Confirm the "Page not found" page renders (in preview, Vite serves `index.html` for unknown paths, so the router handles it). Then confirm `packages/web/dist/404.html` exists and contains `spaRedirect`.

- [ ] **Step 8: Commit**

```bash
git add packages/web/public/404.html packages/web/public/favicon.svg packages/web/index.html packages/web/src/main.tsx packages/web/src/routes.tsx packages/web/src/components/layout/AppShell.tsx packages/web/src/components/layout/ErrorBoundary.tsx packages/web/src/pages/NotFoundPage.tsx packages/web/src/hooks/useDocumentTitle.ts packages/web/src/pages/HomePage.tsx packages/web/src/pages/MotionHubPage.tsx packages/web/src/pages/ProjectilePage.tsx packages/web/src/pages/ComparePage.tsx packages/web/src/pages/SolarSystemHubPage.tsx packages/web/src/pages/PlanetCalendarPage.tsx packages/web/src/pages/MoonPhasesPage.tsx packages/web/src/components/VerticalScenarioPage.tsx
git commit -m "fix: restore GitHub Pages deep links, add a 404 route, error boundary, favicon and titles"
```

---

### Task 11: Stop rebuilding charts on every render and theme them for dark mode (F-10, F-11)

`UPlotChart`'s `useEffect` depends on `xData` and `series`, which are freshly-allocated arrays on every render, so the chart is destroyed and rebuilt on every keystroke. uPlot's own stylesheet is also light-themed, so axis ticks, axis labels, and the legend render near-black on the dark background.

**Files:**
- Modify: `packages/web/src/components/graphs/UPlotChart.tsx`
- Modify: `packages/web/src/styles/global.css`

**Interfaces:**
- `UPlotChartProps` is unchanged, so no call site needs editing. Internally the chart is created once per structural change (title, axis labels, series count, series labels, series colours, height) and data is pushed with `setData`.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `packages/web/src/components/graphs/UPlotChart.tsx` with:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
}

interface UPlotChartProps {
  title: string;
  xLabel: string;
  yLabel: string;
  xData: number[];
  series: ChartSeries[];
  height?: number;
}

const AXIS_COLOR = '#8b9cb3';
const GRID_COLOR = 'rgba(139, 156, 179, 0.18)';

export function UPlotChart({ title, xLabel, yLabel, xData, series, height = 220 }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  // The chart is only rebuilt when its *shape* changes, not when its data changes.
  const shapeKey = useMemo(
    () =>
      JSON.stringify({
        title,
        xLabel,
        yLabel,
        height,
        series: series.map((s) => [s.label, s.color]),
      }),
    [title, xLabel, yLabel, height, series],
  );

  const dataRef = useRef<uPlot.AlignedData>([xData, ...series.map((s) => s.data)] as uPlot.AlignedData);
  dataRef.current = [xData, ...series.map((s) => s.data)] as uPlot.AlignedData;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: uPlot.Options = {
      width: container.clientWidth || 400,
      height,
      title,
      cursor: { drag: { x: true, y: false } },
      series: [
        { label: xLabel },
        ...series.map((s) => ({ label: s.label, stroke: s.color, width: 2 })),
      ],
      axes: [
        { label: xLabel, stroke: AXIS_COLOR, grid: { stroke: GRID_COLOR, width: 1 }, ticks: { stroke: GRID_COLOR } },
        { label: yLabel, stroke: AXIS_COLOR, grid: { stroke: GRID_COLOR, width: 1 }, ticks: { stroke: GRID_COLOR } },
      ],
      scales: { x: { time: false } },
    };

    plotRef.current = new uPlot(options, dataRef.current, container);

    const observer = new ResizeObserver(() => {
      if (plotRef.current && container.clientWidth > 0) {
        plotRef.current.setSize({ width: container.clientWidth, height });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  useEffect(() => {
    plotRef.current?.setData(dataRef.current);
  }, [xData, series]);

  if (xData.length === 0) {
    return <p className="muted">No data to plot.</p>;
  }

  return <div ref={containerRef} />;
}
```

Two notes for the implementer. First, `dataRef.current` is intentionally assigned during render so that the creation effect sees the current data without listing it as a dependency. Second, the `shapeKey` effect deliberately omits `series` and `xData` from its dependency array; that is the whole point of the change, and the `eslint-disable-next-line` comment documents it (there is no ESLint in this repo yet, but the comment states the intent for the next reader).

- [ ] **Step 2: Add the dark-theme overrides**

Append to `packages/web/src/styles/global.css`:

```css
/* uPlot ships a light theme; re-skin it for the dark surface. */
.uplot,
.uplot * {
  font-family: var(--font);
}

.uplot .u-title {
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
}

.uplot .u-legend {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.uplot .u-legend .u-marker {
  border-width: 2px;
}

.uplot .u-axis,
.uplot .u-label {
  color: var(--text-muted);
}

.uplot .u-over,
.uplot .u-under {
  border-color: var(--border);
}

.uplot .u-cursor-x,
.uplot .u-cursor-y {
  border-color: var(--text-muted);
}

.uplot .u-select {
  background: rgba(77, 163, 255, 0.15);
}
```

- [ ] **Step 3: Verify the render count dropped**

Run: `npm run dev`, open `http://localhost:5173/Physics-Lab/motion/free-fall`, open DevTools, and drag the playback slider or type in "Initial height h₀". Confirm the chart updates smoothly without the visible flash-and-relayout it had before, and that the axis numbers and legend text are readable grey rather than black.

Run: `npm test && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/graphs/UPlotChart.tsx packages/web/src/styles/global.css
git commit -m "perf: update chart data in place and restyle uPlot for the dark theme"
```

---

### Task 12: Fix canvas scaling, the spread-operator crash, and playback timing (F-09, F-23, F-25, F-37)

Three problems in the canvas layer:

1. `SimulationCanvas` uses `Math.min(...xs)` and `Math.max(...ys)`, which throws `RangeError` once the drag sample array is large (the integrator's cap is 100 000).
2. All four canvases have a fixed backing store stretched by CSS, so they are blurry on HiDPI and mis-proportioned on wide layouts.
3. Playback uses `setInterval(50)` advancing one sample per tick, so the animation runs at real speed only by coincidence for the default 0.05 s step. There is no speed control and `prefers-reduced-motion` is ignored.

**Files:**
- Create: `packages/web/src/lib/canvas.ts`
- Modify: `packages/web/src/components/simulation/SimulationCanvas.tsx`
- Modify: `packages/web/src/components/simulation/PlaybackControls.tsx`
- Modify: `packages/web/src/components/compare/CompareSimulation.tsx`
- Modify: `packages/web/src/components/solar-system/SolarSystemCanvas.tsx`
- Test: `packages/web/tests/canvas.test.ts`

**Interfaces:**
- Produces, in `packages/web/src/lib/canvas.ts`:

```ts
export interface CanvasFrame { ctx: CanvasRenderingContext2D; width: number; height: number; }
export function prepareCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number): CanvasFrame | null;
export function extent(values: readonly number[]): { min: number; max: number };
export function useCanvasSize(ref: RefObject<HTMLElement | null>, aspectRatio: number): { width: number; height: number };
export function usePrefersReducedMotion(): boolean;
```

- `PlaybackControls` gains `speed`, `onSpeedChange`, and `unitLabel`:

```ts
interface PlaybackControlsProps {
  playing: boolean;
  time: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onScrub: (t: number) => void;
  speed?: number;                       // default 1
  onSpeedChange?: (speed: number) => void;
  unitLabel?: string;                   // default 's'
  step?: number;                        // default 0.01
}
```

- [ ] **Step 1: Write the failing test for the pure helpers**

Create `packages/web/tests/canvas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extent } from '../src/lib/canvas';

describe('extent', () => {
  it('returns the min and max', () => {
    expect(extent([3, -1, 7, 0])).toEqual({ min: -1, max: 7 });
  });

  it('handles an empty array', () => {
    expect(extent([])).toEqual({ min: 0, max: 0 });
  });

  it('does not overflow the call stack on very large arrays', () => {
    const big = new Array(500_000);
    for (let i = 0; i < big.length; i++) big[i] = i % 1000;
    expect(() => extent(big)).not.toThrow();
    expect(extent(big)).toEqual({ min: 0, max: 999 });
  });

  it('ignores non-finite values', () => {
    expect(extent([1, Number.NaN, 5, Number.POSITIVE_INFINITY])).toEqual({ min: 1, max: 5 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w web -- canvas`
Expected: FAIL with `Failed to resolve import "../src/lib/canvas"`.

- [ ] **Step 3: Write the canvas helpers**

Create `packages/web/src/lib/canvas.ts`:

```ts
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Sizes the canvas backing store for the current devicePixelRatio and returns a
 * context whose coordinate system is in CSS pixels.
 */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
): CanvasFrame | null {
  const ctx = canvas.getContext('2d');
  if (!ctx || cssWidth <= 0 || cssHeight <= 0) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return { ctx, width: cssWidth, height: cssHeight };
}

/** Loop-based min/max. Never spread a sample array into Math.min/Math.max. */
export function extent(values: readonly number[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    const value = values[i]!;
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Number.POSITIVE_INFINITY) return { min: 0, max: 0 };
  return { min, max };
}

/** Measures the parent element and returns CSS pixel dimensions for a canvas. */
export function useCanvasSize(
  ref: RefObject<HTMLElement | null>,
  aspectRatio: number,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 500, height: Math.round(500 / aspectRatio) });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      if (width > 0) setSize({ width, height: Math.round(width / aspectRatio) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, aspectRatio]);

  return size;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w web -- canvas`
Expected: PASS, 4 tests.

- [ ] **Step 5: Extend `PlaybackControls`**

Replace the entire contents of `packages/web/src/components/simulation/PlaybackControls.tsx` with:

```tsx
const SPEEDS = [0.25, 0.5, 1, 2, 4];

interface PlaybackControlsProps {
  playing: boolean;
  time: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onScrub: (t: number) => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  unitLabel?: string;
  step?: number;
}

export function PlaybackControls({
  playing,
  time,
  duration,
  onPlay,
  onPause,
  onRestart,
  onScrub,
  speed = 1,
  onSpeedChange,
  unitLabel = 's',
  step = 0.01,
}: PlaybackControlsProps) {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" onClick={playing ? onPause : onPlay} aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onRestart}>
          Restart
        </button>
        {onSpeedChange && (
          <label style={{ fontSize: '0.8rem' }} className="muted">
            Speed{' '}
            <select
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              style={{ marginLeft: '0.25rem', padding: '0.2rem' }}
            >
              {SPEEDS.map((option) => (
                <option key={option} value={option}>
                  {option}×
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="muted" style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
          {time.toFixed(step >= 1 ? 0 : 2)} / {duration.toFixed(step >= 1 ? 0 : 2)} {unitLabel}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={step}
        value={time}
        aria-label={`Playback position in ${unitLabel}`}
        onChange={(e) => onScrub(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 400 }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Rewrite `SimulationCanvas`**

Replace the entire contents of `packages/web/src/components/simulation/SimulationCanvas.tsx` with:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionSample } from 'physics-engine';
import { formatNumber } from 'physics-engine';
import { extent, prepareCanvas, useCanvasSize, usePrefersReducedMotion } from '../../lib/canvas';
import { PlaybackControls } from './PlaybackControls';

interface SimulationCanvasProps {
  samples: MotionSample[];
  isProjectile?: boolean;
  highlightTime?: number;
  onTimeChange?: (t: number) => void;
  flightTime?: number;
}

const ASPECT_RATIO = 500 / 280;

/** Index of the last sample at or before `time`. Binary search: samples are sorted by t. */
function indexAtTime(samples: MotionSample[], time: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (samples[mid]!.t <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function SimulationCanvas({
  samples,
  isProjectile = false,
  highlightTime,
  onTimeChange,
  flightTime,
}: SimulationCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(wrapperRef, ASPECT_RATIO);
  const reducedMotion = usePrefersReducedMotion();

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const duration = samples.length > 0 ? samples[samples.length - 1]!.t : 0;
  const activeTime = highlightTime ?? time;
  const sample = samples.length > 0 ? samples[indexAtTime(samples, activeTime)] : undefined;

  const bounds = useMemo(() => {
    const ys = extent(samples.map((s) => s.y));
    const xs = isProjectile ? extent(samples.map((s) => s.x)) : { min: 0, max: 1 };
    return {
      minX: xs.min,
      maxX: Math.max(xs.max, xs.min + 1),
      minY: 0,
      maxY: Math.max(ys.max, 1),
    };
  }, [samples, isProjectile]);

  // Real-time playback: advance by wall-clock elapsed time × speed.
  useEffect(() => {
    if (!playing || duration <= 0 || reducedMotion) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setTime((current) => {
        const next = current + dt;
        if (next >= duration) {
          setPlaying(false);
          onTimeChange?.(duration);
          return duration;
        }
        onTimeChange?.(next);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, speed, reducedMotion, onTimeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;

    const pad = 30;
    const spanX = bounds.maxX - bounds.minX || 1;
    const spanY = bounds.maxY - bounds.minY || 1;
    const toX = (x: number) => pad + ((x - bounds.minX) / spanX) * (w - 2 * pad);
    const toY = (y: number) => h - pad - ((y - bounds.minY) / spanY) * (h - 2 * pad);

    const styles = getComputedStyle(document.documentElement);
    const borderColor = styles.getPropertyValue('--border').trim() || '#2d3a4f';
    const accentColor = styles.getPropertyValue('--accent').trim() || '#4da3ff';
    const givenColor = styles.getPropertyValue('--given').trim() || '#f0b429';
    const solveColor = styles.getPropertyValue('--solve').trim() || '#3dd68c';
    const mutedColor = styles.getPropertyValue('--text-muted').trim() || '#8b9cb3';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    // Height scale so the drawing is readable without a chart.
    ctx.fillStyle = mutedColor;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const fraction of [0, 0.5, 1]) {
      const value = bounds.minY + fraction * spanY;
      const y = toY(value);
      ctx.fillText(`${formatNumber(value, 1)} m`, 4, y - 2);
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const px = isProjectile ? toX(s.x) : w / 2;
      const py = toY(s.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (sample) {
      const px = isProjectile ? toX(sample.x) : w / 2;
      const py = toY(sample.y);
      ctx.fillStyle = givenColor;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      if (isProjectile) {
        const scale = 0.3;
        ctx.strokeStyle = solveColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + sample.vx * scale, py - sample.vy * scale);
        ctx.stroke();
      }
    }
  }, [samples, sample, isProjectile, width, height, bounds]);

  if (samples.length === 0) {
    return <p className="muted">Run a valid scenario to see the simulation.</p>;
  }

  return (
    <div ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={
          isProjectile
            ? `Projectile path, range ${formatNumber(bounds.maxX, 1)} metres, apex ${formatNumber(bounds.maxY, 1)} metres`
            : `Vertical motion path, apex ${formatNumber(bounds.maxY, 1)} metres`
        }
        style={{ display: 'block', margin: '0 auto' }}
      />
      {sample && (
        <div className="muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
          t = {formatNumber(sample.t)} s · y = {formatNumber(sample.y)} m
          {isProjectile && ` · x = ${formatNumber(sample.x)} m`}
          {' · '}Ek = {formatNumber(sample.kineticEnergy)} J · Ep = {formatNumber(sample.potentialEnergy)} J
          {flightTime !== undefined && sample.t >= flightTime - 0.01 && (
            <span style={{ color: 'var(--danger)' }}> · Impact</span>
          )}
        </div>
      )}
      {reducedMotion && (
        <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Animation is disabled because your system requests reduced motion. Use the slider to scrub.
        </p>
      )}
      <PlaybackControls
        playing={playing}
        time={activeTime}
        duration={duration}
        speed={speed}
        onSpeedChange={setSpeed}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onRestart={() => {
          setTime(0);
          setPlaying(false);
          onTimeChange?.(0);
        }}
        onScrub={(next) => {
          setTime(next);
          setPlaying(false);
          onTimeChange?.(next);
        }}
      />
    </div>
  );
}
```

Note the state change: playback is now driven by a continuous `time` in seconds rather than a sample index, which is what makes real-time playback and the speed multiplier work.

- [ ] **Step 7: Apply the same canvas treatment to the other two canvases**

In `packages/web/src/components/compare/CompareSimulation.tsx`, replace the `useEffect` head and the JSX so it measures its wrapper and uses `prepareCanvas`. Replace the whole file with:

```tsx
import { useEffect, useRef } from 'react';
import type { ComparisonSeries } from 'physics-engine';
import { prepareCanvas, useCanvasSize } from '../../lib/canvas';

interface CompareSimulationProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

const ASPECT_RATIO = 500 / 280;

export function CompareSimulation({ series, isProjectile }: CompareSimulationProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(wrapperRef, ASPECT_RATIO);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || series.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;

    const pad = 30;
    let maxX = 1;
    let maxY = 1;
    for (const s of series) {
      for (const p of s.samples) {
        if (p.y > maxY) maxY = p.y;
        const x = isProjectile ? p.x : p.t;
        if (x > maxX) maxX = x;
      }
    }

    const toX = (x: number) => pad + (x / maxX) * (w - 2 * pad);
    const toY = (y: number) => h - pad - (y / maxY) * (h - 2 * pad);

    // In vertical mode every variant would overlap at the centre, so fan them out.
    const laneWidth = (w - 2 * pad) / Math.max(series.length, 1);
    const laneX = (index: number) => pad + laneWidth * (index + 0.5);

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2d3a4f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, toY(0));
    ctx.lineTo(w - pad, toY(0));
    ctx.stroke();

    series.forEach((s, index) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < s.samples.length; i++) {
        const p = s.samples[i]!;
        const px = isProjectile ? toX(p.x) : laneX(index);
        const py = toY(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const last = s.samples[s.samples.length - 1];
      if (last) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(isProjectile ? toX(last.x) : laneX(index), toY(last.y), 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [series, isProjectile, width, height]);

  if (series.length === 0) return <p className="muted">No simulation data.</p>;

  return (
    <div ref={wrapperRef}>
      <canvas ref={canvasRef} role="img" aria-label="Comparison of variant trajectories" style={{ display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {series.map((s) => (
          <span key={s.label} style={{ color: s.color, fontSize: '0.85rem' }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
```

In `packages/web/src/components/solar-system/SolarSystemCanvas.tsx`, make three edits:

1. Add the imports: `import { prepareCanvas, useCanvasSize } from '../../lib/canvas';`
2. Add a wrapper ref and measured size, and replace `const w = canvas.width; const h = canvas.height; ctx.clearRect(0, 0, w, h);` with the `prepareCanvas` form:

```tsx
export function SolarSystemCanvas({ positions, title, scaleMode }: SolarSystemCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useCanvasSize(wrapperRef, 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;
    const frame = prepareCanvas(canvas, width, height);
    if (!frame) return;
    const { ctx, width: w, height: h } = frame;
```

3. Add `width, height` to the effect dependency array, and replace the returned JSX with:

```tsx
  return (
    <div ref={wrapperRef} style={{ maxWidth: 560, margin: '0 auto' }}>
      <canvas ref={canvasRef} role="img" style={{ display: 'block' }} aria-label={`Solar system positions on ${title}`} />
    </div>
  );
```

- [ ] **Step 8: Use integer-frame labelling on Planet Calendar's playback bar**

In `packages/web/src/pages/PlanetCalendarPage.tsx`, add `step={1}` and `unitLabel="frames"` to the `<PlaybackControls>` call so the control stops claiming seconds:

```tsx
                <PlaybackControls
                  playing={playing}
                  time={animIndex}
                  duration={Math.max(animationMeta.frames - 1, 0)}
                  step={1}
                  unitLabel="frames"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onRestart={() => {
                    setAnimIndex(0);
                    setPlaying(false);
                  }}
                  onScrub={(index) => {
                    setAnimIndex(Math.round(index));
                    setPlaying(false);
                  }}
                />
```

- [ ] **Step 9: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and check all of the following:
- `/motion/free-fall?h0=1000&drag=1&area=0.0001&cd=1.28` renders without a console `RangeError` (this is the large-sample case).
- The simulation canvas is sharp on a HiDPI display and fills the centre column at any window width.
- Play runs at roughly real time; switching Speed to 4× visibly quadruples it.
- `/solar-system/planet-calendar` in animate mode shows "0 / N frames" rather than seconds.

- [ ] **Step 10: Commit**

```bash
git add packages/web/src/lib/canvas.ts packages/web/tests/canvas.test.ts packages/web/src/components/simulation/SimulationCanvas.tsx packages/web/src/components/simulation/PlaybackControls.tsx packages/web/src/components/compare/CompareSimulation.tsx packages/web/src/components/solar-system/SolarSystemCanvas.tsx packages/web/src/pages/PlanetCalendarPage.tsx
git commit -m "fix: HiDPI canvases, loop-based extents, and real-time playback with a speed control"
```

---

### Task 13: Keep the graph tab selection valid (F-12)

`GraphTabs` seeds `tab` from `dragEnabled` on first render only. Turning air resistance off while the "Vacuum vs drag" tab is selected leaves `tab === 'compare'` while `dragEnabled` is false, and every render branch is guarded, so the panel renders nothing at all. The same happens across a scenario switch that changes `isProjectile`.

**Files:**
- Modify: `packages/web/src/components/graphs/GraphTabs.tsx`

**Interfaces:**
- `GraphTabsProps` is unchanged.

- [ ] **Step 1: Derive the tab list first, then guard the selection**

In `packages/web/src/components/graphs/GraphTabs.tsx`, replace lines 16-37 (from `export function GraphTabs(` down to the closing `];` of the `tabs` array) with:

```tsx
export function GraphTabs({ samples, vacuumSamples, isProjectile = false, g, mass, dragEnabled }: GraphTabsProps) {
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

  // If the available tabs changed under us, fall back to the first one.
  const tab = tabs.some((t) => t.id === requestedTab) ? requestedTab : tabs[0]!.id;

  const t = samples.map((s) => s.t);
  const vac = vacuumSamples ?? samples;
```

Change the import on line 1 to:

```tsx
import { useMemo, useState } from 'react';
```

and change the tab button's `onClick` to use the new setter:

```tsx
          <button key={tb.id} type="button" className={tab === tb.id ? 'active' : ''} onClick={() => setRequestedTab(tb.id)}>
```

This derives the effective tab during render rather than syncing state in an effect, so there is never a frame with an invalid selection.

- [ ] **Step 2: Also fix the duplicated ternary in the compare chart title**

Line 63 reads `title={isProjectile ? 'Height: vacuum vs drag' : 'Height: vacuum vs drag'}` — both branches are identical. Replace it with:

```tsx
            title="Height: vacuum vs drag"
```

- [ ] **Step 3: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open `/motion/free-fall`, enable air resistance, select "Vacuum vs drag", then disable air resistance. Confirm the panel switches to "Position" instead of going blank.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/graphs/GraphTabs.tsx
git commit -m "fix: fall back to a valid graph tab when the available tabs change"
```

---

### Task 14: Make Compare mode shareable and correct (F-13, F-14, F-15, F-16, F-37)

Five defects in one page:

- The whole configuration lives in React state; the URL is only read at mount and never written, so Compare links do not work.
- `addVariant` hard-codes `id: 'c'`, so removing variant `a` from a set of three and adding a new one produces two variants with the same key.
- The trajectory chart uses variant A's `x` array as the shared x-axis for every variant.
- A `custom` body can be selected with no field to enter `g`.
- `buildVariants` overwrites `c.label` for all three compare types, making the label written by the drag checkbox handler dead code.

There is also no per-variant results summary, which is the single most useful thing a comparison view can show.

**Files:**
- Create: `packages/web/src/hooks/useCompareParams.ts`
- Create: `packages/web/src/components/compare/CompareSummaryTable.tsx`
- Modify: `packages/web/src/lib/compareDefaults.ts`
- Modify: `packages/web/src/pages/ComparePage.tsx`
- Modify: `packages/web/src/components/compare/CompareConfigurator.tsx`
- Modify: `packages/web/src/components/compare/CompareGraphs.tsx`
- Test: `packages/web/tests/useCompareParams.test.tsx`

**Interfaces:**
- Produces:

```ts
// packages/web/src/lib/compareDefaults.ts
export function encodeVariant(v: VariantConfig): string;   // "earth:9.80665:10:0:45:0"
export function decodeVariant(id: string, raw: string, color: string): VariantConfig | null;
export function nextVariantId(existing: VariantConfig[]): string;  // 'a' | 'b' | 'c'

// packages/web/src/hooks/useCompareParams.ts
export interface CompareParams {
  scenario: CompareScenario;
  compareType: CompareType;
  variants: VariantConfig[];
}
export function useCompareParams(): [CompareParams, (patch: Partial<CompareParams>) => void];
```

URL shape: `?scenario=projectile&type=angle&v=earth:9.80665:0:20:30:0&v=earth:9.80665:0:20:60:0`. Fields per variant, colon-separated in order: `planet`, `customG`, `h0`, `v0`, `angle`, `dragEnabled` (0/1).

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/useCompareParams.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useCompareParams } from '../src/hooks/useCompareParams';
import { decodeVariant, encodeVariant, nextVariantId, DEFAULT_VARIANTS } from '../src/lib/compareDefaults';

function Probe() {
  const [params, setParams] = useCompareParams();
  return (
    <div>
      <span data-testid="scenario">{params.scenario}</span>
      <span data-testid="type">{params.compareType}</span>
      <span data-testid="count">{params.variants.length}</span>
      <span data-testid="planets">{params.variants.map((v) => v.planet).join(',')}</span>
      <span data-testid="angles">{params.variants.map((v) => v.angle).join(',')}</span>
      <button type="button" onClick={() => setParams({ scenario: 'projectile', compareType: 'angle' })}>
        set
      </button>
    </div>
  );
}

describe('compare variant codec', () => {
  it('round-trips a variant', () => {
    const original = DEFAULT_VARIANTS[0]!;
    const decoded = decodeVariant('a', encodeVariant(original), original.color);
    expect(decoded).not.toBeNull();
    expect(decoded!.planet).toBe(original.planet);
    expect(decoded!.h0).toBe(original.h0);
    expect(decoded!.dragEnabled).toBe(original.dragEnabled);
  });

  it('rejects malformed input', () => {
    expect(decodeVariant('a', 'nonsense', '#fff')).toBeNull();
    expect(decodeVariant('a', 'pluto:9.8:1:1:1:0', '#fff')).toBeNull();
  });

  it('never reuses an existing id', () => {
    expect(nextVariantId([{ ...DEFAULT_VARIANTS[1]!, id: 'b' }])).toBe('a');
    expect(nextVariantId(DEFAULT_VARIANTS)).toBe('c');
  });
});

describe('useCompareParams', () => {
  it('defaults to two variants', () => {
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('scenario').textContent).toBe('vertical1d');
  });

  it('reads variants from the URL', () => {
    render(
      <MemoryRouter
        initialEntries={['/compare?scenario=projectile&type=angle&v=earth:9.80665:0:20:30:0&v=earth:9.80665:0:20:60:0']}
      >
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('angles').textContent).toBe('30,60');
    expect(screen.getByTestId('type').textContent).toBe('angle');
  });

  it('writes changes back to the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Probe />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('scenario').textContent).toBe('projectile');
    expect(screen.getByTestId('type').textContent).toBe('angle');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w web -- useCompareParams`
Expected: FAIL with `Failed to resolve import "../src/hooks/useCompareParams"`.

- [ ] **Step 3: Add the codec to `compareDefaults.ts`**

Append to `packages/web/src/lib/compareDefaults.ts`:

```ts
const VARIANT_IDS = ['a', 'b', 'c'] as const;
const VALID_BODY_IDS = new Set<string>([...CELESTIAL_BODIES.map((b) => b.id), 'custom']);

export function encodeVariant(v: VariantConfig): string {
  return [v.planet, v.customG, v.h0, v.v0, v.angle, v.dragEnabled ? 1 : 0].join(':');
}

export function decodeVariant(id: string, raw: string, color: string): VariantConfig | null {
  const parts = raw.split(':');
  if (parts.length !== 6) return null;
  const [planet, customG, h0, v0, angle, drag] = parts as [string, string, string, string, string, string];
  if (!VALID_BODY_IDS.has(planet)) return null;
  const numbers = [customG, h0, v0, angle].map(Number);
  if (numbers.some((n) => !Number.isFinite(n))) return null;
  return {
    id,
    label: `Variant ${id.toUpperCase()}`,
    color,
    planet: planet as CelestialBodyId,
    customG: numbers[0]!,
    h0: numbers[1]!,
    v0: numbers[2]!,
    angle: numbers[3]!,
    dragEnabled: drag === '1',
  };
}

export function nextVariantId(existing: VariantConfig[]): string {
  const used = new Set(existing.map((v) => v.id));
  return VARIANT_IDS.find((candidate) => !used.has(candidate)) ?? 'c';
}

export function variantColor(index: number): string {
  return COMPARE_COLORS[index % COMPARE_COLORS.length]!;
}
```

- [ ] **Step 4: Write the hook**

Create `packages/web/src/hooks/useCompareParams.ts`:

```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_VARIANTS,
  decodeVariant,
  encodeVariant,
  variantColor,
  type CompareScenario,
  type CompareType,
  type VariantConfig,
} from '../lib/compareDefaults';

export interface CompareParams {
  scenario: CompareScenario;
  compareType: CompareType;
  variants: VariantConfig[];
}

const VARIANT_IDS = ['a', 'b', 'c'];

export function useCompareParams(): [CompareParams, (patch: Partial<CompareParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo((): CompareParams => {
    const scenarioParam = searchParams.get('scenario');
    const scenario: CompareScenario = scenarioParam === 'projectile' ? 'projectile' : 'vertical1d';

    const typeParam = searchParams.get('type');
    const compareType: CompareType =
      typeParam === 'drag' || (typeParam === 'angle' && scenario === 'projectile')
        ? typeParam
        : 'environment';

    const raw = searchParams.getAll('v');
    const decoded = raw
      .slice(0, 3)
      .map((entry, index) => decodeVariant(VARIANT_IDS[index]!, entry, variantColor(index)))
      .filter((v): v is VariantConfig => v !== null);

    return {
      scenario,
      compareType,
      variants: decoded.length >= 2 ? decoded : DEFAULT_VARIANTS,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (patch: Partial<CompareParams>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.scenario !== undefined) next.set('scenario', patch.scenario);
          if (patch.compareType !== undefined) next.set('type', patch.compareType);
          if (patch.variants !== undefined) {
            next.delete('v');
            for (const variant of patch.variants) next.append('v', encodeVariant(variant));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [params, setParams];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -w web -- useCompareParams`
Expected: PASS, 6 tests.

- [ ] **Step 6: Move `ComparePage` onto the hook**

In `packages/web/src/pages/ComparePage.tsx`:

Replace the three `useState` declarations (lines 67-73) with:

```tsx
  const [{ scenario, compareType, variants }, setCompareParams] = useCompareParams();
```

Add the import:

```tsx
import { useCompareParams } from '../hooks/useCompareParams';
```

Replace the three mutators (lines 108-132) with:

```tsx
  const updateVariant = (id: string, partial: Partial<VariantConfig>) => {
    setCompareParams({
      variants: variants.map((v) => (v.id === id ? { ...v, ...partial } : v)),
    });
  };

  const addVariant = () => {
    if (variants.length >= 3) return;
    const id = nextVariantId(variants);
    setCompareParams({
      variants: [
        ...variants,
        {
          id,
          label: `Variant ${id.toUpperCase()}`,
          color: variantColor(variants.length),
          planet: 'mars',
          customG: 3.71,
          h0: variants[0]?.h0 ?? 10,
          v0: variants[0]?.v0 ?? 0,
          angle: compareType === 'angle' ? 60 : (variants[0]?.angle ?? 45),
          dragEnabled: compareType === 'drag',
        },
      ],
    });
  };

  const removeVariant = (id: string) => {
    setCompareParams({ variants: variants.filter((v) => v.id !== id) });
  };
```

Change the `CompareConfigurator` props from `onScenarioChange={setScenario}` / `onCompareTypeChange={setCompareType}` to:

```tsx
          onScenarioChange={(next) =>
            setCompareParams({
              scenario: next,
              compareType: next === 'vertical1d' && compareType === 'angle' ? 'environment' : compareType,
            })
          }
          onCompareTypeChange={(next) => setCompareParams({ compareType: next })}
```

Update the imports from `../lib/compareDefaults` to include `nextVariantId` and `variantColor`, and drop `DEFAULT_VARIANTS` and `COMPARE_COLORS` if they are no longer referenced.

- [ ] **Step 7: Stop overwriting variant labels, and honour custom `g`**

In `packages/web/src/pages/ComparePage.tsx`, replace the label block in `buildVariants` (lines 48-51) with:

```ts
    const label =
      compareType === 'environment'
        ? planetLabel(c.planet)
        : compareType === 'drag'
          ? `${c.id.toUpperCase()} · ${dragEnabled ? 'with drag' : 'vacuum'}`
          : `${c.angle}°`;
```

and add `planetLabel` to the `../lib/compareDefaults` import list. `planetLabel('custom')` returns `'custom'`, so also extend `planetLabel` in `packages/web/src/lib/compareDefaults.ts`:

```ts
export function planetLabel(id: CelestialBodyId): string {
  if (id === 'custom') return 'Custom g';
  return CELESTIAL_BODIES.find((b) => b.id === id)?.name ?? id;
}
```

In `packages/web/src/components/compare/CompareConfigurator.tsx`, add a custom-`g` field under the body select. Insert immediately after the closing `</label>` of the `compareType === 'environment'` block (after line 80):

```tsx
            {compareType === 'environment' && v.planet === 'custom' && (
              <NumberField
                label="g"
                unit="m/s²"
                value={v.customG}
                min={0.01}
                onChange={(customG) => onVariantChange(v.id, { customG })}
              />
            )}
```

Also remove the duplicate `<option value="custom">Custom</option>` on line 78: `CELESTIAL_BODIES` does not contain `custom`, so the extra option is correct, but the *body* select currently lists every body including the Sun and Moon, which is intended. Leave the option in place and instead confirm by reading that there is exactly one `value="custom"` option in that select.

- [ ] **Step 8: Give each variant its own x-axis in the trajectory chart**

In `packages/web/src/components/compare/CompareGraphs.tsx`, replace the `isProjectile` branch (lines 18-24) with one chart per variant plus a shared height-vs-time chart, because uPlot aligns all series to a single x array and projectile variants do not share one:

```tsx
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
```

and change the two `?? NaN` fills in the remaining charts to `?? null` with the same cast, because uPlot renders `null` as a gap and `NaN` as a broken line:

```tsx
            data: xData.map((_, i) => s.samples[i]?.y ?? null) as unknown as number[],
```

```tsx
          data: xData.map((_, i) => s.samples[i]?.speed ?? null) as unknown as number[],
```

Also replace the `maxLen` computation on line 12, which spreads an array, with a loop (there are at most three series so it cannot overflow, but keep the codebase consistent with Task 12):

```tsx
  let maxLen = 0;
  for (const s of series) maxLen = Math.max(maxLen, s.samples.length);
  const longest = series.find((s) => s.samples.length === maxLen) ?? series[0]!;
  const xData = Array.from({ length: maxLen }, (_, i) => longest.samples[i]?.t ?? i * 0.05);
```

Using the *longest* series for the shared time axis rather than `series[0]` matters: variant A often lands first.

- [ ] **Step 9: Add the per-variant summary table**

Create `packages/web/src/components/compare/CompareSummaryTable.tsx`:

```tsx
import type { ComparisonSeries } from 'physics-engine';
import { formatNumber, summarizeSamples } from 'physics-engine';

interface CompareSummaryTableProps {
  series: ComparisonSeries[];
  isProjectile: boolean;
}

export function CompareSummaryTable({ series, isProjectile }: CompareSummaryTableProps) {
  const rows = series.map((s) => ({
    label: s.label,
    color: s.color,
    summary: summarizeSamples(s.samples),
  }));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr className="muted">
            <th style={{ textAlign: 'left', padding: '0.35rem' }}>Variant</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Flight time (s)</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Impact speed (m/s)</th>
            <th style={{ textAlign: 'right', padding: '0.35rem' }}>Max height (m)</th>
            {isProjectile && <th style={{ textAlign: 'right', padding: '0.35rem' }}>Range (m)</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={{ padding: '0.35rem', color: row.color }}>{row.label}</td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.flightTime, 2) : '—'}
              </td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.impactSpeed, 2) : '—'}
              </td>
              <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                {row.summary ? formatNumber(row.summary.maxHeight, 2) : '—'}
              </td>
              {isProjectile && (
                <td style={{ textAlign: 'right', padding: '0.35rem', fontFamily: 'var(--mono)' }}>
                  {row.summary?.horizontalDistance !== undefined
                    ? formatNumber(row.summary.horizontalDistance, 2)
                    : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Render it in `packages/web/src/pages/ComparePage.tsx` between the Simulation card and the Graphs card:

```tsx
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Summary</h2>
        <CompareSummaryTable series={series} isProjectile={scenario === 'projectile'} />
      </div>
```

with the import `import { CompareSummaryTable } from '../components/compare/CompareSummaryTable';`.

- [ ] **Step 10: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open `/compare`, change the scenario to Projectile and Compare by to Launch angle, set the two angles to 30 and 60, then copy the address bar into a new tab. Confirm the new tab reproduces the same configuration. Then add variant C, remove variant A, add another variant, and confirm no React key warning appears in the console and each card edits independently.

- [ ] **Step 11: Commit**

```bash
git add packages/web/src/hooks/useCompareParams.ts packages/web/src/lib/compareDefaults.ts packages/web/src/pages/ComparePage.tsx packages/web/src/components/compare/CompareConfigurator.tsx packages/web/src/components/compare/CompareGraphs.tsx packages/web/src/components/compare/CompareSummaryTable.tsx packages/web/tests/useCompareParams.test.tsx
git commit -m "fix: put compare state in the URL, give variants unique ids and axes, add a summary table"
```

---

## Phase 3 — Search accuracy, consistency, and polish

### Task 15: Make the alignment search trustworthy (F-07, F-21, F-33)

Three separate problems compound here.

1. **Objective mismatch.** `findBestAlignment` minimises `clusterScore`, which sums *angular* separations in degrees, then reports `scorePositions3D`, which sums *3D distances* in AU. The two functions have different minima, so the returned date is not the minimum of the number shown next to it — and `metricLabel` describes the AU version to the user.
2. **Aliasing.** `minimizeOnInterval` always takes exactly 80 coarse samples. Over the "Find next planet parade" preset's 15-year window that is one sample every 68 days, while Mercury's orbital period is 88 days. Measured over 2026-01-01 to 2041: the search returns 2037-12-14 with score 383.294 AU, while a 10-day brute scan finds 2036-01-09 with 379.076 AU — a different date two years away.
3. **Wrap-around.** `scoreChainByLongitude3D` sorts by longitude and sums consecutive gaps, ignoring that longitude is circular, so a cluster straddling 0° scores as maximally spread.

Plus the search runs on the main thread, which freezes the UI, and will freeze it for longer once the sampling density is fixed.

**Files:**
- Modify: `packages/physics-engine/src/orbital/search.ts`
- Modify: `packages/physics-engine/src/orbital/alignment.ts`
- Create: `packages/web/src/workers/alignment.worker.ts`
- Create: `packages/web/src/hooks/useAlignmentSearch.ts`
- Modify: `packages/web/src/pages/PlanetCalendarPage.tsx`
- Modify: `packages/physics-engine/tests/orbital.test.ts`

**Interfaces:**
- Produces:

```ts
// search.ts
export interface MinimizeOptions {
  /** Coarse grid resolution in days. Default 5. */
  maxSampleDays?: number;
  /** Hard cap on coarse samples, to bound cost on very long windows. Default 4000. */
  maxCoarseSamples?: number;
  /** Local minima to refine with golden-section search. Default 8. */
  maxBasins?: number;
}
export function minimizeOnInterval(
  start: Date,
  endExclusive: Date,
  fn: (date: Date) => number,
  options?: MinimizeOptions,
): MinimizeResult | null;

// alignment.ts
export function clusterScoreAu(date: Date, metric: AlignmentMetric): number;
export function clusterScore(date: Date, metric: AlignmentMetric): number;  // unchanged name, wrap-aware chain
```

`findBestAlignment` now minimises `clusterScoreAu` and reports the same value, so `AlignmentSearchResult.score` is the minimised quantity.

- [ ] **Step 1: Write the failing tests**

Replace the `describe('cluster score', ...)` block at the end of `packages/physics-engine/tests/orbital.test.ts` with:

```ts
describe('cluster score', () => {
  it('returns finite scores for every metric', () => {
    const date = parseDateParts(1, 1, 2024);
    expect(clusterScore(date, 'pairwiseSum')).toBeGreaterThan(0);
    expect(clusterScore(date, 'maxPairwise')).toBeGreaterThan(0);
    expect(clusterScore(date, 'chainByLongitude')).toBeGreaterThan(0);
  });

  it('reports AU-scale magnitudes for the AU objective', () => {
    const date = parseDateParts(1, 1, 2024);
    const score = clusterScoreAu(date, 'pairwiseSum');
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(2000);
  });

  it('the chain metric is unaffected by rotating the whole system past 0 degrees', () => {
    // Two dates roughly half a Neptune-free rotation apart still produce
    // chain scores of the same order; a wrap bug produces an order-of-magnitude jump.
    const a = clusterScoreAu(parseDateParts(1, 1, 2024), 'chainByLongitude');
    const b = clusterScoreAu(parseDateParts(1, 7, 2024), 'chainByLongitude');
    expect(Math.max(a, b) / Math.min(a, b)).toBeLessThan(3);
  });

  it('the chain metric never exceeds the pairwise-sum metric', () => {
    const date = parseDateParts(15, 6, 2030);
    expect(clusterScoreAu(date, 'chainByLongitude')).toBeLessThan(
      clusterScoreAu(date, 'pairwiseSum'),
    );
  });
});

describe('alignment search accuracy', () => {
  it('beats a 10-day brute-force scan over a 15-year window', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 15 * 365);

    const fast = findBestAlignment(start, end, 'pairwiseSum', 'true')!;

    let bruteScore = Number.POSITIVE_INFINITY;
    for (const date of enumerateDates(start, end, 10)) {
      bruteScore = Math.min(bruteScore, clusterScoreAu(date, 'pairwiseSum'));
    }

    expect(fast.score).toBeLessThanOrEqual(bruteScore);
  });

  it('reports the score it actually minimised', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 5 * 365);
    const result = findBestAlignment(start, end, 'pairwiseSum', 'true')!;
    expect(result.score).toBeCloseTo(clusterScoreAu(result.date, 'pairwiseSum'), 6);
  });

  it('stays under 8 seconds for a 15-year window', () => {
    const start = parseDateParts(1, 1, 2026);
    const end = addDays(start, 15 * 365);
    const t0 = performance.now();
    findBestAlignment(start, end, 'pairwiseSum', 'true');
    expect(performance.now() - t0).toBeLessThan(8000);
  });
});
```

Add `clusterScoreAu` to the import from `../src/orbital/alignment` at the top of the file, and delete the now-superseded `it('matches or beats coarse brute force on a short window', ...)` and `it('completes a 10-year search quickly with fixed budget', ...)` tests from the `describe('alignment search', ...)` block — the two new tests above cover both concerns more strictly.

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -w physics-engine -- orbital`
Expected: FAIL. `clusterScoreAu is not a function`, and once that is stubbed, `expected 383.29 to be less than or equal to 379.07`.

- [ ] **Step 3: Make the minimiser adaptive**

Replace the entire contents of `packages/physics-engine/src/orbital/search.ts` with:

```ts
const DEFAULT_MAX_SAMPLE_DAYS = 5;
const DEFAULT_MAX_COARSE_SAMPLES = 4000;
const MIN_COARSE_SAMPLES = 64;
const DEFAULT_MAX_BASINS = 8;
const GOLDEN_ITERATIONS = 40;
const PHI = (1 + Math.sqrt(5)) / 2;
const MS_PER_DAY = 86_400_000;

export interface MinimizeResult {
  date: Date;
  score: number;
}

export interface MinimizeOptions {
  /** Coarse grid resolution in days. Must be fine enough for the fastest body. */
  maxSampleDays?: number;
  /** Hard cap on coarse samples so very long windows stay bounded. */
  maxCoarseSamples?: number;
  /** Number of local minima to refine. */
  maxBasins?: number;
}

function msToDate(ms: number): Date {
  return new Date(ms);
}

function goldenSectionMinimize(
  startMs: number,
  endMs: number,
  fn: (date: Date) => number,
): MinimizeResult {
  let a = startMs;
  let b = endMs;
  let c = b - (b - a) / PHI;
  let d = a + (b - a) / PHI;
  let fc = fn(msToDate(c));
  let fd = fn(msToDate(d));

  for (let i = 0; i < GOLDEN_ITERATIONS; i++) {
    if (fc <= fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - (b - a) / PHI;
      fc = fn(msToDate(c));
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + (b - a) / PHI;
      fd = fn(msToDate(d));
    }
  }

  const candidates: MinimizeResult[] = [
    { date: msToDate(a), score: fn(msToDate(a)) },
    { date: msToDate((a + b) / 2), score: fn(msToDate((a + b) / 2)) },
    { date: msToDate(b), score: fn(msToDate(b)) },
  ];
  return candidates.reduce((best, candidate) => (candidate.score < best.score ? candidate : best));
}

/**
 * Minimises `fn` over a date interval. The coarse grid resolution is derived
 * from the span (default: one sample per 5 days) so that a long window cannot
 * alias past a narrow minimum; the cost therefore grows with the span, which is
 * why callers on the main thread should run this in a worker.
 */
export function minimizeOnInterval(
  start: Date,
  endExclusive: Date,
  fn: (date: Date) => number,
  options: MinimizeOptions = {},
): MinimizeResult | null {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  if (endMs <= startMs) return null;

  const maxSampleDays = options.maxSampleDays ?? DEFAULT_MAX_SAMPLE_DAYS;
  const maxCoarseSamples = options.maxCoarseSamples ?? DEFAULT_MAX_COARSE_SAMPLES;
  const maxBasins = options.maxBasins ?? DEFAULT_MAX_BASINS;

  const span = endMs - startMs;
  const spanDays = span / MS_PER_DAY;
  const coarseSamples = Math.min(
    maxCoarseSamples,
    Math.max(MIN_COARSE_SAMPLES, Math.ceil(spanDays / maxSampleDays) + 1),
  );

  const scores = new Float64Array(coarseSamples);
  const divisor = Math.max(coarseSamples - 1, 1);
  for (let i = 0; i < coarseSamples; i++) {
    scores[i] = fn(msToDate(startMs + (span * i) / divisor));
  }

  const basins: { index: number; score: number }[] = [];
  for (let i = 0; i < coarseSamples; i++) {
    const prev = i > 0 ? scores[i - 1]! : Number.POSITIVE_INFINITY;
    const curr = scores[i]!;
    const next = i < coarseSamples - 1 ? scores[i + 1]! : Number.POSITIVE_INFINITY;
    if (curr <= prev && curr <= next) basins.push({ index: i, score: curr });
  }

  if (basins.length === 0) {
    let bestIndex = 0;
    for (let i = 1; i < coarseSamples; i++) {
      if (scores[i]! < scores[bestIndex]!) bestIndex = i;
    }
    return {
      date: msToDate(startMs + (span * bestIndex) / divisor),
      score: scores[bestIndex]!,
    };
  }

  basins.sort((a, b) => a.score - b.score);
  const step = span / divisor;

  let best: MinimizeResult | null = null;
  for (const basin of basins.slice(0, maxBasins)) {
    const left = Math.max(startMs, startMs + (basin.index - 1) * step);
    const right = Math.min(endMs, startMs + (basin.index + 1) * step);
    const refined = goldenSectionMinimize(left, right, fn);
    // The coarse sample itself is a valid candidate; a degenerate bracket can
    // otherwise return something slightly worse than what we already know.
    const coarse: MinimizeResult = {
      date: msToDate(startMs + basin.index * step),
      score: basin.score,
    };
    const local = refined.score <= coarse.score ? refined : coarse;
    if (!best || local.score < best.score) best = local;
  }

  return best;
}
```

The two behavioural additions beyond adaptivity are: the golden-section step now also evaluates the bracket endpoints (a plain midpoint return can land on a worse point than the bracket edge), and each basin's coarse sample is kept as a fallback candidate. Together these guarantee the result is never worse than the best coarse sample, which is what the new brute-force test asserts.

- [ ] **Step 4: Make the objective consistent and wrap-aware**

In `packages/physics-engine/src/orbital/alignment.ts`, replace everything from the `angularSeparationDeg` helper down to and including `clusterScore` (lines 15-112) with:

```ts
interface EclipticPoint {
  xAu: number;
  yAu: number;
  zAu: number;
  longitudeDeg: number;
}

function angularSeparationDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function planetPoints(date: Date): EclipticPoint[] {
  return ORBITAL_PLANETS.map((p) => {
    const state = heliocentricEcliptic(p.body, date);
    return {
      xAu: state.xAu,
      yAu: state.yAu,
      zAu: state.zAu,
      longitudeDeg: state.longitudeDeg,
    };
  });
}

function separation(a: EclipticPoint, b: EclipticPoint): number {
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

export function pairDistanceAu(bodyA: OrbitalPlanetId, bodyB: OrbitalPlanetId, date: Date): number {
  const a = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyA].body, date);
  const b = heliocentricEcliptic(ORBITAL_BODY_MAP[bodyB].body, date);
  return Math.hypot(a.xAu - b.xAu, a.yAu - b.yAu, a.zAu - b.zAu);
}

function sumOfPairs<T>(items: T[], distance: (a: T, b: T) => number): number {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      sum += distance(items[i]!, items[j]!);
    }
  }
  return sum;
}

function maxOfPairs<T>(items: T[], distance: (a: T, b: T) => number): number {
  let max = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const d = distance(items[i]!, items[j]!);
      if (d > max) max = d;
    }
  }
  return max;
}

/**
 * Chain length along ecliptic-longitude order, treating longitude as circular:
 * sum every consecutive link around the ring, then drop the largest one. That
 * is the shortest open chain and is invariant to where 0 degrees happens to fall.
 */
function chainScore<T extends { longitudeDeg: number }>(
  items: T[],
  distance: (a: T, b: T) => number,
): number {
  if (items.length < 2) return 0;
  const sorted = [...items].sort((a, b) => a.longitudeDeg - b.longitudeDeg);
  let total = 0;
  let largest = 0;
  for (let i = 0; i < sorted.length; i++) {
    const link = distance(sorted[i]!, sorted[(i + 1) % sorted.length]!);
    total += link;
    if (link > largest) largest = link;
  }
  return total - largest;
}

/** The objective, in AU. This is what the search minimises and what is reported. */
export function clusterScoreAu(date: Date, metric: AlignmentMetric): number {
  const points = planetPoints(date);
  switch (metric) {
    case 'pairwiseSum':
      return sumOfPairs(points, separation);
    case 'maxPairwise':
      return maxOfPairs(points, separation);
    case 'chainByLongitude':
      return chainScore(points, separation);
  }
}

/** Angular version of the same metric, in degrees. Useful for display only. */
export function clusterScore(date: Date, metric: AlignmentMetric): number {
  const points = planetPoints(date);
  const angular = (a: EclipticPoint, b: EclipticPoint) =>
    angularSeparationDeg(a.longitudeDeg, b.longitudeDeg);
  switch (metric) {
    case 'pairwiseSum':
      return sumOfPairs(points, angular);
    case 'maxPairwise':
      return maxOfPairs(points, angular);
    case 'chainByLongitude':
      return chainScore(points, angular);
  }
}

function scorePositions3D(positions: PlanetPosition[], metric: AlignmentMetric): number {
  const points: EclipticPoint[] = positions
    .filter((p) => p.id !== 'sun')
    .map((p) => ({ xAu: p.xAu, yAu: p.yAu, zAu: p.zAu, longitudeDeg: p.longitudeDeg }));
  switch (metric) {
    case 'pairwiseSum':
      return sumOfPairs(points, separation);
    case 'maxPairwise':
      return maxOfPairs(points, separation);
    case 'chainByLongitude':
      return chainScore(points, separation);
  }
}
```

Delete the now-unused `planetLongitudes`, `distanceAu`, `planetsOnly`, `scorePairwiseSum3D`, `scoreMaxPairwise3D`, and `scoreChainByLongitude3D` functions, and remove the `EclipticLongitude` import from `astronomy-engine` on line 1 (only `heliocentricEcliptic` is needed now).

Then change `findBestAlignment` to minimise the AU objective:

```ts
export function findBestAlignment(
  start: Date,
  endExclusive: Date,
  metric: AlignmentMetric,
  scaleMode: DisplayScaleMode = 'true',
): AlignmentSearchResult | null {
  const minimized = minimizeOnInterval(start, endExclusive, (date) => clusterScoreAu(date, metric));
  if (!minimized) return null;

  const positions = getSolarSystemSnapshot(minimized.date, scaleMode).positions;

  return {
    date: minimized.date,
    score: scorePositions3D(positions, metric),
    metric,
    positions,
  };
}
```

`scorePositions3D(positions, metric)` and `clusterScoreAu(minimized.date, metric)` are now the same function applied to the same instant, which is exactly what the "reports the score it actually minimised" test checks. Keep the `scorePositions3D` call rather than reusing `minimized.score` so the reported number is provably derived from the positions on screen.

- [ ] **Step 5: Run the engine tests**

Run: `npm test -w physics-engine -- orbital`
Expected: PASS. If the 8-second budget test fails, raise `maxSampleDays` to `7` in `DEFAULT_MAX_SAMPLE_DAYS` and re-run; do not weaken the brute-force comparison test.

- [ ] **Step 6: Move the search off the main thread**

Create `packages/web/src/workers/alignment.worker.ts`:

```ts
import { findBestAlignment, findClosestPair } from 'physics-engine';
import type {
  AlignmentMetric,
  AlignmentSearchResult,
  DisplayScaleMode,
  OrbitalPlanetId,
  PairConjunctionResult,
} from 'physics-engine';

export interface AlignmentRequest {
  requestId: number;
  startMs: number;
  endMs: number;
  metric: AlignmentMetric;
  scaleMode: DisplayScaleMode;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

export interface AlignmentResponse {
  requestId: number;
  alignment: AlignmentSearchResult | null;
  pair: PairConjunctionResult | null;
  error?: string;
}

self.onmessage = (event: MessageEvent<AlignmentRequest>) => {
  const request = event.data;
  const start = new Date(request.startMs);
  const end = new Date(request.endMs);

  try {
    const alignment = findBestAlignment(start, end, request.metric, request.scaleMode);
    const pair =
      request.pairA === request.pairB
        ? null
        : findClosestPair(request.pairA, request.pairB, start, end, request.scaleMode);
    const response: AlignmentResponse = { requestId: request.requestId, alignment, pair };
    self.postMessage(response);
  } catch (error) {
    const response: AlignmentResponse = {
      requestId: request.requestId,
      alignment: null,
      pair: null,
      error: error instanceof Error ? error.message : 'Search failed',
    };
    self.postMessage(response);
  }
};
```

Create `packages/web/src/hooks/useAlignmentSearch.ts`:

```ts
import { useEffect, useRef, useState } from 'react';
import { findBestAlignment, findClosestPair } from 'physics-engine';
import type {
  AlignmentMetric,
  AlignmentSearchResult,
  DisplayScaleMode,
  OrbitalPlanetId,
  PairConjunctionResult,
} from 'physics-engine';
import type { AlignmentRequest, AlignmentResponse } from '../workers/alignment.worker';

export interface AlignmentSearchState {
  searching: boolean;
  alignment: AlignmentSearchResult | null;
  pair: PairConjunctionResult | null;
  error: string | null;
}

interface UseAlignmentSearchOptions {
  enabled: boolean;
  start: Date;
  endExclusive: Date;
  metric: AlignmentMetric;
  scaleMode: DisplayScaleMode;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

const IDLE: AlignmentSearchState = { searching: false, alignment: null, pair: null, error: null };

export function useAlignmentSearch(options: UseAlignmentSearchOptions): AlignmentSearchState {
  const { enabled, start, endExclusive, metric, scaleMode, pairA, pairB } = options;
  const [state, setState] = useState<AlignmentSearchState>(IDLE);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const startMs = start.getTime();
  const endMs = endExclusive.getTime();

  useEffect(() => {
    if (!enabled) {
      setState(IDLE);
      return;
    }

    const requestId = ++requestIdRef.current;
    setState({ searching: true, alignment: null, pair: null, error: null });

    if (typeof Worker === 'undefined') {
      // Non-browser environment (tests, SSR): run synchronously.
      try {
        const alignment = findBestAlignment(new Date(startMs), new Date(endMs), metric, scaleMode);
        const pair =
          pairA === pairB
            ? null
            : findClosestPair(pairA, pairB, new Date(startMs), new Date(endMs), scaleMode);
        setState({ searching: false, alignment, pair, error: null });
      } catch (error) {
        setState({
          searching: false,
          alignment: null,
          pair: null,
          error: error instanceof Error ? error.message : 'Search failed',
        });
      }
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/alignment.worker.ts', import.meta.url), {
        type: 'module',
      });
    }

    const worker = workerRef.current;
    const onMessage = (event: MessageEvent<AlignmentResponse>) => {
      if (event.data.requestId !== requestIdRef.current) return;
      setState({
        searching: false,
        alignment: event.data.alignment,
        pair: event.data.pair,
        error: event.data.error ?? null,
      });
    };
    worker.addEventListener('message', onMessage);

    const request: AlignmentRequest = {
      requestId,
      startMs,
      endMs,
      metric,
      scaleMode,
      pairA,
      pairB,
    };
    worker.postMessage(request);

    return () => {
      worker.removeEventListener('message', onMessage);
    };
  }, [enabled, startMs, endMs, metric, scaleMode, pairA, pairB]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return state;
}
```

- [ ] **Step 7: Use the hook in `PlanetCalendarPage`**

In `packages/web/src/pages/PlanetCalendarPage.tsx`:

Delete the `searching`, `alignmentResult`, and `pairResult` `useState` declarations (lines 108-110) and the whole search `useEffect` (lines 162-189).

Add:

```tsx
  const {
    searching,
    alignment: alignmentResult,
    pair: pairResult,
    error: searchError,
  } = useAlignmentSearch({
    enabled: params.mode === 'alignment' && error === null,
    start: rangeStart,
    endExclusive: rangeEnd,
    metric: params.alignmentMetric,
    scaleMode: params.scaleMode,
    pairA: params.pairA,
    pairB: params.pairB,
  });
```

with the import `import { useAlignmentSearch } from '../hooks/useAlignmentSearch';`.

Remove `findBestAlignment` and `findClosestPair` from the `physics-engine` import list, since the page no longer calls them directly.

In `resultsFooter`, append the search error when there is one — replace the `if (pairResult) { ... }` block with:

```tsx
    if (pairResult) {
      parts.push(
        `Closest ${pairResult.bodyA}–${pairResult.bodyB}: ${pairResult.distanceAu.toFixed(3)} AU on ${formatIsoDate(pairResult.date)}`,
      );
    }
    if (searchError) parts.push(`Search error: ${searchError}`);
```

(`formatIsoDate` arrives in Task 18; until then keep `formatDateString`.) Add `searchError` to the `useMemo` dependency array.

- [ ] **Step 8: Verify**

Run: `npm test && npm run build`
Expected: both exit 0. The build must emit an extra worker chunk — confirm by looking for a file matching `packages/web/dist/assets/alignment.worker-*.js`.

Run: `npm run dev`, open `/solar-system/planet-calendar`, click "Find next planet parade", and confirm: the "Searching…" text appears, the page stays interactive (the Mode dropdown still opens) while it searches, and the resulting date is in the 2030s with a score around 379 AU rather than 383.

- [ ] **Step 9: Commit**

```bash
git add packages/physics-engine/src/orbital/search.ts packages/physics-engine/src/orbital/alignment.ts packages/physics-engine/tests/orbital.test.ts packages/web/src/workers/alignment.worker.ts packages/web/src/hooks/useAlignmentSearch.ts packages/web/src/pages/PlanetCalendarPage.tsx
git commit -m "fix: minimise the reported AU objective with adaptive sampling in a worker"
```

---

### Task 16: Deduplicate the scenario plumbing and fix the drag panel (F-17, F-31, F-32, F-36)

`VerticalScenarioPage` and `ProjectilePage` each contain the same ~90 lines of drag and impact URL plumbing, while `lib/scenarioDefaults.ts` already exports `parseDragFromParams` and `parseImpactFromParams` that nothing calls. The `DragPanel` terminal-velocity readout uses `customRho` while the simulation uses the resolved preset ρ, editing `Cd` by hand leaves the shape dropdown claiming "Sphere", and choosing the Moon-vacuum atmosphere with drag enabled silently disables drag.

**Files:**
- Create: `packages/web/src/hooks/useDragSettings.ts`
- Create: `packages/web/src/hooks/useImpactSettings.ts`
- Modify: `packages/web/src/lib/scenarioDefaults.ts`
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx`
- Modify: `packages/web/src/pages/ProjectilePage.tsx`
- Modify: `packages/web/src/components/inputs/DragPanel.tsx`
- Delete: `packages/physics-engine/src/motion/vertical-throw.ts`
- Modify: `packages/physics-engine/src/index.ts`
- Modify: `packages/physics-engine/src/units.ts`
- Modify: `packages/physics-engine/src/constants.ts`
- Modify: `packages/physics-engine/src/simulation/shapes.ts`

**Interfaces:**
- Produces:

```ts
// packages/web/src/hooks/useDragSettings.ts
export function useDragSettings(): [DragSettings, (next: DragSettings) => void];

// packages/web/src/hooks/useImpactSettings.ts
export interface ImpactSettings {
  enabled: boolean;
  model: ImpactModel;
  stoppingTime: number;
  stoppingDistance: number;
  contactArea: number;
}
export function useImpactSettings(): [ImpactSettings, (patch: Partial<ImpactSettings>) => void];
```

- [ ] **Step 1: Write the drag settings hook**

Create `packages/web/src/hooks/useDragSettings.ts`:

```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DragSettings } from '../components/inputs/DragPanel';
import { DEFAULT_DRAG } from '../lib/scenarioDefaults';

function parseFloatParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useDragSettings(): [DragSettings, (next: DragSettings) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const settings = useMemo<DragSettings>(
    () => ({
      enabled: searchParams.get('drag') === '1',
      atmospherePreset:
        (searchParams.get('atmosphere') as DragSettings['atmospherePreset']) ||
        DEFAULT_DRAG.atmospherePreset,
      customRho: parseFloatParam(searchParams.get('rho'), DEFAULT_DRAG.customRho),
      shape: (searchParams.get('shape') as DragSettings['shape']) || DEFAULT_DRAG.shape,
      cd: parseFloatParam(searchParams.get('cd'), DEFAULT_DRAG.cd),
      area: parseFloatParam(searchParams.get('area'), DEFAULT_DRAG.area),
    }),
    [searchParams],
  );

  const setSettings = useCallback(
    (next: DragSettings) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('drag', next.enabled ? '1' : '0');
          params.set('atmosphere', next.atmospherePreset);
          params.set('rho', String(next.customRho));
          params.set('shape', next.shape);
          params.set('cd', String(next.cd));
          params.set('area', String(next.area));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [settings, setSettings];
}
```

Note the change from `parseFloat(params.get('rho') || '1.225')` to a guarded `Number(...)`: the old form turned `?rho=abc` into `NaN` and fed it straight into the physics.

- [ ] **Step 2: Write the impact settings hook**

Create `packages/web/src/hooks/useImpactSettings.ts`:

```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ImpactModel } from 'physics-engine';

export interface ImpactSettings {
  enabled: boolean;
  model: ImpactModel;
  stoppingTime: number;
  stoppingDistance: number;
  contactArea: number;
}

const DEFAULTS: ImpactSettings = {
  enabled: false,
  model: 'stoppingTime',
  stoppingTime: 0.01,
  stoppingDistance: 0.05,
  contactArea: 0,
};

function parseFloatParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useImpactSettings(): [ImpactSettings, (patch: Partial<ImpactSettings>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const settings = useMemo<ImpactSettings>(
    () => ({
      enabled: searchParams.get('impact') === '1',
      model: searchParams.get('impactModel') === 'stoppingDistance' ? 'stoppingDistance' : 'stoppingTime',
      stoppingTime: parseFloatParam(searchParams.get('stoppingTime'), DEFAULTS.stoppingTime),
      stoppingDistance: parseFloatParam(searchParams.get('stoppingDistance'), DEFAULTS.stoppingDistance),
      contactArea: parseFloatParam(searchParams.get('contactArea'), DEFAULTS.contactArea),
    }),
    [searchParams],
  );

  const setSettings = useCallback(
    (patch: Partial<ImpactSettings>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (patch.enabled !== undefined) params.set('impact', patch.enabled ? '1' : '0');
          if (patch.model !== undefined) params.set('impactModel', patch.model);
          if (patch.stoppingTime !== undefined) params.set('stoppingTime', String(patch.stoppingTime));
          if (patch.stoppingDistance !== undefined) {
            params.set('stoppingDistance', String(patch.stoppingDistance));
          }
          if (patch.contactArea !== undefined) params.set('contactArea', String(patch.contactArea));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [settings, setSettings];
}
```

- [ ] **Step 3: Use both hooks in the two pages**

In `packages/web/src/components/VerticalScenarioPage.tsx`, delete lines 48 (`const [searchParams, setSearchParams] = useSearchParams();`), 62-88 (the `dragSettings` memo and `setDragSettings`), and 90-105 (the impact params and `setImpactParam`). Replace them with:

```tsx
  const [dragSettings, setDragSettings] = useDragSettings();
  const [impact, setImpact] = useImpactSettings();
```

Remove the now-unused `useSearchParams` and `DEFAULT_DRAG` imports and add:

```tsx
import { useDragSettings } from '../hooks/useDragSettings';
import { useImpactSettings } from '../hooks/useImpactSettings';
```

Update the `ImpactPanel` usage to read from the `impact` object:

```tsx
          <ImpactPanel
            enabled={impact.enabled}
            model={impact.model}
            stoppingTime={impact.stoppingTime}
            stoppingDistance={impact.stoppingDistance}
            contactArea={impact.contactArea}
            impactSpeed={impactSpeed}
            mass={mass}
            onEnabledChange={(enabled) => setImpact({ enabled })}
            onModelChange={(model) => setImpact({ model })}
            onStoppingTimeChange={(stoppingTime) => setImpact({ stoppingTime })}
            onStoppingDistanceChange={(stoppingDistance) => setImpact({ stoppingDistance })}
            onContactAreaChange={(contactArea) => setImpact({ contactArea })}
          />
```

and change the `WorkspaceTabs` prop from `impactEnabled={impactEnabled}` to `impactEnabled={impact.enabled}`.

Apply the identical set of edits to `packages/web/src/pages/ProjectilePage.tsx` (its equivalent blocks are lines 52, 66-92, and 94-106).

- [ ] **Step 4: Delete the now-superseded dead parsers**

Replace the entire contents of `packages/web/src/lib/scenarioDefaults.ts` with:

```ts
import type { CelestialBodyId } from 'physics-engine';
import type { DragSettings } from '../components/inputs/DragPanel';

export const DEFAULT_DRAG: DragSettings = {
  enabled: false,
  atmospherePreset: 'earthSeaLevel',
  customRho: 1.225,
  shape: 'sphere',
  cd: 0.47,
  area: 0.01,
};

export type { CelestialBodyId };
```

- [ ] **Step 5: Fix the drag panel**

In `packages/web/src/components/inputs/DragPanel.tsx`:

Replace the `vt` computation (lines 28-30) with a resolved-ρ version, and add a vacuum warning:

```tsx
  const atmosphere = resolveAtmosphere(settings.atmospherePreset, settings.customRho, settings.enabled);
  const effectiveRho = atmosphere.rho;
  const vacuumPreset = settings.enabled && effectiveRho <= 0;

  const vt =
    settings.enabled && settings.area > 0 && effectiveRho > 0
      ? terminalVelocity(mass, g, effectiveRho, settings.cd, settings.area)
      : null;
```

and add `resolveAtmosphere` to the `physics-engine` import on line 3.

Immediately after the "Flexible solve disabled…" paragraph (line 49-51), insert:

```tsx
              {vacuumPreset && (
                <p className="error" style={{ fontSize: '0.8rem' }}>
                  The selected atmosphere has ρ = 0, so there is no drag. Choose Earth or Mars, or
                  pick Custom and enter a density.
                </p>
              )}
```

Change the terminal-velocity readout (lines 90-92) to show the resolved density so it can be cross-checked:

```tsx
              {vt !== null && Number.isFinite(vt) && (
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Terminal velocity ≈ {vt.toFixed(1)} m/s at ρ = {effectiveRho} kg/m³
                </p>
              )}
```

Make a manual `Cd` edit switch the shape to Custom, so the dropdown never lies. Replace the `Cd` field (line 89) with:

```tsx
              <NumberField
                label="Drag coefficient Cd"
                value={settings.cd}
                min={0.01}
                onChange={(cd) => update({ cd, shape: 'custom' })}
              />
```

- [ ] **Step 6: Delete the remaining dead exports**

Delete the file `packages/physics-engine/src/motion/vertical-throw.ts` (every one of its exports is a re-export of `free-fall.ts`, and nothing imports it).

In `packages/physics-engine/src/index.ts`, delete the line `export * from './motion/vertical-throw';`.

In `packages/physics-engine/src/units.ts`, delete `isPositiveFinite` and `isFiniteNumber`.

In `packages/physics-engine/src/constants.ts`, delete the `PLANET_GRAVITY` export (lines 24-27) and remove `PLANET_GRAVITY` from the `export { ... }` list on line 1 of `src/index.ts`.

In `packages/physics-engine/src/simulation/shapes.ts`, delete `getShapeCd`.

In `packages/physics-engine/src/types.ts`, delete the two deprecated aliases:

```ts
/** @deprecated Use CelestialBodyId */
export type PlanetId = CelestialBodyId;
```

- [ ] **Step 7: Verify nothing referenced them**

Run: `git grep -n "PLANET_GRAVITY\|getShapeCd\|isPositiveFinite\|isFiniteNumber\|vertical-throw\|sampleVerticalThrowTrajectory\|PlanetId\b\|parseDragFromParams\|parseImpactFromParams" -- packages/physics-engine/src packages/web/src`
Expected: no output. (`packages/physics-engine/tests/vertical-throw.test.ts` imports from `../src/motion/free-fall`, not the deleted module — confirm by reading its first three lines.)

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and open `/motion/free-fall?drag=1&atmosphere=marsThin`. Confirm the terminal-velocity line reads `at ρ = 0.02 kg/m³`, not an Earth-density figure. Then select the Moon-vacuum atmosphere and confirm the red "ρ = 0, so there is no drag" note appears.

- [ ] **Step 8: Commit**

```bash
git add packages/web/src/hooks/useDragSettings.ts packages/web/src/hooks/useImpactSettings.ts packages/web/src/lib/scenarioDefaults.ts packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx packages/web/src/components/inputs/DragPanel.tsx packages/physics-engine/src/index.ts packages/physics-engine/src/units.ts packages/physics-engine/src/constants.ts packages/physics-engine/src/simulation/shapes.ts packages/physics-engine/src/types.ts
git rm packages/physics-engine/src/motion/vertical-throw.ts
git commit -m "refactor: share the drag and impact URL hooks, resolve rho in the drag panel, drop dead code"
```

---

### Task 17: Design tokens, focus states, and accessible tab strips (F-24, F-30, F-34)

The app has 60+ inline `style` objects, several of which are copy-pasted verbatim (the `select` style appears in four files). There is no `:focus-visible` styling anywhere, so keyboard users cannot see where they are. Every tab strip is a row of plain `<button>`s with no `role="tab"`, `aria-selected`, or arrow-key navigation. Toggle buttons have no `aria-pressed`. Neptune's `#000080` is invisible on the `#0f1419` background.

**Files:**
- Modify: `packages/web/src/styles/global.css`
- Create: `packages/web/src/components/layout/TabStrip.tsx`
- Modify: `packages/web/src/components/WorkspaceTabs.tsx`
- Modify: `packages/web/src/components/graphs/GraphTabs.tsx`
- Modify: `packages/web/src/components/solar-system/PlanetCalendarPanels.tsx`
- Modify: `packages/web/src/components/layout/NavBar.tsx`
- Modify: `packages/web/src/components/inputs/PlanetSelector.tsx`
- Modify: `packages/web/src/components/inputs/DragPanel.tsx`
- Modify: `packages/web/src/pages/PlanetCalendarPage.tsx`
- Modify: `packages/physics-engine/src/orbital/bodies.ts`

**Interfaces:**
- Produces:

```tsx
// packages/web/src/components/layout/TabStrip.tsx
export interface TabDefinition<T extends string> { id: T; label: string; }
export function TabStrip<T extends string>(props: {
  tabs: TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}): JSX.Element;
```

Also produces the CSS classes `.select`, `.disclosure`, `.tabs`, `.tab`, `.page`, `.page--narrow`, `.stack`, and `.card-grid`, which replace the repeated inline styles.

- [ ] **Step 1: Extend the stylesheet**

Append to `packages/web/src/styles/global.css`:

```css
/* ---- Focus visibility (was entirely missing) ---- */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

a:focus-visible,
button:focus-visible,
select:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ---- Shared form control ---- */
.select {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.45rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
}

/* ---- Collapsible section header ---- */
.disclosure {
  width: 100%;
  text-align: left;
  margin-bottom: 0.5rem;
}

.panel-section {
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

/* ---- Tab strip ---- */
.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.tab[aria-selected='true'] {
  background: var(--accent-dim);
  border-color: var(--accent);
  font-weight: 600;
}

/* ---- Page scaffolding ---- */
.page {
  padding: 2rem 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.page--narrow {
  max-width: 800px;
}

.page--wide {
  max-width: 1400px;
  padding: 1rem 1.5rem;
}

.stack {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

/* ---- Responsive navigation ---- */
@media (max-width: 600px) {
  .app-nav {
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    padding: 0.75rem 1rem;
  }
}

/* ---- Respect reduced-motion preferences ---- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---- Screen-reader-only text ---- */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Also add `--surface-raised: #2b3850;` to the `:root` block for the callout background currently written as `var(--surface2)` — no, `--surface2` already exists and is correct. Skip that; do not add an unused token.

- [ ] **Step 2: Create the accessible tab strip**

Create `packages/web/src/components/layout/TabStrip.tsx`:

```tsx
import { useRef } from 'react';

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
}

interface TabStripProps<T extends string> {
  tabs: TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}

export function TabStrip<T extends string>({ tabs, active, onChange, ariaLabel }: TabStripProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const move = (delta: number) => {
    const index = tabs.findIndex((t) => t.id === active);
    if (index === -1) return;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    const next = tabs[nextIndex]!;
    onChange(next.id);
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)?.focus();
  };

  return (
    <div ref={containerRef} className="tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab"
          data-tab-id={tab.id}
          aria-selected={tab.id === active}
          tabIndex={tab.id === active ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              move(1);
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Adopt it in the three tab strips**

In `packages/web/src/components/WorkspaceTabs.tsx`, replace the tab-button block (lines 39-45) with:

```tsx
      <TabStrip
        ariaLabel="Workspace detail"
        tabs={[
          { id: 'graphs', label: 'Graphs' },
          { id: 'equations', label: 'Equations' },
          { id: 'assumptions', label: 'Assumptions' },
        ]}
        active={tab}
        onChange={setTab}
      />
```

with the import `import { TabStrip } from './layout/TabStrip';`.

In `packages/web/src/components/graphs/GraphTabs.tsx`, replace its tab-button block (lines 41-47 in the post-Task-13 file) with:

```tsx
      <TabStrip ariaLabel="Graph type" tabs={tabs} active={tab} onChange={setRequestedTab} />
```

with the import `import { TabStrip } from '../layout/TabStrip';`. The `tabs` array already has the `{ id, label }` shape `TabDefinition` expects.

In `packages/web/src/components/solar-system/PlanetCalendarPanels.tsx`, replace its tab-button block (lines 18-24) with:

```tsx
      <TabStrip
        ariaLabel="Planet calendar detail"
        tabs={[
          { id: 'equations', label: 'Equations' },
          { id: 'assumptions', label: 'Assumptions' },
        ]}
        active={tab}
        onChange={setTab}
      />
```

with the import `import { TabStrip } from '../layout/TabStrip';`.

- [ ] **Step 4: Replace the four duplicated select styles with the class**

In each of these four locations, delete the inline `style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' ... }}` object and replace it with `className="select"`:

- `packages/web/src/components/inputs/PlanetSelector.tsx` — the `selectStyle` constant (lines 19-25) and its use on line 30. Delete the constant.
- `packages/web/src/components/inputs/DragPanel.tsx` — the atmosphere select (line 61) and the shape select (line 81).
- `packages/web/src/pages/PlanetCalendarPage.tsx` — the `selectStyle` constant (lines 227-234) and its five uses. Delete the constant.

- [ ] **Step 5: Add `aria-pressed` to the toggles and a class to the nav**

In `packages/web/src/components/inputs/DragPanel.tsx` and `packages/web/src/components/inputs/ImpactPanel.tsx`, change the disclosure buttons to:

```tsx
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? '▼' : '▶'} Air resistance
      </button>
```

(use `Impact analysis` as the label in `ImpactPanel`, and make the same change to the button in `packages/web/src/components/equations/DerivativeChain.tsx` with the label `Derivatives and integrals`). Also replace each of those files' wrapper `style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}` with `className="panel-section"`.

In `packages/web/src/components/inputs/SolvableField.tsx`, add `aria-pressed` to the Given/Solve buttons:

```tsx
        <button
          type="button"
          className={mode === 'given' ? 'active' : ''}
          aria-pressed={mode === 'given'}
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => onModeChange('given')}
        >
          Given
        </button>
        <button
          type="button"
          className={mode === 'solve' ? 'active' : ''}
          aria-pressed={mode === 'solve'}
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          onClick={() => onModeChange('solve')}
        >
          Solve
        </button>
```

Do the same for the two model buttons in `packages/web/src/components/inputs/ImpactPanel.tsx` (`aria-pressed={model === 'stoppingTime'}` and `aria-pressed={model === 'stoppingDistance'}`).

In `packages/web/src/components/layout/NavBar.tsx`, add `className="app-nav"` to the `<header>` and `aria-current` handling to the links:

```tsx
    <header
      className="app-nav"
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <strong style={{ fontSize: '1.1rem' }}>Physics Lab</strong>
      <nav style={{ display: 'flex', gap: '1rem' }} aria-label="Main">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
```

React Router's `NavLink` already sets `aria-current="page"` on the active link, so no extra prop is needed — verify this in the rendered DOM rather than adding a duplicate attribute.

- [ ] **Step 6: Make Neptune visible**

In `packages/physics-engine/src/orbital/bodies.ts`, change Neptune's colour from `'#000080'` to `'#5a7bff'` and add a comment:

```ts
  // Neptune's conventional navy is invisible on the dark UI background; this is a
  // lightened variant chosen for contrast against --bg (#0f1419).
  { id: 'neptune', name: 'Neptune', body: Body.Neptune, color: '#5a7bff', schematicRadius: 16, markerSize: 4 },
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and check:
- Tab through `/motion/free-fall` with the keyboard only. Every control shows a visible blue focus ring.
- Focus the "Graphs / Equations / Assumptions" strip and press Left/Right arrows; the selection moves and focus follows.
- Neptune's dot and label are legible on `/solar-system/planet-calendar`.
- Narrow the window to 500 px and confirm the nav wraps instead of overflowing.

- [ ] **Step 8: Commit**

```bash
git add packages/web/src/styles/global.css packages/web/src/components/layout/TabStrip.tsx packages/web/src/components/WorkspaceTabs.tsx packages/web/src/components/graphs/GraphTabs.tsx packages/web/src/components/solar-system/PlanetCalendarPanels.tsx packages/web/src/components/layout/NavBar.tsx packages/web/src/components/inputs/PlanetSelector.tsx packages/web/src/components/inputs/DragPanel.tsx packages/web/src/components/inputs/ImpactPanel.tsx packages/web/src/components/inputs/SolvableField.tsx packages/web/src/components/equations/DerivativeChain.tsx packages/web/src/pages/PlanetCalendarPage.tsx packages/physics-engine/src/orbital/bodies.ts
git commit -m "feat: add focus states, accessible tab strips, shared control classes and a visible Neptune"
```

---

### Task 18: Fix the moon module and unify date formatting (F-22, F-26, F-28, F-29)

Four issues: `findUpcomingQuarters` has an unbounded loop; `formatDateString` returns ambiguous `d.m.yyyy` and drops the time, which matters because lunar quarters are instants; illumination is hand-rolled rather than taken from astronomy-engine's `Illumination()`; and the Moon Phases page keeps its date in React state so the view cannot be linked to.

**Files:**
- Modify: `packages/physics-engine/src/orbital/dates.ts`
- Modify: `packages/physics-engine/src/orbital/moon.ts`
- Modify: `packages/web/src/pages/MoonPhasesPage.tsx`
- Modify: `packages/web/src/pages/PlanetCalendarPage.tsx`
- Modify: `packages/physics-engine/tests/orbital.test.ts:17-22`
- Modify: `packages/physics-engine/tests/moon.test.ts`

**Interfaces:**
- Produces, in `dates.ts`:

```ts
/** ISO calendar date in UTC, e.g. "2026-09-01". */
export function formatIsoDate(date: Date): string;
/** ISO date plus UTC time to the minute, e.g. "2026-09-01 12:34 UTC". */
export function formatIsoDateTime(date: Date): string;
/** Parses "YYYY-MM-DD" at 12:00 UTC. Returns null when malformed or invalid. */
export function parseIsoDate(value: string): Date | null;
```

`formatDateString` is removed. `MoonPhaseInfo` keeps its shape but `illuminationFraction` now comes from `Illumination(Body.Moon, date).phase_fraction`.

- [ ] **Step 1: Write the failing tests**

Replace the `it('round-trips calendar dates', ...)` test in `packages/physics-engine/tests/orbital.test.ts` (lines 17-21) with:

```ts
  it('round-trips calendar dates', () => {
    const date = parseDateParts(1, 1, 2000);
    expect(formatIsoDate(date)).toBe('2000-01-01');
    expect(formatIsoDate(addDays(date, 365))).toBe('2000-12-31');
  });

  it('formats a date and time in UTC', () => {
    expect(formatIsoDateTime(new Date(Date.UTC(2026, 8, 1, 7, 5)))).toBe('2026-09-01 07:05 UTC');
  });

  it('parses ISO dates and rejects malformed ones', () => {
    expect(formatIsoDate(parseIsoDate('2026-02-28')!)).toBe('2026-02-28');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('nope')).toBeNull();
    expect(parseIsoDate('2026-2-8')).toBeNull();
  });
```

and change the `dates` import on line 5 to:

```ts
import {
  addDays,
  enumerateDates,
  formatIsoDate,
  formatIsoDateTime,
  parseDateParts,
  parseIsoDate,
  validateDateParts,
} from '../src/orbital/dates';
```

Append to `packages/physics-engine/tests/moon.test.ts`:

```ts
  it('matches astronomy-engine illumination at a known full moon', () => {
    // 2024-01-25 17:54 UTC full moon.
    const info = getMoonPhase(new Date(Date.UTC(2024, 0, 25, 17, 54)));
    expect(info.name).toBe('Full Moon');
    expect(info.illuminationFraction).toBeGreaterThan(0.99);
  });

  it('reports a near-zero illumination at a known new moon', () => {
    // 2024-01-11 11:57 UTC new moon.
    const info = getMoonPhase(new Date(Date.UTC(2024, 0, 11, 11, 57)));
    expect(info.name).toBe('New Moon');
    expect(info.illuminationFraction).toBeLessThan(0.01);
  });

  it('caps the quarter search instead of looping forever', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 10_000);
    expect(events.length).toBeLessThanOrEqual(400);
  });

  it('returns quarter events with a time of day', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 2);
    expect(events[0]!.date.getUTCHours() + events[0]!.date.getUTCMinutes()).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -w physics-engine -- orbital moon`
Expected: FAIL with `formatIsoDate is not a function` and a timeout or huge array from the quarter test.

- [ ] **Step 3: Replace the date formatters**

In `packages/physics-engine/src/orbital/dates.ts`, delete `formatDateString` and add:

```ts
function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/** ISO calendar date in UTC, e.g. "2026-09-01". */
export function formatIsoDate(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** ISO date plus UTC time to the minute, e.g. "2026-09-01 12:34 UTC". */
export function formatIsoDateTime(date: Date): string {
  return `${formatIsoDate(date)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** Parses "YYYY-MM-DD" at 12:00 UTC. Returns null when malformed or invalid. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (validateDateParts(day, month, year) !== null) return null;
  return parseDateParts(day, month, year);
}
```

`parseIsoDate` must be declared after `validateDateParts` and `parseDateParts` in the file, or hoisting will not matter for functions but readability will — put it at the end of the file.

- [ ] **Step 4: Fix the moon module**

In `packages/physics-engine/src/orbital/moon.ts`:

Change the imports on lines 1-2 to:

```ts
import { Body, Illumination, MoonPhase, NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';
import { formatIsoDateTime } from './dates';
```

`SearchMoonPhase` and `addDays` are no longer needed because `findUpcomingPhases` is being removed in favour of the quarter search (see below).

Delete `illuminationFromAngle` and change `getMoonPhase` to:

```ts
export function getMoonPhase(date: Date): MoonPhaseInfo {
  const phaseAngleDeg = MoonPhase(date);
  return {
    date: new Date(date.getTime()),
    phaseAngleDeg,
    name: phaseNameFromAngle(phaseAngleDeg),
    illuminationFraction: Illumination(Body.Moon, date).phase_fraction,
  };
}
```

Delete `findUpcomingPhases` and the `PHASE_TARGETS` constant entirely. `findUpcomingQuarters` returns exactly the same four event types via the library's dedicated search, is more accurate, and is already tested; keeping both was the F-31 duplication. Replace `findUpcomingQuarters` with a bounded version:

```ts
const MAX_QUARTER_ITERATIONS = 400;

export function findUpcomingQuarters(start: Date, count: number): MoonPhaseEvent[] {
  if (count < 1) return [];

  const events: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(start);
  let iterations = 0;

  while (events.length < count && iterations < MAX_QUARTER_ITERATIONS) {
    iterations++;
    const date = quarter.time.date;
    const phaseAngleDeg = quarterToAngle(quarter.quarter);
    events.push({
      date,
      name: QUARTER_NAMES[quarter.quarter] ?? phaseNameFromAngle(phaseAngleDeg),
      phaseAngleDeg,
    });
    quarter = NextMoonQuarter(quarter);
  }

  return events;
}
```

The old `if (date.getTime() > start.getTime() || events.length > 0)` guard is gone because `SearchMoonQuarter(start)` is documented to return the first quarter *after* `start`, so it was always true.

Change `formatMoonEvent` to include the time:

```ts
export function formatMoonEvent(event: MoonPhaseEvent): string {
  return `${event.name} — ${formatIsoDateTime(event.date)}`;
}
```

- [ ] **Step 5: Update the moon test imports**

In `packages/physics-engine/tests/moon.test.ts`, change line 2 to:

```ts
import { findUpcomingQuarters, getMoonPhase } from '../src/orbital/moon';
```

and delete the `it('finds upcoming major phases in order', ...)` test, replacing it with the equivalent against the surviving function:

```ts
  it('finds upcoming quarters in order', () => {
    const events = findUpcomingQuarters(parseDateParts(1, 1, 2024), 4);
    expect(events.length).toBe(4);
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.date.getTime()).toBeGreaterThan(events[i - 1]!.date.getTime());
    }
  });
```

- [ ] **Step 6: Run the engine tests**

Run: `npm test -w physics-engine`
Expected: all green.

- [ ] **Step 7: Put the Moon Phases date in the URL and show event times**

Replace `packages/web/src/pages/MoonPhasesPage.tsx` in full with:

```tsx
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  findUpcomingQuarters,
  formatIsoDate,
  formatIsoDateTime,
  formatMoonEvent,
  getMoonPhase,
  parseIsoDate,
  todayUtcDate,
} from 'physics-engine';
import { MoonPhaseCanvas } from '../components/solar-system/MoonPhaseCanvas';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const EVENT_COUNT = 8;

export function MoonPhasesPage() {
  useDocumentTitle('Moon Phases');
  const [searchParams, setSearchParams] = useSearchParams();

  const date = useMemo(() => {
    const param = searchParams.get('date');
    return (param !== null ? parseIsoDate(param) : null) ?? todayUtcDate();
  }, [searchParams]);

  const setDate = (next: Date) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('date', formatIsoDate(next));
        return params;
      },
      { replace: true },
    );
  };

  const phase = useMemo(() => getMoonPhase(date), [date]);
  const upcoming = useMemo(() => findUpcomingQuarters(date, EVENT_COUNT), [date]);

  return (
    <div className="page">
      <h1>Moon Phases</h1>
      <p className="muted">
        Geocentric lunar phase from the Sun–Moon ecliptic longitude difference, with the illuminated
        fraction from astronomy-engine&apos;s illumination model.
      </p>
      <Link to="/solar-system" className="muted" style={{ fontSize: '0.85rem' }}>
        ← Solar System hub
      </Link>

      <div className="card-grid">
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Current phase</h2>
          <label className="field">
            <span className="field__label muted">Date (UTC noon)</span>
            <input
              type="date"
              className="field__input"
              value={formatIsoDate(date)}
              onChange={(e) => {
                const parsed = parseIsoDate(e.target.value);
                if (parsed) setDate(parsed);
              }}
            />
          </label>
          <button type="button" onClick={() => setDate(todayUtcDate())} style={{ marginBottom: '1rem' }}>
            Today (UTC)
          </button>
          <MoonPhaseCanvas phase={phase} />
          <p style={{ textAlign: 'center', marginBottom: 0 }}>
            <strong>{phase.name}</strong>
          </p>
          <p className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {(phase.illuminationFraction * 100).toFixed(1)}% illuminated · λ☉☽ ={' '}
            {phase.phaseAngleDeg.toFixed(1)}°
          </p>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Upcoming quarters</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left', padding: '0.35rem' }}>Phase</th>
                <th style={{ textAlign: 'right', padding: '0.35rem' }}>Instant (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((event) => (
                <tr key={event.date.getTime()}>
                  <td style={{ padding: '0.35rem' }}>{event.name}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '0.35rem',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    {formatIsoDateTime(event.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            Next event: {upcoming[0] ? formatMoonEvent(upcoming[0]) : '—'}
          </p>
          <Link to="/solar-system/planet-calendar" style={{ fontSize: '0.9rem' }}>
            Open Planet Calendar →
          </Link>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Replace the remaining `formatDateString` call sites**

Run: `git grep -n "formatDateString" -- packages`
Expected hits: `packages/web/src/pages/PlanetCalendarPage.tsx` (three uses: `title`, and twice inside `resultsFooter`). Replace all three with `formatIsoDate`, and change the import on the page accordingly. There must be zero remaining references when you are done.

- [ ] **Step 9: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open `/solar-system/moon-phases?date=2024-01-25`, and confirm: the disk is essentially full, the illumination reads above 99%, the Upcoming quarters table shows times like `2024-02-02 23:18 UTC`, and copying the address bar into a new tab reproduces the same date.

- [ ] **Step 10: Commit**

```bash
git add packages/physics-engine/src/orbital/dates.ts packages/physics-engine/src/orbital/moon.ts packages/physics-engine/tests/orbital.test.ts packages/physics-engine/tests/moon.test.ts packages/web/src/pages/MoonPhasesPage.tsx packages/web/src/pages/PlanetCalendarPage.tsx
git commit -m "fix: ISO dates with times, library illumination, bounded quarter search, URL-driven moon date"
```

---

### Task 19: Differentiate Free Fall from Vertical Throw and improve the solar-system view (F-27, F-38)

`FreeFallPage` and `VerticalThrowPage` render the same component with the same nine fields; the only difference is the heading and one sentence of copy. Free fall means *released from rest*, so the page should pin `v₀ = 0`.

Separately, the solar-system canvas's "True ecliptic distances" mode is unusable: with Neptune at 30 AU and Mercury at 0.39 AU the four inner planets collapse into the Sun's dot. Adding a logarithmic radius option and a hover readout makes the mode worth having.

**Files:**
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx`
- Modify: `packages/web/src/pages/FreeFallPage.tsx`
- Modify: `packages/web/src/pages/VerticalThrowPage.tsx`
- Modify: `packages/physics-engine/src/orbital/types.ts:7`
- Modify: `packages/physics-engine/src/orbital/positions.ts`
- Modify: `packages/web/src/hooks/usePlanetCalendarParams.ts`
- Modify: `packages/web/src/pages/PlanetCalendarPage.tsx`
- Modify: `packages/web/src/components/solar-system/SolarSystemCanvas.tsx`
- Modify: `packages/web/src/components/solar-system/PlanetCalendarPanels.tsx`
- Test: `packages/physics-engine/tests/positions.test.ts`

**Interfaces:**
- Produces:

```ts
// packages/physics-engine/src/orbital/types.ts
export type DisplayScaleMode = 'true' | 'schematic' | 'log';
```

- `VerticalScenarioPage` gains `variant: 'freeFall' | 'verticalThrow'`. For `'freeFall'`, `v0` is forced to Given `0` and is rendered as a read-only note instead of a `SolvableField`.

- [ ] **Step 1: Write the failing test for the log scale**

Create `packages/physics-engine/tests/positions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getSolarSystemSnapshot } from '../src/orbital/positions';
import { parseDateParts } from '../src/orbital/dates';

const date = parseDateParts(1, 1, 2024);

describe('display scale modes', () => {
  it('true mode uses AU radii', () => {
    const snapshot = getSolarSystemSnapshot(date, 'true');
    const neptune = snapshot.positions.find((p) => p.id === 'neptune')!;
    expect(neptune.orbitDisplayRadius).toBeCloseTo(neptune.distanceAu, 6);
  });

  it('schematic mode uses fixed radii', () => {
    const snapshot = getSolarSystemSnapshot(date, 'schematic');
    expect(snapshot.positions.find((p) => p.id === 'mars')!.orbitDisplayRadius).toBe(8);
  });

  it('log mode compresses the outer planets but keeps the ordering', () => {
    const snapshot = getSolarSystemSnapshot(date, 'log');
    const radii = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].map(
      (id) => snapshot.positions.find((p) => p.id === id)!.orbitDisplayRadius,
    );
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]!).toBeGreaterThan(radii[i - 1]!);
    }
    // Neptune is ~77x Mercury's distance but under 6x its log radius.
    expect(radii[7]! / radii[0]!).toBeLessThan(6);
  });

  it('log mode keeps the display angle equal to the ecliptic longitude', () => {
    const snapshot = getSolarSystemSnapshot(date, 'log');
    const earth = snapshot.positions.find((p) => p.id === 'earth')!;
    const angle = (Math.atan2(earth.displayY, earth.displayX) * 180) / Math.PI;
    const expected = ((earth.longitudeDeg + 180) % 360) - 180;
    expect(angle).toBeCloseTo(expected, 4);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w physics-engine -- positions`
Expected: FAIL — `'log'` is not assignable to `DisplayScaleMode`, and the log-mode assertions fail.

- [ ] **Step 3: Add the log scale mode**

In `packages/physics-engine/src/orbital/types.ts` line 7, change:

```ts
export type DisplayScaleMode = 'true' | 'schematic' | 'log';
```

In `packages/physics-engine/src/orbital/positions.ts`, replace `toDisplayCoordinates` with:

```ts
/** Sun-relative radius used in log mode; 0.05 AU floor keeps log() finite. */
const LOG_FLOOR_AU = 0.05;

function toDisplayCoordinates(
  state: ReturnType<typeof heliocentricEcliptic>,
  schematicRadius: number,
  scaleMode: DisplayScaleMode,
): { displayX: number; displayY: number; orbitDisplayRadius: number } {
  if (scaleMode === 'true') {
    return {
      displayX: state.xAu,
      displayY: state.yAu,
      orbitDisplayRadius: state.distanceAu,
    };
  }

  const angle = degToRad(state.longitudeDeg);

  if (scaleMode === 'log') {
    const radius =
      state.distanceAu <= 0 ? 0 : Math.log10(Math.max(state.distanceAu, LOG_FLOOR_AU) / LOG_FLOOR_AU);
    return {
      displayX: radius * Math.cos(angle),
      displayY: radius * Math.sin(angle),
      orbitDisplayRadius: radius,
    };
  }

  return {
    displayX: schematicRadius * Math.cos(angle),
    displayY: schematicRadius * Math.sin(angle),
    orbitDisplayRadius: schematicRadius,
  };
}
```

With `LOG_FLOOR_AU = 0.05`: Mercury at 0.39 AU gives `log10(7.8) ≈ 0.89`, Neptune at 30 AU gives `log10(600) ≈ 2.78` — a ratio of 3.1, comfortably under the test's limit of 6, with strict ordering preserved.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w physics-engine -- positions`
Expected: PASS, 4 tests.

- [ ] **Step 5: Expose the mode in the UI**

In `packages/web/src/hooks/usePlanetCalendarParams.ts`, change the scale parser:

```ts
    const scaleParam = searchParams.get(keys.scaleMode);
    const scaleMode: DisplayScaleMode =
      scaleParam === 'true' || scaleParam === 'log' ? scaleParam : 'schematic';
```

In `packages/web/src/pages/PlanetCalendarPage.tsx`, add the third option to the Display scale select:

```tsx
              <option value="schematic">Schematic spacing (readable orbits)</option>
              <option value="log">Logarithmic distance (all planets visible)</option>
              <option value="true">True ecliptic distances (AU)</option>
```

In `packages/web/src/components/solar-system/SolarSystemCanvas.tsx`, widen the prop type and the footer label:

```tsx
import type { DisplayScaleMode, PlanetPosition } from 'physics-engine';

interface SolarSystemCanvasProps {
  positions: PlanetPosition[];
  title: string;
  scaleMode: DisplayScaleMode;
}
```

```tsx
    const scaleLabel =
      scaleMode === 'true'
        ? 'True ecliptic scale (AU)'
        : scaleMode === 'log'
          ? 'Logarithmic distance from the Sun'
          : 'Schematic spacing';
    ctx.fillText(scaleLabel, pad, h - 12);
```

In `packages/web/src/components/solar-system/PlanetCalendarPanels.tsx`, extend both places that branch on `scaleMode`. In `PlanetCalendarTabs`' assumptions list:

```tsx
          <li>
            Display scale:{' '}
            {scaleMode === 'true'
              ? 'true AU in the ecliptic plane'
              : scaleMode === 'log'
                ? 'log₁₀ of the true distance, with accurate ecliptic angles'
                : 'fixed schematic radii with accurate ecliptic angles'}
          </li>
```

and in `ScaleEducationCallout`:

```tsx
      <strong>
        {scaleMode === 'true'
          ? 'True AU scale'
          : scaleMode === 'log'
            ? 'Logarithmic distance'
            : 'Schematic spacing'}
      </strong>
      <p className="muted" style={{ margin: '0.35rem 0 0' }}>
        {scaleMode === 'true'
          ? 'Orbit circles and planet dots use real ecliptic distances in AU. The inner planets crowd together near the Sun.'
          : scaleMode === 'log'
            ? 'Radii are log₁₀ of the true distance, so Mercury and Neptune are both visible while the ordering stays honest. Angles still come from VSOP87.'
            : 'Orbit circles use fixed, evenly spaced radii so labels stay readable. Planet angles still come from VSOP87.'}{' '}
        Alignment and pair-distance calculations always use true 3D AU positions.
      </p>
```

- [ ] **Step 6: Add a hover readout to the solar-system canvas**

In `packages/web/src/components/solar-system/SolarSystemCanvas.tsx`, hit-test the pointer against the drawn markers. Add this state and handler, and store the projection in a ref so the handler can reuse it:

```tsx
  const [hovered, setHovered] = useState<PlanetPosition | null>(null);
  const projectionRef = useRef<{ toCanvas: (x: number, y: number) => { x: number; y: number } } | null>(null);
```

Inside the drawing effect, right after `toCanvas` is defined, add:

```tsx
    projectionRef.current = { toCanvas };
```

and after the planet-drawing loop, draw a ring around the hovered planet:

```tsx
    if (hovered) {
      const { x, y } = toCanvas(hovered.displayX, hovered.displayY);
      ctx.strokeStyle = hovered.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, hovered.markerSize + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
```

with `hovered` added to the effect's dependency array. Then replace the returned JSX with:

```tsx
  return (
    <div ref={wrapperRef} style={{ maxWidth: 560, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        role="img"
        style={{ display: 'block' }}
        aria-label={`Solar system positions on ${title}`}
        onMouseLeave={() => setHovered(null)}
        onMouseMove={(event) => {
          const projection = projectionRef.current;
          const canvas = canvasRef.current;
          if (!projection || !canvas) return;
          const rect = canvas.getBoundingClientRect();
          const px = event.clientX - rect.left;
          const py = event.clientY - rect.top;
          let closest: PlanetPosition | null = null;
          let closestDistance = Number.POSITIVE_INFINITY;
          for (const planet of positions) {
            const point = projection.toCanvas(planet.displayX, planet.displayY);
            const distance = Math.hypot(point.x - px, point.y - py);
            if (distance < planet.markerSize + 8 && distance < closestDistance) {
              closest = planet;
              closestDistance = distance;
            }
          }
          setHovered(closest);
        }}
      />
      <p className="muted" style={{ textAlign: 'center', fontSize: '0.85rem', minHeight: '1.4em' }}>
        {hovered
          ? `${hovered.name}: λ = ${hovered.longitudeDeg.toFixed(1)}°, r = ${hovered.distanceAu.toFixed(3)} AU`
          : 'Hover a planet for its longitude and distance.'}
      </p>
    </div>
  );
```

Add `useState` to the React import.

- [ ] **Step 7: Split Free Fall from Vertical Throw**

In `packages/web/src/components/VerticalScenarioPage.tsx`, change the props and the field list:

```tsx
interface VerticalScenarioPageProps {
  title: string;
  description: string;
  variant: 'freeFall' | 'verticalThrow';
}

export function VerticalScenarioPage({ title, description, variant }: VerticalScenarioPageProps) {
  useDocumentTitle(title);
  const releasedFromRest = variant === 'freeFall';
```

Force `v₀ = 0` in free-fall mode by overriding the derived `values` and `modes`. Immediately after the `modes` memo, add:

```tsx
  const effectiveModes = useMemo(
    () => (releasedFromRest ? { ...modes, v0: 'given' as const } : modes),
    [modes, releasedFromRest],
  );

  const effectiveValues = useMemo(
    () => (releasedFromRest ? { ...values, v0: 0 } : values),
    [values, releasedFromRest],
  );
```

and pass `effectiveValues` / `effectiveModes` to `useMotionScenario` and to the `resultItems` filter in place of `values` / `modes`.

Filter `v0` out of the rendered field list and add an explanatory line. Replace the `{VERTICAL_FIELDS.map((f) => (` block's opening with:

```tsx
          {releasedFromRest && (
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Free fall means released from rest, so v₀ is fixed at 0 m/s. Use{' '}
              <Link to="/motion/vertical-throw">Vertical Throw</Link> for a non-zero initial velocity.
            </p>
          )}
          {VERTICAL_FIELDS.filter((f) => !(releasedFromRest && f === 'v0')).map((f) => (
```

and add `import { Link } from 'react-router-dom';` at the top.

Then update the two page wrappers.

`packages/web/src/pages/FreeFallPage.tsx`:

```tsx
import { VerticalScenarioPage } from '../components/VerticalScenarioPage';

export function FreeFallPage() {
  return (
    <VerticalScenarioPage
      variant="freeFall"
      title="Free Fall"
      description="An object released from rest and falling under gravity. Enter the drop height, then solve for impact time, impact speed, or the state at any moment."
    />
  );
}
```

`packages/web/src/pages/VerticalThrowPage.tsx`:

```tsx
import { VerticalScenarioPage } from '../components/VerticalScenarioPage';

export function VerticalThrowPage() {
  return (
    <VerticalScenarioPage
      variant="verticalThrow"
      title="Vertical Throw"
      description="An object launched straight up or down. Positive v₀ is upward, negative is downward. Height is measured from the ground at y = 0."
    />
  );
}
```

Also update the Motion hub copy in `packages/web/src/pages/MotionHubPage.tsx` so the two are clearly distinct:

```tsx
const scenarios = [
  { to: '/motion/free-fall', title: 'Free Fall', desc: 'Released from rest — v₀ is fixed at 0' },
  { to: '/motion/vertical-throw', title: 'Vertical Throw', desc: 'Thrown up or down with any v₀' },
  { to: '/motion/projectile', title: 'Projectile Motion', desc: 'Launched at an angle in 2D' },
];
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and check:
- `/motion/free-fall` no longer shows an "Initial velocity v₀" field and results match a `v₀ = 0` drop, even if the URL carries `?v0=15`.
- `/motion/vertical-throw` still accepts a negative `v₀`.
- `/solar-system/planet-calendar` with Display scale set to "Logarithmic distance" shows all eight planets with distinct orbit circles, and hovering a planet shows its longitude and distance under the canvas.

- [ ] **Step 9: Commit**

```bash
git add packages/physics-engine/src/orbital/types.ts packages/physics-engine/src/orbital/positions.ts packages/physics-engine/tests/positions.test.ts packages/web/src/hooks/usePlanetCalendarParams.ts packages/web/src/pages/PlanetCalendarPage.tsx packages/web/src/pages/FreeFallPage.tsx packages/web/src/pages/VerticalThrowPage.tsx packages/web/src/pages/MotionHubPage.tsx packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/components/solar-system/SolarSystemCanvas.tsx packages/web/src/components/solar-system/PlanetCalendarPanels.tsx
git commit -m "feat: pin v0 in free fall, add a logarithmic solar-system scale and hover readout"
```

---

### Task 20: Tighten the TypeScript configs, docs, and CI (F-35, F-31)

`packages/web/tsconfig.app.json` is an unused project-reference stub that points back at the real config, so it is pure confusion. Neither package enables `noUncheckedIndexedAccess`, even though the whole codebase is written with `!` assertions on array access as if it were on — which means those assertions are currently unchecked noise rather than deliberate narrowing. The README also documents several things this plan changed.

**Files:**
- Delete: `packages/web/tsconfig.app.json`
- Modify: `packages/web/tsconfig.json`
- Modify: `packages/physics-engine/tsconfig.json`
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Delete the stub and enable the stricter flag**

```bash
git rm packages/web/tsconfig.app.json
```

In `packages/physics-engine/tsconfig.json`, add to `compilerOptions`:

```json
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
```

In `packages/web/tsconfig.json`, add to `compilerOptions`:

```json
    "noUncheckedIndexedAccess": true,
```

- [ ] **Step 2: Fix whatever the stricter flag surfaces**

Run: `npx tsc --noEmit -p packages/physics-engine/tsconfig.json`
Run: `npx tsc --noEmit -p packages/web/tsconfig.json`

Fix each error by adding the narrowing the code already assumed. The two legitimate patterns are:

```ts
// Index access that is provably in range: keep the non-null assertion.
const sample = samples[i]!;

// Index access that may be out of range: narrow explicitly.
const maybe = samples[i];
if (maybe === undefined) continue;
```

Do **not** silence an error by widening a type, adding `any`, or disabling the flag. If a specific file produces more than about 15 errors, note the file in the commit message so it can be reviewed, but still fix them.

- [ ] **Step 3: Add an explicit typecheck job to CI**

Replace `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - name: Typecheck the physics engine
        run: npx tsc --noEmit -p packages/physics-engine/tsconfig.json
      - name: Unit tests
        run: npm test
      - name: Production build
        run: npm run build
```

`npm run build` already runs `tsc --noEmit` for the web package, so only the engine needs its own step.

- [ ] **Step 4: Update the README to match reality**

Make these specific edits to `README.md`:

1. In the **Solar system** section, replace the sentence about the cluster finder with:

```markdown
Heliocentric positions use **astronomy-engine** (VSOP87) in the browser. Cluster and pair searches minimise the true 3D AU objective with an adaptive coarse grid (one sample per 5 days) plus golden-section refinement, and run in a Web Worker so the UI stays responsive. Solar-system routes are lazy-loaded to keep the main bundle smaller.
```

2. In the **Solar system** table, add a Display-scale note under the table:

```markdown
Three display scales are available: schematic (evenly spaced orbits), logarithmic (all planets visible, ordering preserved), and true AU.
```

3. In the **Motion scenarios** table, change the Free fall description to `Object released from rest (v₀ = 0)`.

4. In the **Comparison mode** section, replace the closing sentence with:

```markdown
Shared graphs, a per-variant summary table (flight time, impact speed, max height, range), and multi-object simulation. The full comparison — scenario, comparison axis, and every variant — is encoded in the URL, so a configuration can be shared as a link. The optional **Orbit date** panel shows each variant planet's heliocentric longitude and distance (URL param `orbitDate=YYYY-MM-DD`).
```

5. In the **Commands** table, add a row:

```markdown
| `npm run test:web` | Run web UI tests only (Vitest + jsdom) |
```

and change the `npm test` row's description to `Run all unit tests (physics-engine and web)`.

6. In **Limitations**, replace the bullet `- *g* does not vary with altitude in motion scenarios` with two bullets:

```markdown
- *g* does not vary with altitude in motion scenarios
- Numerical trajectories terminate exactly at *y* = 0 via sub-step bisection; the reported impact time is accurate to the RK4 truncation error, not to the sample interval
```

7. In **Roadmap**, delete the `- Moon phases and conjunction presets` bullet (both shipped) and add:

```markdown
- Unit toggle (mph, ft, lbf)
- Light theme
- CSV export of trajectory samples
```

8. In the **Project structure** tree, remove nothing but add `│       │   ├── workers/    # Off-main-thread alignment search` under the `web/src` entries, and add `│   │   ├── energy/` if it is missing — check the tree against `find packages -maxdepth 4 -type d -not -path "*/node_modules/*" -not -path "*/dist/*"` and correct any drift.

- [ ] **Step 5: Verify**

Run: `npm test && npm run build && npx tsc --noEmit -p packages/physics-engine/tsconfig.json`
Expected: all three exit 0.

- [ ] **Step 6: Commit**

```bash
git add README.md .github/workflows/ci.yml packages/web/tsconfig.json packages/physics-engine/tsconfig.json packages/physics-engine/src packages/web/src
git commit -m "chore: enable noUncheckedIndexedAccess, drop the dead tsconfig stub, sync the README"
```

---

## Phase 4 — Features

These are additive. Each is independently valuable and can be dropped without affecting the fixes above.

### Task 21: Scenario preset library

The app currently opens on abstract defaults. A row of one-click, physically interesting presets is the single cheapest way to make the tool feel alive, and it doubles as documentation for the URL parameter scheme.

**Files:**
- Create: `packages/web/src/lib/scenarioPresets.ts`
- Create: `packages/web/src/components/inputs/PresetBar.tsx`
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx`
- Modify: `packages/web/src/pages/ProjectilePage.tsx`
- Test: `packages/web/tests/scenarioPresets.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  /** Query string without the leading '?'. */
  query: string;
}
export const VERTICAL_PRESETS: ScenarioPreset[];
export const PROJECTILE_PRESETS: ScenarioPreset[];
```

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/scenarioPresets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PROJECTILE_PRESETS, VERTICAL_PRESETS } from '../src/lib/scenarioPresets';

describe('scenario presets', () => {
  it('has unique ids', () => {
    const ids = [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces parseable query strings with no leading question mark', () => {
    for (const preset of [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS]) {
      expect(preset.query.startsWith('?')).toBe(false);
      const params = new URLSearchParams(preset.query);
      expect([...params.keys()].length).toBeGreaterThan(0);
    }
  });

  it('only sets modes to given or solve', () => {
    for (const preset of [...VERTICAL_PRESETS, ...PROJECTILE_PRESETS]) {
      const params = new URLSearchParams(preset.query);
      for (const [key, value] of params) {
        if (key.endsWith('_mode')) expect(['given', 'solve']).toContain(value);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w web -- scenarioPresets`
Expected: FAIL with `Failed to resolve import "../src/lib/scenarioPresets"`.

- [ ] **Step 3: Write the presets**

Create `packages/web/src/lib/scenarioPresets.ts`:

```ts
export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  /** Query string without the leading '?'. */
  query: string;
}

export const VERTICAL_PRESETS: ScenarioPreset[] = [
  {
    id: 'eiffel',
    label: 'Drop from the Eiffel Tower',
    description: '330 m on Earth, no air resistance. Solve impact time and speed.',
    query:
      'planet=earth&mass=1&h0=330&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
  },
  {
    id: 'eiffelDrag',
    label: 'Eiffel Tower, with air',
    description: 'The same 330 m drop for a 1 kg, 0.01 m² sphere in sea-level air.',
    query:
      'planet=earth&mass=1&h0=330&h0_mode=given&v0=0&v0_mode=given&drag=1&atmosphere=earthSeaLevel&shape=sphere&cd=0.47&area=0.01',
  },
  {
    id: 'moonHammer',
    label: 'Apollo 15 hammer drop',
    description: 'A 1.32 m drop on the Moon, where a hammer and a feather land together.',
    query:
      'planet=moon&mass=1.32&h0=1.32&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
  },
  {
    id: 'jupiterDrop',
    label: '100 m on Jupiter',
    description: 'Same height, 2.5× Earth gravity.',
    query:
      'planet=jupiter&mass=1&h0=100&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
  },
  {
    id: 'skydiver',
    label: 'Skydiver terminal velocity',
    description: '80 kg from 4000 m with a 0.7 m² frontal area; watch v approach its asymptote.',
    query:
      'planet=earth&mass=80&h0=4000&h0_mode=given&v0=0&v0_mode=given&drag=1&atmosphere=earthSeaLevel&shape=cylinder&cd=0.82&area=0.7',
  },
  {
    id: 'throwUp',
    label: 'Throw 20 m/s upward',
    description: 'From 1.8 m, solve apex height and total flight time.',
    query:
      'planet=earth&mass=1&h0=1.8&h0_mode=given&v0=20&v0_mode=given&maxHeight_mode=solve&timeToMaxHeight_mode=solve&impactTime_mode=solve&drag=0',
  },
];

export const PROJECTILE_PRESETS: ScenarioPreset[] = [
  {
    id: 'maxRange45',
    label: '45° maximum range',
    description: '20 m/s from ground level — the classic optimum on flat ground.',
    query: 'planet=earth&mass=1&h0=0&h0_mode=given&v0=20&v0_mode=given&angle=45&angle_mode=given&range_mode=solve&flightTime_mode=solve&drag=0',
  },
  {
    id: 'cannonball',
    label: 'Cannonball with air resistance',
    description: '5 kg iron ball, 150 m/s at 35°, with sea-level drag.',
    query:
      'planet=earth&mass=5&h0=2&h0_mode=given&v0=150&v0_mode=given&angle=35&angle_mode=given&drag=1&atmosphere=earthSeaLevel&shape=sphere&cd=0.47&area=0.0079',
  },
  {
    id: 'solveAngle',
    label: 'What angle reaches 50 m?',
    description: 'Given 25 m/s and a 50 m target, solve for the launch angle.',
    query:
      'planet=earth&mass=1&h0=0&h0_mode=given&v0=25&v0_mode=given&range=50&range_mode=given&angle_mode=solve&drag=0',
  },
  {
    id: 'marsGolf',
    label: 'Golf drive on Mars',
    description: '70 m/s at 12° in Mars gravity and its thin atmosphere.',
    query:
      'planet=mars&mass=0.046&h0=0&h0_mode=given&v0=70&v0_mode=given&angle=12&angle_mode=given&drag=1&atmosphere=marsThin&shape=sphere&cd=0.47&area=0.00143',
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w web -- scenarioPresets`
Expected: PASS, 3 tests.

- [ ] **Step 5: Render the preset bar**

Create `packages/web/src/components/inputs/PresetBar.tsx`:

```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import type { ScenarioPreset } from '../../lib/scenarioPresets';

interface PresetBarProps {
  presets: ScenarioPreset[];
}

export function PresetBar({ presets }: PresetBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ marginBottom: '1rem' }}>
      <span className="muted" style={{ fontSize: '0.8rem' }}>
        Examples
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.description}
            style={{ textAlign: 'left', fontSize: '0.85rem' }}
            onClick={() => navigate(`${location.pathname}?${preset.query}`, { replace: true })}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Render `<PresetBar presets={VERTICAL_PRESETS} />` as the first element inside the `inputs` prop of `VerticalScenarioPage` (immediately after the description paragraph), and `<PresetBar presets={PROJECTILE_PRESETS} />` in the same position in `ProjectilePage`. Add the corresponding imports.

- [ ] **Step 6: Verify and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev` and click through every preset on `/motion/free-fall` and `/motion/projectile`. Each must produce a rendered trajectory with no error text in the Results panel.

```bash
git add packages/web/src/lib/scenarioPresets.ts packages/web/src/components/inputs/PresetBar.tsx packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx packages/web/tests/scenarioPresets.test.ts
git commit -m "feat: add a one-click scenario preset library"
```

---

### Task 22: Share link, reset, and CSV export

Every scenario is already fully described by its URL, but there is no way to copy that link without selecting the address bar, no way to get back to defaults, and no way to get the numbers out.

**Files:**
- Create: `packages/web/src/lib/exportCsv.ts`
- Create: `packages/web/src/components/results/ResultsActions.tsx`
- Modify: `packages/web/src/components/results/ResultsPanel.tsx`
- Modify: `packages/web/src/components/VerticalScenarioPage.tsx`
- Modify: `packages/web/src/pages/ProjectilePage.tsx`
- Test: `packages/web/tests/exportCsv.test.ts`

**Interfaces:**
- Produces:

```ts
export function samplesToCsv(samples: MotionSample[]): string;
export function downloadTextFile(filename: string, contents: string, mimeType?: string): void;
```

`ResultsPanel` gains an optional `actions?: ReactNode` slot rendered under the value list.

- [ ] **Step 1: Write the failing test**

Create `packages/web/tests/exportCsv.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { integrateVertical1D } from 'physics-engine';
import { samplesToCsv } from '../src/lib/exportCsv';

const env = { planet: 'earth' as const, g: 9.80665, mass: 1 };

describe('samplesToCsv', () => {
  it('emits a header and one row per sample', () => {
    const samples = integrateVertical1D(10, 0, env, { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 }, { step: 0.1 });
    const lines = samplesToCsv(samples).trim().split('\n');
    expect(lines[0]).toBe('t,x,y,vx,vy,ax,ay,speed,kineticEnergy,potentialEnergy,totalMechanicalEnergy,gForce,gravitationalForce,dragForce,netForce');
    expect(lines.length).toBe(samples.length + 1);
  });

  it('writes empty cells for absent optional fields', () => {
    const samples = integrateVertical1D(10, 0, env, { mass: 1, g: env.g, rho: 0, cd: 0.47, area: 0.01 }, { step: 0.1 });
    const stripped = samples.map((s) => ({ ...s, dragForce: undefined, netForce: undefined }));
    const firstRow = samplesToCsv(stripped).trim().split('\n')[1]!;
    expect(firstRow.endsWith(',,')).toBe(true);
  });

  it('returns only a header for an empty array', () => {
    expect(samplesToCsv([]).trim().split('\n')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w web -- exportCsv`
Expected: FAIL with `Failed to resolve import "../src/lib/exportCsv"`.

- [ ] **Step 3: Write the exporter**

Create `packages/web/src/lib/exportCsv.ts`:

```ts
import type { MotionSample } from 'physics-engine';

const COLUMNS = [
  't',
  'x',
  'y',
  'vx',
  'vy',
  'ax',
  'ay',
  'speed',
  'kineticEnergy',
  'potentialEnergy',
  'totalMechanicalEnergy',
  'gForce',
  'gravitationalForce',
  'dragForce',
  'netForce',
] as const;

export function samplesToCsv(samples: MotionSample[]): string {
  const rows = samples.map((sample) =>
    COLUMNS.map((column) => {
      const value = sample[column];
      return value === undefined || !Number.isFinite(value) ? '' : String(value);
    }).join(','),
  );
  return [COLUMNS.join(','), ...rows].join('\n') + '\n';
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -w web -- exportCsv`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add the actions component**

Create `packages/web/src/components/results/ResultsActions.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MotionSample } from 'physics-engine';
import { downloadTextFile, samplesToCsv } from '../../lib/exportCsv';

interface ResultsActionsProps {
  samples: MotionSample[];
  csvBasename: string;
}

export function ResultsActions({ samples, csvBasename }: ResultsActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <button type="button" onClick={copyLink} style={{ fontSize: '0.8rem' }}>
        {copied ? 'Link copied' : 'Copy shareable link'}
      </button>
      <button
        type="button"
        disabled={samples.length === 0}
        style={{ fontSize: '0.8rem' }}
        onClick={() => downloadTextFile(`${csvBasename}.csv`, samplesToCsv(samples))}
      >
        Download samples (CSV)
      </button>
      <button
        type="button"
        style={{ fontSize: '0.8rem' }}
        onClick={() => navigate(location.pathname, { replace: true })}
      >
        Reset to defaults
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Add the slot to `ResultsPanel` and use it**

In `packages/web/src/components/results/ResultsPanel.tsx`, add `actions?: ReactNode;` to `ResultsPanelProps` (with `import type { ReactNode } from 'react';`), destructure it, and render `{actions}` immediately after the closing `</dl>`.

In `packages/web/src/components/VerticalScenarioPage.tsx`, change the `results` prop to:

```tsx
      results={
        <ResultsPanel
          items={resultItems}
          error={error}
          hint={`g = ${scenario.env.g} m/s²`}
          actions={<ResultsActions samples={scenario.samples} csvBasename={`physics-lab-${variant}`} />}
        />
      }
```

and make the equivalent change in `packages/web/src/pages/ProjectilePage.tsx` with `csvBasename="physics-lab-projectile"`. Add the `ResultsActions` import to both.

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open `/motion/free-fall`, click each of the three buttons, and confirm: the link copies (paste it into a new tab and the scenario reproduces), a CSV downloads and opens in a spreadsheet with a header row, and Reset clears the query string.

```bash
git add packages/web/src/lib/exportCsv.ts packages/web/src/components/results/ResultsActions.tsx packages/web/src/components/results/ResultsPanel.tsx packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx packages/web/tests/exportCsv.test.ts
git commit -m "feat: add copy-link, reset, and CSV export to the results panel"
```

---

### Task 23: Terminal-velocity asymptote and drag annotations on the graphs

When air resistance is on, the most interesting fact about the velocity curve is the asymptote it is approaching, and it is not drawn. The Forces graph also omits the net force in the no-drag case, and the Energy graph does not show where the lost energy went.

**Files:**
- Modify: `packages/web/src/components/graphs/GraphTabs.tsx`
- Modify: `packages/web/src/components/WorkspaceTabs.tsx`

- [ ] **Step 1: Pass the drag configuration into `GraphTabs`**

`GraphTabs` already receives `g`, `mass`, and `dragEnabled`. Add the three quantities needed for the asymptote. Change `GraphTabsProps` to:

```tsx
interface GraphTabsProps {
  samples: MotionSample[];
  vacuumSamples?: MotionSample[];
  isProjectile?: boolean;
  g: number;
  mass: number;
  dragEnabled?: boolean;
  /** Resolved air density, drag coefficient, and area — needed for the terminal-velocity line. */
  rho?: number;
  cd?: number;
  area?: number;
}
```

In `packages/web/src/components/WorkspaceTabs.tsx`, add the same three optional props to `WorkspaceTabsProps` and forward them to `GraphTabs`. Then in both `VerticalScenarioPage` and `ProjectilePage`, pass them from the drag settings — the resolved density, not `customRho`:

```tsx
          rho={resolveAtmosphere(dragSettings.atmospherePreset, dragSettings.customRho, dragSettings.enabled).rho}
          cd={dragSettings.cd}
          area={dragSettings.area}
```

with `resolveAtmosphere` added to each page's `physics-engine` import.

- [ ] **Step 2: Draw the asymptote and the missing series**

In `packages/web/src/components/graphs/GraphTabs.tsx`, compute the terminal velocity once:

```tsx
  const vTerminal =
    dragEnabled && rho !== undefined && cd !== undefined && area !== undefined && area > 0 && rho > 0
      ? terminalVelocity(mass, g, rho, cd, area)
      : null;
```

with `import { terminalVelocity } from 'physics-engine';`.

Replace the `velocity` tab's non-projectile series with a version that includes the asymptote:

```tsx
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
```

and add a caption under the velocity chart:

```tsx
      {tab === 'velocity' && vTerminal !== null && Number.isFinite(vTerminal) && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Terminal velocity v_t = √(2mg / ρC_dA) = {vTerminal.toFixed(2)} m/s. A falling object
          approaches −v_t asymptotically and never exceeds it.
        </p>
      )}
```

Replace the Forces tab's series with one that always shows the net force:

```tsx
          series={[
            { label: 'Fg', data: samples.map(() => mass * g), color: '#4da3ff' },
            ...(dragEnabled
              ? [
                  { label: 'Fdrag', data: samples.map((s) => s.dragForce ?? 0), color: '#f0b429' },
                  { label: 'Fnet', data: samples.map((s) => s.netForce ?? mass * g), color: '#f87171' },
                ]
              : [{ label: 'Fnet', data: samples.map(() => mass * g), color: '#f87171' }]),
          ]}
```

Add an energy-loss series to the Energy tab when drag is on, so the missing energy is visible rather than merely described:

```tsx
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
```

- [ ] **Step 3: Verify and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open the "Skydiver terminal velocity" preset from Task 21, select the Velocity tab, and confirm the velocity curve flattens onto the red asymptote line at about −54 m/s and the caption states the same number.

```bash
git add packages/web/src/components/graphs/GraphTabs.tsx packages/web/src/components/WorkspaceTabs.tsx packages/web/src/components/VerticalScenarioPage.tsx packages/web/src/pages/ProjectilePage.tsx
git commit -m "feat: plot the terminal-velocity asymptote, net force, and energy lost to drag"
```

---

### Task 24: Keyboard shortcuts for playback

The simulation is the centrepiece and can only be driven with the mouse.

**Files:**
- Create: `packages/web/src/hooks/useKeyboardShortcuts.ts`
- Modify: `packages/web/src/components/simulation/SimulationCanvas.tsx`

**Interfaces:**
- Produces:

```ts
export interface ShortcutMap { [key: string]: (event: KeyboardEvent) => void; }
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled?: boolean): void;
```

The hook ignores events whose target is an `input`, `textarea`, `select`, or any element with `contenteditable`, so typing a number never triggers a shortcut.

- [ ] **Step 1: Write the hook**

Create `packages/web/src/hooks/useKeyboardShortcuts.ts`:

```ts
import { useEffect, useRef } from 'react';

export interface ShortcutMap {
  [key: string]: (event: KeyboardEvent) => void;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const handler = shortcutsRef.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
```

- [ ] **Step 2: Wire it into the simulation**

In `packages/web/src/components/simulation/SimulationCanvas.tsx`, add after the playback effect:

```tsx
  const scrubBy = (delta: number) => {
    setPlaying(false);
    setTime((current) => {
      const next = Math.min(Math.max(current + delta, 0), duration);
      onTimeChange?.(next);
      return next;
    });
  };

  useKeyboardShortcuts(
    {
      ' ': () => setPlaying((p) => !p),
      ArrowRight: () => scrubBy(duration / 100),
      ArrowLeft: () => scrubBy(-duration / 100),
      Home: () => {
        setPlaying(false);
        setTime(0);
        onTimeChange?.(0);
      },
      End: () => {
        setPlaying(false);
        setTime(duration);
        onTimeChange?.(duration);
      },
    },
    samples.length > 0,
  );
```

with `import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';`.

Add a discoverable hint below the playback controls:

```tsx
      <p className="muted" style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>
        Space to play or pause · ← → to scrub · Home / End to jump
      </p>
```

- [ ] **Step 3: Verify and commit**

Run: `npm test && npm run build`
Expected: both exit 0.

Run: `npm run dev`, open `/motion/projectile`, press Space (playback starts), press the arrow keys (the marker moves), then click into "Initial height h₀", type `1.5`, and confirm no shortcut fires and the space bar is not swallowed.

```bash
git add packages/web/src/hooks/useKeyboardShortcuts.ts packages/web/src/components/simulation/SimulationCanvas.tsx
git commit -m "feat: keyboard shortcuts for simulation playback"
```

---

### Task 25: Full-suite verification and manual regression pass

**Files:** none modified.

- [ ] **Step 1: Run everything**

```bash
npm ci
npm test
npm run build
npx tsc --noEmit -p packages/physics-engine/tsconfig.json
npx tsc --noEmit -p packages/web/tsconfig.json
```

Expected: all five exit 0. Record the final test counts.

- [ ] **Step 2: Walk the manual checklist**

Run `npm run preview` and confirm every line below. Note anything that fails and fix it before considering the plan complete.

1. `/` renders three cards; each link navigates.
2. `/motion/free-fall` — no `v₀` field; typing `12.5` into `h₀` works; results update; Given/Solve toggles work.
3. `/motion/vertical-throw` — a negative `v₀` is accepted; a `y` in Given mode with two roots lists both times.
4. `/motion/projectile` — the trajectory renders; `range` Given + `angle` Solve yields two angles.
5. Enable air resistance on any motion page — the "Vacuum vs drag" tab appears and is selected; the flight time is longer than the vacuum case; the velocity graph shows the terminal-velocity line; the results and the Impact panel both use the drag numbers.
6. Disable air resistance again — the graphs panel switches to Position instead of going blank.
7. `?mass=0` shows a validation error, not a broken render.
8. `/compare` — switch to Projectile / Launch angle; set 30 and 60; the summary table shows a longer range for 45 than for either; add and remove variant C with no console warnings; copy the URL into a new tab and the configuration reproduces.
9. `/solar-system/planet-calendar` — the Display-scale dropdown actually changes the drawing; the Cluster-metric dropdown actually changes the search; "Find next planet parade" keeps the UI responsive; hovering a planet shows its longitude and distance.
10. `/solar-system/moon-phases` — step one day at a time across a month; no fully-black half moon; the quarter table shows times; `?date=2024-01-25` loads that date.
11. `/nope` renders the "Page not found" page.
12. Tab through any page with the keyboard only — every control shows a focus ring.
13. Resize the window from 1600 px to 400 px — no horizontal overflow on any page.
14. Zero errors and zero warnings in the browser console across the whole walkthrough.

- [ ] **Step 3: Commit any fixes found**

```bash
git add -A
git commit -m "fix: address findings from the manual regression pass"
```

---

## Deliberately deferred

These were considered and are intentionally out of scope, with the reason recorded so the decision does not need re-litigating.

- **Unit conversion (mph, ft, lbf).** Genuinely valuable and on the README roadmap, but it touches every input, every label, every graph axis, and every CSV column. It needs its own plan with a `Quantity`/`Unit` model in the engine — bolting a display-only converter onto the current code would violate the naming-alignment constraint.
- **Light theme.** Requires auditing every hard-coded hex in the canvases and the uPlot overrides. Task 12 already routes the canvas colours through CSS custom properties, which is the prerequisite; the theme itself is a follow-up.
- **3D solar-system view.** Would add a WebGL dependency to a project that is currently dependency-light and ships a static bundle.
- **Moon and Pluto in the planet calendar.** `ORBITAL_BODIES` is heliocentric and the Moon is not, so adding it needs a separate geocentric display mode rather than another row in the table.
- **Springs, pendulums, collisions.** New physics domains, each deserving its own engine module, page, and plan.
- **Numerical inverse solving with drag enabled.** Currently the app disables flexible solving whenever drag is on. Supporting it means a root-find over forward simulations (for example, bisect on `v₀` until the simulated range matches a target). It is tractable and would remove the app's most visible capability cliff, but it is a feature in its own right and depends on Task 5's ground-crossing fix landing first.

## Self-review notes

- Every finding F-01 through F-38 maps to a task in the index table; F-19 and F-37 each span two tasks, which is noted in the table.
- Field-name consistency was checked across tasks: `impactSpeed`/`impactVelocityY` (Task 6) is used by Tasks 8, 14, and the Task 25 checklist; `clusterScoreAu` (Task 15) is used only within the engine and its tests; `DisplayScaleMode` gains `'log'` in Task 19 and every consumer identified in that task's file list is updated; `formatIsoDate`/`formatIsoDateTime`/`parseIsoDate` (Task 18) replace `formatDateString` at all four call sites; `TabStrip`'s `TabDefinition` shape matches the existing `tabs` arrays in `GraphTabs` and `WorkspaceTabs`.
- Task ordering matters in three places: Task 1 must precede Tasks 2, 3, 12, 14, 21, and 22 (they add web tests); Task 5 must precede Task 6 (the summary reads the final sample, which must be at `y = 0`); Task 12 must precede Task 24 (the shortcuts drive the continuous `time` state introduced there). Task 18's `formatIsoDate` is referenced by Task 15's footer edit, which is why that step says to keep `formatDateString` until Task 18 lands.

