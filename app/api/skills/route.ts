/**
 * Next.js API Route: /api/skills
 * Proxies to backend /skills endpoint
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://developer-potomaac.up.railway.app').replace(/\/+$/, '');

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('authorization') || '';
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const include_builtins = searchParams.get('include_builtins') ?? 'true';

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('include_builtins', include_builtins);

    const response = await fetch(`${API_BASE_URL}/skills?${params.toString()}`, {
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
      { error: 'Failed to fetch skills' },
      { status: 502 }
    );
  }
}
