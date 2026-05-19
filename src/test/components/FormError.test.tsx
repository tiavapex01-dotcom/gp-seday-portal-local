/**
 * @context test/components/FormError.test.tsx
 * @what    Unit tests for FormError UI component
 * @covers  rendering with message, null when falsy
 * @layer   test
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// Real export is default, not named
import FormError from '@/components/ui/FormError';

describe('FormError', () => {
  it('deve exibir mensagem de erro', () => {
    render(<FormError message="Credenciais inválidas" />);
    expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
  });

  it('não deve renderizar nada se mensagem vazia', () => {
    const { container } = render(<FormError message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('deve ter classe de estilo vermelho', () => {
    render(<FormError message="Erro qualquer" />);
    const el = screen.getByText('Erro qualquer');
    expect(el.className).toContain('red');
  });

  it('deve renderizar dentro de um parágrafo <p>', () => {
    render(<FormError message="Mensagem de teste" />);
    const el = screen.getByText('Mensagem de teste');
    expect(el.tagName).toBe('P');
  });
});
