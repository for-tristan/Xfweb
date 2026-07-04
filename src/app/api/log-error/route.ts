import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.error('[CLIENT ERROR]', {
      message: body?.message || 'Unknown',
      digest: body?.digest || '',
      url: body?.url || '',
      userAgent: body?.userAgent || '',
      timestamp: body?.timestamp || '',
      stack: body?.stack?.substring(0, 500) || '',
    });
  } catch {}
  return NextResponse.json({ ok: true });
}
