import { AuthenticationError } from 'apollo-server-express';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { UserDocument } from '../models/User';

interface JwtPayload {
  _id: string;
  username: string;
  email: string;
}

const secret = process.env.JWT_SECRET_KEY || 'mysecretsshhhhh';
const expiration = '2h';

export const authMiddleware = ({ req }: { req: Request }) => {
  // Allows token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;

  // We split the token string into an array and return actual token
  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req;
  }

  // if token can be verified, add the decoded user's data to the request so it can be accessed in the resolver
  try {
    const { data } = jwt.verify(token, secret) as { data: JwtPayload };
    req.user = data;
  } catch {
    console.log('Invalid token');
  }

  // return the request object so it can be passed to the resolver as `context`
  return req;
};

export const signToken = ({ username, email, _id }: UserDocument) => {
  const payload = { username, email, _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};

export const authenticateToken = (context: { req: Request }) => {
  const authHeader = context.req.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AuthenticationError('Invalid token format');
  }

  try {
    const { data } = jwt.verify(token, secret) as { data: JwtPayload };
    return data;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
};