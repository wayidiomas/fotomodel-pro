# Assets do Fotomodel Pro

## ✅ Assets Extraídos e Organizados

Este documento descreve todos os assets extraídos do Figma via MCP e sua organização no projeto.

**Data da última atualização**: 2025-11-14

---

## 📁 Estrutura Atual

```
public/assets/
├── icons/
│   ├── ai-tools/              # ✅ Ícones de Ferramentas de IA
│   │   ├── background-remover.svg
│   │   ├── background-generator.svg
│   │   ├── image-enhancer.svg
│   │   ├── object-remover.svg
│   │   └── mannequin-model.svg
│   ├── features/              # ✅ Ícones de Features
│   │   ├── hanger.svg         # Cabide
│   │   └── flat-surface.svg   # Superfície Plana
│   ├── ui/                    # ✅ Ícones de UI
│   │   ├── grid-view.svg
│   │   ├── list-view.svg
│   │   ├── reload.svg
│   │   └── menu-dots.svg
│   ├── whatsapp.svg           # ✅ Ícone WhatsApp (login)
│   ├── whatsapp-gradient.svg  # ✅ Variante com gradiente
│   ├── apple.svg              # ✅ Ícone Apple (login)
│   ├── iphone-status-bar.svg  # ✅ Status bar do iPhone
│   ├── progress-step-*.svg    # ✅ Indicadores de progresso (onboarding)
├── images/
│   ├── dashboard/
│   │   └── clothing-vectors/  # ✅ Vetores decorativos de roupas (6 PNGs + 1 SVG)
│   ├── onboarding/            # ✅ Telas de onboarding
│   │   ├── Login.png
│   │   ├── step-1.png
│   │   ├── step-2.png
│   │   ├── step-3.png
│   │   └── background-step-1.png
│   ├── logo.svg               # ✅ Logo principal
│   ├── background-model-1.png # ✅ Background login
│   ├── background-yoga-1.png  # ✅ Cards parallax
│   └── background-yoga-2.png  # ✅ Cards parallax
```

---

## 🎨 Assets por Categoria

### **Ícones de Ferramentas de IA** (5 SVGs - Extraídos via Figma MCP)

Usados no carrossel "Ferramentas de IA" do dashboard.

| Ícone | Arquivo | Componente React | Status |
|-------|---------|------------------|--------|
| Removedor de Fundo | `background-remover.svg` | `BackgroundRemover` | ✅ |
| Gerador de Fundo IA | `background-generator.svg` | `BackgroundGenerator` | ✅ |
| Melhorador de Imagem | `image-enhancer.svg` | `ImageEnhancer` | ✅ (sparkles/star) |
| Removedor de Objetos IA | `object-remover.svg` | `ObjectRemover` | ✅ |
| Modelo IA - Manequim | `mannequin-model.svg` | `MannequinModel` | ✅ (human figure) |

**Origem Figma**: Node IDs 631-2138, 631-2143
**Formato**: SVG 24x24px, stroke-based, `currentColor`
**Localização no código**: `components/icons/`

---

### **Ícones de Features** (2 SVGs)

Usados nos cards principais do dashboard.

