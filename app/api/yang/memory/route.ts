/**
 * /api/yang/memory — Edge proxy for persistent memory store.
 *
 * GET   ?q=...          → semantic search the user's memories
 * POST  { key, value, kind, tags }    → save a memory
 * DELETE ?key=...       → delete a memory
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

async function forward(req: NextRequest, method: string, path: string): Promise<Response> {
  const auth = req.headers.get('authorization') || '';
  const body = method !== 'GET' && method !== 'DELETE' ? await req.text() : undefined;
  const upstream = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: auth, 'X-Potomac-Client': 'desktop' },
    body: body || undefined,
    cache: 'no-store',
  });
  const text = await upstream.text();
  return new Response(text || '{}', {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') || '';
  return forward(req, 'GET', `/memory/search?q=${encodeURIComponent(q)}`);
}
export async function POST(req: NextRequest) {
  return forward(req, 'POST', '/memory/save');
}
export async function DELETE(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || '';
  return forward(req, 'DELETE', `/memory/${encodeURIComponent(key)}`);
}
