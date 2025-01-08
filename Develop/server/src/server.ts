import express from 'express';
import { ApolloServer } from '@apollo/server';
import path from 'node:path';
import dotenv from 'dotenv';
// import cors from 'cors';
// import bodyParser from 'body-parser';
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
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context:
          authenticateToken as any,
  }));

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('client', 'dist')));
    console.log('Serving static assets in production');
  }

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve('client', 'dist', 'index.html'));
  });

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