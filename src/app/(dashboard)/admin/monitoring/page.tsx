/**
 * @context admin/monitoring/page.tsx
 * @what    Página de monitoramento do sistema — storage, banco e APIs
 * @purpose Dar ao admin visibilidade sobre uso do sistema em tempo real
 * @depends monitoring.service, auth, formatFileSize/formatDate (utils), componentes monitoring/
 * @usedby  Sidebar ("Monitoramento", admin only)
 * @rules   Server Component. Somente admin. Sem Prisma direto — usa services.
 * @layer   page
 */
import { auth }       from "@/auth";
import { redirect }   from "next/navigation";
import { formatFileSize, formatDate } from "@/lib/utils";
import {
  getStorageMetrics,
  getDatabaseMetrics,
  getApiMetrics,
} from "@/services/monitoring.service";
import StorageBar  from "@/components/ui/monitoring/StorageBar";
import MetricCard  from "@/components/ui/monitoring/MetricCard";
import BarChart    from "@/components/ui/monitoring/BarChart";
import MiniBarChart from "@/components/ui/monitoring/MiniBarChart";

// ── MIME type category mapping ────────────────────────────────────────────────
function categorizeMime(mimeType: string): string {
  if (mimeType === "application/pdf")                         return "PDF";
  if (mimeType.includes("wordprocessingml"))                  return "Word (.docx)";
  if (mimeType.includes("spreadsheetml"))                     return "Excel (.xlsx)";
  if (mimeType.includes("presentationml"))                    return "PowerPoint (.pptx)";
  if (mimeType.startsWith("image/"))                          return "Imagens";
  if (mimeType === "text/plain")                              return "Texto (.txt)";
  return "Outros";
}

// ── Aggregate recent uploads by date ─────────────────────────────────────────
function aggregateByDay(uploads: { createdAt: Date; size: number; company: string }[]) {
  const map = new Map<string, { count: number; size: number }>();

  // Build last-7-days keys so missing days show as 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { count: 0, size: 0 });
  }

  for (const u of uploads) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      entry.size  += u.size;
    }
  }

  return Array.from(map.entries()).map(([date, v]) => ({
    date,
    count: v.count,
    size:  v.size,
  }));
}

// ── MIME grouper for table ────────────────────────────────────────────────────
function groupMimeRows(
  byMimeType: { mimeType: string; _count: { id: number }; _sum: { size: number | null } }[]
) {
  const map = new Map<string, { count: number; size: number }>();
  for (const row of byMimeType) {
    const cat   = categorizeMime(row.mimeType);
    const entry = map.get(cat) ?? { count: 0, size: 0 };
    entry.count += row._count.id;
    entry.size  += row._sum.size ?? 0;
    map.set(cat, entry);
  }
  return Array.from(map.entries()).map(([cat, v]) => ({ cat, ...v }));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  const [storage, database, apis] = await Promise.all([
    getStorageMetrics(),
    getDatabaseMetrics(),
    getApiMetrics(),
  ]);

  const generatedAt = new Date();
  const dayBars     = aggregateByDay(storage.recentUploads);
  const mimeRows    = groupMimeRows(storage.byMimeType);

  const usersByCompanyItems = database.users.byCompany.map((r) => ({
    label: r.company,
    value: r._count.id,
  }));

  const usersByRoleItems = database.users.byRole.map((r) => ({
    label: r.role,
    value: r._count.id,
    color:
      r.role === "admin"   ? "bg-red-500"   :
      r.role === "manager" ? "bg-blue-500"  :
                             "bg-gray-400",
  }));

  const totalSizeByCompany = storage.byCompany.reduce(
    (acc, r) => acc + (r._sum.size ?? 0),
    0
  ) || 1;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📊 Monitoramento do Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Última atualização: {formatDate(generatedAt)} às{" "}
            {generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <form action="/admin/monitoring" method="GET">
          <button
            type="submit"
            className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            🔄 Atualizar
          </button>
        </form>
      </div>

      {/* ════════════════════════════════════════
          SEÇÃO 1 — STORAGE
      ════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">💾 Armazenamento (Storage)</h2>

        {/* Uso geral */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Uso total</h3>
          <StorageBar
            usedBytes={storage.totalSizeBytes}
            limitBytes={storage.limitBytes}
            usagePercent={storage.usagePercent}
          />

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{storage.totalFiles}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total de arquivos</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-2xl font-bold text-gray-800">
                {formatFileSize(Math.round(storage.avgFileSizeBytes))}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Tamanho médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {formatFileSize(storage.maxFileSizeBytes)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Maior arquivo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Por empresa */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Por empresa</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500 text-xs">Empresa</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500 text-xs">Arquivos</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500 text-xs">Tamanho</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500 text-xs">%</th>
                </tr>
              </thead>
              <tbody>
                {storage.byCompany.map((row) => (
                  <tr key={row.company} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{row.company}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row._count.id}</td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {formatFileSize(row._sum.size ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {(((row._sum.size ?? 0) / totalSizeByCompany) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {storage.byCompany.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">
                      Nenhum arquivo encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Por tipo */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Por tipo de arquivo</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500 text-xs">Tipo</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500 text-xs">Arquivos</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500 text-xs">Tamanho</th>
                </tr>
              </thead>
              <tbody>
                {mimeRows.map((row) => (
                  <tr key={row.cat} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{row.cat}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.count}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatFileSize(row.size)}</td>
                  </tr>
                ))}
                {mimeRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-400 text-xs">
                      Nenhum arquivo encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SEÇÃO 2 — BANCO DE DADOS
      ════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🗄️ Banco de Dados</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricCard
            icon="👥"
            title="Usuários"
            value={database.users.total}
            subtitle={`${database.users.active} ativos · ${database.users.inactive} inativos`}
            accent="blue"
          />
          <MetricCard
            icon="📢"
            title="Comunicados"
            value={database.communications.total}
            subtitle={`${database.communications.pinned} fixados`}
            accent="purple"
          />
          <MetricCard
            icon="📁"
            title="Pastas"
            value={database.folders.total}
            subtitle={`${database.folders.root} raiz (setor)`}
            accent="yellow"
          />
          <MetricCard
            icon="📄"
            title="Arquivos"
            value={database.files.total}
            subtitle={`${formatFileSize(storage.totalSizeBytes)} total`}
            accent="green"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Usuários por empresa</h3>
            <BarChart items={usersByCompanyItems} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Usuários por papel (role)</h3>
            <BarChart items={usersByRoleItems} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SEÇÃO 3 — ATIVIDADE DAS APIs
      ════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">⚡ Atividade das APIs</h2>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Endpoint</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Últimas 24h</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Últimos 7 dias</th>
              </tr>
            </thead>
            <tbody>
              {apis.endpoints.map((ep) => (
                <tr key={ep.route} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {ep.route}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ep.description}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{ep.last24h}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{ep.last7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon="⚡"
            title="Operações (24h)"
            value={apis.summary.totalOperationsLast24h}
            subtitle="uploads + comunicados"
            accent="blue"
          />
          <MetricCard
            icon="📈"
            title="Operações (7 dias)"
            value={apis.summary.totalOperationsLast7d}
            subtitle="uploads + comunicados + usuários"
            accent="green"
          />
        </div>
      </section>

      {/* ════════════════════════════════════════
          SEÇÃO 4 — ATIVIDADE RECENTE
      ════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          📅 Uploads — últimos 7 dias
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <MiniBarChart data={dayBars} />
          <p className="text-xs text-gray-400 text-center mt-3">
            Passe o mouse sobre as barras para ver detalhes
          </p>
        </div>
      </section>
    </div>
  );
}
