/**
 * Next.js API Route: /api/skills/[slug]
 * GET  → Get skill detail
 * POST → Execute skill (with optional streaming)
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'edge';
export const maxDuration = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authToken = req.headers.get('authorization') || '';

    const response = await fetch(`${API_BASE_URL}/skills/${slug}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch skill detail' },
      { status: 502 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authToken = req.headers.get('authorization') || '';
    const body = await req.json();
    const isStream = body.stream === true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 290000);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${API_BASE_URL}/skills/${slug}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      return NextResponse.json(
        { error: isTimeout ? 'Skill execution timed out' : 'Cannot connect to backend' },
        { status: isTimeout ? 504 : 502 }
      );
    }
    clearTimeout(timeoutId);

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({
        detail: `Backend error: ${backendResponse.status}`
      }));
      return NextResponse.json(error, { status: backendResponse.status });
    }

    // If streaming, pass through the stream
    if (isStream && backendResponse.body) {
      return new Response(backendResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming: return JSON
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
