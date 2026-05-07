/**
 * POST /api/skills/upload — multipart proxy to backend /skills/upload.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!auth) {
    return NextResponse.json({ detail: 'unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { detail: { code: 'INVALID_ZIP', error: 'Could not parse upload.' } },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/skills/upload`, {
      method: 'POST',
      headers: { Authorization: auth },
      body: formData,
    });
  } catch (e) {
    return NextResponse.json(
      { detail: 'Cannot connect to backend' },
      { status: 502 }
    );
  }

  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('content-type') || 'application/json',
    },
  });
}
