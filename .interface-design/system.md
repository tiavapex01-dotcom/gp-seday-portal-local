# Design System — Portal Corporativo Interno Grupo Seday

## Direction
Personality: Sophistication & Trust
Foundation: Navy (corporate)
Depth: Borders + subtle elevation (shadow-sm), never heavy shadows on content cards
Audience: Funcionários corporativos — AVAPEX, SEDAY, INNOMACH
Density: Compact/medium — UI corporativo, não SaaS consumer

---

## Brand Colors
--color-seday:       #1a3a6b   (navy primário — sidebar, botões, links ativos)
--color-seday-light: #2554a0   (hover state de botões e links)
--color-avapex:      #f97316   (orange-500 — badge AVAPEX)
--color-innomach:    #059669   (emerald-600 — badge INNOMACH)

---

## Company Badge Colors
Estilo: sólido (fundo colorido + texto branco) — usado na Sidebar
AVAPEX:   bg-orange-500 text-white
SEDAY:    bg-blue-700   text-white
INNOMACH: bg-emerald-600 text-white

Estilo alternativo: soft (fundo claro + texto escuro) — disponível para tabelas
AVAPEX:   bg-orange-100 text-orange-800
SEDAY:    bg-blue-100   text-blue-800
INNOMACH: bg-green-100  text-green-800

---

## Role Badge Colors
admin:    bg-red-100    text-red-700
manager:  bg-blue-100   text-blue-700
employee: bg-gray-100   text-gray-600

---

## Status Badge Colors
active:   bg-green-100  text-green-700
inactive: bg-red-100    text-red-700
pinned:   bg-yellow-100 text-yellow-700

---

## Sector Badge Colors (Communications)
RH:                       bg-blue-100    text-blue-700
Financeiro:               bg-emerald-100 text-emerald-700
Manutenção:               bg-orange-100  text-orange-700
Administrativo:           bg-purple-100  text-purple-700
Diretoria:                bg-red-100     text-red-700
Segurança do Trabalho:    bg-yellow-100  text-yellow-700
Suprimentos/Almoxarifado: bg-teal-100    text-teal-700
Planejamento:             bg-indigo-100  text-indigo-700
TI:                       bg-sky-100     text-sky-700

---

## Tokens

### Spacing
Base: 4px (Tailwind default)
Scale: 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px), 12(48px)
Page padding: px-6 ou p-6 no content area
Card padding: p-4 (small), p-5 (medium), p-6 (form/large)
Section gap: mb-5 a mb-8

### Typography
Font: system-ui (Next.js default, Inter assumed)
Base size: text-sm (14px) — padrão para UI corporativo
Scale (Tailwind): text-xs(12px), text-sm(14px), text-base(16px), text-lg(18px), text-xl(20px), text-2xl(24px)
Page title: text-2xl font-bold text-gray-800
Section title: text-lg font-semibold text-gray-700
Label: text-sm font-medium text-gray-700
Helper/meta: text-xs text-gray-400 ou text-gray-500
Caption uppercase: text-xs font-semibold text-gray-400 uppercase tracking-wider

### Border Radius (verificado nos componentes reais)
Button:   rounded-lg  (8px)
Card:     rounded-xl  (12px)   ← IMPORTANTE: cards usam xl, não lg
Badge:    rounded-full
Input:    rounded-lg  (8px)
Modal:    rounded-xl  (12px)
Login card: rounded-2xl (16px)

### Shadows
Card default:    shadow-sm   (0 1px 3px rgba(0,0,0,0.08))
Card hover:      shadow-md   (0 4px 6px rgba(0,0,0,0.1))
Modal/login:     shadow-2xl

