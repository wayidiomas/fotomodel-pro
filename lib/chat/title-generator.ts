/**
 * Chat Title Generator
 *
 * Uses Gemini 2.5 Flash Lite to generate concise, descriptive titles
 * for chat conversations based on the first user message.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `Você é um assistente que gera títulos concisos e descritivos para conversas sobre moda.

TAREFA:
Analise a mensagem do usuário e gere um título curto (máximo 40 caracteres) que resuma o objetivo da conversa.

REGRAS:
- Máximo 40 caracteres
- Seja específico e descritivo
- Use português do Brasil
- Foque no tipo de roupa ou estilo mencionado
- Não use pontuação no final
- Use capitalização normal (não MAIÚSCULAS)

EXEMPLOS:
Mensagem: "Quero criar uma modelo feminina usando um vestido floral casual"
Título: "Modelo com Vestido Floral"

Mensagem: "Preciso de uma modelo com terno e gravata, estilo executivo masculino"
Título: "Look Executivo Masculino"

Mensagem: "Modelo feminina com blusa branca e calça jeans azul"
Título: "Blusa Branca e Calça Jeans"

FORMATO DE RESPOSTA:
Responda APENAS com o título, sem explicações ou formatação adicional.`;

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(firstMessage);
    const response = await result.response;
    let title = response.text().trim();

    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '');

    // Limit to 40 characters
    if (title.length > 40) {
      title = title.substring(0, 37) + '...';
    }

    // Fallback if empty
    if (!title || title.length < 3) {
      return 'Nova Conversa';
    }

    return title;
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'Nova Conversa';
  }
}
