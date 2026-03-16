/**
 * Next.js API Route: /api/presentation/[id]
 * 
 * Proxies presentation download requests to the backend.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : 'https://backendplatform-production.up.railway.app/');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: presentationId } = await params;

    if (!presentationId) {
      return new Response(
        JSON.stringify({ error: 'Presentation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = req.headers.get('authorization') || '';

    const backendResponse = await fetch(
      `${API_BASE_URL}/chat/presentation/${presentationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authToken,
        },
      }
    );

    if (!backendResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Presentation not found or expired' }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const blob = await backendResponse.blob();

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    });
  } catch (error) {
    console.error('Presentation download proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Download failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
