/**
 * @context MetricCard.tsx
 * @what    Card genérico com ícone, título, valor principal e subtítulo opcional
 * @purpose Exibir métricas de banco e APIs de forma consistente
 * @depends nada
 * @usedby  admin/monitoring/page.tsx
 * @rules   bg-white rounded-xl border border-gray-200 shadow-sm (design system card)
 * @layer   component
 */

interface MetricCardProps {
  icon:      string;
  title:     string;
  value:     string | number;
  subtitle?: string;
  accent?:   "blue" | "green" | "yellow" | "red" | "purple";
}

const ACCENT_MAP = {
  blue:   "bg-blue-50 text-blue-600",
  green:  "bg-emerald-50 text-emerald-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red:    "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
};

export default function MetricCard({
  icon, title, value, subtitle, accent = "blue",
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${ACCENT_MAP[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
