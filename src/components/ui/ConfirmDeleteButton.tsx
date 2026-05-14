/**
 * @context ConfirmDeleteButton.tsx
 * @what    Two-step delete button: first click asks to confirm, second executes
 * @purpose Shared confirm-delete UX used in FileCard and CommunicationCard
 * @depends Nothing (pure UI, caller owns the async handler)
 * @usedby  FileCard, CommunicationCard
 * @rules   Do NOT add fetch calls here — keep state-only; caller passes onDelete
 * @layer   component
 */
"use client";

import { useState } from "react";

interface ConfirmDeleteButtonProps {
  onDelete: () => Promise<void>;
  label?: string;
}

export default function ConfirmDeleteButton({
  onDelete,
  label = "🗑️ Excluir",
}: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onDelete();
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-medium disabled:opacity-60"
        >
          {loading ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-200 transition-colors"
    >
      {label}
    </button>
  );
}
