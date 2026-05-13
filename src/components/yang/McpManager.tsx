'use client';

/**
 * MCP server manager — configure stdio / HTTP MCP servers. Tools they expose
 * are auto-registered with the AI agent as `mcp_<serverId>_<tool>`.
 */
import { useEffect, useState } from 'react';
import { isDesktop, getTools } from '@/lib/desktop/bridge';

interface ServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  disabled?: boolean;
}

interface RunningServer {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: string[];
  error?: string;
}

export default function McpManager() {
  const [configs, setConfigs] = useState<ServerConfig[]>([]);
  const [running, setRunning] = useState<RunningServer[]>([]);
  const [form, setForm] = useState<ServerConfig>({ id: '', name: '', transport: 'stdio' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setConfigs((await getTools()!.mcp_list_configs()) as ServerConfig[]);
    setRunning((await getTools()!.mcp_list_running()) as RunningServer[]);
  }
  useEffect(() => { if (isDesktop()) void refresh(); const i = setInterval(() => { void refresh(); }, 5000); return () => clearInterval(i); }, []);

  async function save() {
    setBusy(true); setError(null);
    try {
      const r = await getTools()!.mcp_save_config(form as unknown as Record<string, unknown>);
      if ((r as { ok: boolean }).ok === false) throw new Error((r as { error?: string }).error || 'save failed');
      setForm({ id: '', name: '', transport: 'stdio' });
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  }
  async function remove(id: string) { await getTools()!.mcp_remove_config(id); await refresh(); }
  async function reconnect(id: string) {
    const r = await getTools()!.mcp_reconnect(id);
    if (!(r as { ok: boolean }).ok) setError((r as { error?: string }).error || 'reconnect failed');
    await refresh();
  }

  if (!isDesktop()) return <div className="p-6 text-sm text-neutral-500">MCP manager only available in the desktop app.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">MCP Servers</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Connect Model Context Protocol servers. Their tools become available to the AI as <code className="text-xs">mcp_&lt;server&gt;_&lt;tool&gt;</code>.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-800 p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">{form.id ? 'Edit' : 'New'} MCP server</div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <select value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value as 'stdio' | 'http' })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm">
            <option value="stdio">stdio</option>
            <option value="http">http</option>
          </select>
          {form.transport === 'stdio' ? (
            <>
              <input placeholder="Command (e.g. npx)" value={form.command || ''} onChange={(e) => setForm({ ...form, command: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm col-span-2 font-mono" />
              <input placeholder="Args (space-separated)" value={(form.args || []).join(' ')} onChange={(e) => setForm({ ...form, args: e.target.value.split(/\s+/).filter(Boolean) })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm col-span-2 font-mono" />
            </>
          ) : (
            <input placeholder="URL" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm col-span-2 font-mono" />
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={() => void save()} disabled={busy} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white disabled:opacity-50">{form.id ? 'Update' : 'Add server'}</button>
        </div>
      </section>

      {error && <div className="text-xs text-red-400">{error}</div>}

      <section className="rounded-lg border border-neutral-800 divide-y divide-neutral-900">
        {configs.length === 0 && <div className="px-4 py-6 text-xs text-neutral-500 text-center">No MCP servers configured.</div>}
        {configs.map((cfg) => {
          const live = running.find((r) => r.id === cfg.id);
          const statusColor = live?.status === 'connected' ? 'bg-emerald-400' : live?.status === 'error' ? 'bg-red-500' : 'bg-neutral-600';
          return (
            <div key={cfg.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{cfg.name}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">{cfg.transport}: {cfg.transport === 'stdio' ? `${cfg.command} ${(cfg.args || []).join(' ')}` : cfg.url}</div>
                  {live?.error && <div className="text-[10px] text-red-400 mt-1">{live.error}</div>}
                  {live?.tools?.length ? <div className="text-[10px] text-neutral-400 mt-1">Tools: {live.tools.join(', ')}</div> : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setForm(cfg)} className="text-xs text-neutral-400 hover:text-neutral-200">Edit</button>
                  <button onClick={() => void reconnect(cfg.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Reconnect</button>
                  <button onClick={() => void remove(cfg.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
