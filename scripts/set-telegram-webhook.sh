#!/usr/bin/env bash
# scripts/set-telegram-webhook.sh
# Safely registers the Telegram Bot webhook with a secret_token.
# Never prints tokens or secrets.

set -euo pipefail

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable is not set."
  exit 1
fi

if [ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ]; then
  echo "Error: TELEGRAM_WEBHOOK_SECRET environment variable is not set."
  exit 1
fi

if [ -z "${WEBHOOK_URL:-}" ]; then
  if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
    WEBHOOK_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-webhook"
  else
    echo "Error: Either WEBHOOK_URL or SUPABASE_PROJECT_REF must be set."
    exit 1
  fi
fi

echo "Registering Telegram Webhook to:"
echo "  URL: ${WEBHOOK_URL}"
echo "  Secret token length: ${#TELEGRAM_WEBHOOK_SECRET} chars"

RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\", \"allowed_updates\": [\"message\", \"callback_query\"]}")

OK=$(echo "${RESPONSE}" | grep -o '"ok":true' || true)

if [ -n "${OK}" ]; then
  echo "✅ Webhook successfully registered with Telegram!"
else
  echo "❌ Webhook registration failed:"
  echo "${RESPONSE}"
  exit 1
fi

echo ""
echo "Verifying webhook status (getWebhookInfo)..."
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | grep -v "token"
