/**
 * Offline / load-failure page rendered from a data: URL, with a Retry button
 * that posts back to the main process via a custom protocol-less mechanism:
 * the page sets `location.href = 'about:blank#retry'` and the main process
 * listens for `did-navigate-in-page`.
 */
import * as fs from 'fs';
import * as path from 'path';

function readLogoDataUri(): string {
  const candidates = [
    path.join(__dirname, '..', 'resources', 'logo-mark.png'),
    path.join(__dirname, '..', 'resources', 'icon.png'),
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

export function buildErrorPageUrl(opts: {
  message: string;
  code?: number | string;
  url: string;
  version: string;
}): string {
  const logoUri = readLogoDataUri();
  const logoTag = logoUri
    ? `<img class="logo" src="${logoUri}" alt="Potomac" />`
    : '<div class="icon">⚡</div>';
  const html = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Connection problem</title>
<style>
  :root { color-scheme: dark; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: radial-gradient(1200px 600px at 50% 30%, #1a1a1a 0%, #0a0a0a 60%, #050505 100%);
    color: #e5e5e5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 18px; padding: 32px; text-align: center;
  }
  h1 { font-size: 22px; font-weight: 600; margin: 0; color: #f5f5f5; }
  p { font-size: 14px; line-height: 1.55; color: #a3a3a3; max-width: 520px; margin: 0; }
  .meta { font-size: 11px; color: #555; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .row { display: flex; gap: 10px; margin-top: 12px; }
  button, a.btn {
    appearance: none; border: 1px solid #2a2a2a; background: #111;
    color: #e5e5e5; padding: 10px 18px; border-radius: 8px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
    text-decoration: none;
  }
  button:hover, a.btn:hover { background: #1a1a1a; border-color: #3a3a3a; }
  button.primary { background: #e5e5e5; color: #0a0a0a; border-color: #e5e5e5; }
  button.primary:hover { background: #fff; border-color: #fff; }
  .icon { font-size: 38px; opacity: 0.8; }
  .logo { width: 72px; height: 72px; object-fit: contain; opacity: 0.9; filter: drop-shadow(0 4px 14px rgba(0,0,0,0.5)); }
  .dot { position: absolute; bottom: 14px; right: 18px; font-size: 10px; color: #4a4a4a; letter-spacing: 0.1em; }
</style>
</head>
<body>
  <div class="wrap">
    ${logoTag}
    <h1>Can't reach Potomac</h1>
    <p>${escapeHtml(opts.message || 'The application could not connect to the server.')}</p>
    <p class="meta">${escapeHtml(opts.url)}${opts.code ? ' · ' + escapeHtml(String(opts.code)) : ''}</p>
    <div class="row">
      <button class="primary" onclick="location.hash='retry-'+Date.now()">Retry</button>
      <button onclick="location.hash='quit-'+Date.now()">Quit</button>
    </div>
  </div>
  <div class="dot">v${escapeHtml(opts.version)}</div>
</body>
</html>
`.trim();
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
