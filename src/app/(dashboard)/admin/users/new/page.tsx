"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["employee", "manager", "admin"];
const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"];

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    company: "SEDAY",
    sector: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sector: form.sector || null }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar usuário.");
      return;
    }
    router.push("/admin");
  }

  const field = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Novo Usuário</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <FormField label="Nome completo *">
          <input type="text" required className={field} value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </FormField>
        <FormField label="E-mail *">
          <input type="email" required className={field} value={form.email} onChange={(e) => onChange("email", e.target.value)} />
        </FormField>
        <FormField label="Senha inicial *">
          <input type="password" required minLength={6} className={field} value={form.password} onChange={(e) => onChange("password", e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Papel *">
            <select className={field} value={form.role} onChange={(e) => onChange("role", e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Empresa *">
            <select className={field} value={form.company} onChange={(e) => onChange("company", e.target.value)}>
              {COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Setor (opcional)">
          <input type="text" className={field} value={form.sector} onChange={(e) => onChange("sector", e.target.value)} placeholder="ex: Comercial" />
        </FormField>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar Usuário"}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
