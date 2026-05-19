/**
 * @context test/schemas/user.schema.test.ts
 * @what    Zod schema validation tests for user.schema.ts
 * @covers  createUserSchema, updateUserSchema
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from '@/schemas/user.schema';

describe('createUserSchema', () => {
  it('deve validar usuário completo', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'samuel@gruposeday.com.br',
      password: 'Senha@123',
      role: 'admin',
      company: 'SEDAY',
    });
    expect(result.success).toBe(true);
  });

  it('deve converter email para lowercase', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'SAMUEL@GRUPOSEDAY.COM.BR',
      password: 'Senha@123',
      role: 'admin',
      company: 'SEDAY',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('samuel@gruposeday.com.br');
    }
  });

  it('deve rejeitar email inválido', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'email-invalido',
      password: 'Senha@123',
      role: 'admin',
      company: 'SEDAY',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar role inválido', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'samuel@gruposeday.com.br',
      password: 'Senha@123',
      role: 'superadmin', // inválido
      company: 'SEDAY',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar empresa inválida', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'samuel@gruposeday.com.br',
      password: 'Senha@123',
      role: 'admin',
      company: 'EMPRESA_INEXISTENTE',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senha com menos de 6 caracteres', () => {
    const result = createUserSchema.safeParse({
      name: 'Samuel',
      email: 'samuel@gruposeday.com.br',
      password: '123',
      role: 'admin',
      company: 'SEDAY',
    });
    expect(result.success).toBe(false);
  });

  it('deve sanitizar CPF (remover pontos e hífen)', () => {
    const result = createUserSchema.safeParse({
      name: 'Fulano',
      email: 'fulano@gruposeday.com.br',
      password: 'Senha@123',
      role: 'employee',
      company: 'AVAPEX',
      cpf: '123.456.789-01',
      phone: '(31) 99999-9999',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cpf).toBe('12345678901');
      expect(result.data.phone).toBe('31999999999');
    }
  });

  it('deve aceitar as 3 empresas válidas', () => {
    for (const company of ['AVAPEX', 'SEDAY', 'INNOMACH'] as const) {
      const result = createUserSchema.safeParse({
        name: 'Teste',
        email: `test@${company.toLowerCase()}.com`,
        password: 'Senha@123',
        role: 'employee',
        company,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateUserSchema', () => {
  it('deve aceitar atualização parcial (apenas nome)', () => {
    const result = updateUserSchema.safeParse({ name: 'Novo Nome' });
    expect(result.success).toBe(true);
  });

  it('deve aceitar password vazio (sem alteração de senha)', () => {
    const result = updateUserSchema.safeParse({ password: '' });
    expect(result.success).toBe(true);
  });

  it('deve aceitar password com 6+ caracteres', () => {
    const result = updateUserSchema.safeParse({ password: 'Senha@123' });
    expect(result.success).toBe(true);
  });

  it('deve aceitar active: false', () => {
    const result = updateUserSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
  });

  it('deve aceitar company válida', () => {
    const result = updateUserSchema.safeParse({ company: 'INNOMACH' });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar company inválida', () => {
    const result = updateUserSchema.safeParse({ company: 'INVALIDA' });
    expect(result.success).toBe(false);
  });

  it('deve aceitar objeto vazio (sem campos obrigatórios)', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
