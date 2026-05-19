/**
 * @context components/ui/content/TagBadge.tsx
 * @what    Badge de tag clicável para filtrar conteúdo por tag
 * @purpose Permitir filtragem visual por tag na Central de Conteúdo
 * @depends nada
 * @usedby  ContentCard.tsx, /content page
 * @rules   Design system: rounded-full, text-xs
 * @layer   component
 */
"use client";

interface TagBadgeProps {
  tag:       string;
  onClick?:  (tag: string) => void;
  active?:   boolean;
}

export default function TagBadge({ tag, onClick, active = false }: TagBadgeProps) {
  const base    = "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full transition-colors";
  const variant = active
    ? "bg-[#1a3a6b] text-white"
    : onClick
      ? "bg-gray-100 text-gray-600 hover:bg-[#1a3a6b] hover:text-white cursor-pointer"
      : "bg-gray-100 text-gray-600";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(tag)}
        className={`${base} ${variant}`}
      >
        #{tag}
      </button>
    );
  }

  return <span className={`${base} ${variant}`}>#{tag}</span>;
}
