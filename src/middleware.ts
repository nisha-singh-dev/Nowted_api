
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // forward user and email through headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('user-id', payload.userId);
  requestHeaders.set('user-email', payload.email);
  
  console.log("middleware userId", payload.userId);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}


export const config = {
  matcher: ['/api/folders/:path*', '/api/notes/:path*'],
};
