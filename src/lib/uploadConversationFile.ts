/**
 * uploadConversationFile
 * ----------------------
 * Posts a multipart/form-data file upload DIRECTLY to the FastAPI backend
 * at  POST /upload/conversations/{conversationId}, bypassing the Next.js
 * proxy route at app/api/upload/route.ts.
 *
 * Why bypass the proxy:
 *   • The proxy buffers the entire request body via `await req.formData()`
 *     before forwarding, so the upload counts against the platform's
 *     serverless body limit (4.5 MB on Vercel) BEFORE it ever reaches
 *     the backend's much larger 10 GB cap.
 *   • The proxy adds no value — no auth, no normalization, no headers.
 *   • Going direct also removes a TLS hop and improves throughput.
 *
 * If you're tempted to add a custom Authorization or progress UI here,
 * keep them as caller-provided options instead of growing this helper.
 */

import { getApiUrl } from './env';
import { storage } from './storage';

const API_BASE = getApiUrl();

export interface UploadConversationFileOptions {
  /** Optional AbortSignal to cancel mid-upload (e.g. component unmount). */
  signal?: AbortSignal;
  /** Timeout in ms; defaults to 60s. Pass 0 to disable. */
  timeoutMs?: number;
  /** Override the bearer token (default: read from auth_token storage). */
  bearerToken?: string;
}

export interface UploadConversationFileResult {
  // The backend's FileInfo shape — we only declare the fields the UI uses.
  id?:           string;
  file_id?:      string;
  filename?:     string;
  size?:         number;
  content_type?: string;
  is_template?:  boolean;
  template_id?:  string;
  // Plus arbitrary extra fields the backend may add.
  [key: string]: unknown;
}

function readAuthToken(): string | null {
  try {
    return (
      storage.getItem('auth_token') ??
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('auth_token')
        : null)
    );
  } catch {
    return null;
  }
}

export async function uploadConversationFile(
  conversationId: string,
  file: File | Blob,
  filename?: string,
  options: UploadConversationFileOptions = {},
): Promise<UploadConversationFileResult> {
  const fd = new FormData();
  if (file instanceof File) {
    fd.append('file', file);
  } else {
    fd.append('file', file, filename ?? 'file');
  }

  const token = options.bearerToken ?? readAuthToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Allow caller-provided AbortSignal; otherwise install our own timeout.
  let signal = options.signal;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutMs = options.timeoutMs ?? 60_000;
  if (!signal && timeoutMs > 0) {
    const ctrl = new AbortController();
    timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);
    signal = ctrl.signal;
  }

  try {
    const resp = await fetch(
      `${API_BASE}/upload/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: fd,
        signal,
      },
    );

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      const detail =
        (errBody as { detail?: string; error?: string }).detail ||
        (errBody as { detail?: string; error?: string }).error ||
        `HTTP ${resp.status}`;
      const err = new Error(detail) as Error & { status?: number };
      err.status = resp.status;
      throw err;
    }
    return (await resp.json()) as UploadConversationFileResult;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default uploadConversationFile;
