import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { MotionHubPage } from './pages/MotionHubPage';
import { FreeFallPage } from './pages/FreeFallPage';
import { VerticalThrowPage } from './pages/VerticalThrowPage';
import { ProjectilePage } from './pages/ProjectilePage';
import { ComparePage } from './pages/ComparePage';
import { NotFoundPage } from './pages/NotFoundPage';

const SolarSystemHubPage = lazy(() =>
  import('./pages/SolarSystemHubPage').then((m) => ({ default: m.SolarSystemHubPage })),
);
const PlanetCalendarPage = lazy(() =>
  import('./pages/PlanetCalendarPage').then((m) => ({ default: m.PlanetCalendarPage })),
);
const MoonPhasesPage = lazy(() =>
  import('./pages/MoonPhasesPage').then((m) => ({ default: m.MoonPhasesPage })),
);

function SolarSystemFallback() {
  return (
    <div style={{ padding: '2rem 1.5rem' }} className="muted">
      Loading solar system module…
    </div>
  );
}

function lazySolar(element: ReactNode) {
  return <Suspense fallback={<SolarSystemFallback />}>{element}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'motion', element: <MotionHubPage /> },
      { path: 'motion/free-fall', element: <FreeFallPage /> },
      { path: 'motion/vertical-throw', element: <VerticalThrowPage /> },
      { path: 'motion/projectile', element: <ProjectilePage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'solar-system', element: lazySolar(<SolarSystemHubPage />) },
      { path: 'solar-system/planet-calendar', element: lazySolar(<PlanetCalendarPage />) },
      { path: 'solar-system/moon-phases', element: lazySolar(<MoonPhasesPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
