# Complete Zero-to-Production Deployment Guide
### Personal Job Switch Tracker (Vaidik's 2-Month Prep Plan)

This guide walks you through deploying your web app, Supabase database, Edge Functions, Gemini AI, and Telegram Bot from scratch.

---

## 📋 Overview of What You Will Deploy

```
[Phone / Desktop Browser]  ──>  [Vercel (PWA Frontend)]
                                        │
                                        ▼ (Anon Key / RLS)
                             [Supabase Cloud Project]
                                ├── PostgreSQL (Indexed Tables + RLS)
                                ├── pg_cron (Every 15 min scheduler)
                                ├── Edge Function: reminder-cron  ──> [Gemini AI & Telegram API]
                                └── Edge Function: telegram-webhook <── [Telegram Bot Updates]
```

---

## 🛠️ Prerequisites & Accounts Needed (All 100% Free)
1. **GitHub account** ([github.com](https://github.com)) — to host your private code repository.
2. **Vercel account** ([vercel.com](https://vercel.com)) — to host your frontend PWA.
3. **Supabase account** ([supabase.com](https://supabase.com)) — database, auth, and cron server.
4. **Telegram app** on phone/desktop — for your bot reminders.
5. **Google AI Studio account** ([aistudio.google.com](https://aistudio.google.com)) — for free Gemini API key.

---

## Step 1: Create Your Telegram Bot (2 Minutes)

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot`.
3. Enter a display name: `Vaidik Job Switch Tracker`.
4. Enter a username ending in `bot` (e.g. `VaidikPrepTracker_bot` or `VaidikSwitch_bot`).
5. BotFather will reply with your **HTTP API Token**:
   ```
   123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   ```
6. **Save this token and your bot username safely.**

---

## Step 2: Get a Free Gemini API Key (1 Minute)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key** (choose "Create in new project" or an existing Google Cloud project).
4. Copy your key: `AIzaSy...`.
5. **Save this key safely.**

---

## Step 3: Create Free Supabase Project (3 Minutes)

1. Go to [database.new](https://database.new) and sign in.
2. Click **New Project**:
   - **Name**: `job-switch-tracker`
   - **Database Password**: Choose a strong password and save it.
   - **Region**: Select `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore).
   - **Pricing Plan**: Free.
3. Once the project finishes provisioning (~1 minute), go to **Project Settings** (gear icon) -> **API**:
   - Copy **Project URL** (e.g. `https://abcdefghijkl.supabase.co`).
   - Copy **anon / public key** (starts with `eyJhbGciOi...`).
   - Copy **service_role key** (starts with `eyJhbGciOi...`).

---

## Step 4: Push Database Schema to Supabase

Open your terminal on your Mac:

```bash
cd /Users/vaidikpandya/Desktop/vaidik-mac/Tracker

# 1. Login to Supabase CLI (opens browser to authenticate)
npx supabase login

# 2. Link your local directory to your remote Supabase project
# Replace <your-project-ref> with the 20-character ID from your Project URL (e.g. abcdefghijkl)
npx supabase link --project-ref <your-project-ref>

# 3. Push all database migrations (tables, RLS policies, triggers, and cron helper)
npx supabase db push
```

---

## Step 5: Set Function Secrets & Deploy Edge Functions

In your terminal, generate two random secret tokens:

```bash
# Generate random 32-character secrets:
export TG_SECRET=$(openssl rand -hex 16)
export CRON_SECRET=$(openssl rand -hex 16)

# Print them once so you have them for the SQL step:
echo "Your CRON_SECRET is: ${CRON_SECRET}"
echo "Your TG_SECRET is: ${TG_SECRET}"
```

Now upload your secrets into Supabase:

```bash
npx supabase secrets set \
  TELEGRAM_BOT_TOKEN="<your-telegram-bot-token-from-step-1>" \
  TELEGRAM_WEBHOOK_SECRET="${TG_SECRET}" \
  CRON_SECRET="${CRON_SECRET}" \
  GEMINI_API_KEY="<your-gemini-api-key-from-step-2>" \
  GEMINI_MODEL="gemini-2.0-flash" \
  APP_URL="https://tracker.vaidik.dev"
```

Now deploy the two Edge Functions:

```bash
# Deploy telegram-webhook (handles incoming commands & snooze buttons)
npx supabase functions deploy telegram-webhook --no-verify-jwt

# Deploy reminder-cron (evaluates schedule, calls Gemini, and sends alerts)
npx supabase functions deploy reminder-cron --no-verify-jwt
```

---

## Step 6: Register Telegram Webhook

Hook up your Telegram bot to your newly deployed Edge Function using the included script:

```bash
export TELEGRAM_BOT_TOKEN="<your-telegram-bot-token>"
export TELEGRAM_WEBHOOK_SECRET="${TG_SECRET}"
export SUPABASE_PROJECT_REF="<your-project-ref>"

./scripts/set-telegram-webhook.sh
```

You should see:
```text
✅ Webhook successfully registered with Telegram!
```

---

## Step 7: Schedule the 15-Minute Cron in Supabase

1. Open your Supabase Dashboard: [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** on the left menu.
3. Click **New Query**, paste the following, and click **Run**:

```sql
-- Schedule reminder-cron to execute every 15 minutes:
SELECT public.schedule_reminder_cron(
  'https://<your-project-ref>.supabase.co',
  '<your-CRON_SECRET-from-step-5>'
);

-- Verify the cron job was registered:
SELECT * FROM cron.job WHERE jobname = 'invoke-reminder-cron-every-15m';
```

*(This automated cron also prevents your free Supabase project from pausing due to inactivity).*

---

## Step 8: Deploy the Frontend to Vercel (3 Minutes)

### A. Push Code to GitHub
```bash
cd /Users/vaidikpandya/Desktop/vaidik-mac/Tracker

# Create a new repository on github.com (e.g. named "job-switch-tracker", set to Private)
# Then link and push:
git remote add origin https://github.com/<your-username>/job-switch-tracker.git
git branch -M main
git push -u origin main
```

### B. Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your `job-switch-tracker` GitHub repository.
3. Under **Environment Variables**, add these 3 variables:
   - `VITE_SUPABASE_URL`: `https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-anon-key-from-step-3>`
   - `VITE_TELEGRAM_BOT_USERNAME`: `<your-bot-username-without-@>`
4. Click **Deploy**.
5. Within 45 seconds, Vercel will give you a live HTTPS URL (e.g. `https://job-switch-tracker.vercel.app`).

### C. Update APP_URL Secret in Supabase
Now that you have your live Vercel URL, update `APP_URL` in Supabase so Telegram buttons link directly to your live app:

```bash
npx supabase secrets set APP_URL="https://<your-vercel-domain>.vercel.app"
```

---

## Step 9: Install on Phone & Connect Telegram

1. **Open on Phone**: Visit your Vercel URL on your phone's browser (Safari on iPhone, Chrome on Android).
2. **Install as App (PWA)**:
   - **iPhone**: Tap Share icon -> **Add to Home Screen**.
   - **Android**: Tap the 3 dots -> **Install App / Add to Home screen**.
3. **Sign In**:
   - In the app, go to **Settings -> Cloud Sync**.
   - Enter your email address and tap **Send Magic Link**.
   - Open your email and tap the sign-in link.
4. **Connect Telegram**:
   - In **Settings -> Phone Reminders**, tap **Connect Telegram Bot**.
   - Tap the link or scan the QR code to open your bot in Telegram.
   - Tap **START** at the bottom of the chat.
   - You will immediately receive:
     ```text
     🔥 Hardcore Mode Activated!
     Connected to Job Switch Tracker. I will hold you ruthlessly accountable...
     ```
5. **Send Test Alert**:
   - Go back to Settings and tap **Send Test Reminder** to verify instant delivery.

---

## Step 10: Lock Signups (Security Hardening)

To ensure nobody else can create an account on your Supabase backend:
1. In the Supabase Dashboard, go to **Authentication -> Providers -> Email**.
2. Toggle OFF **Allow new users to sign up**.
3. Click **Save**.

---

## 🧪 Verification & Bot Commands

Send these commands to your bot in Telegram to test:
- `/today` — Returns your remaining checklist, streak, and North Star.
- `/tomorrow` — **Calls Gemini AI live** to formulate tomorrow's custom battle plan!
- `/snooze` — Snoozes nagging for 1 hour.
- `/done` — Locks in your daily streak once all tasks are finished.
- `/help` — Lists all commands.

---

## 🚨 Troubleshooting

| Issue | Quick Fix |
| :--- | :--- |
| **Bot not replying** | Run: `curl -s -X POST "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` to verify `url` is correct and `has_custom_certificate` is false. Check function logs: `npx supabase functions logs telegram-webhook`. |
| **No reminders arriving** | Check if current time is within **Quiet Hours (23:30 to 07:00 IST)**. Reminders are strictly suppressed while you sleep. |
| **Gemini plan using template** | Verify your Gemini key is set: `npx supabase secrets list`. If missing or invalid, it gracefully uses the built-in battle plan template. |
| **Android notifications delayed** | Go to phone **Settings -> Apps -> Telegram -> Battery** and set to **Unrestricted**. |
| **Shift start date** | In the app, open **Plan** or **Settings**, tap **Start Date (3/3 left)**, select your date, and tap Apply. |
