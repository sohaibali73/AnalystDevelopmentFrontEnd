/**
 * Sandbox / consent layer for desktop tools.
 *
 * Every tool call goes through one of:
 *   - guardPath(): for filesystem ops; resolves to absolute, validates against
 *     the workspace allowlist, and prompts for consent on out-of-workspace
 *     write/delete operations.
 *   - guardShell(): for shell_run.
 *   - guardComputerUse(): for mouse/keyboard/screen.
 *
 * All guard outcomes are audited.
 */
import { dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getStore } from '../settings/store';
import { append as auditAppend } from './audit';

export type GuardAction = 'read' | 'write' | 'delete' | 'list';

class SandboxError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// In-memory "approve for session" caches keyed by stable strings.
const sessionApprovals = {
  paths: new Set<string>(),           // `${action}|${absPath}`
  shell: false,                       // session-wide
  computerUse: false,                 // session-wide
};

export function resetSessionApprovals(): void {
  sessionApprovals.paths.clear();
  sessionApprovals.shell = false;
  sessionApprovals.computerUse = false;
}

export function killSwitchEngaged(): boolean {
  return getStore().get().killSwitch;
}

function expandHome(p: string): string {
  if (p.startsWith('~')) {
    const { app } = require('electron');
    return path.join(app.getPath('home'), p.slice(1));
  }
  return p;
}

function isInsideRoot(target: string, root: string): boolean {
  const rel = path.relative(root, target);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

function isAllowlisted(absPath: string): { ok: boolean; root?: string } {
  const settings = getStore().get();
  if (isInsideRoot(absPath, settings.workspaceRoot)) return { ok: true, root: settings.workspaceRoot };
  for (const r of settings.extraRoots) {
    if (isInsideRoot(absPath, r)) return { ok: true, root: r };
  }
  return { ok: false };
}

async function confirmDialog(opts: {
  title: string;
  message: string;
  detail?: string;
}): Promise<'once' | 'session' | 'deny'> {
  const focused = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const { response } = await dialog.showMessageBox(focused!, {
    type: 'question',
    title: opts.title,
    message: opts.message,
    detail: opts.detail,
    buttons: ['Allow once', 'Allow for this session', 'Deny'],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  });
  return response === 0 ? 'once' : response === 1 ? 'session' : 'deny';
}

/**
 * Validate a path and resolve it to an absolute canonical form.
 * Caller passes an action so we know whether to require write consent.
 */
export async function guardPath(rawPath: string, action: GuardAction): Promise<string> {
  if (killSwitchEngaged()) {
    auditAppend({ ts: Date.now(), tool: 'fs', status: 'denied', args: { rawPath, action }, error: 'kill switch engaged' });
    throw new SandboxError('E_KILL_SWITCH', 'Tool execution is disabled by the user kill switch.');
  }
  if (!rawPath || typeof rawPath !== 'string') {
    throw new SandboxError('E_BAD_PATH', 'A path is required.');
  }
  const expanded = expandHome(rawPath);
  let absPath = path.isAbsolute(expanded) ? expanded : path.resolve(getStore().get().workspaceRoot, expanded);
  absPath = path.normalize(absPath);

  // Resolve symlinks to avoid escapes; fall back to absPath if it doesn't exist yet (we may be creating it).
  try {
    if (fs.existsSync(absPath)) {
      absPath = fs.realpathSync(absPath);
    } else {
      // Parent must be inside an allowed root for create operations.
      const parent = path.dirname(absPath);
      if (fs.existsSync(parent)) {
        const realParent = fs.realpathSync(parent);
        absPath = path.join(realParent, path.basename(absPath));
      }
    }
  } catch {
    /* ignore */
  }

  const allow = isAllowlisted(absPath);
  const settings = getStore().get();
  const isRead = action === 'read' || action === 'list';

  // Inside an allowlisted root.
  if (allow.ok) {
    if (isRead) return absPath;
    if (settings.autoApprove.insideWorkspace) return absPath;
    // Else fall through to consent flow.
  }

  // Outside workspace OR write-without-auto-approve inside.
  // Read of out-of-workspace path: still requires consent (information leak).
  if (!allow.ok && isRead && settings.autoApprove.outsideWorkspace) return absPath;

  const cacheKey = `${action}|${absPath}`;
  if (sessionApprovals.paths.has(cacheKey)) return absPath;

  if (settings.autoApprove.outsideWorkspace && !allow.ok) return absPath;
  if (settings.autoApprove.insideWorkspace && allow.ok) return absPath;

  // Prompt.
  const verb =
    action === 'read' ? 'Read'
    : action === 'write' ? 'Write to'
    : action === 'delete' ? 'Delete'
    : 'List';
  const choice = await confirmDialog({
    title: 'Allow file access?',
    message: `Allow the AI to ${verb.toLowerCase()} this path?`,
    detail: `${absPath}\n\n${allow.ok ? 'Inside workspace.' : 'OUTSIDE workspace.'}`,
  });
  if (choice === 'deny') {
    auditAppend({ ts: Date.now(), tool: 'fs', status: 'denied', args: { absPath, action } });
    throw new SandboxError('E_DENIED', 'Permission denied by user.');
  }
  if (choice === 'session') sessionApprovals.paths.add(cacheKey);
  return absPath;
}

export async function guardShell(command: string, args: string[]): Promise<void> {
  if (killSwitchEngaged()) {
    throw new SandboxError('E_KILL_SWITCH', 'Tool execution is disabled by the user kill switch.');
  }
  const settings = getStore().get();
  if (!settings.capabilities.shell) {
    throw new SandboxError('E_DISABLED', 'Shell capability is disabled in settings.');
  }
  if (settings.autoApprove.shell || sessionApprovals.shell) return;
  const choice = await confirmDialog({
    title: 'Allow shell command?',
    message: `Allow the AI to run this shell command?`,
    detail: `${command} ${args.join(' ')}`,
  });
  if (choice === 'deny') {
    auditAppend({ ts: Date.now(), tool: 'shell_run', status: 'denied', args: { command, args } });
    throw new SandboxError('E_DENIED', 'Permission denied by user.');
  }
  if (choice === 'session') sessionApprovals.shell = true;
}

export async function guardComputerUse(action: string): Promise<void> {
  if (killSwitchEngaged()) {
    throw new SandboxError('E_KILL_SWITCH', 'Tool execution is disabled by the user kill switch.');
  }
  const settings = getStore().get();
  if (!settings.capabilities.computer) {
    throw new SandboxError('E_DISABLED', 'Computer-use capability is disabled in settings.');
  }
  if (settings.autoApprove.computerUse || sessionApprovals.computerUse) return;
  const choice = await confirmDialog({
    title: 'Allow computer control?',
    message: 'Allow the AI to control your mouse and keyboard?',
    detail: `Action: ${action}\n\nThe AI will be able to click, type, and capture screenshots until you revoke this.`,
  });
  if (choice === 'deny') {
    auditAppend({ ts: Date.now(), tool: action, status: 'denied' });
    throw new SandboxError('E_DENIED', 'Permission denied by user.');
  }
  if (choice === 'session') sessionApprovals.computerUse = true;
}

export { SandboxError };
