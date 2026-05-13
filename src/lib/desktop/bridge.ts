/**
 * Typed bridge to the Electron preload (`window.potomacTools`,
 * `window.potomacSettings`, `window.electronAPI`).
 *
 * Everything in this file is SAFE to import from the web build — it just
 * returns `undefined` / `false` when running in a browser.
 */

export interface ToolEnvelope<T = unknown> {
  ok: boolean;
  result?: T;
  error?: { code: string; message: string };
}

/** Minimal-surface typing (full surface lives in electron/src/preload.ts). */
export interface PotomacToolsAPI {
  // FS
  fs_read_file: (p: string, opts?: { encoding?: string }) => Promise<ToolEnvelope<{ path: string; content: string; encoding: string; size: number }>>;
  fs_write_file: (p: string, content: string, opts?: { encoding?: string; createDirs?: boolean }) => Promise<ToolEnvelope<{ path: string; bytesWritten: number }>>;
  fs_append_file: (p: string, content: string) => Promise<ToolEnvelope<{ path: string; bytesAppended: number }>>;
  fs_delete: (p: string) => Promise<ToolEnvelope<{ path: string; deleted: boolean }>>;
  fs_list_dir: (p: string, opts?: { recursive?: boolean; maxEntries?: number }) => Promise<ToolEnvelope<{ path: string; entries: Array<{ name: string; path: string; type: string; size?: number }> }>>;
  fs_stat: (p: string) => Promise<ToolEnvelope<{ path: string; exists: boolean; size?: number; isFile?: boolean; isDir?: boolean }>>;
  fs_move: (src: string, dest: string) => Promise<ToolEnvelope<{ src: string; dest: string }>>;
  fs_copy: (src: string, dest: string) => Promise<ToolEnvelope<{ src: string; dest: string }>>;
  fs_mkdir: (p: string) => Promise<ToolEnvelope<{ path: string; created: boolean }>>;
  fs_pick_file: (opts?: { multi?: boolean }) => Promise<ToolEnvelope<{ paths: string[] }>>;
  fs_pick_folder: () => Promise<ToolEnvelope<{ path: string | null; addedToAllowlist: boolean }>>;

  // Shell
  shell_run: (command: string, args: string[], opts?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number; shell?: boolean }) => Promise<ToolEnvelope<{ exitCode: number | null; signal: string | null; stdout: string; stderr: string; durationMs: number }>>;
  shell_spawn_stream: (command: string, args: string[], opts?: { cwd?: string; env?: Record<string, string>; shell?: boolean }) => Promise<ToolEnvelope<{ handleId: string; pid: number | undefined }>>;
  shell_kill: (handleId: string, signal?: string) => Promise<ToolEnvelope<boolean>>;
  shell_open: (target: string) => Promise<ToolEnvelope<{ ok: boolean; error?: string }>>;
  onShellStream: (handleId: string, cb: (msg: { channel: string; payload: unknown }) => void) => () => void;

  // Computer use
  computer_screenshot: (opts?: { displayIndex?: number }) => Promise<ToolEnvelope<{ pngBase64: string; width: number; height: number }>>;
  computer_screen_size: () => Promise<ToolEnvelope<{ width: number; height: number; scaleFactor: number }>>;
  computer_cursor_position: () => Promise<ToolEnvelope<{ x: number; y: number }>>;
  computer_move: (x: number, y: number, opts?: { speed?: number }) => Promise<ToolEnvelope<{ x: number; y: number }>>;
  computer_click: (opts?: { x?: number; y?: number; button?: 'left' | 'right' | 'middle' }) => Promise<ToolEnvelope<{ x: number; y: number; button: string }>>;
  computer_double_click: (x?: number, y?: number) => Promise<ToolEnvelope<{ x: number; y: number }>>;
  computer_right_click: (x?: number, y?: number) => Promise<ToolEnvelope<{ x: number; y: number; button: string }>>;
  computer_drag: (from: { x: number; y: number }, to: { x: number; y: number }) => Promise<ToolEnvelope<void>>;
  computer_scroll: (direction: 'up' | 'down' | 'left' | 'right', amount: number) => Promise<ToolEnvelope<void>>;
  computer_type: (text: string, opts?: { delayMs?: number }) => Promise<ToolEnvelope<{ length: number }>>;
  computer_key: (combo: string) => Promise<ToolEnvelope<{ combo: string }>>;

  // Meta
  meta_capabilities: () => Promise<{
    ok: boolean;
    result?: {
      capabilities: { fs: boolean; shell: boolean; computer: boolean };
      workspaceRoot: string;
      extraRoots: string[];
      autoApprove: { insideWorkspace: boolean; outsideWorkspace: boolean; shell: boolean; computerUse: boolean };
      killSwitch: boolean;
    };
  }>;
  meta_reset_session_approvals: () => Promise<{ ok: boolean }>;
}

