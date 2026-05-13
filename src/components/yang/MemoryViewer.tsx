'use client';

/**
 * Browse & manage YANG persistent memories (server-side, per-user, pgvector).
 */
import { useEffect, useState } from 'react';
import { memory, Memory } from '@/lib/yang/client';

export default function MemoryViewer() {
  const [items, setItems] = useState<Memory[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newKind, setNewKind] = useState<'preference' | 'fact' | 'tool_recipe' | 'schedule'>('preference');

  async function search(query: string) {
    setLoading(true); setError(null);
    try { setItems(await memory.search(query)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void search(''); }, []);

  async function add() {
    if (!newKey.trim()) return;
    try {
      await memory.save({ key: newKey.trim(), value: newValue, kind: newKind });
      setNewKey(''); setNewValue('');
      await search(q);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  async function del(key: string) {
    await memory.delete(key);
    await search(q);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Memory</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Long-term facts and preferences the AI consults on every turn.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-800 p-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Add memory</div>
        <div className="flex gap-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key (e.g. timezone)" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm" />
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as typeof newKind)} className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm">
            <option value="preference">preference</option>
            <option value="fact">fact</option>
            <option value="tool_recipe">tool_recipe</option>
            <option value="schedule">schedule</option>
          </select>
        </div>
        <textarea value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" rows={2} className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm resize-none" />
        <div className="flex justify-end">
          <button onClick={add} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white">Save</button>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Semantic search…" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') void search(q); }} />
          <button onClick={() => void search(q)} className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-md">Search</button>
        </div>
        {loading && <div className="text-xs text-neutral-500">Searching…</div>}
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-900">
          {items.length === 0 && !loading && (
            <div className="px-4 py-6 text-xs text-neutral-500 text-center">No memories yet.</div>
          )}
          {items.map((m) => (
            <div key={m.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">{m.kind}</span>
                  <span className="text-sm text-neutral-100 font-mono">{m.key}</span>
                </div>
                <div className="text-xs text-neutral-300 mt-1 whitespace-pre-wrap">{typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}</div>
              </div>
              <button onClick={() => del(m.key)} className="text-xs text-neutral-500 hover:text-red-400 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
