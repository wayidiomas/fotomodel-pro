# Gemini 2.5 Flash - Mapeamento de Formatos

Este documento descreve como os formatos de imagem da plataforma são mapeados para os aspect ratios suportados pelo Gemini 2.5 Flash.

## Aspect Ratios Suportados pelo Gemini 2.5 Flash

O Gemini 2.5 Flash Image suporta **10 aspect ratios** com dimensões exatas:

| Aspect Ratio | Dimensões | Tokens | Categoria |
|--------------|-----------|--------|-----------|
| **1:1** | 1024×1024 | 1290 | Square |
| **2:3** | 832×1248 | 1290 | Portrait |
| **3:2** | 1248×832 | 1290 | Landscape |
| **3:4** | 864×1184 | 1290 | Portrait |
| **4:3** | 1184×864 | 1290 | Landscape |
| **4:5** | 896×1152 | 1290 | Portrait |
| **5:4** | 1152×896 | 1290 | Landscape |
| **9:16** | 768×1344 | 1290 | Portrait (Story) |
| **16:9** | 1344×768 | 1290 | Landscape |
| **21:9** | 1536×672 | 1290 | Ultrawide |

## Mapeamento de Formatos

### ✅ Formatos Diretamente Compatíveis

Estes formatos usam aspect ratios nativamente suportados pelo Gemini:

#### Instagram
- **Instagram Post** (1:1) → Gemini 1:1 (1024×1024)
- **Instagram Story** (9:16) → Gemini 9:16 (768×1344)
- **Instagram Reels** (9:16) → Gemini 9:16 (768×1344)
- **Instagram Retrato** (4:5) → Gemini 4:5 (896×1152)

#### Shopify / E-commerce
- **Shopify Produto** (1:1) → Gemini 1:1 (1024×1024)*
- **Shopify Thumbnail** (1:1) → Gemini 1:1 (1024×1024)
- **E-commerce Padrão** (1:1) → Gemini 1:1 (1024×1024)

*Nota: Shopify recomenda 2048×2048, então será necessário upscaling após a geração*

#### Facebook
- **Facebook Post** (1:1) → Gemini 1:1 (1024×1024)
- **Facebook Story** (9:16) → Gemini 9:16 (768×1344)
- **Facebook Capa** (16:9) → Gemini 16:9 (1344×768)

#### Pinterest
- **Pinterest Pin** (2:3) → Gemini 2:3 (832×1248)
- **Pinterest Quadrado** (1:1) → Gemini 1:1 (1024×1024)

#### Twitter/X
- **Twitter Post** (16:9) → Gemini 16:9 (1344×768)
- **Twitter Quadrado** (1:1) → Gemini 1:1 (1024×1024)

#### TikTok
- **TikTok Vertical** (9:16) → Gemini 9:16 (768×1344)

#### WhatsApp
- **WhatsApp Status** (9:16) → Gemini 9:16 (768×1344)
- **WhatsApp Catálogo** (1:1) → Gemini 1:1 (1024×1024)

### ⚠️ Formatos com Mapeamento Aproximado

Estes formatos foram ajustados para usar o aspect ratio do Gemini mais próximo:

#### LinkedIn
- **LinkedIn Post** (1.91:1 original) → **Gemini 16:9** (1344×768)
  - Razão: 1.91:1 não é suportado. 16:9 (1.78:1) é o mais próximo
  - Impacto: Imagem será ligeiramente mais alta que o ideal do LinkedIn

#### Print
- **Print A4** (1.41:1 original) → **Gemini 3:2** (1248×832)
  - Razão: 1.41:1 não é suportado. 3:2 (1.5:1) é o mais próximo
  - Impacto: Imagem será ligeiramente mais larga que A4 real
  - Resolução: Para print em alta qualidade, será necessário upscaling

- **Print Quadrado** (1:1) → Gemini 1:1 (1024×1024)

## Workflow de Geração

1. **Seleção de Formato**: Usuário escolhe formato (ex: "LinkedIn Post")
2. **Mapeamento**: Sistema lê `gemini_aspect_ratio` do banco (ex: "16:9")
3. **Geração**: Gemini gera imagem em 1344×768
4. **Pós-processamento** (opcional):
   - Upscaling para alta resolução (ex: Shopify 2048×2048)
   - Crop para aspect ratio exato (ex: LinkedIn 1.91:1)

## Implementação no Código

### Database Schema

```sql
-- Coluna adicionada à tabela image_format_presets
ALTER TABLE image_format_presets
ADD COLUMN gemini_aspect_ratio TEXT;

-- Exemplo de registro
{
  "name": "LinkedIn Post",
  "aspect_ratio": "1.91:1",      -- Para display/UI
  "width": 1344,                  -- Dimensão real do Gemini
  "height": 768,                  -- Dimensão real do Gemini
  "gemini_aspect_ratio": "16:9"   -- Usado na API do Gemini
}
```

### TypeScript Interface

```typescript
export interface ImageFormatPreset {
  id: string;
  name: string;
  platform: Platform;
  aspect_ratio: AspectRatio;           // Display para UI
  width: number;                        // Dimensão real que será gerada
  height: number;                       // Dimensão real que será gerada
  gemini_aspect_ratio?: string;         // Aspect ratio enviado ao Gemini
  // ... outros campos
}
```

### Constantes Gemini

```typescript
export const GEMINI_ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 832, height: 1248 },
  '3:2': { width: 1248, height: 832 },
  '3:4': { width: 864, height: 1184 },
  '4:3': { width: 1184, height: 864 },
  '4:5': { width: 896, height: 1152 },
  '5:4': { width: 1152, height: 896 },
  '9:16': { width: 768, height: 1344 },
  '16:9': { width: 1344, height: 768 },
  '21:9': { width: 1536, height: 672 },
} as const;
```

## Limitações

1. **Resolução Máxima**: 1536px (lado longo) para aspect ratio 21:9
2. **Upscaling Necessário**: Para formatos que exigem alta resolução (ex: Shopify 2048×2048, Print)
3. **Aproximações**: LinkedIn e Print A4 usam aspect ratios aproximados
4. **Custo Fixo**: 1290 tokens (US$ 0.039) por imagem, independente do tamanho

## Referências

- [Gemini 2.5 Flash Image - Official Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini 2.5 Flash Aspect Ratios Announcement](https://developers.googleblog.com/en/gemini-2-5-flash-image-now-ready-for-production-with-new-aspect-ratios/)
