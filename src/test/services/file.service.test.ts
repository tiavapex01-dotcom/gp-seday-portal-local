/**
 * @context test/services/file.service.test.ts
 * @what    Unit tests for file.service.ts
 * @covers  validateFile — returns string | null (does NOT throw)
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import { validateFile } from '@/services/file.service';

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
    const file = new File(['img'], 'foto.png', { type: 'image/png' });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar imagem JPEG', () => {
    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    expect(validateFile(file)).toBeNull();
  });

  it('deve aceitar imagem WebP', () => {
    const file = new File(['img'], 'foto.webp', { type: 'image/webp' });
    expect(validateFile(file)).toBeNull();
  });

  it('deve rejeitar extensão não permitida (.exe)', () => {
    const file = new File(['content'], 'script.exe', {
      type: 'application/octet-stream',
    });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/não é permitida/);
  });

  it('deve rejeitar arquivo maior que 50MB', () => {
    const bigContent = new Uint8Array(51 * 1024 * 1024);
    const file = new File([bigContent], 'big.pdf', { type: 'application/pdf' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/50/);
  });

  it('deve rejeitar tipo MIME incompatível com extensão', () => {
    // .pdf com tipo image/jpeg
    const file = new File(['content'], 'fake.pdf', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result).toMatch(/não corresponde/);
  });

  it('deve rejeitar arquivo sem extensão', () => {
    const file = new File(['content'], 'semextensao', { type: 'application/pdf' });
    const result = validateFile(file);
    expect(result).not.toBeNull();
  });
});
