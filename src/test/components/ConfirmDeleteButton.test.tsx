/**
 * @context test/components/ConfirmDeleteButton.test.tsx
 * @what    Unit tests for ConfirmDeleteButton UI component
 * @covers  two-click delete flow, label customization, cancel action
 * @layer   test
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Real export is default, not named
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

describe('ConfirmDeleteButton', () => {
  it('deve mostrar botão inicial com label padrão', () => {
    render(<ConfirmDeleteButton onDelete={async () => {}} />);
    // Default label includes "Excluir"
    expect(screen.getByText(/excluir/i)).toBeInTheDocument();
  });

  it('deve pedir confirmação no primeiro clique', () => {
    render(<ConfirmDeleteButton onDelete={async () => {}} />);
    fireEvent.click(screen.getByText(/excluir/i));
    expect(screen.getByText(/confirmar/i)).toBeInTheDocument();
  });

  it('deve chamar onDelete no segundo clique (confirmar)', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmDeleteButton onDelete={onDelete} />);
    fireEvent.click(screen.getByText(/excluir/i));
    fireEvent.click(screen.getByText(/confirmar/i));
    // Wait for async onDelete call
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it('deve cancelar ao clicar em "Cancelar"', () => {
    render(<ConfirmDeleteButton onDelete={async () => {}} />);
    fireEvent.click(screen.getByText(/excluir/i));
    expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/cancelar/i));
    // Should go back to the initial state
    expect(screen.getByText(/excluir/i)).toBeInTheDocument();
  });

  it('deve aceitar label customizado', () => {
    render(<ConfirmDeleteButton onDelete={async () => {}} label="Remover arquivo" />);
    expect(screen.getByText('Remover arquivo')).toBeInTheDocument();
  });

  it('deve exibir "Cancelar" junto com "Confirmar" após primeiro clique', () => {
    render(<ConfirmDeleteButton onDelete={async () => {}} />);
    fireEvent.click(screen.getByText(/excluir/i));
    expect(screen.getByText(/confirmar/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
  });
});
