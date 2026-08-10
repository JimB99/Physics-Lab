# Physics Lab

Interactive physics calculations, simulations, equations, and visualizations.

Physics Lab is a web application for exploring physics through interactive calculations and visualizations.

Instead of simply providing a numerical answer, Physics Lab aims to show how the result is derived, how the relevant physical quantities relate to each other, and how changing the input parameters affects the system.

---

## Goals

Physics Lab should make it easy to:

- Enter physical parameters and calculate results.
- Understand the equations behind each calculation.
- See how equations are derived using derivatives and integrals.
- Visualize physical systems interactively.
- Compare different physical quantities on graphs.
- Experiment with different environments and parameters.
- Understand the assumptions and limitations behind each model.

The goal is not just to build a collection of calculators, but an interactive physics playground where calculations, equations, simulations, and visualizations are connected.

---

# Current Scope

The initial version will focus on motion under gravity:

1. Free Fall
2. Vertical Throw
3. Projectile Motion

These will share common physics components such as gravity, velocity, acceleration, energy, force, and visualization.

---

# Motion

## 1. Free Fall

Calculate and visualize an object falling under gravity.

### Inputs

- Initial height
- Initial velocity
- Object mass
- Planet / environment
- Gravitational acceleration
- Optional air resistance parameters

### Results

- Time
- Height / position
- Velocity
- Acceleration
- Impact velocity
- Kinetic energy
- Potential energy
- G-force
- Impact force

### Visualizations

- Object position over time
- Velocity over time
- Acceleration over time
- Kinetic energy over time
- Potential energy over time
- Total mechanical energy over time
- Optional force graphs

---

## 2. Vertical Throw

Simulate an object thrown vertically upward or downward.

This should support both:

- Throwing upward
- Throwing downward

### Inputs

- Initial height
- Initial velocity
- Direction
- Object mass
- Planet / environment
- Gravitational acceleration
- Optional air resistance parameters

### Results

- Time to maximum height
- Maximum height
- Time to return to the starting height
- Time to impact
- Velocity at any point in time
- Impact velocity
- Acceleration
- Kinetic energy
- Potential energy
- G-force
- Impact force

### Visualizations

- Height vs. time
- Velocity vs. time
- Acceleration vs. time
- Kinetic vs. potential energy
- Total mechanical energy
- Object trajectory animation

---

## 3. Projectile Motion

Simulate an object launched at an angle.

The standard term for this type of motion is projectile motion.

### Inputs

- Initial height
- Initial velocity
- Launch angle
- Object mass
- Planet / environment
- Gravitational acceleration
- Optional air resistance parameters

### Results

- Flight time
- Horizontal distance
- Maximum height
- Impact velocity
- Impact angle
- Horizontal velocity
- Vertical velocity
- Acceleration
- Kinetic energy
- Potential energy
- G-force
- Impact force

### Visualizations

- 2D trajectory
- Height vs. horizontal distance
- Velocity components
- Velocity magnitude
- Acceleration
- Kinetic vs. potential energy
- Total mechanical energy
- Animated projectile

### Optional interactive controls

Allow the user to change parameters and immediately see the trajectory update.

For example:

- Velocity slider
- Angle slider
- Height slider
- Gravity / planet selector
- Mass input
- Air resistance toggle

---

# Equations and Physics

A major goal of Physics Lab is to explain the equations instead of only displaying their results.

Each calculation should show:

- The equation
- Explanation of each variable
- Units
- The values substituted into the equation
- The resulting calculation
- Assumptions
- Where appropriate, the derivation

---

## Derivatives and Integrals

Show how the fundamental motion equations relate to each other.

For example:

Acceleration is the derivative of velocity:

    a(t) = dv/dt

Integrating acceleration gives velocity:

    v(t) = ∫ a(t) dt

Velocity is the derivative of position:

    v(t) = dh/dt

Integrating velocity gives position:

    h(t) = ∫ v(t) dt

The application should make these relationships visually understandable.

For example:

    Position
       ↑
       │ derivative
       │
    Velocity
       ↑
       │ derivative
       │
    Acceleration

