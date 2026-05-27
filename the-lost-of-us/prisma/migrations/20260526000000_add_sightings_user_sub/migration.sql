ALTER TABLE sightings
    ADD COLUMN IF NOT EXISTS user_sub TEXT NOT NULL DEFAULT '';

ALTER TABLE sightings
    ALTER COLUMN user_sub DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_sightings_post_id ON sightings(post_id);