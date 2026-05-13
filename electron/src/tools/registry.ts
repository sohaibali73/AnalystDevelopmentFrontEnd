/**
 * Wires every desktop tool into ipcMain.handle channels. Each handler is
 * wrapped with an audit-logging shell + uniform error envelope so the
 * renderer always gets `{ ok, result?, error? }`.
 */
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { append as auditAppend } from './audit';
import * as fsTools from './fs';
import * as shellTools from './shell';
import * as computerTools from './computer';
import { resetSessionApprovals } from './sandbox';
import { getStore } from '../settings/store';

export interface ToolEnvelope<T = unknown> {
  ok: boolean;
  result?: T;
  error?: { code: string; message: string };
}

function wrap<TArgs extends unknown[], TResult>(
  name: string,
  impl: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<ToolEnvelope<TResult>> {
  return async (...args: TArgs): Promise<ToolEnvelope<TResult>> => {
    const ts = Date.now();
    auditAppend({ ts, tool: name, status: 'start', args });
    try {
      const result = await impl(...args);
      auditAppend({ ts: Date.now(), tool: name, status: 'success', durationMs: Date.now() - ts });
      return { ok: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code || 'E_UNKNOWN';
      auditAppend({ ts: Date.now(), tool: name, status: 'error', error: message, durationMs: Date.now() - ts });
      return { ok: false, error: { code, message } };
    }
  };
}

export function registerAllTools(): void {
  // ── Filesystem ─────────────────────────────────────────────────────────
  ipcMain.handle('tool:fs.read',         (_e, p, opts)              => wrap('fs_read_file',   fsTools.readFile)(p, opts));
  ipcMain.handle('tool:fs.write',        (_e, p, content, opts)     => wrap('fs_write_file',  fsTools.writeFile)(p, content, opts));
  ipcMain.handle('tool:fs.append',       (_e, p, content)           => wrap('fs_append_file', fsTools.appendFile)(p, content));
  ipcMain.handle('tool:fs.delete',       (_e, p)                    => wrap('fs_delete',      fsTools.deletePath)(p));
  ipcMain.handle('tool:fs.list',         (_e, p, opts)              => wrap('fs_list_dir',    fsTools.listDir)(p, opts));
  ipcMain.handle('tool:fs.stat',         (_e, p)                    => wrap('fs_stat',        fsTools.stat)(p));
  ipcMain.handle('tool:fs.move',         (_e, src, dest)            => wrap('fs_move',        fsTools.move)(src, dest));
  ipcMain.handle('tool:fs.copy',         (_e, src, dest)            => wrap('fs_copy',        fsTools.copy)(src, dest));
  ipcMain.handle('tool:fs.mkdir',        (_e, p)                    => wrap('fs_mkdir',       fsTools.mkdir)(p));
  ipcMain.handle('tool:fs.pick-file',    (_e, opts)                 => wrap('fs_pick_file',   fsTools.pickFile)(opts));
  ipcMain.handle('tool:fs.pick-folder',  ()                         => wrap('fs_pick_folder', fsTools.pickFolder)());

  // ── Shell ──────────────────────────────────────────────────────────────
  ipcMain.handle('tool:shell.run',
    (_e, command, args, opts) => wrap('shell_run', shellTools.run)(command, args, opts),
  );
  ipcMain.handle('tool:shell.spawn-stream',
    async (e: IpcMainInvokeEvent, command, args, opts) =>
      wrap('shell_spawn_stream', () => shellTools.spawnStream(e.sender, command, args, opts))(),
  );
  ipcMain.handle('tool:shell.kill',  (_e, handleId, signal) => wrap('shell_kill',  async () => shellTools.kill(handleId, signal))());
  ipcMain.handle('tool:shell.open',  (_e, target)           => wrap('shell_open',  shellTools.openPath)(target));

  // ── Computer use ───────────────────────────────────────────────────────
  ipcMain.handle('tool:computer.screenshot',       (_e, opts)        => wrap('computer_screenshot',       computerTools.screenshot)(opts));
  ipcMain.handle('tool:computer.screen-size',      ()                => wrap('computer_screen_size',      computerTools.screenSize)());
  ipcMain.handle('tool:computer.cursor-position',  ()                => wrap('computer_cursor_position',  computerTools.cursorPosition)());
  ipcMain.handle('tool:computer.move',             (_e, x, y, opts)  => wrap('computer_move',             computerTools.move)(x, y, opts));
  ipcMain.handle('tool:computer.click',            (_e, opts)        => wrap('computer_click',            computerTools.click)(opts));
  ipcMain.handle('tool:computer.double-click',     (_e, x, y)        => wrap('computer_double_click',     computerTools.doubleClick)(x, y));
  ipcMain.handle('tool:computer.right-click',      (_e, x, y)        => wrap('computer_right_click',      computerTools.rightClick)(x, y));
  ipcMain.handle('tool:computer.drag',             (_e, from, to)    => wrap('computer_drag',             computerTools.drag)(from, to));
  ipcMain.handle('tool:computer.scroll',           (_e, dir, amount) => wrap('computer_scroll',           computerTools.scroll)(dir, amount));
  ipcMain.handle('tool:computer.type',             (_e, text, opts)  => wrap('computer_type',             computerTools.type)(text, opts));
  ipcMain.handle('tool:computer.key',              (_e, combo)       => wrap('computer_key',              computerTools.key)(combo));

  // ── Meta ───────────────────────────────────────────────────────────────
  ipcMain.handle('tool:meta.reset-session-approvals', () => {
    resetSessionApprovals();
    return { ok: true };
  });
  ipcMain.handle('tool:meta.capabilities', () => {
    const s = getStore().get();
    return {
      ok: true,
      result: {
        capabilities: s.capabilities,
        workspaceRoot: s.workspaceRoot,
        extraRoots: s.extraRoots,
        autoApprove: s.autoApprove,
        killSwitch: s.killSwitch,
      },
    };
  });
}
