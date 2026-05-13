'use client';

/**
 * YANG Autopilot landing page.
 *
 * Two modes:
 *   • Desktop (Electron) → full goals dock + feature index (the working tool).
 *   • Web                → sleek marketing landing page that pitches the
 *                          autonomous-agent capabilities and points the user
 *                          to the desktop installer.
 */
import { useEffect, useState } from 'react';
import GoalsDock from '@/components/yang/GoalsDock';
import { isDesktop } from '@/lib/desktop/bridge';

const DESKTOP_INSTALLER_URL =
  'https://github.com/sohaibali73/AnalystDevelopmentFrontEnd/releases/download/DESKTOP/Potomac.Analyst.Workbench.Setup.0.1.0.exe';

export default function YangAutopilotPage() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => { setDesktop(isDesktop()); }, []);

  if (desktop === null) return null;
  if (desktop === false) return <WebLanding />;

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

// ─── Web marketing landing page ──────────────────────────────────────────

function WebLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Animated background */}
      <BackgroundLayer />

      <main className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            YANG Autopilot
          </div>

          <h1 className="mt-7 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
            Hand it the wheel.
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              Your AI takes over from here.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
            YANG Autopilot is the autonomous-agent layer for Potomac Analyst Workbench. Set a goal — research a market,
            scrape a dataset, prepare a briefing — and walk away. It plans, opens the browser, takes notes, writes the
            report, and tells you when it&apos;s done.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={DESKTOP_INSTALLER_URL}
              className="group relative inline-flex items-center gap-2 rounded-md bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-6 py-3 text-sm shadow-[0_8px_30px_-8px_rgba(251,191,36,0.6)] transition-all"
            >
              <DownloadIcon className="h-4 w-4" />
              Download Now
              <span className="text-[10px] font-medium text-neutral-900/70">Windows · 95 MB</span>
            </a>
            <a
              href="/download"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-700 hover:border-neutral-500 bg-neutral-900/50 px-5 py-3 text-sm text-neutral-200 hover:text-white transition-colors"
            >
              All platforms & details
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="mt-4 text-[11px] text-neutral-500">Free during preview · macOS &amp; Linux coming soon</p>
        </div>

        {/* ─── Capabilities ─────────────────────────────────────────── */}
        <SectionTitle eyebrow="Capabilities" title="A real cockpit, not just a chatbot." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            title="Background Computer Use"
            body="Drives Chromium, Notepad, Excel, or any Windows app via a separate window with its own cursor — your real mouse never moves. Take screenshots, click, type, scroll, evaluate JS."
          />
          <FeatureCard
            title="Autonomous Goals"
            body="Type /goal in any chat. Plans, executes, self-corrects across 30+ iterations. Persists every step to the database; survives restarts."
          />
          <FeatureCard
            title="Live Co-Pilot Streaming"
            body="Watch the agent reason in real time over a single SSE stream. Pause, resume, or cancel any goal from the dock at any moment."
          />
          <FeatureCard
            title="Persistent Memory"
            body="Voyage-2 embedded long-term memory. The agent remembers your preferences, recurring facts, and tool recipes — surfaced as system context on every turn."
          />
          <FeatureCard
            title="Cron-Style Schedules"
            body="Run goals on a recurring cadence. Daily market briefings, weekly compliance scans, end-of-month reports — fire and forget."
          />
          <FeatureCard
            title="Terminals & PTYs"
            body="Multi-tab xterm.js terminals backed by real node-pty sessions. The agent can run shell commands, build pipelines, or inspect logs."
          />
          <FeatureCard
            title="GitHub Integration"
            body="Browse pull requests, request changes, leave review comments via the gh CLI. Code review on autopilot."
          />
          <FeatureCard
            title="SSH Manager"
            body="Encrypted SSH profiles (Electron safeStorage). The agent can ssh_exec on your fleet to gather metrics, run diagnostics, or deploy."
          />
          <FeatureCard
            title="MCP Server Host"
            body="Plug in any Model Context Protocol server (stdio or HTTP). User-installed MCP tools are automatically discovered and surfaced to the agent."
          />
        </div>

        {/* ─── How it works ─────────────────────────────────────────── */}
        <SectionTitle eyebrow="Workflow" title="From prompt to deliverable, hands-free." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-0">
          <StepCard idx={1} title="Set the goal" body="Type /goal in chat or fill the dock form. Describe the outcome." />
          <StepCard idx={2} title="It plans" body="The agent writes a 6-bullet plan and saves it. You see it stream live." />
          <StepCard idx={3} title="It executes" body="Opens the browser, navigates, fills forms, takes screenshots, reads, writes." />
          <StepCard idx={4} title="It delivers" body="A finished deliverable — markdown report, Excel, notes on disk — and a summary in chat." />
        </div>

        {/* ─── Safety ───────────────────────────────────────────────── */}
        <SectionTitle eyebrow="Safety" title="Built for analysts who can&apos;t afford mistakes." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Workspace Allowlist"
            body="Filesystem access is sandboxed to ~/PotomacWorkspace by default. Anything outside requires a one-click consent dialog."
          />
          <FeatureCard
            title="Kill Switch"
            body="Ctrl+Shift+Esc anywhere on your system instantly stops every tool, terminates running processes, and locks the agent until you enter your passcode."
          />
          <FeatureCard
            title="Full Audit Log"
            body="Every tool call — what, when, who approved it — is appended to a tamper-evident JSONL audit log in your user data folder."
          />
        </div>

        {/* ─── Final CTA ────────────────────────────────────────────── */}
        <div className="relative mt-28 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-neutral-950 to-indigo-500/5 p-10 md:p-14">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Stop watching, start delegating</div>
              <h3 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                Your next report writes itself.
              </h3>
              <p className="mt-3 text-sm text-neutral-400 max-w-xl">
                Install the desktop app, sign in with your existing Potomac account, and dictate a goal in plain English.
                That&apos;s it.
              </p>
            </div>
            <a
              href={DESKTOP_INSTALLER_URL}
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-6 py-3 text-sm shadow-[0_8px_30px_-8px_rgba(251,191,36,0.6)] transition-all shrink-0"
            >
              <DownloadIcon className="h-4 w-4" />
              Download Now
            </a>
          </div>
        </div>

        {/* ─── Footer ───────────────────────────────────────────────── */}
        <footer className="mt-20 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div>© {new Date().getFullYear()} Potomac · YANG Autopilot v0.1.0 preview</div>
          <div className="flex items-center gap-5">
            <a href="/download" className="hover:text-neutral-300">Download</a>
            <a href="/privacy" className="hover:text-neutral-300">Privacy</a>
            <a href="/terms" className="hover:text-neutral-300">Terms</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function BackgroundLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* Amber blob top-left */}
      <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-amber-500/15 blur-[140px]" />
      {/* Indigo blob bottom-right */}
      <div className="absolute top-[40%] -right-40 h-[36rem] w-[36rem] rounded-full bg-indigo-500/10 blur-[140px]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950" />
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  className = '',
}: {
  eyebrow: string;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-amber-300/80">{eyebrow}</div>
      <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight max-w-3xl">{title}</h2>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="group relative rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-sm p-5 hover:border-amber-500/30 hover:bg-neutral-900/60 transition-all">
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            'radial-gradient(400px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(251,191,36,0.08), transparent 40%)',
        }}
      />
      <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({ idx, title, body }: { idx: number; title: string; body: string }) {
  return (
    <div className="relative md:px-5 first:md:pl-0 last:md:pr-0">
      {idx > 1 && <div className="hidden md:block absolute left-0 top-7 h-px w-5 bg-neutral-800" />}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-300/80">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 font-semibold text-[10px]">
            {idx}
          </span>
          Step {idx}
        </div>
        <h4 className="mt-3 text-sm font-semibold">{title}</h4>
        <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
