// // lib/jwt.ts
// import { SignJWT, jwtVerify } from 'jose';

// const SECRET_KEY = process.env.JWT_SECRET || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// // Encode the secret string into Uint8Array (jose requirement)
// const encoder = new TextEncoder();
// const secret = encoder.encode(SECRET_KEY);

// // Define the payload structure
// export interface JwtPayload {
//   username: string;
// }

// // Generate a JWT token
// export const signToken = async (payload: JwtPayload): Promise<string> => {
//   return await new SignJWT(payload)
//     .setProtectedHeader({ alg: 'HS256' })
//     .setExpirationTime('1h')
//     .sign(secret);
// };

// // Verify and decode a JWT token
// export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
//   try {
//     const { payload } = await jwtVerify(token, secret);

//     if (typeof payload.username === 'string') {
//       return { username: payload.username };
//     }

//     return null;
//   } catch (error) {
//     console.error('JWT verification error:', error);
//     return null;
//   }
// };

// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// Encode the secret string into Uint8Array (jose requirement)
const encoder = new TextEncoder();
const secret = encoder.encode(SECRET_KEY);

// Define the payload structure
export interface JwtPayload {
  userId: string;
  email: string;
}

export const signToken = async (payload: JwtPayload): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
};
// Verify and decode a JWT token
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
