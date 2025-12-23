import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { connectDatabase } from './config/database.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { serveStatic } from './static.js';
import { config } from './config/environment.js';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// Custom logger for printing timestamped server messages
export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Middleware to log API requests with method, status, duration, and JSON response
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Initialize database connection
let dbInitialized = false;
async function initializeDatabase() {
  if (!dbInitialized) {
    await connectDatabase();
    dbInitialized = true;
  }
}

// CORS configuration
const allowedOrigins = [
  'https://www.zivioliving.com',
  'https://zivio-client.vercel.app',
  'https://zivio-client-git-main-bepros-projects.vercel.app',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware to ensure database is connected before handling requests
app.use(async (_req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Error handler
app.use(errorHandler);

// In production, serve the built client files (but not on Vercel where this is API-only)
if (config.nodeEnv === 'production' && process.env.VERCEL !== '1') {
  serveStatic(app);
}

// Export for Vercel serverless
export default app;

// Start server only in development (not on Vercel)
if (process.env.VERCEL !== '1' && config.nodeEnv === 'development') {
  (async () => {
    await initializeDatabase();
    httpServer.listen(config.port, config.host, () => {
      log(`serving on ${config.host}:${config.port}`);
      log(
        'Running in development mode - client should be started separately with: cd client && npx vite'
      );
    });
  })();
}
