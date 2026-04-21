/**
 * YANG Advanced Agentic Features — Types
 * Mirrors backend core/yang/settings.py YangConfig and stream payloads.
 */

export interface YangConfig {
  subagents: boolean;
  parallel_tools: boolean;
  plan_mode: boolean;
  tool_search: boolean;
  auto_compact: boolean;
  focus_chain: boolean;
  background_edit: boolean;
  checkpoints: boolean;
  yolo_mode: boolean;
  double_check: boolean;
  advanced?: YangAdvanced;
}

export interface YangAdvanced {
  subagent_max?: number;
  compact_token_threshold?: number;
  focus_llm_every_n?: number;
  double_check_model?: string;
  compact_model?: string;
  focus_model?: string;
  [key: string]: any;
}

export type YangOverrides = Partial<YangConfig>;

export const YANG_DEFAULTS: YangConfig = {
  subagents:       false,
  parallel_tools:  false,
  plan_mode:       false,
  tool_search:     false,
  auto_compact:    false,
  focus_chain:     false,
  background_edit: false,
  checkpoints:     false,
  yolo_mode:       false,
  double_check:    false,
  advanced: {
    subagent_max:            3,
    compact_token_threshold: 120000,
    focus_llm_every_n:       5,
  },
};

// ─── Checkpoints ─────────────────────────────────────────────────────────────

export type CheckpointTrigger =
  | 'manual'
  | 'auto'
  | 'pre_yolo'
  | 'pre_compact'
  | 'pre_restore';

export interface YangCheckpoint {
  id: string;
  conversation_id: string;
  user_id: string;
  label: string | null;
  trigger: CheckpointTrigger;
  last_message_id: string | null;
  focus_snapshot?: Record<string, any> | null;
  created_at: string;
}

// ─── Background edit tasks ───────────────────────────────────────────────────

export type BgTaskStatus = 'running' | 'complete' | 'failed';

export interface YangBgTask {
  task_id: string;
  tool_name: string;
  status: BgTaskStatus;
  result?: any;
  error?: string;
  elapsed_s: number;
  /** local-only fields, populated by the frontend hook */
  tool_call_id?: string;
  label?: string;
  started_at?: number;
}

// ─── Focus chain snapshot ────────────────────────────────────────────────────

export interface YangFocusSnapshot {
  goal: string;
  open_tasks: string[];
  completed_tasks: string[];
  key_files: string[];
  tools_used: string[];
  turns_since_polish: number;
}

// ─── Stream event payloads (from backend data-* SSE items) ───────────────────

export interface YangVerificationEvent {
  yang_verification: true;
  verified: boolean;
  critique: string;
  iteration: number;
  retry_triggered: boolean;
}

export interface YangFocusChainEvent {
  yang_focus_chain: true;
  focus: YangFocusSnapshot;
}

export interface YangBackgroundEditEvent {
  yang_background_edit: true;
  task_id: string;
  tool_name: string;
  tool: string;
  tool_call_id: string;
  label: string;
  poll_url: string;
  message?: string;
}

export interface YangPlanModeEvent {
  yang_plan_mode: true;
  yang_plan_mode_tools_allowed: number;
  message?: string;
}

export interface YangYoloActiveEvent {
  yang_yolo_mode: true;
  message?: string;
}

export interface YangYoloCapEvent {
  yang_yolo_iteration_cap: true;
  iteration: number;
}

export interface YangToolSearchEvent {
  yang_tool_search: true;
  message?: string;
}

export interface YangSubagentsRunningEvent {
  yang_subagents_running: true;
  count: number;
  message?: string;
}

export type YangStreamEvent =
  | YangVerificationEvent
  | YangFocusChainEvent
  | YangBackgroundEditEvent
  | YangPlanModeEvent
  | YangYoloActiveEvent
  | YangYoloCapEvent
  | YangToolSearchEvent
  | YangSubagentsRunningEvent;

/** Type-guard helpers — prefer these over raw property access. */
export function isYangEvent(item: any): item is YangStreamEvent {
  if (!item || typeof item !== 'object') return false;
  return (
    'yang_verification' in item ||
    'yang_focus_chain' in item ||
    'yang_background_edit' in item ||
    'yang_plan_mode' in item ||
    'yang_yolo_mode' in item ||
    'yang_yolo_iteration_cap' in item ||
    'yang_tool_search' in item ||
    'yang_subagents_running' in item
  );
}
