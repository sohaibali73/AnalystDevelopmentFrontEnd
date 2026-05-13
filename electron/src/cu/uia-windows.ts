/**
 * Background Computer Use — Windows UI Automation adapter.
 *
 * Strategy: drive native Windows apps via UIA *without moving the real
 * cursor*. We avoid native bindings (no ffi-napi / no native rebuild
 * headaches) by spawning short-lived PowerShell sessions that load the
 * UIAutomationClient .NET assemblies and execute the requested operation.
 *
 * PowerShell is preinstalled on every modern Windows machine, so this
 * adapter has zero install footprint beyond what's already in the app.
 *
 * Supported operations (v1):
 *   - openTarget({type:'app', name, args})          → launches and grabs HWND
 *   - openTarget({type:'window', title})           → attaches to existing HWND
 *   - listTargets()                                 → enumerate
 *   - screenshot()                                  → PrintWindow via Win32
 *   - click(x, y), doubleClick(x, y), type(text), key(combo), scroll
 *   - getContent()                                  → UIA tree dump as JSON
 *
 * All input goes through SendInput() targeted at the HWND, so the foreground
 * window the user is using is *not* affected. To go fully invisible we pair
 * this with the VirtualDesktopAdapter in production.
 *
 * On non-Windows platforms this adapter throws a clear error.
 */
import { spawn } from 'child_process';
import { CuAdapter, TargetInfo, ScreenshotResult, Size, CuError } from './base';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

interface Handle {
  info: TargetInfo;
  hwnd: number;
  pid?: number;
}

export class UiaWindowsAdapter implements CuAdapter {
  readonly kind = 'native' as const;
  private handles = new Map<string, Handle>();
  private counter = 0;

  private requireWindows() {
    if (process.platform !== 'win32') {
      throw new CuError('E_NOT_SUPPORTED', 'UIA adapter only runs on Windows.');
    }
  }

