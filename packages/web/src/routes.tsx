import type { RouteObject } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { MotionHubPage } from './pages/MotionHubPage';
import { FreeFallPage } from './pages/FreeFallPage';
import { VerticalThrowPage } from './pages/VerticalThrowPage';
import { ProjectilePage } from './pages/ProjectilePage';

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
    ],
  },
];
