import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Pastas raiz fixas por setor — não podem ser excluídas
const ROOT_SECTORS = [
  "RH",
  "DP",
  "SEGURANÇA DO TRABALHO",
  "MANUTENÇÃO",
  "SUPRIMENTOS",
  "LOGÍSTICA",
  "SGI",
  "DIRETORIA",
  "ADM",
];

const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"];

async function main() {
  // Cria pastas raiz para cada empresa
  for (const company of COMPANIES) {
    for (const sector of ROOT_SECTORS) {
      const existing = await prisma.folder.findFirst({
        where: { name: sector, company, parentId: null },
      });
      if (!existing) {
        await prisma.folder.create({
          data: { name: sector, isRoot: true, company, parentId: null },
        });
      }
    }
  }
  console.log("✅ Pastas raiz criadas para AVAPEX, SEDAY e INNOMACH.");

  // Usuários de teste
  await prisma.user.upsert({
    where: { email: "admin@gruposedaY.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@gruposedaY.com.br",
      password: await bcrypt.hash("Admin@123", 12),
      role: "admin",
      company: "SEDAY",
      sector: "TI",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager.avapex@gruposedaY.com.br" },
    update: {},
    create: {
      name: "Gerente Avapex",
      email: "manager.avapex@gruposedaY.com.br",
      password: await bcrypt.hash("Manager@123", 12),
      role: "manager",
      company: "AVAPEX",
      sector: "Comercial",
    },
  });

  await prisma.user.upsert({
    where: { email: "colaborador@gruposedaY.com.br" },
    update: {},
    create: {
      name: "Colaborador Teste",
      email: "colaborador@gruposedaY.com.br",
      password: await bcrypt.hash("Employee@123", 12),
      role: "employee",
      company: "INNOMACH",
      sector: "Produção",
    },
  });

  console.log("✅ Usuários criados:");
  console.log("   admin@gruposedaY.com.br          → Admin@123    (admin)");
  console.log("   manager.avapex@gruposedaY.com.br → Manager@123  (manager)");
  console.log("   colaborador@gruposedaY.com.br    → Employee@123 (employee)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
