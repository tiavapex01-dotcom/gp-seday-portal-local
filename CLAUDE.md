# CLAUDE.md — Portal Corporativo Interno Grupo Seday

## Contexto do Projeto
Portal interno corporativo para os funcionários das empresas AVAPEX, SEDAY e INNOMACH.
- **Stack:** Next.js 16.2.6 · Prisma 5.22.0 · Supabase · NextAuth v5 · TypeScript · Tailwind CSS
- **Deploy:** Vercel — `gp-seday-portal-local-531m.vercel.app`
- **Repo:** GitHub — `tiavapex01-dotcom/gp-seday-portal-local`

---

## Arquitetura

```
src/schemas/       Zod — validação e transformação de input da API
src/services/      Business logic — TODAS as queries Prisma ficam aqui
src/app/api/       Routes thin — auth guard → parse Zod → service → resposta
src/components/ui/ Componentes React reutilizáveis
src/lib/           Helpers: api.ts, prisma.ts, supabase.ts, permissions.ts, utils.ts, prisma-errors.ts
src/hooks/         Custom hooks: useFormSubmit.ts
prisma/            Schema, seed, scripts de manutenção (fix-admin.ts)
```

### Regras de camada (nunca violar)
- API routes **nunca** importam de `src/services/` → `src/app/` diretamente
- Services **nunca** importam de `src/app/` nem usam `NextResponse`
- Queries Prisma **nunca** aparecem em `src/app/api/` — sempre em services
- Downloads de arquivos **sempre** via proxy `/api/files/download/[id]` — nunca URL direta do Supabase

---

## Helpers críticos

### `src/lib/api.ts`
Todo handler de API usa: `ok`, `created`, `err`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `internalError`, `fromZodError`
**Nunca** usar `NextResponse.json()` direto.

### `src/lib/permissions.ts`
Constantes: `ROLES`, `COMPANIES`, `COMPANIES_ALL`
Helpers: `canManage(role)`, `isAdmin(role)`, `isManager(role)`
**Nunca** usar strings soltas `'admin'`/`'manager'`/`'employee'` — usar `ROLES.*`

### `src/lib/utils.ts`
`formatFileSize`, `formatDate`, `formatDateShort`, `sanitizeDigits`, `truncate`
**Nunca** formatar datas ou tamanhos de arquivo inline.

### `src/lib/prisma-errors.ts`
`handlePrismaError(e)` — adicionar `.catch(handlePrismaError)` em todo `prisma.create/update/delete` nos services para traduzir P2002/P2025/P2003.

### `src/hooks/useFormSubmit.ts`
Usar em qualquer componente com estado `loading + error` para submit de formulário.

---

## RBAC
- `admin`: acesso total a todas as empresas
- `manager`: acesso à própria empresa, pode criar comunicados/pastas/upload
- `employee`: somente leitura

---

## Segurança
- `.env` nunca commitado
- `SUPABASE_SERVICE_ROLE_KEY` server-side only — nunca no frontend
- Bucket Supabase é **privado** — todo download via proxy `/api/files/download/[id]`

---

## Design System

Sistema de design documentado em `.interface-design/system.md`.

**Antes de criar qualquer componente UI, leia o system.md e siga:**

### Paleta principal
| Cor | Hex | Uso |
|-----|-----|-----|
| Navy primário | `#1a3a6b` | Sidebar, botões primários, links ativos |
| Navy hover | `#2554a0` | Hover de botões e links |
| Page bg | `#f9fafb` | bg-gray-50 |

### Tokens rápidos
- **Spacing base:** 4px (Tailwind: 1=4px, 2=8px, 3=12px, 4=16px)
- **Card radius:** `rounded-xl` (12px) — **não** `rounded-lg`
- **Button radius:** `rounded-lg` (8px)
- **Input radius:** `rounded-lg` (8px)
- **Typography base:** `text-sm` (14px)

### Padrões de componente

**Botão primário:**
```
bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60
```

**Botão secundário:**
```
border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 px-4 py-2.5 text-sm
```

**Card:**
```
bg-white rounded-xl border border-gray-200 shadow-sm
```

**Input:**
```
w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]
```

**Sidebar:** largura `w-60` (240px), fundo `bg-[#1a3a6b]`, item ativo `bg-white/20`

**Tabela:** header `bg-gray-50`, rows `hover:bg-gray-50 border-b border-gray-100`, células `px-4 py-3`

**Empty state:** `bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center`

### Componentes utilitários disponíveis
| Componente | Uso |
|------------|-----|
| `CompanyBadge` | Badge de empresa com cor (AVAPEX/SEDAY/INNOMACH) |
| `FormError` | Bloco de erro em formulários |
| `ConfirmDeleteButton` | Botão de exclusão em dois cliques |

---

## Convenções de Código

### API routes
```typescript
// Padrão mínimo de todo handler
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  // ...
  try {
    return ok(await someService(input));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
```

### `params` em rotas dinâmicas (Next.js 15)
```typescript
// params É uma Promise — sempre await
type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
}
```

### Services
```typescript
// Adicionar .catch(handlePrismaError) em todo create/update/delete
return prisma.user.create({ data: { ... } }).catch(handlePrismaError);
```

### @context headers
Todo arquivo em `src/` deve ter no topo:
```typescript
/**
 * @context nome-do-arquivo.ts
 * @what    O que este arquivo é (1 linha)
 * @purpose Por que existe (1 linha)
 * @depends dependências chave
 * @usedby  quem importa este arquivo
 * @rules   restrições importantes
 * @layer   schema | service | api-route | component | lib | hook | page
 */
```

---

## Seed / banco de dados
- Emails de teste: `admin@gruposeday.com.br`, `manager.avapex@gruposeday.com.br`, `colaborador@gruposeday.com.br`
- Para normalizar emails no banco: `npx tsx prisma/fix-admin.ts`
- Para resetar pastas: `npx tsx prisma/seed.ts`
- DB push (sem migration interativa): `npx prisma db push`
