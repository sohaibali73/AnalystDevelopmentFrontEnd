import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://developer-potomaac.up.railway.app//').replace(/\/+$/, '');

/**
 * Proxy route for File Upload
 * 
 * Proxies requests to backend: POST /chat/conversations/{conversation_id}/upload
 * Supports file uploads with optional conversation context
 * 
 * Query params:
 * - conversationId: The conversation to attach the file to (required)
 * 
 * Request body: multipart/form-data
 * - file: binary file data
 * 
 * Response:
 * {
 *   file_id: string,
 *   filename: string,
 *   template_id?: string (if PPTX template),
 *   template_layouts?: number,
 *   is_template?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Get conversationId from query params
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { detail: 'conversationId query parameter is required' },
        { status: 400 }
      );
    }

    // Read the multipart form data
    const formData = await req.formData();

    if (!formData.has('file')) {
      return NextResponse.json(
        { detail: 'File is required in form data' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = req.headers.get('authorization');

    let response: Response;
    try {
      response = await fetch(
        `${BACKEND_URL}/chat/conversations/${conversationId}/upload`,
        {
          method: 'POST',
          headers: {
            ...(authHeader && { 'Authorization': authHeader }),
          },
          body: formData,
        }
      );
    } catch (fetchErr) {
      return NextResponse.json(
        { detail: 'Cannot connect to the backend upload service. Please try again later.' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `Upload failed: ${response.status}`,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    // Return the backend response (file metadata)
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API/upload]', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Support GET for status/test
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: 'Upload endpoint is ready. Use POST to upload files.' },
    { status: 200 }
  );
}
