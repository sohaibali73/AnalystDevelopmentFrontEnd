// Conversation IDE workspace API client.
// Wraps /workspace/{conversation_id}/files/* endpoints. Lives next to
// kbApi.ts and stacksApi.ts and follows the same auth-aware `req<T>()`
// pattern (Authorization: Bearer <jwt> picked up from localStorage).

import { getApiUrl } from './env';
import { storage } from './storage';

const API_BASE = getApiUrl();

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkspaceLanguage =
  | 'python' | 'javascript' | 'typescript'
  | 'afl'    | 'sql'        | 'json'
  | 'yaml'   | 'markdown'   | 'text';

export type WorkspaceAuthor = 'agent' | 'user' | 'system';

export interface WorkspaceFileSummary {
  id:          string | null;
  filename:    string;
  language:    WorkspaceLanguage;
  version:     number;
  last_author: WorkspaceAuthor;
  created_at:  string | null;
  updated_at:  string | null;
  size_bytes:  number;
}

export interface WorkspaceFile extends WorkspaceFileSummary {
  content:         string;
  conversation_id: string | null;
}

export interface WorkspaceWriteRequest {
  content:   string;
  language?: WorkspaceLanguage;
  author?:   WorkspaceAuthor;
}

export interface WorkspaceExecuteResponse {
  success:            boolean;
  filename:           string;
  language:           WorkspaceLanguage;
  output?:            string;
  error?:             string;
  exit_code?:         number | null;
  artifacts?:         unknown[];
  execution_time_ms?: number | null;
}

// SSE frame shapes (live execution stream). Backend buffers stdout/stderr
// per line with a 50 ms idle flush and pushes chunks as the script writes
// them. The `end` event carries `timed_out: true` (and exit_code 124) when
// the sandbox kills a script that overruns SANDBOX_STREAM_TIMEOUT_S.
export type WorkspaceStreamEvent =
  | { event: 'start';  data: { filename: string; language: string } }
  | { event: 'stdout'; data: { text: string } }
  | { event: 'stderr'; data: { text: string } }
  | { event: 'end';    data: {
        success: boolean;
        exit_code: number | null;
        execution_time_ms: number | null;
        timed_out: boolean;
      } }
  | { event: 'error';  data: { message: string } };

export interface WorkspaceStreamHandlers {
  onStart?:  (d: { filename: string; language: string }) => void;
  onStdout?: (d: { text: string }) => void;
  onStderr?: (d: { text: string }) => void;
  onEnd?:    (d: {
    success: boolean;
    exit_code: number | null;
    execution_time_ms: number | null;
    timed_out: boolean;
  }) => void;
  onError?:  (d: { message: string }) => void;
}

/** Languages the backend can actually execute right now. */
export const EXECUTABLE_LANGUAGES: ReadonlyArray<WorkspaceLanguage> = ['python', 'javascript'];

/** Map a backend language to a Monaco languageId. AFL has no Monaco grammar
 *  out of the box; JavaScript-ish highlighting is the closest approximation. */
export function monacoLanguageFor(lang: WorkspaceLanguage): string {
  switch (lang) {
    case 'afl':    return 'javascript';
    case 'python': return 'python';
    case 'sql':    return 'sql';
    case 'json':   return 'json';
    case 'yaml':   return 'yaml';
    case 'markdown': return 'markdown';
    case 'typescript': return 'typescript';
    case 'javascript': return 'javascript';
    case 'text':
    default: return 'plaintext';
  }
}

/** Pick a language from a filename's extension. Used when the agent skips
 *  the `language` field on a write — keeps the editor highlighting useful. */
export function inferLanguageFromFilename(filename: string): WorkspaceLanguage {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'py') return 'python';
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'javascript';
  if (ext === 'ts' || ext === 'tsx') return 'typescript';
  if (ext === 'afl') return 'afl';
  if (ext === 'sql') return 'sql';
  if (ext === 'json') return 'json';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  return 'text';
}

// ─── auth + transport ────────────────────────────────────────────────────────

/** Read the current JWT — exposed so the SSE client can put it into the
 *  query string (EventSource can't set an Authorization header). */
