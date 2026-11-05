-- Every payment a coach makes for a plan. Tax law requires keeping these records for years, so a
-- row outlives the coach's account: the link is cleared and the name and email are kept as a
-- snapshot. Invoices are issued with external software; only their reference is stored here.
CREATE TABLE coach_payments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_user_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    coach_name    VARCHAR(255),
    coach_email   VARCHAR(255) NOT NULL,
    plan          VARCHAR(20) NOT NULL,
    amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
    vat_rate      NUMERIC(5, 2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 100),
    vat_cents     INTEGER NOT NULL CHECK (vat_cents >= 0),
    currency      VARCHAR(3) NOT NULL DEFAULT 'EUR',
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    method        VARCHAR(20) NOT NULL,
    reference     VARCHAR(100),
    created_by    VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_payments_coach ON coach_payments (coach_user_id, created_at DESC);

ALTER TABLE coach_payments ENABLE ROW LEVEL SECURITY;
