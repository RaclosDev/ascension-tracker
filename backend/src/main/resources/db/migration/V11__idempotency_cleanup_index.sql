-- The daily cleanup deletes idempotency records older than 30 days; without this index it scans the whole table.

CREATE INDEX idx_idempotent_requests_created_at ON idempotent_requests USING btree (created_at);
