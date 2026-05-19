/**
 * @context test/api/monitoring.test.ts
 * @what    Integration tests for GET /api/monitoring
 * @covers  Auth guard, role guard, response structure
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { GET } from '@/app/api/monitoring/route';
import { prisma } from '@/lib/prisma';

// ── Shared session fixtures ───────────────────────────────────────────────────
const adminSession    = { user: { id: 'admin-1',   role: 'admin',   company: 'SEDAY' } };
const managerSession  = { user: { id: 'mgr-1',     role: 'manager', company: 'SEDAY' } };
const employeeSession = { user: { id: 'emp-1',     role: 'employee', company: 'SEDAY' } };

// ── Stub all Prisma calls used by monitoring.service ─────────────────────────
function stubAllMetrics() {
  vi.mocked(prisma.file.count).mockResolvedValue(0);
  vi.mocked(prisma.file.aggregate).mockResolvedValue({
    _sum: { size: null }, _avg: { size: null }, _max: { size: null },
  } as any);
  vi.mocked(prisma.file.groupBy).mockResolvedValue([] as any);
  vi.mocked(prisma.file.findMany).mockResolvedValue([]);

  vi.mocked(prisma.user.count).mockResolvedValue(0);
  vi.mocked(prisma.user.groupBy).mockResolvedValue([] as any);

  vi.mocked(prisma.communication.count).mockResolvedValue(0);
  vi.mocked(prisma.communication.groupBy).mockResolvedValue([] as any);
  vi.mocked(prisma.communication.findMany).mockResolvedValue([]);

  vi.mocked(prisma.folder.count).mockResolvedValue(0);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('GET /api/monitoring', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('deve retornar 403 para manager', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('deve retornar estrutura { storage, database, apis, generatedAt }', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res  = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('storage');
    expect(body).toHaveProperty('database');
    expect(body).toHaveProperty('apis');
    expect(body).toHaveProperty('generatedAt');
  });

  it('generatedAt deve ser uma string ISO válida', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res  = await GET();
    const body = await res.json();

    expect(typeof body.generatedAt).toBe('string');
    expect(new Date(body.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('storage deve ter campos: totalFiles, usagePercent, limitBytes', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res  = await GET();
    const body = await res.json();

    expect(body.storage).toHaveProperty('totalFiles');
    expect(body.storage).toHaveProperty('usagePercent');
    expect(body.storage).toHaveProperty('limitBytes');
  });

  it('database deve ter users.total e communications.total', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res  = await GET();
    const body = await res.json();

    expect(body.database.users).toHaveProperty('total');
    expect(body.database.communications).toHaveProperty('total');
  });

  it('apis deve ter endpoints como array e summary', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    stubAllMetrics();

    const res  = await GET();
    const body = await res.json();

    expect(Array.isArray(body.apis.endpoints)).toBe(true);
    expect(body.apis.endpoints).toHaveLength(3);
    expect(body.apis).toHaveProperty('summary');
  });
});
