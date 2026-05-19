/**
 * @context test/lib/errors.test.ts
 * @what    Unit tests for src/lib/errors.ts — AppError hierarchy
 * @covers  AppError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '@/lib/errors';

describe('AppError', () => {
  it('deve criar erro com mensagem e status corretos', () => {
    const e = new AppError('Algo deu errado', 500);
    expect(e.message).toBe('Algo deu errado');
    expect(e.status).toBe(500);
  });

  it('deve ter status padrão 500 quando não especificado', () => {
    const e = new AppError('Erro genérico');
    expect(e.status).toBe(500);
  });

  it('deve ser instância de Error', () => {
    const e = new AppError('Erro', 400);
    expect(e).toBeInstanceOf(Error);
  });

  it('deve ter name igual ao nome da classe', () => {
    const e = new AppError('Erro', 400);
    expect(e.name).toBe('AppError');
  });

  it('deve ter stack trace definido', () => {
    const e = new AppError('Erro', 400);
    expect(e.stack).toBeDefined();
  });
});

describe('UnauthorizedError', () => {
  it('deve ter status 401', () => {
    const e = new UnauthorizedError();
    expect(e.status).toBe(401);
  });

  it('deve ter mensagem padrão em português', () => {
    const e = new UnauthorizedError();
    expect(e.message).toBe('Não autenticado');
  });

  it('deve aceitar mensagem customizada', () => {
    const e = new UnauthorizedError('Token expirado');
    expect(e.message).toBe('Token expirado');
    expect(e.status).toBe(401);
  });

  it('deve ser instância de AppError', () => {
    expect(new UnauthorizedError()).toBeInstanceOf(AppError);
  });

  it('deve ter name igual ao nome da classe', () => {
    expect(new UnauthorizedError().name).toBe('UnauthorizedError');
  });
});

describe('ForbiddenError', () => {
  it('deve ter status 403', () => {
    expect(new ForbiddenError().status).toBe(403);
  });

  it('deve ter mensagem padrão', () => {
    expect(new ForbiddenError().message).toBe('Sem permissão');
  });

  it('deve aceitar mensagem customizada', () => {
    const e = new ForbiddenError('Acesso negado para esta empresa');
    expect(e.message).toBe('Acesso negado para esta empresa');
    expect(e.status).toBe(403);
  });

  it('deve ser instância de AppError', () => {
    expect(new ForbiddenError()).toBeInstanceOf(AppError);
  });

  it('deve ter name igual ao nome da classe', () => {
    expect(new ForbiddenError().name).toBe('ForbiddenError');
  });
});

describe('NotFoundError', () => {
  it('deve ter status 404', () => {
    expect(new NotFoundError().status).toBe(404);
  });

  it('deve formatar mensagem com o recurso padrão "Recurso"', () => {
    expect(new NotFoundError().message).toBe('Recurso não encontrado');
  });

  it('deve formatar mensagem com recurso customizado', () => {
    expect(new NotFoundError('Arquivo').message).toBe('Arquivo não encontrado');
  });

  it('deve ser instância de AppError', () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });

  it('deve ter name igual ao nome da classe', () => {
    expect(new NotFoundError().name).toBe('NotFoundError');
  });
});

describe('ConflictError', () => {
  it('deve ter status 409', () => {
    expect(new ConflictError('E-mail duplicado').status).toBe(409);
  });

  it('deve preservar mensagem fornecida', () => {
    expect(new ConflictError('E-mail duplicado').message).toBe('E-mail duplicado');
  });

  it('deve ser instância de AppError', () => {
    expect(new ConflictError('x')).toBeInstanceOf(AppError);
  });

  it('deve ter name igual ao nome da classe', () => {
    expect(new ConflictError('x').name).toBe('ConflictError');
  });
});

describe('ValidationError', () => {
  it('deve ter status 422', () => {
    expect(new ValidationError('Campo inválido').status).toBe(422);
  });

  it('deve preservar mensagem fornecida', () => {
    expect(new ValidationError('Campo inválido').message).toBe('Campo inválido');
  });

  it('deve ser instância de AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError);
  });

  it('deve ter name igual ao nome da classe', () => {
    expect(new ValidationError('x').name).toBe('ValidationError');
  });
});
