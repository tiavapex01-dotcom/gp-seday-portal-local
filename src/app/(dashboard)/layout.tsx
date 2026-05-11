import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
