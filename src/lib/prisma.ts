/**
 * @context prisma.ts
 * @what    Singleton PrismaClient instance shared across the Node.js process
 * @purpose Prevent multiple Prisma connections during Next.js hot-reload in dev
 * @depends @prisma/client (generated from prisma/schema.prisma)
 * @usedby  All service files (user.service, folder.service, etc.)
 * @rules   Import prisma ONLY from this file; never new PrismaClient() elsewhere
 * @layer   lib
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
