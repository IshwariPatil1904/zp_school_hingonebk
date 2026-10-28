import dotenv from 'dotenv';
import path from 'path';

const envCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
];

envCandidates.forEach((envPath) => {
  dotenv.config({ path: envPath });
});

const getEnv = (key: string, fallback?: string): string => {
  return process.env[key] ?? fallback ?? '';
};

export const ENV = {
  PORT: Number(getEnv('PORT', '5000')),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  CLIENT_URL: getEnv('CLIENT_URL') || getEnv('FRONTEND_URL') || 'http://localhost:5173',
  FRONTEND_URL: getEnv('FRONTEND_URL') || getEnv('CLIENT_URL') || 'http://localhost:5173',
  MONGODB_URI: getEnv('MONGODB_URI') || getEnv('MONGO_URI'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  COOKIE_SECRET: getEnv('COOKIE_SECRET'),
  BOOTSTRAP_PRINCIPAL_NAME: getEnv('BOOTSTRAP_PRINCIPAL_NAME'),
  BOOTSTRAP_PRINCIPAL_EMAIL: getEnv('BOOTSTRAP_PRINCIPAL_EMAIL'),
  BOOTSTRAP_PRINCIPAL_USERNAME: getEnv('BOOTSTRAP_PRINCIPAL_USERNAME'),
  BOOTSTRAP_PRINCIPAL_PASSWORD: getEnv('BOOTSTRAP_PRINCIPAL_PASSWORD'),
  BOOTSTRAP_TEACHER_PASSWORD: getEnv('BOOTSTRAP_TEACHER_PASSWORD'),
};

export const assertRequiredEnv = (...keys: string[]): void => {
  const missing = keys.filter((key) => !process.env[key] || !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and configure the values before starting the app.`
    );
  }
};
