/**
 * Next.js API Route: /api/chat   (EDGE — pure byte passthrough)
 *
 * Backend `/chat/agent/ui-stream` already emits AI SDK v5 UI Message Stream
 * Protocol (SSE), so the proxy no longer parses/translates anything per chunk.
 * This eliminates ~30–80 ms of per-token CPU on Vercel's Node runtime and
 * gets us a true streaming pipe with sub-200ms TTFB.
 *
 * What this route does:
 *   1. Parses the AI SDK `useChat` request envelope (small JSON, ~few KB)
 *   2. Extracts the last user message text + transport options
 *   3. Forwards a tiny JSON body to the backend
 *   4. Streams the backend's SSE bytes straight to the browser
 *
 * Attachments are NOT in this body — they are uploaded separately via
 * /api/upload (Node runtime) and referenced by the backend via conversation_id.
 *
 * Rollback: set NEXT_PUBLIC_USE_UI_STREAM=0 in the environment to fall back
 * to the legacy /chat/agent endpoint (still translated client-side by the
 * AI SDK — slower but functional).
 */

import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

// Default ON — set NEXT_PUBLIC_USE_UI_STREAM=0 to fall back to legacy translation.
const USE_UI_STREAM = process.env.NEXT_PUBLIC_USE_UI_STREAM !== '0';

const SSE_RESPONSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'x-vercel-ai-ui-message-stream': 'v1',
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid request body');
  }

  // ── Extract the last user-message text ────────────────────────────────
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const data = body.data || {};
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
  if (!lastUserMessage) return jsonError(400, 'No user message found');

  let messageText = '';
  if (Array.isArray(lastUserMessage.parts)) {
    messageText = lastUserMessage.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('');
  }
  if (!messageText) messageText = lastUserMessage.content || lastUserMessage.text || '';
  if (!messageText.trim()) return jsonError(400, 'Empty message content');

  // Formatting / behavior guard rail. Appended per-request because the backend
  // does NOT bake this into its system prompt. Without it, the agent has been
  // observed invoking multiple overlapping tools (e.g., both generate_pptx and
  // generate_pptx_freestyle for one PPTX request). Keeping this stable per
  // request also keeps the user-turn text consistent with prior conversations.
  //
  // NOTE: this DOES bust Anthropic prompt caching at the user-turn level. If
  // the backend later moves this into the (cacheable) system prompt, delete
  // this block.
  const FORMATTING_GUARDRAIL =
    '\n\n[FORMATTING: Do not use any emojis whatsoever in your response. ' +
    'Use clear, professional formatting with proper markdown headings, ' +
    'bullet points, and structured sections. Keep responses concise and ' +
    'data-driven. When a single tool can satisfy the request, call only ' +
    'that one tool — do not chain multiple overlapping tools for one task.]';
  const finalContent = messageText + FORMATTING_GUARDRAIL;

  // ── Build the tiny backend envelope ───────────────────────────────────
  const authToken = req.headers.get('authorization') || '';
  const conversationId = body.conversationId || data.conversationId || null;

  // Desktop-client capability envelope — forwarded so the backend can decide
  // whether to register fs/shell/computer tools for this turn. Web clients
  // omit this field entirely and behavior is unchanged.
  const clientEnvelope = body.client || data.client || null;

  const backendBody = {
    content: finalContent,
    conversation_id: conversationId,
    model: body.model || data.model || null,
    skill_slug: body.skill_slug || data.skill_slug || null,
    thinking_mode: body.thinking_mode || data.thinking_mode || null,
    thinking_budget: body.thinking_budget || data.thinking_budget || null,
    thinking_effort: body.thinking_effort || data.thinking_effort || null,
    use_prompt_caching: data.use_prompt_caching ?? body.use_prompt_caching ?? true,
    max_iterations: data.max_iterations ?? body.max_iterations ?? 5,
    pin_model_version: data.pin_model_version ?? body.pin_model_version ?? false,
    yang: data.yang ?? body.yang ?? null,
    client: clientEnvelope,
  };

  const upstreamPath = USE_UI_STREAM ? '/chat/agent/ui-stream' : '/chat/agent';

  // ── Forward to backend ────────────────────────────────────────────────
  let upstream: Response;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: authToken,
    };
    // Forward the desktop-client hint so the backend can register desktop
    // tools without parsing the JSON body twice.
    if (clientEnvelope?.kind) {
      headers['X-Potomac-Client'] = String(clientEnvelope.kind);
      if (Array.isArray(clientEnvelope.capabilities)) {
        headers['X-Potomac-Capabilities'] = clientEnvelope.capabilities.join(',');
      }
    }
    upstream = await fetch(`${API_BASE_URL}${upstreamPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendBody),
      // Edge runtime supports streaming responses natively
      cache: 'no-store',
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return jsonError(
      isAbort ? 504 : 502,
      isAbort
        ? 'Backend request timed out. Please try again.'
        : `Cannot connect to backend at ${API_BASE_URL}.`,
    );
  }

  // Non-2xx → surface the error JSON to the client (don't open a stream)
  if (!upstream.ok) {
    let errorBody: any = null;
    try {
      errorBody = await upstream.json();
    } catch {
      errorBody = { detail: `Backend error: ${upstream.status}` };
    }
    let userMessage: string = errorBody.detail || errorBody.error || `HTTP ${upstream.status}`;
    if (upstream.status === 401) {
      userMessage = 'SESSION_EXPIRED: Your session has expired. Please log in again.';
    } else if (upstream.status === 400 && typeof userMessage === 'string' && userMessage.includes('API key')) {
      userMessage = 'Claude API key not configured. Please add your API key in Profile Settings.';
    }
    return jsonError(upstream.status, userMessage);
  }

  // ── Stream the body straight through ──────────────────────────────────
  // When the backend is on /chat/agent/ui-stream, the bytes are already v5 SSE.
  // When on the legacy /chat/agent (fallback), the old client-side translator
  // path would be needed — but we keep this route Edge-only and require the
  // backend's UI stream endpoint. Set NEXT_PUBLIC_USE_UI_STREAM=0 only for an
  // emergency rollback where the legacy endpoint is being used directly.
  const headers: Record<string, string> = { ...SSE_RESPONSE_HEADERS };
  const convHeader = upstream.headers.get('X-Conversation-Id');
  if (convHeader) headers['X-Conversation-Id'] = convHeader;
  const serverTiming = upstream.headers.get('Server-Timing');
  if (serverTiming) headers['Server-Timing'] = serverTiming;

  return new Response(upstream.body, { status: 200, headers });
}
