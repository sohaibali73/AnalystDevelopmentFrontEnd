# Potomac Analyst Workbench — Electron Wrapper

This folder contains a **standalone** Electron desktop wrapper for the
Next.js frontend. It is intentionally isolated from the root project so
that the **Vercel web deployment is completely unaffected**:

- Vercel still runs `next build` on the repo root.
- This folder has its own `package.json`, `node_modules`, and build pipeline.
- `electron/` is excluded from the Vercel build via `.vercelignore`.

## Modes

| Mode | What it does | When to use |
| --- | --- | --- |
| `remote` (default) | Loads the hosted Next.js app (Vercel URL) inside a Chromium window | Ship a desktop app immediately with zero changes to the web app |
| `embedded` (TODO) | Spawns a local Next.js prod server inside the main process | Offline support / fully self-contained installer |

The mode is controlled at runtime via the `ELECTRON_MODE` environment
variable. The target URL for `remote` mode is controlled via
`ELECTRON_REMOTE_URL`.

## Quick start

```powershell
# From repo root, install electron's deps (separate node_modules tree)
cd electron
npm install

# Run against your local `next dev` (start `npm run dev` in the repo root first)
npm run dev

# Run against the live Vercel deployment
npm run dev:vercel

# Build a Windows installer (NSIS + portable .exe)
npm run dist:win
```

Output installers land in `electron/out/`.

## Files

| Path | Purpose |
| --- | --- |
| `src/main.ts` | Main process: window, menu, IPC, navigation guards |
| `src/preload.ts` | Safely exposes `window.electronAPI` to the renderer |
| `src/config.ts` | Runtime configuration (mode, URLs, dimensions) |
| `resources/` | App icons (drop `icon.ico` / `icon.icns` / `icon.png` here) |

## Icons

Place these files in `electron/resources/`:

- `icon.ico`  — Windows (256×256 recommended)
- `icon.icns` — macOS
- `icon.png`  — Linux (512×512)

You can generate all three from the existing `Potomac-icon.png` at the
repo root using any icon converter (e.g. https://cloudconvert.com).

## Production URL

Update `DEFAULT_PROD_URL` in `src/config.ts` (or set `ELECTRON_REMOTE_URL`
at build time) to point at your canonical Vercel domain.

## Auth (next-auth)

Because `remote` mode just navigates Chromium to the Vercel URL,
next-auth's HTTP-only session cookies work transparently and persist
across launches (stored in the Electron user-data dir). No changes
needed to the web app's auth configuration.

## CI / release (future)

A GitHub Actions workflow can build per-platform installers on tags
matching `electron-v*` and publish them as a GitHub Release. This is
not wired up yet — see project root TODOs.
