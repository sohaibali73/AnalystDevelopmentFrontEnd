/**
 * YANG Autopilot — lightweight in-memory store for goals/steps shared by
 * dock + detail view. Subscribes to per-goal SSE streams and keeps state
 * in sync until the page is reloaded.
 *
 * For persistence across reloads we rely on the backend (`/api/yang/goal`
 * `GET` rehydrates everything).
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { goals, Goal, GoalStep } from './client';

interface State {
  goals: Goal[];
  stepsByGoal: Record<string, GoalStep[]>;
  loading: boolean;
  error: string | null;
}

let state: State = { goals: [], stepsByGoal: {}, loading: false, error: null };
const listeners = new Set<() => void>();

function emit() { for (const l of listeners) l(); }

function set(updater: (s: State) => State) {
  state = updater(state);
  emit();
}

const activeStreams = new Map<string, () => void>();

function watchGoal(goalId: string) {
  if (activeStreams.has(goalId)) return;
  const off = goals.stream(goalId, {
    onStep: (step) => {
      set((s) => ({
        ...s,
        stepsByGoal: { ...s.stepsByGoal, [goalId]: [...(s.stepsByGoal[goalId] || []), step] },
        goals: s.goals.map((g) => (g.id === goalId && step.kind === 'note' ? { ...g, lastNote: String(step.content).slice(0, 120) } : g)),
      }));
    },
    onStatus: (status) => {
      set((s) => ({
        ...s,
        goals: s.goals.map((g) => (g.id === goalId ? { ...g, status } : g)),
      }));
    },
    onDone: () => {
      const stop = activeStreams.get(goalId);
      if (stop) stop();
      activeStreams.delete(goalId);
    },
    onError: () => {
      activeStreams.delete(goalId);
    },
  });
  activeStreams.set(goalId, off);
}

function stopWatchingTerminated() {
  for (const g of state.goals) {
    if (g.status === 'done' || g.status === 'failed' || g.status === 'cancelled') {
      const off = activeStreams.get(g.id);
      if (off) { off(); activeStreams.delete(g.id); }
    }
  }
}

export const goalsStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  },
  getSnapshot() { return state; },

  async refresh() {
    set((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await goals.list();
      set((s) => ({ ...s, goals: list, loading: false }));
      // Watch all non-terminal goals.
      for (const g of list) {
        if (g.status === 'running' || g.status === 'queued' || g.status === 'waiting_for_input') {
          watchGoal(g.id);
        }
      }
      stopWatchingTerminated();
    } catch (err) {
      set((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }));
    }
  },

  async create(prompt: string, title?: string): Promise<Goal> {
    const g = await goals.create({ prompt, title: title || prompt.slice(0, 60) });
    set((s) => ({ ...s, goals: [g, ...s.goals] }));
    watchGoal(g.id);
    return g;
  },

  async pause(id: string) { await goals.control(id, 'pause'); await this.refresh(); },
  async resume(id: string) { await goals.control(id, 'resume'); await this.refresh(); },
  async cancel(id: string) { await goals.control(id, 'cancel'); await this.refresh(); },
  async remove(id: string) {
    await goals.delete(id);
    set((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
      stepsByGoal: Object.fromEntries(Object.entries(s.stepsByGoal).filter(([k]) => k !== id)),
    }));
    const off = activeStreams.get(id);
    if (off) { off(); activeStreams.delete(id); }
  },

  stopAll() {
    for (const off of activeStreams.values()) off();
    activeStreams.clear();
  },
};

export function useGoalsStore() {
  return useSyncExternalStore(goalsStore.subscribe, goalsStore.getSnapshot, goalsStore.getSnapshot);
}

export function useGoalsLoader(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void goalsStore.refresh();
    const i = setInterval(() => { void goalsStore.refresh(); }, 30_000); // soft refresh
    return () => clearInterval(i);
  }, [enabled]);
}