And in the opposite direction:

    Acceleration
       │
       │ integral
       ↓
    Velocity
       │
       │ integral
       ↓
    Position

---

# Gravity

Gravity should be treated as an environment-dependent parameter rather than being hard-coded to Earth.

## Supported environments

Initially:

- Earth
- Moon
- Mars

Eventually:

- Mercury
- Venus
- Jupiter
- Saturn
- Uranus
- Neptune
- Custom

The user should also be able to enter a custom gravitational acceleration.

Example:

    Earth:  9.80665 m/s²
    Moon:   ~1.62 m/s²
    Mars:   ~3.71 m/s²

The exact values and conventions should be documented in the application.

---

# Energy

Energy should be calculated and visualized where applicable.

## Kinetic Energy

    E_k = 1/2 mv²

Inputs:

- Mass
- Velocity

---

## Gravitational Potential Energy

    E_p = mgh

Inputs:

- Mass
- Gravitational acceleration
- Height

---

## Mechanical Energy

    E_total = E_k + E_p

For idealized systems without energy loss:

    E_total = constant

The graph should make this conservation of energy visible.

When air resistance is enabled, the application should show that mechanical energy is no longer conserved because energy is transferred into the environment through drag.

---

# Forces

## Gravity

    F_g = mg

Show:

- Gravitational force
- Direction
- Magnitude
- Effect on acceleration

---

## Air Resistance

Air resistance should eventually be supported as an optional model.

The user should be able to enable or disable it.

Parameters may include:

- Air density
- Cross-sectional area
- Drag coefficient
- Object mass
- Object shape
- Velocity

A quadratic drag model can use:

    F_drag = 1/2 ρ C_d A v²

where:

- ρ = air density
- C_d = drag coefficient
- A = cross-sectional area
- v = velocity

The drag force should act opposite to the direction of motion.

---

## Object Shape

Eventually, allow the user to select or define an approximate object shape.

Possible presets:

- Sphere
- Cube
- Cylinder
- Flat plate
- Custom

The shape can be used to determine or suggest an appropriate drag coefficient and cross-sectional area.

Advanced users should be able to manually override the drag coefficient.

---

# Impact

Impact calculations should be treated separately from the motion leading up to the impact.

Impact force cannot be determined from mass and impact velocity alone.

The collision model needs additional information such as:

- Stopping time
- Stopping distance
- Collision surface
- Material properties
- Elasticity / coefficient of restitution

Possible basic models include:

### Momentum-based approximation

    F_avg = Δp / Δt

### Stopping-distance approximation

    F_avg ≈ mv² / (2d)

where:

- m = mass
- v = impact velocity
- d = stopping distance

The application should clearly distinguish between average impact force and peak impact force.

---

# G-Force

Calculate the acceleration experienced by the object in terms of Earth's standard gravitational acceleration.

    G = a / g₀

where:

    g₀ = 9.80665 m/s²

The application should distinguish between:

- Gravitational acceleration
- Acceleration during motion
- G-force during impact

This is important because an object can be in free fall while experiencing approximately 0 g of apparent acceleration despite gravity acting on it.

---

# Visualization

Visualization is one of the core features of Physics Lab.

Graphs should update automatically when input parameters change.

Possible graph types include:

## Motion

- Position vs. time
- Velocity vs. time
- Acceleration vs. time

## Energy

- Kinetic energy vs. time
- Potential energy vs. time
- Total mechanical energy vs. time

## Forces

- Gravity vs. time
- Air resistance vs. time
- Net force vs. time
- Impact force vs. time

## Projectile Motion

- X position vs. Y position
- Horizontal velocity vs. time
- Vertical velocity vs. time
- Velocity magnitude vs. time

---

# Interactive Simulation

Where practical, calculations should be accompanied by an animated visualization.

For example, a projectile simulation could display:

- The object moving through space.
- The trajectory.
- Current position.
- Current velocity vector.
- Current acceleration vector.
- Current kinetic energy.
- Current potential energy.
- Current time.

