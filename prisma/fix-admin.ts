import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  let fixed = 0;
  for (const u of users) {
    const lower = u.email.toLowerCase();
    if (lower !== u.email) {
      await prisma.user.update({ where: { id: u.id }, data: { email: lower } });
      console.log(`✅ Corrigido: ${u.email} → ${lower}`);
      fixed++;
    }
  }
  console.log(`\nTotal corrigidos: ${fixed}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
