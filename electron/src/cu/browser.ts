/**
 * Background Computer Use — Playwright browser adapter.
 *
 * Spawns a real Chromium window in its own OS window with its own cursor —
 * your physical mouse is NOT moved. The window can be visible (headed, the
 * default — easier to debug) or fully hidden (headless).
 *
 * Resolution order for the browser binary (so this works even when the user
 * never ran `npx playwright install`):
 *   1. Bundled Playwright Chromium (if installed via @playwright/browsers)
 *   2. Channel: 'chrome'         (Google Chrome stable)
 *   3. Channel: 'msedge'         (Microsoft Edge)
 *   4. Explicit executablePath from $POTOMAC_CHROME / $POTOMAC_EDGE
 *
 * Downloads land in `<workspaceRoot>/Downloads/` so the AI can immediately
 * read/process them with `fs_*` tools.
 */
import type { Browser, BrowserContext, Page, Download, LaunchOptions } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { CuAdapter, TargetInfo, ScreenshotResult, ClickOpts, Size, CuError } from './base';
import { getStore } from '../settings/store';

let _playwright: typeof import('playwright') | null = null;
function pw() {
  if (!_playwright) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _playwright = require('playwright');
  }
  return _playwright!;
}

interface TabHandle {
  info: TargetInfo;
  page: Page;
  pinNotes: Array<{ x: number; y: number; text: string; ts: number }>;
  downloads: Array<{ path: string; name: string; ts: number; url: string }>;
}

/** Where Playwright stashes auto-downloaded Chromium on Windows. */
function defaultPlaywrightCachePath(): string {
  return path.join(
    process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'),
    'ms-playwright',
  );
}

/** Best-effort lookup of an installed Chrome / Edge executable on this OS. */
function findSystemBrowser(): { channel?: 'chrome' | 'msedge'; executablePath?: string } | null {
  // Environment overrides win.
  if (process.env.POTOMAC_CHROME && fs.existsSync(process.env.POTOMAC_CHROME)) {
    return { executablePath: process.env.POTOMAC_CHROME };
  }
  if (process.env.POTOMAC_EDGE && fs.existsSync(process.env.POTOMAC_EDGE)) {
    return { executablePath: process.env.POTOMAC_EDGE };
  }

  const candidates: string[] =
    process.platform === 'win32'
      ? [
          path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(process.env['LOCALAPPDATA'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
          path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
        ]
      : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium',
          '/usr/bin/microsoft-edge',
        ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      const isEdge = /edge/i.test(c);
      return isEdge ? { channel: 'msedge', executablePath: c } : { channel: 'chrome', executablePath: c };
    }
  }
  // Last resort: try channels by name — Playwright will discover via registry.
  return { channel: 'chrome' };
}

export class BrowserAdapter implements CuAdapter {
  readonly kind = 'browser' as const;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private tabs = new Map<string, TabHandle>();
  private counter = 0;
  private downloadDir: string = '';

  private getDownloadDir(): string {
    if (this.downloadDir) return this.downloadDir;
    const root = getStore().get().workspaceRoot;
    const dir = path.join(root, 'Downloads');
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    this.downloadDir = dir;
    return dir;
  }

  private async tryLaunch(launchOpts: LaunchOptions): Promise<Browser> {
    const { chromium } = pw();
    return chromium.launch(launchOpts);
  }

  private async ensureBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
    if (this.browser && this.context) return { browser: this.browser, context: this.context };

    // Headed by default (so users see the AI work). Set CU_BROWSER_HEADLESS=1
    // to suppress the window for fully background runs.
    const headless = process.env.CU_BROWSER_HEADLESS === '1';
    const baseOpts: LaunchOptions = {
      headless,
      args: ['--disable-blink-features=AutomationControlled'],
    };

    const attempts: Array<{ label: string; opts: LaunchOptions }> = [];
    // Attempt 1: bundled Playwright Chromium if its cache directory exists.
    if (fs.existsSync(defaultPlaywrightCachePath())) {
      attempts.push({ label: 'playwright-chromium', opts: baseOpts });
    }
    // Attempts 2-4: installed system browsers.
    const sys = findSystemBrowser();
    if (sys) {
      if (sys.executablePath) {
        attempts.push({ label: `system:${sys.executablePath}`, opts: { ...baseOpts, executablePath: sys.executablePath } });
      }
      if (sys.channel) {
        attempts.push({ label: `channel:${sys.channel}`, opts: { ...baseOpts, channel: sys.channel } });
      }
    }
    // Attempt 5: last-ditch default (may fail with the "Executable doesn't exist" error).
    attempts.push({ label: 'default', opts: baseOpts });

