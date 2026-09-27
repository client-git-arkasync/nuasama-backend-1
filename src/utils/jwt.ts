import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Parse the escaped newlines in the PEM key
const PRIVATE_KEY = env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
const PUBLIC_KEY = env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
const JWT_EXPIRES_IN = '90d';

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const signToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
};
