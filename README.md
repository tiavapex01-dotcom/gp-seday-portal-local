# Portal Corporativo Interno — Grupo Seday

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?logo=nextdotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Tests](https://img.shields.io/badge/Testes-262%20passando-22c55e?logo=vitest&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/Licença-Privado-gray)

---

## Sobre o Projeto

Portal intranet corporativo para os funcionários das empresas do **Grupo Seday**. Centraliza comunicados internos, gerenciamento de arquivos por setor, kit de marca e materiais de identidade visual em um único ambiente seguro, com controle de acesso por empresa e papel (role).

**Problemas que resolve:**
- Dispersão de arquivos em drives e e-mails — substituído por um GED hierárquico por setor
- Comunicados sem visibilidade — painel centralizado com fixação e filtro por empresa
- Ativos de marca desatualizados ou inacessíveis — Central de Conteúdo com download rastreado
- Falta de visibilidade operacional — painel de monitoramento com métricas de storage, banco e segurança

---

## Empresas Suportadas

| Empresa | Descrição |
|---------|-----------|
| **AVAPEX** | Unidade de aviação |
| **SEDAY** | Holding do grupo |
| **INNOMACH** | Unidade de tecnologia e inovação |

### Papéis (Roles)

| Role | Permissões |
|------|-----------|
| `admin` | Acesso total a todas as empresas. Gerencia usuários, conteúdo, pastas e comunicados de qualquer empresa. Acessa o painel de monitoramento. |
| `manager` | Acesso à própria empresa. Cria comunicados, faz upload de arquivos e gerencia pastas. Só pode editar e excluir o que criou. |
| `employee` | Somente leitura. Visualiza comunicados, navega pelos arquivos e faz downloads. |

---

## Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|------------|--------|-----------|
| [Next.js](https://nextjs.org) | 16.2.6 | Framework full-stack — App Router, Server Components, API Routes |
| [React](https://react.dev) | 19.0 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org) | 5 | Tipagem estática em todo o projeto |
| [Prisma ORM](https://www.prisma.io) | 5.22.0 | Camada de acesso ao banco de dados (PostgreSQL) |
| [Supabase](https://supabase.com) | — | PostgreSQL gerenciado + Storage privado para arquivos |
| [NextAuth.js](https://authjs.dev) | v5 beta | Autenticação com estratégia JWT e adapter Prisma |
| [Zod](https://zod.dev) | 4.4.3 | Validação e transformação de inputs nas API routes |
| [Tailwind CSS](https://tailwindcss.com) | 3.4.1 | Estilização utilitária |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4.3 | Hash de senhas (custo 12) |
| [Sentry](https://sentry.io) | 10.53.1 | Monitoramento de erros em cliente, servidor e edge |
| [Vitest](https://vitest.dev) | 4.1.6 | Testes unitários e de integração (262 testes) |
| [sharp](https://sharp.pixelplumbing.com) | 0.33.5 | Otimização de imagens no build |

---

## Funcionalidades

### Autenticação
- Login com **e-mail**, **CPF** ou **telefone** + senha
- Sessão JWT via NextAuth.js v5
- Proteção de rotas via Edge Middleware (sem roundtrip ao banco)
- Redirecionamento automático por role ao acessar rota não autorizada

### Comunicados
- Criação de comunicados por empresa, setor e contato
- **Fixação** no topo do feed (`pinned`)
- Publicação/despublicação sem exclusão
- Filtro por empresa e setor
- Manager cria e gerencia apenas seus próprios comunicados; admin gerencia todos

### Gerenciamento de Arquivos (GED)
- Estrutura de pastas hierárquica por setor (raiz imutável + subpastas livres)
- Upload de arquivos com descrição, associado a pasta e empresa
- Download autenticado via proxy `/api/files/download/[id]` — nunca URL direta do Supabase
- Whitelist de MIME types no proxy (PDF, imagens, Office, vídeos)
- Renomeação e exclusão de subpastas (somente vazias)
- Isolamento por empresa: cada usuário vê apenas arquivos da sua empresa

### Central de Conteúdo (Brand Hub)
- Repositório de ativos de marca: logos, templates, assinaturas de e-mail, materiais para redes sociais
- Categorias com ícone, slug e ordem personalizados
- Filtro por tipo (`image`, `video`, `document`, `template`, `signature`, `social`) e categoria
- Marcação de itens em destaque (`featured`)
- Contador de downloads rastreado por arquivo
- Download autenticado via proxy `/api/content/[id]/download`

### Painel de Monitoramento (Admin)
- **Storage:** uso total vs. cota (1 GB free tier), por empresa, por tipo de arquivo, uploads por dia
- **Banco de dados:** contagem de usuários, comunicados, pastas e arquivos; distribuição por empresa e role
- **APIs:** operações nas últimas 24h e 7 dias por endpoint
- **Segurança:** status do Sentry SDK, rate limiting (preparado), novos usuários e contas inativas

### Gestão de Usuários (Admin)
- Listagem com filtro por empresa, role e status
- Criação com e-mail, CPF, telefone, setor e role
- Edição e desativação de contas (soft delete via `active: false`)
- Detecção de conflitos (e-mail, CPF, telefone duplicados) via Prisma P2002

### Segurança
- Headers HTTP completos: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Inputs sanitizados via Zod (`.trim()`, limites de tamanho, enums estritos)
- Senhas com bcrypt custo 12
- Service Role Key do Supabase exclusivamente server-side
- `npm audit` e `tsc --noEmit` no pipeline de CI antes do build

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│          React 19 · Tailwind CSS · Sentry Replay        │
└────────────────────────┬────────────────────────────────┘
                         │  HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Edge Middleware (middleware.ts)             │
│   JWT check → redirect por role antes de atingir rotas  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Next.js App Router                         │
│  ┌─────────────────┐      ┌────────────────────────┐    │
│  │  Server Pages   │      │     API Routes         │    │
│  │  (RSC, SSR)     │      │  auth → Zod → service  │    │
│  └────────┬────────┘      └──────────┬─────────────┘    │
└───────────┼──────────────────────────┼──────────────────┘
            │                          │
┌───────────▼──────────────────────────▼──────────────────┐
│                    Services Layer                        │
│   Toda a lógica de negócio · Queries Prisma centralizadas│
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  Prisma ORM 5.22                         │
│          Type-safe queries · Migrations                  │
└──────────┬─────────────────────────────┬────────────────┘
           │                             │
┌──────────▼──────────┐     ┌────────────▼───────────────┐
│  Supabase PostgreSQL│     │   Supabase Storage         │
│  (pooler :6543)     │     │   bucket: uploads          │
│  (direct  :5432)    │     │   bucket: content          │
└─────────────────────┘     └────────────────────────────┘
```

### Regras de camada (nunca violar)

- **API routes** não importam de `src/services/` diretamente — passam por `src/app/api/`
- **Services** nunca usam `NextResponse` nem importam de `src/app/`
- **Queries Prisma** aparecem apenas em `src/services/`
- **Downloads** sempre via proxy — nunca URL direta do Supabase

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/               # Página de login
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── content/         # Upload e gestão da Central de Conteúdo
│   │   │   ├── monitoring/      # Painel de monitoramento (admin only)
│   │   │   └── users/           # Gestão de usuários (admin only)
│   │   ├── communications/      # Feed de comunicados + criação
│   │   ├── content/             # Central de Conteúdo (todos)
│   │   ├── dashboard/           # Home do portal
│   │   └── files/               # GED — navegação e upload
│   └── api/
│       ├── auth/                # NextAuth handler
│       ├── communications/      # CRUD de comunicados
│       ├── content/             # CRUD da Central de Conteúdo + download
│       ├── files/               # Upload, listagem e download de arquivos
│       ├── folders/             # CRUD de pastas
│       ├── monitoring/          # Métricas do sistema
│       └── users/               # CRUD de usuários
│
├── components/
│   └── ui/
│       ├── content/             # ContentCard, ContentTypeIcon
│       ├── monitoring/          # StorageBar, MetricCard, BarChart, MiniBarChart
│       ├── CompanyBadge.tsx     # Badge colorido por empresa
│       ├── ConfirmDeleteButton.tsx
│       └── FormError.tsx
│
├── hooks/
│   └── useFormSubmit.ts         # Hook para estado loading/error em formulários
│
├── lib/
│   ├── api.ts                   # Helpers: ok, created, err, unauthorized…
│   ├── permissions.ts           # ROLES, COMPANIES, canManage, isAdmin…
│   ├── prisma.ts                # Singleton do Prisma Client
│   ├── prisma-errors.ts         # Tradução de erros Prisma (P2002, P2025…)
│   ├── supabase.ts              # Cliente Supabase (service role, server-only)
│   └── utils.ts                 # formatFileSize, formatDate, sanitizeDigits…
│
├── schemas/                     # Schemas Zod por domínio
│   ├── communication.schema.ts
│   ├── content.schema.ts
│   ├── file.schema.ts
│   ├── folder.schema.ts
│   └── user.schema.ts
│
├── services/                    # Lógica de negócio + queries Prisma
│   ├── communication.service.ts
│   ├── content.service.ts
│   ├── file.service.ts
│   ├── folder.service.ts
│   ├── monitoring.service.ts
│   └── user.service.ts
│
├── test/                        # Testes Vitest
│   ├── api/                     # Testes de API routes
│   ├── auth/                    # Testes de autenticação
│   ├── components/              # Testes de componentes React
│   ├── lib/                     # Testes de helpers
│   ├── schemas/                 # Testes de schemas Zod
│   └── services/                # Testes de services
│
└── types/                       # Tipos globais TypeScript
```

---

## Pré-requisitos

| Requisito | Versão mínima | Observação |
|-----------|---------------|------------|
| [Node.js](https://nodejs.org) | **20 LTS** | Necessário para o Next.js 16 |
| [npm](https://www.npmjs.com) | 10+ | Incluído com Node.js 20 |
| Conta [Supabase](https://supabase.com) | — | Free tier suficiente para desenvolvimento |
| Conta [Vercel](https://vercel.com) | — | Apenas para deploy em produção |
| Conta [Sentry](https://sentry.io) | — | Opcional — monitoramento de erros |

---

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `DATABASE_URL` | URL de conexão poolada do Prisma (porta 6543) | Supabase → Settings → Database → Connection string → URI |
| `DIRECT_URL` | URL direta para migrations (porta 5432) | Supabase → Settings → Database → Connection string → URI (sem pgbouncer) |
| `SUPABASE_URL` | URL do projeto Supabase | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (server-side only) | Supabase → Settings → API → `service_role` key |
| `NEXTAUTH_SECRET` | Segredo JWT — gere com `openssl rand -base64 32` | Gerado localmente |
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` em dev; URL do Vercel em produção |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN público do projeto Sentry | Sentry → Project → Settings → Client Keys |
| `SENTRY_AUTH_TOKEN` | Token para upload de source maps no CI | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Slug da organização no Sentry | URL do Sentry: `sentry.io/organizations/[slug]/` |
| `SENTRY_PROJECT` | Slug do projeto no Sentry | Sentry → Projects |

> **Atenção:** `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposto no frontend. Nunca use `NEXT_PUBLIC_` nessa variável.

---

## Como Rodar Localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/tiavapex01-dotcom/gp-seday-portal-local.git
cd gp-seday-portal-local
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Edite .env.local com seus valores reais
```

### 4. Criar os buckets no Supabase

No painel do Supabase, acesse **Storage** e crie dois buckets **privados**:

| Bucket | Tipo | Finalidade |
|--------|------|-----------|
| `uploads` | Privado | Arquivos do GED (por setor/empresa) |
| `content` | Privado | Ativos da Central de Conteúdo (logos, templates…) |

> Ambos devem ser **privados** — o acesso é sempre via proxy autenticado, nunca por URL direta.

### 5. Aplicar o schema no banco

```bash
npm run db:push
```

### 6. Popular o banco com dados iniciais

```bash
npm run db:seed
```

Isso cria as pastas raiz (setores) de cada empresa e os usuários de teste:

| E-mail | Senha | Role |
|--------|-------|------|
| `admin@gruposeday.com.br` | `admin123` | admin |
| `manager.avapex@gruposeday.com.br` | `manager123` | manager |
| `colaborador@gruposeday.com.br` | `colab123` | employee |

### 7. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento com Turbopack |
| `npm run build` | Gera o cliente Prisma e compila para produção |
| `npm run start` | Inicia o servidor de produção (requer build) |
| `npm run lint` | Executa o ESLint |
| `npm run db:push` | Aplica o schema Prisma no banco sem criar arquivos de migration |
| `npm run db:studio` | Abre o Prisma Studio (UI visual do banco) |
| `npm run db:seed` | Popula o banco com pastas raiz e usuários de teste |
| `npm test` | Executa todos os testes (262) uma vez |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run test:ui` | Interface visual do Vitest no browser |

---

## Deploy

### Vercel (recomendado)

O projeto está configurado para deploy automático via GitHub Actions ao fazer push em `main`.

**Configurar GitHub Secrets** (Settings → Secrets and variables → Actions):

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SENTRY_DSN   (opcional)
SENTRY_AUTH_TOKEN        (opcional)
SENTRY_ORG               (opcional)
SENTRY_PROJECT           (opcional)
```

**Pipeline CI/CD** (`.github/workflows/cloudflare-deploy.yml`):

```
checkout → npm ci → npm audit (--audit-level=high) → tsc --noEmit → npm run build
```

O build falha automaticamente se houver vulnerabilidades de severidade alta ou erros de tipagem.

### Variáveis de ambiente na Vercel

No painel da Vercel, acesse **Project → Settings → Environment Variables** e adicione as mesmas variáveis dos GitHub Secrets. A variável `NEXTAUTH_URL` deve apontar para a URL de produção do projeto (ex: `https://gp-seday-portal-local-531m.vercel.app`).

---

## Buckets Supabase

Os dois buckets precisam ser criados **manualmente** no painel do Supabase antes do primeiro deploy:

1. Acesse **Supabase Dashboard → Storage → New bucket**
2. Crie `uploads` — marque como **Private**
3. Crie `content` — marque como **Private**

Não configure políticas de acesso público — todo acesso é feito via service role key no servidor.

---

## Testes

O projeto usa **Vitest** com **@testing-library/react** para testes de componentes e mocks de Prisma para testes de services e API routes.

```bash
# Rodar todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Cobertura de código
npm run test:coverage

# Interface visual no browser
npm run test:ui
```

**Suítes de teste:**

| Diretório | O que testa |
|-----------|-------------|
| `src/test/api/` | API routes (autenticação, autorização, respostas) |
| `src/test/auth/` | Lógica de autenticação NextAuth |
| `src/test/components/` | Componentes React com Testing Library |
| `src/test/lib/` | Helpers (`api.ts`, `utils.ts`, `prisma-errors.ts`) |
| `src/test/schemas/` | Schemas Zod (validação, transformações, edge cases) |
| `src/test/services/` | Services com Prisma mockado |

---

## Contribuição

### Padrão de commits (Conventional Commits)

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
refactor: refatoração sem mudança de comportamento
test:     adição ou correção de testes
security: correção de vulnerabilidade ou hardening
chore:    tarefas de build, dependências, config
```

Exemplos:
```
feat(communications): add sector filter to listing
fix(auth): restrict manager DELETE to own communications only
security: add security headers and Zod input sanitization
```

### Regras de arquitetura

Antes de abrir um PR, verifique:

- [ ] Queries Prisma estão em `src/services/` — nunca em `src/app/api/`
- [ ] API routes usam helpers de `src/lib/api.ts` (`ok`, `err`, `unauthorized`…) — nunca `NextResponse.json()` diretamente
- [ ] Roles são referenciados via `ROLES.*` de `src/lib/permissions.ts` — nunca strings soltas
- [ ] Todo `prisma.create/update/delete` nos services tem `.catch(handlePrismaError)`
- [ ] Downloads de arquivos passam pelo proxy — nunca URL direta do Supabase
- [ ] Todo arquivo em `src/` tem o header `@context` com `@what`, `@purpose`, `@layer`
- [ ] `npm test` passa sem erros

---

## Licença

Uso interno — Grupo Seday. Todos os direitos reservados.
