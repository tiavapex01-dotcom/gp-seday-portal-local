"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CommunicationCardProps {
  item: {
    id: string;
    title: string;
    content: string;
    company: string;
    sector: string | null;
    pinned: boolean;
    createdAt: Date | string;
    createdBy: { name: string };
  };
  canManage: boolean; // admin ou manager
}

export default function CommunicationCard({ item, canManage }: CommunicationCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinned, setPinned] = useState(item.pinned);

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const res = await fetch(`/api/communications/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir comunicado.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleTogglePin() {
    setPinning(true);
    const res = await fetch(`/api/communications/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    if (res.ok) {
      setPinned((p) => !p);
      router.refresh();
    }
    setPinning(false);
  }

  return (
    <article
      className={`bg-white rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        pinned ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-semibold text-gray-800 text-base">{item.title}</h2>
            {pinned && (
              <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">
                Fixado
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {item.company}
            </span>
            {item.sector && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {item.sector}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
          <p className="text-xs text-gray-400 mt-3">
            {item.createdBy.name} ·{" "}
            {new Date(item.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Ações (admin / manager) */}
        {canManage && (
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Fixar / desafixar */}
            <button
              onClick={handleTogglePin}
              disabled={pinning}
              title={pinned ? "Desafixar" : "Fixar no topo"}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                pinned
                  ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                  : "border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-600"
              }`}
            >
              {pinning ? "..." : pinned ? "📌 Desafixar" : "📌 Fixar"}
            </button>

            {/* Excluir */}
            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-medium disabled:opacity-60"
                >
                  {deleting ? "..." : "Confirmar exclusão"}
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
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-200 transition-colors"
              >
                🗑️ Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
