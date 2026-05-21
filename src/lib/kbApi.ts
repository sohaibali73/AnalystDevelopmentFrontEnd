// Knowledge Base API client — preview/library side only.
// Wraps /brain/* and /knowledge-base/* endpoints.
// Deals in KBDocument and binary blobs. NEVER returns chunks to the UI.
// The model-facing context (chunks) is handled by stacksApi.ts.

import { getApiUrl } from './env';
import { storage } from './storage';
import type {
  KBDocument,
  KBStats,
  KBUploadResult,
  KBBatchUploadResult,
  KBDocumentStatus,
  KBSearchResult,
} from '@/types/kb';

const API_BASE = getApiUrl();

function getToken(): string | null {
  try {
    return (
      storage.getItem('auth_token') ??
      (typeof window !== 'undefined' ? (() => { try { return window.localStorage.getItem('auth_token'); } catch { return null; } })() : null)
    );
  } catch {
    return null;
  }
}

async function req<T>(path: string, method: string = 'GET', body?: any, isFormData = false): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && method !== 'GET') headers['Content-Type'] = 'application/json';
  const config: RequestInit = { method, headers, mode: 'cors', credentials: 'omit' };
  if (body !== undefined) { config.body = isFormData ? body : JSON.stringify(body); }
  const res = await fetch(`${API_BASE}${path}`, config);
  if (!res.ok) {
    let detail: any = null;
    try { detail = await res.json(); } catch { /* ignore */ }
    const msg = detail?.detail || detail?.message || `HTTP ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

async function fetchBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}
// ─── Poll until ready ─────────────────────────────────────────────────────────

export async function pollUntilReady(documentId: string, opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<KBDocumentStatus> {
  const { intervalMs = 2000, timeoutMs = 120_000 } = opts;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (opts.signal?.aborted) throw new Error('Polling aborted');
    const status = await kbApi.getStatus(documentId);
    if (status.ready || status.status === 'error') return status;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, intervalMs);
      opts.signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('Polling aborted')); });
    });
  }
  throw new Error(`Document ${documentId} did not become ready within ${timeoutMs}ms`);
}
// ─── Main API object ──────────────────────────────────────────────────────────

export const kbApi = {
  async listFiles(opts: { limit?: number; offset?: number; search?: string; category?: string; tags?: string; } = {}): Promise<{ files: KBDocument[]; total: number }> {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts.offset !== undefined) params.set('offset', String(opts.offset));
    if (opts.search) params.set('search', opts.search);
    if (opts.category) params.set('category', opts.category);
    if (opts.tags) params.set('tags', opts.tags);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await req<any>(`/knowledge-base/files${qs}`);
    if (Array.isArray(res)) return { files: res, total: res.length };
    return { files: res.files ?? res.documents ?? [], total: res.total ?? 0 };
  },
  async getFile(id: string): Promise<KBDocument> { return req<KBDocument>(`/knowledge-base/files/${id}`); },
  async updateFile(id: string, data: { tags?: string[]; description?: string }): Promise<KBDocument> { return req<KBDocument>(`/knowledge-base/files/${id}`, 'PATCH', data); },
  async getStats(): Promise<KBStats> { const res = await req<any>('/knowledge-base/stats').catch(() => req<any>('/brain/stats')); return res; },
  async getRawDocument(id: string): Promise<KBDocument & { raw_content?: string }> { return req<any>(`/brain/documents/${id}`); },  async upload(file: File, opts: { title?: string; category?: string } = {}): Promise<KBUploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    if (opts.title) fd.append('title', opts.title);
    if (opts.category) fd.append('category', opts.category);
    const res = await req<any>('/brain/upload', 'POST', fd, true);
    return { document_id: res.document_id ?? res.id, status: res.status ?? 'processing', ready: res.ready ?? false, filename: res.filename ?? file.name, message: res.message };
  },
  // ─── Fast path: client parsed the bytes, server just inserts + indexes ────
  async uploadPreparsedBatch(
    documents: Array<{
      filename: string;
      file_type?: string;
      file_size?: number;
      extracted_text: string;
      content_hash: string;
      category?: string;
      tags?: string[];
      title?: string;
    }>,
  ): Promise<{
    status: string;
    summary: { total: number; successful: number; duplicates: number; failed: number };
    results: Array<{
      filename: string;
      status: 'success' | 'duplicate' | 'error';
      document_id?: string;
      ready?: boolean;
      chunks_created?: number;
      embeddings_generated?: number;
      text_length?: number;
      error?: string;
    }>;
  }> {
    return req('/brain/upload-preparsed', 'POST', { documents });
  },
  async checkHashes(hashes: string[]): Promise<{
    existing: Record<string, { document_id: string; ready: boolean; filename?: string; title?: string }>;
  }> {
    if (!hashes.length) return { existing: {} };
    return req('/brain/check-hashes', 'POST', { hashes });
  },
  async uploadBatch(files: File[], opts: { category?: string } = {}): Promise<KBBatchUploadResult> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (opts.category) fd.append('category', opts.category);
    const res = await req<any>('/brain/upload-batch', 'POST', fd, true);
    return res;
  },
  async uploadText(text: string, opts: { title?: string; category?: string } = {}): Promise<KBUploadResult> {
    const res = await req<any>('/brain/upload-text', 'POST', { text, title: opts.title, category: opts.category });
    return { document_id: res.document_id ?? res.id, status: res.status ?? 'processing', ready: res.ready ?? false };
  },
  async getStatus(documentId: string): Promise<KBDocumentStatus> { return req<KBDocumentStatus>(`/brain/documents/${documentId}/status`); },
  pollUntilReady,  getDownloadUrl(id: string): string { return `${API_BASE}/brain/documents/${id}/download`; },
  getAttachmentUrl(id: string): string { return `${API_BASE}/brain/documents/${id}/content`; },
  async fetchBlob(id: string): Promise<Blob> { return fetchBlob(`/brain/documents/${id}/download`); },
  async getStructuredPreview(id: string): Promise<any> { return req<any>(`/files/${id}/preview`); },
  async search(query: string, opts: { category?: string; limit?: number } = {}): Promise<KBSearchResult[]> {
    const res = await req<any>('/brain/search', 'POST', { query, category: opts.category, limit: opts.limit ?? 10 });
    if (Array.isArray(res)) return res;
    return res.results ?? [];
  },
  async deleteFile(id: string): Promise<{ success: boolean }> {
    return req<{ success: boolean }>(`/knowledge-base/files/${id}`, 'DELETE').catch(() => req<{ success: boolean }>(`/brain/documents/${id}`, 'DELETE'));
  },
  async reindex(id: string): Promise<{ success: boolean }> { return req<{ success: boolean }>(`/brain/documents/${id}/reindex`, 'POST'); },
  async reindexAll(): Promise<{ success: boolean }> { return req<{ success: boolean }>('/brain/reindex-all', 'POST'); },
};

export default kbApi;