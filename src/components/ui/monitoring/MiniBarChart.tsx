/**
 * @context MiniBarChart.tsx
 * @what    Timeline de barras verticais para atividade recente (últimos 7 dias)
 * @purpose Exibir volume de uploads por dia na página de monitoramento
 * @depends formatDateShort (utils)
 * @usedby  admin/monitoring/page.tsx
 * @rules   CSS puro, sem biblioteca externa. Barras verticais com tooltip via group/peer.
 * @layer   component
 */
import { formatDateShort } from "@/lib/utils";

interface DayBar {
  date:  string; // ISO date string
  count: number;
  size:  number; // bytes
}

interface MiniBarChartProps {
  data: DayBar[];
}

export default function MiniBarChart({ data }: MiniBarChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Sem uploads nos últimos 7 dias
      </p>
    );
  }

  return (
    <div className="flex items-end justify-between gap-1 h-28">
      {data.map((day) => {
        const pct   = Math.round((day.count / maxCount) * 100);
        const label = formatDateShort(new Date(day.date));
        return (
          <div key={day.date} className="relative flex-1 flex flex-col items-center group">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                {day.count} upload{day.count !== 1 ? "s" : ""}
              </div>
              <div className="w-2 h-2 bg-gray-800 rotate-45 -mt-1" />
            </div>

            {/* Bar */}
            <div className="w-full flex items-end justify-center" style={{ height: "88px" }}>
              <div
                className="w-full bg-[#1a3a6b] group-hover:bg-[#2554a0] rounded-t-sm transition-all duration-300"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>

            {/* Label */}
            <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
