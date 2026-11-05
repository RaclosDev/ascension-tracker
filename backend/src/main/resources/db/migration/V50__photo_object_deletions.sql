-- Stored photo objects whose removal from R2 failed. A scheduled job retries them, backing off,
-- until R2 confirms; the row is the only trace left, so it outlives the photo and its owner.
CREATE TABLE photo_object_deletions (
    object_key  TEXT PRIMARY KEY,
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_try_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photo_object_deletions_due ON photo_object_deletions (next_try_at);

ALTER TABLE photo_object_deletions ENABLE ROW LEVEL SECURITY;
