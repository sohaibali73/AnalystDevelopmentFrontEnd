/**
 * PPTX Intelligence API Client
 *
 * Wraps the supercharged POST /pptx/ai endpoint and all supporting
 * /pptx/* endpoints. Uses the same proxy pattern as pptxApi.ts.
 *
 * Primary entry point: pptxAi(prompt, files?, fileIds?, extraParams?)
 * → AI classifies intent → executes right pipeline → returns result
 */

import { storage } from '@/lib/storage';

const PROXY_PREFIX = '/api/backend';

function getAuthHeaders(): HeadersInit {
  const token = storage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PptxAiParams {
  prompt: string;
  files?: File[];
  fileIds?: string[];
  extraParams?: {
    slide_count?: number;
    audience?: string;
    tone?: string;
    slide_range?: [number, number];
    output_filename?: string;
    generate_notes?: boolean;
    quick_mode?: boolean;
    instruction?: string;
  };
}

export interface PptxAiResult {
  success: boolean;
  job_id: string;
  action: string;           // "merge" | "generate_from_brief" | "analyze" | etc.
  explanation: string;
  preview_urls: string[];   // /pptx/preview/{job_id}/{idx}
  download_url: string | null;
  slide_count: number;
  plan?: Record<string, any>;
  analyses?: any[];
  transcript?: string;
  audit?: Record<string, any>;
  speaker_notes?: any[];
  session_id?: string | null;
  suggestions?: any[];
  extra?: Record<string, any>;
  elapsed_ms: number;
  error?: string | null;
}

export interface PptxJobInfo {
  job_id: string;
  action: string;
  status: string;
  created_at: number;
  size_bytes: number;
  size_mb: number;
  slide_count: number;
  has_pptx: boolean;
  age_hours: number;
}

export interface PptxTemplate {
  template_id: string;
  name: string;
  category: string;
  slide_type: string;
  description: string;
  tags: string[];
  preview_hint: string;
  spec?: Record<string, any>;
}

export interface PptxIntentType {
  total: number;
  intents: string[];
  examples: Record<string, string>;
}

// ─── Core: The Supercharged AI Endpoint ──────────────────────────────────────

/**
 * THE main entry point. Send any natural language prompt + optional files.
 * AI classifies intent and executes the right pipeline automatically.
 *
 * @example
 * // Merge decks
 * await pptxAi({ prompt: "Take slides 15-19 from deck A and add to deck B",
 *                 files: [deckA, deckB] })
 *
 * @example
 * // Generate from brief
 * await pptxAi({ prompt: "Create a 10-slide investor pitch about Q2 strategy",
 *                 extraParams: { audience: "investors", slide_count: 10 } })
 *
 * @example
 * // Export to PDF
 * await pptxAi({ prompt: "Export this to PDF", files: [myDeck] })
 */
export async function pptxAi(params: PptxAiParams): Promise<PptxAiResult> {
  const formData = new FormData();
  formData.append('prompt', params.prompt);

  if (params.fileIds?.length) {
    formData.append('file_ids', JSON.stringify(params.fileIds));
  }
  if (params.extraParams && Object.keys(params.extraParams).length > 0) {
    formData.append('extra_params', JSON.stringify(params.extraParams));
  }
  for (const file of params.files ?? []) {
    formData.append('files', file);
  }

  const res = await fetch(`${PROXY_PREFIX}/pptx/ai`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`PPTX AI failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();

  // Fix relative URLs to use proxy prefix
  if (data.download_url && !data.download_url.startsWith('http')) {
    data.download_url = `${PROXY_PREFIX}${data.download_url}`;
  }
  if (data.preview_urls) {
    data.preview_urls = data.preview_urls.map((u: string) =>
      u.startsWith('http') || u.startsWith(PROXY_PREFIX) ? u : `${PROXY_PREFIX}${u}`
    );
  }

  return data as PptxAiResult;
}

// ─── Preview & Download Helpers ───────────────────────────────────────────────

/** Get the full proxy URL for a slide preview image. */
export function getPreviewUrl(jobId: string, slideIndex: number): string {
  return `${PROXY_PREFIX}/pptx/preview/${jobId}/${slideIndex}`;
}

/** Get the full proxy URL to download the output PPTX. */
export function getDownloadUrl(jobId: string): string {
  return `${PROXY_PREFIX}/pptx/download/${jobId}`;
}

/** Get all slide preview URLs for a job (1-based). */
export function getPreviewUrls(jobId: string, slideCount: number): string[] {
  return Array.from({ length: slideCount }, (_, i) =>
    getPreviewUrl(jobId, i + 1)
  );
}

// ─── Intent Discovery ─────────────────────────────────────────────────────────

/** List all supported AI intent types with examples. */
export async function listIntents(): Promise<PptxIntentType> {
  const res = await fetch(`${PROXY_PREFIX}/pptx/ai/intents`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list intents (${res.status})`);
  return res.json();
}

// ─── Job Management ───────────────────────────────────────────────────────────

/** List recent jobs for the current user. */
export async function listJobs(params?: {
  action?: string;
  status?: string;
  limit?: number;
}): Promise<{ total: number; jobs: PptxJobInfo[] }> {
  const qs = new URLSearchParams();
  if (params?.action) qs.set('action', params.action);
  if (params?.status) qs.set('status', params.status);
  if (params?.limit)  qs.set('limit', String(params.limit));

  const res = await fetch(`${PROXY_PREFIX}/pptx/jobs?${qs}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list jobs (${res.status})`);
  return res.json();
}

/** Delete a specific job. */
export async function deleteJob(jobId: string): Promise<void> {
  await fetch(`${PROXY_PREFIX}/pptx/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

// ─── Templates ────────────────────────────────────────────────────────────────

/** Get the full template catalog grouped by category. */
export async function getTemplateCatalog(): Promise<{
  total: number;
  categories: Record<string, PptxTemplate[]>;
}> {
  const res = await fetch(`${PROXY_PREFIX}/pptx/templates`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get templates (${res.status})`);
  return res.json();
}

/** Search templates by keyword, category, or slide type. */
export async function searchTemplates(params: {
  q?: string;
  category?: string;
  slide_type?: string;
}): Promise<{ total: number; results: PptxTemplate[] }> {
  const qs = new URLSearchParams();
  if (params.q)          qs.set('q', params.q);
  if (params.category)   qs.set('category', params.category);
  if (params.slide_type) qs.set('slide_type', params.slide_type);

  const res = await fetch(`${PROXY_PREFIX}/pptx/templates?${qs}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to search templates (${res.status})`);
  return res.json();
}

/** Generate a single-slide PPTX from a template, optionally overriding fields. */
export async function generateFromTemplate(
  templateId: string,
  overrides?: Record<string, any>
): Promise<{ success: boolean; job_id: string; download_url: string; preview_url: string }> {
  const formData = new FormData();
  formData.append('output_filename', `${templateId}_slide.pptx`);
  if (overrides) {
    formData.append('overrides', JSON.stringify(overrides));
  }

  const res = await fetch(`${PROXY_PREFIX}/pptx/templates/${templateId}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`Template generation failed (${res.status})`);

  const data = await res.json();
  if (data.download_url && !data.download_url.startsWith('http')) {
    data.download_url = `${PROXY_PREFIX}${data.download_url}`;
  }
  if (data.preview_url && !data.preview_url.startsWith('http')) {
    data.preview_url = `${PROXY_PREFIX}${data.preview_url}`;
  }
  return data;
}

// ─── Smart Revision (direct, no full orchestration) ──────────────────────────

/** Apply a natural language revision to an existing PPTX job output. */
export async function smartRevise(params: {
  jobId?: string;
  file?: File;
  instruction: string;
  preview?: boolean;
}): Promise<{
  success: boolean;
  job_id: string;
  summary: string;
  operations: any[];
  download_url: string;
  preview_urls: string[];
}> {
  const formData = new FormData();
  formData.append('instruction', params.instruction);
  if (params.jobId) formData.append('job_id', params.jobId);
  if (params.file)  formData.append('files', params.file);
  if (params.preview) formData.append('preview', 'true');

  const res = await fetch(`${PROXY_PREFIX}/pptx/smart-revise`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`Revision failed (${res.status})`);

  const data = await res.json();
  if (data.download_url && !data.download_url.startsWith('http')) {
    data.download_url = `${PROXY_PREFIX}${data.download_url}`;
  }
  if (data.preview_urls) {
    data.preview_urls = data.preview_urls.map((u: string) =>
      u.startsWith('http') || u.startsWith(PROXY_PREFIX) ? u : `${PROXY_PREFIX}${u}`
    );
  }
  return data;
}

// ─── Utility: Build prompt from common scenarios ──────────────────────────────

export const PPTX_PROMPT_TEMPLATES = {
  mergeSlides: (source: string, target: string, start: number, end: number) =>
    `Take slides ${start}-${end} from ${source} and incorporate them into ${target}`,

  generateFromBrief: (topic: string, slides: number, audience: string) =>
    `Create a ${slides}-slide presentation about ${topic} for ${audience}`,

  exportPdf: (filename?: string) =>
    `Export this presentation to PDF${filename ? ` and name it ${filename}` : ''}`,

  brandAudit: () =>
    `Check this presentation for Potomac brand compliance and score each slide`,

  speakerNotes: (audience = 'general') =>
    `Write speaker notes for every slide. Audience: ${audience}`,

  summarize: (bullets = 5) =>
    `Summarize this document and give me the ${bullets} most important points as executive bullets`,

  revise: (instruction: string) => instruction,

  generateFromDoc: (slides = 10, audience = 'general') =>
    `Turn this document into a ${slides}-slide branded presentation for ${audience}`,
} as const;
