CREATE TABLE http_rate_limits (
    bucket_key VARCHAR(64) PRIMARY KEY,
    tokens DOUBLE PRECISION NOT NULL CHECK (tokens >= 0),
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX http_rate_limits_expiry ON http_rate_limits(updated_at);
