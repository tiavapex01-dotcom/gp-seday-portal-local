"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormSubmit } from "@/hooks/useFormSubmit";

export default function CreateSectorButton({ company }: { company: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const router          = useRouter();

  const { submit, loading, error, setError } = useFormSubmit(
    async () => {
      const res  = await fetch("/api/folders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), company, isRoot: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar setor");
    },
    () => {
      handleClose();
      router.refresh();
    }
  );

  function handleClose() {
    setOpen(false);
    setName("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await submit();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-1 text-xs text-[#2554a0] hover:text-[#1a3a6b] flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
      >
        <span>+</span> Novo Setor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 mb-4">Novo Setor</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Nome do setor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-1.5 bg-[#1a3a6b] text-white text-sm rounded-lg hover:bg-[#2554a0] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
