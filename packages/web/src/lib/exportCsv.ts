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
