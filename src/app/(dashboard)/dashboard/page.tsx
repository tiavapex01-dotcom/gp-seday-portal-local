import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [filesCount, communicationsCount] = await Promise.all([
    prisma.file.count({
      where: {
        OR: [{ company: session.user.company }, { company: "ALL" }],
      },
    }),
    prisma.communication.count({
      where: {
        published: true,
        OR: [{ company: session.user.company }, { company: "ALL" }],
      },
    }),
  ]);

  const recentCommunications = await prisma.communication.findMany({
    where: {
      published: true,
      OR: [{ company: session.user.company }, { company: "ALL" }],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 5,
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div>
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
        <StatCard label="Arquivos disponíveis" value={filesCount} color="blue" />
        <StatCard label="Comunicados ativos" value={communicationsCount} color="green" />
        <StatCard label="Empresa" value={session.user.company} color="purple" />
      </div>

      {/* Comunicados recentes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Comunicados Recentes</h2>
        <div className="space-y-3">
          {recentCommunications.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.createdBy.name} · {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {c.pinned && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full shrink-0">
                    Fixado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.content}</p>
            </div>
          ))}
          {recentCommunications.length === 0 && (
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
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
