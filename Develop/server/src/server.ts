import express from 'express';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';

import db from './config/connection.js';
import { resolvers, typeDefs } from './schemas/index.js';
import { authenticateToken } from './services/auth.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start the Apollo server
await server.start();

// Middleware
app.use(
  '/graphql',
  cors(),
  json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      try {
        authenticateToken(req, res, () => {});
        return { user: req.user };
      } catch (error) {
        return { user: null };
      }
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Other routes
app.use('/api', routes);

// Database connection and server startup
db.once('open', () => {
  app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
});