/**
 * @context test/services/monitoring.service.test.ts
 * @what    Unit tests for monitoring.service.ts
 * @covers  getStorageMetrics, getDatabaseMetrics, getApiMetrics
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getStorageMetrics,
  getDatabaseMetrics,
  getApiMetrics,
} from '@/services/monitoring.service';

// ── Shared mocks ──────────────────────────────────────────────────────────────
beforeEach(() => vi.clearAllMocks());

// ── getStorageMetrics ─────────────────────────────────────────────────────────
describe('getStorageMetrics', () => {
  it('deve retornar totalFiles correto', async () => {
    vi.mocked(prisma.file.count).mockResolvedValue(42);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: 10_000_000 },
      _avg: { size: 238095  },
      _max: { size: 5_000_000 },
    } as any);
    vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);

    const result = await getStorageMetrics();
    expect(result.totalFiles).toBe(42);
  });

  it('deve calcular usagePercent corretamente (10 MB de 1 GB)', async () => {
    const tenMB = 10 * 1024 * 1024;
    vi.mocked(prisma.file.count).mockResolvedValue(5);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: tenMB },
      _avg: { size: tenMB / 5 },
      _max: { size: tenMB },
    } as any);
    vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);

    const result = await getStorageMetrics();
    const expectedPct = (tenMB / (1 * 1024 * 1024 * 1024)) * 100;
    expect(result.usagePercent).toBeCloseTo(expectedPct, 4);
  });

  it('deve ter usagePercent = 0 quando sem arquivos', async () => {
    vi.mocked(prisma.file.count).mockResolvedValue(0);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: null },
      _avg: { size: null },
      _max: { size: null },
    } as any);
    vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);

    const result = await getStorageMetrics();
    expect(result.usagePercent).toBe(0);
    expect(result.totalSizeBytes).toBe(0);
  });

  it('deve retornar limitBytes = 1 GB', async () => {
    vi.mocked(prisma.file.count).mockResolvedValue(0);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: null }, _avg: { size: null }, _max: { size: null },
    } as any);
    vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);

    const result = await getStorageMetrics();
    expect(result.limitBytes).toBe(1 * 1024 * 1024 * 1024);
  });

  it('deve retornar byCompany e byMimeType como arrays', async () => {
    const byCompany = [{ company: 'SEDAY', _count: { id: 3 }, _sum: { size: 500_000 } }];
    const byMime    = [{ mimeType: 'application/pdf', _count: { id: 2 }, _sum: { size: 300_000 } }];

    vi.mocked(prisma.file.count).mockResolvedValue(3);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: 500_000 }, _avg: { size: 166_666 }, _max: { size: 300_000 },
    } as any);
    vi.mocked(prisma.file.groupBy)
      .mockResolvedValueOnce(byCompany as any)
      .mockResolvedValueOnce(byMime   as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);

    const result = await getStorageMetrics();
    expect(result.byCompany).toEqual(byCompany);
    expect(result.byMimeType).toEqual(byMime);
  });

  it('deve retornar recentUploads dos últimos 7 dias', async () => {
    const recentUpload = {
      createdAt: new Date(),
      size: 1024,
      company: 'SEDAY',
    };
    vi.mocked(prisma.file.count).mockResolvedValue(1);
    vi.mocked(prisma.file.aggregate).mockResolvedValue({
      _sum: { size: 1024 }, _avg: { size: 1024 }, _max: { size: 1024 },
    } as any);
    vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([recentUpload] as any);

    const result = await getStorageMetrics();
    expect(result.recentUploads).toHaveLength(1);
    expect(result.recentUploads[0].size).toBe(1024);
  });
});

// ── getDatabaseMetrics ────────────────────────────────────────────────────────
describe('getDatabaseMetrics', () => {
  const mockCounts = () => {
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8); // active
    vi.mocked(prisma.communication.count)
      .mockResolvedValueOnce(25) // total
      .mockResolvedValueOnce(3); // pinned
    vi.mocked(prisma.folder.count)
      .mockResolvedValueOnce(15) // total
      .mockResolvedValueOnce(3); // root
    vi.mocked(prisma.file.count).mockResolvedValue(42);

    vi.mocked(prisma.user.groupBy)
      .mockResolvedValueOnce([{ company: 'SEDAY', _count: { id: 7 } }] as any)
      .mockResolvedValueOnce([{ role: 'admin', _count: { id: 1 } }]   as any);
    vi.mocked(prisma.communication.groupBy).mockResolvedValue([
      { company: 'SEDAY', _count: { id: 15 } },
    ] as any);
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);
  };

  it('deve retornar counts corretos de usuários', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(result.users.total).toBe(10);
    expect(result.users.active).toBe(8);
    expect(result.users.inactive).toBe(2);
  });

  it('deve retornar counts corretos de comunicados', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(result.communications.total).toBe(25);
    expect(result.communications.pinned).toBe(3);
  });

  it('deve retornar counts corretos de pastas', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(result.folders.total).toBe(15);
    expect(result.folders.root).toBe(3);
  });

  it('deve retornar total de arquivos', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(result.files.total).toBe(42);
  });

  it('deve incluir byCompany e byRole nos usuários', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(result.users.byCompany).toHaveLength(1);
    expect(result.users.byRole).toHaveLength(1);
    expect(result.users.byRole[0].role).toBe('admin');
  });

  it('deve incluir recentActivity dos últimos 30 dias', async () => {
    mockCounts();
    const result = await getDatabaseMetrics();
    expect(Array.isArray(result.recentActivity)).toBe(true);
  });
});

// ── getApiMetrics ─────────────────────────────────────────────────────────────
describe('getApiMetrics', () => {
  beforeEach(() => {
    // files.count and communication.count called multiple times
    vi.mocked(prisma.file.count)
      .mockResolvedValueOnce(2)  // filesLast24h
      .mockResolvedValueOnce(12); // filesLast7d
    vi.mocked(prisma.communication.count)
      .mockResolvedValueOnce(1)   // communicationsLast24h
      .mockResolvedValueOnce(8);  // communicationsLast7d
    vi.mocked(prisma.user.count).mockResolvedValue(3); // usersCreatedLast7d
  });

  it('deve retornar 3 endpoints na estrutura', async () => {
    const result = await getApiMetrics();
    expect(result.endpoints).toHaveLength(3);
  });

  it('deve ter endpoint POST /api/files com contagens corretas', async () => {
    const result = await getApiMetrics();
    const ep = result.endpoints.find((e) => e.route === 'POST /api/files');
    expect(ep).toBeDefined();
    expect(ep!.last24h).toBe(2);
    expect(ep!.last7d).toBe(12);
  });

  it('deve ter endpoint POST /api/communications com contagens corretas', async () => {
    const result = await getApiMetrics();
    const ep = result.endpoints.find((e) => e.route === 'POST /api/communications');
    expect(ep!.last24h).toBe(1);
    expect(ep!.last7d).toBe(8);
  });

  it('deve ter endpoint POST /api/users com last24h = 0', async () => {
    const result = await getApiMetrics();
    const ep = result.endpoints.find((e) => e.route === 'POST /api/users');
    expect(ep!.last24h).toBe(0);
    expect(ep!.last7d).toBe(3);
  });

  it('deve calcular totalOperationsLast24h corretamente', async () => {
    const result = await getApiMetrics();
    // filesLast24h(2) + communicationsLast24h(1)
    expect(result.summary.totalOperationsLast24h).toBe(3);
  });

  it('deve calcular totalOperationsLast7d corretamente', async () => {
    const result = await getApiMetrics();
    // filesLast7d(12) + communicationsLast7d(8) + usersLast7d(3)
    expect(result.summary.totalOperationsLast7d).toBe(23);
  });

  it('deve retornar descrições em português para cada endpoint', async () => {
    const result = await getApiMetrics();
    for (const ep of result.endpoints) {
      expect(typeof ep.description).toBe('string');
      expect(ep.description.length).toBeGreaterThan(0);
    }
  });
});
