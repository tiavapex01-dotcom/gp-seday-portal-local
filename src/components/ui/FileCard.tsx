/**
 * @context FileCard.tsx
 * @what    Card component displaying a single file with download link and delete action
 * @purpose Render file metadata with authenticated download and two-step delete
 * @depends ConfirmDeleteButton, utils (formatFileSize, formatDateShort)
 * @usedby  FilesPage
 * @rules   Download URL always goes through /api/files/download/[id] — never a direct storage URL
 * @layer   component
 */
"use client";

import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import { formatFileSize, formatDateShort } from "@/lib/utils";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    description: string | null;
    uploadedBy: { id: string; name: string };
    createdAt: Date | string;
  };
  canDelete: boolean;
}

function getFileIcon(mime: string) {
  if (mime.includes("pdf"))                                    return "📄";
  if (mime.includes("image"))                                  return "🖼️";
  if (mime.includes("word"))                                   return "📝";
  if (mime.includes("sheet") || mime.includes("excel"))        return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  return "📎";
}

export default function FileCard({ file, canDelete }: FileCardProps) {
  const router = useRouter();

  const downloadUrl = `/api/files/download/${file.id}`;

  async function handleDelete() {
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Erro ao excluir arquivo.");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 flex-1 min-w-0"
      >
        <span className="text-2xl shrink-0">{getFileIcon(file.mimeType)}</span>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
          {file.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{file.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatFileSize(file.size)} · {file.uploadedBy.name} · {formatDateShort(file.createdAt)}
          </p>
        </div>
      </a>

      {canDelete && (
        <div className="shrink-0">
          <ConfirmDeleteButton onDelete={handleDelete} label="🗑️" />
        </div>
      )}
    </div>
  );
}
