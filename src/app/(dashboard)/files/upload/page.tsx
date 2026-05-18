/**
 * @context files/upload/page.tsx
 * @what    Upload form page — select folder and upload a file to Supabase Storage
 * @purpose Allow managers/admins to add files to a folder in their company
 * @depends /api/files POST (multipart), /api/folders GET, FormError
 * @usedby  Sidebar ("Upload" link), FilesPage ("Novo Arquivo" link)
 * @rules   File is sent as multipart/form-data; validation happens server-side in file.service
 * @layer   page
 */
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FormError from "@/components/ui/FormError";

interface FolderOption {
  id: string;
  name: string;
  isRoot: boolean;
  parentId: string | null;
}

function buildLabel(folder: FolderOption, folders: FolderOption[]): string {
  const parts: string[] = [folder.name];
  let current = folder;
  while (current.parentId) {
    const parent = folders.find((f) => f.id === current.parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  return parts.join(" › ");
}

function UploadContent() {
  const router = useRouter();
  const searchParams   = useSearchParams();
  const preSelectedId  = searchParams.get("pasta") ?? "";

  const [folders,     setFolders]     = useState<FolderOption[]>([]);
  const [folderId,    setFolderId]    = useState(preSelectedId);
  const [file,        setFile]        = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => {
        if (!r.ok) throw new Error(`Erro ao carregar pastas: ${r.status}`);
        return r.json();
      })
      .then((data: FolderOption[]) => {
        setFolders(data);
        if (!preSelectedId && data.length > 0) setFolderId(data[0].id);
      })
      .catch((e: unknown) => {
        console.error("[UploadPage] Falha ao carregar pastas:", e);
        setError("Não foi possível carregar as pastas. Recarregue a página.");
      });
  }, [preSelectedId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !folderId) return;
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folderId", folderId);
    if (description) fd.append("description", description);

    const res = await fetch("/api/files", { method: "POST", body: fd });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao fazer upload.");
      return;
    }
    router.push(`/files?pasta=${folderId}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload de Arquivo</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pasta de destino *</label>
          <select required value={folderId} onChange={(e) => setFolderId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]">
            <option value="" disabled>Selecione uma pasta...</option>
            {folders.filter((f) => f.isRoot).map((root) => {
              const subs = folders.filter((f) => f.parentId === root.id);
              return (
                <optgroup key={root.id} label={`📂 ${root.name}`}>
                  <option value={root.id}>{root.name} (raiz)</option>
                  {subs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;📁 {buildLabel(sub, folders)}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#1a3a6b] file:text-white file:text-xs file:font-medium hover:file:bg-[#2554a0]" />
          <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Imagem, TXT · máx. 50 MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Breve descrição do arquivo..." />
        </div>

        <FormError message={error} />

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !file || !folderId}
            className="flex-1 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar Arquivo"}
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

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
