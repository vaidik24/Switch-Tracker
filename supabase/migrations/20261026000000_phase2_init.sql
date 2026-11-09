-- Phase 2 Initial Migration: Cloud Sync, Notification Channels & Reminder Engine
-- Timezone default: Asia/Kolkata

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. sync_records: Tombstone-based entity sync (Dexie <-> Supabase)
CREATE TABLE IF NOT EXISTS public.sync_records (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, entity, id)
);

CREATE INDEX IF NOT EXISTS idx_sync_records_user_updated 
ON public.sync_records (user_id, updated_at);

ALTER TABLE public.sync_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sync records"
ON public.sync_records
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. daily_status: Synced daily summary read by the reminder engine
CREATE TABLE IF NOT EXISTS public.daily_status (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- YYYY-MM-DD
    must_do_total INT NOT NULL DEFAULT 0,
    must_do_done INT NOT NULL DEFAULT 0,
    remaining_titles TEXT[] NOT NULL DEFAULT '{}',
    done_for_today BOOLEAN NOT NULL DEFAULT FALSE,
    rest_day BOOLEAN NOT NULL DEFAULT FALSE,
    snoozed_until TIMESTAMPTZ NULL,
    followups_due INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily status"
ON public.daily_status
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 3. reminder_settings: User schedule & nag preferences
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    morning_time TIME NOT NULL DEFAULT '08:00',
    midday_time TIME NOT NULL DEFAULT '13:30',
    evening_time TIME NOT NULL DEFAULT '19:00',
    final_time TIME NOT NULL DEFAULT '22:00',
    nag_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    nag_interval_minutes INT NOT NULL DEFAULT 30 CHECK (nag_interval_minutes BETWEEN 15 AND 60),
    quiet_start TIME NOT NULL DEFAULT '23:30',
    quiet_end TIME NOT NULL DEFAULT '07:00',
    weekly_review_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminder settings"
ON public.reminder_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Auto-provision default settings when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_reminder_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reminder_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_reminder_settings();


-- 4. notification_channels: Telegram and ntfy.sh delivery channels
CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('telegram', 'ntfy')),
    telegram_chat_id BIGINT NULL,
    ntfy_topic TEXT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, type)
);

ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification channels"
ON public.notification_channels
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 5. telegram_link_codes: Short-lived codes to link Telegram bot chat
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create link codes for themselves and read their own
CREATE POLICY "Users can create their own link codes"
ON public.telegram_link_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own link codes"
ON public.telegram_link_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 6. reminder_log: Idempotency table for scheduled notifications
CREATE TABLE IF NOT EXISTS public.reminder_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    slot_key TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL,
    error TEXT NULL,
    UNIQUE (user_id, slot_key, channel_type)
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_user_sent
ON public.reminder_log (user_id, sent_at DESC);

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reminder logs"
ON public.reminder_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically in Edge Functions to write logs and read across users


-- 7. Helper RPC to fetch or initialize reminder settings safely
CREATE OR REPLACE FUNCTION public.get_or_create_reminder_settings()
RETURNS public.reminder_settings AS $$
DECLARE
    result public.reminder_settings;
BEGIN
    INSERT INTO public.reminder_settings (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING * INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