export function getWorkspaceAuthToken(): string | null {
  try {
    return (
      storage.getItem('auth_token') ??
      (typeof window !== 'undefined'
        ? (() => { try { return window.localStorage.getItem('auth_token'); } catch { return null; } })()
        : null)
    );
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return getWorkspaceAuthToken();
}

async function req<T>(path: string, method: string = 'GET', body?: unknown): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (method !== 'GET' && body !== undefined) headers['Content-Type'] = 'application/json';

  const config: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'omit',
  };
  if (body !== undefined) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, config);
  if (res.status === 404) {
    // For reads, callers expect null on 404 (the endpoint returns 404 for
    // files that don't exist on this conversation).
    const err = new Error('not_found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    let detail: unknown = null;
    try { detail = await res.json(); } catch { /* ignore */ }
    const detailMsg =
      detail && typeof detail === 'object' && detail !== null
        ? (detail as { detail?: string; message?: string }).detail ??
          (detail as { detail?: string; message?: string }).message
        : undefined;
    const msg = detailMsg || `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

const enc = encodeURIComponent;

// ─── Endpoints ───────────────────────────────────────────────────────────────

export const workspaceApi = {
  async listFiles(conversationId: string): Promise<WorkspaceFileSummary[]> {
    const data = await req<WorkspaceFileSummary[] | { files: WorkspaceFileSummary[] }>(
      `/workspace/${enc(conversationId)}/files`,
    );
    return Array.isArray(data) ? data : data.files ?? [];
  },

  async readFile(
    conversationId: string,
    filename: string,
  ): Promise<WorkspaceFile | null> {
    try {
      return await req<WorkspaceFile>(
        `/workspace/${enc(conversationId)}/files/${enc(filename)}`,
      );
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  },

  async writeFile(
    conversationId: string,
    filename: string,
    body: WorkspaceWriteRequest,
  ): Promise<WorkspaceFile> {
    return req<WorkspaceFile>(
      `/workspace/${enc(conversationId)}/files/${enc(filename)}`,
      'PUT',
      body,
    );
  },

  async deleteFile(conversationId: string, filename: string): Promise<boolean> {
    const r = await req<{ removed: boolean; filename: string }>(
      `/workspace/${enc(conversationId)}/files/${enc(filename)}`,
      'DELETE',
    );
    return !!r.removed;
  },

  async executeFile(
    conversationId: string,
    filename: string,
  ): Promise<WorkspaceExecuteResponse> {
    return req<WorkspaceExecuteResponse>(
      `/workspace/${enc(conversationId)}/files/${enc(filename)}/execute`,
      'POST',
    );
  },

  /**
   * Open a streaming execution. Backend supports JWT via `?token=` because
   * EventSource cannot set an Authorization header. Returns a cancel
   * function — call it to abort the run (closes the EventSource; the backend
   * sandbox keeps running until natural completion or timeout).
   *
   * To prevent EventSource's built-in auto-reconnect from looping on a 401
   * we treat the first `error` event before any `start` as a hard failure
   * and close immediately.
   */
  streamExecuteFile(
    conversationId: string,
    filename: string,
    handlers: WorkspaceStreamHandlers,
  ): () => void {
    const token = getToken();
    if (!token) {
      handlers.onError?.({ message: 'Not authenticated' });
      return () => {};
    }
    const qs = `?token=${enc(token)}`;
    const url =
      `${API_BASE}/workspace/${enc(conversationId)}/files/${enc(filename)}/execute/stream` +
      qs;

    const es = new EventSource(url);
    let started = false;

    es.addEventListener('start', (e) => {
      started = true;
      try { handlers.onStart?.(JSON.parse((e as MessageEvent).data)); } catch {/* */}
    });
    es.addEventListener('stdout', (e) => {
      try { handlers.onStdout?.(JSON.parse((e as MessageEvent).data)); } catch {/* */}
    });
    es.addEventListener('stderr', (e) => {
      try { handlers.onStderr?.(JSON.parse((e as MessageEvent).data)); } catch {/* */}
    });
    es.addEventListener('end', (e) => {
      try { handlers.onEnd?.(JSON.parse((e as MessageEvent).data)); } catch {/* */}
      es.close();
    });
    // Named application-level 'error' frame from the server.
    es.addEventListener('error', (e) => {
      // Two distinct error sources land on this listener:
      //   (a) a real server-pushed `event: error\n data: {"message": ...}` frame
      //   (b) a low-level EventSource failure (connection dropped / 401)
      // Try to parse application errors; if there's no data we're in case (b).
      try {
        const data = (e as MessageEvent).data;
        if (data) {
          handlers.onError?.(JSON.parse(data));
          es.close();
          return;
        }
      } catch {/* fall through */}
      // Connection-level error: if we never got `start`, this is almost
      // certainly a 401 (bad/expired token) — surface that. Otherwise the
      // remote already finished and the browser closed the socket.
      if (!started) {
        handlers.onError?.({ message: 'Stream auth failed or backend unreachable' });
        es.close();
      }
    });

    return () => { try { es.close(); } catch {/* */} };
  },
};

export default workspaceApi;
