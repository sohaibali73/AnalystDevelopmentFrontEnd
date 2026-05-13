/**
 * Preload script — exposes three namespaces to the Vercel-hosted Next.js renderer:
 *
 *   window.electronAPI    — basic desktop info & window controls
 *   window.potomacTools   — desktop agent tool surface (fs/shell/computer)
 *   window.potomacSettings — consent, auto-approve, kill switch, audit
 *
 * All Tool calls return `{ ok: true, result } | { ok: false, error }`.
 * Web (non-Electron) builds will not have any of these objects.
 */
import { contextBridge, ipcRenderer, webFrame } from 'electron';

// ── electronAPI ─────────────────────────────────────────────────────────────
type ZoomDir = 'in' | 'out' | 'reset';

const electronAPI = {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  reload: () => ipcRenderer.invoke('app:reload'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('app:toggle-maximize'),
  quit: () => ipcRenderer.invoke('app:quit'),
  setZoom: (dir: ZoomDir) => {
    const current = webFrame.getZoomFactor();
    if (dir === 'reset') webFrame.setZoomFactor(1);
    else if (dir === 'in') webFrame.setZoomFactor(Math.min(3, current + 0.1));
    else if (dir === 'out') webFrame.setZoomFactor(Math.max(0.5, current - 0.1));
    return webFrame.getZoomFactor();
  },
  onThemeChange: (cb: (theme: 'light' | 'dark') => void) => {
    const handler = (_e: unknown, theme: 'light' | 'dark') => cb(theme);
    ipcRenderer.on('app:theme-change', handler);
    return () => ipcRenderer.removeListener('app:theme-change', handler);
  },
  onNetworkChange: (cb: (online: boolean) => void) => {
    const handler = (_e: unknown, online: boolean) => cb(online);
    ipcRenderer.on('app:network', handler);
    return () => ipcRenderer.removeListener('app:network', handler);
  },
};

// ── potomacTools ────────────────────────────────────────────────────────────
const tools = {
  // Filesystem
  fs_read_file:   (p: string, opts?: { encoding?: string }) => ipcRenderer.invoke('tool:fs.read', p, opts),
  fs_write_file:  (p: string, content: string, opts?: { encoding?: string; createDirs?: boolean }) => ipcRenderer.invoke('tool:fs.write', p, content, opts),
  fs_append_file: (p: string, content: string) => ipcRenderer.invoke('tool:fs.append', p, content),
  fs_delete:      (p: string) => ipcRenderer.invoke('tool:fs.delete', p),
  fs_list_dir:    (p: string, opts?: { recursive?: boolean; maxEntries?: number }) => ipcRenderer.invoke('tool:fs.list', p, opts),
  fs_stat:        (p: string) => ipcRenderer.invoke('tool:fs.stat', p),
  fs_move:        (src: string, dest: string) => ipcRenderer.invoke('tool:fs.move', src, dest),
  fs_copy:        (src: string, dest: string) => ipcRenderer.invoke('tool:fs.copy', src, dest),
  fs_mkdir:       (p: string) => ipcRenderer.invoke('tool:fs.mkdir', p),
  fs_pick_file:   (opts?: { multi?: boolean }) => ipcRenderer.invoke('tool:fs.pick-file', opts),
  fs_pick_folder: () => ipcRenderer.invoke('tool:fs.pick-folder'),

  // Shell
  shell_run:          (command: string, args: string[], opts?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number; shell?: boolean }) => ipcRenderer.invoke('tool:shell.run', command, args, opts),
  shell_spawn_stream: (command: string, args: string[], opts?: { cwd?: string; env?: Record<string, string>; shell?: boolean }) => ipcRenderer.invoke('tool:shell.spawn-stream', command, args, opts),
  shell_kill:         (handleId: string, signal?: string) => ipcRenderer.invoke('tool:shell.kill', handleId, signal),
  shell_open:         (target: string) => ipcRenderer.invoke('tool:shell.open', target),
  onShellStream:      (handleId: string, cb: (msg: { channel: string; payload: unknown }) => void) => {
    const handler = (_e: unknown, msg: { channel: string; payload: unknown }) => cb(msg);
    ipcRenderer.on(`shell:stream:${handleId}`, handler);
    return () => ipcRenderer.removeListener(`shell:stream:${handleId}`, handler);
  },

  // Computer use
  computer_screenshot:      (opts?: { displayIndex?: number })          => ipcRenderer.invoke('tool:computer.screenshot', opts),
  computer_screen_size:     ()                                          => ipcRenderer.invoke('tool:computer.screen-size'),
  computer_cursor_position: ()                                          => ipcRenderer.invoke('tool:computer.cursor-position'),
  computer_move:            (x: number, y: number, opts?: { speed?: number }) => ipcRenderer.invoke('tool:computer.move', x, y, opts),
  computer_click:           (opts?: { x?: number; y?: number; button?: 'left' | 'right' | 'middle' }) => ipcRenderer.invoke('tool:computer.click', opts),
  computer_double_click:    (x?: number, y?: number)                    => ipcRenderer.invoke('tool:computer.double-click', x, y),
  computer_right_click:     (x?: number, y?: number)                    => ipcRenderer.invoke('tool:computer.right-click', x, y),
  computer_drag:            (from: { x: number; y: number }, to: { x: number; y: number }) => ipcRenderer.invoke('tool:computer.drag', from, to),
  computer_scroll:          (direction: 'up' | 'down' | 'left' | 'right', amount: number) => ipcRenderer.invoke('tool:computer.scroll', direction, amount),
  computer_type:            (text: string, opts?: { delayMs?: number }) => ipcRenderer.invoke('tool:computer.type', text, opts),
  computer_key:             (combo: string)                             => ipcRenderer.invoke('tool:computer.key', combo),

  // Meta
  meta_capabilities:         ()                  => ipcRenderer.invoke('tool:meta.capabilities'),
  meta_reset_session_approvals: ()               => ipcRenderer.invoke('tool:meta.reset-session-approvals'),

  // ── Background Computer Use (YANG Autopilot) ──────────────────────────
  cu_open_target:    (opts: { kind: 'browser' | 'native' | 'virtual-desktop'; url?: string; app?: string; args?: string[]; windowTitle?: string }) => ipcRenderer.invoke('cu:open', opts),
  cu_close:          (targetId: string) => ipcRenderer.invoke('cu:close', targetId),
  cu_list_targets:   () => ipcRenderer.invoke('cu:list'),
  cu_screenshot:     (targetId: string) => ipcRenderer.invoke('cu:screenshot', targetId),
  cu_get_content:    (targetId: string) => ipcRenderer.invoke('cu:content', targetId),
  cu_click:          (targetId: string, x: number, y: number, opts?: { button?: 'left' | 'right' | 'middle' }) => ipcRenderer.invoke('cu:click', targetId, x, y, opts),
  cu_double_click:   (targetId: string, x: number, y: number) => ipcRenderer.invoke('cu:double-click', targetId, x, y),
  cu_type:           (targetId: string, text: string, opts?: { delayMs?: number }) => ipcRenderer.invoke('cu:type', targetId, text, opts),
  cu_key:            (targetId: string, combo: string) => ipcRenderer.invoke('cu:key', targetId, combo),
  cu_scroll:         (targetId: string, x: number, y: number, dx: number, dy: number) => ipcRenderer.invoke('cu:scroll', targetId, x, y, dx, dy),
  cu_size:           (targetId: string) => ipcRenderer.invoke('cu:size', targetId),
  browser_navigate:  (targetId: string, url: string) => ipcRenderer.invoke('cu:browser.navigate', targetId, url),
  browser_eval:      (targetId: string, script: string) => ipcRenderer.invoke('cu:browser.evaluate', targetId, script),
  browser_pin_note:  (targetId: string, x: number, y: number, text: string) => ipcRenderer.invoke('cu:browser.pin-note', targetId, x, y, text),
  browser_get_pins:  (targetId: string) => ipcRenderer.invoke('cu:browser.get-pins', targetId),
  browser_download:  (targetId: string, url: string, filename?: string) => ipcRenderer.invoke('cu:browser.download', targetId, url, filename),
  browser_list_downloads: (targetId: string) => ipcRenderer.invoke('cu:browser.list-downloads', targetId),
  browser_wait_for:  (targetId: string, selector: string, timeoutMs?: number) => ipcRenderer.invoke('cu:browser.wait', targetId, selector, timeoutMs),
  browser_fill:      (targetId: string, selector: string, value: string) => ipcRenderer.invoke('cu:browser.fill', targetId, selector, value),

  // ── Terminals (xterm.js-backed) ──────────────────────────────────────
  terminal_open:    (opts?: { shell?: string; cwd?: string; cols?: number; rows?: number; env?: Record<string, string> }) => ipcRenderer.invoke('term:open', opts),
  terminal_write:   (id: string, data: string) => ipcRenderer.send('term:data', id, data),
  terminal_resize:  (id: string, cols: number, rows: number) => ipcRenderer.invoke('term:resize', id, cols, rows),
  terminal_close:   (id: string) => ipcRenderer.invoke('term:close', id),
  terminal_run:     (command: string, opts?: { cwd?: string; timeoutMs?: number; env?: Record<string, string> }) => ipcRenderer.invoke('term:run', command, opts),
  onTerminalOut:    (id: string, cb: (data: string) => void) => {
    const h = (_e: unknown, d: string) => cb(d);
    ipcRenderer.on(`term:out:${id}`, h);
    return () => ipcRenderer.removeListener(`term:out:${id}`, h);
  },
  onTerminalExit:   (id: string, cb: (info: { exitCode: number | null; signal: number | null }) => void) => {
    const h = (_e: unknown, info: { exitCode: number | null; signal: number | null }) => cb(info);
    ipcRenderer.on(`term:exit:${id}`, h);
    return () => ipcRenderer.removeListener(`term:exit:${id}`, h);
  },

  // ── GitHub CLI tools ─────────────────────────────────────────────────
  github_list_prs:   (repo: string, state?: 'open' | 'closed' | 'merged' | 'all') => ipcRenderer.invoke('gh:list-prs', repo, state),
  github_pr_diff:    (repo: string, pr: number) => ipcRenderer.invoke('gh:pr-diff', repo, pr),
  github_pr_comment: (repo: string, pr: number, body: string) => ipcRenderer.invoke('gh:pr-comment', repo, pr, body),
  github_pr_review:  (repo: string, pr: number, opts: { event: 'approve' | 'request_changes' | 'comment'; body?: string }) => ipcRenderer.invoke('gh:pr-review', repo, pr, opts),
  github_clone:      (repo: string, dest?: string) => ipcRenderer.invoke('gh:clone', repo, dest),
  github_status:     () => ipcRenderer.invoke('gh:status'),

  // ── SSH ──────────────────────────────────────────────────────────────
  ssh_profiles_list:   () => ipcRenderer.invoke('ssh:profiles.list'),
  ssh_profiles_save:   (p: Record<string, unknown>) => ipcRenderer.invoke('ssh:profiles.save', p),
  ssh_profiles_remove: (id: string) => ipcRenderer.invoke('ssh:profiles.remove', id),
  ssh_connect:         (opts: Record<string, unknown>) => ipcRenderer.invoke('ssh:connect', opts),
  ssh_exec:            (connectionId: string, command: string) => ipcRenderer.invoke('ssh:exec', connectionId, command),
  ssh_disconnect:      (connectionId: string) => ipcRenderer.invoke('ssh:disconnect', connectionId),

  // ── MCP host ─────────────────────────────────────────────────────────
  mcp_list_configs:    () => ipcRenderer.invoke('mcp:list-configs'),
  mcp_list_running:    () => ipcRenderer.invoke('mcp:list-running'),
  mcp_save_config:     (cfg: Record<string, unknown>) => ipcRenderer.invoke('mcp:save-config', cfg),
  mcp_remove_config:   (id: string) => ipcRenderer.invoke('mcp:remove-config', id),
  mcp_reconnect:       (id: string) => ipcRenderer.invoke('mcp:reconnect', id),
  mcp_call_tool:       (qualifiedName: string, args: Record<string, unknown>) => ipcRenderer.invoke('mcp:call-tool', qualifiedName, args),
};

