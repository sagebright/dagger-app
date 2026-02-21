-- Add stage column to sage_messages for stage-scoped conversation history.
--
-- Without this column, loadConversationHistory returns messages from ALL stages,
-- causing the greet endpoint to return 'already_greeted' when advancing stages
-- (blank screen bug). The regular chat endpoint also sent cross-stage messages
-- to Anthropic, wasting tokens and confusing context.

-- Step 1: Add column with a default so existing rows get a value
ALTER TABLE sage_messages
  ADD COLUMN stage TEXT NOT NULL DEFAULT 'invoking';

-- Step 2: Remove the default so future inserts must provide a stage explicitly
ALTER TABLE sage_messages
  ALTER COLUMN stage DROP DEFAULT;

-- Step 3: Composite index for efficient stage-scoped history queries
CREATE INDEX idx_sage_messages_session_stage_created
  ON sage_messages (session_id, stage, created_at);
