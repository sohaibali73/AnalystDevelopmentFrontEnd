/**
 * Background Computer Use — Playwright browser adapter.
 *
 * Spawns a headed* (offscreen) Chromium with its own window/cursor that does
 * NOT interfere with the user's desktop activity. The browser window can be
 * either:
 *   - rendered into a `BrowserView` inside the main app for the "Autopilot
 *     Stage" panel (preferred), or
 *   - hidden entirely (truly background) and only screenshotted.
 *
 * We use Playwright Node because it's more capable than Puppeteer (CDP +
 * accessibility tree + multi-context) and we already accepted Playwright as
 * the engine choice for YANG Autopilot.
 *
 * *Note: even "headed" Playwright runs in its own OS window with its own
 * cursor — your real cursor is untouched.
 */
import type { Browser, BrowserContext, Page } from 'playwright';
import { CuAdapter, TargetInfo, ScreenshotResult, ClickOpts, Size, CuError } from './base';

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
}

export class BrowserAdapter implements CuAdapter {
  readonly kind = 'browser' as const;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private tabs = new Map<string, TabHandle>();
  private counter = 0;

  private async ensureBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
    if (this.browser && this.context) return { browser: this.browser, context: this.context };
    const { chromium } = pw();
    // headed: false runs without a visible window — pure background.
    // Set CU_BROWSER_HEADLESS=0 to debug interactively.
    const headless = process.env.CU_BROWSER_HEADLESS !== '0';
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      // A custom UA so target sites can distinguish if needed.
      userAgent: 'Mozilla/5.0 (compatible; PotomacAutopilot/1.0) Chrome',
      bypassCSP: true,
    });
    return { browser: this.browser!, context: this.context! };
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

    const { context } = await this.ensureBrowser();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch (err) {
      // Don't fail open — let the AI inspect even on error pages.
    }
    const id = `browser:${++this.counter}`;
    const info: TargetInfo = {
      id,
      kind: 'browser',
      title: await page.title().catch(() => url),
      url: page.url(),
      createdAt: Date.now(),
    };
    this.tabs.set(id, { info, page, pinNotes: [] });
    page.on('close', () => this.tabs.delete(id));
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
    // Use CDP for the a11y tree (the public accessibility API was removed
    // from Page in newer Playwright). Fall back to plain HTML if CDP fails.
    let a11y: unknown = null;
    try {
      const cdp = await t.page.context().newCDPSession(t.page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree', {});
      a11y = nodes;
      await cdp.detach().catch(() => {});
    } catch {
      try {
        a11y = await t.page.content();
      } catch { /* ignore */ }
    }
    return { kind: 'dom', content: { url, title, a11y } };
  }

  async click(targetId: string, x: number, y: number, opts?: ClickOpts): Promise<void> {
    const t = this.must(targetId);
    // Apply modifiers via held-down keys, then click.
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
    // Playwright accepts "Control+Shift+T", "Enter", "ArrowDown", etc.
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
    await t.page.goto(url, { waitUntil: 'domcontentloaded' });
    t.info.url = t.page.url();
    t.info.title = await t.page.title().catch(() => t.info.url || '');
    return t.info;
  }

  async evaluate(targetId: string, script: string): Promise<unknown> {
    const t = this.must(targetId);
    // The script is executed in the page context — return whatever it produces.
    return t.page.evaluate(script as never);
  }

  async pinNote(targetId: string, x: number, y: number, text: string): Promise<void> {
    const t = this.must(targetId);
    t.pinNotes.push({ x, y, text, ts: Date.now() });
  }

  async getPinNotes(targetId: string): Promise<Array<{ x: number; y: number; text: string; ts: number }>> {
    return this.must(targetId).pinNotes;
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
