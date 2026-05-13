'use client';

/**
 * Drop-in nav item that shows up in the main sidebar only when running
 * inside the Electron desktop app. Web users don't see it.
 */
import { useEffect, useState } from 'react';
import { isDesktop } from '@/lib/desktop/bridge';

export default function YangAutopilotNavLink({ className }: { className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(isDesktop()); }, []);
  if (!show) return null;
  return (
    <a href="/yang" className={className || 'block px-3 py-2 text-sm text-neutral-200 rounded-md hover:bg-neutral-800'}>
      <span className="inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        YANG Autopilot
      </span>
    </a>
  );
}
