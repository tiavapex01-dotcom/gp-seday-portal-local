/**
 * @context admin/content/upload/page.tsx
 * @what    Formulário de upload de conteúdo para a Central de Marca
 * @layer   page
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter }             from "next/navigation";
import Link                      from "next/link";
import UploadDropzone            from "@/components/ui/content/UploadDropzone";
import type { ContentType }      from "@/schemas/content.schema";

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "image",     label: "🖼️ Imagem"                    },
  { value: "video",     label: "🎬 Vídeo"                     },
  { value: "document",  label: "📄 Documento"                 },
  { value: "template",  label: "📐 Template"                  },
  { value: "signature", label: "✉️ Assinatura de E-mail"      },
  { value: "social",    label: "📱 Material para Redes Sociais"},
];

const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"] as const;

export default function UploadContentPage() {
  const router = useRouter();

  const [company,     setCompany]     = useState<string>("SEDAY");
  const [categories,  setCategories]  = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [categoryId,  setCategoryId]  = useState<string>("");
  const [type,        setType]        = useState<ContentType>("document");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState("");
  const [featured,    setFeatured]    = useState(false);
  const [published,   setPublished]   = useState(true);
  const [file,        setFile]        = useState<File | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Load categories when company changes
  const loadCategories = useCallback(async (comp: string) => {
    try {
      const res  = await fetch(`/api/content/categories?company=${comp}`);
      const data = await res.json();
      setCategories(data);
      setCategoryId(data[0]?.id ?? "");
    } catch { setCategories([]); }
  }, []);

  useState(() => { loadCategories(company); });

  const handleCompanyChange = (comp: string) => {
    setCompany(comp);
    loadCategories(comp);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file)       return setError("Selecione um arquivo.");
    if (!title.trim()) return setError("Título é obrigatório.");
    if (!categoryId)  return setError("Selecione uma categoria.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify({
        title: title.trim(), description: description.trim() || undefined,
        type, company, categoryId, tags, featured, published,
      }));

      const res = await fetch("/api/content", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erro ao fazer upload");
      }

      router.push("/admin/content");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📤 Novo Conteúdo</h1>
        <Link href="/admin/content"
          className="text-sm text-gray-500 hover:underline">
          ← Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Empresa */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select value={company} onChange={(e) => handleCompanyChange(e.target.value)}
              className={inputClass}>
              {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}>
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de conteúdo *</label>
          <select value={type} onChange={(e) => setType(e.target.value as ContentType)}
            className={inputClass}>
            {CONTENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Logo AVAPEX — versão horizontal fundo branco"
            className={inputClass} />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} placeholder="Descreva o conteúdo e quando usar..."
            className={inputClass} />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2">
            <input type="text" value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Digite uma tag e pressione Enter"
              className={`${inputClass} flex-1`} />
            <button type="button" onClick={addTag}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
              + Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <button key={tag} type="button" onClick={() => removeTag(tag)}
                  className="inline-flex items-center gap-1 text-xs bg-[#1a3a6b] text-white px-2 py-0.5 rounded-full hover:bg-red-500 transition-colors">
                  #{tag} ×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arquivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
          <UploadDropzone contentType={type} onFileSelected={setFile} />
        </div>

        {/* Opções */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
              className="rounded" />
            <span className="text-sm text-gray-700">⭐ Destacar no topo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
              className="rounded" />
            <span className="text-sm text-gray-700">✅ Publicar imediatamente</span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/content"
            className="flex-1 text-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 px-4 py-2.5 text-sm font-medium transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 text-sm">
            {loading ? "Publicando..." : "📤 Publicar Conteúdo"}
          </button>
        </div>
      </form>
    </div>
  );
}
