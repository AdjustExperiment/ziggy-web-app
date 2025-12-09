-- Phase 1: Drop unused pairing_messages table (migrated to pairing_chat_messages)
-- Both tables were confirmed empty, safe to drop

DROP TABLE IF EXISTS pairing_messages;