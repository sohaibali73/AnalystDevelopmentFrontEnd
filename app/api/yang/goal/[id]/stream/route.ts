/**
 * /api/yang/goal/[id]/stream — Edge SSE proxy for live goal updates.
 *
 * Long-lived: forwards the backend's SSE bytes straight through. Each event
 * is a JSON-encoded step/note/tool-call/tool-result/done frame.
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = req.headers.get('authorization') || '';
  const upstream = await fetch(`${API_BASE_URL}/goals/${encodeURIComponent(id)}/stream`, {
    method: 'GET',
    headers: { Authorization: auth, 'X-Potomac-Client': 'desktop' },
    cache: 'no-store',
  });
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
