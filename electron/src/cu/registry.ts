/**
 * Background Computer Use — unified IPC registry.
 *
 * Exposes one tool family (`cu_*`) routed across three adapters:
 *   - browser:*            → BrowserAdapter (Playwright)
 *   - native:* / vd:*      → UiaWindowsAdapter / VirtualDesktopAdapter
 *
 * The model picks the adapter implicitly via the `kind` arg of cu_open_target.
 */
import { ipcMain } from 'electron';
import { append as auditAppend } from '../tools/audit';
import { guardComputerUse } from '../tools/sandbox';
import { pulse } from '../overlay/indicator';
import { BrowserAdapter } from './browser';
import { UiaWindowsAdapter } from './uia-windows';
import { VirtualDesktopAdapter } from './virtual-desktop';
import { CuAdapter, TargetInfo } from './base';

const browser = new BrowserAdapter();
const uia = new UiaWindowsAdapter();
const vd = new VirtualDesktopAdapter();

function pickAdapter(targetId: string): CuAdapter {
  if (targetId.startsWith('browser:')) return browser;
  if (targetId.startsWith('vd:')) return vd;
  if (targetId.startsWith('native:')) return uia;
  throw new Error(`Unknown target prefix: ${targetId}`);
}

function envelope<T>(name: string) {
  return async (impl: () => Promise<T>) => {
    const ts = Date.now();
    auditAppend({ ts, tool: name, status: 'start' });
    try {
      await guardComputerUse(name);
      pulse(name);
      const result = await impl();
      auditAppend({ ts: Date.now(), tool: name, status: 'success', durationMs: Date.now() - ts });
      return { ok: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code || 'E_UNKNOWN';
      auditAppend({ ts: Date.now(), tool: name, status: 'error', error: message, durationMs: Date.now() - ts });
      return { ok: false, error: { code, message } };
    }
  };
}

export function registerCuTools(): void {
  // open: explicit kind so the model picks the surface.
  ipcMain.handle('cu:open', (_e, opts: { kind: 'browser' | 'native' | 'virtual-desktop'; url?: string; app?: string; args?: string[]; windowTitle?: string }) =>
    envelope<TargetInfo>('cu_open_target')(async () => {
      if (opts.kind === 'browser') {
        if (!opts.url) throw new Error('url required for browser kind');
        return browser.openTarget(opts.url);
      }
      const id = opts.windowTitle ? { type: 'window' as const, title: opts.windowTitle } : { type: 'app' as const, name: opts.app!, args: opts.args };
      return opts.kind === 'virtual-desktop' ? vd.openTarget(id) : uia.openTarget(id);
    }),
  );
  ipcMain.handle('cu:close', (_e, targetId: string) =>
    envelope<void>('cu_close')(async () => pickAdapter(targetId).closeTarget(targetId)),
  );
  ipcMain.handle('cu:list', () =>
    envelope<TargetInfo[]>('cu_list_targets')(async () => {
      return [...(await browser.listTargets()), ...(await uia.listTargets()), ...(await vd.listTargets())];
    }),
  );
  ipcMain.handle('cu:screenshot', (_e, targetId: string) =>
    envelope('cu_screenshot')(async () => pickAdapter(targetId).screenshot(targetId)),
  );
  ipcMain.handle('cu:content', (_e, targetId: string) =>
    envelope('cu_get_content')(async () => pickAdapter(targetId).getContent(targetId)),
  );
  ipcMain.handle('cu:click', (_e, targetId: string, x: number, y: number, opts?: { button?: 'left' | 'right' | 'middle' }) =>
    envelope<void>('cu_click')(async () => pickAdapter(targetId).click(targetId, x, y, opts)),
  );
  ipcMain.handle('cu:double-click', (_e, targetId: string, x: number, y: number) =>
    envelope<void>('cu_double_click')(async () => pickAdapter(targetId).doubleClick(targetId, x, y)),
  );
  ipcMain.handle('cu:type', (_e, targetId: string, text: string, opts?: { delayMs?: number }) =>
    envelope<void>('cu_type')(async () => pickAdapter(targetId).type(targetId, text, opts)),
  );
  ipcMain.handle('cu:key', (_e, targetId: string, combo: string) =>
    envelope<void>('cu_key')(async () => pickAdapter(targetId).key(targetId, combo)),
  );
  ipcMain.handle('cu:scroll', (_e, targetId: string, x: number, y: number, dx: number, dy: number) =>
    envelope<void>('cu_scroll')(async () => pickAdapter(targetId).scroll(targetId, x, y, dx, dy)),
  );
  ipcMain.handle('cu:size', (_e, targetId: string) =>
    envelope('cu_size')(async () => pickAdapter(targetId).size(targetId)),
  );

  // ── Browser-only convenience tools ─────────────────────────────────────
  ipcMain.handle('cu:browser.navigate', (_e, targetId: string, url: string) =>
    envelope('browser_navigate')(async () => browser.navigate(targetId, url)),
  );
  ipcMain.handle('cu:browser.evaluate', (_e, targetId: string, script: string) =>
    envelope('browser_eval')(async () => browser.evaluate(targetId, script)),
  );
  ipcMain.handle('cu:browser.pin-note', (_e, targetId: string, x: number, y: number, text: string) =>
    envelope<void>('browser_pin_note')(async () => browser.pinNote(targetId, x, y, text)),
  );
  ipcMain.handle('cu:browser.get-pins', (_e, targetId: string) =>
    envelope('browser_get_pins')(async () => browser.getPinNotes(targetId)),
  );
}

export async function shutdownCu(): Promise<void> {
  await Promise.all([browser.shutdown(), uia.shutdown(), vd.shutdown()]);
}
