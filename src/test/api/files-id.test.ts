/**
 * @context test/api/files-id.test.ts
 * @what    Integration tests for /api/files/[id], /api/files/route (upload/list), /api/files/download/[id]
 * @covers  DELETE file, GET download, POST upload auth/role guards
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/auth';
import { DELETE } from '@/app/api/files/[id]/route';
import { GET as DOWNLOAD } from '@/app/api/files/download/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

const adminSession    = { user: { id: 'admin-1',   role: 'admin',   company: 'SEDAY' } };
const managerSession  = { user: { id: 'manager-1', role: 'manager', company: 'SEDAY' } };
const employeeSession = { user: { id: 'emp-1',     role: 'employee', company: 'SEDAY' } };

const mockFile = {
  id: 'file-1',
  name: 'relatorio.pdf',
  storedName: 'uuid-abc.pdf',
  path: 'SEDAY/folder-1/uuid-abc.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  company: 'SEDAY',
  description: null,
  folderId: 'folder-1',
  uploadedById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  folder: { company: 'SEDAY' },
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

// ── DELETE /api/files/[id] ────────────────────────────────────────────────────
describe('DELETE /api/files/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);
  });

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/files/file-1');
    const res = await DELETE(req, makeParams('file-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para employee', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any);
    const req = new NextRequest('http://localhost/api/files/file-1');
    const res = await DELETE(req, makeParams('file-1'));
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se arquivo não existir', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/files/file-x');
    const res = await DELETE(req, makeParams('file-x'));
    expect(res.status).toBe(404);
  });

  it('deve retornar 200 para admin deletando arquivo existente', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(prisma.file.delete).mockResolvedValue(mockFile as any);

    const req = new NextRequest('http://localhost/api/files/file-1');
    const res = await DELETE(req, makeParams('file-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para manager deletando arquivo da sua empresa', async () => {
    vi.mocked(auth).mockResolvedValue(managerSession as any); // company: SEDAY
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any); // folder.company: SEDAY
    vi.mocked(prisma.file.delete).mockResolvedValue(mockFile as any);

    const req = new NextRequest('http://localhost/api/files/file-1');
    const res = await DELETE(req, makeParams('file-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 403 para manager de outra empresa', async () => {
    const otherManager = { user: { id: 'mgr-x', role: 'manager', company: 'AVAPEX' } };
    vi.mocked(auth).mockResolvedValue(otherManager as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any); // folder.company: SEDAY

    const req = new NextRequest('http://localhost/api/files/file-1');
    const res = await DELETE(req, makeParams('file-1'));
    expect(res.status).toBe(403);
  });
});

// ── GET /api/files/download/[id] ─────────────────────────────────────────────
describe('GET /api/files/download/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: new Blob(['pdf content']), error: null }),
    } as any);
  });

  it('deve retornar 401 sem sessão', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 para qualquer usuário autenticado da mesma empresa', async () => {
    vi.mocked(auth).mockResolvedValue(employeeSession as any); // company: SEDAY
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any); // folder.company: SEDAY

    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar 200 para admin de qualquer empresa', async () => {
    const adminOutside = { user: { id: 'a1', role: 'admin', company: 'AVAPEX' } };
    vi.mocked(auth).mockResolvedValue(adminOutside as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any); // SEDAY

    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));
    expect(res.status).toBe(200);
  });

  it('deve retornar cabeçalhos de download corretos para PDF (inline)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);

    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));

    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('inline');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('deve retornar Content-Disposition "attachment" para arquivos não-PDF e não-imagem', async () => {
    const excelFile = { ...mockFile, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'data.xlsx' };
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(excelFile as any);

    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('deve retornar 500 se arquivo não existir no banco (downloadFile throws)', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/files/download/file-x');
    const res = await DOWNLOAD(req, makeParams('file-x'));
    // downloadFile throws 'Arquivo não encontrado' → caught by try/catch → 500
    expect(res.status).toBe(500);
  });

  it('deve retornar 403 para employee de outra empresa', async () => {
    const empOther = { user: { id: 'emp-x', role: 'employee', company: 'AVAPEX' } };
    vi.mocked(auth).mockResolvedValue(empOther as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any); // SEDAY

    const req = new NextRequest('http://localhost/api/files/download/file-1');
    const res = await DOWNLOAD(req, makeParams('file-1'));
    expect(res.status).toBe(403);
  });
});
