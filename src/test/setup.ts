/**
 * @context test/setup.ts
 * @what    Global test setup — mocks for Prisma, Supabase, and NextAuth
 * @purpose Prevent real DB/storage connections during unit tests
 * @layer   test
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Supabase Storage mock — supports .from().upload() / .download() / .remove() ──
export const mockStorageClient = {
  upload:         vi.fn().mockResolvedValue({ data: { path: 'uploads/test/file.pdf' }, error: null }),
  download:       vi.fn().mockResolvedValue({ data: new Blob(['content']), error: null }),
  remove:         vi.fn().mockResolvedValue({ data: {}, error: null }),
  getPublicUrl:   vi.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/file.pdf' } }),
  createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null }),
};

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

// ── Supabase mock ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => {
  const client = {
    upload:         vi.fn().mockResolvedValue({ data: { path: 'uploads/test/file.pdf' }, error: null }),
    download:       vi.fn().mockResolvedValue({ data: new Blob(['content']), error: null }),
    remove:         vi.fn().mockResolvedValue({ data: {}, error: null }),
    getPublicUrl:   vi.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/file.pdf' } }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null }),
  };
  return {
    supabaseAdmin: {
      storage: {
        from: vi.fn().mockReturnValue(client),
      },
    },
    STORAGE_BUCKET: 'uploads',
  };
});

// ── NextAuth mock ────────────────────────────────────────────────────────────
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));
