# Fotomodel Pro

Plataforma de geração de modelos virtuais com IA para e-commerce de moda.

## Stack Tecnológica

- **Framework**: Next.js 15.5 (App Router)
- **Frontend**: React 19, Tailwind CSS 3.4
- **Backend/Database**: Supabase (Auth, Database, Storage)
- **State Management**: Zustand
- **Language**: TypeScript
- **Deployment**: Railway

## Design System

Este projeto utiliza um design system completo extraído do Figma usando MCP (Model Context Protocol).

### Paleta de Cores

```typescript
primary: {
  black: '#20202a',  // Botões primários
  DEFAULT: '#000000', // Preto padrão
}
sand: {
  light: '#e5ded6',   // Botões secundários
  DEFAULT: '#eae6de',  // Backgrounds accent
}
gray: {
  dark: '#2c2c2c',     // Dark UI elements
  DEFAULT: '#858180',  // Texto secundário
  light: '#f4f4f4',    // Backgrounds
}
success: {
  light: '#01c758',
  DEFAULT: '#29c115',
  dark: '#005927',
}
error: {
  light: '#ff2526',
  DEFAULT: '#c11515',
  dark: '#980001',
}
```

### Tipografia

- **FreightBigProBlack-Regular**: Títulos principais (44px)
- **Neue Haas Grotesk Display Pro**: UI text (16px, 18px)
- **Inter**: Corpo do texto (all weights)

### Componentes

- **Button**: 52px altura, 14px border-radius
- **Card**: 16px border-radius, subtle shadow
- **Input**: 48px altura, 8px border-radius

## Setup do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Preencha as variáveis:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_BANANA_API_KEY=your-google-banana-api-key
```

### 3. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL do arquivo `agent.md` para criar as tabelas
3. Configure as políticas RLS (Row Level Security)
4. Configure os buckets de Storage para uploads

### 4. Exportar Assets do Figma

Os assets identificados estão documentados em `/public/assets/README.md`.

Acesse o Figma: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel

Exporte:
- Logo (SVG/PNG)
- Ícones do WhatsApp e Apple (SVG)
- Ícones das ferramentas IA (SVG)
- Imagens exemplo de modelos

### 5. Configurar Fontes Customizadas

As fontes FreightBigPro e Neue Haas Grotesk Display Pro precisam ser adicionadas:

1. Baixe as fontes (se tiver licença)
2. Adicione em `/public/fonts/`
3. Configure em `app/layout.tsx` usando `next/font/local`

Ou use alternativas do Google Fonts:
- Playfair Display (similar ao FreightBigPro)
- Inter (similar ao Neue Haas Grotesk)

## Estrutura do Projeto

```
fotomodel-pro/
├── app/
│   ├── (auth)/
│   │   └── login/          # Tela de login/cadastro
│   ├── (main)/
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── criar/          # Fluxo de criação (6 etapas)
│   │   ├── galeria/        # Galeria de imagens
│   │   └── vestuario/      # Gestão de vestuário
│   ├── api/                # API Routes
│   ├── globals.css         # Estilos globais + design tokens
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Home (redireciona para login)
├── components/
│   ├── ui/                 # Componentes base (Button, Card, Input)
│   └── shared/             # Componentes compartilhados
├── lib/
│   ├── supabase/           # Clientes Supabase (browser/server)
│   └── utils/              # Utilities (cn, format, etc)
├── hooks/                  # React hooks customizados
├── types/                  # TypeScript types
│   └── database.types.ts   # Types do Supabase
├── public/
│   └── assets/             # Assets do Figma
├── middleware.ts           # Middleware de autenticação
└── agent.md                # Documentação técnica completa
```

## Desenvolvimento

```bash
# Rodar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar build de produção
npm run start

# Lint
npm run lint
```

Acesse: http://localhost:3000

## Próximos Passos

Siga o roadmap detalhado em `agent.md`:

### Fase 1: Setup Inicial ✅
- ✅ Criar projeto Next.js 15.5
- ✅ Configurar Tailwind com design tokens do Figma
- ✅ Instalar dependências (Supabase, Zustand)
- ✅ Criar estrutura de pastas
- ✅ Configurar clientes Supabase
- ✅ Criar componentes UI base

### Fase 2: Supabase Setup
- [ ] Criar tabelas no Supabase
- [ ] Configurar RLS policies
- [ ] Configurar Storage buckets
- [ ] Setup de autenticação (WhatsApp, Apple ID)

### Fase 3: Autenticação
- [ ] Implementar login page completa
- [ ] Integrar OAuth (WhatsApp/Apple)
- [ ] Criar fluxo de onboarding
- [ ] Session management

### Fase 4-12: Ver agent.md para roadmap completo

## Documentação Completa

Para especificações técnicas detalhadas, schemas do banco de dados, e roadmap completo, consulte:

📄 **[agent.md](./agent.md)** - Documentação técnica completa com 2.444 linhas de especificações extraídas do Figma

## Recursos

- [Figma Design](https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Licença

Proprietary - Todos os direitos reservados.
