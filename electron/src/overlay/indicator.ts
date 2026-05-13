/**
 * Always-on-top, frameless, click-through-ish indicator that appears whenever
 * a computer-use tool is active. Shows a pulsing red dot + the last action
 * label, auto-hides 1.5 s after activity stops.
 *
 * Pinned to the top-right of the primary display.
 */
import { BrowserWindow, screen } from 'electron';

let win: BrowserWindow | null = null;
let hideTimer: NodeJS.Timeout | null = null;

const HTML = `
<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  html,body { margin:0; padding:0; height:100%; background: transparent;
    font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #fff; user-select: none; -webkit-user-select: none;
  }
  .bar {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(20,20,20,0.92);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    padding: 8px 14px; border-radius: 999px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.35);
    -webkit-app-region: drag;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
    box-shadow: 0 0 8px #ef4444;
    animation: pulse 1s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.9); } }
  .label { letter-spacing: 0.02em; font-weight: 500; }
  .action { color: #d4d4d4; font-weight: 400; opacity: 0.85; }
</style></head>
<body>
  <div class="bar">
    <span class="dot"></span>
    <span class="label">AI controlling computer</span>
    <span class="action" id="action"></span>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('overlay:action', (_e, action) => {
      document.getElementById('action').textContent = action ? '· ' + action : '';
    });
  </script>
</body></html>
`.trim();

function ensureWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) return win;
  const primary = screen.getPrimaryDisplay();
  const W = 280;
  const H = 44;
  win = new BrowserWindow({
    width: W,
    height: H,
    x: primary.workArea.x + primary.workArea.width - W - 12,
    y: primary.workArea.y + 12,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(false);
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(HTML));
  return win;
}

export function pulse(action?: string): void {
  try {
    const w = ensureWindow();
    if (!w.isVisible()) w.showInactive();
    w.webContents.send('overlay:action', action || '');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (win && !win.isDestroyed()) win.hide();
    }, 1500);
  } catch {
    /* ignore */
  }
}

export function destroyOverlay(): void {
  if (win && !win.isDestroyed()) win.destroy();
  win = null;
  if (hideTimer) clearTimeout(hideTimer);
}
