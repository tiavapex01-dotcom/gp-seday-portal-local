/**
 * @context test/services/communication.service.test.ts
 * @what    Unit tests for communication.service.ts
 * @covers  getAllCommunications, getPinnedCommunications, createCommunication,
 *          updateCommunication, deleteCommunication, getCommunicationById,
 *          getRecentCommunications, listCommunicationsForApi
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

import {
  getAllCommunications,
  getPinnedCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getCommunicationById,
  getRecentCommunications,
  listCommunicationsForApi,
} from '@/services/communication.service';

const mockCommunications = [
  {
    id: '1',
    title: 'Comunicado Fixado',
    content: 'Conteúdo fixado',
    company: 'SEDAY',
    sector: 'TI',
    pinned: true,
    published: true,
    contactPhone: null,
    contactEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    createdBy: { name: 'Administrador' },
  },
  {
    id: '2',
    title: 'Comunicado Normal',
    content: 'Conteúdo normal',
    company: 'AVAPEX',
    sector: 'RH',
    pinned: false,
    published: true,
    contactPhone: null,
    contactEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'user-1',
    createdBy: { name: 'Administrador' },
  },
];

describe('getAllCommunications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar todos os publicados', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue(
      mockCommunications as any
    );

    const result = await getAllCommunications();

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ published: true }),
      })
    );
    expect(result).toHaveLength(2);
  });
});

describe('getPinnedCommunications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar apenas fixados e publicados', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue(
      [mockCommunications[0]] as any
    );

    const result = await getPinnedCommunications();

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ pinned: true, published: true }),
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].pinned).toBe(true);
  });

  it('deve aceitar limite opcional', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);

    await getPinnedCommunications(5);

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});

describe('createCommunication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve persistir com os campos corretos', async () => {
    vi.mocked(prisma.communication.create).mockResolvedValue(
      mockCommunications[0] as any
    );

    await createCommunication(
      {
        title: 'Teste',
        content: 'Conteúdo',
        company: 'SEDAY',
        sector: 'TI',
        pinned: false,
        contactPhone: null,
        contactEmail: null,
      },
      'user-1' // createdById — string, not session object
    );

    expect(prisma.communication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Teste',
          createdById: 'user-1',
        }),
      })
    );
  });
});

describe('updateCommunication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar prisma.communication.update com id e data corretos', async () => {
    vi.mocked(prisma.communication.update).mockResolvedValue({
      ...mockCommunications[0],
      pinned: true,
    } as any);

    await updateCommunication('1', { pinned: true });

    expect(prisma.communication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ pinned: true }),
      })
    );
  });

  it('deve permitir toggle de published (true → false)', async () => {
    vi.mocked(prisma.communication.update).mockResolvedValue({
      ...mockCommunications[0],
      published: false,
    } as any);

    const result = await updateCommunication('1', { published: false });
    expect(prisma.communication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ published: false }),
      })
    );
  });

  it('deve retornar o comunicado atualizado', async () => {
    const updated = { ...mockCommunications[0], pinned: true };
    vi.mocked(prisma.communication.update).mockResolvedValue(updated as any);

    const result = await updateCommunication('1', { pinned: true });
    expect(result).toEqual(updated);
  });
});

describe('deleteCommunication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar prisma.communication.delete com id correto', async () => {
    vi.mocked(prisma.communication.delete).mockResolvedValue(mockCommunications[0] as any);

    await deleteCommunication('1');

    expect(prisma.communication.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('deve retornar o comunicado deletado', async () => {
    vi.mocked(prisma.communication.delete).mockResolvedValue(mockCommunications[0] as any);
    const result = await deleteCommunication('1');
    expect(result.id).toBe('1');
  });
});

describe('getCommunicationById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar findUnique com id correto', async () => {
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(mockCommunications[0] as any);

    const result = await getCommunicationById('1');

    expect(prisma.communication.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result?.id).toBe('1');
  });

  it('deve retornar null se não encontrado', async () => {
    vi.mocked(prisma.communication.findUnique).mockResolvedValue(null);
    expect(await getCommunicationById('inexistente')).toBeNull();
  });
});

describe('getRecentCommunications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar findMany com take: 3 por padrão', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);

    await getRecentCommunications(3);

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it('deve usar limit padrão de 10', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);

    await getRecentCommunications();

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it('deve ordenar por createdAt desc', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);

    await getRecentCommunications();

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});

describe('listCommunicationsForApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve retornar dados paginados e meta', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue(mockCommunications as any);
    vi.mocked(prisma.communication.count).mockResolvedValue(2);

    const result = await listCommunicationsForApi({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.pages).toBe(1);
  });

  it('deve filtrar por pinned quando fornecido', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([mockCommunications[0]] as any);
    vi.mocked(prisma.communication.count).mockResolvedValue(1);

    await listCommunicationsForApi({ page: 1, limit: 20, pinned: true });

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ pinned: true }),
      })
    );
  });

  it('deve filtrar por sector quando fornecido', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communication.count).mockResolvedValue(0);

    await listCommunicationsForApi({ page: 1, limit: 20, sector: 'TI' });

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sector: 'TI' }),
      })
    );
  });

  it('deve calcular skip correto para paginação', async () => {
    vi.mocked(prisma.communication.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communication.count).mockResolvedValue(50);

    await listCommunicationsForApi({ page: 3, limit: 10 });

    expect(prisma.communication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});
