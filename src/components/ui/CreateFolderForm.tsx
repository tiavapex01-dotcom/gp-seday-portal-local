"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateFolderFormProps {
  parentId: string;
  parentName: string;
}

export default function CreateFolderForm({ parentId, parentName }: CreateFolderFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), parentId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar pasta.");
      return;
    }

    setName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[#1a3a6b] hover:text-[#2554a0] font-medium"
      >
        <span className="text-lg leading-none">+</span> Nova subpasta em "{parentName}"
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="text-base">📁</span>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da subpasta"
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] w-52"
        maxLength={60}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-[#1a3a6b] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#2554a0] disabled:opacity-60"
      >
        {loading ? "..." : "Criar"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError(""); setName(""); }}
        className="text-sm text-gray-500 hover:text-gray-700 px-2"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
