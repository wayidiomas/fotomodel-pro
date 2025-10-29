# Instruções Técnicas - Fotomodel Pro

## Visão Geral do Projeto

Fotomodel Pro é uma aplicação web desenvolvida em estrutura monolito usando banco de dados Supabase e API do Supabase para endpoints de leitura (get tables, views, etc).

### Stack Tecnológica
- **Framework**: Next.js 15.5 (App Router)
- **Frontend**: React 19, Tailwind CSS 3.4
- **Backend/Database**: Supabase (auth, database, API, storage)
- **Validação**: Zod Schema
- **State Management**: Zustand (para estados globais)
- **IA**: Google Nano Banana API
- **Deploy**: Railway (serviço único)

### Configuração de Ambiente (.env)
```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Banana API
GOOGLE_BANANA_API_KEY=
GOOGLE_BANANA_API_ENDPOINT=

# Meta/WhatsApp (já configurado com 2FA)
META_APP_ID=
META_APP_SECRET=
WHATSAPP_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=

# Gmail/Apple Auth
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Bubble.io Integration
BUBBLE_API_KEY=
BUBBLE_API_ENDPOINT=

# Railway
RAILWAY_TOKEN=
NODE_ENV=production

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
```

### Assets e Design System

**Importante**: Todo material gráfico do Fotomodel está no Figma (file: omMAQB8nq3QqmNE3tExdMU).

**Design Tokens extraídos do Figma:**
- **Cores principais**:
  - Preto: #000000 / #20202a (botões primários)
  - Branco: #FFFFFF
  - Cinza: #f4f4f4 (backgrounds), #858180 (texto secundário)
  - Bege/Sand: #e5ded6, #eae6de (backgrounds accent)
  - Azul: #eceff1 (backgrounds secundários)
  - Verde sucesso: #29c115, #01c758
  - Vermelho erro: #c11515, #ff2526
  - Azul info: #blue-50, #blue-500, #blue-900

- **Tipografia**:
  - Títulos grandes: FreightBigProBlack-Regular, 44px, line-height: 44px
  - Títulos médios: Inter Bold, 24px, line-height: 32px
  - Títulos pequenos: Inter Semi Bold, 20px, 18px, 16px, 14px
  - Corpo: Inter Regular, 18px, 16px, 14px
  - Linha: Inter Medium, 14px (botões e links)

- **Espaçamentos**:
  - Gaps principais: 32px, 24px, 16px, 15px, 12px, 10px, 8px
  - Padding containers: 40px, 32px, 28px, 25px, 24px
  - Border radius: 16px (cards), 14px (botões médios), 12px (botões pequenos), 8px (imagens), 6px (inputs)

- **Componentes**:
  - **Botão Primário**: bg-black (#20202a), texto branco, rounded-12px, height: 44px, padding: 12.5px 32px
  - **Botão Secundário**: bg-white, border gray-300, texto preto, rounded-12px, height: 44px
  - **Badge**: border slate-200, rounded-full, padding: 3px 11px, font: Inter Semi Bold 14px
  - **Card**: bg-white, border gray-100, rounded-16px, shadow sutil
  - **Input/Upload area**: border gray-200, rounded-8px

---

## Estrutura do Projeto Next.js

### Arquitetura - App Router (Next.js 15.5)

```
fotomodel-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── verificar/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── criar/
│   │   │   ├── [etapa]/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── galeria/
│   │   │   └── page.tsx
│   │   ├── vestuario/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── whatsapp/route.ts
│   │   │   ├── gmail/route.ts
│   │   │   └── apple/route.ts
│   │   ├── upload/route.ts
│   │   ├── generate/route.ts
│   │   └── bubble/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── modal.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── verification-code.tsx
│   ├── dashboard/
│   │   ├── header.tsx
│   │   ├── generation-card.tsx
│   │   ├── tools-carousel.tsx
│   │   └── recent-downloads.tsx
│   ├── criar/
│   │   ├── stepper.tsx
│   │   ├── upload-area.tsx
│   │   ├── tips-card.tsx
│   │   └── results-preview.tsx
│   └── shared/
│       ├── navbar.tsx
│       └── footer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── upload.ts
│   │   └── creation.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── constants.ts
│   └── stores/
│       ├── user-store.ts
│       └── creation-store.ts
├── hooks/
│   ├── use-user.ts
│   ├── use-upload.ts
│   └── use-creation.ts
├── types/
│   ├── database.types.ts
│   ├── supabase.ts
│   └── index.ts
├── public/
│   └── assets/
│       ├── icons/
│       ├── images/
│       └── illustrations/
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Configurações do Next.js

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3845', // Figma MCP assets
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Para uploads
    },
  },
};

module.exports = nextConfig;
```

#### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens do Figma
        primary: {
          black: '#20202a',
          DEFAULT: '#000000',
        },
        sand: {
          light: '#e5ded6',
          DEFAULT: '#eae6de',
        },
        success: {
          light: '#01c758',
          DEFAULT: '#29c115',
          dark: '#005927',
        },
        error: {
          light: '#ff2526',
          DEFAULT: '#c11515',
          dark: '#980001',
        },
      },
      fontFamily: {
        freight: ['FreightBigProBlack-Regular', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        haas: ['Neue Haas Grotesk Display Pro', 'sans-serif'],
      },
      fontSize: {
        'title-xl': ['44px', { lineHeight: '44px' }],
        'title-lg': ['24px', { lineHeight: '32px' }],
        'title-md': ['20px', { lineHeight: '28px' }],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        'button-md': '14px',
        input: '8px',
        badge: '6px',
      },
    },
  },
  plugins: [],
};

export default config;
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### package.json
```json
{
  "name": "fotomodel-pro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  },
  "dependencies": {
    "next": "15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.400.0",
    "react-hot-toast": "^2.4.1",
    "embla-carousel-react": "^8.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "15.5.0"
  }
}
```

### Configuração do Supabase Client

#### lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### lib/supabase/server.ts
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component - não pode setar cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component - não pode remover cookies
          }
        },
      },
    }
  );
}
```

#### middleware.ts
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

#### lib/supabase/middleware.ts
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas protegidas
  const protectedRoutes = ['/dashboard', '/criar', '/galeria', '/vestuario'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirecionar usuário logado da página de login
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
```

### Layouts Principais

#### app/layout.tsx (Root Layout)
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Fotomodel Pro - Modelos Virtuais. Resultados Reais',
  description: 'Crie modelos virtuais profissionais para suas roupas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

#### app/(main)/layout.tsx (Main App Layout)
```typescript
import { Navbar } from '@/components/shared/navbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main>{children}</main>
    </div>
  );
}
```

### Geração de Types do Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Gerar types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

---

## 1. Fluxo Login/Cadastro

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=2-104&m=dev

### Telas do Fluxo

#### 1.1 Splash Screen
- Background: branco
- Texto centralizado: "Splash" (48px, preto)
- Duração: 2-3 segundos

