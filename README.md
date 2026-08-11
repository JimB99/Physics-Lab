# Physics Lab

Interactive physics playground for motion under gravity — calculations, equations, graphs, and simulations in the browser.

**[Live demo](https://jimb99.github.io/Physics-Lab/)** · MIT License

Physics Lab is not a black-box calculator. Enter what you know, solve for what you don't, and see the equations, assumptions, and graphs update together.

---

## Features

### Motion scenarios

| Scenario | Route | Description |
|----------|-------|-------------|
| Free fall | `/motion/free-fall` | Object falling under gravity |
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

Shared graphs and multi-object simulation.

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
| `npm test` | Run physics-engine unit tests (Vitest) |
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
│   │   └── forces/         # Gravity, drag
│   └── web/                # Vite + React UI
│       └── src/
│           ├── pages/      # Scenario & compare pages
│           ├── components/ # Inputs, graphs, simulation
│           └── hooks/      # URL state, scenario wiring
└── .github/workflows/      # CI and Pages deploy
```

The physics engine has **no React dependencies** — all calculations are unit-tested independently of the UI.

---

## Tech stack

- **UI:** React 19, React Router, TypeScript, Vite
- **Charts:** uPlot
- **Math:** KaTeX
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

- Sun uses **surface gravity** only — no orbital mechanics
- *g* does not vary with altitude
- No wind, lift, or spin
- Impact model gives average force, not peak

---

## Roadmap

Possible future additions:

- Springs, pendulums, harmonic motion
- Elastic / inelastic collisions
- Unit conversion (mph, ft, etc.)
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
