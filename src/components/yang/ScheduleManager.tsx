'use client';

/**
 * Manage cron-style scheduled YANG goals (e.g. "Daily 8am market briefing").
 */
import { useEffect, useState } from 'react';
import { schedules, Schedule } from '@/lib/yang/client';

const COMMON_PRESETS: Array<{ label: string; cron: string }> = [
  { label: 'Every day at 08:00',  cron: '0 8 * * *' },
  { label: 'Weekdays at 09:00',   cron: '0 9 * * 1-5' },
  { label: 'Every Monday 09:00',  cron: '0 9 * * 1' },
  { label: 'Every hour',          cron: '0 * * * *' },
];

export default function ScheduleManager() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 8 * * *');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try { setItems(await schedules.list()); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  useEffect(() => { void refresh(); }, []);

  async function add() {
    if (!name.trim() || !cron.trim() || !prompt.trim()) return;
    try {
      await schedules.create({ name: name.trim(), cron: cron.trim(), prompt: prompt.trim() });
      setName(''); setPrompt('');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  async function del(id: string) { await schedules.delete(id); await refresh(); }

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Schedules</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Recurring goals that YANG runs on a cron-style schedule (daily briefings, periodic scans, etc.).
        </p>
      </header>

      <section className="rounded-lg border border-neutral-800 p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">New schedule</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Daily Market Briefing)" className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
        <div className="flex gap-2 items-center">
          <input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 8 * * *" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm font-mono" />
          <select onChange={(e) => setCron(e.target.value)} value="" className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm">
            <option value="" disabled>Preset…</option>
            {COMMON_PRESETS.map((p) => <option key={p.cron} value={p.cron}>{p.label}</option>)}
          </select>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt to run as a goal each time…" rows={3} className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm resize-none" />
        <div className="flex justify-end">
          <button onClick={add} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white">Save schedule</button>
        </div>
      </section>

      {error && <div className="text-xs text-red-400">{error}</div>}

      <section className="rounded-lg border border-neutral-800 divide-y divide-neutral-900">
        {items.length === 0 && (
          <div className="px-4 py-6 text-xs text-neutral-500 text-center">No schedules yet.</div>
        )}
        {items.map((s) => (
          <div key={s.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  <span className="text-sm text-neutral-100">{s.name}</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1 font-mono">{s.cron}</div>
                <div className="text-xs text-neutral-400 mt-1 whitespace-pre-wrap line-clamp-3">{s.prompt}</div>
                {s.nextRunAt && (
                  <div className="text-[10px] text-neutral-500 mt-1">Next run: {new Date(s.nextRunAt).toLocaleString()}</div>
                )}
              </div>
              <button onClick={() => del(s.id)} className="text-xs text-neutral-500 hover:text-red-400 shrink-0">Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
