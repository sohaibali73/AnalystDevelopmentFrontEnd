/**
 * GET /api/skills/[slug]/download — stream zip from backend.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const auth =
    req.headers.get('authorization') ||
    (req.nextUrl.searchParams.get('token')
      ? `Bearer ${req.nextUrl.searchParams.get('token')}`
      : '');

  if (!auth) {
    return NextResponse.json({ detail: 'unauthorized' }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/skills/${slug}/download`, {
      headers: { Authorization: auth },
    });
  } catch {
    return NextResponse.json(
      { detail: 'Cannot connect to backend' },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('content-type') || 'application/json',
      },
    });
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/zip',
      'Content-Disposition':
        res.headers.get('content-disposition') ||
        `attachment; filename="${slug}.zip"`,
    },
  });
}