The user should be able to pause, resume, restart, and potentially scrub through the simulation.

---

# Units

The application should use SI units by default.

Primary units:

- Distance: meters (m)
- Time: seconds (s)
- Velocity: meters per second (m/s)
- Acceleration: meters per second squared (m/s²)
- Mass: kilograms (kg)
- Force: Newtons (N)
- Energy: Joules (J)
- Pressure: Pascals (Pa)

Potential future support:

- km/h
- mph
- ft/s
- feet
- pounds
- pounds-force
- other commonly used units

Unit conversions should be handled separately from the underlying physics calculations.

---

# Pressure

Pressure can be added as a later feature.

Potential calculations include:

    P = F / A

where:

- P = pressure
- F = force
- A = area

This could be useful for impact scenarios where the user specifies a contact area.

Potential future features:

- Impact pressure
- Atmospheric pressure
- Pressure vs. depth
- Pressure from force over an area
- Comparison of different contact areas

---

# Calculation Models

Physics Lab should distinguish between different levels of physical modeling.

## Idealized Model

Use simplified equations and assumptions.

For example:

- Constant gravity
- No air resistance
- Point-like object
- Flat ground
- No wind
- Perfectly known initial conditions

This allows many problems to have simple analytical solutions.

---

## Numerical Model

For more complex systems, use numerical simulation.

Examples:

- Air resistance
- Variable forces
- Complex collisions
- Non-constant acceleration

The simulation should calculate the state of the system over small time steps.

This allows Physics Lab to support systems that cannot easily be solved using a simple closed-form equation.

---

# Analytical vs. Numerical Solutions

Where possible, show the difference between:

1. Analytical solution
2. Numerical simulation

For simple systems, the numerical simulation should be able to reproduce the analytical result closely.

This can be used as both a learning tool and a validation mechanism.

---

# Assumptions and Accuracy

Every calculation should clearly state its assumptions.

For example:

> This calculation assumes constant gravitational acceleration and ignores air resistance.

When a more complex model is enabled, the assumptions should change accordingly.

The application should avoid presenting simplified physics as universally accurate.

---

# Planned Architecture

The application should separate the physics calculations from the user interface.

A rough conceptual architecture:

    UI
     │
     ├── Inputs
     ├── Equations
     ├── Explanations
     ├── Graphs
     └── Animations
          │
          ▼
    Physics Engine
     │
     ├── Motion
     ├── Forces
     ├── Energy
     ├── Gravity
     ├── Drag
     └── Collision
          │
          ▼
    Simulation State

The physics engine should ideally contain pure calculations that can be tested independently from the UI.

This makes it possible to:

- Unit test calculations
- Reuse calculations in different visualizations
- Compare analytical and numerical solutions
- Add new UI features without rewriting the physics
- Add new physics models independently

---

# Development Roadmap

## Phase 1 — Foundation

- [ ] Create web application
- [ ] Establish project structure
- [ ] Establish unit handling
- [ ] Establish physics calculation module
- [ ] Establish testing framework
- [ ] Create reusable input components
- [ ] Create reusable equation display components
- [ ] Create reusable graph components

---

## Phase 2 — Basic Motion

- [ ] Free fall calculation
- [ ] Vertical throw calculation
- [ ] Projectile motion calculation
- [ ] Position calculations
- [ ] Velocity calculations
- [ ] Acceleration calculations
- [ ] Time calculations
- [ ] Basic validation and edge cases

---

## Phase 3 — Equations and Explanations

- [ ] Display equations
- [ ] Explain variables
- [ ] Display units
- [ ] Show substituted values
- [ ] Explain derivatives
- [ ] Explain integrals
- [ ] Show derivation of basic equations
- [ ] Explain assumptions

---

## Phase 4 — Visualization

- [ ] Position/time graphs
- [ ] Velocity/time graphs
- [ ] Acceleration/time graphs
- [ ] Energy graphs
- [ ] Projectile trajectory
- [ ] Interactive parameter changes
- [ ] Animated simulations

---

