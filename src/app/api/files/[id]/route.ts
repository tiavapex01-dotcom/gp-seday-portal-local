export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

// DELETE /api/files/:id — remove do Supabase Storage e do banco
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const resolvedParams = await params;

  const file = await prisma.file.findUnique({ where: { id: resolvedParams.id } });
  if (!file) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (session.user.role === "manager" && file.company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([file.path]);

  if (storageError) {
    console.error("Supabase storage remove error:", storageError.message);
  }

  await prisma.file.delete({ where: { id: resolvedParams.id } });
  return NextResponse.json({ success: true });
}
