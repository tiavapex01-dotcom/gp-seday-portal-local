/**
 * @context test/services/communication.service.test.ts
 * @what    Unit tests for communication.service.ts
 * @covers  getAllCommunications, getPinnedCommunications, createCommunication
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Named exports — NOT communicationService object
import {
  getAllCommunications,
  getPinnedCommunications,
  createCommunication,
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
