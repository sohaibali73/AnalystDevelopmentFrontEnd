'use client';

/**
 * YANG Autopilot landing page.
 *
 * Two modes:
 *   • Desktop (Electron) → full goals dock + feature index (the working tool).
 *   • Web                → sleek marketing landing page that pitches YANG's
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
              <div className="text-xs text-neutral-500 mt-1">Long-term preferences &amp; facts YANG remembers.</div>
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
              <div className="text-xs text-neutral-500 mt-1">Encrypted profiles + ssh_exec for YANG.</div>
            </a>
            <a href="/yang/mcp" className="block rounded-lg border border-neutral-800 p-4 hover:bg-neutral-900 transition-colors">
              <div className="text-sm font-medium">MCP Servers</div>
              <div className="text-xs text-neutral-500 mt-1">Plug in Model Context Protocol servers.</div>
            </a>
            <a href="/yang/tester" className="block rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4 hover:bg-emerald-950/20 transition-colors">
              <div className="text-sm font-medium text-emerald-300">Computer-Use Tester</div>
              <div className="text-xs text-neutral-400 mt-1">Open apps &amp; control mouse/keyboard manually (no YANG required).</div>
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
      <BackgroundLayer />

      {/* Top nav */}
      <nav className="relative max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 text-xs tracking-[0.18em] uppercase text-neutral-400 hover:text-neutral-100 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Potomac
        </a>
        <a
          href={DESKTOP_INSTALLER_URL}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-amber-400/95 hover:bg-amber-300 text-neutral-950 font-semibold px-3.5 py-1.5 text-xs transition-colors"
        >
          <DownloadIcon className="h-3 w-3" />
          Download
        </a>
      </nav>

      <main className="relative max-w-6xl mx-auto px-6 pt-10 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <YangLogo className="h-20 w-20 md:h-24 md:w-24" />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            YANG Autopilot
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
            Set the destination.
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              YANG flies the rest.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
            YANG is the autonomous autopilot inside Potomac Analyst Workbench. Hand it a goal — research a market,
            rebalance a portfolio, draft your morning emails — and walk away. It plans, drives the browser, opens your
            tools, takes notes, writes the report, and pings you when it&apos;s done.
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
              All platforms &amp; details
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="mt-4 text-[11px] text-neutral-500">Free during preview · macOS &amp; Linux coming soon</p>
        </div>

        {/* ─── What it does (3 headline icons) ───────────────────────── */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          <HeadlineCard
            icon={<TargetIcon className="h-7 w-7" />}
            title="Set a goal."
            body="Plain English in chat or the goals dock. YANG writes a plan before touching anything, so you see what it&rsquo;s about to do."
          />
          <HeadlineCard
            icon={<WorkflowIcon className="h-7 w-7" />}
            title="Walk away."
            body="YANG opens browsers, fills forms, runs spreadsheets, takes screenshots, self-corrects. It runs for as long as the work takes."
          />
          <HeadlineCard
            icon={<InboxCheckIcon className="h-7 w-7" />}
            title="Come back to it all done."
            body="A finished report on disk, replies drafted in your inbox, an updated model, a fresh dataset. YANG pings you when ready."
          />
        </div>

        {/* ─── Use cases for the desk ──────────────────────────────── */}
        <SectionTitle eyebrow="On your desk" title="Work that used to take a Friday afternoon." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UseCaseCard
            icon={<ChartIcon className="h-6 w-6" />}
            title="Drive AmiBroker without lifting a finger"
            body="YANG opens AmiBroker, loads the right database, runs your back-tests across the stack, screenshots equity curves, and writes a one-page memo summarising drawdowns, Sharpe deltas, and parameter sensitivity."
          />
          <UseCaseCard
            icon={<CalendarRefreshIcon className="h-6 w-6" />}
            title="Pull year-end data, refresh every model"
            body="Once December prints close, YANG fetches updated returns, rolls vendor exports into the workbook, recomputes risk metrics, and flags any series that look off versus the prior year."
          />
          <UseCaseCard
            icon={<ScaleIcon className="h-6 w-6" />}
            title="Rebalance and stage the tickets"
            body="Drift report, target-weight diff, trade list, FIX-ready ticket file. YANG produces the paperwork to your model — you click send."
          />
          <UseCaseCard
            icon={<MailIcon className="h-6 w-6" />}
            title="Reply to client emails in your voice"
            body="YANG reads the inbox, drafts a response per message in your usual style, attaches the right quarterly fact-sheet, and queues each reply in Drafts for a one-click send."
          />
          <UseCaseCard
            icon={<BriefcaseIcon className="h-6 w-6" />}
            title="Morning briefing on autopilot"
            body="Every weekday at 7:30 a.m., YANG pulls overnight moves on your watchlist, scans news for material headlines, and drops a structured briefing in your workspace before you sit down."
          />
          <UseCaseCard
            icon={<DatabaseIcon className="h-6 w-6" />}
            title="Reconcile, cleanse, and version-stamp datasets"
            body="YANG opens the source files, diffs against last week&rsquo;s vintage, fixes the obvious cleanup work, writes a changelog, and archives a stamped copy to your shared drive."
          />
          <UseCaseCard
            icon={<DocumentIcon className="h-6 w-6" />}
            title="Generate the IC deck from a single prompt"
            body="Cover slide to appendix, sourced charts, footnoted prose. YANG drives PowerPoint or Word directly using its computer-use tools — formatted to your template."
          />
          <UseCaseCard
            icon={<SearchIcon className="h-6 w-6" />}
            title="Deep-research a fund, manager, or asset class"
            body="YANG opens a background browser, hits 10–20 sources, takes structured notes, cross-references with your knowledge base, and produces a 2-page write-up with full citations."
          />
          <UseCaseCard
            icon={<TerminalIcon className="h-6 w-6" />}
            title="Run the end-of-quarter pipeline"
            body="From batch ingest to risk run to deck output, YANG executes the multi-step pipeline in a real terminal, watches for errors, and only escalates to you when something actually breaks."
          />
        </div>

        {/* ─── Capabilities ─────────────────────────────────────────── */}
        <SectionTitle eyebrow="Capabilities" title="A real cockpit, not just a chat window." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<MonitorIcon className="h-5 w-5" />}
            title="Background Computer Use"
            body="YANG drives Chromium, AmiBroker, Excel, Notepad, or any Windows app via its own window with its own cursor — your real mouse never moves."
          />
          <FeatureCard
            icon={<TargetIcon className="h-5 w-5" />}
            title="Autonomous Goals"
            body="Type /goal in any chat. YANG plans, executes, self-corrects across 30+ iterations. Every step persists to the database; survives app restarts."
          />
          <FeatureCard
            icon={<BroadcastIcon className="h-5 w-5" />}
            title="Live Co-Pilot Streaming"
            body="Watch YANG reason in real time over a single SSE stream. Pause, resume, or cancel any goal from the dock at any moment."
          />
          <FeatureCard
            icon={<BrainIcon className="h-5 w-5" />}
            title="Persistent Memory"
            body="Voyage-2 embedded long-term memory. YANG remembers your preferences, recurring facts, and tool recipes — surfaced as context on every turn."
          />
          <FeatureCard
            icon={<ClockIcon className="h-5 w-5" />}
            title="Cron-Style Schedules"
            body="Run goals on a recurring cadence. Daily briefings, weekly compliance scans, end-of-month reports — fire and forget."
          />
          <FeatureCard
            icon={<TerminalIcon className="h-5 w-5" />}
            title="Terminals &amp; PTYs"
            body="Multi-tab xterm.js terminals backed by real node-pty sessions. YANG can run shell commands, build pipelines, or inspect logs."
          />
          <FeatureCard
            icon={<GitIcon className="h-5 w-5" />}
            title="GitHub Integration"
            body="Browse pull requests, request changes, leave review comments via the gh CLI. Code review on autopilot."
          />
          <FeatureCard
            icon={<KeyIcon className="h-5 w-5" />}
            title="SSH Manager"
            body="Encrypted SSH profiles (Electron safeStorage). YANG can ssh_exec on your fleet to gather metrics, run diagnostics, or deploy."
          />
          <FeatureCard
            icon={<PluginIcon className="h-5 w-5" />}
            title="MCP Server Host"
            body="Plug in any Model Context Protocol server (stdio or HTTP). User-installed MCP tools are automatically discovered and surfaced to YANG."
          />
        </div>

        {/* ─── How it works ─────────────────────────────────────────── */}
        <SectionTitle eyebrow="Workflow" title="From prompt to deliverable, hands-free." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-0">
          <StepCard idx={1} title="Set the goal" body="Type /goal in chat or fill the dock form. Describe the outcome." />
          <StepCard idx={2} title="YANG plans" body="It writes a 6-bullet plan and saves it. You see it stream live." />
          <StepCard idx={3} title="YANG executes" body="Opens the browser, navigates, fills forms, takes screenshots, reads, writes." />
          <StepCard idx={4} title="It delivers" body="A finished deliverable — markdown report, Excel, notes on disk — and a summary in chat." />
        </div>

        {/* ─── Safety ───────────────────────────────────────────────── */}
        <SectionTitle eyebrow="Safety" title="Built for analysts who can&rsquo;t afford mistakes." className="mt-28" />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<LockIcon className="h-5 w-5" />}
            title="Workspace Allowlist"
            body="Filesystem access is sandboxed to ~/PotomacWorkspace by default. Anything outside requires a one-click consent dialog."
          />
          <FeatureCard
            icon={<KillSwitchIcon className="h-5 w-5" />}
            title="Kill Switch"
            body="Ctrl+Shift+Esc anywhere on your system instantly stops every tool, terminates running processes, and locks YANG until you enter your passcode."
          />
          <FeatureCard
            icon={<ListIcon className="h-5 w-5" />}
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
            <div className="flex items-start gap-5">
              <YangLogo className="h-12 w-12 shrink-0" />
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
          <div className="flex items-center gap-2">
            <YangLogo className="h-5 w-5" />
            <span>© {new Date().getFullYear()} Potomac · YANG Autopilot v0.1.0 preview</span>
          </div>
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
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-amber-500/15 blur-[140px]" />
      <div className="absolute top-[40%] -right-40 h-[36rem] w-[36rem] rounded-full bg-indigo-500/10 blur-[140px]" />
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

function HeadlineCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-neutral-900/40 to-transparent p-6">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{body}</p>
    </div>
  );
}

function UseCaseCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group relative rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-sm p-5 hover:border-amber-500/30 hover:bg-neutral-900/70 transition-all">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 group-hover:bg-amber-500/15 transition-colors">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-100">{title}</h3>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{body}</p>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group relative rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-sm p-5 hover:border-amber-500/30 hover:bg-neutral-900/60 transition-all">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-neutral-800/80 text-amber-300/90 border border-neutral-700/50">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{body}</p>
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

// ─── YANG logo ─────────────────────────────────────────────────────────────
// Paper-plane / aircraft mark inside a hexagon, amber gradient.
function YangLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="YANG Autopilot">
      <defs>
        <linearGradient id="yang-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="yang-mark" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
      </defs>
      {/* Hex outer */}
      <path
        d="M32 2.5 58.5 17.5v29L32 61.5 5.5 46.5v-29z"
        fill="url(#yang-grad)"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.8"
      />
      {/* Inner hex shadow */}
      <path
        d="M32 8 53 19.8v24.4L32 56 11 44.2V19.8z"
        fill="url(#yang-mark)"
      />
      {/* Paper-plane / autopilot arrow */}
      <path
        d="M19 33 L46 19 L33 46 L30 35 Z"
        fill="url(#yang-grad)"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Center dot */}
      <circle cx="32" cy="32" r="1.6" fill="#0a0a0a" />
    </svg>
  );
}

