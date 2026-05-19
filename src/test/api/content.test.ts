/**
 * @context test/api/content.test.ts
 * @what    Integration tests for content API routes
 * @covers  GET /api/content, POST /api/content, DELETE /api/content/[id],
 *          GET /api/content/[id]/download, GET /api/content/categories
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

// Route handlers
import { GET as getList, POST as postContent } from '@/app/api/content/route';
import { GET as getById, PATCH as patchById, DELETE as deleteById } from '@/app/api/content/[id]/route';
import { GET as downloadById } from '@/app/api/content/[id]/download/route';
import { GET as getCategories } from '@/app/api/content/categories/route';
import { GET as getStats } from '@/app/api/content/stats/route';

// ── Session fixtures ──────────────────────────────────────────────────────────
const adminSession    = { user: { id: 'admin-1', role: 'admin',    company: 'SEDAY' } };
const managerSession  = { user: { id: 'mgr-1',   role: 'manager',  company: 'SEDAY' } };
const employeeSession = { user: { id: 'emp-1',   role: 'employee', company: 'AVAPEX' } };

// ── Mock content data ─────────────────────────────────────────────────────────
const mockContent = {
  id:            'c1',
  title:         'Logo SEDAY',
  type:          'image',
  company:       'SEDAY',
  tags:          ['logo'],
  storedName:    'uuid.png',
  path:          'SEDAY/cat-1/uuid.png',
  mimeType:      'image/png',
  size:          204800,
  published:     true,
  featured:      false,
  downloadCount: 0,
  thumbnailPath: null,
  description:   null,
  categoryId:    'cat-1',
  uploadedById:  'admin-1',
  createdAt:     new Date(),
  updatedAt:     new Date(),
  category:   { id: 'cat-1', name: 'Logos', icon: '🎨', company: 'SEDAY' },
  uploadedBy: { id: 'admin-1', name: 'Admin' },
};

const makeReq = (url = 'http://localhost/api/content', init?: RequestInit) =>
  new NextRequest(url, init);

beforeEach(() => vi.clearAllMocks());

// ── GET /api/content ──────────────────────────────────────────────────────────
describe('GET /api/content', () => {
  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await getList(makeReq() as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 para employee (filtrado pela empresa)', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    vi.mocked(prisma.content.findMany).mockResolvedValue([]);
    vi.mocked(prisma.content.count).mockResolvedValue(0);

    const res = await getList(makeReq() as any);
    expect(res.status).toBe(200);

    // Should inject company filter for employee
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ company: 'AVAPEX' }),
      })
    );
  });

  it('admin pode listar sem filtro de empresa', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.content.findMany).mockResolvedValue([mockContent] as any);
    vi.mocked(prisma.content.count).mockResolvedValue(1);

    const res  = await getList(makeReq() as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });
});

// ── POST /api/content ─────────────────────────────────────────────────────────
describe('POST /api/content', () => {
  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await postContent(makeReq('http://localhost/api/content', { method: 'POST' }) as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const res = await postContent(makeReq('http://localhost/api/content', { method: 'POST' }) as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 403 para manager', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    const res = await postContent(makeReq('http://localhost/api/content', { method: 'POST' }) as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 se file ausente (admin)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);

    const form = new FormData();
    // Missing file and metadata
    const req = new Request('http://localhost/api/content', {
      method: 'POST',
      body:   form,
    });
    const res = await postContent(req as any);
    expect(res.status).toBe(400);
  });
});

// ── GET /api/content/[id] ─────────────────────────────────────────────────────
describe('GET /api/content/[id]', () => {
  const params = Promise.resolve({ id: 'c1' });

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await getById(makeReq() as any, { params });
    expect(res.status).toBe(401);
  });

  it('deve retornar 404 se não encontrado', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.content.findUnique).mockResolvedValue(null);
    const res = await getById(makeReq() as any, { params });
    expect(res.status).toBe(404);
  });

  it('deve retornar 403 se employee tenta ver conteúdo de outra empresa', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any); // company: AVAPEX
    vi.mocked(prisma.content.findUnique).mockResolvedValue({ ...mockContent, company: 'SEDAY' } as any);
    const res = await getById(makeReq() as any, { params });
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.content.findUnique).mockResolvedValue(mockContent as any);
    const res = await getById(makeReq() as any, { params });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/content/[id] ──────────────────────────────────────────────────
describe('DELETE /api/content/[id]', () => {
  const params = Promise.resolve({ id: 'c1' });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const res = await deleteById(makeReq() as any, { params });
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 e deletar conteúdo (admin)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    // getContentById (first findUnique) returns content
    vi.mocked(prisma.content.findUnique)
      .mockResolvedValueOnce(mockContent as any) // inside deleteById guard
      .mockResolvedValueOnce(mockContent as any); // inside deleteContent service
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);
    vi.mocked(prisma.content.delete).mockResolvedValue(mockContent as any);

    const res  = await deleteById(makeReq() as any, { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
  });
});

// ── GET /api/content/[id]/download ───────────────────────────────────────────
describe('GET /api/content/[id]/download', () => {
  const params = Promise.resolve({ id: 'c1' });

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await downloadById(makeReq() as any, { params });
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 se employee tenta baixar de outra empresa', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any); // AVAPEX
    vi.mocked(prisma.content.findUnique).mockResolvedValue({ ...mockContent, company: 'SEDAY' } as any);
    const res = await downloadById(makeReq() as any, { params });
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 com Content-Disposition attachment (admin)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    // getContentById called twice: once in the route guard, once in downloadContent service
    vi.mocked(prisma.content.findUnique)
      .mockResolvedValue(mockContent as any);
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: new Blob(['img']), error: null }),
    } as any);
    vi.mocked(prisma.content.update).mockResolvedValue(mockContent as any);

    const res = await downloadById(makeReq() as any, { params });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });
});

// ── GET /api/content/categories ──────────────────────────────────────────────
describe('GET /api/content/categories', () => {
  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await getCategories(makeReq() as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 com categorias', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    vi.mocked(prisma.contentCategory.findMany).mockResolvedValue([
      { ...mockContent.category, slug: 'logos', order: 1, createdAt: new Date(), _count: { contents: 0 } },
    ] as any);

    const req = new NextRequest('http://localhost/api/content/categories');
    const res = await getCategories(req as any);
    expect(res.status).toBe(200);
  });
});

// ── GET /api/content/stats ────────────────────────────────────────────────────
describe('GET /api/content/stats', () => {
  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await getStats(makeReq() as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const res = await getStats(makeReq() as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 com estrutura correta (admin)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.content.count).mockResolvedValue(5);
    vi.mocked(prisma.content.groupBy)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);
    vi.mocked(prisma.content.aggregate).mockResolvedValue({ _sum: { downloadCount: 10 } } as any);
    vi.mocked(prisma.content.findMany).mockResolvedValue([]);

    const req  = new NextRequest('http://localhost/api/content/stats');
    const res  = await getStats(req as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('totalItems');
    expect(body).toHaveProperty('totalDownloads');
    expect(body).toHaveProperty('topDownloaded');
  });
});
