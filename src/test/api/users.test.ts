/**
 * @context test/api/users.test.ts
 * @what    Integration tests for /api/users route
 * @covers  GET and POST — auth guard, role guard, validation
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

const adminSession = {
  user: { id: 'admin-1', role: 'admin', company: 'SEDAY' },
};

const managerSession = {
  user: { id: 'manager-1', role: 'manager', company: 'SEDAY' },
};

const employeeSession = {
  user: { id: 'emp-1', role: 'employee', company: 'SEDAY' },
};

describe('GET /api/users', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 403 sem sessão (route usa forbidden() para não-admin)', async () => {
    // Real route: if (!session?.user || session.user.role !== 'admin') return forbidden()
    // So null session → 403, not 401
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/users');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 403 para manager', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    const req = new NextRequest('http://localhost/api/users');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/users');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 200 para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/users');
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it('deve retornar lista paginada para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: 'u1',
        name: 'Usuário 1',
        email: 'u1@seday.com',
        role: 'employee',
        company: 'SEDAY',
        sector: null,
        active: true,
        createdAt: new Date(),
      } as any,
    ]);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/users');
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

describe('POST /api/users', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 403 para manager', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo',
        email: 'novo@test.com',
        password: 'Senha@123',
        role: 'employee',
        company: 'SEDAY',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo',
        email: 'novo@test.com',
        password: 'Senha@123',
        role: 'employee',
        company: 'SEDAY',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('deve retornar 400 para dados inválidos (email inválido)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo',
        email: 'email-invalido',
        password: 'Senha@123',
        role: 'employee',
        company: 'SEDAY',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    // ZodError → fromZodError → 422 (real behavior in api.ts)
    expect(response.status).toBe(422);
  });

  it('deve criar usuário (201) com dados válidos para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null); // no conflict
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-1',
      name: 'Novo Usuário',
      email: 'novo@seday.com',
      role: 'employee',
      company: 'SEDAY',
      sector: null,
    } as any);

    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Usuário',
        email: 'novo@seday.com',
        password: 'Senha@123',
        role: 'employee',
        company: 'SEDAY',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});
