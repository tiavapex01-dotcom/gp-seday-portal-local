/**
 * @context test/api/communications-id.test.ts
 * @what    Integration tests for /api/communications/[id] dynamic route
 * @covers  PATCH (toggle pin/publish) and DELETE
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { PATCH, DELETE } from '@/app/api/communications/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── Shared fixtures ──────────────────────────────────────────────────────────
const adminSession    = { user: { id: 'admin-1',   role: 'admin',   company: 'SEDAY' } };
const managerSession  = { user: { id: 'manager-1', role: 'manager', company: 'SEDAY' } };
const employeeSession = { user: { id: 'emp-1',     role: 'employee', company: 'SEDAY' } };

const mockComm = {
  id: 'comm-1',
  title: 'Comunicado',
  content: 'Conteúdo',
  company: 'SEDAY',
  sector: 'TI',
  pinned: false,
  published: true,
  contactPhone: null,
  contactEmail: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: 'manager-1', // owned by manager
};

// Params as Next.js 15 expects: a Promise
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

// ── DELETE /api/communications/[id] ─────────────────────────────────────────
describe('DELETE /api/communications/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/communications/comm-1');
    const res = await DELETE(req, makeParams('comm-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/communications/comm-1');
    const res = await DELETE(req, makeParams('comm-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se comunicado não existir', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/communications/comm-x');
    const res = await DELETE(req, makeParams('comm-x'));
    expect(res.status).toBe(404);
  });

  it('deve retornar 200 para admin deletando qualquer comunicado', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);
    vi.mocked(prisma.communication.delete).mockResolvedValue(mockComm as any);

    const req = new NextRequest('http://localhost/api/communications/comm-1');
    const res = await DELETE(req, makeParams('comm-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para manager deletando seu próprio comunicado', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any); // id: manager-1, same as createdById
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);
    vi.mocked(prisma.communication.delete).mockResolvedValue(mockComm as any);

    const req = new NextRequest('http://localhost/api/communications/comm-1');
    const res = await DELETE(req, makeParams('comm-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 403 para manager tentando deletar comunicado de outra empresa/usuário', async () => {
    const otherManager = { user: { id: 'other-manager', role: 'manager', company: 'AVAPEX' } };
    vi.mocked(auth).mockResolvedValue(otherManager as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any); // company: SEDAY, createdById: manager-1

    const req = new NextRequest('http://localhost/api/communications/comm-1');
    const res = await DELETE(req, makeParams('comm-1'));
    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/communications/[id] ──────────────────────────────────────────
describe('PATCH /api/communications/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({ pinned: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({ pinned: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se comunicado não existir', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/communications/comm-x', {
      method: 'PATCH',
      body: JSON.stringify({ pinned: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-x'));
    expect(res.status).toBe(404);
  });

  it('deve retornar 200 para admin editando comunicado existente', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);
    vi.mocked(prisma.communication.update).mockResolvedValue({ ...mockComm, pinned: true } as any);

    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({ pinned: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para manager editando seu próprio comunicado', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any); // id: manager-1 = createdById
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);
    vi.mocked(prisma.communication.update).mockResolvedValue({ ...mockComm, published: false } as any);

    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({ published: false }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 403 para manager tentando editar comunicado de outro', async () => {
    const otherManager = { user: { id: 'other-mgr', role: 'manager', company: 'SEDAY' } };
    vi.mocked(auth).mockResolvedValue(otherManager as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any); // createdById: manager-1

    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({ pinned: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 422 para dados inválidos (objeto vazio)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockComm as any);

    const req = new NextRequest('http://localhost/api/communications/comm-1', {
      method: 'PATCH',
      body: JSON.stringify({}), // updateCommunicationSchema refine rejects empty
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('comm-1'));
    expect(res.status).toBe(422);
  });
});
