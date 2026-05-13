/**
 * Lightweight window state persistence (size, position, maximized, zoom)
 * stored in the Electron user-data dir as `window-state.json`.
 */
import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
  isFullScreen?: boolean;
  zoomLevel?: number;
  lastUrl?: string;
}

const FILE_NAME = 'window-state.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE_NAME);
}

export function loadWindowState(defaults: WindowState): WindowState {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    const parsed = JSON.parse(raw) as WindowState;
    // Validate the position is on a visible display; fall back if not.
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      const visible = screen.getAllDisplays().some((d) => {
        const { x, y, width, height } = d.bounds;
        return (
          parsed.x! >= x &&
          parsed.y! >= y &&
          parsed.x! + parsed.width <= x + width &&
          parsed.y! + parsed.height <= y + height
        );
      });
      if (!visible) {
        delete parsed.x;
        delete parsed.y;
      }
    }
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function attachWindowStateTracking(win: BrowserWindow): void {
  let saveTimer: NodeJS.Timeout | null = null;

  const save = () => {
    if (win.isDestroyed()) return;
    try {
      const isMaximized = win.isMaximized();
      const isFullScreen = win.isFullScreen();
      const bounds = !isMaximized && !isFullScreen ? win.getNormalBounds() : win.getBounds();
      const state: WindowState = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized,
        isFullScreen,
        zoomLevel: win.webContents.getZoomLevel(),
        lastUrl: win.webContents.getURL(),
      };
      fs.writeFileSync(filePath(), JSON.stringify(state, null, 2), 'utf-8');
    } catch {
      /* ignore */
    }
  };

  const debounced = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  };

  win.on('resize', debounced);
  win.on('move', debounced);
  win.on('maximize', debounced);
  win.on('unmaximize', debounced);
  win.on('enter-full-screen', debounced);
  win.on('leave-full-screen', debounced);
  win.webContents.on('zoom-changed', debounced);
  win.on('close', save);
}
