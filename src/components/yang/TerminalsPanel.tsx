'use client';

/**
 * Multi-tab terminal panel — xterm.js front-end, node-pty back-end via
 * `window.potomacTools.terminal_*`. Each tab is a live PTY.
 */
import { useEffect, useRef, useState } from 'react';
import { isDesktop, getTools } from '@/lib/desktop/bridge';

interface TabState {
  id: string;
  label: string;
  cwd?: string;
  shell?: string;
  unread?: boolean;
}

interface XtermHandle {
  term: unknown;
  fit: () => void;
  offData: () => void;
  offExit: () => void;
}

export default function TerminalsPanel() {
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const handleRefs = useRef<Map<string, XtermHandle>>(new Map());

  // Open initial tab once on mount in Electron.
  useEffect(() => {
    if (!isDesktop()) return;
    void openTab();
    return () => {
      // Best-effort cleanup of all open PTYs on unmount.
      for (const t of tabs) void getTools()?.terminal_close(t.id);
      for (const h of handleRefs.current.values()) { try { h.offData(); h.offExit(); } catch { /* ignore */ } }
      handleRefs.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openTab() {
    const r = await getTools()!.terminal_open();
    if (!r.ok || !r.result) return;
    const id = r.result.handleId as string;
    const tab: TabState = { id, label: r.result.shell?.split(/[\\/]/).pop() || 'shell', cwd: r.result.cwd, shell: r.result.shell };
    setTabs((prev) => [...prev, tab]);
    setActiveId(id);
    // Mount xterm in the next tick once the container exists.
    setTimeout(() => attachXterm(id), 0);
  }

  async function attachXterm(id: string) {
    const el = containerRefs.current.get(id);
    if (!el) { setTimeout(() => attachXterm(id), 50); return; }
    const { Terminal } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');
    const term = new Terminal({
      fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
      fontSize: 13,
      theme: { background: '#0a0a0a', foreground: '#e5e5e5', cursor: '#e5e5e5' },
      convertEol: true,
      cursorBlink: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();

    const T = getTools()!;
    term.onData((data: string) => T.terminal_write(id, data));

    const offData = T.onTerminalOut(id, (data: string) => {
      term.write(data);
      // mark tab unread if not active
      setTabs((prev) => prev.map((p) => (p.id === id && p.id !== activeId ? { ...p, unread: true } : p)));
    });
    const offExit = T.onTerminalExit(id, ({ exitCode }: { exitCode: number | null }) => {
      term.writeln(`\r\n\x1b[2m[process exited with code ${exitCode ?? 0}]\x1b[0m`);
    });

    handleRefs.current.set(id, { term, fit: () => fit.fit(), offData, offExit });

    // Re-fit on window resize.
    const ro = new ResizeObserver(() => {
      try { fit.fit(); T.terminal_resize(id, term.cols, term.rows); } catch { /* ignore */ }
    });
    ro.observe(el);
  }

  async function closeTab(id: string) {
    const h = handleRefs.current.get(id);
    if (h) { try { h.offData(); h.offExit(); (h.term as { dispose?: () => void }).dispose?.(); } catch { /* ignore */ } }
    handleRefs.current.delete(id);
    await getTools()?.terminal_close(id);
    setTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveId((prev) => (prev === id ? (tabs[0]?.id || null) : prev));
  }

  function selectTab(id: string) {
    setActiveId(id);
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
    setTimeout(() => handleRefs.current.get(id)?.fit(), 0);
  }

  if (!isDesktop()) {
    return <div className="p-6 text-sm text-neutral-500">Terminals are only available in the Potomac desktop app.</div>;
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      {/* xterm CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css" />
      <header className="flex items-center border-b border-neutral-800 bg-neutral-950 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-xs border-r border-neutral-900 ${tab.id === activeId ? 'bg-neutral-900 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tab.unread ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
            <span className="font-mono">{tab.label}</span>
            <button onClick={(e) => { e.stopPropagation(); void closeTab(tab.id); }} className="text-neutral-500 hover:text-red-400 ml-1" title="Close">×</button>
          </div>
        ))}
        <button onClick={() => void openTab()} className="px-3 py-2 text-xs text-neutral-300 hover:text-white" title="New terminal">+</button>
      </header>
      <div className="flex-1 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => { if (el) containerRefs.current.set(tab.id, el); }}
            className="absolute inset-0 p-2"
            style={{ display: tab.id === activeId ? 'block' : 'none' }}
          />
        ))}
        {tabs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">No terminals open.</div>
        )}
      </div>
    </div>
  );
}
