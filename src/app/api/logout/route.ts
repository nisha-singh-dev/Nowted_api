import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const serializedCookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, 
    path: '/',
    sameSite: 'lax',
  });

  const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  response.headers.set('Set-Cookie', serializedCookie);
  return response;
}
