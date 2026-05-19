/**
 * @context app/(dashboard)/content/page.tsx
 * @what    Central de Conteúdo — visualização para todos os funcionários
 * @purpose Permitir busca, filtragem e download de materiais de marca da empresa
 * @depends content.service, auth, ContentCard, ContentTypeIcon
 * @usedby  Sidebar ("Central de Conteúdo", todos os roles)
 * @rules   Server Component. Filtra automaticamente pela empresa do usuário (exceto admin).
 *          Downloads via /api/content/[id]/download — nunca URL direta.
 * @layer   page
 */
import { auth }              from "@/auth";
import { redirect }          from "next/navigation";
import Link                  from "next/link";
import { ROLES }             from "@/lib/permissions";
import { listContent, listCategories } from "@/services/content.service";
import ContentCard           from "@/components/ui/content/ContentCard";
import { ContentTypeBadge }  from "@/components/ui/content/ContentTypeIcon";
import type { ContentType }  from "@/schemas/content.schema";
import CompanyBadge          from "@/components/ui/CompanyBadge";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  image:     "Imagens",
  video:     "Vídeos",
  document:  "Documentos",
  template:  "Templates",
  signature: "Assinaturas",
  social:    "Redes Sociais",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp          = await searchParams;
  const isAdmin     = session.user.role === ROLES.ADMIN;
  const company     = isAdmin ? (sp.company ?? undefined) : session.user.company;
  const filterType  = (sp.type ?? undefined) as ContentType | undefined;
  const filterCat   = sp.category ?? undefined;
  const search      = sp.search ?? undefined;

  const [{ data: allItems }, categories] = await Promise.all([
    listContent({ company, type: filterType, categoryId: filterCat, search, page: 1, limit: 100 }),
    listCategories(company),
  ]);

  // Featured items
  const featured = allItems.filter((c) => c.featured);
  // Group by category
  const byCategory = categories.map((cat) => ({
    category: cat,
    items:    allItems.filter((c) => c.categoryId === cat.id),
  })).filter(({ items }) => items.length > 0);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🗂️ Central de Conteúdo
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Materiais de marca —</p>
            {company ? (
              <CompanyBadge company={company} />
            ) : (
              <span className="text-sm text-gray-500">todas as empresas</span>
            )}
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/admin/content"
            className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            ⚙️ Gerenciar Conteúdo
          </Link>
        )}
      </div>

      {/* ── Filters bar ── */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Buscar conteúdo..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0] max-w-xs"
        />

        {/* Type filter */}
        <select
          name="type"
          defaultValue={filterType ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]"
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((t) => (
            <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          name="category"
          defaultValue={filterCat ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Filtrar
        </button>

        {(search || filterType || filterCat) && (
          <Link href="/content" className="text-sm text-gray-500 hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      {/* ── Featured ── */}
      {featured.length > 0 && !filterType && !filterCat && !search && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">⭐ Em Destaque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((item) => (
              <ContentCard
                key={item.id}
                content={item as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── By Category ── */}
      {byCategory.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum conteúdo encontrado</p>
          {isAdmin && (
            <Link href="/admin/content/upload" className="mt-3 inline-block text-sm text-[#2554a0] hover:underline font-medium">
              + Adicionar primeiro conteúdo
            </Link>
          )}
        </div>
      ) : (
        byCategory.map(({ category, items }) => (
          <section key={category.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                {category.icon} {category.name}
              </h2>
              {category.description && (
                <p className="text-xs text-gray-400 hidden md:block">{category.description}</p>
              )}
              {isAdmin && (
                <Link
                  href={`/admin/content/upload?category=${category.id}`}
                  className="text-xs text-[#2554a0] hover:underline font-medium"
                >
                  + Upload
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item as any}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
