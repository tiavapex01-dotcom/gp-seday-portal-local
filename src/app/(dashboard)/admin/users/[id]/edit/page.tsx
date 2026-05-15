/**
 * @context admin/users/[id]/edit/page.tsx
 * @what    Edit form for an existing user (admin-only)
 * @purpose Allow admin to change user details, role, company, status, or password
 * @depends /api/users/[id] GET+PATCH, FormError, permissions constants
 * @usedby  AdminPage ("Editar" link in actions column)
 * @rules   Empty password field = no change; deactivate requires two clicks; params is a Promise (Next.js 15)
 * @layer   page
 */
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import FormError from "@/components/ui/FormError";
import { ROLES, COMPANIES } from "@/lib/permissions";

const ROLE_OPTIONS    = Object.values(ROLES);
const COMPANY_OPTIONS = [...COMPANIES];

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  company: string;
  sector: string | null;
  active: boolean;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [form, setForm] = useState<{
    name: string; email: string; cpf: string; phone: string;
    password: string; role: string; company: string; sector: string; active: boolean;
  }>({
    name: "", email: "", cpf: "", phone: "",
    password: "", role: ROLES.EMPLOYEE, company: "SEDAY", sector: "", active: true,
  });
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating,      setDeactivating]      = useState(false);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((u: UserData) => {
        setForm({
          name:     u.name ?? "",
          email:    u.email ?? "",
          cpf:      u.cpf ?? "",
          phone:    u.phone ?? "",
          password: "",
          role:     u.role,
          company:  u.company,
          sector:   u.sector ?? "",
          active:   u.active,
        });
        setLoading(false);
      })
      .catch(() => { setError("Não foi possível carregar o usuário."); setLoading(false); });
  }, [id]);

  function onChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const body: Record<string, unknown> = {
      name:    form.name,
      email:   form.email,
      role:    form.role,
      company: form.company,
      sector:  form.sector || null,
      active:  form.active,
    };
    if (form.cpf.trim())      body.cpf   = form.cpf;
    if (form.phone.trim())    body.phone = form.phone;
    if (form.password.trim()) body.password = form.password;

    const res = await fetch(`/api/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar alterações.");
      return;
    }
    setSuccess("Usuário atualizado com sucesso!");
    setTimeout(() => router.push("/admin"), 1000);
  }

  async function handleDeactivate() {
    if (!confirmDeactivate) { setConfirmDeactivate(true); return; }
    setDeactivating(true);
    const res = await fetch(`/api/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: false }),
    });
    setDeactivating(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao desativar usuário.");
      setConfirmDeactivate(false);
    }
  }

  const field = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

  if (loading) {
    return <p className="text-gray-500 text-sm">Carregando...</p>;
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Usuário</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <FormField label="Nome completo *">
          <input type="text" required className={field} value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </FormField>
        <FormField label="E-mail *">
          <input type="email" required className={field} value={form.email} onChange={(e) => onChange("email", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="CPF">
            <input type="text" className={field} value={form.cpf} onChange={(e) => onChange("cpf", e.target.value)} placeholder="000.000.000-00" />
          </FormField>
          <FormField label="Telefone">
            <input type="text" className={field} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="(00) 00000-0000" />
          </FormField>
        </div>
        <FormField label="Nova senha">
          <input type="password" minLength={6} className={field} value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="Deixe em branco para não alterar" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Papel *">
            <select className={field} value={form.role} onChange={(e) => onChange("role", e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Empresa *">
            <select className={field} value={form.company} onChange={(e) => onChange("company", e.target.value)}>
              {COMPANY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Setor">
          <input type="text" className={field} value={form.sector} onChange={(e) => onChange("sector", e.target.value)} placeholder="ex: Comercial" />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={(e) => onChange("active", e.target.checked)}
            className="w-4 h-4 accent-[#1a3a6b]"
          />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">Usuário ativo</label>
        </div>

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
        )}
        <FormError message={error} />

        <button type="submit" disabled={saving}
          className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>

      {/* Desativar usuário */}
      {form.active && (
        <div className="mt-4">
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
              confirmDeactivate
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
            }`}
          >
            {deactivating
              ? "Desativando..."
              : confirmDeactivate
              ? "Confirmar desativação"
              : "Desativar usuário"}
          </button>
          {confirmDeactivate && (
            <button
              onClick={() => setConfirmDeactivate(false)}
              className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
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
