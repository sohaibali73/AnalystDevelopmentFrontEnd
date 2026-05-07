/**
 * POST /api/skills/[slug]/duplicate — JSON proxy.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const auth = req.headers.get('authorization') || '';
  if (!auth) {
    return NextResponse.json({ detail: 'unauthorized' }, { status: 401 });
  }

  const body = await req.text();

  try {
    const res = await fetch(`${API_BASE_URL}/skills/${slug}/duplicate`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: body || '{}',
    });
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { detail: 'Cannot connect to backend' },
      { status: 502 }
    );
  }
}
