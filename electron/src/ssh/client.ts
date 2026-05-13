/**
 * SSH client — `ssh2`-backed connections + encrypted profile storage.
 *
 * Profiles (host, port, user, optional private key path / password) are kept
 * in `userData/ssh-profiles.enc.json`, encrypted via Electron's `safeStorage`
 * which uses the OS keychain on macOS, DPAPI on Windows, libsecret on Linux.
 *
 * AI surfaces three tools: ssh_connect, ssh_exec, ssh_disconnect. UI surfaces
 * a profile manager + a button to spawn a PTY-backed terminal tab over SSH.
 */
import { ipcMain, app, safeStorage } from 'electron';
import { Client as SshClient } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import { append as auditAppend } from '../tools/audit';
import { guardShell } from '../tools/sandbox';

interface Profile {
  id: string;
  name: string;
  host: string;
  port?: number;
  user: string;
  privateKeyPath?: string;
  password?: string;
}

const profilesPath = () => path.join(app.getPath('userData'), 'ssh-profiles.enc.json');
let connections = new Map<string, SshClient>();
let nextConnId = 1;

function loadProfiles(): Profile[] {
  try {
    if (!fs.existsSync(profilesPath())) return [];
    if (!safeStorage.isEncryptionAvailable()) return JSON.parse(fs.readFileSync(profilesPath(), 'utf-8'));
    const enc = fs.readFileSync(profilesPath());
    const dec = safeStorage.decryptString(enc);
    return JSON.parse(dec);
  } catch { return []; }
}
function saveProfiles(list: Profile[]): void {
  try {
    fs.mkdirSync(path.dirname(profilesPath()), { recursive: true });
    if (safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(profilesPath(), safeStorage.encryptString(JSON.stringify(list)));
    } else {
      fs.writeFileSync(profilesPath(), JSON.stringify(list, null, 2));
    }
  } catch { /* ignore */ }
}

function envelope<T>(name: string, impl: () => Promise<T>): Promise<{ ok: boolean; result?: T; error?: { code: string; message: string } }> {
  const ts = Date.now();
  auditAppend({ ts, tool: name, status: 'start' });
  return impl()
    .then((result) => { auditAppend({ ts: Date.now(), tool: name, status: 'success', durationMs: Date.now() - ts }); return { ok: true, result }; })
    .catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code || 'E_UNKNOWN';
      auditAppend({ ts: Date.now(), tool: name, status: 'error', error: message, durationMs: Date.now() - ts });
      return { ok: false, error: { code, message } };
    });
}

export function registerSshIpc(): void {
  ipcMain.handle('ssh:profiles.list',   () => loadProfiles());
  ipcMain.handle('ssh:profiles.save',   (_e, p: Profile) => {
    const list = loadProfiles();
    const idx = list.findIndex((x) => x.id === p.id);
    if (idx >= 0) list[idx] = p;
    else list.push({ ...p, id: p.id || `ssh-${Date.now()}` });
    saveProfiles(list);
    return list;
  });
  ipcMain.handle('ssh:profiles.remove', (_e, id: string) => {
    const list = loadProfiles().filter((x) => x.id !== id);
    saveProfiles(list);
    return list;
  });

  ipcMain.handle('ssh:connect', (_e, profileOrAdHoc: Partial<Profile> & { profileId?: string }) =>
    envelope<{ connectionId: string }>('ssh_connect', async () => {
      const profile: Profile | undefined = profileOrAdHoc.profileId
        ? loadProfiles().find((x) => x.id === profileOrAdHoc.profileId)
        : (profileOrAdHoc as Profile);
      if (!profile?.host || !profile?.user) throw new Error('host and user are required');
      const conn = new SshClient();
      await new Promise<void>((resolve, reject) => {
        conn.on('ready', () => resolve());
        conn.on('error', reject);
        const opts: Record<string, unknown> = {
          host: profile.host,
          port: profile.port || 22,
          username: profile.user,
        };
        if (profile.privateKeyPath && fs.existsSync(profile.privateKeyPath)) {
          opts.privateKey = fs.readFileSync(profile.privateKeyPath);
        } else if (profile.password) {
          opts.password = profile.password;
        }
        conn.connect(opts as never);
      });
      const connectionId = `ssh-${nextConnId++}`;
      connections.set(connectionId, conn);
      return { connectionId };
    }),
  );

  ipcMain.handle('ssh:exec', (_e, connectionId: string, command: string) =>
    envelope('ssh_exec', async () => {
      const conn = connections.get(connectionId);
      if (!conn) throw new Error(`Unknown SSH connection ${connectionId}`);
      await guardShell(`ssh ${connectionId}`, [command]);
      return await new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);
          let stdout = '';
          let stderr = '';
          stream.on('data', (d: Buffer) => { stdout += d.toString(); });
          stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
          stream.on('close', (exitCode: number | null) => {
            resolve({ exitCode, stdout, stderr });
          });
        });
      });
    }),
  );

  ipcMain.handle('ssh:disconnect', (_e, connectionId: string) =>
    envelope('ssh_disconnect', async () => {
      const conn = connections.get(connectionId);
      if (!conn) return { closed: false };
      try { conn.end(); } catch { /* ignore */ }
      connections.delete(connectionId);
      return { closed: true };
    }),
  );
}

export function shutdownSsh(): void {
  for (const c of connections.values()) { try { c.end(); } catch { /* ignore */ } }
  connections.clear();
}
