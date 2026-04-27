import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  const code = request.nextUrl.pathname.split('/r/')[1];

  const response = NextResponse.redirect(new URL('/signup', request.url));

  response.cookies.set('craftly_ref', code, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
