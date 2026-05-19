/**
 * @context test/lib/prisma-errors.test.ts
 * @what    Unit tests for src/lib/prisma-errors.ts
 * @covers  handlePrismaError — P2002, P2025, P2003, default code, non-Prisma error
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from '@/lib/prisma-errors';

// Helper to build PrismaClientKnownRequestError
function makePrismaError(code: string, meta: Record<string, unknown> = {}) {
  return new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: '5.22.0',
    meta,
  });
}

describe('handlePrismaError', () => {
  describe('P2002 — unique constraint violation', () => {
    it('deve lançar erro com campo duplicado quando target é array de strings', () => {
      const e = makePrismaError('P2002', { target: ['email'] });
      expect(() => handlePrismaError(e)).toThrow('email já está em uso');
    });

    it('deve incluir múltiplos campos no erro (cpf, email)', () => {
      const e = makePrismaError('P2002', { target: ['email', 'cpf'] });
      expect(() => handlePrismaError(e)).toThrow('email, cpf já está em uso');
    });

    it('deve usar "campo" como fallback quando meta.target está ausente', () => {
      const e = makePrismaError('P2002', {}); // no target
      expect(() => handlePrismaError(e)).toThrow('campo já está em uso');
    });
  });

  describe('P2025 — record not found', () => {
    it('deve lançar erro "Registro não encontrado"', () => {
      const e = makePrismaError('P2025');
      expect(() => handlePrismaError(e)).toThrow('Registro não encontrado');
    });
  });

  describe('P2003 — foreign key constraint', () => {
    it('deve lançar erro de referência de chave estrangeira', () => {
      const e = makePrismaError('P2003');
      expect(() => handlePrismaError(e)).toThrow('Referência de chave estrangeira inválida');
    });
  });

  describe('código Prisma desconhecido', () => {
    it('deve lançar erro genérico com o código desconhecido', () => {
      const e = makePrismaError('P9999');
      expect(() => handlePrismaError(e)).toThrow('Erro no banco de dados: P9999');
    });
  });

  describe('erros não-Prisma', () => {
    it('deve relançar Error genérico sem modificar a mensagem', () => {
      const genericError = new Error('erro qualquer');
      expect(() => handlePrismaError(genericError)).toThrow('erro qualquer');
    });

    it('deve relançar string como erro (throw e)', () => {
      // handlePrismaError throws e for non-PrismaClientKnownRequestError
      // Vitest catches it correctly
      expect(() => handlePrismaError('erro como string')).toThrow();
    });

    it('deve relançar objetos não-Error', () => {
      expect(() => handlePrismaError({ code: 'UNKNOWN' })).toThrow();
    });

    it('deve relançar TypeError', () => {
      const typeError = new TypeError('Tipo inválido');
      expect(() => handlePrismaError(typeError)).toThrow('Tipo inválido');
    });
  });

  describe('retorno de tipo never', () => {
    it('sempre deve lançar (nunca retornar undefined)', () => {
      const e = makePrismaError('P2002', { target: ['email'] });
      let threw = false;
      try {
        handlePrismaError(e);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });
});
