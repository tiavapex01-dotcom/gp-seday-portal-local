/**
 * @context components/ui/content/UploadDropzone.tsx
 * @what    Área de drag-and-drop para upload de conteúdo da Central de Marca
 * @purpose Facilitar seleção de arquivo com preview e validação frontend
 * @depends nada (puro React/DOM)
 * @usedby  /admin/content/upload/page.tsx
 * @rules   Validação de tipo/tamanho no frontend (dupla validação com service)
 *          Sem upload direto ao Supabase — o form submete para a API route
 * @layer   component
 */
"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { formatFileSize } from "@/lib/utils";
import type { ContentType } from "@/schemas/content.schema";

// Accepted extensions per content type
const ACCEPT_MAP: Record<ContentType, string> = {
  image:     ".jpg,.jpeg,.png,.webp,.gif,.svg",
  video:     ".mp4,.mov,.avi,.webm",
  document:  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  template:  ".pdf,.ppt,.pptx,.doc,.docx,.ai,.psd",
  signature: ".html,.png,.jpg,.jpeg",
  social:    ".jpg,.jpeg,.png,.mp4,.gif",
};

const MAX_SIZE_MAP: Record<ContentType, number> = {
  image:     50,
  video:     500,
  document:  100,
  template:  100,
  signature: 10,
  social:    100,
};

interface UploadDropzoneProps {
  contentType:    ContentType;
  onFileSelected: (file: File | null) => void;
  error?:         string | null;
}

export default function UploadDropzone({
  contentType, onFileSelected, error,
}: UploadDropzoneProps) {
  const [dragOver, setDragOver]   = useState(false);
  const [selected, setSelected]   = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      setSelected(null);
      setPreview(null);
      setFileError(null);
      onFileSelected(null);
      return;
    }

    const maxMB = MAX_SIZE_MAP[contentType] ?? 100;
    if (file.size > maxMB * 1024 * 1024) {
      setFileError(`Arquivo excede ${maxMB} MB.`);
      return;
    }

    setFileError(null);
    setSelected(file);
    onFileSelected(file);

    // Image preview
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, [contentType, onFileSelected]);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, [handleFile]);

  const displayError = fileError ?? error;

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[#1a3a6b] bg-blue-50"
            : displayError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-[#2554a0] hover:bg-blue-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[contentType]}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {selected ? (
          <div className="space-y-2">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="mx-auto max-h-32 object-contain rounded-lg" />
            ) : (
              <div className="text-4xl">📎</div>
            )}
            <p className="text-sm font-medium text-gray-800">{selected.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selected.size)}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleFile(null); }}
              className="text-xs text-red-500 hover:underline"
            >
              Remover arquivo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">⬆️</div>
            <p className="text-sm font-medium text-gray-700">
              Arraste o arquivo ou <span className="text-[#1a3a6b] font-semibold">clique para selecionar</span>
            </p>
            <p className="text-xs text-gray-400">
              {ACCEPT_MAP[contentType].split(",").join(" · ")} · máx. {MAX_SIZE_MAP[contentType]} MB
            </p>
          </div>
        )}
      </div>

      {displayError && (
        <p className="text-xs text-red-600">{displayError}</p>
      )}
    </div>
  );
}
