import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROOT_SECTORS = [
  "Manutenção",
  "Administrativo",
  "RH",
  "Financeiro",
  "Diretoria",
  "Segurança do Trabalho",
  "Suprimentos/Almoxarifado",
  "Planejamento",
  "TI",
];

const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"];

async function main() {
  // Cria pastas raiz para cada empresa
  for (const company of COMPANIES) {
    for (const sector of ROOT_SECTORS) {
      const existing = await prisma.folder.findFirst({
        where: { name: { equals: sector, mode: "insensitive" }, company, parentId: null },
      });
      if (!existing) {
        await prisma.folder.create({
          data: { name: sector, isRoot: true, company, parentId: null },
        });
      }
    }
  }
  console.log(`✅ ${ROOT_SECTORS.length} pastas raiz criadas por empresa (${COMPANIES.join(", ")}).`);

  // Usuários de teste
  await prisma.user.upsert({
    where: { email: "admin@gruposeday.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@gruposeday.com.br",
      password: await bcrypt.hash("Admin@123", 12),
      role: "admin",
      company: "SEDAY",
      sector: "Administrativo",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager.avapex@gruposeday.com.br" },
    update: {},
    create: {
      name: "Gerente Avapex",
      email: "manager.avapex@gruposeday.com.br",
      password: await bcrypt.hash("Manager@123", 12),
      role: "manager",
      company: "AVAPEX",
      sector: "Financeiro",
    },
  });

  await prisma.user.upsert({
    where: { email: "colaborador@gruposeday.com.br" },
    update: {},
    create: {
      name: "Colaborador Teste",
      email: "colaborador@gruposeday.com.br",
      password: await bcrypt.hash("Employee@123", 12),
      role: "employee",
      company: "INNOMACH",
      sector: "Manutenção",
    },
  });

  console.log("✅ Usuários criados:");
  console.log("   admin@gruposeday.com.br            → Admin@123    (admin)");
  console.log("   manager.avapex@gruposeday.com.br   → Manager@123  (manager)");
  console.log("   colaborador@gruposeday.com.br      → Employee@123 (employee)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
