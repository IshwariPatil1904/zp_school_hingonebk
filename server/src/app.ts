import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { ENV } from './config/env';
import routes from './routes';
import { errorHandler, AppError } from './middleware/error.middleware';

const app: Application = express();

// Trust reverse proxies such as Vercel Edge / AWS Lambda
app.set('trust proxy', 1);

const allowedOrigins = Array.from(
  new Set([
    ENV.CLIENT_URL,
    ENV.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ].filter(Boolean))
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '7mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(ENV.COOKIE_SECRET || 'development-cookie-secret'));

const imgsDirectory = path.resolve(__dirname, '../../client/public/imgs');
app.use('/imgs', express.static(imgsDirectory));

// Health check endpoint responding directly on root or /api
app.get(['/', '/api', '/api/health', '/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ZP School Hingone BK API is operational',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Support both /api prefix and direct route mounting for serverless rewrites
app.use('/api', routes);
app.use('/', routes);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find route: ${req.method} ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
