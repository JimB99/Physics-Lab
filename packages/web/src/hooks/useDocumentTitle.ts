import { useEffect } from 'react';

const SUFFIX = 'Physics Lab';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === SUFFIX ? SUFFIX : `${title} · ${SUFFIX}`;
    return () => {
      document.title = SUFFIX;
    };
  }, [title]);
}
