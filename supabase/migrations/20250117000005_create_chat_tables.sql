-- Migration: Create Chat System Tables
-- Description: Tables for conversational AI chat with Imagen 4
-- Date: 2025-01-17

-- ============================================================================
-- 1. CHAT CONVERSATIONS
-- ============================================================================
-- Stores chat conversation sessions
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,  -- Auto-generated from first user message
  metadata JSONB DEFAULT '{}'::jsonb,  -- { vestuario_ids: [...], background_id: '...', tags: [...] }
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user conversation lookups
CREATE INDEX idx_chat_conversations_user
  ON chat_conversations(user_id, created_at DESC)
  WHERE is_deleted = false;

-- ============================================================================
-- 2. CHAT MESSAGES
-- ============================================================================
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,  -- Link to generated image if any
  credits_charged INTEGER DEFAULT 0,  -- 0 for conversational messages, 2 for generation, 1 for refinement
  metadata JSONB DEFAULT '{}'::jsonb,  -- { attachments: [...], prompt_tokens: 0, model: '...' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast conversation message retrieval
CREATE INDEX idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at ASC);

-- Index for generation linkage
CREATE INDEX idx_chat_messages_generation
  ON chat_messages(generation_id)
  WHERE generation_id IS NOT NULL;

-- ============================================================================
-- 3. CHAT ATTACHMENTS
-- ============================================================================
-- Stores attachments (garments, backgrounds, generated images) linked to messages
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('garment', 'background', 'generated_image')),
  reference_id UUID,  -- ID of user_uploads, background_presets, or generation_results
  file_url TEXT,  -- Direct URL if not referenced by ID
  metadata JSONB DEFAULT '{}'::jsonb,  -- { file_name: '...', file_size: 0, mime_type: '...' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast message attachment lookup
CREATE INDEX idx_chat_attachments_message
  ON chat_attachments(message_id);

-- Index for reference lookups
CREATE INDEX idx_chat_attachments_reference
  ON chat_attachments(attachment_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- ============================================================================
-- 4. UPDATED_AT TRIGGER FOR CONVERSATIONS
-- ============================================================================
-- Auto-update updated_at timestamp on conversation updates
CREATE OR REPLACE FUNCTION update_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_conversation_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_updated_at();

-- ============================================================================
-- 5. AUTO-UPDATE CONVERSATION TIMESTAMP ON NEW MESSAGE
-- ============================================================================
-- Update conversation.updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE chat_conversations IS 'Conversational AI chat sessions for free-form image generation';
COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations (user, assistant, system)';
COMMENT ON TABLE chat_attachments IS 'File attachments (garments, backgrounds) linked to chat messages';

COMMENT ON COLUMN chat_conversations.metadata IS 'JSON metadata: vestuario_ids, background_id, tags, etc.';
COMMENT ON COLUMN chat_messages.credits_charged IS '0 = conversational, 2 = generation, 1 = refinement';
COMMENT ON COLUMN chat_messages.metadata IS 'JSON metadata: attachments, prompt_tokens, model, etc.';
COMMENT ON COLUMN chat_attachments.attachment_type IS 'Type: garment | background | generated_image';
COMMENT ON COLUMN chat_attachments.reference_id IS 'FK to user_uploads, background_presets, or generation_results';
