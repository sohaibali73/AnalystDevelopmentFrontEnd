// Knowledge Stacks API client
// Wraps the backend /stacks/* endpoints documented in
// DevBackend/Documentation/KNOWLEDGE_STACKS_GUIDE.md

import { getApiUrl } from './env';
import { storage } from './storage';
import type {
  KnowledgeStack,
  StackDocument,
  StackSettings,
  StackUploadResult,
  StackBatchUploadResult,
  StackSearchResponse,
  StackContextResponse,
  DocumentStatus,
} from '@/types/stacks';

const API_BASE = getApiUrl();

function getToken(): string | null {
  try {
    return (
      storage.getItem('auth_token') ??
      (typeof window !== 'undefined'
        ? (() => {
            try {
              return window.localStorage.getItem('auth_token');
            } catch {
              return null;
            }
          })()
        : null)
    );
  } catch {
    return null;
  }
}

async function req<T>(
  path: string,
  method: string = 'GET',
  body?: any,
  isFormData = false,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && method !== 'GET') headers['Content-Type'] = 'application/json';

  const config: RequestInit = { method, headers, mode: 'cors', credentials: 'omit' };
  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, config);

  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    const msg = detail?.detail || detail?.message || `HTTP ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // Some DELETE endpoints may return 204
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ───────────────────────────────────────────────────────────────────────────
// Stack CRUD
// ───────────────────────────────────────────────────────────────────────────

export interface CreateStackInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  settings?: Partial<StackSettings>;
}

export interface UpdateStackInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  settings?: Partial<StackSettings>;
}

export const stacksApi = {
  // ─── CRUD ────────────────────────────────────────────────────────────────
  async list(): Promise<KnowledgeStack[]> {
    const res = await req<{ stacks: KnowledgeStack[]; count: number }>('/stacks');
    return res.stacks || [];
  },

  async get(stackId: string): Promise<KnowledgeStack> {
    return req<KnowledgeStack>(`/stacks/${stackId}`);
  },

  async create(input: CreateStackInput): Promise<KnowledgeStack> {
    return req<KnowledgeStack>('/stacks', 'POST', input);
  },

  async update(stackId: string, input: UpdateStackInput): Promise<KnowledgeStack> {
    return req<KnowledgeStack>(`/stacks/${stackId}`, 'PATCH', input);
  },

  async remove(stackId: string, cascade = true): Promise<{ success: boolean }> {
    return req<{ success: boolean }>(
      `/stacks/${stackId}?cascade=${cascade ? 'true' : 'false'}`,
      'DELETE',
    );
  },

  // ─── Ingestion ───────────────────────────────────────────────────────────
  async upload(stackId: string, file: File, title?: string): Promise<StackUploadResult> {
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    return req<StackUploadResult>(`/stacks/${stackId}/upload`, 'POST', fd, true);
  },

  async uploadBatch(stackId: string, files: File[]): Promise<StackBatchUploadResult> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return req<StackBatchUploadResult>(`/stacks/${stackId}/upload-batch`, 'POST', fd, true);
  },

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    return req<DocumentStatus>(`/brain/documents/${documentId}/status`);
  },

  // ─── Documents ───────────────────────────────────────────────────────────
  async listDocuments(
    stackId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<{
    stack_id: string;
    total: number;
    has_more: boolean;
    documents: StackDocument[];
  }> {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return req<any>(`/stacks/${stackId}/documents${qs}`);
  },

  async deleteDocument(
    stackId: string,
    documentId: string,
    deleteFileToo = true,
  ): Promise<{ success: boolean }> {
    return req<{ success: boolean }>(
      `/stacks/${stackId}/documents/${documentId}?delete_file_too=${deleteFileToo ? 'true' : 'false'}`,
      'DELETE',
    );
  },

  async moveDocument(
    stackId: string,
    documentId: string,
    targetStackId: string,
  ): Promise<{ success: boolean }> {
    return req<{ success: boolean }>(
      `/stacks/${stackId}/documents/${documentId}/move`,
      'POST',
      { target_stack_id: targetStackId },
    );
  },

  // ─── RAG ─────────────────────────────────────────────────────────────────
  async search(
    stackId: string,
    query: string,
    limit = 20,
  ): Promise<StackSearchResponse> {
    return req<StackSearchResponse>(`/stacks/${stackId}/search`, 'POST', { query, limit });
  },

  async getContext(
    stackId: string,
    opts: { query?: string; full_content?: boolean; limit?: number } = {},
  ): Promise<StackContextResponse> {
    const params = new URLSearchParams();
    if (opts.query) params.set('query', opts.query);
    if (opts.full_content) params.set('full_content', 'true');
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return req<StackContextResponse>(`/stacks/${stackId}/context${qs}`);
  },

  async reindex(stackId: string): Promise<{ success: boolean }> {
    return req<{ success: boolean }>(`/stacks/${stackId}/reindex`, 'POST');
  },
};

export default stacksApi;
