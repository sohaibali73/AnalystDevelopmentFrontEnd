/**
 * Electron main process — Potomac Analyst Workbench desktop wrapper.
 *
 * UX features:
 *   - Persistent window state (size, position, maximized, zoom, last URL)
 *   - Splash screen during initial load + retry-able error page
 *   - Native right-click context menu (spellcheck, links, images, edit)
 *   - Smart external-link handling (cross-origin nav → OS browser)
 *   - System theme propagation via `nativeTheme`
 *   - Online/offline detection forwarded to the renderer
 *   - Global keyboard shortcuts (zoom, reload, dev tools, find-in-page)
 *   - Hardware-acceleration friendly defaults, Windows jump list, dock badge
 *   - Single-instance lock with focus-on-relaunch
 *   - Custom UA tag so the Vercel app can detect the desktop client
 */
import {
  app,
  BrowserWindow,
  Menu,
  shell,
  ipcMain,
  session,
  nativeTheme,
  net,
  globalShortcut,
  dialog,
  MenuItemConstructorOptions,
} from 'electron';
import * as path from 'path';
import { loadConfig } from './config';
import { attachWindowStateTracking, loadWindowState } from './window-state';
import { createSplashWindow } from './splash';
import { attachContextMenu } from './context-menu';
import { buildErrorPageUrl } from './error-page';
import { registerAllTools } from './tools/registry';
import { registerSettingsIpc } from './settings/ipc';
import { ensureWorkspace } from './tools/fs';
import { getStore } from './settings/store';
import { killAll as killAllShellProcs } from './tools/shell';
import { destroyOverlay } from './overlay/indicator';
import { registerCuTools, shutdownCu } from './cu/registry';
import { registerTerminalIpc, shutdownTerminals } from './terminals/pty';
import { registerGithubIpc } from './github/cli';
import { registerSshIpc, shutdownSsh } from './ssh/client';
import { registerMcpIpc, startMcpServers, shutdownMcp } from './mcp/client';

const config = loadConfig();
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let isOnline = true;
let lastLoadFailed = false;

// ── Single-instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── App-level perf hints ─────────────────────────────────────────────────────
app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling'); // avoid stealing OS media keys

