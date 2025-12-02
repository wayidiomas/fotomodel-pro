/**
 * Mapeamento de ícones de ferramentas de IA
 *
 * Este arquivo mapeia os nomes das ferramentas para seus componentes de ícone locais.
 * Não depende do banco de dados - os ícones são servidos estaticamente.
 */

import {
  BackgroundRemover,
  BackgroundGenerator,
  ImageEnhancer,
  ObjectRemover,
  MannequinModel,
} from '@/components/icons';

export const AI_TOOLS_ICONS = {
  'Removedor de Fundo': BackgroundRemover,
  'Background Remover': BackgroundRemover,
  'Gerador de Fundo IA': BackgroundGenerator,
  'Background Generator': BackgroundGenerator,
  'Melhorador de Imagem': ImageEnhancer,
  'Image Enhancer': ImageEnhancer,
  'Removedor de Objetos IA': ObjectRemover,
  'Object Remover': ObjectRemover,
  'Modelo IA - Manequim': MannequinModel,
  'Mannequin Model': MannequinModel,
  'AI Model - Mannequin': MannequinModel,
} as const;

export type AIToolName = keyof typeof AI_TOOLS_ICONS;

/**
 * Retorna o componente de ícone para uma ferramenta de IA
 * @param toolName - Nome da ferramenta (pt-BR ou en-US)
 * @returns Componente React do ícone ou null se não encontrado
 */
export function getAIToolIcon(toolName: string) {
  return AI_TOOLS_ICONS[toolName as AIToolName] || null;
}

/**
 * Verifica se existe um ícone local para a ferramenta
 * @param toolName - Nome da ferramenta
 * @returns true se existe ícone local
 */
export function hasLocalIcon(toolName: string): boolean {
  return toolName in AI_TOOLS_ICONS;
}
