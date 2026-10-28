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
const allowedOrigins = Array.from(
  new Set([
    ENV.CLIENT_URL,
    ENV.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
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

const imgsDirectory = path.resolve(__dirname, '../../imgs');
app.use('/imgs', express.static(imgsDirectory));

app.use('/api', routes);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find route: ${req.method} ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
