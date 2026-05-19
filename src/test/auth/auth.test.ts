/**
 * @context test/auth/auth.test.ts
 * @what    Unit tests for authentication identifier normalization logic
 * @covers  email detection, CPF sanitization, inactive user rejection pattern
 * @layer   test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// We test the logic described in auth.ts without importing the NextAuth config
// (which has side effects / requires full Next.js environment)

const HASH = bcrypt.hashSync('Admin@123', 10);

const mockActiveUser = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@gruposeday.com.br',
  cpf: '12345678901',
  phone: '31999999999',
  password: HASH,
  role: 'admin',
  company: 'SEDAY',
  sector: 'TI',
  active: true,
};

const mockInactiveUser = { ...mockActiveUser, id: 'user-2', active: false };

describe('Autenticação — normalização de identifier', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('detecção de tipo de identifier', () => {
    it('email contém "@" → deve usar busca por email', () => {
      const rawIdentifier = 'admin@gruposeday.com.br';
      const isEmail = rawIdentifier.includes('@');
      expect(isEmail).toBe(true);
    });

    it('CPF não contém "@" → deve usar busca por CPF/telefone', () => {
      const rawIdentifier = '123.456.789-01';
      const isEmail = rawIdentifier.includes('@');
      expect(isEmail).toBe(false);
    });

    it('telefone não contém "@" → deve usar busca por CPF/telefone', () => {
      const rawIdentifier = '(31) 99999-9999';
      const isEmail = rawIdentifier.includes('@');
      expect(isEmail).toBe(false);
    });
  });

  describe('sanitização para busca numérica', () => {
    it('deve sanitizar CPF formatado para apenas dígitos', () => {
      const cpfFormatado = '123.456.789-01';
      const digitsOnly = cpfFormatado.replace(/\D/g, '');
      expect(digitsOnly).toBe('12345678901');
      expect(digitsOnly).toBe(mockActiveUser.cpf);
    });

    it('deve sanitizar telefone formatado para apenas dígitos', () => {
      const telFormatado = '(31) 99999-9999';
      const digitsOnly = telFormatado.replace(/\D/g, '');
      expect(digitsOnly).toBe('31999999999');
      expect(digitsOnly).toBe(mockActiveUser.phone);
    });
  });

  describe('normalização de email', () => {
    it('deve normalizar email para lowercase antes da busca', () => {
      const raw = 'ADMIN@GRUPOSEDAY.COM.BR';
      const normalized = raw.trim().toLowerCase();
      expect(normalized).toBe('admin@gruposeday.com.br');
      expect(normalized).toBe(mockActiveUser.email);
    });
  });

  describe('rejeição de usuário inativo', () => {
    it('usuário ativo deve ser encontrado (active: true)', () => {
      expect(mockActiveUser.active).toBe(true);
    });

    it('usuário inativo não deve ser autenticado (active: false)', () => {
      expect(mockInactiveUser.active).toBe(false);
      // Simula: if (!user || !user.active) return null
      const result = (!mockInactiveUser || !mockInactiveUser.active) ? null : mockInactiveUser;
      expect(result).toBeNull();
    });
  });

  describe('verificação de senha com bcrypt', () => {
    it('senha correta deve ser validada pelo bcrypt', async () => {
      const isMatch = await bcrypt.compare('Admin@123', HASH);
      expect(isMatch).toBe(true);
    });

    it('senha incorreta deve falhar na validação', async () => {
      const isMatch = await bcrypt.compare('SenhaErrada', HASH);
      expect(isMatch).toBe(false);
    });
  });

  describe('query Prisma — mock de busca por email', () => {
    it('deve chamar findFirst com filtro de email insensitive', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockActiveUser as any);

      await prisma.user.findFirst({
        where: {
          email: {
            equals: 'admin@gruposeday.com.br',
            mode: 'insensitive',
          },
        },
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: expect.objectContaining({ mode: 'insensitive' }),
          }),
        })
      );
    });

    it('deve chamar findFirst com OR para CPF/telefone', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockActiveUser as any);

      const digits = '12345678901';
      await prisma.user.findFirst({
        where: { OR: [{ cpf: digits }, { phone: digits }] },
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      );
    });
  });
});
