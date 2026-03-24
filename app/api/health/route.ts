/**
 * Next.js API Route: /api/health
 * 
 * Proxies health check to the backend server.
 */

import { NextRequest } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ status: 'unhealthy', error: `Backend returned ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Connection failed';
    return new Response(
      JSON.stringify({ status: 'unhealthy', error: errorMsg }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}