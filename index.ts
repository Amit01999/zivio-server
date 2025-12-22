import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { serveStatic } from './static';
import { config } from './config/environment';

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

(async () => {
  // Connect to MongoDB
  await connectDatabase();

  // API Routes
  app.use('/api', apiRoutes);

  // Error handler
  app.use(errorHandler);

  // In production, serve the built client files
  // In development, the client runs separately on its own Vite dev server (port 5173)
  // and proxies API requests to this server (port 5000)
  if (config.nodeEnv === 'production') {
    serveStatic(app);
  } else {
    log(
      'Running in development mode - client should be started separately with: cd client && npx vite'
    );
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  httpServer.listen(config.port, config.host, () => {
    log(`serving on ${config.host}:${config.port}`);
  });
})();
