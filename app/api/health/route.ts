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
    // Add 10 second timeout for health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
    const errMsg = error instanceof Error ? error.message : 'Connection failed';
    let userMessage = 'Backend connection failed';
    
    if (errMsg.includes('aborted') || errMsg.includes('abort')) {
      userMessage = 'Backend health check timed out';
    } else if (errMsg.includes('ECONNRESET') || errMsg.includes('socket hang up')) {
      userMessage = 'Backend connection was reset';
    }
    
    return new Response(
      JSON.stringify({ status: 'unhealthy', error: userMessage }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
