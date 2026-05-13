'use client';

/**
 * Live tool-call activity drawer for the desktop agent.
 *
 * Subscribes to events emitted by `installDesktopRuntime()` and renders a
 * floating button (bottom-right) showing the count of recent tool calls.
 * Clicking it opens a drawer with a chronological log.
 *
 * No-op in the browser build.
 */
import { useEffect, useRef, useState } from 'react';
import { isDesktop, getSettings } from '@/lib/desktop/bridge';
import { subscribeToolActivity } from '@/lib/desktop/install';

interface CallRow {
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  durationMs?: number;
  error?: string;
}

export default function ToolActivityDrawer() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CallRow[]>([]);
  const [killEngaged, setKillEngaged] = useState(false);
  const rowsRef = useRef<CallRow[]>([]);
  rowsRef.current = rows;

  useEffect(() => {
    if (!isDesktop()) return;
    setEnabled(true);
    // initial kill switch state
    getSettings()?.get().then((s) => setKillEngaged(s.killSwitch)).catch(() => {});
    const offKs = getSettings()?.onKillSwitchChanged?.((engaged) => setKillEngaged(engaged));

    const off = subscribeToolActivity((ev) => {
      if (ev.kind === 'tool-call') {
        const p = ev.payload as { toolCallId: string; toolName: string; args?: Record<string, unknown> };
        setRows((prev) => [
          { toolCallId: p.toolCallId, toolName: p.toolName, args: p.args, status: 'running', startedAt: Date.now() },
          ...prev,
        ].slice(0, 200));
      } else if (ev.kind === 'tool-result') {
        const p = ev.payload as { toolCallId: string; ok: boolean; durationMs: number; error?: string };
        setRows((prev) =>
          prev.map((r) =>
            r.toolCallId === p.toolCallId
              ? { ...r, status: p.ok ? 'success' : 'error', durationMs: p.durationMs, error: p.error }
              : r,
          ),
        );
      }
    });
    return () => { off?.(); offKs?.(); };
  }, []);

  if (!enabled) return null;

  const recentCount = rows.filter((r) => Date.now() - r.startedAt < 60_000).length;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[10000] flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 shadow-xl hover:bg-neutral-800 transition-colors"
        title="Desktop agent activity"
      >
        <span className={`w-2 h-2 rounded-full ${killEngaged ? 'bg-red-500' : recentCount > 0 ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
        <span>{killEngaged ? 'Kill switch on' : `Agent · ${recentCount}`}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-16 right-4 z-[10000] w-[420px] max-h-[70vh] rounded-lg bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="text-sm font-medium text-neutral-100">Agent activity</div>
            <button onClick={() => setOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-200">Close</button>
          </div>
          {killEngaged && (
            <div className="px-4 py-2 bg-red-950/40 border-b border-red-900 text-xs text-red-300">
              Kill switch engaged — all tools disabled. Unlock in Settings.
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {rows.length === 0 && (
              <div className="px-4 py-6 text-xs text-neutral-500 text-center">No tool calls yet.</div>
            )}
            {rows.map((r) => (
              <div key={r.toolCallId} className="px-4 py-2 border-b border-neutral-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={r.status} />
                    <span className="text-xs font-mono text-neutral-200 truncate">{r.toolName}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0">
                    {r.durationMs !== undefined ? `${r.durationMs} ms` : '…'}
                  </span>
                </div>
                {r.args && Object.keys(r.args).length > 0 && (
                  <pre className="mt-1 text-[10px] text-neutral-500 font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                    {JSON.stringify(r.args, null, 0).slice(0, 240)}
                  </pre>
                )}
                {r.error && (
                  <div className="mt-1 text-[10px] text-red-400">{r.error}</div>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-neutral-800 flex justify-between items-center bg-neutral-950">
            <a href="/settings/desktop" className="text-xs text-neutral-400 hover:text-neutral-200">Settings →</a>
            <button
              onClick={() => setRows([])}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StatusDot({ status }: { status: CallRow['status'] }) {
  const color =
    status === 'running' ? 'bg-amber-400 animate-pulse' : status === 'success' ? 'bg-emerald-400' : 'bg-red-500';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
