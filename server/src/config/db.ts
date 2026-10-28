import mongoose from 'mongoose';
import { ENV, assertRequiredEnv } from './env';

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = null;

  try {
    assertRequiredEnv('MONGODB_URI');

    connectionPromise = mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });

    const conn = await connectionPromise;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    connectionPromise = null;
    console.error('[MongoDB] Connection error:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Runtime error:', err);
});
