'use client';

/**
 * Computer-Use Tester — direct end-to-end exercise of every desktop tool the
 * backend will ever ask the renderer to run. No AI involved — these buttons
 * call `window.potomacTools` directly via IPC and report the result.
 *
 * Sections:
 *   1. Browser surface              — open URL, screenshot, navigate, fill, click, download
 *   2. Native app surface           — Notepad, Calculator, attach by window title
 *   3. Virtual desktop surface      — isolated desktop on Windows
 *   4. Scripted demo workflows      — multi-step recipes (research, form fill,
 *                                     notepad write+save, etc.) that prove the
 *                                     full agent loop works locally.
 *   5. Filesystem ops               — write/read/list/delete in workspace
 *   6. Shell                        — run a shell command
 *   7. Real-cursor (legacy)         — `computer_*` family that DOES move the
 *                                     user's mouse. Sandboxed in its own card.
 *   8. Free-form snippet runner     — write JS against `tools.*` and run it
 *   9. Log + screenshot viewer
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { isDesktop, getTools, getSettings } from '@/lib/desktop/bridge';

type LogEntry = { ts: number; text: string; kind: 'info' | 'ok' | 'err'; meta?: unknown };
type Target = { id: string; kind: string; title?: string; url?: string };

export default function ComputerUseTester() {
  // ── State ─────────────────────────────────────────────────────────────
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [shotPng, setShotPng] = useState<string | null>(null);
  const [shotMeta, setShotMeta] = useState<{ width: number; height: number; ts: number } | null>(null);

  // Form inputs
  const [browserUrl, setBrowserUrl] = useState('https://www.example.com');
  const [navUrl, setNavUrl] = useState('https://duckduckgo.com');
  const [fillSelector, setFillSelector] = useState('input[name="q"]');
  const [fillValue, setFillValue] = useState('tactical real assets investing');
  const [clickX, setClickX] = useState(640);
  const [clickY, setClickY] = useState(400);
  const [typeText, setTypeText] = useState('Hello from Potomac Autopilot.\n');
  const [keyCombo, setKeyCombo] = useState('Enter');
  const [evalScript, setEvalScript] = useState('document.title');
  const [downloadUrl, setDownloadUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [nativeApp, setNativeApp] = useState('notepad.exe');
  const [windowTitle, setWindowTitle] = useState('');
  const [shellCmd, setShellCmd] = useState('echo Hello from %COMPUTERNAME%');
  const [fsPath, setFsPath] = useState('test-cu.txt');
  const [fsContent, setFsContent] = useState('Hello from the Computer-Use tester.\n');
  const [snippet, setSnippet] = useState(`// 'tools' is window.potomacTools. Return is logged.
const r = await tools.cu_open_target({ kind: 'browser', url: 'https://example.com' });
return r;`);

  const settings = useMemo(() => getSettings(), []);
  const tools = useMemo(() => getTools(), []);

  const [caps, setCaps] = useState<{ fs: boolean; shell: boolean; computer: boolean } | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');
  const [killSwitch, setKillSwitch] = useState(false);

  // ── Load capability info on mount ────────────────────────────────────
  useEffect(() => {
    if (!settings) return;
    void settings.get().then((s) => {
      setCaps(s.capabilities);
      setWorkspaceRoot(s.workspaceRoot);
      setKillSwitch(s.killSwitch);
    }).catch(() => {});
  }, [settings]);

  // ── Helpers ──────────────────────────────────────────────────────────
  function add(text: string, kind: LogEntry['kind'] = 'info', meta?: unknown) {
    setLog((prev) => [{ ts: Date.now(), text, kind, meta }, ...prev].slice(0, 300));
  }

  async function withLog<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    add(`▶ ${label}`);
    try {
      const r = await fn();
      const json = (() => { try { return JSON.stringify(r); } catch { return String(r); } })();
      add(`✓ ${label} → ${json.slice(0, 500)}${json.length > 500 ? '…' : ''}`, 'ok', r);
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      add(`✗ ${label}: ${msg}`, 'err');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function refreshTargets() {
    if (!tools) return;
    const r = await tools.cu_list_targets();
    if (r.ok && Array.isArray(r.result)) {
      setTargets(r.result as Target[]);
      if (!activeId && (r.result as Target[]).length > 0) setActiveId((r.result as Target[])[0].id);
    }
  }
  useEffect(() => {
    void refreshTargets();
    const i = setInterval(() => { void refreshTargets(); }, 4000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quick actions ────────────────────────────────────────────────────
  async function openBrowserTarget() {
    if (!tools) return;
    const r = await withLog(`cu_open_target Browser → ${browserUrl}`, () =>
      tools.cu_open_target({ kind: 'browser', url: browserUrl }),
    );
    setLastTargetFromResult(r);
    void refreshTargets();
  }

  async function openNativeTarget() {
    if (!tools) return;
    const opts: Parameters<typeof tools.cu_open_target>[0] = windowTitle
      ? { kind: 'native', windowTitle }
      : { kind: 'native', app: nativeApp };
    const r = await withLog(`cu_open_target Native → ${windowTitle || nativeApp}`, () => tools.cu_open_target(opts));
    setLastTargetFromResult(r);
    void refreshTargets();
  }

  async function openVirtualDesktop() {
    if (!tools) return;
    const r = await withLog(`cu_open_target VirtualDesktop → ${nativeApp}`, () =>
      tools.cu_open_target({ kind: 'virtual-desktop', app: nativeApp }),
    );
    setLastTargetFromResult(r);
    void refreshTargets();
  }

  function setLastTargetFromResult(r: unknown) {
    const env = r as { ok: boolean; result?: { id: string } } | null;
    if (env?.ok && env.result?.id) setActiveId(env.result.id);
  }

  async function shotActive() {
    if (!tools || !activeId) return;
    const r = await withLog(`cu_screenshot(${activeId})`, () => tools.cu_screenshot(activeId));
    const env = r as { ok: boolean; result?: { pngBase64: string; width: number; height: number } } | null;
    if (env?.ok && env.result) {
      setShotPng(`data:image/png;base64,${env.result.pngBase64}`);
      setShotMeta({ width: env.result.width, height: env.result.height, ts: Date.now() });
    }
  }

  async function navActive() {
    if (!tools || !activeId) return;
    await withLog(`browser_navigate(${activeId}, ${navUrl})`, () => tools.browser_navigate(activeId, navUrl));
  }

  async function fillActive() {
    if (!tools || !activeId) return;
    await withLog(`browser_fill(${activeId}, ${fillSelector}, ${fillValue})`, () =>
      tools.browser_fill(activeId, fillSelector, fillValue),
    );
  }

  async function clickActive(button: 'left' | 'right' | 'middle' = 'left') {
    if (!tools || !activeId) return;
    await withLog(`cu_click(${activeId}, ${clickX}, ${clickY}, ${button})`, () =>
      tools.cu_click(activeId, clickX, clickY, { button }),
    );
  }

  async function doubleClickActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_double_click(${activeId}, ${clickX}, ${clickY})`, () =>
      tools.cu_double_click(activeId, clickX, clickY),
    );
  }

  async function typeActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_type(${activeId}, ${typeText.length} chars)`, () => tools.cu_type(activeId, typeText));
  }

  async function keyActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_key(${activeId}, "${keyCombo}")`, () => tools.cu_key(activeId, keyCombo));
  }

  async function scrollActive(dy = 400) {
    if (!tools || !activeId) return;
    await withLog(`cu_scroll(${activeId}, 0, 0, 0, ${dy})`, () => tools.cu_scroll(activeId, 0, 0, 0, dy));
  }

  async function evalActive() {
    if (!tools || !activeId) return;
    await withLog(`browser_eval(${activeId}, ${evalScript})`, () => tools.browser_eval(activeId, evalScript));
  }

  async function downloadActive() {
    if (!tools || !activeId) return;
    await withLog(`browser_download(${activeId}, ${downloadUrl})`, () => tools.browser_download(activeId, downloadUrl));
  }

  async function listDownloadsActive() {
    if (!tools || !activeId) return;
    await withLog(`browser_list_downloads(${activeId})`, () => tools.browser_list_downloads(activeId));
  }

  async function getContentActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_get_content(${activeId})`, () => tools.cu_get_content(activeId));
  }

  async function getSizeActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_size(${activeId})`, () => tools.cu_size(activeId));
  }

  async function closeActive() {
    if (!tools || !activeId) return;
    await withLog(`cu_close(${activeId})`, () => tools.cu_close(activeId));
    setActiveId('');
    void refreshTargets();
  }

  // ── Filesystem ───────────────────────────────────────────────────────
  async function fsWrite() {
    if (!tools) return;
    await withLog(`fs_write_file(${fsPath})`, () => tools.fs_write_file(fsPath, fsContent, { createDirs: true }));
  }
  async function fsRead() {
    if (!tools) return;
    await withLog(`fs_read_file(${fsPath})`, () => tools.fs_read_file(fsPath));
  }
  async function fsList() {
    if (!tools) return;
    await withLog(`fs_list_dir(.)`, () => tools.fs_list_dir('.'));
  }
  async function fsDelete() {
    if (!tools) return;
    await withLog(`fs_delete(${fsPath})`, () => tools.fs_delete(fsPath));
  }
  async function fsStat() {
    if (!tools) return;
    await withLog(`fs_stat(${fsPath})`, () => tools.fs_stat(fsPath));
  }

  // ── Shell ────────────────────────────────────────────────────────────
  async function shellRun() {
    if (!tools) return;
    // Use shell: true so PATH / built-ins resolve.
    await withLog(`shell_run(${shellCmd})`, () => tools.shell_run(shellCmd, [], { shell: true, timeoutMs: 30_000 }));
  }

  // ── Real cursor ──────────────────────────────────────────────────────
  async function realScreenshot() {
    if (!tools) return;
    const r = await withLog('computer_screenshot (full desktop)', () => tools.computer_screenshot({}));
    const env = r as { ok: boolean; result?: { pngBase64: string; width: number; height: number } } | null;
    if (env?.ok && env.result) {
      setShotPng(`data:image/png;base64,${env.result.pngBase64}`);
      setShotMeta({ width: env.result.width, height: env.result.height, ts: Date.now() });
    }
  }
  async function realMove() {
    if (!tools) return;
    await withLog('computer_move (500, 500) — MOVES YOUR REAL CURSOR', () => tools.computer_move(500, 500));
  }
  async function realClickCenter() {
    if (!tools) return;
    await withLog('computer_click center — REAL MOUSE', () => tools.computer_click({}));
  }
  async function realType() {
    if (!tools) return;
    await withLog('computer_type — REAL KEYBOARD', () => tools.computer_type(`Potomac test — ${new Date().toISOString()}\n`));
  }

  // ── Scripted multi-step demos ────────────────────────────────────────
  /**
   * Demo 1 — Browser research recipe.
   * Open DuckDuckGo, fill in a query, press Enter, screenshot results.
   */
  async function demoBrowserSearch() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: browser research', 'info');
    try {
      const r1 = await tools.cu_open_target({ kind: 'browser', url: 'https://duckduckgo.com' });
      if (!r1.ok) throw new Error('open: ' + r1.error?.message);
      const id = (r1.result as { id: string }).id;
      setActiveId(id);
      add(`  ✓ opened ${id}`, 'ok');

      await sleep(800);
      const fill = await tools.browser_fill(id, 'input[name="q"]', 'tactical real assets investing strategy');
      if (!fill.ok) throw new Error('fill: ' + fill.error?.message);
      add('  ✓ filled search box', 'ok');

      await tools.cu_key(id, 'Enter');
      add('  ✓ pressed Enter', 'ok');

      await sleep(2000);
      const shot = await tools.cu_screenshot(id);
      if (shot.ok && shot.result) {
        setShotPng(`data:image/png;base64,${shot.result.pngBase64}`);
        setShotMeta({ width: shot.result.width, height: shot.result.height, ts: Date.now() });
        add('  ✓ took screenshot of results', 'ok');
      }

      const content = await tools.cu_get_content(id);
      add(`  ✓ got page content (kind=${(content.result as { kind?: string })?.kind || '?'})`, 'ok');
      add('✓ DEMO complete', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
      void refreshTargets();
    }
  }

  /**
   * Demo 2 — Notepad write + save recipe.
   * Open Notepad via UIA, type a timestamped note, Ctrl+S, then read file.
   *
   * The Ctrl+S triggers Notepad's Save As dialog — we type a path and Enter.
   */
  async function demoNotepadWriteAndSave() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: notepad write + save', 'info');
    try {
      const r1 = await tools.cu_open_target({ kind: 'native', app: 'notepad.exe' });
      if (!r1.ok) throw new Error('open notepad: ' + r1.error?.message);
      const id = (r1.result as { id: string }).id;
      setActiveId(id);
      add(`  ✓ opened ${id}`, 'ok');
      await sleep(1500);

      const text = `Potomac Autopilot Test\n  timestamp: ${new Date().toISOString()}\n  reason: end-to-end smoke test\n`;
      await tools.cu_type(id, text);
      add('  ✓ typed text', 'ok');
      await sleep(400);

      const shot = await tools.cu_screenshot(id);
      if (shot.ok && shot.result) {
        setShotPng(`data:image/png;base64,${shot.result.pngBase64}`);
        setShotMeta({ width: shot.result.width, height: shot.result.height, ts: Date.now() });
      }
      add('  ✓ screenshot taken (verify text is on screen)', 'ok');
      add('  ℹ️ skipping Ctrl+S (Notepad dialog requires UIA focus management beyond this demo)', 'info');
      add('✓ DEMO complete — close the Notepad window manually', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
      void refreshTargets();
    }
  }

  /**
   * Demo 3 — Calculator 12 × 12 = 144.
   * Open the Windows Calculator app, click 1, 2, ×, 1, 2, =, screenshot.
   */
  async function demoCalculator() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: Calculator 12 × 12', 'info');
    try {
      const r1 = await tools.cu_open_target({ kind: 'native', app: 'calc.exe' });
      if (!r1.ok) throw new Error('open calc: ' + r1.error?.message);
      const id = (r1.result as { id: string }).id;
      setActiveId(id);
      add(`  ✓ opened ${id}`, 'ok');
      await sleep(1500);

      // Use keyboard input — much more reliable than coordinate clicks.
      const keys = ['1', '2', '*', '1', '2', '=' ];
      for (const k of keys) {
        await tools.cu_key(id, k === '*' ? 'Shift+8' : k === '=' ? 'Enter' : k);
        await sleep(150);
      }
      add('  ✓ typed 12*12=', 'ok');

      const shot = await tools.cu_screenshot(id);
      if (shot.ok && shot.result) {
        setShotPng(`data:image/png;base64,${shot.result.pngBase64}`);
        setShotMeta({ width: shot.result.width, height: shot.result.height, ts: Date.now() });
      }
      add('✓ DEMO complete — check calculator shows 144', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
      void refreshTargets();
    }
  }

  /**
   * Demo 4 — Browser screenshot loop.
   * Open Hacker News, scroll-screenshot 3 times to verify scroll works.
   */
  async function demoScreenshotLoop() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: scroll + screenshot loop on Hacker News', 'info');
    try {
      const r1 = await tools.cu_open_target({ kind: 'browser', url: 'https://news.ycombinator.com' });
      if (!r1.ok) throw new Error('open hn: ' + r1.error?.message);
      const id = (r1.result as { id: string }).id;
      setActiveId(id);
      add(`  ✓ opened ${id}`, 'ok');

      for (let i = 0; i < 3; i++) {
        await sleep(700);
        const s = await tools.cu_screenshot(id);
        if (s.ok && s.result) {
          setShotPng(`data:image/png;base64,${s.result.pngBase64}`);
          setShotMeta({ width: s.result.width, height: s.result.height, ts: Date.now() });
        }
        add(`  ✓ screenshot ${i + 1}/3`, 'ok');
        await tools.cu_scroll(id, 640, 400, 0, 600);
      }
      add('✓ DEMO complete', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Demo 5 — FS round-trip: write → list → read → delete.
   */
  async function demoFsRoundTrip() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: filesystem round-trip', 'info');
    try {
      const path = `cu-test-${Date.now()}.txt`;
      const content = `Round-trip test\nTimestamp: ${new Date().toISOString()}\n`;
      const w = await tools.fs_write_file(path, content, { createDirs: true });
      if (!w.ok) throw new Error('write: ' + w.error?.message);
      add(`  ✓ wrote ${(w.result as { bytesWritten?: number })?.bytesWritten ?? '?'} bytes to ${path}`, 'ok');

      const list = await tools.fs_list_dir('.');
      const entries = (list.result as { entries?: Array<{ name: string }> })?.entries || [];
      const matches = entries.filter((e) => e.name === path).length;
      add(`  ✓ list: ${entries.length} entries, found target ${matches}× `, 'ok');

      const r = await tools.fs_read_file(path);
      const got = (r.result as { content?: string })?.content || '';
      add(`  ✓ read back ${got.length} chars (match: ${got === content ? '✅' : '❌'})`, got === content ? 'ok' : 'err');

      const d = await tools.fs_delete(path);
      add(`  ✓ delete: ${JSON.stringify(d.result)}`, 'ok');

      add('✓ DEMO complete', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Demo — Autonomous research → notepad → markdown report.
   *
   * Simulates what the AI will do end-to-end once the backend agent loop is in
   * place. Hardcoded recipe (no AI reasoning) but exercises every tool the
   * autonomous flow needs.
   *
   *   1. Open browser → DuckDuckGo
   *   2. Fill query → press Enter → screenshot
   *   3. Read results DOM, pick top 3 result URLs
   *   4. For each result: navigate → wait → screenshot → cu_get_content
   *      → extract a 1-sentence summary
   *   5. Open Notepad
   *   6. Type a structured markdown report
   *   7. Save report to <workspace>/reports/tactical-real-assets.md via fs_write_file
   *   8. shell_open the report folder so the user can see the file
   */
  async function demoAutonomousResearch() {
    if (!tools) return;
    setBusy(true);
    add('▶ 🤖 AUTONOMOUS DEMO: Research tactical real-assets investing & write a report', 'info');
    const topic = 'tactical real assets investing 2025';
    const reportLines: string[] = [
      `# Research Report — Tactical Real-Assets Investing`,
      ``,
      `_Generated by Potomac Autopilot on ${new Date().toLocaleString()}_`,
      ``,
      `**Topic:** ${topic}`,
      ``,
      `## Sources`,
      ``,
    ];

    try {
      // ── Step 1: open the search engine ────────────────────────────
      add('  ① open browser → DuckDuckGo', 'info');
      const r1 = await tools.cu_open_target({ kind: 'browser', url: 'https://duckduckgo.com' });
      if (!r1.ok) throw new Error('open browser: ' + r1.error?.message);
      const browserId = (r1.result as { id: string }).id;
      setActiveId(browserId);
      add(`     ✓ ${browserId}`, 'ok');
      await sleep(800);

      // ── Step 2: search ────────────────────────────────────────────
      add('  ② type query + Enter', 'info');
      await tools.browser_fill(browserId, 'input[name="q"]', topic);
      await sleep(200);
      await tools.cu_key(browserId, 'Enter');
      await sleep(2500);

      const shot1 = await tools.cu_screenshot(browserId);
      if (shot1.ok && shot1.result) {
        setShotPng(`data:image/png;base64,${shot1.result.pngBase64}`);
        setShotMeta({ width: shot1.result.width, height: shot1.result.height, ts: Date.now() });
      }
      add(`     ✓ search results loaded`, 'ok');

      // ── Step 3: pick a handful of canonical sources ──────────────
      // Hardcoded — what a real AI would do via cu_get_content + reasoning.
      const sources = [
        { name: 'Investopedia — Real Assets',     url: 'https://www.investopedia.com/terms/r/realasset.asp' },
        { name: 'BlackRock — Real Assets',         url: 'https://www.blackrock.com/us/individual/investment-ideas/real-assets' },
        { name: 'Wikipedia — Tactical Asset Allocation', url: 'https://en.wikipedia.org/wiki/Tactical_asset_allocation' },
      ];

      // ── Step 4: visit each source, screenshot, extract a summary ─
      for (const [idx, src] of sources.entries()) {
        add(`  ③.${idx + 1} navigate → ${src.name}`, 'info');
        const nav = await tools.browser_navigate(browserId, src.url);
        if (!nav.ok) {
          add(`     ✗ navigate failed: ${nav.error?.message}`, 'err');
          continue;
        }
        await sleep(2000);

        const shot = await tools.cu_screenshot(browserId);
        if (shot.ok && shot.result) {
          setShotPng(`data:image/png;base64,${shot.result.pngBase64}`);
          setShotMeta({ width: shot.result.width, height: shot.result.height, ts: Date.now() });
        }

        // Pull page title + a small excerpt via browser_eval.
        const titleR = await tools.browser_eval(browserId, 'document.title');
        const excerptR = await tools.browser_eval(browserId,
          `(() => {
            const main = document.querySelector('article, main, [role="main"]') || document.body;
            const text = (main.innerText || '').replace(/\\s+/g, ' ').trim();
            return text.slice(0, 280);
          })()`,
        );
        const title = (titleR.result as { ok?: boolean; result?: string })?.result || src.name;
        const excerpt = (excerptR.result as { ok?: boolean; result?: string })?.result || '(no excerpt available)';

        reportLines.push(`### ${idx + 1}. [${title}](${src.url})`);
        reportLines.push(``);
        reportLines.push(`> ${excerpt.slice(0, 240)}${excerpt.length > 240 ? '…' : ''}`);
        reportLines.push(``);
        add(`     ✓ extracted ${excerpt.length} chars`, 'ok');
      }

      // ── Step 5: open Notepad and type the report ────────────────
      add('  ④ open Notepad to show the live transcription', 'info');
      const np = await tools.cu_open_target({ kind: 'native', app: 'notepad.exe' });
      if (np.ok) {
        const npId = (np.result as { id: string }).id;
        await sleep(1500);
        await tools.cu_type(npId, reportLines.join('\n'));
        add(`     ✓ typed ${reportLines.join('\n').length} chars into Notepad`, 'ok');
        await sleep(400);
        const shotN = await tools.cu_screenshot(npId);
        if (shotN.ok && shotN.result) {
          setShotPng(`data:image/png;base64,${shotN.result.pngBase64}`);
          setShotMeta({ width: shotN.result.width, height: shotN.result.height, ts: Date.now() });
        }
      } else {
        add(`     ⚠ Notepad failed to open: ${np.error?.message}. Skipping that step.`, 'err');
      }

      // ── Step 6: also persist the report to disk ─────────────────
      const reportPath = `reports/tactical-real-assets-${Date.now()}.md`;
      add(`  ⑤ save report → ${reportPath}`, 'info');
      const w = await tools.fs_write_file(reportPath, reportLines.join('\n'), { createDirs: true });
      if (!w.ok) {
        add(`     ✗ fs_write_file: ${w.error?.message}`, 'err');
      } else {
        add(`     ✓ wrote ${(w.result as { bytesWritten?: number })?.bytesWritten ?? '?'} bytes to ${(w.result as { path?: string })?.path || reportPath}`, 'ok');

        // Open the containing folder so the user can find it.
        await tools.shell_open(`${workspaceRoot}\\reports`);
        add(`     ✓ opened ${workspaceRoot}\\reports in Explorer`, 'ok');
      }

      add('🎉 AUTONOMOUS DEMO COMPLETE — browser, notepad, and report all driven by code, no AI required.', 'ok');
    } catch (e) {
      add(`✗ AUTONOMOUS DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
      void refreshTargets();
    }
  }

  /**
   * Fire the actual backend goal API with a carefully-crafted prompt that
   * exercises browser + notepad + filesystem. This proves the FULL stack:
   * model → backend agent loop → SSE tool-call events → frontend interceptor
   * → IPC → tool execution → POST result → backend resume → next model call.
   *
   * Will only work when the backend agent loop is in place.
   */
  async function demoLiveAIGoal() {
    setBusy(true);
    add('▶ 🚀 LIVE AI GOAL — fires /api/yang/goal', 'info');
    try {
      const body = {
        title: 'Research tactical real-assets investing and write a report',
        description: 'End-to-end autonomous test',
        prompt:
`Use the desktop computer-use tools to autonomously research "tactical real-assets investing 2025" and produce a short report:

1. Call cu_open_target({kind:"browser", url:"https://duckduckgo.com"}) — save the returned id.
2. Use browser_fill to type the search query, then cu_key Enter.
3. Take a cu_screenshot. Look at the screenshot, identify the top 3 relevant results.
4. For each: browser_navigate to the URL, screenshot, then cu_get_content. Extract a 1-2 sentence summary in your reasoning.
5. After all 3 are visited, open Notepad: cu_open_target({kind:"native", app:"notepad.exe"})
6. cu_type a structured markdown report with headings ## Source 1, ## Source 2, ## Source 3 and 1-2 paragraph summaries.
7. Also save a copy via fs_write_file to "reports/tactical-real-assets.md".
8. Reply with a one-paragraph summary of what you accomplished.

You MUST iterate — do not stop after step 1. Take screenshots between actions to verify each step worked before moving on.`,
      };

      const resp = await fetch('/api/yang/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? (window.localStorage.getItem('auth_token') || '') : ''}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 400)}`);
      }
      const goal = (await resp.json()) as { id?: string; status?: string };
      add(`✓ goal created: id=${goal.id} status=${goal.status}`, 'ok');
      add(`   → switch to /yang/goals to watch it run, or check the goals dock`, 'info');
    } catch (e) {
      add(`✗ goal creation failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
      add(`   This will fail until the backend agent loop is wired up (see docs/BACKEND_AGENT_LOOP_FOR_AUTONOMOUS_USE.md).`, 'info');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Demo 6 — Multi-target orchestration.
   * Open browser + notepad in parallel, screenshot each, list targets.
   */
  async function demoMultiTarget() {
    if (!tools) return;
    setBusy(true);
    add('▶ DEMO: multi-target orchestration', 'info');
    try {
      const [b, n] = await Promise.all([
        tools.cu_open_target({ kind: 'browser', url: 'https://example.com' }),
        tools.cu_open_target({ kind: 'native', app: 'notepad.exe' }),
      ]);
      if (!b.ok) throw new Error('browser: ' + b.error?.message);
      if (!n.ok) throw new Error('notepad: ' + n.error?.message);
      const bid = (b.result as { id: string }).id;
      const nid = (n.result as { id: string }).id;
      add(`  ✓ opened browser=${bid} notepad=${nid}`, 'ok');
      await sleep(1200);

      const list = await tools.cu_list_targets();
      add(`  ✓ list_targets → ${(list.result as unknown[])?.length || 0}`, 'ok');

      await Promise.all([
        tools.cu_screenshot(bid),
        tools.cu_screenshot(nid),
      ]);
      add('  ✓ screenshotted both targets in parallel', 'ok');

      await tools.cu_type(nid, `Multi-target test at ${new Date().toLocaleTimeString()}\n`);
      add('  ✓ typed into notepad', 'ok');

      add('✓ DEMO complete', 'ok');
    } catch (e) {
      add(`✗ DEMO failed: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
      void refreshTargets();
    }
  }

  // ── Snippet runner ───────────────────────────────────────────────────
  async function runSnippet() {
    setBusy(true);
    add('▶ snippet');
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const fn = new Function('tools', 'sleep', `return (async () => { ${snippet} })()`);
      const r = await fn(tools, sleep);
      const json = (() => { try { return JSON.stringify(r); } catch { return String(r); } })();
      add(`✓ snippet → ${json.slice(0, 800)}`, 'ok');
    } catch (e) {
      add(`✗ snippet: ${e instanceof Error ? e.message : String(e)}`, 'err');
    } finally {
      setBusy(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  if (!isDesktop()) {
    return <div className="p-6 text-sm text-neutral-500">Computer-use tester only available in the desktop app.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto text-neutral-100 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Computer-Use Tester</h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-3xl">
            Exercises every desktop tool the AI can call — directly via IPC, no model involved. Use this to prove the
            desktop runtime works end-to-end and to diagnose whether bugs are local or backend.
          </p>
        </div>
        <div className="text-[11px] text-neutral-500 text-right space-y-0.5">
          {caps && <div>caps: fs={caps.fs ? '✓' : '✗'} sh={caps.shell ? '✓' : '✗'} cu={caps.computer ? '✓' : '✗'}</div>}
          {workspaceRoot && <div className="font-mono truncate max-w-xs">{workspaceRoot}</div>}
          {killSwitch && <div className="text-red-400 font-medium">⚠ KILL SWITCH ENGAGED</div>}
        </div>
      </header>

      {/* Active target picker */}
      <section className="rounded-lg border border-neutral-800 p-4 bg-neutral-950/40 space-y-2">
        <div className="flex items-center gap-3 justify-between">
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Active target</div>
          <button onClick={() => void refreshTargets()} className="text-[10px] text-neutral-500 hover:text-neutral-300">
            refresh
          </button>
        </div>
        {targets.length === 0 ? (
          <div className="text-xs text-neutral-500">No targets open. Open one below.</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`px-2 py-1 text-[11px] rounded-md font-mono transition-colors ${
                  activeId === t.id
                    ? 'bg-amber-500 text-neutral-900'
                    : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300'
                }`}
                title={t.url || t.title || t.id}
              >
                {t.kind}:{t.id.split(':')[1] || ''}
                {t.title && <span className="ml-1.5 opacity-60">— {t.title.slice(0, 28)}</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Scripted demos — the headline feature */}
      <section className="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-4 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-medium">Scripted multi-step demos</div>
          <div className="text-[11px] text-emerald-200/70 mt-1">
            Each runs a real multi-step workflow locally to prove the agent loop *would* work if the backend
            wired up the iteration pattern. No AI involved.
          </div>
        </div>
        {/* The headline two — autonomous demos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <DemoBtn
            label="🤖 AUTONOMOUS — Research tactical investing & write report"
            desc="Open browser → search → visit 3 sources → screenshot each → extract excerpts → open Notepad → type a markdown report → save to disk → open folder. Hardcoded recipe; no AI reasoning."
            onClick={demoAutonomousResearch}
            disabled={busy}
            highlight
          />
          <DemoBtn
            label="🚀 LIVE AI — Fire /goal for real autonomous research"
            desc="POSTs /api/yang/goal with a prompt asking the backend agent to do the same workflow above. Requires backend agent loop (BACKEND_AGENT_LOOP_FOR_AUTONOMOUS_USE.md)."
            onClick={demoLiveAIGoal}
            disabled={busy}
            highlight
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <DemoBtn label="🔎 Browser search (DuckDuckGo)" desc="Open → fill query → Enter → screenshot → grab DOM" onClick={demoBrowserSearch} disabled={busy} />
          <DemoBtn label="📝 Notepad write + screenshot" desc="Open Notepad → type → screenshot verify" onClick={demoNotepadWriteAndSave} disabled={busy} />
          <DemoBtn label="🧮 Calculator 12 × 12" desc="Open calc.exe → keystroke 12*12 → screenshot" onClick={demoCalculator} disabled={busy} />
          <DemoBtn label="📜 Screenshot loop (HN)" desc="Open HN → scroll + screenshot 3× to verify scroll works" onClick={demoScreenshotLoop} disabled={busy} />
          <DemoBtn label="💾 FS round-trip" desc="Write file → list dir → read back → verify → delete" onClick={demoFsRoundTrip} disabled={busy} />
          <DemoBtn label="🎭 Multi-target orchestration" desc="Open browser+notepad in parallel, type into notepad" onClick={demoMultiTarget} disabled={busy} />
        </div>
      </section>

      {/* Browser surface */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Browser surface (cu_* + browser_*)</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Field label="URL" value={browserUrl} onChange={setBrowserUrl} />
          <Field label="Navigate-to URL" value={navUrl} onChange={setNavUrl} />
          <Field label="JS to evaluate" value={evalScript} onChange={setEvalScript} mono />
          <Field label="Form selector" value={fillSelector} onChange={setFillSelector} mono />
          <Field label="Form value" value={fillValue} onChange={setFillValue} />
          <Field label="Download URL" value={downloadUrl} onChange={setDownloadUrl} />
        </div>
        <Toolbar>
          <Btn onClick={openBrowserTarget} disabled={busy}>Open browser → URL</Btn>
          <Btn onClick={navActive} disabled={busy || !activeId}>browser_navigate</Btn>
          <Btn onClick={fillActive} disabled={busy || !activeId}>browser_fill</Btn>
          <Btn onClick={evalActive} disabled={busy || !activeId}>browser_eval</Btn>
          <Btn onClick={downloadActive} disabled={busy || !activeId}>browser_download</Btn>
          <Btn onClick={listDownloadsActive} disabled={busy || !activeId}>list downloads</Btn>
          <Btn onClick={getContentActive} disabled={busy || !activeId}>cu_get_content</Btn>
        </Toolbar>
      </section>

      {/* Native + virtual desktop */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Native windows (UIA) + virtual desktop</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="App executable" value={nativeApp} onChange={setNativeApp} mono />
          <Field label="OR attach by window title" value={windowTitle} onChange={setWindowTitle} placeholder="(empty = use app)" />
        </div>
        <Toolbar>
          <Btn onClick={openNativeTarget} disabled={busy}>Open native target</Btn>
          <Btn onClick={openVirtualDesktop} disabled={busy}>Open on virtual desktop</Btn>
          <Btn onClick={() => setNativeApp('notepad.exe')} variant="ghost">→ notepad</Btn>
          <Btn onClick={() => setNativeApp('calc.exe')} variant="ghost">→ calc</Btn>
          <Btn onClick={() => setNativeApp('mspaint.exe')} variant="ghost">→ paint</Btn>
          <Btn onClick={() => setNativeApp('explorer.exe')} variant="ghost">→ explorer</Btn>
        </Toolbar>
      </section>

      {/* Active-target interactions */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Interact with active target — {activeId || '(none)'}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Click X" value={String(clickX)} onChange={(v) => setClickX(Number(v) || 0)} type="number" />
          <Field label="Click Y" value={String(clickY)} onChange={(v) => setClickY(Number(v) || 0)} type="number" />
          <Field label="Key combo" value={keyCombo} onChange={setKeyCombo} mono />
        </div>
        <Field label="Text to type" value={typeText} onChange={setTypeText} textarea rows={2} />
        <Toolbar>
          <Btn onClick={shotActive} disabled={busy || !activeId}>cu_screenshot</Btn>
          <Btn onClick={getSizeActive} disabled={busy || !activeId}>cu_size</Btn>
          <Btn onClick={() => clickActive('left')} disabled={busy || !activeId}>cu_click left</Btn>
          <Btn onClick={() => clickActive('right')} disabled={busy || !activeId}>cu_click right</Btn>
          <Btn onClick={doubleClickActive} disabled={busy || !activeId}>cu_double_click</Btn>
          <Btn onClick={typeActive} disabled={busy || !activeId}>cu_type</Btn>
          <Btn onClick={keyActive} disabled={busy || !activeId}>cu_key</Btn>
          <Btn onClick={() => scrollActive(400)} disabled={busy || !activeId}>scroll ↓</Btn>
          <Btn onClick={() => scrollActive(-400)} disabled={busy || !activeId}>scroll ↑</Btn>
          <Btn onClick={closeActive} disabled={busy || !activeId} variant="danger">cu_close</Btn>
        </Toolbar>
      </section>

      {/* Filesystem */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Filesystem (workspace root above)</div>
        <Field label="Path" value={fsPath} onChange={setFsPath} mono />
        <Field label="Content (for write)" value={fsContent} onChange={setFsContent} textarea rows={2} />
        <Toolbar>
          <Btn onClick={fsWrite} disabled={busy}>fs_write_file</Btn>
          <Btn onClick={fsRead} disabled={busy}>fs_read_file</Btn>
          <Btn onClick={fsList} disabled={busy}>fs_list_dir(.)</Btn>
          <Btn onClick={fsStat} disabled={busy}>fs_stat</Btn>
          <Btn onClick={fsDelete} disabled={busy} variant="danger">fs_delete</Btn>
        </Toolbar>
      </section>

      {/* Shell */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Shell (your real shell — prompts for consent)</div>
        <Field label="Command" value={shellCmd} onChange={setShellCmd} mono />
        <Toolbar>
          <Btn onClick={shellRun} disabled={busy}>shell_run (shell=true)</Btn>
        </Toolbar>
      </section>

      {/* Real cursor (legacy) */}
      <section className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-amber-400/80 font-medium">
          Real cursor / desktop (computer_*) — MOVES YOUR ACTUAL MOUSE
        </div>
        <p className="text-[11px] text-amber-200/70">
          These are the legacy `computer_*` tools that drive your real keyboard and mouse. Mostly here for diagnostics —
          the agent should prefer the `cu_*` family which is non-intrusive.
        </p>
        <Toolbar>
          <Btn onClick={realScreenshot} disabled={busy}>computer_screenshot (full desktop)</Btn>
          <Btn onClick={realMove} disabled={busy} variant="danger">computer_move → (500,500)</Btn>
          <Btn onClick={realClickCenter} disabled={busy} variant="danger">computer_click center</Btn>
          <Btn onClick={realType} disabled={busy} variant="danger">computer_type test</Btn>
        </Toolbar>
      </section>

      {/* Free-form */}
      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Free-form snippet (tools + sleep in scope)</div>
        <textarea
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
          rows={8}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-xs font-mono resize-y"
        />
        <div className="flex justify-end">
          <Btn onClick={runSnippet} disabled={busy}>Run</Btn>
        </div>
      </section>

      {/* Log */}
      <section className="rounded-lg border border-neutral-800 bg-neutral-950">
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Log ({log.length})</div>
          <button onClick={() => setLog([])} className="text-[10px] text-neutral-500 hover:text-neutral-300">clear</button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-900">
          {log.length === 0 && (
            <div className="px-4 py-6 text-xs text-neutral-500 text-center">Nothing yet — click any button above.</div>
          )}
          {log.map((e, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 text-[11px] font-mono flex gap-2 ${
                e.kind === 'ok' ? 'text-emerald-300' : e.kind === 'err' ? 'text-red-400' : 'text-neutral-300'
              }`}
            >
              <span className="text-neutral-600 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
              <span className="break-all">{e.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot preview */}
      {shotPng && (
        <section className="rounded-lg border border-neutral-800 p-2">
          <div className="px-2 py-1 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Latest screenshot</div>
            {shotMeta && (
              <div className="text-[10px] text-neutral-500 font-mono">
                {shotMeta.width}×{shotMeta.height} • {new Date(shotMeta.ts).toLocaleTimeString()}
              </div>
            )}
          </div>
          <img src={shotPng} alt="screenshot" className="w-full rounded-md" />
        </section>
      )}
    </div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Btn({
  onClick,
  disabled,
  children,
  variant,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'danger' | 'ghost';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 text-[11px] rounded-md font-medium disabled:opacity-40 transition-colors ${
        variant === 'danger'
          ? 'bg-red-900 hover:bg-red-800 text-red-100'
          : variant === 'ghost'
          ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300'
          : 'bg-neutral-100 text-neutral-900 hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}

function DemoBtn({
  label,
  desc,
  onClick,
  disabled,
  highlight,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-md px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        highlight
          ? 'bg-gradient-to-br from-amber-950/60 to-emerald-950/40 border border-amber-700/40 hover:border-amber-500/60'
          : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-700/40'
      }`}
    >
      <div className={`text-xs font-medium ${highlight ? 'text-amber-200' : 'text-neutral-100'}`}>{label}</div>
      <div className={`text-[10px] mt-0.5 ${highlight ? 'text-amber-100/70' : 'text-neutral-500'}`}>{desc}</div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  mono,
  textarea,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const cls = `w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-xs ${mono ? 'font-mono' : ''}`;
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 2} className={`${cls} resize-y`} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} type={type} className={cls} placeholder={placeholder} />
      )}
    </label>
  );
}
