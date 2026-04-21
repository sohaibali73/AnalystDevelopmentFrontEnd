'use client';

/**
 * YangBackgroundTasksContext — shared live registry of background edit tasks.
 *
 * Components that render tool-results whose output contains { task_id, status: 'queued' }
 * subscribe to this context to display live progress without prop-drilling.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { pollBgTask } from '@/lib/yangApi';
import type { YangBgTask } from '@/types/yang';

interface BgTaskRecord extends YangBgTask {
  tool_call_id?: string;
  label?: string;
  started_at: number;
}

interface YangBackgroundTasksContextValue {
  tasks: Record<string, BgTaskRecord>;
  addTask: (taskId: string, toolName: string, label?: string, toolCallId?: string) => void;
  getTask: (taskId: string) => BgTaskRecord | undefined;
}

const Ctx = createContext<YangBackgroundTasksContextValue | null>(null);

const MAX_TASKS = 50;

export function YangBackgroundTasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Record<string, BgTaskRecord>>({});
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const updateTask = useCallback((taskId: string, patch: Partial<BgTaskRecord>) => {
    setTasks((prev) => ({ ...prev, [taskId]: { ...(prev[taskId] as BgTaskRecord), ...patch } }));
  }, []);

  const addTask = useCallback(
    (taskId: string, toolName: string, label?: string, toolCallId?: string) => {
      if (!taskId) return;
      setTasks((prev) => {
        if (prev[taskId]) return prev; // already tracking
        const next = {
          ...prev,
          [taskId]: {
            task_id: taskId,
            tool_name: toolName,
            status: 'running' as const,
            elapsed_s: 0,
            started_at: Date.now(),
            label,
            tool_call_id: toolCallId,
          },
        };
        // Prune if exceeding cap — keep newest 80%
        const entries = Object.entries(next);
        if (entries.length > MAX_TASKS) {
          entries.sort((a, b) => (b[1] as BgTaskRecord).started_at - (a[1] as BgTaskRecord).started_at);
          return Object.fromEntries(entries.slice(0, Math.floor(MAX_TASKS * 0.8))) as Record<string, BgTaskRecord>;
        }
        return next;
      });

      // Kick off polling
      const ctrl = new AbortController();
      controllersRef.current.set(taskId, ctrl);

      pollBgTask(
        taskId,
        (t) => {
          updateTask(taskId, {
            status: t.status,
            result: t.result,
            error: t.error,
            elapsed_s: t.elapsed_s,
          });
        },
        ctrl.signal,
      ).catch((e) => {
        console.warn('[bgTasks] polling error', taskId, e?.message || e);
        updateTask(taskId, { status: 'failed', error: e?.message || 'Polling failed' });
      }).finally(() => {
        controllersRef.current.delete(taskId);
      });
    },
    [updateTask],
  );

  const getTask = useCallback(
    (taskId: string) => tasks[taskId],
    [tasks],
  );

  // Abort all pollers on unmount
  useEffect(() => {
    return () => {
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current.clear();
    };
  }, []);

  return (
    <Ctx.Provider value={{ tasks, addTask, getTask }}>
      {children}
    </Ctx.Provider>
  );
}

export function useYangBackgroundTasks(): YangBackgroundTasksContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Allow components to render safely outside the provider (tests, standalone pages)
    return {
      tasks: {},
      addTask: () => {},
      getTask: () => undefined,
    };
  }
  return ctx;
}
