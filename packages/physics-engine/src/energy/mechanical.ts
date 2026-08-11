export function kineticEnergy(mass: number, speed: number): number {
  return 0.5 * mass * speed * speed;
}

export function potentialEnergy(mass: number, g: number, height: number): number {
  return mass * g * height;
}

export function totalMechanicalEnergy(kinetic: number, potential: number): number {
  return kinetic + potential;
}
