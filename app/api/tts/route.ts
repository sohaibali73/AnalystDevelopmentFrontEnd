import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://developer-potomaac.up.railway.app//').replace(/\/+$/, '');

/**
 * Proxy route for Text-to-Speech
 * 
 * Proxies requests to backend: POST /chat/tts
 * Supports edge-tts voice synthesis
 * 
 * Request body:
 * {
 *   text: string,
 *   voice?: string (e.g., 'en-US-AriaNeural')
 * }
 * 
 * Returns: MP3 audio stream (audio/mpeg)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = 'en-US-AriaNeural' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { detail: 'Text is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = req.headers.get('authorization');

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/chat/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        body: JSON.stringify({ text, voice }),
      });
    } catch (fetchErr) {
      return NextResponse.json(
        { detail: 'Cannot connect to the backend TTS service. Please try again later.' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `TTS Error: ${response.status}`,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    // TTS returns audio/mpeg stream
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[API/tts]', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * HEAD request support for TTS endpoint
 */
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept': 'POST',
    },
  });
}
