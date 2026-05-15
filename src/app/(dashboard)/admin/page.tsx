/**
 * @context admin/page.tsx
 * @what    Admin panel — lists all users in a table with role/status badges
 * @purpose Allow admin to review and manage all user accounts across all companies
 * @depends auth, prisma (user list), Link (to /admin/users/new)
 * @usedby  Sidebar nav ("Administração" link, admin only)
 * @rules   Redirects non-admin to /dashboard; queries Prisma directly (no pagination for now)
 * @layer   page
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      sector: true,
      active: true,
      createdAt: true,
    },
  });

  const ROLE_BADGE: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-blue-100 text-blue-700",
    employee: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administração</h1>
        <Link
          href="/admin/users/new"
          className="bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2554a0] transition-colors"
        >
          + Novo Usuário
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Papel</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.company}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role] || "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-xs text-[#2554a0] hover:underline font-medium">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
