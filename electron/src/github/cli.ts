/**
 * GitHub PR / issue tools — wraps the `gh` CLI which the user has already
 * authenticated (we don't manage OAuth here). Every tool spawns `gh` and
 * returns its parsed JSON / text output.
 *
 * If `gh` is missing, the first call returns a clear E_GH_MISSING error so
 * the renderer can prompt the user to install it.
 */
import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import { append as auditAppend } from '../tools/audit';
import { guardShell } from '../tools/sandbox';

function runGh(args: string[], opts: { input?: string; cwd?: string } = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args, {
      cwd: opts.cwd,
      windowsHide: true,
      env: process.env as Record<string, string>,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (b) => { stdout += b.toString(); });
    proc.stderr.on('data', (b) => { stderr += b.toString(); });
    proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        const e = new Error('GitHub CLI (gh) not installed or not in PATH.') as NodeJS.ErrnoException;
        e.code = 'E_GH_MISSING';
        reject(e);
      } else reject(err);
    });
    proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
    if (opts.input) {
      proc.stdin.write(opts.input);
      proc.stdin.end();
    }
  });
}

function wrap<T>(name: string) {
  return async (impl: () => Promise<T>): Promise<{ ok: boolean; result?: T; error?: { code: string; message: string } }> => {
    const ts = Date.now();
    auditAppend({ ts, tool: name, status: 'start' });
    try {
      const r = await impl();
      auditAppend({ ts: Date.now(), tool: name, status: 'success', durationMs: Date.now() - ts });
      return { ok: true, result: r };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code || 'E_UNKNOWN';
      auditAppend({ ts: Date.now(), tool: name, status: 'error', error: message, durationMs: Date.now() - ts });
      return { ok: false, error: { code, message } };
    }
  };
}

export function registerGithubIpc(): void {
  ipcMain.handle('gh:list-prs', (_e, repo: string, state: 'open' | 'closed' | 'merged' | 'all' = 'open') =>
    wrap('github_list_prs')(async () => {
      const { stdout } = await runGh(['pr', 'list', '-R', repo, '-s', state, '--json', 'number,title,author,state,url,createdAt,headRefName,baseRefName']);
      return JSON.parse(stdout);
    }),
  );
  ipcMain.handle('gh:pr-diff', (_e, repo: string, pr: number) =>
    wrap('github_pr_diff')(async () => {
      const { stdout } = await runGh(['pr', 'diff', String(pr), '-R', repo]);
      return { diff: stdout };
    }),
  );
  ipcMain.handle('gh:pr-comment', (_e, repo: string, pr: number, body: string) =>
    wrap('github_pr_comment')(async () => {
      await guardShell('gh', ['pr', 'comment']);
      const { stdout, stderr, exitCode } = await runGh(['pr', 'comment', String(pr), '-R', repo, '-b', body]);
      if (exitCode !== 0) throw new Error(stderr || 'gh failed');
      return { url: stdout.trim() };
    }),
  );
  ipcMain.handle('gh:pr-review', (_e, repo: string, pr: number, opts: { event: 'approve' | 'request_changes' | 'comment'; body?: string }) =>
    wrap('github_pr_review')(async () => {
      await guardShell('gh', ['pr', 'review']);
      const args = ['pr', 'review', String(pr), '-R', repo];
      if (opts.event === 'approve') args.push('--approve');
      else if (opts.event === 'request_changes') args.push('--request-changes');
      else args.push('--comment');
      if (opts.body) { args.push('-b', opts.body); }
      const { stdout, stderr, exitCode } = await runGh(args);
      if (exitCode !== 0) throw new Error(stderr || 'gh failed');
      return { stdout };
    }),
  );
  ipcMain.handle('gh:clone', (_e, repo: string, dest?: string) =>
    wrap('github_clone')(async () => {
      await guardShell('gh', ['repo', 'clone']);
      const args = ['repo', 'clone', repo];
      if (dest) args.push(dest);
      const { stdout, stderr, exitCode } = await runGh(args);
      if (exitCode !== 0) throw new Error(stderr || 'gh failed');
      return { stdout, dest };
    }),
  );
  ipcMain.handle('gh:status', () =>
    wrap('github_status')(async () => {
      const { stdout, exitCode } = await runGh(['auth', 'status']);
      return { authenticated: exitCode === 0, info: stdout };
    }),
  );
}
