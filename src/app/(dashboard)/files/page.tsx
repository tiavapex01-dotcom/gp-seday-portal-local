import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FolderTree, { type FolderNode } from "@/components/ui/FolderTree";
import FileCard from "@/components/ui/FileCard";
import CreateFolderForm from "@/components/ui/CreateFolderForm";

interface PageProps {
  searchParams: { pasta?: string };
}

// Monta breadcrumb: [ { id, name }, ... ] do root até a pasta selecionada
function buildBreadcrumb(folders: FolderNode[], targetId: string): FolderNode[] {
  const map = new Map(folders.map((f) => [f.id, f]));
  const path: FolderNode[] = [];
  let current = map.get(targetId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return path;
}

export default async function FilesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const canManage = session.user.role !== "employee";
  const selectedFolderId = searchParams.pasta ?? null;

  // Busca todas as pastas da empresa do usuário
  const allFolders = await prisma.folder.findMany({
    where: { company: session.user.company },
    orderBy: [{ isRoot: "desc" }, { name: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { files: true, children: true } },
    },
  });

  // Normaliza para o tipo FolderNode
  const folderNodes: FolderNode[] = allFolders.map((f) => ({
    id: f.id,
    name: f.name,
    isRoot: f.isRoot,
    parentId: f.parentId,
    createdById: f.createdById,
    _count: f._count,
  }));

  // Pasta selecionada
  const selectedFolder = selectedFolderId
    ? folderNodes.find((f) => f.id === selectedFolderId) ?? null
    : null;

  // Arquivos da pasta selecionada
  const files = selectedFolder
    ? await prisma.file.findMany({
        where: { folderId: selectedFolder.id },
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, name: true } } },
      })
    : [];

  const breadcrumb = selectedFolder
    ? buildBreadcrumb(folderNodes, selectedFolder.id)
    : [];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Arquivos</h1>
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 flex-wrap">
              <Link href="/files" className="hover:text-[#1a3a6b]">Início</Link>
              {breadcrumb.map((b, i) => (
                <span key={b.id} className="flex items-center gap-1">
                  <span>/</span>
                  {i === breadcrumb.length - 1 ? (
                    <span className="font-medium text-[#1a3a6b]">{b.name}</span>
                  ) : (
                    <Link href={`/files?pasta=${b.id}`} className="hover:text-[#1a3a6b]">
                      {b.name}
                    </Link>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {canManage && selectedFolder && (
          <Link
            href={`/files/upload?pasta=${selectedFolder.id}`}
            className="bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2554a0] transition-colors"
          >
            + Novo Arquivo
          </Link>
        )}
      </div>

      <div className="flex gap-5">
        {/* Sidebar: árvore de pastas */}
        <aside className="w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5">
              {session.user.company}
            </p>
            <FolderTree
              folders={folderNodes}
              selectedId={selectedFolderId}
              canManage={canManage}
              currentUserId={session.user.id}
              userRole={session.user.role}
            />
          </div>
        </aside>

        {/* Área principal */}
        <div className="flex-1 min-w-0">
          {!selectedFolder ? (
            // Nenhuma pasta selecionada — instrução inicial
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-500 font-medium">Selecione uma pasta no painel lateral</p>
              <p className="text-gray-400 text-sm mt-1">
                As pastas de setor são fixas. Você pode criar subpastas dentro delas.
              </p>
            </div>
          ) : (
            <>
              {/* Ações da pasta atual */}
              {canManage && (
                <div className="mb-4">
                  <CreateFolderForm
                    parentId={selectedFolder.id}
                    parentName={selectedFolder.name}
                  />
                </div>
              )}

              {/* Lista de subpastas filhas */}
              {(() => {
                const subFolders = folderNodes.filter(
                  (f) => f.parentId === selectedFolder.id
                );
                return subFolders.length > 0 ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Subpastas
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {subFolders.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/files?pasta=${sub.id}`}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-3 flex items-center gap-2 hover:border-[#1a3a6b] hover:shadow-sm transition-all"
                        >
                          <span className="text-xl">📁</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{sub.name}</p>
                            <p className="text-xs text-gray-400">{sub._count.files} arquivo(s)</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Arquivos */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Arquivos ({files.length})
                </p>
                {files.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-400 text-sm">Nenhum arquivo nesta pasta.</p>
                    {canManage && (
                      <Link
                        href={`/files/upload?pasta=${selectedFolder.id}`}
                        className="mt-2 inline-block text-sm text-[#1a3a6b] hover:underline"
                      >
                        Fazer upload do primeiro arquivo →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {files.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        canDelete={
                          canManage &&
                          (session.user.role === "admin" ||
                            file.uploadedBy.id === session.user.id)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