### Border Colors
Default card:  border-gray-200
Table:         border-gray-200 (header), border-gray-100 (rows)
Input default: border-gray-300
Input focus:   border não explícito + ring-2 ring-[#2554a0]
Pinned card:   border-yellow-300 bg-yellow-50

---

## Patterns

### Button Primary
Classes: bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60
Height: ~38px (py-2.5 + text-sm)
Usage: Ações primárias (Salvar, Publicar, Criar, Enviar, Entrar)

### Button Secondary
Classes: border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 px-4 py-2.5 text-sm
Usage: Ações secundárias (Cancelar, Voltar)

### Button Danger
Classes: bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded-lg font-medium disabled:opacity-60
Usage: Confirmar exclusão (ConfirmDeleteButton)

### Button Danger Outline (dois-cliques — primeiro estado)
Classes: bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-lg text-sm font-semibold
Usage: Primeiro clique de "Desativar usuário" (EditUserPage)

### Button Danger Solid (dois-cliques — segundo estado)
Classes: bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-semibold
Usage: Segundo clique de confirmação

### Button Icon/Small
Classes: text-xs px-1 py-0.5 rounded hover:bg-red-100 hover:text-red-600 text-gray-400
Usage: Ações inline em listas (ex: delete em FolderTree)

### Card Default
Classes: bg-white rounded-xl border border-gray-200 shadow-sm
Padding: p-4 (FileCard), p-5 (CommunicationCard), p-6 (formulários)
Hover: hover:shadow-md transition-shadow

### Card Pinned
Classes: bg-yellow-50 border-yellow-300 (todo o card muda, sem border-left)
Usage: CommunicationCard quando pinned=true

### Card Folder
Classes: bg-white border border-gray-200 rounded-xl px-3 py-3 hover:border-[#1a3a6b] hover:shadow-sm transition-all
Usage: Grid de subpastas no FilesPage

### Input Field
Classes: w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2554a0]
Height: ~36px
Textarea: + resize-none

### Select Field
Mesmas classes do Input Field

### Form Label
Classes: block text-sm font-medium text-gray-700 mb-1

### Form Error (inline)
Classes: text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2
Usage: FormError.tsx — sempre usar o componente, nunca inline

### Form Success
Classes: text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2
Usage: EditUserPage success state

### Badge Pill
Classes: text-xs font-medium px-2 py-0.5 rounded-full
Usage: roles, status, company, sector

### Sidebar
Width: w-60 (240px)   ← IMPORTANTE: não é 220px
Background: bg-[#1a3a6b]
Text padrão: text-white/70
Text ativo: text-white
Item ativo: bg-white/20
Item hover: hover:bg-white/10 hover:text-white
Item padding: px-3 py-2.5
Item radius: rounded-lg
Item font: text-sm font-medium

### Table
Container: bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
Header row: bg-gray-50 border-b border-gray-200
Header cell: text-left px-4 py-3 font-semibold text-gray-600 text-sm
Data row: border-b border-gray-100 hover:bg-gray-50
Data cell: px-4 py-3 text-sm
Value cell: text-gray-800 (primary), text-gray-600 (secondary)

### Page Header
Classes: flex items-center justify-between mb-5 (ou mb-6)
Title: text-2xl font-bold text-gray-800
Action button: bg-[#1a3a6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2554a0] transition-colors

### Section Heading (dentro de página)
Classes: text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2

### Empty State
Container: bg-white border border-dashed border-gray-300 rounded-xl p-8 (ou p-10 ou p-12) text-center
Icon: text-4xl mb-3
Text: text-gray-500 font-medium
Subtext: text-gray-400 text-sm mt-1

### Breadcrumb
Classes: flex items-center gap-1 text-sm text-gray-500 mt-1 flex-wrap
Link: hover:text-[#1a3a6b]
Active: font-medium text-[#1a3a6b]
Separator: /

### Modal Overlay
Classes: fixed inset-0 z-50 flex items-center justify-center bg-black/40
Container: bg-white rounded-xl shadow-xl p-6 w-80

---

## Superfícies (Surface Scale)
Level 0 — page background:    bg-gray-50 (#f9fafb)
Level 1 — card:               bg-white + border-gray-200 + shadow-sm
Level 2 — elevated/modal:     bg-white + shadow-xl (ou shadow-2xl para login)
Level 3 — sidebar:            bg-[#1a3a6b] (navy)

---

## Layout
Dashboard shell:
  - Sidebar: w-60, fixo, flex-col, h-full
  - Content: flex-1, overflow-auto, p-6 (ou px-6 py-6)
  - Fundo: bg-gray-50

Files page:
  - Sidebar interna: w-56, shrink-0
  - Main area: flex-1 min-w-0

---

## Inconsistências Conhecidas
- Login usa `rounded-2xl shadow-2xl` enquanto demais modais usam `rounded-xl shadow-xl`
- FormError na login page é inline (não usa componente FormError) — candidato à refatoração
- `py-2.5` nos botões de página inteira vs `py-1.5` nos botões inline de modal (inconsistência de tamanho aceitável por contexto)

---

## Estado do Sistema
Versão: 1.0
Criado: 2026-05-18
Baseado em: análise dos componentes reais do projeto (Sidebar, CommunicationCard, FileCard, FolderTree, FormError, ConfirmDeleteButton, login/page.tsx, admin/page.tsx, files/page.tsx)
