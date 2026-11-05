-- Progress photos: the image lives in private object storage (Cloudflare R2), this row is the index.
-- Only the client and a linked coach with body access can read them, through short-lived signed URLs.
-- Deleting the account removes the rows (cascade) and the stored objects (AccountDeletionService).

CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    pose VARCHAR(10) NOT NULL,
    taken_on DATE NOT NULL,
    object_key VARCHAR(200) NOT NULL UNIQUE,
    content_type VARCHAR(20) NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_progress_photos_pose CHECK (pose IN ('FRONT', 'SIDE', 'BACK')),
    CONSTRAINT ck_progress_photos_size CHECK (size_bytes > 0)
);

CREATE INDEX idx_progress_photos_user ON progress_photos (user_id, taken_on DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
