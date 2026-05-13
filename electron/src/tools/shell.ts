/**
 * Shell tools — full power as requested.
 *
 * `shell_run` returns stdout/stderr after the process exits.
 * `shell_spawn_stream` returns a handle; subsequent events stream back to the
 * renderer over a dedicated IPC channel. The renderer can call `shell_kill`
 * to terminate.
 *
 * No artificial concurrency cap. Kill switch terminates all tracked processes.
 */
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { shell, WebContents } from 'electron';
import { guardShell, killSwitchEngaged } from './sandbox';

const processes = new Map<string, ChildProcess>();

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export async function run(
  command: string,
  args: string[] = [],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; shell?: boolean } = {},
): Promise<RunResult> {
  await guardShell(command, args);
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const spawnOpts: SpawnOptions = {
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env || {}) },
      shell: opts.shell ?? false,
      windowsHide: true,
    };
    let proc: ChildProcess;
    try {
      proc = spawn(command, args, spawnOpts);
    } catch (err) {
      reject(err);
      return;
    }
    const id = `${proc.pid || 'noPid'}-${Date.now()}`;
    processes.set(id, proc);

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (b) => { stdout += b.toString(); });
    proc.stderr?.on('data', (b) => { stderr += b.toString(); });

    let timer: NodeJS.Timeout | null = null;
    if (opts.timeoutMs && opts.timeoutMs > 0) {
      timer = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
      }, opts.timeoutMs);
    }

    proc.on('close', (code, signal) => {
      if (timer) clearTimeout(timer);
      processes.delete(id);
      resolve({ exitCode: code, signal, stdout, stderr, durationMs: Date.now() - start });
    });
    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      processes.delete(id);
      reject(err);
    });
  });
}

export async function spawnStream(
  webContents: WebContents,
  command: string,
  args: string[] = [],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean } = {},
): Promise<{ handleId: string; pid: number | undefined }> {
  await guardShell(command, args);
  const spawnOpts: SpawnOptions = {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
    shell: opts.shell ?? false,
    windowsHide: true,
  };
  const proc = spawn(command, args, spawnOpts);
  const id = `${proc.pid || 'noPid'}-${Date.now()}`;
  processes.set(id, proc);

  const emit = (channel: string, payload: unknown) => {
    if (!webContents.isDestroyed()) {
      webContents.send(`shell:stream:${id}`, { channel, payload });
    }
  };

  proc.stdout?.on('data', (b) => emit('stdout', b.toString()));
  proc.stderr?.on('data', (b) => emit('stderr', b.toString()));
  proc.on('close', (code, signal) => {
    processes.delete(id);
    emit('close', { exitCode: code, signal });
  });
  proc.on('error', (err) => emit('error', { message: err.message }));

  return { handleId: id, pid: proc.pid };
}

export function kill(handleId: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
  const proc = processes.get(handleId);
  if (!proc) return false;
  try {
    proc.kill(signal);
    return true;
  } catch {
    return false;
  }
}

/** Called by the kill-switch UI to terminate every running process. */
export function killAll(): number {
  let n = 0;
  for (const [id, proc] of processes.entries()) {
    try { proc.kill('SIGKILL'); n++; } catch { /* ignore */ }
    processes.delete(id);
  }
  return n;
}

export async function openPath(target: string): Promise<{ ok: boolean; error?: string }> {
  if (killSwitchEngaged()) return { ok: false, error: 'kill switch engaged' };
  // shell.openPath is path-only; shell.openExternal handles URLs.
  if (/^https?:\/\//i.test(target) || /^mailto:/i.test(target)) {
    try { await shell.openExternal(target); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; }
  }
  const err = await shell.openPath(target);
  if (err) return { ok: false, error: err };
  return { ok: true };
}
