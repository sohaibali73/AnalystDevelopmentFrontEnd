import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ||
  'https://developer-potomaac.up.railway.app/').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      return NextResponse.json(
        { detail: 'Cannot connect to the backend server. Please try again later.' },
        { status: 502 }
      );
    }

    const data = await response.json().catch(() => ({
      detail: response.status === 401 
        ? 'Invalid email or password.' 
        : `Backend error: ${response.status}`,
    }));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
