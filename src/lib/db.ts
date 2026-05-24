import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    // During static prerendering on Vercel, DATABASE_URL is not set.
    // Provide a fallback so the module can be imported without crashing.
    return new PrismaClient({
      datasources: { db: { url: 'file:./_prerender_placeholder.db' } },
    });
  }

  const adapter = new PrismaLibSQL({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