#### 1.2 Tela de Boas-Vindas
**Layout extraído do Figma:**
- **Dimensões**: iPhone 16 (390x844px), rounded-23px
- **Background**: Imagem de mulher praticando yoga (young woman practicing yoga healthy wellbeing)
  - Posicionamento: centralizado, com overflow para criar efeito cinematográfico
  - Gradiente overlay: de transparente (top) para branco (#ffffff) em 61.522%

- **Logo**: image-Photoroom (1) 1 (190x90px)
  - Posicionamento: centralizado horizontalmente, top: 381px

- **Seção de Boas-Vindas** (bottom: 525px):
  - **Título**: "Bem-vindo a Fotomodel"
    - Font: FreightBigProBlack-Regular
    - Size: 44px
    - Line-height: 44px
    - Color: black
    - Text-align: center
    - Width: 343px

  - **Subtítulo**: "Modelos Virtuais. Resultados Reais"
    - Font: Neue Haas Grotesk Display Pro 55 Roman
    - Size: 18px
    - Line-height: 1.6
    - Letter-spacing: -0.054px
    - Color: black
    - Text-align: center

  - **Gap entre elementos**: 23px, 10px

- **Botões de Autenticação** (gap: 12px):

  1. **Botão WhatsApp**:
     - Background: rgba(229,222,214,0.5) (bege translúcido)
     - Width: 322px
     - Height: 52px
     - Border-radius: 14px
     - Padding: 10px
     - Ícone: mingcute:whatsapp-fill (22x22px), cor verde
     - Texto: "Entrar com WhatsApp"
       - Font: Neue Haas Grotesk Display Pro 55 Roman
       - Size: 16px
       - Color: black
     - Gap icon-text: 10px

  2. **Botão Apple ID**:
     - Background: #2c2c2c (preto)
     - Width: 322px
     - Height: 52px
     - Border-radius: 14px
     - Padding: 10px
     - Ícone: ic:baseline-apple (18x22px), cor branca
     - Texto: "Entrar com Apple ID"
       - Font: Neue Haas Grotesk Display Pro 55 Roman
       - Size: 16px
       - Color: white
     - Gap icon-text: 10px

- **Barra Superior** (iPhone Notch):
  - Height: 54px (18px top + 14px bottom padding)
  - Horário: 3:27 (SF Pro Medium, 17px, -0.408px tracking)
  - Status icons: Cellular, WiFi, Battery (78.261x13px)

- **Home Indicator** (bottom):
  - Height: 5px
  - Width: 134px
  - Bottom: 8px
  - Border-radius: full
  - Color: white com overlay

### Funcionalidades Técnicas

#### Autenticação via WhatsApp
1. Usuário clica em "Entrar com WhatsApp"
2. Modal para inserir número de telefone (formato internacional)
3. Sistema envia código 2FA via WhatsApp (template já configurado)
4. Usuário insere código de 6 dígitos
5. Sistema cria ou faz login:
   - Se novo usuário: cria email `[numero_telefone]@fotomodelpro.com`
   - Usa Supabase Auth (JWT tokens)
   - Chama API Bubble.io para verificar se usuário já existe no app mobile
   - Se existe: importa créditos da conta mobile
6. Redireciona para Dashboard

#### Autenticação via Apple ID
1. Usuário clica em "Entrar com Apple ID"
2. Modal de OAuth do Apple
3. Retorna com email e dados básicos
4. Envia código de verificação de 6 dígitos para o email
5. Código válido por 1 dia (24 horas)
6. Sistema cria ou faz login usando Supabase Auth
7. Redireciona para Dashboard

#### Autenticação via Gmail
**Nota**: Não temos tela de design no Figma para Gmail. Basear no mobile existente.

1. Usuário clica em "Entrar com Gmail"
2. Modal de OAuth do Google
3. Retorna com email e dados básicos
4. Envia código de verificação de 6 dígitos para o email
5. Código válido por 1 dia (24 horas)
6. Sistema cria ou faz login usando Supabase Auth
7. Redireciona para Dashboard

### Especificações Técnicas do Auth

1. **Schema Supabase Auth**:
   - Usar schema padrão do Supabase com JWT tokens
   - Soft delete: adicionar campo `is_deleted` em tabelas críticas

2. **Tabela Users** (exemplo):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  auth_provider VARCHAR(20) NOT NULL, -- 'whatsapp', 'gmail', 'apple'
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);
```

3. **Integração Bubble.io**:
   - Endpoint: GET `/api/users/check?phone={phone}`
   - Response: `{ exists: boolean, credits: number }`
   - Se exists = true: importar créditos para conta Supabase

---

## 2. Fluxo Dashboard

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=631-2138&m=dev

### Layout Geral

**Dimensões**: 1920px width, light theme
**Background**: gray-50 (#f9fafb)

### Header (64px height)

**Estrutura extraída do Figma:**
- Background: white
- Border-bottom: 1px solid slate-200
- Padding: 0 32px

**Componentes do Header:**

1. **Logo Fotomodel** (esquerda):
   - Dimensions: 175.53px x 32px
   - File: Fotomodel Logo.png

2. **Navegação** (centro-esquerda, margin-left: 32px):
   - **Items** (gap: 16px):
     - Dashboard (ativo): bg-rgba(212,212,212,0.33), rounded-6px, padding: 7.5px 12px
     - Criar: padding: 7.5px 12px, color: gray-600
     - Vestuário: padding: 7.5px 12px, color: gray-600
     - Galeria: padding: 7.5px 12px, color: gray-600
     - Modelos: padding: 7.5px 12px, color: gray-600
     - Histórico: padding: 7.5px 12px, color: gray-600
   - Font: Inter Medium, 14px, line-height: 20px
   - Color ativo: #20202a
   - Color inativo: gray-600

3. **Créditos e Ações** (direita):
   - **Badge de Créditos**:
     - Border: 1px solid slate-200
     - Border-radius: 9999px (full)
     - Padding: 3px 11px
     - Text: "234 créditos"
     - Font: Inter Semi Bold, 14px, line-height: 20px
     - Color: #020817

   - **Botão Recarregar** (margin-left: 8px):
     - Background: white
     - Border: 1px solid slate-200
     - Border-radius: 6px
     - Height: 36px
     - Padding: 7.5px 13px
     - Icon: adicionar créditos (16x16px)
     - Text: "Recarregar"
     - Font: Inter Medium, 14px
     - Gap icon-text: 8px

   - **Menu Button** (margin-left: 16px):
     - Border-radius: 6px
     - Size: 36x36px
     - Padding: 12px
     - Icon: menu (16x16px)

### Main Content (padding: 10px 28px 32px)

#### Seção 1: Cards de Opções de Geração (gap: 24px)

**Card 1: Cabide**
- **Dimensões**: flex-grow, height: 272px
- **Background**: #eae6de (bege/sand)
- **Border-radius**: 14px
- **Padding**: 32px (left), 32px (top/bottom)
- **Overflow**: clip (para conter ilustração)

**Conteúdo:**
- **Ícone** (48x48px):
  - Background: rgba(255,255,255,0.2)
  - Border-radius: 8px
  - SVG: cabide icon (24x24px)

- **Título**: "Cabide"
  - Font: Inter Bold, 24px, line-height: 32px
  - Color: black

- **Descrição**: "Visualize suas peças a partir de roupas no cabide"
  - Font: Inter Regular, 16px, line-height: 24px
  - Color: black
  - Margin-bottom: 8px

- **Botão "Começar agora"**:
  - Background: #20202a (preto)
  - Color: white
  - Border-radius: 6px
  - Height: 40px
  - Padding: 9.5px 16px
  - Font: Inter Medium, 14px, line-height: 20px
  - Icon: seta direita (16x16px)
  - Gap: 8px
  - Shadow: 0px 4px 4px 0px rgba(0,0,0,0.25)

- **Ilustração** (direita):
  - 2 vetores de roupas em cabide (114.99x156.141px cada)
  - Seta indicativa rotacionada 104.203deg
  - Overlay circular: size 128x128px, bg: rgba(255,255,255,0.1), position: bottom-right -64px

**Card 2: Superfície Plana**
- Mesma estrutura do Card 1
- **Background**: #eceff1 (azul claro/cinza)
- **Título**: "Superfície plana"
- **Descrição**: "Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão."
- Ilustração diferente (roupas em superfície)

#### Seção 2: Ferramentas de IA (Carrossel)

**Heading** (gap: 16px vertical):
- **Título**: "Ferramentas de IA"
  - Font: Inter Bold, 24px, line-height: 32px
  - Color: gray-900

- **Botão "Ver todas"**:
  - Color: blue-600
  - Font: Inter Medium, 14px, line-height: 20px
  - Border-radius: 6px
  - Padding: 10.5px 16px

**Carrossel de Cards** (gap: 16px horizontal):

Cada card tem estrutura:
- **Dimensões**: 337.59px x auto
- **Background**: white
- **Border-radius**: 8px
- **Padding**: 24px

**Card 1: Removedor de Fundo**
- Ícone: scissors (24x24px) em box 48x48px
  - Background icon: gray-100, rounded-8px
- Título: "Removedor de Fundo"
  - Font: Inter Medium, 14px, line-height: 17.5px
  - Color: gray-900
- Badge "Beta" (top-right):
  - Background: blue-100
  - Border: 1px solid blue-200
  - Border-radius: 9999px
  - Padding: 3px 11px
  - Text: "Beta"
  - Font: Inter Semi Bold, 12px, line-height: 16px
  - Color: blue-600

**Card 2: Gerador de Fundo IA**
- Mesma estrutura
- Ícone: sparkles
- Sem badge

**Card 3: Melhorador de Imagem**
- Mesma estrutura
- Ícone: image enhance
- Opacity: 0.6 (desabilitado)
- Badge "Em breve":
  - Background: gray-100
  - Border: 1px solid gray-300
  - Color: gray-600

**Card 4: Removedor de Objetos IA**
- Ícone: eraser
- Badge "Beta"

**Card 5: Modelo IA - Manequim**
- Ícone: mannequin
- Sem badge

**Nota**: O carrossel tem scroll horizontal. Total width: ~2352px

#### Seção 3: Downloads Recentes

**Heading**:
- Título: "Downloads recentes"
  - Font: Inter Bold, 24px, line-height: 32px
  - Color: gray-900

- **Botões de Navegação** (direita):
  - Background: #eceff1
  - Size: 32x32px
  - Border-radius: 6px
  - Gap: 8px
  - Icons: setas esquerda/direita (16x16px)

**Carrossel de Imagens** (gap: 20px):
- Cada card: 205px width x 274px height
- Border-radius: 8px
- Total de 12+ cards visíveis
- Imagens: fotos de modelos geradas (Card 1-12)
- Backgrounds variados: #ece0e0, #c3c2c7, #dcdcdc, #eeeeec, #959698, #bdb4ad

#### Seção 4: Somente para Você

**Heading**:
- **Título**: "Somente para você"
  - Font: Inter Bold, 24px, line-height: 32px

- **Subtítulo**: "Finalize suas criações anteriores com desconto especial"
  - Font: Inter Regular, 14px, line-height: 20px
  - Color: gray-600

- **Temporizador** (direita):
  - Label: "Renova em:"
    - Font: Inter Light, 16px
    - Color: black

  - **Contadores** (02:02:02):
    - Background: #e5ded6 (bege)
    - Border-radius: 3px
    - Padding: 6px
    - Font: Inter Regular, 16px
    - Color: #744d2e (marrom)
    - Separator: ":" (10px, black)

- **Botões de Navegação**: mesmos da seção anterior

**Carrossel de Imagens**:
- Mesma estrutura da seção Downloads Recentes
- Overlay escuro em todas as imagens (opacity: 0.7)
- Imagens semi-transparentes para indicar "desconto/oferta"

### Funcionalidades Técnicas (Next.js)

#### app/dashboard/page.tsx
```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { GenerationCards } from '@/components/dashboard/generation-cards';
import { ToolsCarousel } from '@/components/dashboard/tools-carousel';
import { RecentDownloads } from '@/components/dashboard/recent-downloads';
import { OnlyForYou } from '@/components/dashboard/only-for-you';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single();

  // Ferramentas IA
  const { data: tools } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  // Downloads recentes do usuário
  const { data: recentDownloads } = await supabase
    .from('user_downloads')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(12);

  // Criações incompletas (Somente para você)
  const { data: incompleteCreations } = await supabase
    .from('user_creations')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'incomplete')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(12);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} credits={userData?.credits ?? 0} />

      <main className="px-7 py-2.5 pb-8">
        <GenerationCards />

        <div className="mt-8">
          <ToolsCarousel tools={tools ?? []} />
        </div>

        <div className="mt-8">
          <RecentDownloads downloads={recentDownloads ?? []} />
        </div>

        {incompleteCreations && incompleteCreations.length > 0 && (
          <div className="mt-8">
            <OnlyForYou creations={incompleteCreations} />
          </div>
        )}
      </main>
    </div>
  );
}

