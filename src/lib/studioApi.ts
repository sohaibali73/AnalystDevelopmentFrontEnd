/**
 * Studio API client — Content Studio backend bindings.
 *
 * All routes live under `${API_BASE_URL}/studio/*` and use the same
 * Supabase JWT bearer token as the rest of the app.
 */

import { getApiUrl } from './env';
import { storage } from './storage';

const API_BASE = getApiUrl();

// ───── Types ──────────────────────────────────────────────────────────────

export type ProjectKind = 'pptx' | 'docx' | 'chat' | 'site';
export type ArtifactKind = 'pptx' | 'docx' | 'site';
export type Intensity = 'light' | 'standard' | 'max';
export type SeoTarget = 'linkedin' | null;
export type StyleStatus = 'draft' | 'analyzing' | 'ready' | 'failed';

export interface HumanizeSettings {
  enabled: boolean;
  intensity: Intensity;
  seo_target: SeoTarget;
  preserve_facts: boolean;
  auto_apply?: boolean;
}

export interface StudioProject {
  id: string;
  user_id: string;
  conversation_id: string;
  kind: ProjectKind;
  title: string;
  description: string;
  style_profile_id: string | null;
  humanize_settings: HumanizeSettings;
  current_artifact_id: string | null;
  thumbnail_path: string | null;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface StudioArtifact {
  id: string;
  project_id: string;
  conversation_id: string | null;
  message_id: string | null;
  source_file_id: string | null;
  kind: ArtifactKind;
  version: number;
  filename: string;
  size_bytes: number;
  slide_count: number | null;
  page_count: number | null;
  file_count?: number | null;
  edit_state: Record<string, any> | null;
  meta: Record<string, any>;
  created_at: string;
}

// ── Sites ──────────────────────────────────────────────────────────────

export interface SitePublication {
  id: string;
  project_id: string;
  artifact_id: string;
  subdomain: string;
  custom_domain: string | null;
  is_active: boolean;
  published_at: string;
  request_count: number;
}

export interface SubdomainCheck {
  available: boolean;
  reason?: string;
  subdomain: string;
}

export interface SitePublishResponse {
  publication: SitePublication;
  urls: { path_url: string; subdomain_url: string };
}

export interface SiteFilesResponse {
  artifact_id: string;
  files: Record<string, string>;
  file_count: number;
}

export interface StudioStyle {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: StyleStatus;
  voice_card?: any;
  system_prompt?: string;
  exemplars?: Array<{ text: string; score: number }>;
  fidelity_score?: number | null;
  sample_count: number;
  total_words: number;
  created_at: string;
  updated_at: string;
}

export interface StudioStyleSample {
  id: string;
  style_id: string;
  title: string;
  source: 'paste' | 'file' | 'url';
  source_url?: string | null;
  source_file_id?: string | null;
  word_count: number;
  char_count: number;
  stats: any;
  created_at: string;
}

export interface HumanizeRun {
  run_id: string;
  output: string;
  input: string;
  scores: {
    ai_detection: number;
    components: Record<string, number>;
    binoculars_ratio: number | null;
    gltr: { top1_pct: number; top10_pct: number; top100_pct: number; ai_score: number } | null;
    roberta_p_ai: number | null;
    style_fidelity: number | null;
    stats_in: any;
    stats_out: any;
    ai_detection_in: number;
  };
  passes_summary: Array<{ pass: string; ms: number; len_in: number; len_out: number; changed: boolean; ai_detection_after?: number }>;
  lost_facts: { numbers: string[]; quotes: string[]; names: string[] };
  detector_retries: number;
  duration_ms: number;
}

// ───── Edit ops ─────────────────────────────────────────────────────────

export type PptxOp =
  | { type: 'text'; slide: number; shape_index: number; value: string }
  | { type: 'text_replace'; slide?: number; find: string; replace: string; all?: boolean }
  | { type: 'add_slide_note'; slide: number; value: string }
  | { type: 'reorder_slides'; order: number[] }
  | { type: 'delete_slide'; slide: number }
  | { type: 'duplicate_slide'; slide: number };

export type DocxOp =
  | { type: 'text_replace'; find: string; replace: string; all?: boolean }
  | { type: 'replace_paragraph'; index: number; value: string }
  | { type: 'append_paragraph'; value: string; style?: string }
  | { type: 'append_heading'; value: string; level?: 1 | 2 | 3 };

export type EditOp = PptxOp | DocxOp;

// ───── Internal fetch helper ────────────────────────────────────────────

function getToken(): string | null {
  const t = storage.getItem('auth_token');
  if (t) return t;
  if (typeof window !== 'undefined') {
    try { return window.localStorage.getItem('auth_token'); } catch { return null; }
  }
  return null;
}

async function studioFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function qs(obj: Record<string, any>): string {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ───── Studio API ────────────────────────────────────────────────────────

export const studioApi = {
  // ── Projects ──────────────────────────────────────────────────────────
  listProjects: (opts: { kind?: ProjectKind; include_archived?: boolean; limit?: number; offset?: number } = {}) =>
    studioFetch<{ projects: StudioProject[]; count: number }>(`/studio/projects${qs(opts)}`),

  createProject: (body: {
    kind: ProjectKind;
    title?: string;
    description?: string;
    style_profile_id?: string | null;
    humanize_settings?: HumanizeSettings;
    conversation_id?: string;
    tags?: string[];
  }) =>
    studioFetch<{ project: StudioProject }>(`/studio/projects`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getProject: (id: string) =>
    studioFetch<{ project: StudioProject; artifacts: StudioArtifact[] }>(`/studio/projects/${id}`),

  patchProject: (id: string, body: Partial<StudioProject>) =>
    studioFetch<{ project: StudioProject }>(`/studio/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string, purge_files = true) =>
    studioFetch<{ deleted: true; id: string }>(`/studio/projects/${id}?purge_files=${purge_files}`, {
      method: 'DELETE',
    }),

  listArtifacts: (id: string) =>
    studioFetch<{ artifacts: StudioArtifact[] }>(`/studio/projects/${id}/artifacts`),

  getArtifact: (pid: string, aid: string) =>
    studioFetch<{ artifact: StudioArtifact }>(`/studio/projects/${pid}/artifacts/${aid}`),

  downloadArtifact: async (pid: string, aid: string): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/studio/projects/${pid}/artifacts/${aid}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    return res.blob();
  },

  applyEdits: (pid: string, aid: string, ops: EditOp[]) =>
    studioFetch<{ artifact: StudioArtifact }>(`/studio/projects/${pid}/artifacts/${aid}/edit`, {
      method: 'POST',
      body: JSON.stringify({ ops, save_edit_state: true }),
    }),

  uploadArtifact: (pid: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return studioFetch<{ artifact: StudioArtifact }>(`/studio/projects/${pid}/artifacts/upload`, {
      method: 'POST',
      body: fd,
    });
  },

  // ── Styles ────────────────────────────────────────────────────────────
  listStyles: () => studioFetch<{ styles: StudioStyle[] }>(`/studio/styles`),
  getStyle: (id: string) =>
    studioFetch<{ style: StudioStyle; samples: StudioStyleSample[] }>(`/studio/styles/${id}`),
  createStyle: (body: { name: string; description?: string; icon?: string; color?: string }) =>
    studioFetch<{ style: StudioStyle }>(`/studio/styles`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patchStyle: (id: string, body: Partial<StudioStyle>) =>
    studioFetch<{ style: StudioStyle }>(`/studio/styles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteStyle: (id: string) =>
    studioFetch<{ deleted: true; id: string }>(`/studio/styles/${id}`, { method: 'DELETE' }),

  addSampleText: (id: string, body: { text: string; title?: string; source_url?: string; source_file_id?: string }) =>
    studioFetch<{ sample: StudioStyleSample }>(`/studio/styles/${id}/samples`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  uploadSample: (id: string, file: File, title = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    return studioFetch<{ sample: StudioStyleSample }>(`/studio/styles/${id}/samples/upload`, {
      method: 'POST',
      body: fd,
    });
  },

  listSamples: (id: string) => studioFetch<{ samples: StudioStyleSample[] }>(`/studio/styles/${id}/samples`),
  deleteSample: (id: string, sampleId: string) =>
    studioFetch<{ deleted: true }>(`/studio/styles/${id}/samples/${sampleId}`, { method: 'DELETE' }),

  analyzeStyle: (id: string, self_test = true) =>
    studioFetch<{ style: StudioStyle }>(`/studio/styles/${id}/analyze?self_test=${self_test}`, {
      method: 'POST',
    }),
  previewStyle: (id: string, prompt: string, max_tokens = 400) =>
    studioFetch<{ output: string }>(`/studio/styles/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ prompt, max_tokens }),
    }),
  getSystemPrompt: (id: string) =>
    studioFetch<{
      status: string;
      system_prompt: string | null;
      fidelity_score: number | null;
      voice_card: any;
      exemplars: any[];
    }>(`/studio/styles/${id}/system_prompt`),

  // ── Humanize ──────────────────────────────────────────────────────────
  humanize: (body: {
    text: string;
    intensity?: Intensity;
    seo_target?: SeoTarget;
    style_profile_id?: string | null;
    project_id?: string | null;
    preserve_facts?: boolean;
  }) =>
    studioFetch<HumanizeRun>(`/studio/humanize`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  scoreText: (text: string) =>
    studioFetch<HumanizeRun['scores'] & any>(`/studio/humanize/score`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  listHumanizeRuns: (project_id?: string, limit = 50) =>
    studioFetch<{ runs: any[] }>(`/studio/humanize/runs${qs({ project_id, limit })}`),
  getHumanizeRun: (run_id: string) =>
    studioFetch<{ run: any; trace: any }>(`/studio/humanize/runs/${run_id}`),

  // ── Sites ─────────────────────────────────────────────────────────────
  // Same-origin proxy URL — works inside iframes (no CORS, forwards auth)
  sitePreviewUrl: (projectId: string, version: number, path = '') =>
    `/api/studio/sites/preview/${projectId}/${version}${path ? '/' + path.replace(/^\/+/, '') : '/'}`,
  // Direct upstream URL — used when opening preview in a new tab (will require auth)
  sitePreviewUrlDirect: (projectId: string, version: number, path = '') =>
    `${API_BASE}/studio/sites/${projectId}/preview/${version}${path ? '/' + path.replace(/^\/+/, '') : ''}`,

  getSiteFiles: (pid: string, aid: string) =>
    studioFetch<SiteFilesResponse>(`/studio/sites/${pid}/files/${aid}`),

  checkSubdomain: (sub: string) =>
    studioFetch<SubdomainCheck>(`/studio/sites/check/${encodeURIComponent(sub)}`),

  publishSite: (pid: string, body: { artifact_id: string; subdomain: string }) =>
    studioFetch<SitePublishResponse>(`/studio/sites/${pid}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  unpublishSite: (pid: string, publication_id: string) =>
    studioFetch<{ unpublished: true }>(`/studio/sites/${pid}/unpublish`, {
      method: 'POST',
      body: JSON.stringify({ publication_id }),
    }),

  listSitePublications: (pid: string) =>
    studioFetch<{ publications: SitePublication[]; count: number }>(
      `/studio/sites/${pid}/publications`,
    ),

  listAllPublications: () =>
    studioFetch<{ publications: SitePublication[]; count: number }>(
      `/studio/sites/publications`,
    ),

  fetchPreviewHtml: async (pid: string, version: number): Promise<string> => {
    const token = getToken();
    // Hit the same-origin Next.js proxy → no CORS, auth attached server-side
    const res = await fetch(`/api/studio/sites/preview/${pid}/${version}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`preview failed: ${res.status}`);
    return res.text();
  },
};

// ───── Cache invalidation event bus ────────────────────────────────────

const STUDIO_REFRESH_EVENT = 'studio:refresh';

export function emitStudioRefresh(scope: 'projects' | 'styles' | 'project', id?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STUDIO_REFRESH_EVENT, { detail: { scope, id } }));
}

export function onStudioRefresh(
  cb: (detail: { scope: string; id?: string }) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent;
    cb(ce.detail);
  };
  window.addEventListener(STUDIO_REFRESH_EVENT, handler);
  return () => window.removeEventListener(STUDIO_REFRESH_EVENT, handler);
}

export { API_BASE as STUDIO_API_BASE };
