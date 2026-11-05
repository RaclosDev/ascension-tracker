-- Weekly check-in reminders already sent, one per link and week (Monday). Claiming a row before
-- sending keeps the reminder to a single push even with several backend instances.

CREATE TABLE checkin_reminders (
    link_id UUID NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (link_id, week_start)
);
