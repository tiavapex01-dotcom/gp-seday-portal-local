import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CommunicationCard from "@/components/ui/CommunicationCard";
import { getPinnedCommunications, getRecentCommunications } from "@/services/communication.service";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [filesCount, communicationsCount, fixados, recentes] = await Promise.all([
    prisma.file.count({
      where: { OR: [{ company: session.user.company }, { company: "ALL" }] },
    }),
    prisma.communication.count({ where: { published: true } }),
    getPinnedCommunications(3),
    getRecentCommunications(3),
  ]);

  const canManage = session.user.role !== "employee";

  return (
    <div>
      {/* Saudação */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.user.company} · {session.user.sector || "Sem setor"} ·{" "}
          <span className="capitalize">{session.user.role}</span>
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Arquivos disponíveis"  value={filesCount}           color="blue"   />
        <StatCard label="Comunicados ativos"    value={communicationsCount}  color="green"  />
        <StatCard label="Empresa"               value={session.user.company} color="purple" />
      </div>

      {/* Comunicados Fixados */}
      {fixados.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-1.5">
              📌 Comunicados Fixados
            </h2>
            <Link href="/communications" className="text-xs text-[#2554a0] hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
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

      {/* Comunicados Recentes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">Comunicados Recentes</h2>
          <Link href="/communications" className="text-xs text-[#2554a0] hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="space-y-3">
          {recentes.map((c) => (
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
          {recentes.length === 0 && (
            <p className="text-gray-400 text-sm">Nenhum comunicado disponível.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple";
}) {
  const colors = {
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    green:  "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
