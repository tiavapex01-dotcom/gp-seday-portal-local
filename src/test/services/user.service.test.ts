/**
 * @context test/services/user.service.test.ts
 * @what    Unit tests for user.service.ts
 * @covers  createUser, updateUser, listUsers
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Named exports — NOT a userService object
import { createUser, updateUser } from '@/services/user.service';

describe('createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve criar usuário com email em lowercase (schema já faz a transformação)', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: '1',
      name: 'Admin',
      email: 'admin@gruposeday.com.br',
      cpf: null,
      phone: null,
      password: '$2b$12$hash',
      role: 'admin',
      company: 'SEDAY',
      sector: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // The schema transforms email to lowercase before calling the service.
    // So the service always receives lowercase email. We test it here directly.
    await createUser({
      name: 'Admin',
      email: 'admin@gruposeday.com.br', // already lowercased by schema
      password: 'Admin@123',
      role: 'admin',
      company: 'SEDAY',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'admin@gruposeday.com.br',
        }),
      })
    );
  });

  it('deve lançar erro se email já existir', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: '1',
      email: 'admin@gruposeday.com.br',
      cpf: null,
      phone: null,
    } as any);

    await expect(
      createUser({
        name: 'Admin 2',
        email: 'admin@gruposeday.com.br',
        password: 'Admin@123',
        role: 'employee',
        company: 'SEDAY',
      })
    ).rejects.toThrow('E-mail já cadastrado');
  });

  it('deve lançar erro se CPF já existir', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: '2',
      email: 'outro@gruposeday.com.br',
      cpf: '12345678901',
      phone: null,
    } as any);

    await expect(
      createUser({
        name: 'Outro User',
        email: 'outro2@gruposeday.com.br',
        password: 'Senha@123',
        role: 'employee',
        company: 'AVAPEX',
        cpf: '12345678901', // já sanitizado pelo schema
      })
    ).rejects.toThrow('CPF já cadastrado');
  });

  it('deve passar CPF e telefone sanitizados ao Prisma', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: '1' } as any);

    // Schema already strips non-digits, so we pass already-sanitized values
    await createUser({
      name: 'Fulano',
      email: 'fulano@test.com',
      password: 'Senha@123',
      role: 'employee',
      company: 'AVAPEX',
      cpf: '12345678901',   // digits only (schema already ran sanitizeDigits)
      phone: '31999999999', // digits only
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '12345678901',
          phone: '31999999999',
        }),
      })
    );
  });
});

describe('updateUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar senha com hash quando fornecida', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as any);

    await updateUser('1', { password: 'NovaSenha@123' });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data.password).toBeDefined();
    // bcrypt can generate $2a$ or $2b$ prefix depending on version — both are valid
    expect(updateCall.data.password).toMatch(/^\$2[ab]\$/);
  });

  it('não deve atualizar senha se campo vazio', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: '1' } as any);

    await updateUser('1', { name: 'Novo Nome', password: '' });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data.password).toBeUndefined();
  });

  it('deve lançar erro para senha com menos de 6 caracteres', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(
      updateUser('1', { password: '123' })
    ).rejects.toThrow('Senha deve ter no mínimo 6 caracteres');
  });

  it('deve atualizar nome sem afetar senha', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: '1', name: 'Novo Nome' } as any);

    await updateUser('1', { name: 'Novo Nome' });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data.name).toBe('Novo Nome');
    expect(updateCall.data.password).toBeUndefined();
  });

  it('deve atualizar active: false (desativar usuário)', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: '1', active: false } as any);

    await updateUser('1', { active: false });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data.active).toBe(false);
  });
});

import { listUsers } from '@/services/user.service';

describe('listUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve chamar findMany e count', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    await listUsers({ page: 1, limit: 20 });

    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.count).toHaveBeenCalledTimes(1);
  });

  it('deve retornar objeto com data e meta', async () => {
    const mockUsers = [{
      id: 'u1', name: 'Usuário', email: 'u@test.com',
      role: 'employee', company: 'SEDAY', sector: null,
      active: true, createdAt: new Date(),
    }];
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const result = await listUsers({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.pages).toBe(1);
  });

  it('deve calcular skip correto para página 2', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(25);

    await listUsers({ page: 2, limit: 10 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it('deve filtrar por search quando fornecido', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    await listUsers({ page: 1, limit: 20, search: 'Samuel' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it('deve usar where vazio sem filtro de search', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    await listUsers({ page: 1, limit: 20 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('deve calcular pages correto com múltiplas páginas', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(45);

    const result = await listUsers({ page: 1, limit: 10 });
    expect(result.meta.pages).toBe(5);
  });
});