| Ícone | Arquivo | Componente React | Uso |
|-------|---------|------------------|-----|
| Cabide | `hanger.svg` | `Hanger` | Card "Cabide" (#eae6de) |
| Superfície Plana | `flat-surface.svg` | `FlatSurface` | Card "Superfície Plana" (#eceff1) |

**Origem Figma**: Node IDs 560-10946, 564-11057
**Formato**: SVG 24x24px
**Localização**: `app/dashboard/page.tsx`

---

### **Ícones de UI** (4 SVGs)

Controles de interface do dashboard.

| Ícone | Arquivo | Componente React | Uso |
|-------|---------|------------------|-----|
| Grid View | `grid-view.svg` | `GridView` | Toggle de visualização |
| List View | `list-view.svg` | `ListView` | Toggle de visualização |
| Reload | `reload.svg` | `Reload` | Botão "Recarregar" créditos |
| Menu Dots | `menu-dots.svg` | `MenuDots` | Menu de opções |

**Origem Figma**: Node IDs diversos (header e sections)
**Formato**: SVG 16x16px
**Localização**: Header e seções do dashboard

---

### **Ícones de Autenticação** (Existentes)

| Ícone | Arquivo | Uso |
|-------|---------|-----|
| WhatsApp | `whatsapp.svg` | Botão login via WhatsApp |
| WhatsApp Gradient | `whatsapp-gradient.svg` | Variante com gradiente |
| Apple | `apple.svg` | Botão login com Apple |

---

### **Imagens e Backgrounds**

| Tipo | Arquivos | Uso |
|------|----------|-----|
| Logo | `logo.svg` | Header, branding |
| Backgrounds Login | `background-model-1.png`<br>`background-yoga-1.png`<br>`background-yoga-2.png` | Parallax cards na tela de login |
| Onboarding | `onboarding/*.png` | Fluxo de boas-vindas |
| Clothing Vectors | `dashboard/clothing-vectors/*.png` (6 imagens)<br>`dashboard/clothing-vectors/arrow-up.svg` | Decoração dos cards Cabide/Superfície (652KB total) |

---

## 🧩 Componentes de Ícones

Todos os ícones foram convertidos em componentes React TypeScript reutilizáveis:

### **Importação Centralizada**

```typescript
import {
  // AI Tools
  BackgroundRemover,
  BackgroundGenerator,
  ImageEnhancer,
  ObjectRemover,
  MannequinModel,

  // Features
  Hanger,
  FlatSurface,

  // UI
  GridView,
  ListView,
  Reload,
  MenuDots,

  // Navigation
  ArrowRight,
  Forward,
} from '@/components/icons';
```

### **Padrão de Implementação**

Todos os componentes seguem o padrão:
- TypeScript com tipos exportados
- Props estendendo `React.SVGProps<SVGSVGElement>`
- Suporte a `currentColor` para temas
- Atributos customizáveis via props

**Exemplo**:
```typescript
<BackgroundRemover className="h-6 w-6 text-blue-600" />
```

---

## 🔗 Mapeamento Figma → Assets

| Node ID Figma | Tipo | Asset Local | Componente |
|---------------|------|-------------|------------|
| `631-2138` | Dashboard | Múltiplos SVGs | Vários componentes |
| `631-2143` | Card Cabide | `hanger.svg` | `<Hanger />` |
| `560-10946` | Icon Cabide | `hanger.svg` | `<Hanger />` |
| `564-11057` | Icon Superfície | `flat-surface.svg` | `<FlatSurface />` |

**URLs do Figma MCP** (localhost:3845):
- Assets servidos via servidor local temporário
- Baixados e salvos em `/public/assets/`
- Otimizados para produção (removidos atributos desnecessários)

---

## 📊 Sistema de Ícones (Melhorado)

O dashboard agora usa **ícones locais prioritariamente** com fallback para o banco:

### **Prioridade** (Atualizada):
1. **Ícones locais** - Componentes React estáticos (mais rápido, sem DB query)
2. **Banco de dados** (`ai_tools.icon_url`) - fallback se nome não reconhecido
3. **Placeholder** (🤖) - fallback final

**Código** ([app/dashboard/page.tsx:214-223](app/dashboard/page.tsx#L214-L223)):
```typescript
{(() => {
  const LocalIcon = getAIToolIcon(tool.name);
  if (LocalIcon) {
    return <LocalIcon className="h-6 w-6 text-gray-600" />;
  }
  if (tool.icon_url) {
    return <Image src={tool.icon_url} alt={tool.name} width={24} height={24} />;
  }
  return <span className="text-2xl">🤖</span>;
})()}
```

**Mapeamento** ([lib/ai-tools-icons.tsx](lib/ai-tools-icons.tsx)):
- Mapeia nomes de ferramentas → Componentes React
- Suporta pt-BR e en-US
- Função helper: `getAIToolIcon(toolName)`

**Vantagens**:
- ⚡ **Performance**: Sem requests ao banco ou CDN
- 🎨 **Consistência**: Ícones sempre disponíveis offline
- 🔧 **Manutenção**: Atualizações via código (versionado)
- 🌐 **Fallback**: DB disponível se precisar customização

---

## ✅ Checklist de Extração

- [x] Criar estrutura de diretórios
- [x] Baixar 5 ícones de ferramentas IA
- [x] Baixar 2 ícones de features (Cabide, Superfície)
- [x] Baixar 4 ícones de UI (Grid, List, Reload, Menu)
- [x] Baixar 6 vetores decorativos de roupas + 1 arrow
- [x] Criar 10 componentes React de ícones
- [x] Atualizar [components/icons/index.ts](components/icons/index.ts)
- [x] Atualizar dashboard com novos componentes
- [x] Criar [lib/ai-tools-icons.tsx](lib/ai-tools-icons.tsx) (mapeamento)
- [x] Documentar assets neste README

---

## 📝 Manutenção

### **Adicionar Novo Ícone**

1. **Baixar SVG do Figma**:
   - Via Figma MCP ou exportação manual
   - Salvar em pasta apropriada (`ai-tools/`, `features/`, `ui/`)

2. **Criar Componente React**:
   ```bash
   # Exemplo: novo-icone.tsx
   cd components/icons/
   touch novo-icone.tsx
   ```

3. **Seguir Padrão**:
   - Ver [components/icons/background-remover.tsx](components/icons/background-remover.tsx) como referência
   - Usar `currentColor` para stroke/fill
   - Exportar interface de Props

4. **Atualizar Index**:
   ```typescript
   // components/icons/index.ts
   export * from './novo-icone';
   ```

5. **Usar no Código**:
   ```typescript
   import { NovoIcone } from '@/components/icons';
   <NovoIcone className="h-6 w-6" />
   ```

---

## 🔍 Links Úteis

- **Figma Design**: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel
- **Node IDs**:
  - Dashboard: `631-2138`
  - Cards: `631-2143`
- **Componentes**: [components/icons/](components/icons/)
- **Dashboard**: [app/dashboard/page.tsx](app/dashboard/page.tsx)