// ── potomacSettings ─────────────────────────────────────────────────────────
const settings = {
  get:                  () => ipcRenderer.invoke('settings:get'),
  patch:                (partial: Record<string, unknown>) => ipcRenderer.invoke('settings:patch', partial),
  completeOnboarding:   (opts: { workspaceRoot?: string; capabilities?: Record<string, boolean>; autoApprove?: Record<string, boolean>; passcode: string }) => ipcRenderer.invoke('settings:complete-onboarding', opts),
  hasPasscode:          () => ipcRenderer.invoke('settings:has-passcode'),
  engageKillSwitch:     () => ipcRenderer.invoke('settings:engage-kill-switch'),
  disengageKillSwitch:  (passcode: string) => ipcRenderer.invoke('settings:disengage-kill-switch', passcode),
  changePasscode:       (oldPass: string, newPass: string) => ipcRenderer.invoke('settings:change-passcode', oldPass, newPass),
  auditTail:            (limit?: number) => ipcRenderer.invoke('settings:audit-tail', limit),
  auditPath:            () => ipcRenderer.invoke('settings:audit-path'),
  addExtraRoot:         (p: string) => ipcRenderer.invoke('settings:add-extra-root', p),
  removeExtraRoot:      (p: string) => ipcRenderer.invoke('settings:remove-extra-root', p),
  onKillSwitchChanged:  (cb: (engaged: boolean) => void) => {
    const handler = (_e: unknown, v: boolean) => cb(v);
    ipcRenderer.on('settings:kill-switch-changed', handler);
    return () => ipcRenderer.removeListener('settings:kill-switch-changed', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('potomacTools', tools);
contextBridge.exposeInMainWorld('potomacSettings', settings);

// Make detection trivial from CSS / SSR.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-electron', 'true');
  document.documentElement.setAttribute('data-electron-platform', process.platform);
});

export type ElectronAPI = typeof electronAPI;
export type PotomacTools = typeof tools;
export type PotomacSettings = typeof settings;