export interface PotomacSettingsAPI {
  get: () => Promise<{
    consented: boolean;
    workspaceRoot: string;
    extraRoots: string[];
    capabilities: { fs: boolean; shell: boolean; computer: boolean };
    autoApprove: { insideWorkspace: boolean; outsideWorkspace: boolean; shell: boolean; computerUse: boolean };
    passcodeHash: string | null;
    killSwitch: boolean;
  }>;
  patch: (partial: Record<string, unknown>) => Promise<unknown>;
  completeOnboarding: (opts: { workspaceRoot?: string; capabilities?: Record<string, boolean>; autoApprove?: Record<string, boolean>; passcode: string }) => Promise<unknown>;
  hasPasscode: () => Promise<boolean>;
  engageKillSwitch: () => Promise<{ killSwitch: boolean; processesKilled: number }>;
  disengageKillSwitch: (passcode: string) => Promise<{ killSwitch: boolean; ok: boolean; error?: string }>;
  changePasscode: (oldPass: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
  auditTail: (limit?: number) => Promise<Array<{ ts: number; tool: string; status: string; args?: unknown; error?: string; durationMs?: number }>>;
  auditPath: () => Promise<string>;
  addExtraRoot: (p: string) => Promise<string[]>;
  removeExtraRoot: (p: string) => Promise<string[]>;
  onKillSwitchChanged: (cb: (engaged: boolean) => void) => () => void;
}

export interface ElectronAPI {
  isElectron: true;
  platform: string;
  versions: { electron: string; chrome: string; node: string };
  openExternal: (url: string) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    potomacTools?: PotomacToolsAPI;
    potomacSettings?: PotomacSettingsAPI;
  }
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.electronAPI?.isElectron;
}

export function getTools(): PotomacToolsAPI | null {
  if (!isDesktop()) return null;
  return window.potomacTools || null;
}

export function getSettings(): PotomacSettingsAPI | null {
  if (!isDesktop()) return null;
  return window.potomacSettings || null;
}

/** What capabilities to advertise to the backend. */
export async function getDesktopCapabilities(): Promise<string[]> {
  const settings = getSettings();
  if (!settings) return [];
  try {
    const s = await settings.get();
    if (!s.consented) return [];
    const caps: string[] = [];
    if (s.capabilities.fs) caps.push('fs');
    if (s.capabilities.shell) caps.push('shell');
    if (s.capabilities.computer) caps.push('computer');
    return caps;
  } catch {
    return [];
  }
}

/**
 * Map a backend-named tool to the local IPC method and execute it.
 * Returns `{ result }` on success or `{ error }` on failure.
 *
 * Backend tool names must match the keys below exactly.
 */
