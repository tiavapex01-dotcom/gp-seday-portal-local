/**
 * @context test/services/file.service.test.ts
 * @what    Unit tests for file.service.ts
 * @covers  validateFile, uploadFile, listFiles, downloadFile, deleteFile
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import {
  validateFile,
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  getFileById,
} from '@/services/file.service';

// ── Helpers ──────────────────────────────────────────────────────────────────
const storageClient = () => vi.mocked(supabaseAdmin.storage.from).mock.results[0]?.value
  ?? vi.mocked(supabaseAdmin.storage.from)('uploads');

const mockFolder = {
  id: 'folder-1',
  name: 'Documentos',
  company: 'SEDAY',
  isRoot: false,
  parentId: 'root-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

// ── validateFile ─────────────────────────────────────────────────────────────
describe('validateFile', () => {
  it('deve aceitar PDF (retorna null)', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar Excel .xlsx', () => {
    const file = new File(['content'], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar Word .docx', () => {
    const file = new File(['content'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar imagem PNG', () => {
    expect(validateFile(new File(['img'], 'foto.png', { type: 'image/png' }))).toBeNull();
  });

  it('deve aceitar imagem JPEG (.jpg)', () => {
    expect(validateFile(new File(['img'], 'foto.jpg', { type: 'image/jpeg' }))).toBeNull();
  });

  it('deve aceitar imagem JPEG (.jpeg)', () => {
    expect(validateFile(new File(['img'], 'foto.jpeg', { type: 'image/jpeg' }))).toBeNull();
  });

  it('deve aceitar imagem WebP', () => {
    expect(validateFile(new File(['img'], 'foto.webp', { type: 'image/webp' }))).toBeNull();
  });

  it('deve aceitar texto plano .txt', () => {
    expect(validateFile(new File(['txt'], 'notas.txt', { type: 'text/plain' }))).toBeNull();
  });

  it('deve aceitar PowerPoint .pptx', () => {
    const file = new File(['content'], 'apresentacao.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar arquivo com exatamente 50MB', () => {
    const exactly50MB = new Uint8Array(50 * 1024 * 1024);
    const file = new File([exactly50MB], 'limite.pdf', { type: 'application/pdf' });
    expect(validateFile(file)).toBeNull();
  });

  it('deve rejeitar arquivo maior que 50MB', () => {
    const bigContent = new Uint8Array(51 * 1024 * 1024);
    const file = new File([bigContent], 'big.pdf', { type: 'application/pdf' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/50/);
  });

  it('deve rejeitar extensão não permitida (.exe)', () => {
    const file = new File(['content'], 'script.exe', { type: 'application/octet-stream' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/não é permitida/);
  });

  it('deve rejeitar tipo MIME incompatível com extensão (.pdf com type image/jpeg)', () => {
    const file = new File(['content'], 'fake.pdf', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/não corresponde/);
  });

  it('deve rejeitar arquivo sem extensão', () => {
    const file = new File(['content'], 'semextensao', { type: 'application/pdf' });
    expect(validateFile(file)).not.toBeNull();
  });
});

// ── uploadFile ────────────────────────────────────────────────────────────────
describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fresh chained mocks for each test
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: mockFile.path }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(['content']), error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);
  });

  it('deve chamar supabaseAdmin.storage.from com o bucket correto', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.create).mockResolvedValue(mockFile as any);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    await uploadFile(file, { folderId: 'folder-1' }, 'user-1');

    expect(supabaseAdmin.storage.from).toHaveBeenCalledWith('uploads');
  });

  it('deve chamar storage.upload() com buffer e contentType corretos', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.create).mockResolvedValue(mockFile as any);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    await uploadFile(file, { folderId: 'folder-1' }, 'user-1');

    const uploadFn = vi.mocked(supabaseAdmin.storage.from).mock.results[0].value.upload;
    expect(uploadFn).toHaveBeenCalledWith(
      expect.stringContaining('SEDAY/folder-1/'),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/pdf', upsert: false })
    );
  });

  it('deve chamar prisma.file.create com metadados corretos', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.create).mockResolvedValue(mockFile as any);

    const file = new File(['hello'], 'relatorio.pdf', { type: 'application/pdf' });
    await uploadFile(file, { folderId: 'folder-1', description: 'Relatório mensal' }, 'user-1');

    expect(prisma.file.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name:        'relatorio.pdf',
          mimeType:    'application/pdf',
          folderId:    'folder-1',
          uploadedById: 'user-1',
          company:     'SEDAY',
          description: 'Relatório mensal',
        }),
      })
    );
  });

  it('storedName deve ser diferente do nome original (UUID gerado)', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.create).mockResolvedValue(mockFile as any);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    await uploadFile(file, { folderId: 'folder-1' }, 'user-1');

    const createCall = vi.mocked(prisma.file.create).mock.calls[0][0];
    const storedName = createCall.data.storedName as string;
    // storedName must be different from original name but keep .pdf extension
    expect(storedName).not.toBe('relatorio.pdf');
    expect(storedName).toMatch(/\.pdf$/);
  });

  it('deve retornar o registro criado pelo prisma', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.create).mockResolvedValue(mockFile as any);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    const result = await uploadFile(file, { folderId: 'folder-1' }, 'user-1');

    expect(result).toEqual(mockFile);
  });

  it('deve lançar erro descritivo se supabase retornar error', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Bucket cheio' } }),
    } as any);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    await expect(uploadFile(file, { folderId: 'folder-1' }, 'user-1'))
      .rejects.toThrow('Bucket cheio');
  });

  it('deve lançar erro se pasta não existir', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(null);

    const file = new File(['content'], 'relatorio.pdf', { type: 'application/pdf' });
    await expect(uploadFile(file, { folderId: 'pasta-inexistente' }, 'user-1'))
      .rejects.toThrow('Pasta não encontrada');
  });
});

// ── listFiles ─────────────────────────────────────────────────────────────────
describe('listFiles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar prisma.file.findMany com folderId correto', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);
    vi.mocked(prisma.file.count).mockResolvedValue(0);

    await listFiles({ folderId: 'folder-1', page: 1, limit: 20 });

    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { folderId: 'folder-1' },
      })
    );
  });

  it('deve incluir dados do uploader (include: uploadedBy)', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);
    vi.mocked(prisma.file.count).mockResolvedValue(0);

    await listFiles({ folderId: 'folder-1', page: 1, limit: 20 });

    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          uploadedBy: expect.any(Object),
        }),
      })
    );
  });

  it('deve retornar array vazio para pasta sem arquivos', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([]);
    vi.mocked(prisma.file.count).mockResolvedValue(0);

    const result = await listFiles({ folderId: 'folder-1', page: 1, limit: 20 });
    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('deve retornar metadados de paginação corretos', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(mockFolder as any);
    vi.mocked(prisma.file.findMany).mockResolvedValue([mockFile as any]);
    vi.mocked(prisma.file.count).mockResolvedValue(1);

    const result = await listFiles({ folderId: 'folder-1', page: 1, limit: 20 });
    expect(result.meta.total).toBe(1);
    expect(result.meta.pages).toBe(1);
    expect(result.folder).toEqual(mockFolder);
  });

  it('deve lançar erro se pasta não existir', async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue(null);

    await expect(listFiles({ folderId: 'inexistente', page: 1, limit: 20 }))
      .rejects.toThrow('Pasta não encontrada');
  });
});

// ── downloadFile ──────────────────────────────────────────────────────────────
describe('downloadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: new Blob(['content']), error: null }),
    } as any);
  });

  it('deve buscar arquivo no banco por id', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);

    await downloadFile('file-1');

    expect(prisma.file.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'file-1' } })
    );
  });

  it('deve chamar storage.download() com o path correto do arquivo', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);

    await downloadFile('file-1');

    expect(supabaseAdmin.storage.from).toHaveBeenCalledWith('uploads');
    const downloadFn = vi.mocked(supabaseAdmin.storage.from).mock.results[0].value.download;
    expect(downloadFn).toHaveBeenCalledWith(mockFile.path);
  });

  it('deve retornar { file, data }', async () => {
    const blobData = new Blob(['pdf content']);
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: blobData, error: null }),
    } as any);

    const result = await downloadFile('file-1');
    expect(result.file).toEqual(mockFile);
    expect(result.data).toEqual(blobData);
  });

  it('deve lançar erro se arquivo não existir no banco', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);

    await expect(downloadFile('inexistente')).rejects.toThrow('Arquivo não encontrado');
  });

  it('deve lançar erro se supabase retornar erro no download', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: { message: 'Arquivo corrompido' } }),
    } as any);

    await expect(downloadFile('file-1')).rejects.toThrow('Arquivo não encontrado no storage');
  });
});

// ── deleteFile ────────────────────────────────────────────────────────────────
describe('deleteFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any);
  });

  it('deve chamar storage.remove() com o path correto', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(prisma.file.delete).mockResolvedValue(mockFile as any);

    await deleteFile('file-1');

    const removeFn = vi.mocked(supabaseAdmin.storage.from).mock.results[0].value.remove;
    expect(removeFn).toHaveBeenCalledWith([mockFile.path]);
  });

  it('deve chamar prisma.file.delete() com o id correto', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(prisma.file.delete).mockResolvedValue(mockFile as any);

    await deleteFile('file-1');

    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
  });

  it('deve executar storage remove E db delete', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);
    vi.mocked(prisma.file.delete).mockResolvedValue(mockFile as any);

    await deleteFile('file-1');

    const removeFn = vi.mocked(supabaseAdmin.storage.from).mock.results[0].value.remove;
    expect(removeFn).toHaveBeenCalledTimes(1);
    expect(prisma.file.delete).toHaveBeenCalledTimes(1);
  });

  it('deve lançar erro se arquivo não existir no banco', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);

    await expect(deleteFile('inexistente')).rejects.toThrow('Arquivo não encontrado');
  });
});

// ── getFileById ───────────────────────────────────────────────────────────────
describe('getFileById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar prisma.file.findUnique com id e include folder', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(mockFile as any);

    const result = await getFileById('file-1');

    expect(prisma.file.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'file-1' },
        include: expect.objectContaining({ folder: expect.any(Object) }),
      })
    );
    expect(result).toEqual(mockFile);
  });

  it('deve retornar null se arquivo não existir', async () => {
    vi.mocked(prisma.file.findUnique).mockResolvedValue(null);
    expect(await getFileById('inexistente')).toBeNull();
  });
});
