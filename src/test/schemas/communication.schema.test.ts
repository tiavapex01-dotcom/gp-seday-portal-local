/**
 * @context test/schemas/communication.schema.test.ts
 * @what    Zod schema validation tests for communication.schema.ts
 * @covers  createCommunicationSchema, updateCommunicationSchema
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import {
  createCommunicationSchema,
  updateCommunicationSchema,
} from '@/schemas/communication.schema';

describe('createCommunicationSchema', () => {
  // sector is REQUIRED in the real schema
  const validPayload = {
    title: 'Comunicado Importante',
    content: 'Conteúdo do comunicado',
    company: 'SEDAY',
    sector: 'TI',
    pinned: false,
  };

  it('deve validar comunicado válido', () => {
    const result = createCommunicationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar título vazio', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar conteúdo vazio', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar empresa inválida', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      company: 'EMPRESA_ERRADA',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar setor vazio', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      sector: '',
    });
    expect(result.success).toBe(false);
  });

  it('deve aceitar empresa "ALL"', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      company: 'ALL',
    });
    expect(result.success).toBe(true);
  });

  it('deve aplicar default false para pinned quando ausente', () => {
    const result = createCommunicationSchema.safeParse({
      title: 'Teste',
      content: 'Conteúdo',
      company: 'AVAPEX',
      sector: 'RH',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pinned).toBe(false);
    }
  });

  it('deve aceitar contactEmail válido', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      contactEmail: 'contato@seday.com.br',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar contactEmail inválido', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      contactEmail: 'nao-e-email',
    });
    expect(result.success).toBe(false);
  });

  it('deve transformar contactEmail vazio em null', () => {
    const result = createCommunicationSchema.safeParse({
      ...validPayload,
      contactEmail: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contactEmail).toBeNull();
    }
  });
});

describe('updateCommunicationSchema', () => {
  it('deve aceitar apenas pinned', () => {
    const result = updateCommunicationSchema.safeParse({ pinned: true });
    expect(result.success).toBe(true);
  });

  it('deve aceitar apenas published', () => {
    const result = updateCommunicationSchema.safeParse({ published: false });
    expect(result.success).toBe(true);
  });

  it('deve aceitar ambos os campos', () => {
    const result = updateCommunicationSchema.safeParse({
      pinned: false,
      published: true,
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar objeto vazio (refine exige ao menos um campo)', () => {
    const result = updateCommunicationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
