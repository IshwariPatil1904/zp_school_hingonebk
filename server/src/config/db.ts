import mongoose from 'mongoose';
import { ENV, assertRequiredEnv } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    assertRequiredEnv('MONGODB_URI');

    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
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
