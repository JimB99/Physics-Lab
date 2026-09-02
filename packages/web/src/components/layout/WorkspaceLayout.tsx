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
    <div className="workspace">
      <h1 className="workspace__title">{title}</h1>
      <div className="workspace-grid">
        <aside className="card workspace-panel workspace-panel--inputs">{inputs}</aside>
        <section className="card workspace-panel workspace-panel--sim">{simulation}</section>
        <aside className="card workspace-panel workspace-panel--results">{results}</aside>
      </div>
      <div className="card workspace-tabs">{tabs}</div>
    </div>
  );
}
