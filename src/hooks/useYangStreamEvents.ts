/**
 * useYangStreamEvents — Routes YANG data-* stream items to local state.
 *
 * Wired into ChatPage's useChat onData callback. Each item coming from the
 * Next.js /api/chat proxy is inspected; if it carries a yang_* flag, it's
 * dispatched to the appropriate consumer (banner flags, focus-chain store,
 * verification badge, toast, bg task registry).
 */

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  YangFocusSnapshot,
  YangVerificationEvent,
  YangBackgroundEditEvent,
} from '@/types/yang';

export interface YangStreamState {
  planModeActive: boolean;
  planModeToolsAllowed: number;
  yoloActive: boolean;
  toolSearchActive: boolean;
  focusSnapshot: YangFocusSnapshot | null;
  verification: YangVerificationEvent | null;
  subagentsRunning: number;
}

export interface UseYangStreamEventsResult extends YangStreamState {
  /** Feed a single data-part item from useChat onData into the dispatcher. */
  handleDataItem: (item: any) => void;
  /** Reset all transient state (call on new conversation or explicit clear). */
  reset: () => void;
}

export interface UseYangStreamEventsOptions {
  /** Called when a background edit task event is seen so a polling hook can start. */
  onBackgroundEdit?: (ev: YangBackgroundEditEvent) => void;
}

const INITIAL: YangStreamState = {
  planModeActive: false,
  planModeToolsAllowed: 0,
  yoloActive: false,
  toolSearchActive: false,
  focusSnapshot: null,
  verification: null,
  subagentsRunning: 0,
};

export function useYangStreamEvents(
  options: UseYangStreamEventsOptions = {},
): UseYangStreamEventsResult {
  const [state, setState] = useState<YangStreamState>(INITIAL);
  const onBgRef = useRef(options.onBackgroundEdit);
  onBgRef.current = options.onBackgroundEdit;

  const reset = useCallback(() => setState(INITIAL), []);

  const handleDataItem = useCallback((item: any) => {
    if (!item || typeof item !== 'object') return;

    // ── Verification ──────────────────────────────────────────────────
    if (item.yang_verification) {
      setState((s) => ({
        ...s,
        verification: {
          yang_verification: true,
          verified:        !!item.verified,
          critique:        item.critique || '',
          iteration:       item.iteration || 0,
          retry_triggered: !!item.retry_triggered,
        },
      }));
      return;
    }

    // ── Focus chain snapshot ─────────────────────────────────────────
    if (item.yang_focus_chain) {
      const focus = item.focus || {};
      setState((s) => ({
        ...s,
        focusSnapshot: {
          goal:               focus.goal || '',
          open_tasks:         focus.open_tasks || [],
          completed_tasks:    focus.completed_tasks || [],
          key_files:          focus.key_files || [],
          tools_used:         focus.tools_used || [],
          turns_since_polish: focus.turns_since_polish || 0,
        },
      }));
      return;
    }

    // ── Background edit ──────────────────────────────────────────────
    if (item.yang_background_edit) {
      onBgRef.current?.(item as YangBackgroundEditEvent);
      return;
    }

    // ── Plan Mode ────────────────────────────────────────────────────
    if (item.yang_plan_mode) {
      setState((s) => ({
        ...s,
        planModeActive:       true,
        planModeToolsAllowed: item.yang_plan_mode_tools_allowed || 0,
      }));
      return;
    }

    // ── Yolo Mode ────────────────────────────────────────────────────
    if (item.yang_yolo_mode) {
      setState((s) => ({ ...s, yoloActive: true }));
      return;
    }
    if (item.yang_yolo_iteration_cap) {
      toast.warning('Yolo Mode stopped early', {
        description: `Iteration limit (${item.iteration}) reached before the agent finished tool use.`,
        duration: 7000,
      });
      return;
    }

    // ── Tool search ──────────────────────────────────────────────────
    if (item.yang_tool_search) {
      setState((s) => ({ ...s, toolSearchActive: true }));
      // Auto-clear the shimmer after a few seconds
      setTimeout(() => {
        setState((s) => ({ ...s, toolSearchActive: false }));
      }, 2000);
      return;
    }

    // ── Subagents ────────────────────────────────────────────────────
    if (item.yang_subagents_running) {
      setState((s) => ({ ...s, subagentsRunning: item.count || 0 }));
      return;
    }
  }, []);

  return { ...state, handleDataItem, reset };
}
