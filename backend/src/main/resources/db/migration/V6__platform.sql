-- Push devices, shared AI quota, rate limits, idempotency and contact requests.

CREATE TABLE push_subscriptions (
    id bigserial,
    user_email character varying(255) NOT NULL,
    endpoint text NOT NULL,
    p256dh character varying(255) NOT NULL,
    auth character varying(255) NOT NULL,
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT uq_push_subscriptions_endpoint UNIQUE (endpoint),
    CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_push_subscriptions_user_email ON push_subscriptions USING btree (user_email);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE ai_circuit_state (
    id integer NOT NULL,
    failures integer DEFAULT 0 NOT NULL,
    open_until_ms bigint DEFAULT 0 NOT NULL,
    CONSTRAINT ai_circuit_state_id_check CHECK ((id = 1)),
    CONSTRAINT ai_circuit_state_pkey PRIMARY KEY (id)
);
ALTER TABLE ai_circuit_state ENABLE ROW LEVEL SECURITY;
INSERT INTO ai_circuit_state (id) VALUES (1);

CREATE TABLE ai_quota_global (
    quota_day date NOT NULL,
    used integer NOT NULL,
    CONSTRAINT ai_quota_global_used_check CHECK ((used >= 0)),
    CONSTRAINT ai_quota_global_pkey PRIMARY KEY (quota_day)
);
ALTER TABLE ai_quota_global ENABLE ROW LEVEL SECURITY;

CREATE TABLE ai_quota_usage (
    quota_day date NOT NULL,
    user_email text NOT NULL,
    used integer NOT NULL,
    CONSTRAINT ai_quota_usage_used_check CHECK ((used >= 0)),
    CONSTRAINT ai_quota_usage_pkey PRIMARY KEY (quota_day, user_email),
    CONSTRAINT fk_ai_quota_usage_user FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE ai_quota_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE ai_quota_reservations (
    id uuid NOT NULL,
    quota_day date NOT NULL,
    user_email text NOT NULL,
    CONSTRAINT ai_quota_reservations_pkey PRIMARY KEY (id),
    CONSTRAINT fk_ai_quota_reservation_user FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_ai_quota_reservations_day ON ai_quota_reservations USING btree (quota_day);
ALTER TABLE ai_quota_reservations ENABLE ROW LEVEL SECURITY;

CREATE TABLE http_rate_limits (
    bucket_key character varying(64) NOT NULL,
    tokens double precision NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT http_rate_limits_tokens_check CHECK ((tokens >= (0)::double precision)),
    CONSTRAINT http_rate_limits_pkey PRIMARY KEY (bucket_key)
);
CREATE INDEX http_rate_limits_expiry ON http_rate_limits USING btree (updated_at);
ALTER TABLE http_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE idempotent_requests (
    user_email character varying(255) NOT NULL,
    request_key character varying(128) NOT NULL,
    request_hash character varying(64) NOT NULL,
    response_status integer,
    content_type character varying(255),
    response_body bytea,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT idempotent_requests_pkey PRIMARY KEY (user_email, request_key),
    CONSTRAINT idempotent_requests_user_email_fkey FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idempotent_requests_expiry ON idempotent_requests USING btree (created_at);
ALTER TABLE idempotent_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE contact_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    topic character varying(20) NOT NULL,
    message text NOT NULL,
    desired_clients integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    handled_at timestamp with time zone,
    CONSTRAINT contact_requests_desired_clients_check CHECK (((desired_clients >= 1) AND (desired_clients <= 10000))),
    CONSTRAINT contact_requests_message_check CHECK (((char_length(message) >= 1) AND (char_length(message) <= 2000))),
    CONSTRAINT contact_requests_topic_check CHECK (topic IN ('PLAN', 'CUSTOM', 'OTHER')),
    CONSTRAINT contact_requests_pkey PRIMARY KEY (id),
    CONSTRAINT contact_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_contact_requests_open ON contact_requests USING btree (created_at DESC) WHERE (handled_at IS NULL);
CREATE INDEX idx_contact_requests_user ON contact_requests USING btree (user_id, created_at DESC);
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
