'use client';

/**
 * Lightweight skills cache-busting store.
 * Components that list skills subscribe to `useSkillsVersion()` and refetch
 * whenever `bumpSkillsVersion()` is called (after upload / edit / delete).
 */

import { useEffect, useState } from 'react';

let version = 0;
const listeners = new Set<(v: number) => void>();

export function bumpSkillsVersion(): void {
  version += 1;
  listeners.forEach((fn) => fn(version));
}

export function useSkillsVersion(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const fn = (next: number) => setV(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return v;
}
