-- Coach profiles, client links, invitations, audit log, subscriptions and payments.

CREATE TABLE coach_profiles (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coach_profiles_pkey PRIMARY KEY (user_id),
    CONSTRAINT coach_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE coach_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_user_id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    status character varying(16) NOT NULL,
    can_view_training boolean NOT NULL,
    can_view_nutrition boolean NOT NULL,
    can_view_body boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    can_edit_training boolean DEFAULT false NOT NULL,
    can_edit_nutrition boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_coach_clients_edit_needs_view CHECK (((NOT can_edit_training) OR can_view_training)),
    CONSTRAINT ck_coach_clients_edit_nutrition_needs_view CHECK (((NOT can_edit_nutrition) OR can_view_nutrition)),
    CONSTRAINT ck_coach_clients_ended_at CHECK ((((status)::text = 'ENDED'::text) = (ended_at IS NOT NULL))),
    CONSTRAINT ck_coach_clients_not_self CHECK ((coach_user_id <> client_user_id)),
    CONSTRAINT ck_coach_clients_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT coach_clients_pkey PRIMARY KEY (id),
    CONSTRAINT coach_clients_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT coach_clients_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_coach_clients_client ON coach_clients USING btree (client_user_id);
CREATE UNIQUE INDEX uq_coach_clients_open ON coach_clients USING btree (coach_user_id, client_user_id) WHERE ((status)::text <> 'ENDED'::text);
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE coach_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_user_id uuid NOT NULL,
    token_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    accepted_by uuid,
    revoked_at timestamp with time zone,
    CONSTRAINT ck_coach_invitations_single_outcome CHECK (((accepted_at IS NULL) OR (revoked_at IS NULL))),
    CONSTRAINT coach_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT uq_coach_invitations_token UNIQUE (token_hash),
    CONSTRAINT coach_invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT coach_invitations_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_coach_invitations_accepted_by ON coach_invitations USING btree (accepted_by);
CREATE INDEX idx_coach_invitations_coach ON coach_invitations USING btree (coach_user_id);
ALTER TABLE coach_invitations ENABLE ROW LEVEL SECURITY;

CREATE TABLE coach_access_log (
    coach_user_id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    action character varying(32) NOT NULL,
    access_date date NOT NULL,
    first_at timestamp with time zone DEFAULT now() NOT NULL,
    last_at timestamp with time zone DEFAULT now() NOT NULL,
    hits integer DEFAULT 1 NOT NULL,
    CONSTRAINT coach_access_log_pkey PRIMARY KEY (client_user_id, coach_user_id, action, access_date),
    CONSTRAINT coach_access_log_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT coach_access_log_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_coach_access_log_coach ON coach_access_log USING btree (coach_user_id);
ALTER TABLE coach_access_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE coach_subscriptions (
    coach_user_id uuid NOT NULL,
    plan character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    trial_ends_at timestamp with time zone,
    current_period_end timestamp with time zone,
    stripe_customer_id character varying(100),
    stripe_subscription_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_coach_subscriptions_status CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'FREE')),
    CONSTRAINT ck_coach_subscriptions_trial CHECK ((((status)::text <> 'TRIALING'::text) OR (trial_ends_at IS NOT NULL))),
    CONSTRAINT coach_subscriptions_pkey PRIMARY KEY (coach_user_id),
    CONSTRAINT coach_subscriptions_stripe_customer_id_key UNIQUE (stripe_customer_id),
    CONSTRAINT coach_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id),
    CONSTRAINT coach_subscriptions_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE coach_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE coach_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_user_id uuid,
    coach_name character varying(255),
    coach_email character varying(255) NOT NULL,
    plan character varying(20) NOT NULL,
    amount_cents integer NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    vat_cents integer NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    method character varying(20) NOT NULL,
    reference character varying(100),
    created_by character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coach_payments_amount_cents_check CHECK ((amount_cents > 0)),
    CONSTRAINT coach_payments_vat_cents_check CHECK ((vat_cents >= 0)),
    CONSTRAINT coach_payments_vat_rate_check CHECK (((vat_rate >= (0)::numeric) AND (vat_rate <= (100)::numeric))),
    CONSTRAINT coach_payments_pkey PRIMARY KEY (id),
    CONSTRAINT coach_payments_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idx_coach_payments_coach ON coach_payments USING btree (coach_user_id, created_at DESC);
ALTER TABLE coach_payments ENABLE ROW LEVEL SECURITY;
