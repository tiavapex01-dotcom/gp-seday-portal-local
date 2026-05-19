/**
 * @context StorageBar.tsx
 * @what    Barra de progresso de uso de storage com cor dinâmica
 * @purpose Exibir uso de armazenamento de forma visual na página de monitoramento
 * @depends formatFileSize (utils)
 * @usedby  admin/monitoring/page.tsx
 * @rules   Segue design system: rounded-xl, text-sm, cores semânticas verde/amarelo/vermelho
 * @layer   component
 */
import { formatFileSize } from "@/lib/utils";

interface StorageBarProps {
  usedBytes:    number;
  limitBytes:   number;
  usagePercent: number;
}

export default function StorageBar({ usedBytes, limitBytes, usagePercent }: StorageBarProps) {
  const pct   = Math.min(usagePercent, 100);
  const color =
    pct >= 80 ? "bg-red-500"    :
    pct >= 60 ? "bg-yellow-400" :
                "bg-emerald-500";

  const textColor =
    pct >= 80 ? "text-red-600"    :
    pct >= 60 ? "text-yellow-600" :
                "text-emerald-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {formatFileSize(usedBytes)}{" "}
          <span className="text-gray-400">de {formatFileSize(limitBytes)} usado</span>
        </span>
        <span className={`font-semibold ${textColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        Plano gratuito Supabase — limite de {formatFileSize(limitBytes)}
      </p>
    </div>
  );
}
