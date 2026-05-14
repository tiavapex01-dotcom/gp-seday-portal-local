/**
 * @context api/files/download/[id]/route.ts
 * @what    Authenticated file download proxy endpoint
 * @purpose Stream private Supabase Storage files to the browser with auth check
 * @depends file.service, api helpers
 * @usedby  FileCard (download link href)
 * @rules   NEVER redirect to a signed Supabase URL — always proxy to keep files private
 * @layer   api-route
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { downloadFile } from "@/services/file.service";
import { err, unauthorized, forbidden } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { id }         = await params;
    const { file, data } = await downloadFile(id);

    if (
      session.user.role !== "admin" &&
      file.folder.company !== "ALL" &&
      file.folder.company !== session.user.company
    ) {
      return forbidden();
    }

    const safeFileName = encodeURIComponent(file.name);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type":        file.mimeType,
        "Content-Length":      String(file.size),
        "Content-Disposition": file.mimeType.startsWith("image/") || file.mimeType === "application/pdf"
          ? `inline; filename*=UTF-8''${safeFileName}`
          : `attachment; filename*=UTF-8''${safeFileName}`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error: unknown) {
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}
