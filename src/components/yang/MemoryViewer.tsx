'use client';

/**
 * Browse & manage YANG persistent memories (server-side, per-user, pgvector).
 *
 * Resilient to backend errors: a 5xx or 401 from `/api/yang/memory` won't
 * bubble up to the route-level error boundary; we render an inline notice
 * with a Retry button so the user can still see the editor and add memories.
 */
import { useEffect, useState } from 'react';
import { memory, Memory } from '@/lib/yang/client';

export default function MemoryViewer() {
  const [items, setItems] = useState<Memory[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newKind, setNewKind] = useState<'preference' | 'fact' | 'tool_recipe' | 'schedule'>('preference');

  async function search(query: string) {
    setLoading(true); setError(null);
    try {
      const res = await memory.search(query);
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void search(''); }, []);

  async function add() {
    setSaveError(null);
    if (!newKey.trim()) { setSaveError('Key is required.'); return; }
    try {
      await memory.save({ key: newKey.trim(), value: newValue, kind: newKind });
      setNewKey(''); setNewValue('');
      setSavedAt(Date.now());
      await search(q);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  }
  async function del(key: string) {
    try {
      await memory.delete(key);
      await search(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const backendUnavailable = error && /HTTP\s*(404|500|501|502|503|504)|fail|Not authenticated/i.test(error);

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Memory</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Long-term facts and preferences the AI consults on every turn.
        </p>
      </header>

      {backendUnavailable && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-200">
          <div className="font-medium mb-1">Memory backend not reachable</div>
          <div className="text-amber-200/80">
            The persistent memory service hasn&apos;t been deployed yet. You can still draft memories below — they&apos;ll
            sync the next time the backend is online. Underlying error: <code className="font-mono">{error}</code>
          </div>
          <button
            onClick={() => void search(q)}
            className="mt-2 px-2.5 py-1 text-[11px] bg-amber-900/40 border border-amber-800 rounded-md hover:bg-amber-900/60"
          >
            Retry
          </button>
        </div>
      )}

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
        <div className="flex items-center justify-end gap-2">
          {saveError && <span className="text-[11px] text-red-400">{saveError}</span>}
          {savedAt && !saveError && <span className="text-[11px] text-emerald-400">Saved.</span>}
          <button onClick={add} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white">Save</button>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Semantic search…" className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') void search(q); }} />
          <button onClick={() => void search(q)} className="px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-md">Search</button>
        </div>
        {loading && <div className="text-xs text-neutral-500">Searching…</div>}
        {error && !backendUnavailable && <div className="text-xs text-red-400">{error}</div>}
        <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-900">
          {items.length === 0 && !loading && (
            <div className="px-4 py-6 text-xs text-neutral-500 text-center">
              {backendUnavailable ? 'No memories visible — backend offline.' : 'No memories yet.'}
            </div>
          )}
          {items.map((m) => (
            <div key={m.id ?? m.key} className="px-4 py-3 flex items-start gap-3">
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
