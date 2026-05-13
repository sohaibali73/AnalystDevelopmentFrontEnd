/**
 * Centralized configuration for the Electron wrapper.
 *
 * Two runtime modes are supported:
 *   - "remote"   (default): load a hosted Next.js app (e.g. the Vercel URL).
 *   - "embedded" (future) : start an embedded Next.js server inside Electron.
 *
 * The web build hosted on Vercel is *entirely unaffected* — this wrapper
 * only navigates Chromium to that URL.
 */

export type ElectronMode = 'remote' | 'embedded';

export interface AppConfig {
  mode: ElectronMode;
  remoteUrl: string;
  isDev: boolean;
  windowWidth: number;
  windowHeight: number;
  minWidth: number;
  minHeight: number;
}

// ⚠️ When releasing production installers, set ELECTRON_REMOTE_URL via
// electron-builder env or hard-code the canonical Vercel URL below.
const DEFAULT_PROD_URL = 'https://potomacdeveloper.vercel.app';

export function loadConfig(): AppConfig {
  const mode = (process.env.ELECTRON_MODE as ElectronMode) || 'remote';
  const isDev = process.env.ELECTRON_DEV === '1' || !!process.env.ELECTRON_IS_DEV;
  const remoteUrl =
    process.env.ELECTRON_REMOTE_URL ||
    (isDev ? 'http://localhost:3000' : DEFAULT_PROD_URL);

  return {
    mode,
    remoteUrl,
    isDev,
    windowWidth: 1440,
    windowHeight: 900,
    minWidth: 1024,
    minHeight: 640,
  };
}
