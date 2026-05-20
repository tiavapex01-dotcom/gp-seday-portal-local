/**
 * @context monitoring.service.ts
 * @what    Coleta métricas de uso de storage, banco, APIs e segurança
 * @purpose Fornecer dados para a página de monitoramento do admin
 * @depends prisma
 * @usedby  admin/monitoring/page.tsx
 * @rules   Somente admin acessa. Nunca expor dados sensíveis.
 * @layer   service
 */
import { prisma } from "@/lib/prisma";

const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB (Supabase free tier)

export async function getStorageMetrics() {
  const [totalFiles, storageSummary, byCompany, byMimeType] = await Promise.all([
    prisma.file.count(),
    prisma.file.aggregate({
      _sum: { size: true },
      _avg: { size: true },
      _max: { size: true },
    }),
    prisma.file.groupBy({
      by: ["company"],
      _count: { id: true },
      _sum:   { size: true },
    }),
    prisma.file.groupBy({
      by:      ["mimeType"],
      _count:  { id: true },
      _sum:    { size: true },
      orderBy: { _sum: { size: "desc" } },
      take:    10,
    }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUploads = await prisma.file.findMany({
    where:   { createdAt: { gte: sevenDaysAgo } },
    select:  { createdAt: true, size: true, company: true },
    orderBy: { createdAt: "asc" },
  });

  const totalSizeBytes = storageSummary._sum.size ?? 0;

  return {
    totalFiles,
    totalSizeBytes,
    avgFileSizeBytes:  storageSummary._avg.size ?? 0,
    maxFileSizeBytes:  storageSummary._max.size ?? 0,
    limitBytes:        STORAGE_LIMIT_BYTES,
    usagePercent:      (totalSizeBytes / STORAGE_LIMIT_BYTES) * 100,
    byCompany,
    byMimeType,
    recentUploads,
  };
}

export async function getDatabaseMetrics() {
  const [
    totalUsers,
    activeUsers,
    totalCommunications,
    pinnedCommunications,
    totalFolders,
    rootFolders,
    totalFiles,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.communication.count(),
    prisma.communication.count({ where: { pinned: true } }),
    prisma.folder.count(),
    prisma.folder.count({ where: { isRoot: true } }),
    prisma.file.count(),
  ]);

  const [usersByCompany, usersByRole, communicationsByCompany] = await Promise.all([
    prisma.user.groupBy({ by: ["company"], _count: { id: true } }),
    prisma.user.groupBy({ by: ["role"],    _count: { id: true } }),
    prisma.communication.groupBy({ by: ["company"], _count: { id: true } }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await prisma.communication.findMany({
    where:   { createdAt: { gte: thirtyDaysAgo } },
    select:  { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    users: {
      total:     totalUsers,
      active:    activeUsers,
      inactive:  totalUsers - activeUsers,
      byCompany: usersByCompany,
      byRole:    usersByRole,
    },
    communications: {
      total:     totalCommunications,
      pinned:    pinnedCommunications,
      byCompany: communicationsByCompany,
    },
    folders: { total: totalFolders, root: rootFolders },
    files:   { total: totalFiles },
    recentActivity,
  };
}

export async function getSecurityMetrics() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  // Tentativas de login com falha (usuário não encontrado ou senha errada)
  // Proxy: usuários inativos que tentaram login — sem tabela dedicada de auditoria ainda
  const [inactiveUsers, newUsersLast7d, newUsersLast24h] = await Promise.all([
    prisma.user.count({ where: { active: false } }),
    prisma.user.count({ where: { createdAt: { gte: last7d  } } }),
    prisma.user.count({ where: { createdAt: { gte: last24h } } }),
  ]);

  return {
    sentry: {
      configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      // Mascara o DSN — expõe apenas o host de ingest (sem chave pública)
      dsnHost: process.env.NEXT_PUBLIC_SENTRY_DSN
        ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).host
        : null,
    },
    rateLimit: {
      // Rate limiting ainda não implementado — seção preparada para dados futuros
      implemented:   false,
      blocksLast24h: 0,
      blocksLast7d:  0,
    },
    users: {
      inactive:       inactiveUsers,
      newLast24h:     newUsersLast24h,
      newLast7d:      newUsersLast7d,
    },
  };
}

export async function getApiMetrics() {
  const now     = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    filesLast24h,
    filesLast7d,
    communicationsLast24h,
    communicationsLast7d,
    usersCreatedLast7d,
  ] = await Promise.all([
    prisma.file.count({ where: { createdAt: { gte: last24h } } }),
    prisma.file.count({ where: { createdAt: { gte: last7d  } } }),
    prisma.communication.count({ where: { createdAt: { gte: last24h } } }),
    prisma.communication.count({ where: { createdAt: { gte: last7d  } } }),
    prisma.user.count({ where: { createdAt: { gte: last7d  } } }),
  ]);

  return {
    endpoints: [
      {
        route:       "POST /api/files",
        description: "Upload de arquivo",
        last24h:     filesLast24h,
        last7d:      filesLast7d,
      },
      {
        route:       "POST /api/communications",
        description: "Novo comunicado",
        last24h:     communicationsLast24h,
        last7d:      communicationsLast7d,
      },
      {
        route:       "POST /api/users",
        description: "Novo usuário",
        last24h:     0,
        last7d:      usersCreatedLast7d,
      },
    ],
    summary: {
      totalOperationsLast24h: filesLast24h + communicationsLast24h,
      totalOperationsLast7d:  filesLast7d  + communicationsLast7d + usersCreatedLast7d,
    },
  };
}
