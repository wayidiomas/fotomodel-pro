-- Script para corrigir usuários que deveriam ser detectados como usuários Bubble
-- Execute este script DEPOIS de configurar BUBBLE_API_URL e BUBBLE_API_TOKEN no Railway

-- Exemplo: Atualizar manualmente um usuário específico
-- Substitua os valores conforme necessário

UPDATE users
SET
  migrated_from_bubble = true,
  bubble_user_id = '1753225767907x579709975195397100', -- ID do usuário no Bubble
  bubble_welcome_shown = false,
  credits = 50
WHERE phone = '5516981415210';

-- Para verificar o resultado:
SELECT id, phone, credits, migrated_from_bubble, bubble_user_id, bubble_welcome_shown
FROM users
WHERE phone = '5516981415210';
