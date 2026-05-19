/**
 * @context api/content/[id]/download/route.ts
 * @what    Proxy de download autenticado para conteúdo da Central de Marca
 * @purpose Servir arquivos privados do bucket 'content' com rastreamento de downloads
 * @depends content.service (downloadContent, incrementDownload), auth
 * @usedby  ContentCard "Baixar" button, /content page
 * @rules   Bucket é PRIVADO — nunca retornar URL pública. Sempre via este proxy.
 *          Incrementa downloadCount a cada download bem-sucedido.
 * @layer   api-route
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth }                           from "@/auth";
import { unauthorized, forbidden, notFound, err } from "@/lib/api";
import { ROLES }                          from "@/lib/permissions";
import { downloadContent, incrementDownload, getContentById } from "@/services/content.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;

  // Company isolation for non-admins
  const meta = await getContentById(id);
  if (!meta) return notFound("Conteúdo");
  if (session.user.role !== ROLES.ADMIN && meta.company !== session.user.company) {
    return forbidden();
  }

  try {
    const { content, data } = await downloadContent(id);

    // Increment counter (fire-and-forget — don't block response)
    incrementDownload(id).catch(() => {});

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":        content.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(content.storedName)}"`,
        "Content-Length":      String(content.size),
        "Cache-Control":       "private, no-cache",
      },
    });
  } catch (e) {
    return err((e as { message?: string }).message ?? "Erro ao baixar arquivo", 500);
  }
}
