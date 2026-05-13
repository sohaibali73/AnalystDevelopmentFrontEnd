/**
 * In-process splash screen shown while the remote Vercel URL loads.
 * Embeds the brand mark as a base64 data URI so it ships inside the asar
 * and renders instantly with zero file I/O from the renderer.
 */
import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

function readLogoDataUri(): string {
  const candidates = [
    path.join(__dirname, '..', 'resources', 'splash-logo.png'),
    path.join(__dirname, '..', 'resources', 'logo-mark.png'),
    path.join(__dirname, '..', 'resources', 'icon.png'),
    path.join(process.resourcesPath || '', 'splash-logo.png'),
    path.join(process.resourcesPath || '', 'logo-mark.png'),
    path.join(process.resourcesPath || '', 'icon.png'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch {
      /* ignore */
    }
  }
  return '';
}

function buildHtml(version: string, logoDataUri: string): string {
  const logoTag = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" alt="Potomac" />`
    : '<div class="logo placeholder">⬢</div>';
  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Potomac Analyst Workbench</title>
<style>
  :root { color-scheme: dark; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: radial-gradient(1200px 600px at 50% 30%, #1a1a1a 0%, #0a0a0a 60%, #050505 100%);
    color: #e5e5e5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
    user-select: none;
    -webkit-app-region: drag;
  }
  .wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 22px; padding: 24px;
  }
  .logo {
    width: 96px; height: 96px; object-fit: contain;
    filter: drop-shadow(0 6px 24px rgba(0,0,0,0.6));
    animation: pulse 2.2s ease-in-out infinite;
  }
  .logo.placeholder {
    display: flex; align-items: center; justify-content: center;
    font-size: 64px; color: #e5e5e5;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.78; transform: scale(0.97); }
  }
  .brand {
    font-size: 15px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #d4d4d4; font-weight: 600;
  }
  .sub {
    font-size: 11px; color: #777; letter-spacing: 0.08em;
    display: flex; align-items: center; gap: 8px;
  }
  .dot-anim {
    width: 6px; height: 6px; border-radius: 50%; background: #e5e5e5;
    animation: blink 1.2s ease-in-out infinite;
  }
  @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  .ver {
    position: absolute; bottom: 14px; right: 18px;
    font-size: 10px; color: #4a4a4a; letter-spacing: 0.1em;
  }
</style>
</head>
<body>
  <div class="wrap">
    ${logoTag}
    <div class="brand">Potomac Analyst Workbench</div>
    <div class="sub"><span class="dot-anim"></span> Connecting…</div>
  </div>
  <div class="ver">v${version}</div>
</body>
</html>
`.trim();
}

export function createSplashWindow(version: string): BrowserWindow {
  const splash = new BrowserWindow({
    width: 480,
    height: 340,
    frame: false,
    resizable: false,
    movable: true,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const html = buildHtml(version, readLogoDataUri());
  splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  splash.once('ready-to-show', () => splash.show());
  return splash;
}
