/**
 * @context BarChart.tsx
 * @what    Gráfico de barras horizontais em CSS puro (sem biblioteca externa)
 * @purpose Visualizar distribuições (usuários por empresa, por role) na página de monitoramento
 * @depends nada
 * @usedby  admin/monitoring/page.tsx
 * @rules   Sem recharts, Chart.js ou similar. CSS/Tailwind puro.
 * @layer   component
 */

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items:    BarItem[];
  unit?:    string;
  maxValue?: number;
}

const DEFAULT_COLORS = [
  "bg-[#1a3a6b]",
  "bg-[#2554a0]",
  "bg-blue-400",
  "bg-emerald-500",
  "bg-yellow-400",
  "bg-purple-500",
  "bg-red-400",
];

export default function BarChart({ items, unit = "", maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct   = Math.round((item.value / max) * 100);
        const color = item.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-24 text-xs text-gray-600 truncate text-right flex-shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-xs font-semibold text-gray-700 text-right flex-shrink-0">
              {item.value}{unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
