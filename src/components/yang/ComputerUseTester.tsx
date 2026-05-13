'use client';

/**
 * Manual computer-use tester — proves end-to-end that the Electron
 * `cu_*` and `computer_*` IPC handlers work, without involving the AI
 * backend at all. Useful for diagnosing whether failures are local or
 * server-side.
 *
 * Three sections:
 *   1. Quick actions — single-button shortcuts (open Notepad, take a
 *      screenshot of your screen, etc.) using cu_open_target + cu_*.
 *   2. Free-form runner — write a small JS snippet against
 *      `window.potomacTools` and run it.
 *   3. Real-cursor controls — the legacy `computer_*` family that DOES
 *      move your physical cursor (use only for testing).
 */
import { useState } from 'react';
import { isDesktop, getTools } from '@/lib/desktop/bridge';

type LogEntry = { ts: number; text: string; kind: 'info' | 'ok' | 'err' };

export default function ComputerUseTester() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [snippet, setSnippet] = useState(`// Available: tools (window.potomacTools)
// Returns will be JSON.stringified into the log.
const r = await tools.cu_open_target({ kind: 'native', app: 'notepad.exe' });
return r;`);
  const [targetId, setTargetId] = useState<string>('');
  const [shotPng, setShotPng] = useState<string | null>(null);

  function add(text: string, kind: LogEntry['kind'] = 'info') {
    setLog((prev) => [{ ts: Date.now(), text, kind }, ...prev].slice(0, 200));
  }

  async function runWithLog<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    add(`▶ ${label}`);
    try {
      const r = await fn();
      add(`✓ ${label} → ${JSON.stringify(r).slice(0, 400)}`, 'ok');
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      add(`✗ ${label}: ${msg}`, 'err');
      return null;
    } finally {
      setBusy(false);
    }
  }

  // ── Quick actions ────────────────────────────────────────────────────
  async function openNotepad() {
    const r = await runWithLog('cu_open_target Notepad', () =>
      getTools()!.cu_open_target({ kind: 'native', app: 'notepad.exe' }),
    );
    const env = r as { ok: boolean; result?: { id: string } } | null;
    if (env?.ok && env.result?.id) setTargetId(env.result.id);
  }

  async function openCalculator() {
    const r = await runWithLog('cu_open_target Calculator', () =>
      getTools()!.cu_open_target({ kind: 'native', app: 'calc.exe' }),
    );
    const env = r as { ok: boolean; result?: { id: string } } | null;
    if (env?.ok && env.result?.id) setTargetId(env.result.id);
  }

  async function openBrowser() {
    const r = await runWithLog('cu_open_target Browser → example.com', () =>
      getTools()!.cu_open_target({ kind: 'browser', url: 'https://example.com' }),
    );
    const env = r as { ok: boolean; result?: { id: string } } | null;
    if (env?.ok && env.result?.id) setTargetId(env.result.id);
  }

  async function listTargets() {
    await runWithLog('cu_list_targets', () => getTools()!.cu_list_targets());
  }

  async function shotTarget() {
    if (!targetId) { add('No targetId — open a target first.', 'err'); return; }
    const r = await runWithLog(`cu_screenshot(${targetId})`, () =>
      getTools()!.cu_screenshot(targetId),
    );
    const env = r as { ok: boolean; result?: { pngBase64: string; width: number; height: number } } | null;
    if (env?.ok && env.result) setShotPng(`data:image/png;base64,${env.result.pngBase64}`);
  }

  async function typeInTarget() {
    if (!targetId) { add('No targetId.', 'err'); return; }
    const text = `Hello from YANG Autopilot — ${new Date().toISOString()}\n`;
    await runWithLog(`cu_type(${targetId})`, () => getTools()!.cu_type(targetId, text));
  }

  async function pressCtrlS() {
    if (!targetId) { add('No targetId.', 'err'); return; }
    await runWithLog(`cu_key(${targetId}, 'Ctrl+S')`, () => getTools()!.cu_key(targetId, 'Ctrl+S'));
  }

  async function closeTarget() {
    if (!targetId) { add('No targetId.', 'err'); return; }
    await runWithLog(`cu_close(${targetId})`, () => getTools()!.cu_close(targetId));
    setTargetId('');
  }

  // ── Real-cursor (legacy) ─────────────────────────────────────────────
  async function realCursorScreenshot() {
    const r = await runWithLog('computer_screenshot (whole desktop)', () =>
      getTools()!.computer_screenshot({}),
    );
    const env = r as { ok: boolean; result?: { pngBase64: string } } | null;
    if (env?.ok && env.result) setShotPng(`data:image/png;base64,${env.result.pngBase64}`);
  }

  async function realCursorWiggle() {
    await runWithLog('computer_move (500,500) — WILL MOVE YOUR CURSOR', () =>
      getTools()!.computer_move(500, 500),
    );
  }

  // ── Free-form runner ─────────────────────────────────────────────────
  async function runSnippet() {
    setBusy(true);
    add(`▶ snippet`);
    try {
      const tools = getTools()!;
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const fn = new Function('tools', `return (async () => { ${snippet} })()`);
      const r = await fn(tools);
      add(`✓ snippet → ${JSON.stringify(r).slice(0, 800)}`, 'ok');
    } catch (e) {
      add(`✗ snippet: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
    }
  }

  if (!isDesktop()) {
    return <div className="p-6 text-sm text-neutral-500">Computer-use tester only available in the desktop app.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Computer-Use Tester</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Exercises the Electron mouse/keyboard/screen handlers directly — no AI involved. If buttons here work but goals don't, the bug is on the backend (see <a href="#" className="underline">BACKEND_FIX_CHECKLIST.md</a>).
        </p>
      </header>

      {/* Quick actions */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Background apps (cu_*) — no real cursor movement</div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={openNotepad} disabled={busy}>Open Notepad</Btn>
          <Btn onClick={openCalculator} disabled={busy}>Open Calculator</Btn>
          <Btn onClick={openBrowser} disabled={busy}>Open background browser</Btn>
          <Btn onClick={listTargets} disabled={busy}>List targets</Btn>
        </div>
        <div className="text-xs text-neutral-500 font-mono">
          Active target: <span className="text-neutral-200">{targetId || '(none)'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={shotTarget} disabled={busy || !targetId}>Screenshot target</Btn>
          <Btn onClick={typeInTarget} disabled={busy || !targetId}>Type test text</Btn>
          <Btn onClick={pressCtrlS} disabled={busy || !targetId}>Press Ctrl+S</Btn>
          <Btn onClick={closeTarget} disabled={busy || !targetId} variant="danger">Close target</Btn>
        </div>
      </section>

      {/* Real cursor */}
      <section className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-400/80 font-medium">Real cursor / desktop (computer_*) — MOVES YOUR ACTUAL CURSOR</div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={realCursorScreenshot} disabled={busy}>Screenshot whole desktop</Btn>
          <Btn onClick={realCursorWiggle} disabled={busy} variant="danger">Move cursor to (500, 500)</Btn>
        </div>
      </section>

      {/* Free-form snippet */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Free-form runner</div>
        <textarea
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
          rows={6}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-xs font-mono resize-y"
        />
        <div className="flex justify-end">
          <Btn onClick={runSnippet} disabled={busy}>Run</Btn>
        </div>
      </section>

      {/* Log */}
      <section className="rounded-lg border border-neutral-800 bg-neutral-950">
        <div className="px-4 py-2 border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500 font-medium">Log</div>
        <div className="max-h-72 overflow-y-auto divide-y divide-neutral-900">
          {log.length === 0 && <div className="px-4 py-6 text-xs text-neutral-500 text-center">Nothing yet — click a button.</div>}
          {log.map((e, i) => (
            <div key={i} className={`px-3 py-1.5 text-[11px] font-mono flex gap-2 ${e.kind === 'ok' ? 'text-emerald-300' : e.kind === 'err' ? 'text-red-400' : 'text-neutral-300'}`}>
              <span className="text-neutral-600 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
              <span className="break-all">{e.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot preview */}
      {shotPng && (
        <section className="rounded-lg border border-neutral-800 p-2">
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium px-2 py-1">Latest screenshot</div>
          <img src={shotPng} alt="screenshot" className="w-full rounded-md" />
        </section>
      )}
    </div>
  );
}

function Btn({ onClick, disabled, children, variant }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; variant?: 'danger' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs rounded-md font-medium disabled:opacity-50 transition-colors ${
        variant === 'danger'
          ? 'bg-red-900 hover:bg-red-800 text-red-100'
          : 'bg-neutral-100 text-neutral-900 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}
