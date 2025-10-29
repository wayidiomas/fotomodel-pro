# Assets do Figma

## Assets Identificados no Design

Estes assets foram identificados através do Figma MCP e devem ser exportados do Figma para uso no projeto.

### Logos e Branding
- **Logo Principal**: "fotomodel" (tipografia FreightBigProBlack)
- **Formato**: SVG e PNG para diferentes contextos
- **Localização no Figma**: Presente em múltiplas telas (login, dashboard, header)

### Ícones
- **WhatsApp Icon**: `mingcute:whatsapp-fill`
  - Formato: SVG
  - Cor: Adaptável (usado em botões)
  - Tamanho: 22x22px

- **Apple Icon**: `ic:baseline-apple`
  - Formato: SVG
  - Cor: Branco (para botão dark)
  - Tamanho: 18x22px

### Ícones de Ferramentas IA
Visíveis no Dashboard (node-id: 631:2138):
- Removedor de Fundo
- Gerador de Fundo IA
- Melhorador de Imagem
- Removedor de Objetos IA
- Modelo IA - Manequim

**Formato**: SVG ou PNG 48x48px
**Estilo**: Minimalista, line icons

### Imagens Exemplo
- **Modelos Virtuais**: Imagens de exemplo de modelos gerados
- **Background Gradients**:
  - Gradient overlay: `linear-gradient(180deg, rgba(255,255,255,0) 7.242%, #ffffff 61.522%)`
  - Usado nas telas de boas-vindas

### Imagens de Demonstração (Screenshots)
As seguintes imagens foram capturadas do Figma:
- Tela de Login/Welcome
- Dashboard completo
- Popup de dicas com exemplos
- Galeria com grid de fotos

## Como Exportar do Figma

1. Abra o arquivo: https://www.figma.com/design/omMAQB8nq3QqmNE3tExdMU/Fotomodel
2. Selecione o elemento desejado
3. No painel direito, vá em "Export"
4. Escolha o formato apropriado:
   - SVG para ícones e logos
   - PNG @2x para imagens e fotos
5. Exporte para esta pasta (`public/assets/`)

## Estrutura Recomendada

```
public/assets/
├── icons/
│   ├── whatsapp.svg
│   ├── apple.svg
│   ├── ai-tools/
│   │   ├── background-remover.svg
│   │   ├── background-generator.svg
│   │   ├── image-enhancer.svg
│   │   ├── object-remover.svg
│   │   └── mannequin-model.svg
├── images/
│   ├── models/          # Imagens exemplo de modelos
│   └── examples/        # Imagens para demonstração
└── logo/
    ├── logo.svg
    └── logo.png
```

## Assets de Localhost

Durante a extração do Figma MCP, foram identificados os seguintes assets em localhost:
- `http://localhost:3845/assets/[hash].png` - Imagens de modelos
- `http://localhost:3845/assets/[hash].svg` - Ícones

Estes devem ser baixados do Figma e salvos localmente seguindo a estrutura acima.
