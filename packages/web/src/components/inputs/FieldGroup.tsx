import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface FieldGroupProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FieldGroup({ title, defaultOpen = false, children }: FieldGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div className="field-group">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? '▼' : '▶'} {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
