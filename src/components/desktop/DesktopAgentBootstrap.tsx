'use client';

/**
 * Client-only component that installs the desktop agent runtime once on mount.
 * Mounted from the protected app shell. No visual output.
 *
 * In a browser (non-Electron) build this is a no-op.
 */
import { useEffect } from 'react';
import { isDesktop } from '@/lib/desktop/bridge';
import { installDesktopRuntime } from '@/lib/desktop/install';

export default function DesktopAgentBootstrap(): null {
  useEffect(() => {
    if (!isDesktop()) return;
    installDesktopRuntime();
  }, []);
  return null;
}
