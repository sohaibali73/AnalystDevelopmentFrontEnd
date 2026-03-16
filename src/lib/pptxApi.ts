/**
 * PPTX Generation API helpers
 *
 * All calls route through the Next.js API proxy (/api/backend/...) to avoid
 * CORS issues. Auth tokens are included for authenticated endpoints.
 *
 * Two backend systems:
 * 1. /pptx/upload-image + /pptx/assemble — template-based assembly
 * 2. /presentations/generate — Claude-powered outline + PPTX generation (SSE stream)
 *
 * DeckGeneratorPage uses system #2 (Claude-powered) with optional image uploads.
 */

import { storage } from '@/lib/storage';

// Use Next.js proxy to avoid CORS — rewrites /api/backend/:path* → backend/:path*
const PROXY_PREFIX = '/api/backend';

function getAuthHeaders(): HeadersInit {
  const token = storage.getItem('auth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadImageResponse {
  filename: string;
  upload_id: string;
  saved_as: string;
}

export interface GenerateDeckParams {
  outline: string;
  deck_family: string;
  uploaded_images: string[];
}

export interface GenerateDeckResponse {
  download_url: string;
  slide_count: number;
  presentation_id: string;
  title: string;
}

/** SSE event from /presentations/generate */
export type PresentationSSEEvent =
  | { type: 'status'; message: string }
  | { type: 'complete'; presentation_id: string; title: string; slide_count: number; download_url: string; file_name: string }
  | { type: 'error'; error: string };

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Upload a single chart image to the backend.
 * POST /pptx/upload-image  (multipart/form-data)
 * Routed through Next.js proxy to avoid CORS.
 */
export async function uploadChartImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${PROXY_PREFIX}/pptx/upload-image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`Image upload failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

/**
 * Generate a PowerPoint deck using Claude-powered presentation generator.
 * POST /presentations/generate  (JSON body → SSE stream response)
 * 
 * The backend uses Claude to create a slide outline from the prompt,
 * then generates a branded .pptx file. It streams SSE progress events.
 * 
 * @param params - outline, deck_family, uploaded_images
 * @param onStatus - callback for progress messages
 * @returns final result with download_url, slide_count, etc.
 */
export async function generateDeck(
  params: GenerateDeckParams,
  onStatus?: (message: string) => void,
): Promise<GenerateDeckResponse> {
  // Build the prompt — include uploaded image references if any
  let prompt = params.outline;
  if (params.uploaded_images && params.uploaded_images.length > 0) {
    prompt += `\n\nUploaded chart images to include: ${params.uploaded_images.join(', ')}`;
  }

  const res = await fetch(`${PROXY_PREFIX}/presentations/generate`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      style: params.deck_family,
      presentation_type: params.deck_family,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`Deck generation failed (${res.status}): ${errBody}`);
  }

  // Parse SSE stream from backend
  if (!res.body) {
    throw new Error('No response stream from server');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: GenerateDeckResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6); // Remove "data: " prefix
      if (!jsonStr) continue;

      try {
        const event: PresentationSSEEvent = JSON.parse(jsonStr);

        switch (event.type) {
          case 'status':
            onStatus?.(event.message);
            break;

          case 'complete': {
            // Fix download URL to use proxy
            let downloadUrl = event.download_url || '';
            if (downloadUrl && !downloadUrl.startsWith('http') && !downloadUrl.startsWith(PROXY_PREFIX)) {
              downloadUrl = `${PROXY_PREFIX}${downloadUrl}`;
            }
            result = {
              download_url: downloadUrl,
              slide_count: event.slide_count || 0,
              presentation_id: event.presentation_id,
              title: event.title,
            };
            break;
          }

          case 'error':
            throw new Error(event.error || 'Presentation generation failed');
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== 'Presentation generation failed') {
          // JSON parse error — skip malformed events
          console.warn('[pptxApi] Skipping malformed SSE event:', jsonStr);
        } else {
          throw parseErr;
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    try {
      const event: PresentationSSEEvent = JSON.parse(buffer.trim().slice(6));
      if (event.type === 'complete') {
        let downloadUrl = event.download_url || '';
        if (downloadUrl && !downloadUrl.startsWith('http') && !downloadUrl.startsWith(PROXY_PREFIX)) {
          downloadUrl = `${PROXY_PREFIX}${downloadUrl}`;
        }
        result = {
          download_url: downloadUrl,
          slide_count: event.slide_count || 0,
          presentation_id: event.presentation_id,
          title: event.title,
        };
      } else if (event.type === 'error') {
        throw new Error(event.error || 'Presentation generation failed');
      }
    } catch {}
  }

  if (!result) {
    throw new Error('Presentation generation completed but no result was received');
  }

  return result;
}

/**
 * Assemble a deck from a structured slide plan (template-based).
 * POST /pptx/assemble  (JSON body)
 */
export async function assembleDeck(plan: {
  deck_family: string;
  presentation_title: string;
  output_filename?: string;
  slides: Array<{
    template_id: string;
    content: Record<string, any>;
    notes?: string;
  }>;
}): Promise<{ download_url: string; slide_count: number }> {
  const res = await fetch(`${PROXY_PREFIX}/pptx/assemble`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`Deck assembly failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();

  let downloadUrl = data.download_url || '';
  if (downloadUrl && !downloadUrl.startsWith('http') && !downloadUrl.startsWith(PROXY_PREFIX)) {
    downloadUrl = `${PROXY_PREFIX}${downloadUrl}`;
  }

  return {
    download_url: downloadUrl,
    slide_count: data.slide_count || 0,
  };
}

/**
 * List available deck template families and their template IDs.
 * GET /pptx/templates
 */
export async function listTemplates(): Promise<{ families: Record<string, string[]> }> {
  const res = await fetch(`${PROXY_PREFIX}/pptx/templates`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to list templates (${res.status})`);
  }

  return res.json();
}
