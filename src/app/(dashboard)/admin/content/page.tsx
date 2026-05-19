/**
 * @context admin/content/page.tsx
 * @what    Painel de gestão da Central de Conteúdo (admin)
 * @layer   page
 */
import { auth }             from "@/auth";
import { redirect }         from "next/navigation";
import Link                 from "next/link";
import { ROLES }            from "@/lib/permissions";
import { listContent, getContentStats } from "@/services/content.service";
import { formatFileSize }   from "@/lib/utils";
import { ContentTypeBadge } from "@/components/ui/content/ContentTypeIcon";
import MetricCard           from "@/components/ui/monitoring/MetricCard";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.ADMIN) redirect("/dashboard");

  const sp      = await searchParams;
  const company = sp.company ?? undefined;
  const type    = sp.type    ?? undefined;

  const [{ data: items }, stats] = await Promise.all([
    listContent({ company, type: type as any, page: 1, limit: 100 } as any),
    getContentStats(company),
  ]);

  const totalStorageBytes = stats.byCompany.reduce(
    (a, c) => a + ((c._sum as { size?: number | null })?.size ?? 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Gerenciar Central de Conteúdo</h1>
        <Link href="/admin/content/upload"
          className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors">
          + Novo Conteúdo
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon="📦" title="Total de itens"  value={stats.totalItems}     accent="blue" />
        <MetricCard icon="⬇️" title="Downloads"       value={stats.totalDownloads} accent="green" />
        <MetricCard icon="🗂️" title="Empresas"
          value={stats.byCompany.length}
          subtitle={stats.byCompany.map((c) => `${c.company}: ${c._count.id}`).join(" · ")}
          accent="purple" />
        <MetricCard icon="💾" title="Espaço usado"
          value={formatFileSize(totalStorageBytes)}
          subtitle="bucket content" accent="yellow" />
      </div>

      {stats.topDownloaded.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">🏆 Mais baixados</h2>
          <div className="space-y-2">
            {stats.topDownloaded.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="font-bold text-gray-400 w-5">{i + 1}.</span>
                <span className="text-gray-800 flex-1 truncate">{item.title}</span>
                <span className="text-gray-500 text-xs">{item.company}</span>
                <span className="font-semibold text-[#1a3a6b] text-xs">⬇️ {item.downloadCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form method="GET" className="flex flex-wrap gap-3">
        <select name="company" defaultValue={company ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]">
          <option value="">Todas as empresas</option>
          {["AVAPEX","SEDAY","INNOMACH"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="type" defaultValue={type ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]">
          <option value="">Todos os tipos</option>
          {["image","video","document","template","signature","social"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="submit"
          className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tamanho</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Downloads</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800 truncate max-w-xs">{item.title}</div>
                  {item.featured && <span className="text-[10px] text-yellow-600 font-semibold">⭐ Destaque</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.company}</td>
                <td className="px-4 py-3"><ContentTypeBadge type={item.type as any} /></td>
                <td className="px-4 py-3 text-gray-600">{formatFileSize(item.size)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700">{item.downloadCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {item.published ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <a href={`/api/content/${item.id}/download`}
                    className="text-xs text-[#2554a0] hover:underline font-medium">Baixar</a>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Nenhum conteúdo.{" "}
                  <Link href="/admin/content/upload" className="text-[#2554a0] hover:underline">Adicionar</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
