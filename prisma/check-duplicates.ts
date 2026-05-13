import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roots = await prisma.folder.findMany({
    where: { isRoot: true },
    orderBy: [{ company: "asc" }, { name: "asc" }],
    include: { _count: { select: { files: true, children: true } } },
  });

  // Group by company + normalized name (lowercase)
  const groups = new Map<string, typeof roots>();
  for (const f of roots) {
    const key = `${f.company}::${f.name.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const duplicates = [...groups.entries()].filter(([, v]) => v.length > 1);

  if (duplicates.length === 0) {
    console.log("✅ Nenhuma pasta raiz duplicada encontrada.");
  } else {
    console.log(`⚠️  ${duplicates.length} grupo(s) duplicados encontrados:\n`);
    for (const [key, folders] of duplicates) {
      console.log(`  Grupo: ${key}`);
      for (const f of folders) {
        console.log(`    id=${f.id}  name="${f.name}"  files=${f._count.files}  children=${f._count.children}`);
      }
    }
  }

  // Also show all root folders for audit
  console.log("\n=== Todas as pastas raiz ===");
  for (const f of roots) {
    console.log(`  [${f.company}] "${f.name}"  id=${f.id}  files=${f._count.files}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
