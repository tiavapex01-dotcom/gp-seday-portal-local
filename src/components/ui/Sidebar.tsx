/**
 * @context Sidebar.tsx
 * @what    App shell sidebar with company badge, nav links, and logout button
 * @purpose Primary navigation visible on all dashboard pages
 * @depends next-auth/react (signOut), usePathname, CompanyBadge
 * @usedby  src/app/(dashboard)/layout.tsx
 * @rules   Upload and Admin links are conditionally shown based on role; active link uses bg-white/20
 * @layer   component
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import CompanyBadge from "./CompanyBadge";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    company: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/communications", label: "Comunicados", icon: "📢" },
    { href: "/files", label: "Arquivos", icon: "📁" },
    ...(user.role !== "employee"
      ? [{ href: "/files/upload", label: "Upload", icon: "⬆️" }]
      : []),
    ...(user.role === "admin"
      ? [{ href: "/admin", label: "Administração", icon: "⚙️" }]
      : []),
  ];

  return (
    <aside className="w-60 bg-[#1a3a6b] text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold">Grupo Seday</h1>
        <div className="mt-1">
          <CompanyBadge company={user.company} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-white/50 truncate">{user.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white py-2 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
