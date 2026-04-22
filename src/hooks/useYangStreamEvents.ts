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
  YangAutoCompactEvent,
  YangTokenUsageEvent,
  YangCompactionCompleteEvent,
} from '@/types/yang';

export interface YangTokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  context_window: number;
  utilization_pct: number;
  iteration: number;
}

export interface YangStreamState {
  planModeActive: boolean;
  planModeToolsAllowed: number;
  yoloActive: boolean;
  toolSearchActive: boolean;
  focusSnapshot: YangFocusSnapshot | null;
  verification: YangVerificationEvent | null;
  subagentsRunning: number;
  /** Set briefly when auto-compact fires; carries the last compaction event. */
  autoCompact: YangAutoCompactEvent | null;
  /** Live token counter — updated after every API iteration. */
  tokenUsage: YangTokenUsage | null;
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
  /**
   * Called when compaction fully completes. If ev.refresh_conversation is true,
   * the caller should reload messages to give the "new conversation" feel.
   */
  onCompactionComplete?: (ev: YangCompactionCompleteEvent) => void;
}

const INITIAL: YangStreamState = {
  planModeActive: false,
  planModeToolsAllowed: 0,
  yoloActive: false,
  toolSearchActive: false,
  focusSnapshot: null,
  verification: null,
  subagentsRunning: 0,
  autoCompact: null,
  tokenUsage: null,
};

export function useYangStreamEvents(
  options: UseYangStreamEventsOptions = {},
): UseYangStreamEventsResult {
  const [state, setState] = useState<YangStreamState>(INITIAL);
  const onBgRef = useRef(options.onBackgroundEdit);
  onBgRef.current = options.onBackgroundEdit;
  const onCompactionRef = useRef(options.onCompactionComplete);
  onCompactionRef.current = options.onCompactionComplete;

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

    // ── Auto-compact (started) ────────────────────────────────────────
    if (item.yang_auto_compact) {
      const ev = item as YangAutoCompactEvent;
      setState((s) => ({ ...s, autoCompact: ev }));

      toast.info('Compressing history…', {
        description: `${ev.utilization_pct.toFixed(1)}% context used — summarizing old messages.`,
        duration: 4000,
        icon: '🗜',
      });

      // Auto-clear the state badge after 8 s so it doesn't linger forever.
      setTimeout(() => {
        setState((s) => ({ ...s, autoCompact: null }));
      }, 8000);
      return;
    }

    // ── Compaction complete ───────────────────────────────────────────
    // Triggers a message list refresh so old (soft-deleted) messages
    // disappear and only the compact summary + recent messages remain.
    if (item.yang_compaction_complete) {
      const ev = item as YangCompactionCompleteEvent;

      toast.success('Context compressed', {
        description: `${ev.compacted_count} older messages summarized. History refreshed.`,
        duration: 5000,
        icon: '✨',
      });

      // Clear the "compressing" badge
      setState((s) => ({ ...s, autoCompact: null }));

      // Notify caller to reload messages (gives "new convo in same pane" feel)
      onCompactionRef.current?.(ev);
      return;
    }

    // ── Live token counter ────────────────────────────────────────────
    if (item.yang_token_usage) {
      setState((s) => ({
        ...s,
        tokenUsage: {
          input_tokens:          item.input_tokens          ?? 0,
          output_tokens:         item.output_tokens         ?? 0,
          cache_read_tokens:     item.cache_read_tokens     ?? 0,
          cache_creation_tokens: item.cache_creation_tokens ?? 0,
          context_window:        item.context_window        ?? 0,
          utilization_pct:       item.utilization_pct       ?? 0,
          iteration:             item.iteration             ?? 1,
        },
      }));
      return;
    }
  }, []);

  return { ...state, handleDataItem, reset };
}