    let lastError: unknown;
    for (const a of attempts) {
      try {
        this.browser = await this.tryLaunch(a.opts);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!this.browser) {
      const msg =
        'No usable Chromium / Chrome / Edge installation could be launched. Install Google Chrome (recommended) or run `npx playwright install chromium` inside the app folder.\n\nUnderlying error:\n' +
        (lastError instanceof Error ? lastError.message : String(lastError));
      throw new CuError('E_NO_BROWSER', msg);
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (compatible; PotomacAutopilot/1.0) Chrome',
      acceptDownloads: true,
      bypassCSP: true,
    });
    return { browser: this.browser!, context: this.context! };
  }

  private wireDownloadHandler(page: Page, handle: TabHandle): void {
    page.on('download', async (dl: Download) => {
      try {
        const suggested = dl.suggestedFilename();
        const safe = suggested.replace(/[\\/:*?"<>|]/g, '_') || `download-${Date.now()}`;
        const target = path.join(this.getDownloadDir(), `${Date.now()}-${safe}`);
        await dl.saveAs(target);
        handle.downloads.push({ path: target, name: safe, ts: Date.now(), url: dl.url() });
      } catch {
        /* ignore download errors */
      }
    });
  }

  async openTarget(
    identifier:
      | string
      | { type: 'url'; url: string }
      | { type: 'app'; name: string; args?: string[] }
      | { type: 'window'; title: string },
  ): Promise<TargetInfo> {
    let url: string | undefined;
    if (typeof identifier === 'string') url = identifier;
    else if ('url' in identifier) url = identifier.url;
    else if ('name' in identifier) url = `https://${identifier.name}`;
    if (!url) throw new CuError('E_BAD_ARGS', 'A URL is required for the browser adapter.');
    if (!/^https?:\/\//i.test(url) && !/^file:/i.test(url) && !/^about:/i.test(url)) {
      url = `https://${url}`;
    }

    const { context } = await this.ensureBrowser();
    const page = await context.newPage();
    const id = `browser:${++this.counter}`;
    const info: TargetInfo = {
      id,
      kind: 'browser',
      title: url,
      url,
      createdAt: Date.now(),
    };
    const handle: TabHandle = { info, page, pinNotes: [], downloads: [] };
    this.wireDownloadHandler(page, handle);
    this.tabs.set(id, handle);
    page.on('close', () => this.tabs.delete(id));

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      info.title = await page.title().catch(() => url);
      info.url = page.url();
    } catch {
      // Don't fail open — let the AI inspect even on error pages.
    }
    return info;
  }

  async closeTarget(targetId: string): Promise<void> {
    const t = this.tabs.get(targetId);
    if (!t) return;
    await t.page.close().catch(() => {});
    this.tabs.delete(targetId);
  }

  async listTargets(): Promise<TargetInfo[]> {
    return Array.from(this.tabs.values()).map((t) => t.info);
  }

  async screenshot(targetId: string): Promise<ScreenshotResult> {
    const t = this.must(targetId);
    const buf = await t.page.screenshot({ type: 'png', fullPage: false });
    const size = t.page.viewportSize() || { width: 0, height: 0 };
    return { pngBase64: buf.toString('base64'), width: size.width, height: size.height };
  }

  async getContent(targetId: string): Promise<{ kind: 'dom'; content: unknown }> {
    const t = this.must(targetId);
    const url = t.page.url();
    const title = await t.page.title().catch(() => '');
    let a11y: unknown = null;
    try {
      const cdp = await t.page.context().newCDPSession(t.page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree', {});
      a11y = nodes;
      await cdp.detach().catch(() => {});
    } catch {
      try { a11y = await t.page.content(); } catch { /* ignore */ }
    }
    return { kind: 'dom', content: { url, title, a11y } };
  }

  async click(targetId: string, x: number, y: number, opts?: ClickOpts): Promise<void> {
    const t = this.must(targetId);
    const mods = (opts?.modifiers || []).map((m) => (m === 'Ctrl' ? 'Control' : m === 'Meta' ? 'Meta' : m));
    for (const m of mods) await t.page.keyboard.down(m);
    try {
      await t.page.mouse.click(x, y, {
        button: opts?.button || 'left',
        delay: opts?.delayMs,
      });
    } finally {
      for (const m of mods.reverse()) await t.page.keyboard.up(m).catch(() => {});
    }
  }

  async doubleClick(targetId: string, x: number, y: number): Promise<void> {
    const t = this.must(targetId);
    await t.page.mouse.dblclick(x, y);
  }

  async type(targetId: string, text: string, opts?: { delayMs?: number }): Promise<void> {
    const t = this.must(targetId);
    await t.page.keyboard.type(text, { delay: opts?.delayMs });
  }

  async key(targetId: string, combo: string): Promise<void> {
    const t = this.must(targetId);
    const normalized = combo
      .split('+')
      .map((s) => {
        const k = s.trim();
        if (k.toLowerCase() === 'ctrl') return 'Control';
        if (k.toLowerCase() === 'cmd' || k.toLowerCase() === 'meta') return 'Meta';
        return k;
      })
      .join('+');
    await t.page.keyboard.press(normalized);
  }

  async scroll(targetId: string, x: number, y: number, dx: number, dy: number): Promise<void> {
    const t = this.must(targetId);
    await t.page.mouse.move(x, y);
    await t.page.mouse.wheel(dx, dy);
  }

  async size(targetId: string): Promise<Size> {
    const t = this.must(targetId);
    return t.page.viewportSize() || { width: 0, height: 0 };
  }

  async navigate(targetId: string, url: string): Promise<TargetInfo> {
    const t = this.must(targetId);
    if (!/^https?:\/\//i.test(url) && !/^file:/i.test(url) && !/^about:/i.test(url)) {
      url = `https://${url}`;
    }
    await t.page.goto(url, { waitUntil: 'domcontentloaded' });
    t.info.url = t.page.url();
    t.info.title = await t.page.title().catch(() => t.info.url || '');
    return t.info;
  }

  async evaluate(targetId: string, script: string): Promise<unknown> {
    const t = this.must(targetId);
    return t.page.evaluate(script as never);
  }

  async pinNote(targetId: string, x: number, y: number, text: string): Promise<void> {
    const t = this.must(targetId);
    t.pinNotes.push({ x, y, text, ts: Date.now() });
  }

  async getPinNotes(targetId: string): Promise<Array<{ x: number; y: number; text: string; ts: number }>> {
    return this.must(targetId).pinNotes;
  }

  /**
   * Download a file via direct HTTP fetch inside the browser context (so
   * cookies/auth carry over). Saves to `<workspace>/Downloads`.
   */
  async downloadUrl(targetId: string, url: string, filename?: string): Promise<{ path: string; bytes: number; name: string }> {
    const t = this.must(targetId);
    const resp = await t.page.context().request.get(url);
    if (!resp.ok()) throw new CuError('E_HTTP', `Download failed: HTTP ${resp.status()}`);
    const buf = await resp.body();
    const safeName = (filename || url.split('/').pop() || `download-${Date.now()}`).replace(/[\\/:*?"<>|]/g, '_');
    const target = path.join(this.getDownloadDir(), `${Date.now()}-${safeName}`);
    fs.writeFileSync(target, buf);
    t.downloads.push({ path: target, name: safeName, ts: Date.now(), url });
    return { path: target, bytes: buf.length, name: safeName };
  }

  async listDownloads(targetId: string): Promise<Array<{ path: string; name: string; ts: number; url: string }>> {
    return this.must(targetId).downloads;
  }

  /**
   * Wait for a specific selector — useful between clicks for dynamic pages.
   */
  async waitForSelector(targetId: string, selector: string, timeoutMs = 15_000): Promise<void> {
    const t = this.must(targetId);
    await t.page.waitForSelector(selector, { timeout: timeoutMs });
  }

  /**
   * Fill a form field by selector (more reliable than coordinate-based typing
   * for `input` / `textarea` elements).
   */
  async fill(targetId: string, selector: string, value: string): Promise<void> {
    const t = this.must(targetId);
    await t.page.fill(selector, value);
  }

  async shutdown(): Promise<void> {
    for (const id of Array.from(this.tabs.keys())) await this.closeTarget(id);
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    this.context = null;
    this.browser = null;
  }

  private must(targetId: string): TabHandle {
    const t = this.tabs.get(targetId);
    if (!t) throw new CuError('E_NO_TARGET', `Unknown browser target ${targetId}`);
    return t;
  }
}
