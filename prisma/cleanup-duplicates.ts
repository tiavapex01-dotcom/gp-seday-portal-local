import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IDs to DELETE (ALL-CAPS duplicates — 0 files, 0 children)
const toDelete = [
  // AVAPEX
  "cmp197q6m000fcljjknmwmbz4", // DIRETORIA
  "cmp197lqd0007cljj2tiknmrj", // MANUTENÇÃO
  "cmp197kly0005cljjuq9bgdmn", // SEGURANÇA DO TRABALHO
  // INNOMACH
  "cmp198aep001fcljjdu8spdlv", // DIRETORIA
  "cmp1985zt0017cljjg9bbcg0n", // MANUTENÇÃO
  "cmp1984rn0015cljj0eqxdftn", // SEGURANÇA DO TRABALHO
  // SEDAY
  "cmp1980b3000xcljjhb6j3cdt", // DIRETORIA
  "cmp197vv3000pcljjsp5qll09", // MANUTENÇÃO
  "cmp197uqt000ncljj7zu78qtd", // SEGURANÇA DO TRABALHO
];

async function main() {
  const { count } = await prisma.folder.deleteMany({
    where: { id: { in: toDelete } },
  });
  console.log(`✅ Deletadas ${count} pastas duplicadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
