import { auth } from "@/auth";
import Link from "next/link";
import CommunicationCard from "@/components/ui/CommunicationCard";
import { getAllCommunications } from "@/services/communication.service";

export default async function CommunicationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const canManage = session.user.role !== "employee";

  const all     = await getAllCommunications();
  const fixados = all.filter((c) => c.pinned);
  const demais  = all.filter((c) => !c.pinned);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Comunicados</h1>
        {canManage && (
          <Link
            href="/communications/new"
            className="bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2554a0] transition-colors"
          >
            + Novo Comunicado
          </Link>
        )}
      </div>

      {all.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">Nenhum comunicado disponível.</p>
        </div>
      )}

      {/* Fixados */}
      {fixados.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            📌 Fixados
          </h2>
          <div className="space-y-4">
            {fixados.map((c) => (
              <CommunicationCard
                key={c.id}
                item={{
                  id:           c.id,
                  title:        c.title,
                  content:      c.content,
                  company:      c.company,
                  sector:       c.sector,
                  contactPhone: c.contactPhone,
                  contactEmail: c.contactEmail,
                  pinned:       c.pinned,
                  createdAt:    c.createdAt,
                  createdBy:    c.createdBy,
                }}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      )}

      {/* Todos os demais */}
      {demais.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Todos os Comunicados
          </h2>
          <div className="space-y-4">
            {demais.map((c) => (
              <CommunicationCard
                key={c.id}
                item={{
                  id:           c.id,
                  title:        c.title,
                  content:      c.content,
                  company:      c.company,
                  sector:       c.sector,
                  contactPhone: c.contactPhone,
                  contactEmail: c.contactEmail,
                  pinned:       c.pinned,
                  createdAt:    c.createdAt,
                  createdBy:    c.createdBy,
                }}
                canManage={canManage}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
