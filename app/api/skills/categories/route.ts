/**
 * Next.js API Route: /api/skills/categories
 * Proxies to backend /skills/categories endpoint
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization') || '';

    const response = await fetch(`${API_BASE_URL}/skills/categories`, {
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
      { error: 'Failed to fetch skill categories' },
      { status: 502 }
    );
  }
}
