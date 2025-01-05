import express from 'express';
import { ApolloServer } from '@apollo/server';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import db from './config/connection.js';
import { typeDefs } from './schemas/index.js';
import { resolvers } from './schemas/index.js';
import { authenticateToken } from './services/auth.js';
import routes from './routes/index.js';

dotenv.config();

const startServer = async () => {
  const app = express();
  const PORT = process.env.PORT || 3001;

  console.log('Starting Apollo Server...');
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  console.log('Apollo Server started');

  // Middleware
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        try {
          authenticateToken(req, res, () => {});
          return { user: req.user };
        } catch (error) {
          console.error('Error in context middleware:', error);
          return { user: null };
        }
      },
    })
  );

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    console.log('Serving static assets in production');
  }

  // Other routes
  app.use('/api', routes);
  console.log('API routes set up');

  // Database connection and server startup
  if (db.readyState === 1) {
    console.log('Connected to MongoDB (already open)');
    app.listen(PORT, () => {
      console.log(`🌍 Now listening on http://localhost:${PORT}`);
    });
  } else {
    db.once('open', () => {
      console.log('Connected to MongoDB successfully');
      app.listen(PORT, () => {
        console.log(`🌍 Now listening on http://localhost:${PORT}`);
      });
    });
  }
};

startServer();