function resolveIcon(): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  const ext = process.platform === 'win32' ? 'ico' : process.platform === 'darwin' ? 'icns' : 'png';
  const candidates = [
    path.join(__dirname, '..', 'resources', `icon.${ext}`),
    path.join(process.resourcesPath || '', `icon.${ext}`),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

async function loadRemote(win: BrowserWindow): Promise<void> {
  lastLoadFailed = false;
  try {
    await win.loadURL(config.remoteUrl);
  } catch (err) {
    // Will be handled by `did-fail-load` listener.
  }
}

async function createMainWindow(): Promise<void> {
  const defaults = {
    width: config.windowWidth,
    height: config.windowHeight,
  };
  const state = loadWindowState(defaults);

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: config.minWidth,
    minHeight: config.minHeight,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
    icon: resolveIcon(),
    title: 'Potomac Analyst Workbench',
    autoHideMenuBar: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload uses ipcRenderer
      spellcheck: true,
      webSecurity: true,
      backgroundThrottling: false, // keep AI streams alive when window is in background
      v8CacheOptions: 'code',
    },
  });

  if (state.isMaximized) mainWindow.maximize();
  if (state.isFullScreen) mainWindow.setFullScreen(true);
  if (typeof state.zoomLevel === 'number') {
    mainWindow.webContents.setZoomLevel(state.zoomLevel);
  }

  attachWindowStateTracking(mainWindow);
  attachContextMenu(mainWindow);

  // ── Window lifecycle ──
  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // External links: window.open() and target=_blank
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  // Cross-origin navigation → OS browser; same-origin stays inside Electron.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url);
      // Allow data: (error/splash pages) and file: navigations.
      if (target.protocol === 'data:' || target.protocol === 'file:' || target.protocol === 'about:') return;
      const current = new URL(mainWindow!.webContents.getURL() || config.remoteUrl);
      if (target.host !== current.host) {
        event.preventDefault();
        shell.openExternal(url).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  });

  // Handle navigation to error-page hash buttons (#retry-..., #quit-...).
  mainWindow.webContents.on('did-navigate-in-page', (_e, url) => {
    if (url.includes('#retry-')) {
      void loadRemote(mainWindow!);
    } else if (url.includes('#quit-')) {
      app.quit();
    }
  });

  // Load failure → show retry-able error page (offline, DNS, 5xx, etc.)
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    // -3 = ABORTED (in-page navigation); ignore.
    if (errorCode === -3) return;
    lastLoadFailed = true;
    const pageUrl = buildErrorPageUrl({
      message: errorDescription || 'Network connection lost.',
      code: errorCode,
      url: validatedURL || config.remoteUrl,
      version: app.getVersion(),
    });
    mainWindow?.loadURL(pageUrl).catch(() => {});
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!lastLoadFailed) {
      // Cache last successful URL for diagnostics.
    }
  });

  // Forward unhandled crashes to a friendly dialog.
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    if (details.reason === 'clean-exit') return;
    dialog
      .showMessageBox(mainWindow!, {
        type: 'error',
        title: 'Renderer crashed',
        message: 'The application window has stopped responding.',
        detail: `Reason: ${details.reason}\nExit code: ${details.exitCode}`,
        buttons: ['Reload', 'Quit'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) mainWindow?.webContents.reload();
        else app.quit();
      });
  });

  // Spellcheck languages (covers most users; auto-detects with locale).
  try {
    mainWindow.webContents.session.setSpellCheckerLanguages([app.getLocale().split('-')[0] || 'en-US']);
  } catch {
    /* ignore unsupported locales */
  }

  // Custom UA tag so the Next.js app can detect the desktop client.
  const ua = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${ua} PotomacDesktop/${app.getVersion()}`);

  if (config.mode === 'embedded') {
    throw new Error('Embedded mode is not yet implemented in this build.');
  }

  await loadRemote(mainWindow);

  if (config.isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ── Application menu (full keyboard-shortcut coverage) ───────────────────────
function buildMenu(): void {
  const isMac = process.platform === 'darwin';
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ] as MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => createMainWindow().catch(() => {}),
        },
        { type: 'separator' },
        {
          label: 'Open in Browser',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            const url = mainWindow?.webContents.getURL() || config.remoteUrl;
            shell.openExternal(url).catch(() => {});
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find in Page',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F', modifiers: ['control'] }),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (!mainWindow) return;
            if (lastLoadFailed) void loadRemote(mainWindow);
            else mainWindow.webContents.reload();
          },
        },
        {
          label: 'Hard Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow?.webContents.reloadIgnoringCache(),
        },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomLevel(0),
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.setZoomLevel(Math.min(5, mainWindow.webContents.getZoomLevel() + 0.5));
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.setZoomLevel(Math.max(-3, mainWindow.webContents.getZoomLevel() - 0.5));
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: isMac ? 'Cmd+[' : 'Alt+Left',
          click: () => {
            if (mainWindow?.webContents.canGoBack()) mainWindow.webContents.goBack();
          },
        },
        {
          label: 'Forward',
          accelerator: isMac ? 'Cmd+]' : 'Alt+Right',
          click: () => {
            if (mainWindow?.webContents.canGoForward()) mainWindow.webContents.goForward();
          },
        },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Home',
          click: () => mainWindow && void loadRemote(mainWindow),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? ([{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }] as MenuItemConstructorOptions[])
          : ([{ role: 'close' }] as MenuItemConstructorOptions[])),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Open Web Version',
          click: () => shell.openExternal(config.remoteUrl),
        },
        {
          label: 'About',
          click: () => {
            dialog
              .showMessageBox({
                type: 'info',
                title: 'About Potomac Analyst Workbench',
                message: 'Potomac Analyst Workbench',
                detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode: ${process.versions.node}\n\nConnected to: ${config.remoteUrl}`,
                buttons: ['OK'],
              })
              .catch(() => {});
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
function registerIpc(): void {
  ipcMain.handle('app:open-external', async (_e, url: string) => {
    if (typeof url !== 'string') return false;
    try {
      await shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:reload', () => mainWindow?.webContents.reload());
  ipcMain.handle('app:minimize', () => mainWindow?.minimize());
  ipcMain.handle('app:toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('app:quit', () => app.quit());
}

// ── OS theme propagation ─────────────────────────────────────────────────────
function watchTheme(): void {
  const send = () => {
    const theme: 'light' | 'dark' = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:theme-change', theme);
    }
  };
  nativeTheme.on('updated', send);
}

// ── Online/offline detection ─────────────────────────────────────────────────
function watchNetwork(): void {
  let timer: NodeJS.Timeout | null = null;
  const check = () => {
    const online = net.isOnline();
    if (online !== isOnline) {
      isOnline = online;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:network', online);
      }
      // Auto-recover from the error page when network returns.
      if (online && lastLoadFailed && mainWindow) {
        void loadRemote(mainWindow);
      }
    }
  };
  timer = setInterval(check, 4000);
  app.on('before-quit', () => {
    if (timer) clearInterval(timer);
  });
}

// ── Windows jump list (Recent / Tasks) ───────────────────────────────────────
function configureJumpList(): void {
  if (process.platform !== 'win32') return;
  try {
    app.setUserTasks([
      {
        program: process.execPath,
        arguments: '',
        iconPath: process.execPath,
        iconIndex: 0,
        title: 'New Window',
        description: 'Open a new Potomac Analyst Workbench window',
      },
    ]);
  } catch {
    /* ignore */
  }
}

// ── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.potomac.analyst-workbench');
  }

  // Set persistent UA on the default session (covers all requests).
  session.defaultSession.setUserAgent(
    `${session.defaultSession.getUserAgent()} PotomacDesktop/${app.getVersion()}`,
  );

  registerIpc();
  registerSettingsIpc();
  registerAllTools();
  registerCuTools();
  registerTerminalIpc();
  registerGithubIpc();
  registerSshIpc();
  registerMcpIpc();
  void startMcpServers();
  ensureWorkspace();
  buildMenu();
  configureJumpList();
  watchTheme();
  watchNetwork();

  // Show splash immediately for perceived performance.
  splashWindow = createSplashWindow(app.getVersion());

  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      splashWindow = createSplashWindow(app.getVersion());
      await createMainWindow();
    }
  });

  // Global shortcut: Ctrl/Cmd+Shift+L to focus the window from anywhere.
  try {
    globalShortcut.register('CommandOrControl+Shift+L', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch {
    /* ignore */
  }

  // ── KILL SWITCH: Ctrl+Shift+Esc engages panic mode ────────────────────────
  try {
    globalShortcut.register('CommandOrControl+Shift+Escape', () => {
      getStore().patch({ killSwitch: true });
      const n = killAllShellProcs();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('settings:kill-switch-changed', true);
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Agent kill switch engaged',
          message: 'All tool execution is now disabled.',
          detail: `Terminated ${n} running shell process(es).\n\nUnlock from Settings using your passcode to resume.`,
          buttons: ['OK'],
        });
      }
    });
  } catch {
    /* ignore */
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  destroyOverlay();
  try { killAllShellProcs(); } catch { /* ignore */ }
  void shutdownCu();
  shutdownTerminals();
  shutdownSsh();
  void shutdownMcp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Harden: block all permission requests by default; allow only clipboard + notifications.
app.on('web-contents-created', (_e, contents) => {
  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed: string[] = ['clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen', 'media'];
    callback(allowed.includes(permission));
  });
});
