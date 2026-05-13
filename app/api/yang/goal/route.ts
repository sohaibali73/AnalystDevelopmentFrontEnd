/**
 * /api/yang/goal — Edge proxy to the Railway YANG Goals service.
 *
 * GET   → list user's goals
 * POST  → create a new goal { title, description, prompt }
 *
 * All payloads are pass-through; this route just forwards Authorization.
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

async function forward(req: NextRequest, method: 'GET' | 'POST', path: string): Promise<Response> {
  const auth = req.headers.get('authorization') || '';
  const body = method === 'POST' ? await req.text() : undefined;
  const upstream = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      'X-Potomac-Client': 'desktop',
    },
    body,
    cache: 'no-store',
  });
  const text = await upstream.text();
  return new Response(text || '{}', {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest) { return forward(req, 'GET', '/goals'); }
export async function POST(req: NextRequest) { return forward(req, 'POST', '/goals'); }
