/**
 * /api/yang/goal/[id] — Edge proxy for a single goal.
 *
 * GET    → goal detail (incl. steps)
 * POST   → control { action: 'pause'|'resume'|'cancel' }
 * DELETE → delete goal
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

async function forward(req: NextRequest, method: 'GET' | 'POST' | 'DELETE', path: string): Promise<Response> {
  const auth = req.headers.get('authorization') || '';
  const body = method !== 'GET' ? await req.text() : undefined;
  const upstream = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      'X-Potomac-Client': 'desktop',
    },
    body: body || undefined,
    cache: 'no-store',
  });
  const text = await upstream.text();
  return new Response(text || '{}', {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forward(req, 'GET', `/goals/${encodeURIComponent(id)}`);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forward(req, 'POST', `/goals/${encodeURIComponent(id)}/control`);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forward(req, 'DELETE', `/goals/${encodeURIComponent(id)}`);
}
