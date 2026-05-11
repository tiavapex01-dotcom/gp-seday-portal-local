import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CommunicationCard from "@/components/ui/CommunicationCard";

export default async function CommunicationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const canManage = session.user.role !== "employee";

  const communications = await prisma.communication.findMany({
    where: {
      published: true,
      OR: [
        { company: session.user.company, sector: null },
        { company: session.user.company, sector: session.user.sector ?? undefined },
        { company: "ALL" },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div>
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

      <div className="space-y-4">
        {communications.map((c) => (
          <CommunicationCard
            key={c.id}
            item={c}
            canManage={canManage}
          />
        ))}

        {communications.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm">Nenhum comunicado disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
}
