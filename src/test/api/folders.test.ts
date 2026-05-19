/**
 * @context test/api/folders.test.ts
 * @what    Integration tests for /api/folders and /api/folders/[id] routes
 * @covers  GET (list), POST (create subfolder + root sector), DELETE, PATCH (rename)
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { GET, POST } from '@/app/api/folders/route';
import { DELETE, PATCH } from '@/app/api/folders/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const adminSession    = { user: { id: 'admin-1',   role: 'admin',   company: 'SEDAY' } };
const managerSession  = { user: { id: 'manager-1', role: 'manager', company: 'SEDAY' } };
const employeeSession = { user: { id: 'emp-1',     role: 'employee', company: 'SEDAY' } };

const mockRootFolder = {
  id: 'root-1',
  name: 'TI',
  isRoot: true,
  company: 'SEDAY',
  parentId: null,
  createdById: 'manager-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { files: 0, children: 0 },
  createdBy: { id: 'manager-1', name: 'Manager' },
};

const mockSubFolder = {
  ...mockRootFolder,
  id: 'sub-1',
  name: 'Projetos',
  isRoot: false,
  parentId: 'root-1',
  company: 'SEDAY',
  _count: { files: 0, children: 0 },
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

// ── GET /api/folders ──────────────────────────────────────────────────────────
describe('GET /api/folders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/folders');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 com lista de pastas para admin', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findMany).mockResolvedValue([mockRootFolder] as any);

    const req = new NextRequest('http://localhost/api/folders');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para employee da mesma empresa', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    vi.mocked(prisma.folder.findMany).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/folders');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('deve retornar 403 quando employee tenta listar outra empresa via query param', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any); // company: SEDAY
    const req = new NextRequest('http://localhost/api/folders?company=AVAPEX');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('deve usar company da sessão quando query param não fornecido', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    vi.mocked(prisma.folder.findMany).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/folders');
    await GET(req);

    expect(prisma.folder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { company: 'SEDAY' } })
    );
  });
});

// ── POST /api/folders ─────────────────────────────────────────────────────────
describe('POST /api/folders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'Novo', parentId: 'root-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'Novo', parentId: 'root-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('deve criar subpasta (201) para manager com parentId válido', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockRootFolder as any); // parent
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(null); // no duplicate
    vi.mocked(prisma.folder.create).mockResolvedValue(mockSubFolder as any);

    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'Projetos', parentId: 'root-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('deve criar setor raiz (201) para admin com isRoot: true', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(null); // no duplicate
    vi.mocked(prisma.folder.create).mockResolvedValue(mockRootFolder as any);

    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'TI', company: 'SEDAY', isRoot: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('deve retornar 403 para manager tentando criar setor em outra empresa', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any); // company: SEDAY
    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: 'TI', company: 'AVAPEX', isRoot: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('deve retornar 422 para dados inválidos (nome vazio)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const req = new NextRequest('http://localhost/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name: '', parentId: 'root-1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ── DELETE /api/folders/[id] ─────────────────────────────────────────────────
describe('DELETE /api/folders/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se pasta não existir', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/folders/pasta-x');
    const res = await DELETE(req, makeParams('pasta-x'));
    expect(res.status).toBe(404);
  });

  it('deve retornar 403 se pasta for raiz (isRoot: true)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockRootFolder as any);

    const req = new NextRequest('http://localhost/api/folders/root-1');
    const res = await DELETE(req, makeParams('root-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 409 se pasta tiver arquivos', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      ...mockSubFolder,
      _count: { files: 3, children: 0 },
    } as any);

    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(409);
  });

  it('deve retornar 409 se pasta tiver subpastas', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      ...mockSubFolder,
      _count: { files: 0, children: 2 },
    } as any);

    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(409);
  });

  it('deve retornar 200 ao deletar pasta vazia não-raiz', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockSubFolder as any); // empty, not root
    vi.mocked(prisma.folder.delete).mockResolvedValue(mockSubFolder as any);

    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 403 para manager tentando deletar pasta de outro', async () => {
    const otherManager = { user: { id: 'other-mgr', role: 'manager', company: 'SEDAY' } };
    vi.mocked(auth).mockResolvedValue(otherManager as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockSubFolder as any); // createdById: manager-1

    const req = new NextRequest('http://localhost/api/folders/sub-1');
    const res = await DELETE(req, makeParams('sub-1'));
    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/folders/[id] (rename) ─────────────────────────────────────────
describe('PATCH /api/folders/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/folders/sub-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Novo Nome' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('sub-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 para admin renomeando pasta', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique)
      // getFolderById (route-level)
      .mockResolvedValueOnce(mockSubFolder as any)
      // renameFolder → findUnique (service-level)
      .mockResolvedValueOnce(mockSubFolder as any);
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(null); // no duplicate
    vi.mocked(prisma.folder.update).mockResolvedValue({ ...mockSubFolder, name: 'Novo Nome' } as any);

    const req = new NextRequest('http://localhost/api/folders/sub-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Novo Nome' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('sub-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 404 se pasta não existir', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/folders/pasta-x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Novo' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('pasta-x'));
    expect(res.status).toBe(404);
  });
});
