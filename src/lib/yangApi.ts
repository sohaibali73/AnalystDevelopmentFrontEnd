/**
 * YANG API client — thin wrapper around backend /yang/* endpoints.
 * Mirrors the auth pattern used in src/lib/api.ts (Bearer token from storage).
 */

import { getApiUrl } from './env';
import { storage } from './storage';
import type {
  YangConfig,
  YangOverrides,
  YangCheckpoint,
  YangBgTask,
} from '@/types/yang';

const API_BASE_URL = getApiUrl();

function getAuthHeaders(): HeadersInit {
  const token = storage.getItem('auth_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function yangRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(err.detail || err.message || `HTTP ${response.status}`);
  }
  // 204 no-content safety
  if (response.status === 204) return {} as T;
  return response.json();
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface YangSettingsResponse extends YangConfig {
  user_id: string;
}

export async function getYangSettings(): Promise<YangSettingsResponse> {
  return yangRequest<YangSettingsResponse>('/yang/settings');
}

export async function patchYangSettings(
  patch: YangOverrides,
): Promise<{ status: string; user_id: string; updated_fields: string[]; row: any }> {
  return yangRequest('/yang/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function getYangStatus(): Promise<{
  user_id: string;
  settings: YangConfig;
  features: Record<string, { enabled: boolean; description: string; [key: string]: any }>;
}> {
  return yangRequest('/yang/status');
}

// ─── Checkpoints ─────────────────────────────────────────────────────────────

export async function listCheckpoints(conversationId: string): Promise<{
  conversation_id: string;
  checkpoints: YangCheckpoint[];
  count: number;
}> {
  return yangRequest(
    `/yang/checkpoints?conversation_id=${encodeURIComponent(conversationId)}`,
  );
}

export async function createCheckpoint(
  conversationId: string,
  label?: string | null,
): Promise<{ status: string; checkpoint: YangCheckpoint }> {
  return yangRequest('/yang/checkpoints', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId, label: label ?? null }),
  });
}

export async function restoreCheckpoint(checkpointId: string): Promise<{
  status: string;
  checkpoint_id: string;
  messages_deleted: number;
  tool_results_deleted: number;
  warning?: string;
  [key: string]: any;
}> {
  return yangRequest(`/yang/checkpoints/${encodeURIComponent(checkpointId)}/restore`, {
    method: 'POST',
  });
}

export async function deleteCheckpoint(checkpointId: string): Promise<{
  status: string;
  checkpoint_id: string;
}> {
  return yangRequest(`/yang/checkpoints/${encodeURIComponent(checkpointId)}`, {
    method: 'DELETE',
  });
}

// ─── Background tasks ────────────────────────────────────────────────────────

export async function getBgTask(taskId: string): Promise<YangBgTask> {
  return yangRequest<YangBgTask>(`/yang/tasks/${encodeURIComponent(taskId)}`);
}

/**
 * Poll a background task until terminal, with exponential backoff.
 * Caller passes onUpdate for each successful poll; resolves with the final task.
 * Aborts on AbortSignal or after ~3 minutes.
 */
export async function pollBgTask(
  taskId: string,
  onUpdate: (task: YangBgTask) => void,
  signal?: AbortSignal,
): Promise<YangBgTask> {
  const DELAYS = [1500, 1500, 2500, 2500, 4000, 4000, 6000, 6000, 8000];
  const MAX_ATTEMPTS = 30; // ~3 min worst-case
  let lastTask: YangBgTask | null = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (signal?.aborted) throw new Error('Polling aborted');
    try {
      const task = await getBgTask(taskId);
      lastTask = task;
      onUpdate(task);
      if (task.status === 'complete' || task.status === 'failed') return task;
    } catch (err) {
      if (signal?.aborted) throw err;
      // Continue polling on transient errors
    }
    const delay = DELAYS[Math.min(i, DELAYS.length - 1)];
    await new Promise((r) => setTimeout(r, delay));
  }

  if (lastTask) return lastTask;
  throw new Error(`Background task ${taskId} did not finish in time`);
}
