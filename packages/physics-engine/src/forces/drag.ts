export function dragForceQuadratic(rho: number, cd: number, area: number, speed: number): number {
  return 0.5 * rho * cd * area * speed * speed;
}

export function terminalVelocity(
  mass: number,
  g: number,
  rho: number,
  cd: number,
  area: number,
): number {
  if (rho <= 0 || cd <= 0 || area <= 0) return Infinity;
  return Math.sqrt((2 * mass * g) / (rho * cd * area));
}
