/**
 * @context FolderTree.tsx
 * @what    Recursive folder tree component for the files page sidebar
 * @purpose Render the full folder hierarchy with expand/collapse, active selection, and inline delete
 * @depends FolderNode type (exported), useRouter (for refresh after delete)
 * @usedby  files/page.tsx
 * @rules   Delete requires folder to be empty; root folders (isRoot=true) cannot be deleted
 *          FolderItem has its own confirm-delete state — intentionally NOT using ConfirmDeleteButton
 *          due to isSelected colour variation and stopPropagation requirement
 * @layer   component
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface FolderNode {
  id: string;
  name: string;
  isRoot: boolean;
  parentId: string | null;
  createdById: string | null;
  _count: { files: number; children: number };
}

interface FolderTreeProps {
  folders: FolderNode[];
  selectedId: string | null;
  canManage: boolean;
  currentUserId: string;
  userRole: string;
}

export default function FolderTree({
  folders,
  selectedId,
  canManage,
  currentUserId,
  userRole,
}: FolderTreeProps) {
  const roots = folders.filter((f) => f.parentId === null);

  return (
    <nav className="space-y-0.5">
      {roots.map((root) => (
        <FolderItem
          key={root.id}
          folder={root}
          folders={folders}
          selectedId={selectedId}
          canManage={canManage}
          currentUserId={currentUserId}
          userRole={userRole}
          depth={0}
        />
      ))}
    </nav>
  );
}

function FolderItem({
  folder,
  folders,
  selectedId,
  canManage,
  currentUserId,
  userRole,
  depth,
}: {
  folder: FolderNode;
  folders: FolderNode[];
  selectedId: string | null;
  canManage: boolean;
  currentUserId: string;
  userRole: string;
  depth: number;
}) {
  const router = useRouter();
  const children = folders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === folder.id;

  const [open, setOpen] = useState(
    // abre automaticamente se contém a pasta selecionada
    isSelected || children.some((c) => c.id === selectedId)
  );
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canDelete =
    canManage &&
    !folder.isRoot &&
    folder._count.files === 0 &&
    folder._count.children === 0 &&
    (userRole === "admin" || folder.createdById === currentUserId);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir pasta.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center rounded-lg text-sm transition-colors ${
          isSelected
            ? "bg-[#1a3a6b] text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Botão expandir/recolher */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-5 h-5 flex items-center justify-center shrink-0 text-xs ${
            isSelected ? "text-white/70" : "text-gray-400"
          }`}
        >
          {hasChildren ? (open ? "▾" : "▸") : ""}
        </button>

        {/* Link da pasta */}
        <Link
          href={`/files?pasta=${folder.id}`}
          className="flex-1 flex items-center gap-1.5 py-2 pr-1 min-w-0"
        >
          <span>{folder.isRoot ? "📂" : "📁"}</span>
          <span className="truncate font-medium">{folder.name}</span>
          <span className={`text-xs ml-auto shrink-0 ${isSelected ? "text-white/60" : "text-gray-400"}`}>
            {folder._count.files > 0 ? folder._count.files : ""}
          </span>
        </Link>

        {/* Botão deletar */}
        {canDelete && (
          <div className="shrink-0 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {confirmDelete ? (
              <div className="flex gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium"
                >
                  {deleting ? "..." : "OK"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                title="Excluir pasta vazia"
                className={`text-xs px-1 py-0.5 rounded hover:bg-red-100 hover:text-red-600 ${
                  isSelected ? "text-white/60 hover:bg-red-500 hover:text-white" : "text-gray-400"
                }`}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subpastas */}
      {open && hasChildren && (
        <div>
          {children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              folders={folders}
              selectedId={selectedId}
              canManage={canManage}
              currentUserId={currentUserId}
              userRole={userRole}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
