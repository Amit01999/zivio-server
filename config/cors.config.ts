import cors from 'cors';

// Allowed origins for CORS
const allowedOrigins = [
  // Production client URLs - UPDATE THESE after deploying to Vercel
  'https://your-client-name.vercel.app',

  // Custom domains (if any)
  'https://zivioliving.com',
  'https://www.zivioliving.com',

  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export default corsOptions;
