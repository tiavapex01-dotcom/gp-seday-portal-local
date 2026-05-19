/**
 * @context components/ui/content/ContentTypeIcon.tsx
 * @what    Ícone visual com cor por tipo de conteúdo
 * @purpose Identificação visual rápida do tipo de arquivo na Central de Conteúdo
 * @depends nada (puro JSX)
 * @usedby  ContentCard.tsx
 * @rules   CSS/Tailwind puro, sem bibliotecas de ícones externas
 * @layer   component
 */
import type { ContentType } from "@/schemas/content.schema";

interface ContentTypeIconProps {
  type:      ContentType;
  mimeType?: string;
  size?:     "sm" | "md" | "lg";
}

const TYPE_CONFIG: Record<ContentType, { emoji: string; bg: string; text: string; label: string }> = {
  image:     { emoji: "🖼️", bg: "bg-blue-100",   text: "text-blue-700",   label: "Imagem"    },
  video:     { emoji: "🎬", bg: "bg-purple-100", text: "text-purple-700", label: "Vídeo"     },
  document:  { emoji: "📄", bg: "bg-gray-100",   text: "text-gray-700",   label: "Documento" },
  template:  { emoji: "📐", bg: "bg-emerald-100",text: "text-emerald-700",label: "Template"  },
  signature: { emoji: "✉️", bg: "bg-indigo-100", text: "text-indigo-700", label: "Assinatura"},
  social:    { emoji: "📱", bg: "bg-pink-100",   text: "text-pink-700",   label: "Social"    },
};

const SIZE_MAP = {
  sm: "w-8 h-8 text-base",
  md: "w-10 h-10 text-xl",
  lg: "w-14 h-14 text-3xl",
};

export default function ContentTypeIcon({ type, size = "md" }: ContentTypeIconProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.document;
  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${SIZE_MAP[size]}`}
      title={config.label}
    >
      <span>{config.emoji}</span>
    </div>
  );
}

export function ContentTypeBadge({ type }: { type: ContentType }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.document;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
      {config.emoji} {config.label}
    </span>
  );
}

export { TYPE_CONFIG };
