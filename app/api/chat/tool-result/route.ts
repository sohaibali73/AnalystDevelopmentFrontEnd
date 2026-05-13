/**
 * /api/chat/tool-result — receives client-side tool execution results from
 * the Electron renderer and forwards them to the Railway backend, which
 * resumes the paused agent loop using the matching tool_call_id.
 *
 * Body:
 *   {
 *     conversation_id: string,
 *     tool_call_id: string,
 *     result?: any,
 *     error?: string | null
 *   }
 *
 * Edge runtime — pure pass-through, no buffering or transformation.
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

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }
  if (!body || typeof body !== 'object') return jsonError(400, 'Invalid body');

  const authToken = req.headers.get('authorization') || '';
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/chat/agent/tool-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
        'X-Potomac-Client': 'desktop',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (err) {
    return jsonError(502, `Cannot reach backend: ${(err as Error).message}`);
  }

  const text = await upstream.text();
  return new Response(text || '{}', {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
