/**
 * @context test/setup.ts
 * @what    Global test setup — mocks for Prisma, Supabase, and NextAuth
 * @purpose Prevent real DB/storage connections during unit tests
 * @layer   test
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Prisma mock ──────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      findMany:   vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      updateMany: vi.fn(),
      count:      vi.fn(),
    },
    communication: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn(),
    },
    file: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn(),
    },
    folder: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
  },
}));

// ── Supabase mock ────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        upload:   vi.fn(),
        download: vi.fn(),
        remove:   vi.fn(),
      })),
    },
  },
  STORAGE_BUCKET: 'uploads',
}));

// ── NextAuth mock ────────────────────────────────────────────────────────────
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));