## Phase 5 — Environment

- [ ] Earth
- [ ] Moon
- [ ] Mars
- [ ] Additional planets
- [ ] Custom gravity
- [ ] Environment-specific parameters

---

## Phase 6 — Energy and Forces

- [ ] Kinetic energy
- [ ] Potential energy
- [ ] Mechanical energy
- [ ] Gravitational force
- [ ] G-force
- [ ] Energy visualization
- [ ] Force visualization

---

## Phase 7 — Impact

- [ ] Impact velocity
- [ ] Stopping distance model
- [ ] Stopping time model
- [ ] Average impact force
- [ ] Contact area
- [ ] Impact pressure
- [ ] Collision assumptions and explanations

---

## Phase 8 — Air Resistance

- [ ] Air resistance toggle
- [ ] Air density
- [ ] Cross-sectional area
- [ ] Drag coefficient
- [ ] Object shape presets
- [ ] Quadratic drag model
- [ ] Numerical integration
- [ ] Terminal velocity
- [ ] Compare vacuum vs. air resistance
- [ ] Energy lost to drag

---

# Future Ideas

These are not part of the initial scope but may be added later.

## Additional Mechanics

- [ ] Friction
- [ ] Springs
- [ ] Hooke's law
- [ ] Harmonic motion
- [ ] Pendulums
- [ ] Circular motion
- [ ] Centripetal force
- [ ] Collisions
- [ ] Elastic and inelastic collisions
- [ ] Momentum
- [ ] Rotational motion
- [ ] Torque
- [ ] Angular momentum

## Additional Physics

- [ ] Buoyancy
- [ ] Fluid pressure
- [ ] Atmospheric pressure
- [ ] Thermodynamics
- [ ] Electricity
- [ ] Magnetism
- [ ] Waves
- [ ] Optics
- [ ] Orbital mechanics

---

# Educational Features

Potential features that could make Physics Lab more useful as a learning tool:

- Step-by-step derivations
- Interactive equations
- Variable highlighting
- Unit explanations
- "Why does this work?" explanations
- Interactive graphs
- Compare two scenarios side-by-side
- Show the effect of changing one variable
- Show ideal vs. realistic models
- Show common mistakes
- Explain assumptions
- Show dimensional analysis
- Display significant figures
- Explain where approximations are being made

---

# Comparison Mode

Allow users to compare two or more simulations.

For example:

    Earth vs. Moon

or:

    Vacuum vs. Air Resistance

or:

    30° vs. 45° vs. 60°

The results could be displayed on the same graphs.

This would make differences between physical models immediately visible.

---

# Advanced Visualization Ideas

Potential future visualizations:

- Animated 2D simulations
- 3D simulations
- Velocity vectors
- Acceleration vectors
- Force vectors
- Energy bars
- Live numerical values
- Interactive graphs
- Timeline scrubbing
- Particle trails
- Vector fields
- Adjustable camera
- Interactive 3D objects

---

# Validation and Testing

Physics calculations should be tested independently from the UI.

Tests should include:

- Known analytical solutions
- Boundary conditions
- Zero initial velocity
- Zero initial height
- Negative initial velocity
- Different gravitational accelerations
- Extreme values
- Unit conversions
- Air resistance disabled
- Air resistance enabled
- Numerical vs. analytical comparisons

For numerical simulations, test that decreasing the timestep converges toward the expected analytical solution where one exists.

---

# Design Principles

Physics Lab should follow these principles:

1. **Understandable**

   Results should be understandable to someone who knows basic physics.

2. **Transparent**

   Do not hide the equations behind a black-box calculator.

3. **Interactive**

   Users should be able to experiment with parameters and immediately see the effects.

4. **Physically Honest**

   Clearly communicate assumptions, approximations, and limitations.

5. **Modular**

   Physics calculations should be separated from visualization and UI code.

6. **Extensible**

   New physics models should be easy to add without rewriting existing functionality.

7. **Testable**

   Physics calculations should be independently testable and validated against known results.

---

# License

This project is licensed under the MIT License.