export async function runTool(toolName: string, args: Record<string, unknown>): Promise<{ result?: unknown; error?: string }> {
  const tools = getTools();
  if (!tools) return { error: 'Tools not available (not running in Electron).' };

  type Handler = (a: Record<string, unknown>) => Promise<ToolEnvelope<unknown>>;
  // Extend the on-the-fly tools handle to recognize cu_* and browser_* names.
  const t = tools as unknown as Record<string, (...args: unknown[]) => Promise<ToolEnvelope<unknown>>>;
  const handlers: Record<string, Handler> = {
    // ── YANG Autopilot: Background Computer Use ────────────────────────
    cu_open_target:   (a) => t.cu_open_target(a),
    cu_close:         (a) => t.cu_close(a.targetId as string),
    cu_list_targets:  ()  => t.cu_list_targets(),
    cu_screenshot:    (a) => t.cu_screenshot(a.targetId as string),
    cu_get_content:   (a) => t.cu_get_content(a.targetId as string),
    cu_click:         (a) => t.cu_click(a.targetId as string, a.x as number, a.y as number, { button: a.button as 'left' | 'right' | 'middle' | undefined }),
    cu_double_click:  (a) => t.cu_double_click(a.targetId as string, a.x as number, a.y as number),
    cu_type:          (a) => t.cu_type(a.targetId as string, a.text as string, { delayMs: a.delayMs as number | undefined }),
    cu_key:           (a) => t.cu_key(a.targetId as string, a.combo as string),
    cu_scroll:        (a) => t.cu_scroll(a.targetId as string, a.x as number, a.y as number, a.dx as number, a.dy as number),
    cu_size:          (a) => t.cu_size(a.targetId as string),
    browser_navigate: (a) => t.browser_navigate(a.targetId as string, a.url as string),
    browser_eval:     (a) => t.browser_eval(a.targetId as string, a.script as string),
    browser_pin_note: (a) => t.browser_pin_note(a.targetId as string, a.x as number, a.y as number, a.text as string),
    browser_get_pins: (a) => t.browser_get_pins(a.targetId as string),

    // ── Workflow integrations (Phase 5) ────────────────────────────────
    terminal_run:      (a) => t.terminal_run(a.command as string, { cwd: a.cwd as string | undefined, timeoutMs: a.timeoutMs as number | undefined, env: a.env as Record<string, string> | undefined }),
    github_list_prs:   (a) => t.github_list_prs(a.repo as string, a.state as 'open' | 'closed' | 'merged' | 'all' | undefined),
    github_pr_diff:    (a) => t.github_pr_diff(a.repo as string, a.pr as number),
    github_pr_comment: (a) => t.github_pr_comment(a.repo as string, a.pr as number, a.body as string),
    github_pr_review:  (a) => t.github_pr_review(a.repo as string, a.pr as number, { event: a.event as 'approve' | 'request_changes' | 'comment', body: a.body as string | undefined }),
    github_clone:      (a) => t.github_clone(a.repo as string, a.dest as string | undefined),
    github_status:     ()  => t.github_status(),
    ssh_connect:       (a) => t.ssh_connect(a),
    ssh_exec:          (a) => t.ssh_exec(a.connectionId as string, a.command as string),
    ssh_disconnect:    (a) => t.ssh_disconnect(a.connectionId as string),

    // FS
    fs_read_file:   (a) => tools.fs_read_file(a.path as string, { encoding: a.encoding as string | undefined }),
    fs_write_file:  (a) => tools.fs_write_file(a.path as string, a.content as string, { encoding: a.encoding as string | undefined, createDirs: a.createDirs as boolean | undefined }),
    fs_append_file: (a) => tools.fs_append_file(a.path as string, a.content as string),
    fs_delete:      (a) => tools.fs_delete(a.path as string),
    fs_list_dir:    (a) => tools.fs_list_dir(a.path as string, { recursive: a.recursive as boolean | undefined, maxEntries: a.maxEntries as number | undefined }),
    fs_stat:        (a) => tools.fs_stat(a.path as string),
    fs_move:        (a) => tools.fs_move(a.src as string, a.dest as string),
    fs_copy:        (a) => tools.fs_copy(a.src as string, a.dest as string),
    fs_mkdir:       (a) => tools.fs_mkdir(a.path as string),
    fs_pick_file:   (a) => tools.fs_pick_file({ multi: a.multi as boolean | undefined }),
    fs_pick_folder: ()  => tools.fs_pick_folder(),

    // Shell
    shell_run:      (a) => tools.shell_run(a.command as string, (a.args as string[]) || [], { cwd: a.cwd as string | undefined, env: a.env as Record<string, string> | undefined, timeoutMs: a.timeoutMs as number | undefined, shell: a.shell as boolean | undefined }),
    shell_open:     (a) => tools.shell_open(a.target as string),

    // Computer use
    computer_screenshot:      (a) => tools.computer_screenshot({ displayIndex: a.displayIndex as number | undefined }),
    computer_screen_size:     ()  => tools.computer_screen_size(),
    computer_cursor_position: ()  => tools.computer_cursor_position(),
    computer_move:            (a) => tools.computer_move(a.x as number, a.y as number, { speed: a.speed as number | undefined }),
    computer_click:           (a) => tools.computer_click({ x: a.x as number | undefined, y: a.y as number | undefined, button: a.button as 'left' | 'right' | 'middle' | undefined }),
    computer_double_click:    (a) => tools.computer_double_click(a.x as number | undefined, a.y as number | undefined),
    computer_right_click:     (a) => tools.computer_right_click(a.x as number | undefined, a.y as number | undefined),
    computer_drag:            (a) => tools.computer_drag(a.from as { x: number; y: number }, a.to as { x: number; y: number }),
    computer_scroll:          (a) => tools.computer_scroll(a.direction as 'up' | 'down' | 'left' | 'right', a.amount as number),
    computer_type:            (a) => tools.computer_type(a.text as string, { delayMs: a.delayMs as number | undefined }),
    computer_key:             (a) => tools.computer_key(a.combo as string),
  };

  const h = handlers[toolName];
  if (!h) return { error: `Unknown desktop tool: ${toolName}` };

  try {
    const env = await h(args || {});
    if (env.ok) return { result: env.result };
    return { error: env.error?.message || 'Tool failed.' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** List of all desktop tool names the backend should know about. */
export const DESKTOP_TOOL_NAMES = {
  fs: [
    'fs_read_file', 'fs_write_file', 'fs_append_file', 'fs_delete',
    'fs_list_dir', 'fs_stat', 'fs_move', 'fs_copy', 'fs_mkdir',
    'fs_pick_file', 'fs_pick_folder',
  ],
  shell: ['shell_run', 'shell_open'],
  computer: [
    'computer_screenshot', 'computer_screen_size', 'computer_cursor_position',
    'computer_move', 'computer_click', 'computer_double_click', 'computer_right_click',
    'computer_drag', 'computer_scroll', 'computer_type', 'computer_key',
  ],
  // YANG Autopilot — Background Computer Use (parallel browser + native).
  yang_cu: [
    'cu_open_target', 'cu_close', 'cu_list_targets', 'cu_screenshot', 'cu_get_content',
    'cu_click', 'cu_double_click', 'cu_type', 'cu_key', 'cu_scroll', 'cu_size',
    'browser_navigate', 'browser_eval', 'browser_pin_note', 'browser_get_pins',
  ],
  // YANG Autopilot — workflow integrations (Phase 5).
  yang_workflow: [
    'terminal_run',
    'github_list_prs', 'github_pr_diff', 'github_pr_comment', 'github_pr_review', 'github_clone', 'github_status',
    'ssh_connect', 'ssh_exec', 'ssh_disconnect',
  ],
} as const;
