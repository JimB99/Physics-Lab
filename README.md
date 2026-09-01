# Physics Lab

Interactive physics playground for motion under gravity — calculations, equations, graphs, and simulations in the browser.

**[Live demo](https://jimb99.github.io/Physics-Lab/)** · MIT License

Physics Lab is not a black-box calculator. Enter what you know, solve for what you don't, and see the equations, assumptions, and graphs update together.

---

## Features

### Motion scenarios

| Scenario | Route | Description |
|----------|-------|-------------|
| Free fall | `/motion/free-fall` | Object released from rest (v₀ = 0) |
| Vertical throw | `/motion/vertical-throw` | Thrown upward or downward |
| Projectile motion | `/motion/projectile` | Launch at an angle |

Each scenario uses a **workspace layout**: environment & inputs on the left, live simulation in the center, results on the right, and tabs for graphs, equations, and assumptions.

### Flexible problem solving

Mark any quantity as **Given** or **Solve for** — for example:

- Given initial height and velocity → solve impact time and speed
- Given time → solve position and velocity at that instant
- Given height → solve when the object reaches it

Works with the idealized (constant *g*, no drag) model. When air resistance is enabled, the app switches to forward numerical simulation.

### Environments

Choose a celestial body or custom gravity:

Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune, **Sun** (surface gravity), or custom *g*.

### Air resistance

Optional quadratic drag model with atmosphere presets, object shape → drag coefficient, and cross-sectional area. Includes RK4 numerical integration, terminal velocity, vacuum-vs-drag graph overlays, and energy-loss tracking.

### Impact analysis

Post-motion estimates using stopping time or stopping distance:

- Average impact force
- Impact acceleration and G-force
- Pressure (with contact area)

Clearly labeled as **average** force, not peak.

### Comparison mode

[`/compare`](/compare) — run up to three variants side by side:

- **Environment** — e.g. Earth vs Moon
- **Drag** — vacuum vs air resistance
- **Angle** — different launch angles (projectile)

Shared graphs, a per-variant summary table (flight time, impact speed, max height, range), and multi-object simulation. The full comparison — scenario, comparison axis, and every variant — is encoded in the URL, so a configuration can be shared as a link. The optional **Orbit date** panel shows each variant planet's heliocentric longitude and distance (URL param `orbitDate=YYYY-MM-DD`).

### Solar system

| Module | Route | Description |
|--------|-------|-------------|
| Planet Calendar | `/solar-system/planet-calendar` | VSOP87 heliocentric positions, fast cluster finder, animation |
| Moon Phases | `/solar-system/moon-phases` | Lunar phase, illumination, upcoming quarter events |
| Solar System hub | `/solar-system` | Entry point for orbital modules |

Heliocentric positions use **astronomy-engine** (VSOP87) in the browser. Cluster and pair searches minimise the true 3D AU objective with an adaptive coarse grid (one sample per 5 days) plus golden-section refinement, and run in a Web Worker so the UI stays responsive. Solar-system routes are lazy-loaded to keep the main bundle smaller.

Three display scales are available: schematic (evenly spaced orbits), logarithmic (all planets visible, ordering preserved), and true AU.

### Equations & visualization

- KaTeX-rendered equations with solve steps
- Live uPlot charts (position, velocity, energy, forces, trajectory)
- Canvas animation with play / pause / scrub
- Shareable URLs (inputs and modes encoded in query params)

---

## Getting started

**Requirements:** Node.js 20+

```bash
git clone https://github.com/JimB99/Physics-Lab.git
cd Physics-Lab
npm install
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server at `http://localhost:5173/Physics-Lab/` |
| `npm test` | Run all unit tests (physics-engine and web) |
| `npm run test:web` | Run web UI tests only (Vitest + jsdom) |
| `npm run build` | Production build → `packages/web/dist` |
| `npm run preview` | Preview production build locally |

### Deploy to GitHub Pages

1. Push to `main`
2. Repo **Settings → Pages → Source: GitHub Actions**
3. The workflow in `.github/workflows/deploy-pages.yml` builds and deploys automatically

The app is configured for a project site at `/Physics-Lab/`.

---

## Project structure

```
Physics-Lab/
├── packages/
│   ├── physics-engine/     # Pure TypeScript physics (tested with Vitest)
│   │   ├── motion/         # Analytical kinematics
│   │   ├── solve/          # Flexible inverse solver
│   │   ├── simulation/     # RK4 integrator, comparison helpers
│   │   ├── impact/         # Impact force models
│   │   ├── forces/         # Gravity, drag
│   │   ├── energy/         # Mechanical energy helpers
│   │   └── orbital/        # VSOP87 solar-system positions & alignment
│   └── web/                # Vite + React UI
│       └── src/
│           ├── pages/      # Scenario & compare pages
│           ├── components/ # Inputs, graphs, simulation
│           ├── hooks/      # URL state, scenario wiring
│           └── workers/    # Off-main-thread alignment search
└── .github/workflows/      # CI and Pages deploy
```

The physics engine has **no React dependencies** — all calculations are unit-tested independently of the UI.

---

## Tech stack

- **UI:** React 19, React Router, TypeScript, Vite
- **Charts:** uPlot
- **Math:** KaTeX
- **Ephemeris:** astronomy-engine (VSOP87)
- **Tests:** Vitest
- **Hosting:** GitHub Pages (static)

---

## Physics models

### Idealized motion (default)

- Constant gravitational acceleration *g*
- Point mass, flat ground at *y* = 0
- SI units throughout
- Analytical solutions + flexible inverse solving

Core equations:

```
y(t) = h₀ + v₀t − ½gt²
v(t) = v₀ − gt
Eₖ = ½mv² ,  Eₚ = mgh ,  F_g = mg
```

### With air resistance

```
F_drag = ½ ρ C_d A v²   (opposes motion)
```

Numerical integration (RK4). Mechanical energy is no longer conserved; the UI shows energy lost to drag.

### Impact (optional)

```
F_avg = Δp / Δt          (stopping time)
F_avg ≈ mv² / (2d)       (stopping distance)
P = F / A                (pressure)
```

Assumes uniform deceleration over the stopping interval. Peak forces can be much higher.

### Limitations

- Motion scenarios: Sun uses **surface gravity** only — no orbital mechanics in those models
- Solar System module: heliocentric VSOP87 positions; Moon/Pluto not shown in planet calendar
- *g* does not vary with altitude in motion scenarios
- Numerical trajectories terminate exactly at *y* = 0 via sub-step bisection; the reported impact time is accurate to the RK4 truncation error, not to the sample interval
- No wind, lift, or spin
- Impact model gives average force, not peak

---

## Roadmap

Possible future additions:

- Springs, pendulums, harmonic motion
- Elastic / inelastic collisions
- Unit toggle (mph, ft, lbf)
- Light theme
- CSV export of trajectory samples
- Step-by-step full derivations
- 3D visualization

See [Issues](https://github.com/JimB99/Physics-Lab/issues) for ideas and bugs.

---

## Contributing

Contributions welcome. Please run `npm test` and `npm run build` before opening a PR.

1. Fork the repo
2. Create a feature branch
3. Make changes with tests where applicable
4. Open a pull request

---

## License

[MIT](LICENSE)