// ─── Icon set (all hand-drawn SVGs, no emojis) ───────────────────────────

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
    </svg>
  );
}
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  );
}
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h6a3 3 0 0 1 3 3v6" /><path d="m15 12 3 3 3-3" />
    </svg>
  );
}
function InboxCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
      <path d="m9 7 2 2 4-4" />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m6 16 4-7 4 4 5-9" /><circle cx="6" cy="16" r="1" fill="currentColor" /><circle cx="10" cy="9" r="1" fill="currentColor" /><circle cx="14" cy="13" r="1" fill="currentColor" /><circle cx="19" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}
function CalendarRefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M14.5 16a2.5 2.5 0 1 1-1.5-4.5L15 13" /><path d="M15 11v2.5h-2.5" />
    </svg>
  );
}
function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M5 7h14" /><path d="m5 7-3 7a4 4 0 0 0 6 0z" /><path d="m19 7-3 7a4 4 0 0 0 6 0z" />
    </svg>
  );
}
function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /><path d="m14 17 2 2 4-4" />
    </svg>
  );
}
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M2 13h20" />
    </svg>
  );
}
function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" /><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
    </svg>
  );
}
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h5" />
    </svg>
  );
}
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function BroadcastIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  );
}
function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a3 3 0 0 0-3 3v0a3 3 0 0 0-3 3 3 3 0 0 0-1 5.83A3 3 0 0 0 8 21a3 3 0 0 0 4-1" />
      <path d="M12 3a3 3 0 0 1 3 3v0a3 3 0 0 1 3 3 3 3 0 0 1 1 5.83A3 3 0 0 1 16 21a3 3 0 0 1-4-1" />
      <path d="M12 4v16" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function GitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="12" r="2" />
      <path d="M6 8v8M8 18h4a3 3 0 0 0 3-3v-3" />
    </svg>
  );
}
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="15" r="4" /><path d="m11 11 9-9m-2 6 3-3m-5 5 3-3" />
    </svg>
  );
}
function PluginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v4M15 2v4M19 8H5a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0v-3" /><path d="M11 18v4" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function KillSwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v9" /><path d="M5.5 7.5a8 8 0 1 0 13 0" />
    </svg>
  );
}
function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
