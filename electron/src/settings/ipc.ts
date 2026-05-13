/**
 * IPC for settings/consent/audit/kill-switch interactions.
 * Exposed to the renderer through `window.potomacSettings`.
 */
import { ipcMain } from 'electron';
import { getStore, DesktopSettings } from './store';
import { setPasscode, verifyPasscode, hasPasscode } from './passcode';
import { ensureWorkspace } from '../tools/fs';
import { tail as auditTail, getLogPath as auditLogPath } from '../tools/audit';
import { killAll as killAllShellProcs } from '../tools/shell';

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => getStore().get());

  ipcMain.handle('settings:patch', (_e, partial: Partial<DesktopSettings>) => {
    return getStore().patch(partial);
  });

  ipcMain.handle('settings:complete-onboarding', async (_e, opts: {
    workspaceRoot?: string;
    capabilities?: { fs?: boolean; shell?: boolean; computer?: boolean };
    autoApprove?: Partial<DesktopSettings['autoApprove']>;
    passcode: string;
  }) => {
    if (!opts.passcode) throw new Error('A kill-switch passcode is required.');
    await setPasscode(opts.passcode);
    const patch: Partial<DesktopSettings> = { consented: true };
    if (opts.workspaceRoot) patch.workspaceRoot = opts.workspaceRoot;
    if (opts.capabilities) patch.capabilities = opts.capabilities as DesktopSettings['capabilities'];
    if (opts.autoApprove) patch.autoApprove = opts.autoApprove as DesktopSettings['autoApprove'];
    getStore().patch(patch);
    ensureWorkspace();
    return getStore().get();
  });

  ipcMain.handle('settings:has-passcode', () => hasPasscode());

  ipcMain.handle('settings:engage-kill-switch', () => {
    getStore().patch({ killSwitch: true });
    const killed = killAllShellProcs();
    return { killSwitch: true, processesKilled: killed };
  });

  ipcMain.handle('settings:disengage-kill-switch', async (_e, passcode: string) => {
    const ok = await verifyPasscode(passcode);
    if (!ok) return { killSwitch: true, ok: false, error: 'Invalid passcode.' };
    getStore().patch({ killSwitch: false });
    return { killSwitch: false, ok: true };
  });

  ipcMain.handle('settings:change-passcode', async (_e, oldPass: string, newPass: string) => {
    const ok = await verifyPasscode(oldPass);
    if (!ok) return { ok: false, error: 'Invalid current passcode.' };
    await setPasscode(newPass);
    return { ok: true };
  });

  ipcMain.handle('settings:audit-tail', (_e, limit?: number) => auditTail(limit));
  ipcMain.handle('settings:audit-path', () => auditLogPath());

  ipcMain.handle('settings:add-extra-root', (_e, p: string) => {
    const cur = getStore().get();
    if (!cur.extraRoots.includes(p)) {
      getStore().patch({ extraRoots: [...cur.extraRoots, p] });
    }
    return getStore().get().extraRoots;
  });

  ipcMain.handle('settings:remove-extra-root', (_e, p: string) => {
    const cur = getStore().get();
    getStore().patch({ extraRoots: cur.extraRoots.filter((r) => r !== p) });
    return getStore().get().extraRoots;
  });
}
