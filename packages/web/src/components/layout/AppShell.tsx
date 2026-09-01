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
