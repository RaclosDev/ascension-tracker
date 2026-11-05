-- A coach's plan: how many active clients they can have and the daily AI quota for them and their clients.
-- Plans and their limits live in configuration (app.coach.plans); this row says which one applies and until when.
-- Stripe ids stay empty until payments are wired. Deleting the account removes the row (cascade).

CREATE TABLE coach_subscriptions (
    coach_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(100) UNIQUE,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_coach_subscriptions_status
        CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'FREE')),
    CONSTRAINT ck_coach_subscriptions_trial CHECK (status <> 'TRIALING' OR trial_ends_at IS NOT NULL)
);

-- Coaches who signed up before plans existed get the same 14-day trial, counted from today.
INSERT INTO coach_subscriptions (coach_user_id, plan, status, trial_ends_at)
SELECT user_id, 'PRO', 'TRIALING', NOW() + INTERVAL '14 days' FROM coach_profiles;

ALTER TABLE coach_subscriptions ENABLE ROW LEVEL SECURITY;
