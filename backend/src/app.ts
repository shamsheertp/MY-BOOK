import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

export const app = express();

// Trust reverse proxy headers (e.g. Railway, Cloudflare, Nginx, Render)
app.set('trust proxy', 1);

// Production Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Gzip / Brotli response compression
app.use(compression());

// Production CORS Configuration
const allowedOrigins = config.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // Allow configured frontend client origin or local dev
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        config.nodeEnv === 'development'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload files statically as fallback
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, _res, next) => {
  if (config.nodeEnv === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Root welcome route
app.get('/', (_req, res) => {
  res.json({
    name: 'MY-BOOK Accounting Backend API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
