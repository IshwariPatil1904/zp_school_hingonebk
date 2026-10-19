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

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration for cookies and client domain
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// Serve static images directly from imgs directory as fallback
const imgsDirectory = path.resolve(__dirname, '../../imgs');
app.use('/imgs', express.static(imgsDirectory));

// Mount API routes
app.use('/api', routes);

// 404 Route handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find route: ${req.method} ${req.originalUrl} on this server!`, 404));
});

// Centralized error handling
app.use(errorHandler);

export default app;
