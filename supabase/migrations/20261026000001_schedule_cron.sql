-- Migration: Scheduling reminder-cron Edge Function via pg_cron & pg_net
-- Runs every 15 minutes: */15 * * * *

-- Helper function to schedule or re-schedule the reminder cron
CREATE OR REPLACE FUNCTION public.schedule_reminder_cron(
    p_project_url TEXT DEFAULT NULL,
    p_cron_secret TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_url TEXT;
    v_secret TEXT;
    v_body TEXT;
BEGIN
    -- Unschedule existing job if present (safely inside a sub-block)
    BEGIN
        PERFORM cron.unschedule('invoke-reminder-cron-every-15m');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Retrieve project_url from Vault or parameter
    IF p_project_url IS NOT NULL THEN
        v_url := rtrim(p_project_url, '/') || '/functions/v1/reminder-cron';
    ELSE
        BEGIN
            SELECT rtrim(decrypted_secret, '/') || '/functions/v1/reminder-cron'
            INTO v_url
            FROM vault.decrypted_secrets
            WHERE name = 'project_url'
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_url := NULL;
        END;
    END IF;

    -- Retrieve cron_secret from Vault or parameter
    IF p_cron_secret IS NOT NULL THEN
        v_secret := p_cron_secret;
    ELSE
        BEGIN
            SELECT decrypted_secret
            INTO v_secret
            FROM vault.decrypted_secrets
            WHERE name = 'cron_secret'
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_secret := '';
        END;
    END IF;

    IF v_url IS NULL THEN
        RETURN 'Error: project_url is not configured in Vault and was not provided.';
    END IF;

    -- Schedule job
    PERFORM cron.schedule(
        'invoke-reminder-cron-every-15m',
        '*/15 * * * *',
        format(
            $cron$
            SELECT net.http_post(
                url := %L,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'X-Cron-Secret', %L
                ),
                body := '{"trigger": "pg_cron"}'::jsonb
            ) AS request_id;
            $cron$,
            v_url,
            COALESCE(v_secret, '')
        )
    );

    RETURN 'Success: reminder-cron scheduled every 15 minutes.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to unschedule
CREATE OR REPLACE FUNCTION public.unschedule_reminder_cron()
RETURNS TEXT AS $$
BEGIN
    PERFORM cron.unschedule('invoke-reminder-cron-every-15m');
    RETURN 'Success: reminder-cron unscheduled.';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Job was not scheduled or already removed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for monitoring cron jobs and recent executions
CREATE OR REPLACE VIEW public.v_reminder_cron_status AS
SELECT 
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    r.runid,
    r.status AS last_run_status,
    r.return_message AS last_run_message,
    r.start_time AS last_run_start_time,
    r.end_time AS last_run_end_time
FROM cron.job j
LEFT JOIN LATERAL (
    SELECT * FROM cron.job_run_details d 
    WHERE d.jobid = j.jobid 
    ORDER BY d.start_time DESC 
    LIMIT 1
) r ON TRUE
WHERE j.jobname = 'invoke-reminder-cron-every-15m';
