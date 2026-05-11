"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH", "ALL"];

export default function NewCommunicationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [company, setCompany] = useState(session?.user?.company || "SEDAY");
  const [sector, setSector] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, company, sector: sector || null, pinned }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar comunicado.");
      return;
    }
    router.push("/communications");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Novo Comunicado</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Título do comunicado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Escreva o comunicado aqui..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Todos os setores"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 accent-[#1a3a6b]"
          />
          <span className="text-sm text-gray-700">Fixar no topo do mural</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? "Publicando..." : "Publicar Comunicado"}
        </button>
      </form>
    </div>
  );
}
