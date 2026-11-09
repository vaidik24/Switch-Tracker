# Job Switch Tracker (Phase 1 & Phase 2)

A personal, mobile-first career switch and interview preparation tracker for software engineer Vaidik.
Built with **Vite, React 18, TypeScript, Tailwind CSS, Dexie (IndexedDB), Supabase (Auth, Postgres, Edge Functions, pg_cron), and Telegram Bot API**.

---

## Architecture & Guarantees
- **Offline-First**: All application data lives in client-side IndexedDB (`TrackerDB`). The app works 100% offline and without an account.
- **Additive Cloud Sync**: Optional multi-device synchronization between phone and laptop using Supabase Postgres with tombstone-based Last-Write-Wins conflict resolution.
- **Phone Reminders & Nag Mode**: Background reminder engine (`reminder-cron`) running on Supabase every 15 minutes, sending push notifications to your phone via Telegram (primary) and ntfy.sh (alternative). Nag mode persistently repeats after 19:00 until all must-do tasks are completed.
- **Strict Privacy**: Row-Level Security (RLS) enabled on all tables; clients use only the public anonymous key (`VITE_SUPABASE_ANON_KEY`). Service-role keys and tokens exist strictly within Supabase Edge Functions and are never shipped to the client.

---

## Phase 2 Setup: Step-by-Step Manual Instructions

Follow these numbered steps to configure your Supabase backend and Telegram Bot.

> [!NOTE]
> **Never commit your `.env` or paste secrets into public chats.** Type or set them in your terminal directly.

