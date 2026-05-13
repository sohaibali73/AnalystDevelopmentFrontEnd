'use client';

/**
 * Sidebar dock listing all YANG Autopilot goals with live status pills.
 * Renders empty (no-op) in non-desktop builds since YANG is desktop-only.
 */
import { useState } from 'react';
import { isDesktop } from '@/lib/desktop/bridge';
import { useGoalsStore, useGoalsLoader, goalsStore } from '@/lib/yang/store';
import { Goal } from '@/lib/yang/client';

const statusColor: Record<Goal['status'], string> = {
  queued: 'bg-neutral-500',
  running: 'bg-emerald-400 animate-pulse',
  waiting_for_input: 'bg-amber-400 animate-pulse',
  paused: 'bg-amber-600',
  done: 'bg-emerald-700',
  failed: 'bg-red-500',
  cancelled: 'bg-neutral-700',
};

export default function GoalsDock() {
  const enabled = isDesktop();
  useGoalsLoader(enabled);
  const { goals, loading, error } = useGoalsStore();
  const [creating, setCreating] = useState(false);
  const [prompt, setPrompt] = useState('');

  if (!enabled) return null;

  async function create() {
    if (!prompt.trim()) return;
    try {
      await goalsStore.create(prompt.trim());
      setPrompt('');
      setCreating(false);
    } catch (err) {
      console.warn('[yang] create goal failed', err);
    }
  }

  return (
    <aside className="w-72 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col h-full">
      <header className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider font-medium text-neutral-400">YANG Goals</div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-neutral-300 hover:text-white text-sm font-bold"
          title="New goal"
        >
          {creating ? '×' : '+'}
        </button>
      </header>
      {creating && (
        <div className="px-3 py-2 border-b border-neutral-900 bg-neutral-950">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should YANG work on? (long-running task)"
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-100 resize-none focus:outline-none focus:border-neutral-700"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setCreating(false)} className="text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
            <button onClick={create} className="text-xs bg-neutral-100 text-neutral-900 px-2.5 py-1 rounded-md font-medium hover:bg-white">Start</button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {loading && goals.length === 0 && (
          <div className="px-4 py-6 text-xs text-neutral-500 text-center">Loading…</div>
        )}
        {error && (
          <div className="px-4 py-2 text-xs text-red-400">{error}</div>
        )}
        {!loading && goals.length === 0 && (
          <div className="px-4 py-6 text-xs text-neutral-500 text-center">
            No goals yet. Use <kbd className="px-1 py-0.5 bg-neutral-900 rounded">/goal …</kbd> in chat or click <kbd className="px-1">+</kbd>.
          </div>
        )}
        {goals.map((g) => (
          <a
            key={g.id}
            href={`/yang/goals/${g.id}`}
            className="block px-4 py-3 border-b border-neutral-900 hover:bg-neutral-900 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${statusColor[g.status]}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-neutral-100 truncate">{g.title}</div>
                <div className="text-[10px] text-neutral-500 capitalize mt-0.5">{g.status.replace('_', ' ')}</div>
                {g.lastNote && <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{g.lastNote}</div>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
