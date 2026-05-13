'use client';

/**
 * SSH profile manager — encrypted credentials via Electron `safeStorage`.
 */
import { useEffect, useState } from 'react';
import { isDesktop, getTools } from '@/lib/desktop/bridge';

interface Profile { id: string; name: string; host: string; port?: number; user: string; privateKeyPath?: string; password?: string; }

export default function SshManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<Profile>({ id: '', name: '', host: '', port: 22, user: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');

  async function refresh() { setProfiles((await getTools()!.ssh_profiles_list()) as Profile[]); }
  useEffect(() => { if (isDesktop()) void refresh(); }, []);

  async function save() {
    setBusy(true); setError(null);
    try {
      await getTools()!.ssh_profiles_save(form as unknown as Record<string, unknown>);
      setForm({ id: '', name: '', host: '', port: 22, user: '' });
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  }
  async function remove(id: string) { await getTools()!.ssh_profiles_remove(id); await refresh(); }
  async function testConnect(p: Profile) {
    setBusy(true); setError(null); setOutput('');
    try {
      const conn = await getTools()!.ssh_connect({ profileId: p.id });
      if (!conn.ok || !conn.result) throw new Error(conn.error?.message || 'connect failed');
      const exec = await getTools()!.ssh_exec((conn.result as { connectionId: string }).connectionId, 'uname -a || ver');
      setOutput((exec.result as { stdout: string })?.stdout || JSON.stringify(exec.result || exec.error));
      await getTools()!.ssh_disconnect((conn.result as { connectionId: string }).connectionId);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  }

  if (!isDesktop()) return <div className="p-6 text-sm text-neutral-500">SSH manager only available in the desktop app.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">SSH</h1>
        <p className="text-sm text-neutral-400 mt-1">Encrypted profiles stored via your OS keychain.</p>
      </header>

      <section className="rounded-lg border border-neutral-800 p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">New / edit</div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <input placeholder="User" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <input placeholder="Host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <input placeholder="Port" type="number" value={form.port || 22} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value, 10) || 22 })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <input placeholder="Private key path (optional)" value={form.privateKeyPath || ''} onChange={(e) => setForm({ ...form, privateKeyPath: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm col-span-2 font-mono" />
          <input placeholder="Password (optional)" type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm col-span-2" />
        </div>
        <div className="flex justify-end">
          <button onClick={() => void save()} disabled={busy} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white disabled:opacity-50">{form.id ? 'Update' : 'Add profile'}</button>
        </div>
      </section>

      {error && <div className="text-xs text-red-400">{error}</div>}
      {output && <pre className="text-[10px] text-neutral-400 bg-neutral-900 rounded-md p-2 max-h-32 overflow-y-auto font-mono">{output}</pre>}

      <section className="rounded-lg border border-neutral-800 divide-y divide-neutral-900">
        {profiles.length === 0 && <div className="px-4 py-6 text-xs text-neutral-500 text-center">No SSH profiles yet.</div>}
        {profiles.map((p) => (
          <div key={p.id} className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm">{p.name}</div>
              <div className="text-[11px] text-neutral-500 font-mono">{p.user}@{p.host}:{p.port || 22}</div>
              {p.privateKeyPath && <div className="text-[10px] text-neutral-500 font-mono">key: {p.privateKeyPath}</div>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setForm(p)} className="text-xs text-neutral-400 hover:text-neutral-200">Edit</button>
              <button onClick={() => void testConnect(p)} className="text-xs text-emerald-400 hover:text-emerald-300">Test</button>
              <button onClick={() => void remove(p.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
