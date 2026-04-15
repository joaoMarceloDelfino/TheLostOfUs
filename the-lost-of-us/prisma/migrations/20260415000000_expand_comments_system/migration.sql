-- Expand comments system with replies, votes and reports
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID NULL,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislikes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE comments
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_comments_parent_comment'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT fk_comments_parent_comment
      FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments (post_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_rank ON comments (post_id, likes_count, dislikes_count, created_at);

CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_sub TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_comment_votes_comment_user UNIQUE (comment_id, user_sub)
);

CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes (comment_id);

CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_sub TEXT NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_comment_reports_comment_user UNIQUE (comment_id, user_sub)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports (comment_id);
