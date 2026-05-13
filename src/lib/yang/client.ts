/**
 * YANG Autopilot — REST + SSE client glue.
 *
 * Wraps the `/api/yang/*` edge proxies with typed helpers. All requests
 * automatically include the Authorization header that next-auth maintains
 * (we pull it from cookies via the existing chat client pattern — but in
 * this app, the proxy reads Authorization from the incoming request headers
 * which the browser fetch will set automatically when same-origin).
 */

export type GoalStatus =
  | 'queued'
  | 'running'
  | 'waiting_for_input'
  | 'paused'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  createdAt: number;
  finishedAt?: number | null;
  conversationId?: string | null;
  lastNote?: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  idx: number;
  kind: 'plan' | 'thought' | 'tool-call' | 'tool-result' | 'note' | 'done' | 'error';
  content: unknown;
  ts: number;
}

export interface Memory {
  id: string;
  key: string;
  kind: string;
  value: unknown;
  tags?: string[];
  updatedAt: number;
}

export interface Schedule {
  id: string;
  name: string;
  cron: string;
  prompt: string;
  enabled: boolean;
  lastRunAt?: number | null;
  nextRunAt?: number | null;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (typeof window !== 'undefined') {
    try {
      const token = window.localStorage.getItem('auth_token');
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return headers;
}

async function jsonOrThrow<T>(p: Promise<Response>): Promise<T> {
  const r = await p;
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const j = await r.json(); msg = j.detail || j.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r.json() as Promise<T>;
}

// ── Goals ───────────────────────────────────────────────────────────────────
export const goals = {
  list: () => jsonOrThrow<Goal[]>(fetch('/api/yang/goal', { cache: 'no-store', headers: authHeaders() })),
  create: (body: { title: string; description?: string; prompt: string }) =>
    jsonOrThrow<Goal>(fetch('/api/yang/goal', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })),
  get: (id: string) => jsonOrThrow<{ goal: Goal; steps: GoalStep[] }>(fetch(`/api/yang/goal/${id}`, { cache: 'no-store', headers: authHeaders() })),
  control: (id: string, action: 'pause' | 'resume' | 'cancel') =>
    jsonOrThrow<Goal>(fetch(`/api/yang/goal/${id}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action }),
    })),
  delete: (id: string) => fetch(`/api/yang/goal/${id}`, { method: 'DELETE', headers: authHeaders() }),

  /**
   * Subscribe to a goal's SSE stream. Returns an unsubscribe function.
   * The backend emits JSON-encoded events of the form:
   *   data: {"type":"step","step":{...}}\n\n
   *   data: {"type":"status","status":"running"}\n\n
   *   data: {"type":"done"}\n\n
   */
  stream(id: string, handlers: {
    onStep?: (step: GoalStep) => void;
    onStatus?: (status: GoalStatus) => void;
    onError?: (err: Error) => void;
    onDone?: () => void;
  }): () => void {
    const ctrl = new AbortController();
    void (async () => {
      try {
        const resp = await fetch(`/api/yang/goal/${id}/stream`, { signal: ctrl.signal, cache: 'no-store', headers: authHeaders() });
        if (!resp.ok || !resp.body) throw new Error(`Stream HTTP ${resp.status}`);
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            try {
              const ev = JSON.parse(json) as { type: string; step?: GoalStep; status?: GoalStatus };
              if (ev.type === 'step' && ev.step) handlers.onStep?.(ev.step);
              else if (ev.type === 'status' && ev.status) handlers.onStatus?.(ev.status);
              else if (ev.type === 'done') handlers.onDone?.();
            } catch { /* ignore malformed */ }
          }
        }
        handlers.onDone?.();
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();
    return () => ctrl.abort();
  },
};

// ── Memory ──────────────────────────────────────────────────────────────────
export const memory = {
  search: (q: string) => jsonOrThrow<Memory[]>(fetch(`/api/yang/memory?q=${encodeURIComponent(q)}`, { cache: 'no-store', headers: authHeaders() })),
  save: (body: { key: string; value: unknown; kind: string; tags?: string[] }) =>
    jsonOrThrow<Memory>(fetch('/api/yang/memory', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })),
  delete: (key: string) => fetch(`/api/yang/memory?key=${encodeURIComponent(key)}`, { method: 'DELETE', headers: authHeaders() }),
};

// ── Schedules ───────────────────────────────────────────────────────────────
export const schedules = {
  list: () => jsonOrThrow<Schedule[]>(fetch('/api/yang/schedule', { cache: 'no-store', headers: authHeaders() })),
  create: (body: { name: string; cron: string; prompt: string }) =>
    jsonOrThrow<Schedule>(fetch('/api/yang/schedule', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })),
  delete: (id: string) => fetch(`/api/yang/schedule?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() }),
};

// ── Slash-command parser ────────────────────────────────────────────────────
export type SlashCommand =
  | { kind: 'goal'; prompt: string }
  | { kind: 'remember'; text: string }
  | { kind: 'schedule'; raw: string }   // e.g. "daily 8am Run market briefing"
  | null;

export function parseSlashCommand(input: string): SlashCommand {
  const m = input.trimStart().match(/^\/(goal|remember|schedule)\s+([\s\S]*)$/i);
  if (!m) return null;
  const cmd = m[1].toLowerCase();
  const rest = m[2].trim();
  if (cmd === 'goal') return { kind: 'goal', prompt: rest };
  if (cmd === 'remember') return { kind: 'remember', text: rest };
  return { kind: 'schedule', raw: rest };
}
