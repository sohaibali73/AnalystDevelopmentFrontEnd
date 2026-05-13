'use client';

/**
 * Detail view for one YANG Autopilot goal. Shows the plan, step timeline,
 * and pause/resume/cancel controls. Auto-subscribes to the goal's SSE stream
 * so steps appear in real time.
 */
import { useEffect, useState } from 'react';
import { goals as goalsApi, Goal, GoalStep } from '@/lib/yang/client';
import { goalsStore, useGoalsStore } from '@/lib/yang/store';

export default function GoalView({ goalId }: { goalId: string }) {
  const { stepsByGoal, goals: list } = useGoalsStore();
  const [bootstrap, setBootstrap] = useState<{ goal: Goal; steps: GoalStep[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap from REST if we don't have it cached.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await goalsApi.get(goalId);
        if (!cancelled) setBootstrap(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [goalId]);

  // Compose final view from bootstrap + live store updates.
  const goal = list.find((g) => g.id === goalId) || bootstrap?.goal;
  const liveSteps = stepsByGoal[goalId] || [];
  const allSteps = bootstrap ? mergeSteps(bootstrap.steps, liveSteps) : liveSteps;

  if (!goal) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        {error ? <span className="text-red-400">{error}</span> : 'Loading goal…'}
      </div>
    );
  }

  const terminal = goal.status === 'done' || goal.status === 'failed' || goal.status === 'cancelled';

  return (
    <div className="p-6 max-w-3xl mx-auto text-neutral-100 space-y-5">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-neutral-500">{goal.status.replace('_', ' ')}</div>
        <h1 className="text-xl font-semibold mt-0.5">{goal.title}</h1>
        {goal.description && <p className="text-sm text-neutral-400 mt-1">{goal.description}</p>}
        <div className="flex items-center gap-2 mt-3">
          {!terminal && goal.status !== 'paused' && (
            <button onClick={() => goalsStore.pause(goalId)} className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800">Pause</button>
          )}
          {goal.status === 'paused' && (
            <button onClick={() => goalsStore.resume(goalId)} className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-white">Resume</button>
          )}
          {!terminal && (
            <button onClick={() => goalsStore.cancel(goalId)} className="px-3 py-1.5 text-xs bg-red-900 hover:bg-red-800 text-red-100 rounded-md">Cancel</button>
          )}
          {terminal && (
            <button onClick={() => goalsStore.remove(goalId)} className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800">Delete</button>
          )}
        </div>
      </header>

      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2 font-medium">Timeline</div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 divide-y divide-neutral-900 max-h-[60vh] overflow-y-auto">
          {allSteps.length === 0 && (
            <div className="px-4 py-8 text-xs text-neutral-500 text-center">No steps yet — YANG is preparing the plan.</div>
          )}
          {allSteps.map((s) => <StepRow key={s.id || `${s.idx}-${s.ts}`} step={s} />)}
        </div>
      </section>
    </div>
  );
}

function StepRow({ step }: { step: GoalStep }) {
  const colors: Record<GoalStep['kind'], string> = {
    plan:          'text-blue-300',
    thought:       'text-neutral-300',
    'tool-call':   'text-amber-300',
    'tool-result': 'text-emerald-300',
    note:          'text-neutral-200',
    done:          'text-emerald-400',
    error:         'text-red-400',
  };
  return (
    <div className="px-4 py-2 flex items-start gap-3">
      <div className={`text-[10px] uppercase tracking-wider font-mono shrink-0 w-20 mt-1 ${colors[step.kind] || 'text-neutral-500'}`}>{step.kind}</div>
      <div className="flex-1 min-w-0">
        <pre className="text-xs text-neutral-200 whitespace-pre-wrap break-words font-mono leading-relaxed">
{typeof step.content === 'string' ? step.content : JSON.stringify(step.content, null, 2)}
        </pre>
        <div className="text-[10px] text-neutral-600 mt-1">{new Date(step.ts).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function mergeSteps(a: GoalStep[], b: GoalStep[]): GoalStep[] {
  const seen = new Set<string>();
  const out: GoalStep[] = [];
  for (const s of [...a, ...b]) {
    const key = s.id || `${s.idx}-${s.ts}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.sort((x, y) => x.idx - y.idx || x.ts - y.ts);
}
