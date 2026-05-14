/**
 * @context communications/new/page.tsx
 * @what    Form page to create a new communication (manager/admin only)
 * @purpose Allow managers/admins to publish a communication to the board
 * @depends /api/communications POST, FormError, permissions constants
 * @usedby  CommunicationsPage ("+ Novo Comunicado" link)
 * @rules   Manager can only post for their own company; admin can post for any company
 * @layer   page
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FormError from "@/components/ui/FormError";
import { COMPANIES_ALL } from "@/lib/permissions";

const SECTORS = [
  "Manutenção", "Administrativo", "RH", "Financeiro", "Diretoria",
  "Segurança do Trabalho", "Suprimentos/Almoxarifado", "Planejamento", "TI",
];

export default function NewCommunicationPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title,        setTitle]        = useState("");
  const [content,      setContent]      = useState("");
  const [company,      setCompany]      = useState(session?.user?.company || "SEDAY");
  const [sector,       setSector]       = useState("");
  const [pinned,       setPinned]       = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sector) { setError("Selecione o setor."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/communications", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title, content, company, sector, pinned,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar comunicado.");
      return;
    }
    router.push("/communications");
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Novo Comunicado</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} placeholder="Título do comunicado" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
          <textarea required value={content} onChange={(e) => setContent(e.target.value)}
            rows={6} className={`${inputCls} resize-none`} placeholder="Escreva o comunicado aqui..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls}>
              {COMPANIES_ALL.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor *</label>
            <select required value={sector} onChange={(e) => setSector(e.target.value)} className={inputCls}>
              <option value="" disabled>Selecione...</option>
              {SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
          <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            Contato do responsável <span className="font-normal normal-case">(opcional)</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className={inputCls} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                className={inputCls} placeholder="responsavel@empresa.com" />
            </div>
          </div>
        </fieldset>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 accent-[#1a3a6b]" />
          <span className="text-sm text-gray-700">Fixar no topo do mural</span>
        </label>

        <FormError message={error} />

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {loading ? "Publicando..." : "Publicar Comunicado"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