  /** Run a small PowerShell snippet and parse its JSON-on-last-line output. */
  private async ps<T = unknown>(script: string, timeoutMs = 30_000): Promise<T> {
    this.requireWindows();
    return new Promise((resolve, reject) => {
      const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
        reject(new CuError('E_TIMEOUT', `PowerShell timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      proc.stdout.on('data', (b) => { stdout += b.toString(); });
      proc.stderr.on('data', (b) => { stderr += b.toString(); });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) return reject(new CuError('E_PS', stderr || `exit ${code}`));
        try {
          // Find the last JSON line (allow other output above).
          const lines = stdout.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const t = lines[i].trim();
            if (t.startsWith('{') || t.startsWith('[')) return resolve(JSON.parse(t));
          }
          resolve(stdout.trim() as unknown as T);
        } catch (err) {
          reject(new CuError('E_PARSE', `Bad PowerShell output: ${stdout.slice(0, 256)}`));
        }
      });
    });
  }

  async openTarget(
    identifier:
      | string
      | { type: 'url'; url: string }
      | { type: 'app'; name: string; args?: string[] }
      | { type: 'window'; title: string },
  ): Promise<TargetInfo> {
    this.requireWindows();
    if (typeof identifier === 'string') identifier = { type: 'app', name: identifier };
    if ('url' in identifier) {
      throw new CuError('E_BAD_ARGS', 'UIA adapter does not accept URL targets — use the browser adapter.');
    }

    let hwnd: number;
    let pid: number | undefined;
    let title = '';

    if (identifier.type === 'app') {
      const args = (identifier.args || []).map((a) => `'${a.replace(/'/g, "''")}'`).join(',');
      const script = `
$proc = Start-Process -FilePath '${identifier.name.replace(/'/g, "''")}' ${args ? `-ArgumentList ${args}` : ''} -PassThru
Start-Sleep -Milliseconds 800
$proc.Refresh()
$h = 0; $title = ''
1..30 | ForEach-Object {
  $proc.Refresh()
  if ($proc.MainWindowHandle -ne 0) { $h = [int64]$proc.MainWindowHandle.ToInt64(); $title = $proc.MainWindowTitle; return }
  Start-Sleep -Milliseconds 300
}
@{ hwnd = $h; pid = $proc.Id; title = $title } | ConvertTo-Json -Compress
`;
      const r = await this.ps<{ hwnd: number; pid: number; title: string }>(script, 15_000);
      if (!r.hwnd) throw new CuError('E_NO_HWND', `Could not find a main window for ${identifier.name}.`);
      hwnd = r.hwnd;
      pid = r.pid;
      title = r.title;
    } else {
      const titlePattern = identifier.title.replace(/'/g, "''");
      const script = `
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint lpdwProcessId);
}
"@
$h = [Win32]::FindWindow($null, '${titlePattern}')
$sb = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($h, $sb, 256) | Out-Null
[uint32]$ppid = 0
[Win32]::GetWindowThreadProcessId($h, [ref]$ppid) | Out-Null
@{ hwnd = [int64]$h.ToInt64(); title = $sb.ToString(); pid = $ppid } | ConvertTo-Json -Compress
`;
      const r = await this.ps<{ hwnd: number; title: string; pid: number }>(script, 5_000);
      if (!r.hwnd) throw new CuError('E_NO_HWND', `No window matched title "${identifier.title}".`);
      hwnd = r.hwnd;
      pid = r.pid;
      title = r.title;
    }

    const id = `native:${++this.counter}:${hwnd}`;
    const info: TargetInfo = {
      id,
      kind: 'native',
      title,
      createdAt: Date.now(),
      meta: { hwnd, pid },
    };
    this.handles.set(id, { info, hwnd, pid });
    return info;
  }

  async closeTarget(targetId: string): Promise<void> {
    const h = this.handles.get(targetId);
    if (!h) return;
    await this.ps(`
$h = [IntPtr][int64]${h.hwnd}
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern int PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l); }
"@
[W]::PostMessage($h, 0x10, 0, 0) | Out-Null   # WM_CLOSE
@{ ok = $true } | ConvertTo-Json -Compress
`).catch(() => {});
    this.handles.delete(targetId);
  }

  async listTargets(): Promise<TargetInfo[]> {
    return Array.from(this.handles.values()).map((h) => h.info);
  }

  /** PrintWindow + clipboard image → base64 PNG (no cursor disturbance). */
  async screenshot(targetId: string): Promise<ScreenshotResult> {
    const h = this.must(targetId);
    const tmp = path.join(os.tmpdir(), `cu-shot-${Date.now()}.png`);
    const script = `
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public class Cap {
  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hwnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$h = [IntPtr][int64]${h.hwnd}
[Cap+RECT]$r = New-Object 'Cap+RECT'
[Cap]::GetClientRect($h, [ref]$r) | Out-Null
$w = [Math]::Max(1, $r.Right - $r.Left); $he = [Math]::Max(1, $r.Bottom - $r.Top)
$bmp = New-Object System.Drawing.Bitmap($w, $he)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[Cap]::PrintWindow($h, $hdc, 3) | Out-Null      # PW_RENDERFULLCONTENT
$g.ReleaseHdc($hdc); $g.Dispose()
$bmp.Save('${tmp.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
@{ width = $w; height = $he; path = '${tmp.replace(/\\/g, '\\\\')}' } | ConvertTo-Json -Compress
`;
    const meta = await this.ps<{ width: number; height: number; path: string }>(script, 15_000);
    const buf = fs.readFileSync(meta.path);
    try { fs.unlinkSync(meta.path); } catch { /* ignore */ }
    return { pngBase64: buf.toString('base64'), width: meta.width, height: meta.height };
  }

  async getContent(targetId: string): Promise<{ kind: 'a11y'; content: unknown }> {
    const h = this.must(targetId);
    const script = `
$null = [System.Reflection.Assembly]::LoadWithPartialName('UIAutomationClient')
$null = [System.Reflection.Assembly]::LoadWithPartialName('UIAutomationTypes')
$root = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr][int64]${h.hwnd})
function Walk($e, $depth) {
  if ($depth -gt 6) { return $null }
  $info = New-Object psobject -Property @{
    name = $e.Current.Name
    role = $e.Current.LocalizedControlType
    rect = @{ x = [int]$e.Current.BoundingRectangle.X; y = [int]$e.Current.BoundingRectangle.Y; w = [int]$e.Current.BoundingRectangle.Width; h = [int]$e.Current.BoundingRectangle.Height }
    auto = $e.Current.AutomationId
    enabled = $e.Current.IsEnabled
    value = $null
    children = @()
  }
  try { $vp = $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern); if ($vp) { $info.value = $vp.Current.Value } } catch {}
  $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
  $child = $walker.GetFirstChild($e)
  while ($child) {
    $info.children += (Walk $child ($depth + 1))
    $child = $walker.GetNextSibling($child)
  }
  return $info
}
(Walk $root 0) | ConvertTo-Json -Depth 12 -Compress
`;
    const tree = await this.ps<unknown>(script, 20_000);
    return { kind: 'a11y', content: tree };
  }

  /** Send WM_LBUTTONDOWN/UP to the window — no real cursor movement. */
  async click(targetId: string, x: number, y: number, opts?: { button?: 'left' | 'right' | 'middle' }): Promise<void> {
    const h = this.must(targetId);
    const button = opts?.button || 'left';
    const downMsg = button === 'right' ? '0x0204' : button === 'middle' ? '0x0207' : '0x0201';
    const upMsg   = button === 'right' ? '0x0205' : button === 'middle' ? '0x0208' : '0x0202';
    const lParam = (y << 16) | (x & 0xffff);
    await this.ps(`
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern int PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l); }
"@
$h = [IntPtr][int64]${h.hwnd}
[W]::PostMessage($h, ${downMsg}, [IntPtr]1, [IntPtr]${lParam}) | Out-Null
Start-Sleep -Milliseconds 30
[W]::PostMessage($h, ${upMsg}, [IntPtr]0, [IntPtr]${lParam}) | Out-Null
@{ ok = $true } | ConvertTo-Json -Compress
`);
  }

  async doubleClick(targetId: string, x: number, y: number): Promise<void> {
    await this.click(targetId, x, y);
    await new Promise((r) => setTimeout(r, 50));
    await this.click(targetId, x, y);
  }

  /** Send WM_CHAR for each character → typing without keyboard focus theft. */
  async type(targetId: string, text: string): Promise<void> {
    const h = this.must(targetId);
    const escaped = text.replace(/'/g, "''");
    await this.ps(`
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l); }
"@
$h = [IntPtr][int64]${h.hwnd}
$s = '${escaped}'
foreach ($c in $s.ToCharArray()) {
  [W]::PostMessage($h, 0x0102, [IntPtr][int]$c, [IntPtr]1) | Out-Null
  Start-Sleep -Milliseconds 5
}
@{ ok = $true; chars = $s.Length } | ConvertTo-Json -Compress
`);
  }

  /** Send WM_KEYDOWN/UP — supports simple key names. Modifier combos best-effort. */
  async key(targetId: string, combo: string): Promise<void> {
    const h = this.must(targetId);
    // Map a few common names → VKs.
    const vks: Record<string, number> = {
      enter: 0x0D, return: 0x0D, esc: 0x1B, escape: 0x1B, tab: 0x09,
      space: 0x20, backspace: 0x08, delete: 0x2E, up: 0x26, down: 0x28,
      left: 0x25, right: 0x27, home: 0x24, end: 0x23, pageup: 0x21, pagedown: 0x22,
    };
    const parts = combo.split('+').map((s) => s.trim());
    const mods = parts.slice(0, -1).map((m) => m.toLowerCase());
    const main = parts[parts.length - 1].toLowerCase();
    const vk = vks[main] || (main.length === 1 ? main.toUpperCase().charCodeAt(0) : 0);
    if (!vk) throw new CuError('E_KEY', `Unknown key "${main}"`);
    const ctrl = mods.includes('ctrl') || mods.includes('control');
    const shift = mods.includes('shift');
    const alt = mods.includes('alt');
    await this.ps(`
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern int PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l); }
"@
$h = [IntPtr][int64]${h.hwnd}
if (${ctrl ? '$true' : '$false'}) { [W]::PostMessage($h, 0x100, [IntPtr]0x11, [IntPtr]0) | Out-Null }
if (${shift ? '$true' : '$false'}) { [W]::PostMessage($h, 0x100, [IntPtr]0x10, [IntPtr]0) | Out-Null }
if (${alt ? '$true' : '$false'}) { [W]::PostMessage($h, 0x100, [IntPtr]0x12, [IntPtr]0) | Out-Null }
[W]::PostMessage($h, 0x100, [IntPtr]${vk}, [IntPtr]0) | Out-Null
Start-Sleep -Milliseconds 25
[W]::PostMessage($h, 0x101, [IntPtr]${vk}, [IntPtr]0) | Out-Null
if (${alt ? '$true' : '$false'}) { [W]::PostMessage($h, 0x101, [IntPtr]0x12, [IntPtr]0) | Out-Null }
if (${shift ? '$true' : '$false'}) { [W]::PostMessage($h, 0x101, [IntPtr]0x10, [IntPtr]0) | Out-Null }
if (${ctrl ? '$true' : '$false'}) { [W]::PostMessage($h, 0x101, [IntPtr]0x11, [IntPtr]0) | Out-Null }
@{ ok = $true } | ConvertTo-Json -Compress
`);
  }

  async scroll(targetId: string, x: number, y: number, dx: number, dy: number): Promise<void> {
    const h = this.must(targetId);
    const lParam = (y << 16) | (x & 0xffff);
    const wParam = (dy * -120) & 0xffff; // WHEEL_DELTA = 120, positive = up
    await this.ps(`
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern int PostMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l); }
"@
$h = [IntPtr][int64]${h.hwnd}
[W]::PostMessage($h, 0x020A, [IntPtr]${wParam}, [IntPtr]${lParam}) | Out-Null
@{ ok = $true } | ConvertTo-Json -Compress
`);
  }

  async size(targetId: string): Promise<Size> {
    const h = this.must(targetId);
    const r = await this.ps<{ w: number; h: number }>(`
Add-Type @"
using System; using System.Runtime.InteropServices;
public class W {
  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hwnd, out RECT lpRect);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$h = [IntPtr][int64]${h.hwnd}
[W+RECT]$r = New-Object 'W+RECT'
[W]::GetClientRect($h, [ref]$r) | Out-Null
@{ w = ($r.Right - $r.Left); h = ($r.Bottom - $r.Top) } | ConvertTo-Json -Compress
`);
    return { width: r.w, height: r.h };
  }

  async shutdown(): Promise<void> {
    for (const id of Array.from(this.handles.keys())) await this.closeTarget(id);
  }

  private must(targetId: string): Handle {
    const h = this.handles.get(targetId);
    if (!h) throw new CuError('E_NO_TARGET', `Unknown native target ${targetId}`);
    return h;
  }
}
