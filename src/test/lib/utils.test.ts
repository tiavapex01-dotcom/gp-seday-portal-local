/**
 * @context test/lib/utils.test.ts
 * @what    Unit tests for src/lib/utils.ts pure functions
 * @covers  formatFileSize, formatDate, formatDateShort, sanitizeDigits, truncate
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  formatDate,
  formatDateShort,
  sanitizeDigits,
  truncate,
} from '@/lib/utils';

describe('formatFileSize', () => {
  it('deve formatar bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });
  it('deve formatar 1 KB (1024 bytes → toFixed(0) → "1 KB")', () => {
    // Real implementation: toFixed(0) for KB, so 1024 → "1 KB" (not "1.0 KB")
    expect(formatFileSize(1024)).toBe('1 KB');
  });
  it('deve formatar 1.5 KB', () => {
    expect(formatFileSize(1536)).toBe('2 KB'); // Math.round via toFixed(0)
  });
  it('deve formatar 1.0 MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });
  it('deve formatar 1.5 MB', () => {
    expect(formatFileSize(1572864)).toBe('1.5 MB');
  });
  it('deve formatar 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
  it('deve formatar 1023 bytes como B', () => {
    expect(formatFileSize(1023)).toBe('1023 B');
  });
});

describe('sanitizeDigits', () => {
  it('deve remover pontos e hífens do CPF', () => {
    expect(sanitizeDigits('123.456.789-01')).toBe('12345678901');
  });
  it('deve remover parênteses, espaços e hífens do telefone', () => {
    expect(sanitizeDigits('(31) 99999-9999')).toBe('31999999999');
  });
  it('deve retornar string vazia para string vazia', () => {
    expect(sanitizeDigits('')).toBe('');
  });
  it('deve manter apenas dígitos', () => {
    expect(sanitizeDigits('abc123def456')).toBe('123456');
  });
  it('deve retornar string vazia para texto sem dígitos', () => {
    expect(sanitizeDigits('abc')).toBe('');
  });
});

describe('truncate', () => {
  it('deve truncar string longa com reticências (…)', () => {
    // Real implementation uses '…' (U+2026), not '...'
    expect(truncate('String muito longa aqui', 10)).toBe('String mui…');
  });
  it('não deve truncar string com exatamente max caracteres', () => {
    expect(truncate('Exatamente', 10)).toBe('Exatamente');
  });
  it('não deve truncar string curta', () => {
    expect(truncate('Curta', 10)).toBe('Curta');
  });
  it('deve truncar para 0 caracteres', () => {
    expect(truncate('Teste', 0)).toBe('…');
  });
});

describe('formatDate', () => {
  it('deve formatar data em pt-BR com mês por extenso', () => {
    // Use a fixed date string to avoid timezone issues
    const date = new Date('2026-05-13T12:00:00.000Z');
    const formatted = formatDate(date);
    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/\d{2}/); // has day digits
  });
  it('deve aceitar string de data', () => {
    // Use mid-day to avoid UTC-3 rolling over to Dec 31 2025
    const formatted = formatDate('2026-01-15T12:00:00Z');
    expect(formatted).toContain('2026');
  });
});

describe('formatDateShort', () => {
  it('deve formatar data curta em pt-BR (dd/mm/aaaa)', () => {
    const formatted = formatDateShort('2026-12-25T12:00:00Z');
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
