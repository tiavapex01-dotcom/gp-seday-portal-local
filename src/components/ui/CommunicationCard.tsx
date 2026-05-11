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
    contactPhone: string | null;
    contactEmail: string | null;
    pinned: boolean;
    createdAt: Date | string;
    createdBy: { name: string };
  };
  canManage: boolean;
}

const SECTOR_COLORS: Record<string, string> = {
  "RH":                      "bg-blue-100 text-blue-700",
  "Financeiro":               "bg-emerald-100 text-emerald-700",
  "Manutenção":               "bg-orange-100 text-orange-700",
  "Administrativo":           "bg-purple-100 text-purple-700",
  "Diretoria":                "bg-red-100 text-red-700",
  "Segurança do Trabalho":    "bg-yellow-100 text-yellow-700",
  "Suprimentos/Almoxarifado": "bg-teal-100 text-teal-700",
  "Planejamento":             "bg-indigo-100 text-indigo-700",
  "TI":                       "bg-sky-100 text-sky-700",
};

export default function CommunicationCard({ item, canManage }: CommunicationCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [pinning,       setPinning]       = useState(false);
  const [pinned,        setPinned]        = useState(item.pinned);

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
    if (res.ok) { setPinned((p) => !p); router.refresh(); }
    setPinning(false);
  }

  const sectorColor = item.sector ? (SECTOR_COLORS[item.sector] ?? "bg-gray-100 text-gray-600") : "";

  return (
    <article className={`bg-white rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
      pinned ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Corpo */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {pinned && (
              <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                📌 Fixado
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">
              {item.company}
            </span>
            {item.sector && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sectorColor}`}>
                {item.sector}
              </span>
            )}
          </div>

          {/* Título */}
          <h2 className="font-semibold text-gray-800 text-base mb-1">{item.title}</h2>

          {/* Conteúdo */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>

          {/* Contato */}
          {(item.contactPhone || item.contactEmail) && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
              <span className="font-medium text-gray-600">Contato:</span>
              {item.contactPhone && (
                <a href={`tel:${item.contactPhone}`}
                  className="flex items-center gap-1 hover:text-[#1a3a6b] transition-colors">
                  📞 {item.contactPhone}
                </a>
              )}
              {item.contactEmail && (
                <a href={`mailto:${item.contactEmail}`}
                  className="flex items-center gap-1 hover:text-[#1a3a6b] transition-colors">
                  ✉️ {item.contactEmail}
                </a>
              )}
            </div>
          )}

          {/* Rodapé */}
          <p className="text-xs text-gray-400 mt-3">
            {item.createdBy.name} ·{" "}
            {new Date(item.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </div>

        {/* Ações */}
        {canManage && (
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button onClick={handleTogglePin} disabled={pinning}
              title={pinned ? "Desafixar" : "Fixar no topo"}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                pinned
                  ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                  : "border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-600"
              }`}>
              {pinning ? "..." : pinned ? "📌 Desafixar" : "📌 Fixar"}
            </button>

            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button onClick={handleDelete} disabled={deleting}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-medium disabled:opacity-60">
                  {deleting ? "..." : "Confirmar"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={handleDelete}
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-200 transition-colors">
                🗑️ Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
