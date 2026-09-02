import {
  PROJECTILE_DEFAULT_MODES,
  PROJECTILE_FIELD_IDS,
  VERTICAL_DEFAULT_MODES,
  VERTICAL_FIELD_IDS,
  withExplicitModes,
} from './fieldModes';

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  /** Query string without the leading '?'. */
  query: string;
}

function verticalQuery(query: string): string {
  return withExplicitModes(query, VERTICAL_FIELD_IDS, VERTICAL_DEFAULT_MODES);
}

function projectileQuery(query: string): string {
  return withExplicitModes(query, PROJECTILE_FIELD_IDS, PROJECTILE_DEFAULT_MODES);
}

export const FREE_FALL_PRESETS: ScenarioPreset[] = [
  {
    id: 'eiffel',
    label: 'Drop from the Eiffel Tower',
    description: '330 m on Earth, no air resistance. Solve impact time and speed.',
    query: verticalQuery(
      'planet=earth&mass=1&h0=330&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
    ),
  },
  {
    id: 'eiffelDrag',
    label: 'Eiffel Tower, with air',
    description: 'The same 330 m drop for a 1 kg, 0.01 m² sphere in sea-level air.',
    query: verticalQuery(
      'planet=earth&mass=1&h0=330&h0_mode=given&v0=0&v0_mode=given&drag=1&atmosphere=earthSeaLevel&shape=sphere&cd=0.47&area=0.01',
    ),
  },
  {
    id: 'moonHammer',
    label: 'Apollo 15 hammer drop',
    description: 'A 1.32 m drop on the Moon, where a hammer and a feather land together.',
    query: verticalQuery(
      'planet=moon&mass=1.32&h0=1.32&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
    ),
  },
  {
    id: 'jupiterDrop',
    label: '100 m on Jupiter',
    description: 'Same height, 2.5× Earth gravity.',
    query: verticalQuery(
      'planet=jupiter&mass=1&h0=100&h0_mode=given&v0=0&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
    ),
  },
  {
    id: 'skydiver',
    label: 'Skydiver terminal velocity',
    description: '80 kg from 4000 m with a 0.7 m² frontal area; watch v approach its asymptote.',
    query: verticalQuery(
      'planet=earth&mass=80&h0=4000&h0_mode=given&v0=0&v0_mode=given&drag=1&atmosphere=earthSeaLevel&shape=cylinder&cd=0.82&area=0.7',
    ),
  },
];

export const VERTICAL_THROW_PRESETS: ScenarioPreset[] = [
  {
    id: 'throwUp',
    label: 'Throw 20 m/s upward',
    description: 'From 1.8 m, solve apex height and total flight time.',
    query: verticalQuery(
      'planet=earth&mass=1&h0=1.8&h0_mode=given&v0=20&v0_mode=given&maxHeight_mode=solve&timeToMaxHeight_mode=solve&impactTime_mode=solve&drag=0',
    ),
  },
  {
    id: 'throwDown',
    label: 'Throw 12 m/s downward',
    description: 'From 20 m, thrown toward the ground. Solve impact time and speed.',
    query: verticalQuery(
      'planet=earth&mass=1&h0=20&h0_mode=given&v0=-12&v0_mode=given&impactTime_mode=solve&impactVelocity_mode=solve&drag=0',
    ),
  },
];

export const VERTICAL_PRESETS: ScenarioPreset[] = [...FREE_FALL_PRESETS, ...VERTICAL_THROW_PRESETS];

export const PROJECTILE_PRESETS: ScenarioPreset[] = [
  {
    id: 'maxRange45',
    label: '45° maximum range',
    description: '20 m/s from ground level — the classic optimum on flat ground.',
    query: projectileQuery(
      'planet=earth&mass=1&h0=0&h0_mode=given&v0=20&v0_mode=given&angle=45&angle_mode=given&range_mode=solve&flightTime_mode=solve&drag=0',
    ),
  },
  {
    id: 'cannonball',
    label: 'Cannonball with air resistance',
    description: '5 kg iron ball, 150 m/s at 35°, with sea-level drag.',
    query: projectileQuery(
      'planet=earth&mass=5&h0=2&h0_mode=given&v0=150&v0_mode=given&angle=35&angle_mode=given&drag=1&atmosphere=earthSeaLevel&shape=sphere&cd=0.47&area=0.0079',
    ),
  },
  {
    id: 'solveAngle',
    label: 'What angle reaches 50 m?',
    description: 'Given 25 m/s and a 50 m target, solve for the launch angle.',
    query: projectileQuery(
      'planet=earth&mass=1&h0=0&h0_mode=given&v0=25&v0_mode=given&range=50&range_mode=given&angle_mode=solve&drag=0',
    ),
  },
  {
    id: 'marsGolf',
    label: 'Golf drive on Mars',
    description: '70 m/s at 12° in Mars gravity and its thin atmosphere.',
    query: projectileQuery(
      'planet=mars&mass=0.046&h0=0&h0_mode=given&v0=70&v0_mode=given&angle=12&angle_mode=given&drag=1&atmosphere=marsThin&shape=sphere&cd=0.47&area=0.00143',
    ),
  },
];
