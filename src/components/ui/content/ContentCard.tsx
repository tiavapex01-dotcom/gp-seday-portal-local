/**
 * @context components/ui/content/ContentCard.tsx
 * @what    Card de conteúdo com preview, metadados, tags e botão de download
 * @purpose Exibir item da Central de Conteúdo de forma visual e atraente
 * @depends ContentTypeIcon, TagBadge, formatFileSize (utils)
 * @usedby  /content page, /admin/content page
 * @rules   Design system card: bg-white rounded-xl border border-gray-200 shadow-sm
 *          Downloads sempre via /api/content/[id]/download — nunca URL direta
 * @layer   component
 */
"use client";

import Link           from "next/link";
import { formatFileSize } from "@/lib/utils";
import ContentTypeIcon, { ContentTypeBadge } from "./ContentTypeIcon";
import TagBadge       from "./TagBadge";
import type { ContentType } from "@/schemas/content.schema";

interface ContentItem {
  id:            string;
  title:         string;
  description?:  string | null;
  type:          ContentType;
  company:       string;
  tags:          string[];
  mimeType:      string;
  size:          number;
  downloadCount: number;
  featured:      boolean;
  thumbnailPath?: string | null;
  category: { name: string; icon?: string | null };
}

interface ContentCardProps {
  content:    ContentItem;
  onTagClick?: (tag: string) => void;
  canManage?: boolean;
  onDelete?:  (id: string) => void;
  onToggleFeatured?:  (id: string, val: boolean) => void;
  onTogglePublished?: (id: string, val: boolean) => void;
}

export default function ContentCard({
  content, onTagClick, canManage, onDelete, onToggleFeatured, onTogglePublished,
}: ContentCardProps) {
  const isImage = content.type === "image";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview area */}
      <div className="relative h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        {content.featured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
            ⭐ Destaque
          </span>
        )}

        {isImage && content.thumbnailPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/content/${content.id}/download`}
            alt={content.title}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <ContentTypeIcon type={content.type} size="lg" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
            {content.title}
          </h3>
          <ContentTypeBadge type={content.type} />
        </div>

        {content.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{content.description}</p>
        )}

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} tag={tag} onClick={onTagClick} />
            ))}
            {content.tags.length > 4 && (
              <span className="text-[10px] text-gray-400">+{content.tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
          <span>{formatFileSize(content.size)}</span>
          <span>·</span>
          <span>⬇️ {content.downloadCount}</span>
          <span className="ml-auto text-[10px]">{content.category.icon} {content.category.name}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={`px-4 pb-4 flex gap-2 ${canManage ? "flex-wrap" : ""}`}>
        <a
          href={`/api/content/${content.id}/download`}
          download
          className="flex-1 text-center bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          ⬇️ Baixar
        </a>

        {canManage && (
          <>
            {onToggleFeatured && (
              <button
                type="button"
                onClick={() => onToggleFeatured(content.id, !content.featured)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors"
                title={content.featured ? "Remover destaque" : "Destacar"}
              >
                {content.featured ? "★" : "☆"}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(content.id)}
                className="text-xs border border-red-200 text-red-600 rounded-lg px-2 py-2 hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                🗑️
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
