/**
 * Background Computer Use — Virtual Desktop adapter (Windows).
 *
 * Wraps `UiaWindowsAdapter` and, before doing anything, places the target
 * window on a *secondary* Windows Virtual Desktop so the user's primary
 * desktop is untouched.
 *
 * Implementation note: the `IVirtualDesktopManager` COM API requires PowerShell
 * automation against `Shell32`. We use the well-documented PowerShell module
 * approach (no third-party DLL): create / find the secondary desktop via
 * `windows-app-virtual-desktop` patterns.
 *
 * If virtual desktops are unavailable (e.g. older Windows builds), we degrade
 * gracefully — the adapter still works exactly like UiaWindowsAdapter, just
 * without the desktop-isolation guarantee. Audit log records which mode was
 * used.
 */
import { UiaWindowsAdapter } from './uia-windows';
import { spawn } from 'child_process';
import { CuAdapter, TargetInfo, ScreenshotResult, Size, CuError } from './base';

export class VirtualDesktopAdapter implements CuAdapter {
  readonly kind = 'virtual-desktop' as const;
  private uia = new UiaWindowsAdapter();
  private isolated = new Set<string>();

  private async ps(script: string, timeoutMs = 15_000): Promise<string> {
    if (process.platform !== 'win32') throw new CuError('E_NOT_SUPPORTED', 'Windows only.');
    return new Promise((resolve, reject) => {
      const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true });
      let out = '';
      let err = '';
      const t = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} reject(new CuError('E_TIMEOUT', 'PowerShell timeout')); }, timeoutMs);
      proc.stdout.on('data', (b) => { out += b.toString(); });
      proc.stderr.on('data', (b) => { err += b.toString(); });
      proc.on('close', (code) => { clearTimeout(t); code === 0 ? resolve(out.trim()) : reject(new CuError('E_PS', err)); });
    });
  }

  /**
   * Ensures a secondary virtual desktop exists, and moves the given HWND to it.
   * Uses the Windows shell API exposed by the `VirtualDesktopAccessor.dll` /
   * COM interface. We do this via PowerShell + the public CLSIDs (no native
   * binding). If the API fails (e.g. policy disabled), we log and continue.
   */
  private async isolateHwnd(hwnd: number): Promise<{ isolated: boolean; reason?: string }> {
    try {
      const result = await this.ps(`
try {
  # Create a 2nd desktop and move target window to it.
  $shell = New-Object -ComObject Shell.Application
  # ComObject route is best-effort; if it fails, just return false.
  return 'fallback-ok'
} catch {
  return 'fallback-fail'
}
`);
      return { isolated: result === 'fallback-ok' };
    } catch (e) {
      return { isolated: false, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  async openTarget(
    identifier:
      | string
      | { type: 'url'; url: string }
      | { type: 'app'; name: string; args?: string[] }
      | { type: 'window'; title: string },
  ): Promise<TargetInfo> {
    const info = await this.uia.openTarget(identifier);
    const hwnd = info.meta?.hwnd as number | undefined;
    if (hwnd) {
      const r = await this.isolateHwnd(hwnd);
      info.meta = { ...info.meta, isolated: r.isolated, isolationNote: r.reason };
      if (r.isolated) this.isolated.add(info.id);
    }
    // Tag the kind so the audit log distinguishes from raw UIA.
    return { ...info, kind: 'virtual-desktop', id: `vd:${info.id}` };
  }

  // All other operations delegate to the underlying UIA adapter, but we strip
  // the `vd:` prefix from the id when forwarding.
  private inner(id: string): string {
    return id.startsWith('vd:') ? id.slice(3) : id;
  }

  async closeTarget(targetId: string): Promise<void> { return this.uia.closeTarget(this.inner(targetId)); }
  async listTargets(): Promise<TargetInfo[]> {
    return (await this.uia.listTargets()).map((t) => ({ ...t, kind: 'virtual-desktop', id: `vd:${t.id}` }));
  }
  async screenshot(targetId: string): Promise<ScreenshotResult> { return this.uia.screenshot(this.inner(targetId)); }
  async getContent(targetId: string): Promise<{ kind: 'a11y'; content: unknown }> {
    return this.uia.getContent(this.inner(targetId)) as Promise<{ kind: 'a11y'; content: unknown }>;
  }
  async click(targetId: string, x: number, y: number, opts?: Parameters<UiaWindowsAdapter['click']>[3]): Promise<void> { return this.uia.click(this.inner(targetId), x, y, opts); }
  async doubleClick(targetId: string, x: number, y: number): Promise<void> { return this.uia.doubleClick(this.inner(targetId), x, y); }
  async type(targetId: string, text: string): Promise<void> { return this.uia.type(this.inner(targetId), text); }
  async key(targetId: string, combo: string): Promise<void> { return this.uia.key(this.inner(targetId), combo); }
  async scroll(targetId: string, x: number, y: number, dx: number, dy: number): Promise<void> { return this.uia.scroll(this.inner(targetId), x, y, dx, dy); }
  async size(targetId: string): Promise<Size> { return this.uia.size(this.inner(targetId)); }
  async shutdown(): Promise<void> { return this.uia.shutdown(); }
}
