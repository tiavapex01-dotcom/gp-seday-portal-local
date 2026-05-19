/**
 * @context test/api/communications.test.ts
 * @what    Integration tests for /api/communications route
 * @covers  GET (auth guard, listing) and POST (role guard, validation, creation)
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { GET, POST } from '@/app/api/communications/route';
import { NextRequest } from 'next/server';

const adminSession = {
  user: { id: 'user-1', role: 'admin', company: 'SEDAY', sector: 'TI' },
};

const employeeSession = {
  user: { id: 'user-2', role: 'employee', company: 'SEDAY', sector: 'TI' },
};

const managerSession = {
  user: { id: 'user-3', role: 'manager', company: 'SEDAY', sector: 'TI' },
};

describe('GET /api/communications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/communications');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('deve retornar 200 para admin com lista vazia', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communication.count).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/communications');
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it('deve retornar 200 para employee (GET é público a autenticados)', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communication.count).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/communications');
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});

describe('POST /api/communications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Teste',
        content: 'Conteúdo',
        company: 'SEDAY',
        sector: 'TI',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 400 para dados inválidos (título vazio)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({ title: '', content: 'x', company: 'SEDAY', sector: 'TI' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    // ZodError → fromZodError → 422 (real behavior in api.ts)
    expect(response.status).toBe(422);
  });

  it('deve criar comunicado (201) com dados válidos para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.communication.create).mockResolvedValue({
      id: '1',
      title: 'Comunicado Teste',
      content: 'Conteúdo válido',
      company: 'SEDAY',
      sector: 'TI',
      pinned: false,
      published: false,
      contactPhone: null,
      contactEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'user-1',
    } as any);

    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Comunicado Teste',
        content: 'Conteúdo válido',
        company: 'SEDAY',
        sector: 'TI',
        pinned: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it('deve criar comunicado (201) com dados válidos para manager da mesma empresa', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.communication.create).mockResolvedValue({
      id: '2',
      title: 'Manager Comm',
    } as any);

    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Manager Comm',
        content: 'Conteúdo',
        company: 'SEDAY', // same as manager's company
        sector: 'RH',
        pinned: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it('deve retornar 403 para manager tentando criar em outra empresa', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any); // company: SEDAY
    const req = new NextRequest('http://localhost/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Teste',
        content: 'Conteúdo',
        company: 'AVAPEX', // different company
        sector: 'TI',
        pinned: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });
});
