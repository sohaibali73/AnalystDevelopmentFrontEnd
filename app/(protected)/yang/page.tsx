'use client';

/**
 * YANG Autopilot landing page — dock of goals + intro.
 * Desktop-only feature; in the web build we show a "use desktop app" prompt.
 */
import { useEffect, useState } from 'react';
import GoalsDock from '@/components/yang/GoalsDock';
import { isDesktop } from '@/lib/desktop/bridge';

export default function YangAutopilotPage() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => { setDesktop(isDesktop()); }, []);

  if (desktop === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-neutral-300">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">YANG Autopilot</h1>
          <p className="text-sm text-neutral-400">YANG runs autonomous, long-running tasks on your computer (filesystem, shell, background browser, native apps). It requires the Potomac desktop app.</p>
        </div>
      </div>
    );
  }
  if (desktop === null) return null;

  return (
    <div className="h-[calc(100vh-0px)] flex">
      <GoalsDock />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8 text-neutral-200 space-y-6">
          <header>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">YANG Autopilot</div>
            <h1 className="text-2xl font-semibold mt-1">Long-running, autonomous goals</h1>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Pick a goal in the left dock, or start a new one. YANG plans, executes, and self-corrects in the background.
              You can use the rest of the app while it runs.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3">
            <a href="/yang/memory" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">Memory</div>
              <div className="text-xs text-neutral-500 mt-1">Long-term preferences & facts the AI remembers.</div>
            </a>
            <a href="/yang/schedules" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">Schedules</div>
              <div className="text-xs text-neutral-500 mt-1">Cron-style recurring goals (e.g. daily briefings).</div>
            </a>
            <a href="/yang/terminals" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">Terminals</div>
              <div className="text-xs text-neutral-500 mt-1">Multi-tab xterm.js sessions backed by real PTYs.</div>
            </a>
            <a href="/yang/github" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">GitHub</div>
              <div className="text-xs text-neutral-500 mt-1">Browse PRs, leave reviews via the gh CLI.</div>
            </a>
            <a href="/yang/ssh" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">SSH</div>
              <div className="text-xs text-neutral-500 mt-1">Encrypted profiles + AI-callable ssh_exec.</div>
            </a>
            <a href="/yang/mcp" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">MCP Servers</div>
              <div className="text-xs text-neutral-500 mt-1">Plug in Model Context Protocol servers.</div>
            </a>
            <a href="/yang/tester" className="block rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4 hover:bg-emerald-950/20 transition-colors">
              <div className="text-sm font-medium text-emerald-300">Computer-Use Tester</div>
              <div className="text-xs text-neutral-400 mt-1">Open apps & control mouse/keyboard manually (no AI required).</div>
            </a>
            <a href="/settings/desktop" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">Desktop Settings</div>
              <div className="text-xs text-neutral-500 mt-1">Workspace, allowlist, kill switch, audit log.</div>
            </a>
          </div>

          <div className="rounded-lg border border-neutral-800 p-4 bg-neutral-950 text-xs text-neutral-400 space-y-1">
            <div>Tip: in any chat, type <code className="text-neutral-200">/goal &lt;task&gt;</code> to start a goal,</div>
            <div><code className="text-neutral-200">/remember &lt;text&gt;</code> to save a memory, or</div>
            <div><code className="text-neutral-200">/schedule daily 8am &lt;task&gt;</code> to create a recurring run.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
