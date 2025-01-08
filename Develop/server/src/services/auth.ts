import type { Request } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
import { AuthenticationError } from 'apollo-server-express';
dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string,
}

export const authenticateToken = ({ req }: { req: Request }) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        throw new AuthenticationError('Invalid/Expired token');
      }

      req.user = user as JwtPayload;
    });
  }
  return req;
};

export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};