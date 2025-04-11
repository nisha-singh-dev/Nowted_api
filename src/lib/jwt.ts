
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
const SECRET_KEY = process.env.JWT_SECRET || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
 
const encoder = new TextEncoder();
const secret = encoder.encode(SECRET_KEY);


 interface JwtPayload extends JWTPayload{
  userId: string;
  email: string;
}

export const signToken = async (payload: JwtPayload): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
};

export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.userId === 'string' && typeof payload.email === 'string') {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }

    return null;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};
