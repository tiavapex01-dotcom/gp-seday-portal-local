/**
 * @context test/services/content.service.test.ts
 * @what    Unit tests for content.service.ts
 * @covers  listContent, getContentById, createContent, deleteContent,
 *          incrementDownload, listCategories, getContentStats, validateContentFile
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

import {
  listContent,
  getContentById,
  createContent,
  deleteContent,
  incrementDownload,
  listCategories,
  getContentStats,
  validateContentFile,
} from '@/services/content.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockContent = {
  id:            'c1',
  title:         'Logo SEDAY',
  description:   'Logo oficial',
  type:          'image',
  company:       'SEDAY',
  tags:          ['logo', 'horizontal'],
  storedName:    'uuid.png',
  path:          'SEDAY/cat-1/uuid.png',
  mimeType:      'image/png',
  size:          204800,
  thumbnailPath: null,
  published:     true,
  featured:      false,
  downloadCount: 3,
  categoryId:    'cat-1',
  uploadedById:  'user-1',
  createdAt:     new Date(),
  updatedAt:     new Date(),
  category:      { id: 'cat-1', name: 'Logos', icon: '🎨' },
  uploadedBy:    { id: 'user-1', name: 'Admin' },
};

const mockCategory = {
  id:          'cat-1',
  name:        'Logos e Marcas',
  slug:        'logos',
  description: 'Logos oficiais',
  icon:        '🎨',
  order:       1,
  company:     'SEDAY',
  createdAt:   new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ── validateContentFile ───────────────────────────────────────────────────────
describe('validateContentFile', () => {
  const makeFile = (name: string, type: string, size = 1024) =>
    new File(['x'.repeat(size)], name, { type });

  it('deve retornar null para PNG válido', () => {
    expect(validateContentFile(makeFile('logo.png', 'image/png'))).toBeNull();
  });

  it('deve retornar null para PDF válido', () => {
    expect(validateContentFile(makeFile('doc.pdf', 'application/pdf'))).toBeNull();
  });

  it('deve rejeitar extensão desconhecida', () => {
    expect(validateContentFile(makeFile('virus.exe', 'application/x-msdownload'))).not.toBeNull();
  });

  it('deve rejeitar MIME incompatível com extensão', () => {
    const result = validateContentFile(makeFile('photo.png', 'video/mp4'));
    expect(result).not.toBeNull();
  });

  it('deve aceitar MP4 válido', () => {
    expect(validateContentFile(makeFile('video.mp4', 'video/mp4'))).toBeNull();
  });

  it('deve aceitar DOCX válido', () => {
    const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    expect(validateContentFile(makeFile('doc.docx', mime))).toBeNull();
  });
});

// ── listCategories ────────────────────────────────────────────────────────────
describe('listCategories', () => {
  it('deve chamar findMany com company filter', async () => {
    vi.mocked(prisma.contentCategory.findMany).mockResolvedValue([mockCategory] as any);

    const result = await listCategories('SEDAY');

    expect(prisma.contentCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { company: { in: ['SEDAY', 'ALL'] } },
      })
    );
    expect(result).toHaveLength(1);
  });

  it('deve listar todas quando company é undefined', async () => {
    vi.mocked(prisma.contentCategory.findMany).mockResolvedValue([mockCategory] as any);

    await listCategories(undefined);

    expect(prisma.contentCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });
});

// ── listContent ───────────────────────────────────────────────────────────────
describe('listContent', () => {
  beforeEach(() => {
    vi.mocked(prisma.content.findMany).mockResolvedValue([mockContent] as any);
    vi.mocked(prisma.content.count).mockResolvedValue(1);
  });

  it('deve retornar data e meta', async () => {
    const result = await listContent({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('deve filtrar por company', async () => {
    await listContent({ company: 'SEDAY', page: 1, limit: 20 });
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ company: 'SEDAY' }) })
    );
  });

  it('deve filtrar por type', async () => {
    await listContent({ type: 'image', page: 1, limit: 20 });
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: 'image' }) })
    );
  });

  it('deve incluir filtro OR quando search fornecido', async () => {
    await listContent({ search: 'logo', page: 1, limit: 20 });
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    );
  });

  it('deve calcular skip correto para page 2', async () => {
    await listContent({ page: 2, limit: 10 });
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});

// ── getContentById ────────────────────────────────────────────────────────────
describe('getContentById', () => {
  it('deve chamar findUnique com id correto', async () => {
    vi.mocked(prisma.content.findUnique).mockResolvedValue(mockContent as any);
    const result = await getContentById('c1');
    expect(prisma.content.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'c1' } })
    );
    expect(result?.id).toBe('c1');
  });

  it('deve retornar null se não encontrado', async () => {
    vi.mocked(prisma.content.findUnique).mockResolvedValue(null);
    expect(await getContentById('nao-existe')).toBeNull();
  });
});

// ── createContent ─────────────────────────────────────────────────────────────
describe('createContent', () => {
  it('deve fazer upload no Supabase e criar registro', async () => {
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'SEDAY/cat-1/uuid.png' }, error: null }),
    } as any);
    vi.mocked(prisma.content.create).mockResolvedValue(mockContent as any);

    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    const result = await createContent(
      file,
      { title: 'Logo', type: 'image', company: 'SEDAY', categoryId: 'cat-1', tags: [], featured: false, published: true },
      'user-1'
    );

    expect(supabaseAdmin.storage.from).toHaveBeenCalled();
    expect(prisma.content.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Logo', company: 'SEDAY', uploadedById: 'user-1' }),
      })
    );
    expect(result.id).toBe('c1');
  });

  it('deve lançar erro se upload falhar', async () => {
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Bucket cheio' } }),
    } as any);

    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    await expect(
      createContent(file, { title: 'X', type: 'image', company: 'SEDAY', categoryId: 'c', tags: [], featured: false, published: true }, 'u1')
    ).rejects.toThrow('Falha ao armazenar o arquivo');
  });
});

// ── deleteContent ─────────────────────────────────────────────────────────────
describe('deleteContent', () => {
  it('deve chamar storage.remove E prisma.content.delete', async () => {
    vi.mocked(prisma.content.findUnique).mockResolvedValue(mockContent as any);
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);
    vi.mocked(prisma.content.delete).mockResolvedValue(mockContent as any);

    await deleteContent('c1');

    expect(supabaseAdmin.storage.from).toHaveBeenCalled();
    expect(prisma.content.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('deve lançar erro se conteúdo não encontrado', async () => {
    vi.mocked(prisma.content.findUnique).mockResolvedValue(null);
    await expect(deleteContent('nao-existe')).rejects.toThrow('não encontrado');
  });
});

// ── incrementDownload ─────────────────────────────────────────────────────────
describe('incrementDownload', () => {
  it('deve chamar update com increment', async () => {
    vi.mocked(prisma.content.update).mockResolvedValue({ ...mockContent, downloadCount: 4 } as any);

    await incrementDownload('c1');

    expect(prisma.content.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data:  { downloadCount: { increment: 1 } },
    });
  });
});

// ── getContentStats ───────────────────────────────────────────────────────────
describe('getContentStats', () => {
  beforeEach(() => {
    vi.mocked(prisma.content.count).mockResolvedValue(10);
    vi.mocked(prisma.content.groupBy)
      .mockResolvedValueOnce([{ type: 'image', _count: { id: 5 }, _sum: { size: 1000 } }] as any)
      .mockResolvedValueOnce([{ company: 'SEDAY', _count: { id: 10 }, _sum: { size: 2000 } }] as any);
    vi.mocked(prisma.content.aggregate).mockResolvedValue({ _sum: { downloadCount: 42 } } as any);
    vi.mocked(prisma.content.findMany).mockResolvedValue([mockContent] as any);
  });

  it('deve retornar totalItems e totalDownloads', async () => {
    const stats = await getContentStats('SEDAY');
    expect(stats.totalItems).toBe(10);
    expect(stats.totalDownloads).toBe(42);
  });

  it('deve retornar byType como array', async () => {
    const stats = await getContentStats();
    expect(Array.isArray(stats.byType)).toBe(true);
  });

  it('deve retornar topDownloaded com máx 5 itens', async () => {
    const stats = await getContentStats();
    expect(stats.topDownloaded.length).toBeLessThanOrEqual(5);
  });
});
