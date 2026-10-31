CREATE TABLE idempotent_requests (
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE,
    request_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INTEGER,
    content_type VARCHAR(255),
    response_body BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_email, request_key)
);
CREATE INDEX idempotent_requests_expiry ON idempotent_requests(created_at);