// Revalidar a cada 60 segundos
export const revalidate = 60;
```

#### components/dashboard/header.tsx (Client Component)
```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: User;
  credits: number;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Criar', href: '/criar' },
  { name: 'Vestuário', href: '/vestuario' },
  { name: 'Galeria', href: '/galeria' },
  { name: 'Modelos', href: '/modelos' },
  { name: 'Histórico', href: '/historico' },
];

export function Header({ user, credits }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard">
            <Image
              src="/assets/images/fotomodel-logo.png"
              alt="Fotomodel Pro"
              width={175.53}
              height={32}
              priority
            />
          </Link>

          {/* Navegação */}
          <nav className="ml-8 flex items-start gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[rgba(212,212,212,0.33)] text-[#20202a]'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Créditos e Ações */}
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-200 px-3 py-1">
            <span className="text-sm font-semibold text-[#020817]">
              {credits} créditos
            </span>
          </div>

          <Link
            href="/recarregar"
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-[#020817] transition-colors hover:bg-gray-50"
          >
            <PlusIcon className="h-4 w-4" />
            Recarregar
          </Link>

          <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
            <MenuIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 3.333v9.334M12.667 8H3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
```

#### components/dashboard/tools-carousel.tsx (Client Component)
```typescript
'use client';

import { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  status: 'active' | 'beta' | 'coming_soon';
}

interface ToolsCarouselProps {
  tools: Tool[];
}

export function ToolsCarousel({ tools }: ToolsCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-8 text-gray-900">
          Ferramentas de IA
        </h2>
        <button className="rounded-md px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
          Ver todas
        </button>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="relative min-w-[337.59px] shrink-0 rounded-lg bg-white p-6"
              style={{ opacity: tool.status === 'coming_soon' ? 0.6 : 1 }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Image
                    src={tool.icon_url}
                    alt={tool.name}
                    width={24}
                    height={24}
                  />
                </div>
                <h4 className="text-center text-sm font-medium leading-[17.5px] text-gray-900">
                  {tool.name}
                </h4>
              </div>

              {tool.status !== 'active' && (
                <div className="absolute right-2 top-6">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      tool.status === 'beta'
                        ? 'border-blue-200 bg-blue-100 text-blue-600'
                        : 'border-gray-300 bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tool.status === 'beta' ? 'Beta' : 'Em breve'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### hooks/use-countdown.ts (Custom Hook)
```typescript
'use client';

import { useState, useEffect } from 'react';

export function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}
```

#### lib/utils/constants.ts
```typescript
// Opções de geração
export const GENERATION_OPTIONS = [
  {
    id: 'cabide',
    name: 'Cabide',
    description: 'Visualize suas peças a partir de roupas no cabide',
    background: '#eae6de',
    icon: 'cabide',
  },
  {
    id: 'superficie-plana',
    name: 'Superfície plana',
    description: 'Crie a(o) modelo a partir de foto da roupa em cima de uma mesa ou balcão.',
    background: '#eceff1',
    icon: 'superficie-plana',
  },
  {
    id: 'flutuante',
    name: 'Roupa Flutuante',
    description: 'Roupa flutuando no ar com efeito profissional',
    background: '#f5f5f5',
    icon: 'flutuante',
  },
  {
    id: 'manequim',
    name: 'Manequim',
    description: 'Sua roupa em um manequim realista',
    background: '#fff5f5',
    icon: 'manequim',
  },
  {
    id: 'corpo',
    name: 'Roupa no Corpo',
    description: 'Modelo virtual usando sua roupa',
    background: '#f0fff4',
    icon: 'corpo',
  },
] as const;

export type GenerationOptionId = typeof GENERATION_OPTIONS[number]['id'];
```

---

## 3. Fluxo Criar

**Link Figma Base**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=704-9286&m=dev

### Visão Geral do Fluxo

O fluxo de criação possui **6 etapas** indicadas por um stepper no topo:
1. Selecionar Roupa
2. Categorização
3. Selecionar Modelos
4. Personalizar modelo
5. Selecionar Fundo
6. Resultados

### Stepper Component (Etapas)

**Layout extraído do Figma:**
- **Container**:
  - Background: white
  - Border-bottom: 1px solid gray-200
  - Padding: 16px 36px
  - Gap entre etapas: 32px

**Estrutura de cada etapa:**
- **Badge numerado**:
  - Size: 32x32px
  - Border-radius: 9999px (circle)
  - Font: Inter Semi Bold, 14px

  **Estados:**
  - Ativo: bg-black (#20202a), color: white
  - Inativo: bg-gray-300, color: white
  - Completo: bg-black com checkmark

- **Label da etapa**:
  - Font: Inter Medium, 14px, line-height: 20px
  - Color ativo: gray-900
  - Color inativo: gray-400
  - Margin-left: 8px

**Botão "Prosseguir"** (direita):
- Background: #20202a (preto)
- Border-radius: 120px (pill)
- Padding: 7px 24px
- Text: "Prosseguir"
  - Font: Inter Medium, 14px
  - Color: white
- Icon: seta direita (weui:arrow-filled, 7x10px)
- Gap: 14px

### Etapa 1: Selecionar Roupa

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=704-10385&m=dev

#### Popups Educacionais (antes do upload)

**Popup 1: "O que NÃO fazer"** (node-id: 704-9286)
- Background overlay: rgba(0,0,0,0.25)
- Modal: 711px width, bg-white, rounded-16px, padding: 40px 80px 34px
- Título: "Dicas para melhores resultados"
- Seção: "O que não funciona..."
- 2 imagens com X vermelho
- Botão "Próximo" (continuar)
- Botão X (fechar) no canto superior direito

**Popup 2: "O que fazer"** (node-id: 704-10062)
- **Estrutura extraída do Figma:**
  - Background overlay: rgba(0,0,0,0.25)
  - **Modal**:
    - Width: 711px
    - Background: white
    - Border-radius: 16px
    - Padding: 40px 80px 34px
    - Gap: 15px

- **Conteúdo:**
  - **Título**: "Dicas para melhores resultados"
    - Font: Inter Bold, 24px
    - Color: black
    - Text-align: center

  - **Subtítulo**: "O que funciona melhor..."
    - Font: Inter Regular, 18px
    - Color: black
    - Text-align: center
    - Height: 34px

  - **Imagens de Exemplo** (gap: 15px):
    - 2 imagens (184x245px e 183x243.619px)
    - Border-radius: 8px
    - Overlays com checkmarks verdes:
      - Background: #29c115
      - Border: 1px solid white
      - Border-radius: 38px (circle)
      - Size: 35x35px
      - Icon: material-symbols:check-rounded (14x13px)
      - Position: bottom center de cada imagem

  - **Descrição**:
    - Text: "Uma foto frontal da peça em um manequim, com boa iluminação e sem rugas"
    - Font: Inter Regular, 15px
    - Color: gray-600
    - Width: 469px
    - Text-align: center

  - **Botão "Continuar"**:
    - Background: gray-900
    - Border-radius: 12px
    - Height: 44px
    - Padding: 11.5px 32px
    - Text: "Continuar"
    - Font: Inter Medium, 14px, line-height: 20px
    - Color: white
    - Width: full

  - **Botão Fechar** (top-right):
    - Background: #f4f4f4
    - Size: 50x50px
    - Border-radius: 13px
    - Icon: basil:cross-outline (20x20px)
    - Position: absolute, left: 643px, top: 15px

#### Tela Principal de Upload

**Layout extraído do Figma (node-id: 704-10385):**

**Main Container**:
- Padding: 29px 40px
- Gap: 50px
- Flex: row

**Área de Upload (esquerda)**:
- **Card Container**:
  - Background: white
  - Border: 1px solid gray-100
  - Border-radius: 16px
  - Width: 1112px
  - Height: 902px
  - Padding: 37px 28px
  - Gap: 35px

- **Título da Ferramenta**:
  - Text: "Roupa em manequim"
  - Font: Inter Semi Bold, 20px
  - Background: rounded-pill
  - Padding: 12px 45px
  - Border-radius: 9999px
  - Text-align: center

- **Área de Upload/Preview**:
  - Width: 389px
  - Height: 517px
  - Border-radius: 8px
  - Background: image loading state

  **Loading State:**
  - Text: "Carregando imagem..."
    - Font: Inter Regular, 18px
    - Color: #9a9a9a
    - Position: center
  - Icon: line-md:loading-loop (51x51px)
    - Position: center, acima do texto

  **Botão Remover** (top-right):
  - Background: black
  - Border: 3px solid white
  - Size: 44x44px
  - Border-radius: 31px
  - Icon: basil:cross-outline (12x11px, white)
  - Position: absolute, right: -22px, top: -22px

**Painel Lateral Direito** (373.344px width):

**Card 1: Dicas para Melhores Resultados**
- Background: white
- Border: 1px solid gray-200
- Border-radius: 16px
- Padding: 25px
- Gap: 15px

**Conteúdo:**
- **Título**: "Dicas para melhores resultados"
  - Font: Inter Bold, 20px
  - Color: gray-900

- **Descrição**:
  - Text: "Fotos da peça aberta, mostrando todos os seus detalhes, inteira (sem cortar a foto) e com boa iluminação."
  - Font: Inter Regular, 14px
  - Color: gray-600
  - Text-align: center
  - Width: 302px

- **Exemplos Visuais** (gap: 15px):
  - 3 imagens (94x126px, 95x126px, 95x126px)
  - Border-radius: 8px
  - Checkmarks verdes nos exemplos bons:
    - Background: #29c115
    - Border: 1px solid white
    - Size: 30x30px
    - Position: bottom center

- **"O que Evitar"**:
  - Título: "O que Evitar"
    - Font: Inter Bold, 18px
    - Color: gray-900

  - **Lista**:
    - Text: "Não é compatível com:"
    - Items:
      - "• Roupas em superfície plana ou cabide."
      - "• Acessórios (joias, relógio, boné, chapéu etc.)"
    - Font: Inter Regular, 14px
    - Color: gray-600
    - Width: 284px

- **Exemplos do que evitar**:
  - 3 imagens com X vermelho:
    - Background: #c11515
    - Border: 1px solid white
    - Size: 30x30px
    - Icon: maki:cross (13x11.375px)

- **Indicadores de Página** (dots):
  - Size: 7x7px cada
  - Border-radius: 14px (circle)
  - Colors:
    - Ativo: #858180
    - Inativo: rgba(133,129,128,0.17)
  - Gap: 6px

**Card 2: Dicas Profissionais**
- Background: blue-50 (#eff6ff)
- Border: 1px solid blue-200
- Border-radius: 16px
- Padding: 25px
- Gap: 10px

**Conteúdo:**
- **Ícone Info**:
  - Background: blue-500
  - Size: 32x32px
  - Border-radius: 9999px
  - Icon: info (10.5x14px, white)

- **Título**: "Dicas Profissionais"
  - Font: Inter Semi Bold, 16px, line-height: 24px
  - Color: blue-900

- **Lista de Dicas** (gap: 8px):
  - Font: Inter Regular, 14px
  - Color: blue-800
  - Items:
    - "• Use iluminação natural sempre que possível"
    - "• Certifique-se de que a peça esteja livre de rugas"
    - "• Tire fotos diretamente de cima"
    - "• Use um fundo limpo e neutro"
    - "• Evite sombras e reflexos"

**Botão Ajuda (floating)**:
- Background: gray-900
- Border: 1px solid gray-200
- Size: 74x74px
- Border-radius: 99px
- Icon: bxs:chat (41x41px, white)
- Position: absolute, bottom-right (left: 1610px, top: 993px)

### Funcionalidades Técnicas - Etapa 1

```javascript
// Estado do upload
const [uploadState, setUploadState] = useState({
  file: null,
  loading: false,
  preview: null,
  error: null
});

// Upload handler
const handleUpload = async (file) => {
  setUploadState({ ...uploadState, loading: true });

  // Validações
  const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validFormats.includes(file.type)) {
    setUploadState({ error: 'Formato inválido' });
    return;
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    setUploadState({ error: 'Arquivo muito grande (max 10MB)' });
    return;
  }

  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('garment-uploads')
    .upload(`${userId}/${Date.now()}_${file.name}`, file);

  if (error) {
    setUploadState({ error: error.message });
    return;
  }

  // Gerar preview
  const preview = URL.createObjectURL(file);
  setUploadState({
    file: data,
    preview,
    loading: false,
    error: null
  });

  // Salvar no banco
  await supabase.from('user_uploads').insert({
    user_id: userId,
    file_path: data.path,
    file_name: file.name,
    file_size: file.size,
    status: 'uploaded'
  });
};
```

### Etapas 2-5 (em desenvolvimento)

**Nota**: As telas das etapas 2-5 ainda não foram completamente extraídas do Figma devido ao tamanho da resposta. O fluxo geral é:

2. **Categorização**: Usuário seleciona categoria da peça (camisa, calça, vestido, etc.)
3. **Selecionar Modelos**: Escolha de poses/modelos para visualização
4. **Personalizar modelo**: Ajustes de cor de pele, cabelo, corpo
5. **Selecionar Fundo**: Escolha de background ou geração via IA
6. **Resultados**: Preview e confirmação (ver próxima seção)

### Etapa 6: Resultados

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=704-11679&m=dev

**Layout extraído do Figma:**

**Main Container**:
- Padding: 29px 40px
- Gap: 50px
- Flex: row

**Área de Resultados (esquerda)**:
- **Card Container**:
  - Background: white
  - Border: 1px solid gray-100
  - Border-radius: 16px
  - Width: 1112px
  - Height: 906px
  - Padding: 40px 57px
  - Gap: 30px

**Layout de Visualização:**
- **Thumbnails (esquerda)** (gap: 10px vertical):
  - 3 opções de resultado
  - Thumbnail 1 (ativa):
    - Border: 2px solid black
    - Width: 102px, Height: 106px
    - Border-radius: 6px
  - Thumbnails 2-3:
    - Border: 2px solid white
    - Size: 105x105px, 102x107px
    - Opacity: 0.56
    - Border-radius: 6px

- **Imagem Principal** (centro):
  - Width: 479px, Height: 692px
  - Border-radius: 16px
  - Background: #ece0e0

  **Marca d'água**:
  - Logo Fotomodel (vazada)
  - Opacity: 0.51
  - Rotação: 315deg (diagonal)
  - Dimensions: 369.042px x 108.71px
  - Position: top-left com offset (left: 33px, top: 92px)

**Botões de Ação** (abaixo da imagem):
- Width: 459px (centralizado)
- Gap: 16px

1. **Botão "Salvar Imagem"**:
   - Background: gray-900 (#20202a)
   - Height: 44px
   - Border-radius: 12px
   - Padding: 11.5px 32px
   - Icon: heroicons-outline:save (18x18px, white)
   - Text: "Salvar Imagem"
   - Font: Inter Medium, 14px, line-height: 20px
   - Color: white
   - Gap: 8px
   - Full width

2. **Botão "Tentar com outra imagem"**:
   - Background: white
   - Border: 1px solid gray-300
   - Height: 44px
   - Border-radius: 12px
   - Padding: 11.5px 33px
   - Icon: tabler:refresh (17x17px, black)
   - Text: "Tentar com outra imagem"
   - Font: Inter Medium, 14px, line-height: 20px
   - Color: #020817
   - Gap: 8px
   - Full width

**Painel Lateral Direito** (373.344px width):

**Seção 1: Origem**
- **Título**: "Origem:"
  - Font: Inter Semi Bold, 14px
  - Color: #20202a

- **Thumbnails da origem** (gap: 12px):
  - 3 imagens (83x107px, 84x107px, 84x107px)
  - Border: 2px solid white
  - Border-radius: 6px
  - Flex wrap com width: 186px
  - Primeira imagem: borda destacada

**Seção 2: Informações da Geração**

- **Data de Geração**:
  - Label: "Data de geração:"
    - Font: Inter Semi Bold, 14px
    - Color: #20202a
  - Value: "28/10/2025 19:10"
    - Font: Inter Semi Bold, 18px
    - Color: #20202a
  - Gap: 10px vertical

- **Custo em Créditos**:
  - Label: "Custo em créditos"
    - Font: Inter Semi Bold, 14px
    - Color: #20202a
  - Value: "2 Créditos"
    - Font: Inter Semi Bold, 18px
    - Color: #20202a
  - Gap: 10px vertical

- **Gap entre seções**: 34px

**Card de Feedback**:
- Background: gray-100 (#f3f4f6)
- Border-radius: 16px
- Padding: 24px
- Gap: 10px

**Conteúdo:**
- **Ícone**:
  - Background: gray-600
  - Size: 48x48px
  - Border-radius: 9999px
  - Icon: info (16x16px, white)

- **Título**: "Gostou do resultado?"
  - Font: Inter Semi Bold, 16px, line-height: 24px
  - Color: gray-900
  - Text-align: center

- **Descrição**:
  - Text: "Conte-nos o que achou do resultado e ajude-nos a melhorar nossa plataforma"
  - Font: Inter Regular, 14px, line-height: 20px
  - Color: gray-600
  - Text-align: center
  - Width: 327px
  - Height: 40px

- **Botões de Feedback** (gap: 12px):

  1. **Botão Like**:
     - Background: #01c758 (verde)
     - Border: 2px solid #005927 (verde escuro)
     - Height: 45px
     - Border-radius: 31px
     - Padding: 4px 62px
     - Icon: mdi:like (18x18px)

  2. **Botão Dislike**:
     - Background: #ff2526 (vermelho)
     - Border: 2px solid #980001 (vermelho escuro)
     - Height: 45px
     - Border-radius: 31px
     - Padding: 4px 62px
     - Icon: bxs:dislike (18x18px)

### Popup: Confirmação de Compra

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=704-11858&m=dev

**Estrutura extraída do Figma:**
- Background overlay: white (modal simples, não overlay escuro)
- **Modal**:
  - Width: ajustado ao conteúdo
  - Background: white
  - Border-radius: 16px
  - Padding: 40px 80px 34px
  - Gap: 15px

**Conteúdo:**
- **Espaçamento inicial**: 4px

- **Ícone**:
  - Background: gray-900 (#20202a)
  - Size: 50x50px
  - Border-radius: 27px (semi-circle)
  - Icon: icon-park-outline:buy (23x23px, white)
  - Padding: 16px

- **Título**: "Confirmação de compra"
  - Font: Inter Bold, 24px
  - Color: black
  - Text-align: center

- **Mensagem**:
  - Text: "Deseja confirmar a compra da imagem selecionado por **2 créditos**?"
  - Font: Inter Regular, 18px
  - Bold para "2 créditos": Inter Bold, 18px
  - Color: black
  - Text-align: center
  - Width: 361px, Height: 59px

- **Espaçamento**: 14px

- **Botões** (gap: não especificado, full width):

  1. **Botão "Confirmar"**:
     - Background: gray-900 (#20202a)
     - Height: 44px
     - Border-radius: 12px
     - Padding: 11.5px 32px
     - Text: "Confirmar"
     - Font: Inter Medium, 14px, line-height: 20px
     - Color: white
     - Width: full

  2. **Botão "Cancelar"**:
     - Background: white
     - Border: 1px solid gray-900
     - Height: 44px
     - Border-radius: 12px
     - Padding: 11.5px 32px
     - Text: "Cancelar"
     - Font: Inter Medium, 14px, line-height: 20px
     - Color: gray-900
     - Width: full

- **Botão Fechar** (top-right):
  - Background: #f4f4f4
  - Size: 50x50px
  - Border-radius: 13px
  - Icon: basil:cross-outline (20x20px)
  - Position: absolute, left: 504px, top: 15px

### Funcionalidades Técnicas - Resultados

```javascript
// Estado dos resultados
const [results, setResults] = useState({
  images: [], // 3 variações geradas
  selectedIndex: 0,
  metadata: {
    originImages: [],
    generatedAt: new Date(),
    cost: 2
  }
});

// Salvar imagem (remove marca d'água e debita créditos)
const handleSaveImage = async () => {
  // Verificar créditos
  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (user.credits < 2) {
    // Mostrar modal de créditos insuficientes
    return;
  }

  // Mostrar modal de confirmação (popup 704:11858)
  const confirmed = await showConfirmationModal({
    title: 'Confirmação de compra',
    message: 'Deseja confirmar a compra da imagem selecionado por 2 créditos?',
    cost: 2
  });

  if (!confirmed) return;

  // Debitar créditos
  await supabase
    .from('users')
    .update({ credits: user.credits - 2 })
    .eq('id', userId);

  // Gerar versão sem marca d'água
  const cleanImageUrl = await generateCleanImage(
    results.images[results.selectedIndex]
  );

  // Salvar no banco
  await supabase.from('user_downloads').insert({
    user_id: userId,
    image_url: cleanImageUrl,
    origin_images: results.metadata.originImages,
    cost: 2,
    generation_metadata: results.metadata
  });

  // Download automático
  downloadImage(cleanImageUrl);

  // Redirecionar para Galeria
  router.push('/galeria');
};

// Feedback do usuário
const handleFeedback = async (liked) => {
  await supabase.from('user_feedback').insert({
    user_id: userId,
    result_id: results.id,
    liked: liked,
    created_at: new Date()
  });

  // Mostrar mensagem de agradecimento
  toast.success('Obrigado pelo seu feedback!');
};
```

---

## 4. Fluxo Galeria

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=705-17818&m=dev

**Nota**: A resposta do Figma para esta tela excedeu o limite de tokens. Especificações resumidas baseadas no agent.md original:

### Funcionalidades

1. **Armazenamento**: Imagens salvas SEM marca d'água (já debitadas)
2. **Filtros**:
   - Todos
   - Fotos salvas (downloaded)
   - Fotos geradas

3. **Filtros Inteligentes de Modelo**:
   - Por tipo de modelo (manequim, corpo, flutuante, etc.)
   - Por data de criação
   - Por custo/créditos

4. **Grid de Imagens**:
   - Layout responsivo (grid 4-5 colunas)
   - Hover: mostrar opções (download novamente, deletar, compartilhar)
   - Click: abrir modal de visualização completa

### Estrutura de Dados

```javascript
// Tabela gallery_items
{
  id: uuid,
  user_id: uuid,
  image_url: string, // sem marca d'água
  thumbnail_url: string,
  type: 'saved' | 'generated',
  model_type: string,
  generation_data: jsonb,
  created_at: timestamp,
  is_deleted: boolean
}
```

---

## 5. Fluxo Vestuário

**Link Figma**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel?node-id=705-20031&m=dev

**Nota**: A resposta do Figma para esta tela excedeu o limite de tokens. Especificações resumidas baseadas no agent.md original:

### Funcionalidades

1. **Biblioteca de Roupas do Usuário**:
   - Upload e armazenamento de peças
   - Organização por categorias (camisas, calças, vestidos, etc.)
   - Tags personalizadas

2. **Ações**:
   - Upload de nova peça
   - Editar informações da peça
   - Deletar peça (soft delete)
   - Usar peça em nova criação (redireciona para Fluxo Criar)

3. **Visualização**:
   - Grid de cards com thumbnails
   - Informações: nome, categoria, data de upload
   - Filtros por categoria e tags

### Estrutura de Dados

```javascript
// Tabela wardrobe_items
{
  id: uuid,
  user_id: uuid,
  name: string,
  category: string,
  tags: string[],
  image_url: string,
  thumbnail_url: string,
  uploaded_at: timestamp,
  is_deleted: boolean
}
```

---

## 6. Google Banana API

**Importante**: Pesquisar mais sobre a API do Google Banana. Ela será fundamental para:
- Geração de imagens de modelos
- Remoção de fundos
- Melhoramento de imagens
- Geração de fundos com IA

### Endpoints Esperados
```javascript
// Exemplo de integração
const generateModel = async (garmentImage, modelParams) => {
  const response = await fetch(GOOGLE_BANANA_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GOOGLE_BANANA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      garment_image: garmentImage,
      model_type: modelParams.type,
      background: modelParams.background,
      // outros parâmetros
    })
  });

  return await response.json();
};
```

---

## 7. Estrutura do Banco de Dados (Supabase)

### Tabelas Principais

```sql
-- Users (herda de auth.users do Supabase)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  auth_provider VARCHAR(20) NOT NULL,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- User Uploads (Etapa 1)
CREATE TABLE user_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'uploaded',
  created_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- User Creations (Processo de criação)
CREATE TABLE user_creations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  upload_id UUID REFERENCES user_uploads(id),
  status VARCHAR(20) DEFAULT 'incomplete', -- incomplete, generating, completed
  step INTEGER DEFAULT 1, -- 1-6
  category VARCHAR(50),
  model_type VARCHAR(50),
  model_params JSONB,
  background_params JSONB,
  result_images JSONB, -- array de URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- User Downloads (Imagens compradas)
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  creation_id UUID REFERENCES user_creations(id),
  image_url VARCHAR(500) NOT NULL, -- sem marca d'água
  thumbnail_url VARCHAR(500),
  origin_images JSONB,
  cost INTEGER DEFAULT 2,
  generation_metadata JSONB,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Wardrobe Items
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  name VARCHAR(255),
  category VARCHAR(50),
  tags TEXT[],
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- User Feedback
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  result_id UUID REFERENCES user_creations(id),
  liked BOOLEAN,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Tools (para Dashboard)
CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  description TEXT,
  icon_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active', -- active, beta, coming_soon
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### Políticas RLS (Row Level Security)

```sql
-- Exemplo para user_uploads
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own uploads"
  ON user_uploads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON user_uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Aplicar políticas similares para todas as tabelas
```

---

## 8. Assets e Arquivos

### Estrutura de Diretórios

```
/assets
  /icons
    - whatsapp-icon.svg
    - apple-icon.svg
    - google-icon.svg
    - scissors-icon.svg (removedor fundo)
    - sparkles-icon.svg (gerador fundo)
    - eraser-icon.svg (removedor objetos)
    - mannequin-icon.svg (modelo IA)
    - save-icon.svg
    - refresh-icon.svg
    - like-icon.svg
    - dislike-icon.svg
    - chat-icon.svg
    - info-icon.svg
    - cross-icon.svg
    - arrow-icon.svg
    - buy-icon.svg
    - check-icon.svg

  /images
    - fotomodel-logo.png
    - splash-background.jpg
    - welcome-background.jpg (yoga woman)
    - loading-spinner.svg
    - watermark-logo.svg (vazada)

  /examples
    - good-example-1.jpg (manequim bom)
    - good-example-2.jpg (iluminação boa)
    - bad-example-1.jpg (cabide)
    - bad-example-2.jpg (superfície plana)
    - bad-example-3.jpg (acessórios)

  /illustrations
    - cabide-vector.svg
    - superficie-plana-vector.svg
```

### Download via MCP Figma

Todos os assets devem ser baixados do Figma usando MCP. Os assets estão hospedados em:
`http://localhost:3845/assets/[hash].[extensão]`

**Importante**: Criar script para download automático de todos os assets referenciados no Figma.

---

## 9. Responsividade

### Breakpoints (Tailwind)
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm - lg)
- **Desktop**: > 1024px (lg+)

### Adaptações Mobile

1. **Header**:
   - Logo menor
   - Menu hamburger
   - Créditos em badge menor

2. **Dashboard**:
   - Cards empilhados verticalmente
   - Carrossel com swipe touch
   - 2 colunas no grid de downloads

3. **Fluxo Criar**:
   - Stepper vertical ou colapsado
   - Painel lateral vira accordion abaixo
   - Upload área full width

4. **Resultados**:
   - Thumbnails em carrossel horizontal
   - Imagem principal full width
   - Painel lateral accordion

---

## 10. Testes e Validação

### Checklist de Funcionalidades

- [ ] Login via WhatsApp
- [ ] Login via Apple ID
- [ ] Login via Gmail
- [ ] Verificação de código 2FA
- [ ] Integração Bubble.io (importar créditos)
- [ ] Dashboard carregamento
- [ ] Carrossel infinito
- [ ] Navegação entre telas
- [ ] Upload de imagem
- [ ] Validação de formato/tamanho
- [ ] Popups educacionais
- [ ] Stepper de etapas
- [ ] Geração de resultados (Google Banana API)
- [ ] Preview com marca d'água
- [ ] Confirmação de compra
- [ ] Débito de créditos
- [ ] Download sem marca d'água
- [ ] Galeria de imagens
- [ ] Filtros de galeria
- [ ] Vestuário (CRUD)
- [ ] Feedback like/dislike
- [ ] Soft delete

---

## 11. Deploy e Ambiente

### Railway Configuration

```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  numReplicas = 1
  restartPolicyType = "ON_FAILURE"

[[services]]
  name = "web"

  [services.healthcheck]
  path = "/health"
  interval = 30
  timeout = 10
```

### Environment Variables (Railway)

Todas as variáveis do `.env` devem ser configuradas no Railway Dashboard.

---

## Utilitários Essenciais

#### lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCredits(credits: number): string {
  return `${credits} ${credits === 1 ? 'crédito' : 'créditos'}`;
}
```

---

## Próximos Passos

### Fase 1: Setup Inicial
1. ✅ Extrair especificações detalhadas do Figma via MCP
2. ✅ Definir stack tecnológica (Next.js 15.5 + Supabase)
3. ⬜ Inicializar projeto Next.js 15.5
   ```bash
   npx create-next-app@latest fotomodel-pro --typescript --tailwind --app --use-npm
   ```
4. ⬜ Configurar estrutura de pastas
5. ⬜ Instalar dependências principais
6. ⬜ Configurar Tailwind com design tokens do Figma
7. ⬜ Baixar todos os assets do Figma
8. ⬜ Configurar fontes customizadas (Freight, Inter, Haas)

### Fase 2: Supabase Setup
9. ⬜ Criar projeto no Supabase
10. ⬜ Configurar tabelas do banco de dados
11. ⬜ Implementar RLS (Row Level Security)
12. ⬜ Configurar Supabase Auth (WhatsApp, Gmail, Apple)
13. ⬜ Configurar Supabase Storage (buckets para uploads)
14. ⬜ Gerar types do TypeScript
15. ⬜ Implementar Supabase clients (browser + server)

### Fase 3: Autenticação
16. ⬜ Implementar middleware de autenticação
17. ⬜ Criar tela de login (app/(auth)/login)
18. ⬜ Implementar login via WhatsApp (2FA)
19. ⬜ Implementar login via Gmail
20. ⬜ Implementar login via Apple ID
21. ⬜ Criar tela de verificação de código
22. ⬜ Integrar API Bubble.io (importar créditos)
23. ⬜ Implementar logout

### Fase 4: Componentes Base
24. ⬜ Criar componentes UI básicos (Button, Input, Card, Badge, Modal)
25. ⬜ Implementar Header/Navbar com navegação
26. ⬜ Criar layouts (root, auth, main)
27. ⬜ Implementar sistema de toast notifications

### Fase 5: Dashboard
28. ⬜ Criar página Dashboard (app/(main)/dashboard/page.tsx)
29. ⬜ Implementar cards de opções de geração
30. ⬜ Implementar carrossel de ferramentas IA
31. ⬜ Implementar carrossel de downloads recentes
32. ⬜ Implementar seção "Somente para você" com countdown
33. ⬜ Implementar recarregar créditos

### Fase 6: Fluxo Criar
34. ⬜ Implementar stepper de 6 etapas
35. ⬜ Criar Etapa 1: Upload de roupa com validações
36. ⬜ Implementar popups educacionais
37. ⬜ Implementar painel de dicas lateral
38. ⬜ Criar Etapa 2: Categorização da peça
39. ⬜ Criar Etapa 3: Seleção de modelos/poses
40. ⬜ Criar Etapa 4: Personalização do modelo
41. ⬜ Criar Etapa 5: Seleção de fundo
42. ⬜ Criar Etapa 6: Resultados com preview
43. ⬜ Implementar marca d'água nas previews
44. ⬜ Implementar popup de confirmação de compra
45. ⬜ Implementar sistema de débito de créditos
46. ⬜ Implementar download de imagem sem marca d'água
47. ⬜ Implementar sistema de feedback (like/dislike)

### Fase 7: Integração Google Banana API
48. ⬜ Pesquisar e documentar Google Banana API
49. ⬜ Criar API Routes para geração de imagens
50. ⬜ Implementar fila de processamento (se necessário)
51. ⬜ Implementar tratamento de erros
52. ⬜ Implementar retry logic

### Fase 8: Galeria
53. ⬜ Criar página Galeria (app/(main)/galeria/page.tsx)
54. ⬜ Implementar grid responsivo de imagens
55. ⬜ Implementar filtros (Todos, Salvas, Geradas)
56. ⬜ Implementar filtros inteligentes
57. ⬜ Implementar modal de visualização
58. ⬜ Implementar ações (download, deletar, compartilhar)

### Fase 9: Vestuário
59. ⬜ Criar página Vestuário (app/(main)/vestuario/page.tsx)
60. ⬜ Implementar grid de peças do usuário
61. ⬜ Implementar upload de nova peça
62. ⬜ Implementar categorização e tags
63. ⬜ Implementar edição de peça
64. ⬜ Implementar soft delete
65. ⬜ Implementar "Usar em nova criação"

### Fase 10: Polimento e UX
66. ⬜ Implementar loading states
67. ⬜ Implementar skeleton loaders
68. ⬜ Implementar error boundaries
69. ⬜ Implementar animações e transições
70. ⬜ Otimizar imagens (Next Image)
71. ⬜ Implementar SEO (metadata)
72. ⬜ Responsividade mobile completa

### Fase 11: Testes
73. ⬜ Configurar Vitest/Jest
74. ⬜ Escrever testes unitários para componentes
75. ⬜ Escrever testes de integração
76. ⬜ Configurar Playwright para E2E
77. ⬜ Escrever testes E2E críticos
78. ⬜ Testar em diferentes browsers

### Fase 12: Deploy
79. ⬜ Configurar variáveis de ambiente no Railway
80. ⬜ Configurar railway.toml
81. ⬜ Deploy inicial
82. ⬜ Configurar domínio customizado
83. ⬜ Configurar SSL/HTTPS
84. ⬜ Monitoramento e logs
85. ⬜ CI/CD com GitHub Actions

---

**Documento criado via MCP Figma Integration**
Última atualização: 2025-10-28
