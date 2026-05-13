/**
 * Multi-tab terminal support — one `node-pty` per tab, streaming bytes to
 * the renderer over per-tab IPC channels. Each tab has a unique handleId.
 *
 * Renderer drives an `xterm.js` instance and:
 *   1. ipc.invoke('term:open', { shell?, cwd? })   → returns handleId
 *   2. ipc.send('term:data:<id>', bytes)            → user keystrokes
 *   3. ipc.on('term:out:<id>',  (e, bytes) => …)    → process output
 *   4. ipc.invoke('term:resize', id, cols, rows)
 *   5. ipc.invoke('term:close',  id)
 *
 * AI uses `terminal_run` (synchronous capture) and `terminal_stream_write`
 * (write to an existing tab to share with the user).
 */
import { ipcMain, IpcMainEvent, WebContents } from 'electron';
import { spawn as ptySpawn, IPty } from 'node-pty';
import { append as auditAppend } from '../tools/audit';
import { guardShell } from '../tools/sandbox';

interface Tab {
  pty: IPty;
  shell: string;
  cwd: string;
  webContents: WebContents;
}

const tabs = new Map<string, Tab>();
let nextId = 1;

function defaultShell(): string {
  if (process.platform === 'win32') return process.env.COMSPEC || 'powershell.exe';
  if (process.platform === 'darwin') return process.env.SHELL || '/bin/zsh';
  return process.env.SHELL || '/bin/bash';
}

export function registerTerminalIpc(): void {
  ipcMain.handle('term:open', async (e, opts: { shell?: string; cwd?: string; cols?: number; rows?: number; env?: Record<string, string> }) => {
    const id = `term-${nextId++}`;
    const shell = opts?.shell || defaultShell();
    const cwd = opts?.cwd || process.env.HOME || process.cwd();
    const pty = ptySpawn(shell, [], {
      name: 'xterm-256color',
      cols: opts?.cols || 80,
      rows: opts?.rows || 24,
      cwd,
      env: { ...process.env, ...(opts?.env || {}), TERM: 'xterm-256color' } as Record<string, string>,
    });
    tabs.set(id, { pty, shell, cwd, webContents: e.sender });
    pty.onData((data) => {
      if (!e.sender.isDestroyed()) e.sender.send(`term:out:${id}`, data);
    });
    pty.onExit(({ exitCode, signal }) => {
      if (!e.sender.isDestroyed()) e.sender.send(`term:exit:${id}`, { exitCode, signal });
      tabs.delete(id);
    });
    auditAppend({ ts: Date.now(), tool: 'terminal_open', status: 'success', args: { shell, cwd } });
    return { ok: true, result: { handleId: id, shell, cwd } };
  });

  ipcMain.on('term:data', (_e: IpcMainEvent, id: string, data: string) => {
    const t = tabs.get(id);
    if (!t) return;
    t.pty.write(data);
  });

  ipcMain.handle('term:resize', async (_e, id: string, cols: number, rows: number) => {
    const t = tabs.get(id);
    if (!t) return { ok: false, error: { code: 'E_NO_TAB', message: 'Unknown terminal id' } };
    t.pty.resize(cols, rows);
    return { ok: true };
  });

  ipcMain.handle('term:close', async (_e, id: string) => {
    const t = tabs.get(id);
    if (!t) return { ok: true };
    try { t.pty.kill(); } catch { /* ignore */ }
    tabs.delete(id);
    auditAppend({ ts: Date.now(), tool: 'terminal_close', status: 'success', args: { id } });
    return { ok: true };
  });

  // ── AI-facing tools ────────────────────────────────────────────────────
  /**
   * terminal_run — spawn a one-shot interactive command in a fresh PTY,
   * collect output until the prompt returns or timeout elapses, return it.
   */
  ipcMain.handle('term:run', async (_e, command: string, opts: { cwd?: string; timeoutMs?: number; env?: Record<string, string> } = {}) => {
    const ts = Date.now();
    try {
      await guardShell(command, []);
      auditAppend({ ts, tool: 'terminal_run', status: 'start', args: { command, opts } });
      const shell = defaultShell();
      const cwd = opts.cwd || process.env.HOME || process.cwd();
      const pty = ptySpawn(shell, [], {
        name: 'xterm-256color', cols: 120, rows: 30, cwd,
        env: { ...process.env, ...(opts.env || {}) } as Record<string, string>,
      });
      let out = '';
      pty.onData((d) => { out += d; });
      return await new Promise((resolve) => {
        const sentinel = `__POTOMAC_DONE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}__`;
        const toRun = process.platform === 'win32'
          ? `${command}\r\necho ${sentinel}\r\n`
          : `${command}\necho ${sentinel}\n`;
        pty.write(toRun);
        const timer = setTimeout(() => {
          try { pty.kill(); } catch { /* ignore */ }
          auditAppend({ ts: Date.now(), tool: 'terminal_run', status: 'error', error: 'timeout', durationMs: Date.now() - ts });
          resolve({ ok: false, error: { code: 'E_TIMEOUT', message: `Timeout after ${opts.timeoutMs || 60_000}ms`, partial: out } });
        }, opts.timeoutMs || 60_000);
        const watch = setInterval(() => {
          if (out.includes(sentinel)) {
            clearInterval(watch);
            clearTimeout(timer);
            try { pty.kill(); } catch { /* ignore */ }
            const cleanOut = out.replace(new RegExp(`echo ${sentinel}.*?\\r?\\n`, 's'), '').replace(sentinel, '').trim();
            auditAppend({ ts: Date.now(), tool: 'terminal_run', status: 'success', durationMs: Date.now() - ts });
            resolve({ ok: true, result: { stdout: cleanOut, command, durationMs: Date.now() - ts } });
          }
        }, 50);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      auditAppend({ ts: Date.now(), tool: 'terminal_run', status: 'error', error: message });
      return { ok: false, error: { code: 'E_UNKNOWN', message } };
    }
  });
}

export function shutdownTerminals(): void {
  for (const t of tabs.values()) {
    try { t.pty.kill(); } catch { /* ignore */ }
  }
  tabs.clear();
}
