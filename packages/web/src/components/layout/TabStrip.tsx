import { useRef } from 'react';

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
}

interface TabStripProps<T extends string> {
  tabs: TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}

export function TabStrip<T extends string>({ tabs, active, onChange, ariaLabel }: TabStripProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const move = (delta: number) => {
    const index = tabs.findIndex((t) => t.id === active);
    if (index === -1) return;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    const next = tabs[nextIndex]!;
    onChange(next.id);
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)?.focus();
  };

  return (
    <div ref={containerRef} className="tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab"
          data-tab-id={tab.id}
          aria-selected={tab.id === active}
          tabIndex={tab.id === active ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              move(1);
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