### Step 1: Create a Free Supabase Project
1. Log in to [database.new](https://database.new) and create a new project (e.g., `job-switch-tracker`).
2. Choose a region close to India (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
3. Under **Project Settings -> API**, copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon public key** (`eyJhbGciOi...`)
   - **service_role secret key** (needed for Edge Functions)

### Step 2: Create Your Telegram Bot
1. Open Telegram on your phone or desktop and search for **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot` and follow the prompts:
   - Name: `Vaidik Job Switch Tracker`
   - Username: choose a unique username ending in `bot` (e.g., `VaidikTrackerBot`).
3. BotFather will provide your **HTTP API Token** formatted as:
   `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`.
4. Note your Bot Username and Token safely.

### Step 3: Configure Local Frontend Environment
In `/Users/vaidikpandya/Desktop/vaidik-mac/Tracker`, create a `.env.local` file:
```bash
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
VITE_TELEGRAM_BOT_USERNAME="<your-bot-username-without-@>"
```

### Step 4: Link Project & Push Database Migrations
Make sure you have the Supabase CLI installed (`brew install supabase/tap/supabase` or `npx supabase`):
```bash
cd /Users/vaidikpandya/Desktop/vaidik-mac/Tracker

# Login to Supabase CLI
npx supabase login

# Link your local repo to your remote project
npx supabase link --project-ref <your-project-ref>

# Push the database migrations (tables, RLS policies, triggers, and cron helper)
npx supabase db push
```

### Step 5: Set Edge Function Secrets
Set the required secrets in your remote Supabase project:
```bash
# Generate two random 32-character secret tokens for webhook and cron:
export TG_SECRET=$(openssl rand -hex 16)
export CRON_SECRET=$(openssl rand -hex 16)

# Set the secrets in Supabase:
npx supabase secrets set \
  TELEGRAM_BOT_TOKEN="<your-telegram-bot-token>" \
  TELEGRAM_WEBHOOK_SECRET="${TG_SECRET}" \
  CRON_SECRET="${CRON_SECRET}" \
  APP_URL="https://<your-deployed-app-url-or-localhost:5173>"
```

### Step 6: Deploy Edge Functions
Deploy both Edge Functions without enforcing client JWT verification (since Telegram and pg_net make server-to-server calls authenticated by secret headers):
```bash
# Deploy telegram-webhook
npx supabase functions deploy telegram-webhook --no-verify-jwt

# Deploy reminder-cron
npx supabase functions deploy reminder-cron --no-verify-jwt
```

### Step 7: Register Telegram Webhook
Run the included helper script to register your webhook with Telegram:
```bash
export TELEGRAM_BOT_TOKEN="<your-telegram-bot-token>"
export TELEGRAM_WEBHOOK_SECRET="${TG_SECRET}"
export SUPABASE_PROJECT_REF="<your-project-ref>"

./scripts/set-telegram-webhook.sh
```
The script will output: `✅ Webhook successfully registered with Telegram!`.

### Step 8: Schedule pg_cron
Open your remote Supabase Dashboard -> **SQL Editor**, and run:
```sql
-- Schedule the reminder-cron Edge Function every 15 minutes:
SELECT public.schedule_reminder_cron(
  'https://<your-project-ref>.supabase.co',
  '<your-CRON_SECRET>'
);

-- Verify that the cron job was scheduled:
SELECT * FROM cron.job WHERE jobname = 'invoke-reminder-cron-every-15m';
```

### Step 9: Link Telegram in the App
1. Open the app in your browser (`http://localhost:5173` or your production URL).
2. Go to **Settings -> Cloud Sync**, enter your email, and sign in via the magic link.
3. Under **Phone Reminders**, tap **Connect Telegram Bot**.
4. Scan the QR code or tap the deep link to open your bot in Telegram and press **START**.
5. Within 2 seconds, the Settings screen will update to **CONNECTED ✅**.
6. Tap **Send Test Reminder** to confirm delivery!

### Step 10: Single-User Hardening
After your first successful sign-in:
1. In the Supabase Dashboard, go to **Authentication -> Providers -> Email**.
2. Toggle off **Enable Sign Up** (or disable new user signups).
3. This ensures nobody else can create an account on your backend.

---

## Supabase Free-Tier Inactivity Rules & Prevention
- **Free Tier Policy**: Free Supabase projects pause after **7 days of inactivity** (no database connections or HTTP API calls).
- **Automatic Prevention**: Because `pg_cron` runs `schedule_reminder_cron` every 15 minutes and executes database queries, your database continuously receives automated activity and **will not pause** as long as active background jobs are scheduled.
- **Resuming if Paused**: If your project ever pauses (e.g. after weeks of being turned off), simply click **Restore Project** in the Supabase Dashboard. All your IndexedDB local data remains 100% intact on your device.

---

## Troubleshooting Guide

### 1. Telegram Bot is Not Replying to Commands
- Run `curl -s -X POST "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` to verify:
  - `url` points to `https://<project-ref>.supabase.co/functions/v1/telegram-webhook`
  - `has_custom_certificate` is false
  - `pending_update_count` is 0 or low
  - `last_error_message` is empty
- Check Edge Function logs:
  `npx supabase functions logs telegram-webhook`

### 2. No Reminders Arriving
- Check your local time vs Quiet Hours (default 23:30 to 07:00 IST). Nag mode and fixed reminders are strictly suppressed during quiet hours.
- Verify whether today's must-do tasks are already marked complete or if today is marked as a rest day.
- Check the **Reminder Logs** viewer at the bottom of the Settings screen in the app.

### 3. Watchdog Banner: "Server reminders may be delayed"
- Indicates no server reminder log has been recorded in the last 45 minutes during daytime.
- In Supabase SQL Editor, verify cron status:
  ```sql
  SELECT * FROM public.v_reminder_cron_status;
  ```
- If needed, re-run `SELECT public.schedule_reminder_cron(...);`.

### 4. Duplicate Reminders
- Impossible by design: `reminder_log` enforces a strict database-level unique constraint on `(user_id, slot_key, channel_type)`. Any duplicate attempt is automatically discarded.

### 5. Android Battery Optimization Delaying Telegram
- On Android, go to **Settings -> Apps -> Telegram -> Battery** and select **Unrestricted**.
- Enable **Autostart** if using Xiaomi (MIUI/HyperOS), OnePlus (OxygenOS), or Samsung devices.

---

## Manual End-to-End Test Checklist

Use this checklist to verify your end-to-end setup:

- [ ] **1. Sign In**: Enter your email in Settings -> Cloud Sync and confirm authentication via magic link.
- [ ] **2. Multi-device Sync**: Open the app on your phone and laptop; check off a task on phone and confirm laptop reflects it after sync.
- [ ] **3. Connect Telegram**: Tap "Connect Telegram Bot", open deep link, tap START, verify "CONNECTED ✅" badge.
- [ ] **4. Test Delivery**: Tap "Send Test Reminder" and verify instant notification in Telegram.
- [ ] **5. Test Nag Mode**: Leave 1 must-do task unchecked after 19:00 IST; verify nag message arrives with inline buttons.
- [ ] **6. Test Snooze**: Tap "💤 Snooze 1h" button in Telegram; verify reminders pause for 60 minutes.
- [ ] **7. Bot Commands**: Send `/today` to view remaining checklist, and `/done` to mark complete.
- [ ] **8. Auto-Stop**: Complete all must-do tasks in the app or via `/done` and verify nag messages cease immediately.
