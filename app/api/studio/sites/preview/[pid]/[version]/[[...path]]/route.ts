/**
 * Next.js proxy for Sites preview — forwards GET requests to the backend's
 * authenticated `/studio/sites/{pid}/preview/{version}/...` endpoint with the
 * caller's bearer token, so the iframe can load HTML and assets same-origin
 * (avoiding CORS while keeping auth).
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://developer-potomaac.up.railway.app')).replace(/\/+$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREVIEW_TOKEN_COOKIE = 'studio_preview_token';

function getToken(req: NextRequest): string | null {
  // 1. Authorization header (used by fetchPreviewHtml)
  const h = req.headers.get('authorization');
  if (h) return h.replace(/^Bearer\s+/i, '');
  // 2. Short-lived preview-token cookie (set by us on the initial fetch
  //    so the iframe's subsequent same-origin requests carry it).
  const cookieToken = req.cookies.get(PREVIEW_TOKEN_COOKIE)?.value;
  if (cookieToken) return cookieToken;
  // 3. App's main auth_token cookie (if anything sets one)
  return req.cookies.get('auth_token')?.value ?? null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ pid: string; version: string; path?: string[] }> },
) {
  const { pid, version, path } = await ctx.params;
  const subPath = (path ?? []).map(encodeURIComponent).join('/');
  const upstream = `${API_BASE_URL}/studio/sites/${pid}/preview/${version}${
    subPath ? '/' + subPath : '/'
  }`;

  const token = getToken(req);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(upstream, { headers, redirect: 'follow' });
  } catch (e: any) {
    return new NextResponse(`Upstream error: ${e?.message || 'fetch failed'}`, {
      status: 502,
    });
  }

  // Mirror the upstream response — body + content-type — but strip
  // hop-by-hop headers and X-Frame-Options so the iframe can render it.
  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  res.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (
      lk === 'content-encoding' ||
      lk === 'transfer-encoding' ||
      lk === 'connection' ||
      lk === 'x-frame-options' ||
      lk === 'content-security-policy' ||
      lk === 'content-length'
    ) {
      return;
    }
    out.headers.set(k, v);
  });

  // If this request came in with a Bearer header (i.e. our SitePreviewPane's
  // initial fetchPreviewHtml call), mirror it into a short-lived cookie so
  // subsequent iframe-initiated asset requests (which can't set headers) are
  // still authenticated. Lifetime: 10 minutes; same-site lax; not httpOnly so
  // we could also rotate it client-side if needed.
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const tok = authHeader.replace(/^Bearer\s+/i, '');
    if (tok) {
      out.cookies.set({
        name: PREVIEW_TOKEN_COOKIE,
        value: tok,
        path: '/api/studio/sites/preview',
        maxAge: 60 * 10,
        sameSite: 'lax',
        httpOnly: false,
      });
    }
  }
  return out;
}
