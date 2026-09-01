import { useEffect, useRef } from 'react';

export interface ShortcutMap {
  [key: string]: (event: KeyboardEvent) => void;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const handler = shortcutsRef.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
