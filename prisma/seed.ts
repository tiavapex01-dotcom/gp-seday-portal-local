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

  // ── Central de Conteúdo — categorias padrão ──────────────────────────────
  const defaultCategories = [
    { name: "Logos e Marcas",               slug: "logos",            description: "Logos oficiais em todos os formatos",                   icon: "🎨", order: 1 },
    { name: "Assinatura de E-mail",          slug: "assinatura-email", description: "Templates de assinatura para e-mail corporativo",       icon: "✉️", order: 2 },
    { name: "Material para Redes Sociais",   slug: "redes-sociais",    description: "Banners, posts e stories para redes sociais",           icon: "📱", order: 3 },
    { name: "Documentos e Templates",        slug: "documentos",       description: "Modelos de documentos e apresentações",                 icon: "📄", order: 4 },
    { name: "Vídeos Institucionais",         slug: "videos",           description: "Vídeos institucionais e de apresentação",               icon: "🎬", order: 5 },
    { name: "Kit Mídia Completo",            slug: "kit-midia",        description: "Pacote completo com todos os materiais da marca",       icon: "📦", order: 6 },
  ];

  for (const company of COMPANIES) {
    for (const cat of defaultCategories) {
      await prisma.contentCategory.upsert({
        where:  { id: `${company}-${cat.slug}` },
        update: {},
        create: { id: `${company}-${cat.slug}`, ...cat, company },
      });
    }
  }
  console.log(`✅ ${defaultCategories.length * COMPANIES.length} categorias da Central de Conteúdo criadas (${COMPANIES.join(", ")}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
