import { app } from './app.js';
import { config } from './config/env.js';
import { prisma } from './config/db.js';

const startServer = async () => {
  try {
    // Attempt database connection check
    try {
      await prisma.$connect();
      console.log('✓ Connected to PostgreSQL via Prisma');
    } catch (dbError) {
      console.warn('⚠️ Warning: Could not connect to PostgreSQL immediately.');
      console.warn('Make sure your DATABASE_URL in .env has valid Railway credentials.');
      console.warn('Error details:', (dbError as Error).message);
    }

    const server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 MY-BOOK Backend Server is running!`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🔑 Auth Endpoints: http://localhost:${config.port}/api/auth`);
      console.log(`👥 User Endpoints: http://localhost:${config.port}/api/users`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`===============================================`);
    });

    const shutdown = async () => {
      console.log('\nShutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and Prisma database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
