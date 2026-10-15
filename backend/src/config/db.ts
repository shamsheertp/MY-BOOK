import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Only log errors and warnings to prevent stdout I/O bottleneck
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Warm up the database connection eagerly
prisma.$connect()
  .then(() => {
    // Connection pool is ready
  })
  .catch((err) => {
    console.warn('Initial Prisma connection warning:', err?.message || err);
  });

// Recommended timeout options for remote cloud database connections (Railway proxy)
export const DB_TX_OPTIONS = {
  maxWait: 15000, // 15 seconds to acquire a connection
  timeout: 45000, // 45 seconds for interactive transactions over WAN
};

export default prisma;
