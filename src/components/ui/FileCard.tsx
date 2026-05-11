"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    description: string | null;
    uploadedBy: { id: string; name: string };
    createdAt: Date | string;
  };
  canDelete: boolean;
}

function getFileIcon(mime: string) {
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("word")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  return "📎";
}

export default function FileCard({ file, canDelete }: FileCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Rota autenticada — não expõe o caminho físico
  const downloadUrl = `/api/files/download/${file.id}`;

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      setConfirmDelete(false);
      alert("Erro ao excluir arquivo.");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3">
      {/* Link de download autenticado */}
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 flex-1 min-w-0"
      >
        <span className="text-2xl shrink-0">{getFileIcon(file.mimeType)}</span>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
          {file.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{file.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {(file.size / 1024).toFixed(0)} KB · {file.uploadedBy.name} ·{" "}
            {new Date(file.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </a>

      {canDelete && (
        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-medium disabled:opacity-60"
              >
                {deleting ? "..." : "Confirmar"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
              title="Excluir arquivo"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}
