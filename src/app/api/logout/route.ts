import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Clear the 'token' cookie by setting its maxAge to -1
  const serializedCookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Expire immediately
    path: '/',
    sameSite: 'lax',
  });

  const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  response.headers.set('Set-Cookie', serializedCookie);
  return response;
}
