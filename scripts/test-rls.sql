-- Test script for Row Level Security (RLS) policies
-- Verifies user isolation: User 2 CANNOT read or write User 1 data

DO $$
DECLARE
    user1_id UUID := '11111111-1111-1111-1111-111111111111';
    user2_id UUID := '22222222-2222-2222-2222-222222222222';
    found_count INT;
BEGIN
    RAISE NOTICE 'Starting RLS Policy Verification Test...';

    -- 1. Simulate User 1 Context
    PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- Insert User 1 records
    INSERT INTO public.sync_records (user_id, entity, id, data)
    VALUES (user1_id, 'problems', 'prob-1', '{"title": "Two Sum"}'::jsonb)
    ON CONFLICT (user_id, entity, id) DO NOTHING;

    INSERT INTO public.daily_status (user_id, date, must_do_total, must_do_done)
    VALUES (user1_id, '2026-10-26', 3, 1)
    ON CONFLICT (user_id, date) DO NOTHING;

    INSERT INTO public.telegram_link_codes (code, user_id, expires_at)
    VALUES ('TESTCODE1', user1_id, NOW() + INTERVAL '10 minutes')
    ON CONFLICT (code) DO NOTHING;

    -- 2. Switch Context to User 2
    PERFORM set_config('request.jwt.claim.sub', user2_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- Check if User 2 can read User 1's sync_records
    SELECT COUNT(*) INTO found_count FROM public.sync_records WHERE user_id = user1_id;
    IF found_count > 0 THEN
        RAISE EXCEPTION 'RLS FAILED: User 2 could read User 1 sync_records! Count: %', found_count;
    END IF;

    -- Check if User 2 can read User 1's daily_status
    SELECT COUNT(*) INTO found_count FROM public.daily_status WHERE user_id = user1_id;
    IF found_count > 0 THEN
        RAISE EXCEPTION 'RLS FAILED: User 2 could read User 1 daily_status! Count: %', found_count;
    END IF;

    -- Check if User 2 can read User 1's telegram_link_codes
    SELECT COUNT(*) INTO found_count FROM public.telegram_link_codes WHERE code = 'TESTCODE1';
    IF found_count > 0 THEN
        RAISE EXCEPTION 'RLS FAILED: User 2 could read User 1 telegram_link_codes! Count: %', found_count;
    END IF;

    -- Try to maliciously update User 1's records as User 2
    UPDATE public.sync_records SET data = '{"hacked": true}'::jsonb WHERE user_id = user1_id;
    
    -- Switch back to User 1 and verify data was NOT tampered with
    PERFORM set_config('request.jwt.claim.sub', user1_id::text, true);
    SELECT COUNT(*) INTO found_count FROM public.sync_records 
    WHERE user_id = user1_id AND (data->>'hacked')::boolean IS TRUE;
    IF found_count > 0 THEN
        RAISE EXCEPTION 'RLS FAILED: User 2 was able to update User 1 record!';
    END IF;

    RAISE NOTICE 'SUCCESS: All RLS policies passed isolation tests cleanly.';
END;
$$;
