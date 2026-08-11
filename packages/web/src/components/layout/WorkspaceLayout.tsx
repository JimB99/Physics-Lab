import type { ReactNode } from 'react';

interface WorkspaceLayoutProps {
  title: string;
  inputs: ReactNode;
  simulation: ReactNode;
  results: ReactNode;
  tabs: ReactNode;
}

export function WorkspaceLayout({ title, inputs, simulation, results, tabs }: WorkspaceLayoutProps) {
  return (
    <div style={{ padding: '1rem 1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>{title}</h1>
      <div
        className="workspace-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) 1fr minmax(200px, 260px)',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        <aside className="card" style={{ position: 'sticky', top: '1rem' }}>
          {inputs}
        </aside>
        <section className="card" style={{ minHeight: 280 }}>
          {simulation}
        </section>
        <aside className="card">{results}</aside>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        {tabs}
      </div>
    </div>
  );
}
