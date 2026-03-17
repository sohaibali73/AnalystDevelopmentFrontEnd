/**
 * Next.js API Route: /api/template
 * 
 * Proxies brand template .pptx upload to backend and returns template_id + layout analysis.
 * Also supports GET to list all uploaded templates.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization') || '';
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No .pptx file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file, file.name);

    const backendResponse = await fetch(`${API_BASE_URL}/chat/template/upload`, {
      method: 'POST',
      headers: { 'Authorization': authToken },
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ detail: 'Upload failed' }));
      return new Response(
        JSON.stringify({ error: error.detail || 'Template upload failed' }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await backendResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Template upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization') || '';

    const backendResponse = await fetch(`${API_BASE_URL}/chat/templates`, {
      headers: { 'Authorization': authToken },
    });

    if (!backendResponse.ok) {
      return new Response(
        JSON.stringify({ templates: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await backendResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ templates: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
