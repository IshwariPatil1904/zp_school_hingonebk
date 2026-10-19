import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { runBootstrap } from './scripts/bootstrap';

const startServer = async () => {
  try {
    await connectDB();

    // Ensure principal account and teachers are bootstrapped
    await runBootstrap();

    const PORT = parseInt(ENV.PORT, 10) || 5000;
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Zilla Parishad Primary School, Hingone BK API`);
      console.log(`  Server listening on port: http://localhost:${PORT}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  Database URI: ${ENV.MONGODB_URI}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/auth/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
