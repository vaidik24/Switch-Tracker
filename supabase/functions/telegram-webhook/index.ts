import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { generateAITomorrowPlan } from "../_shared/gemini.ts"

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const APP_URL = Deno.env.get("APP_URL") || "https://tracker.vaidik.dev"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const DEFAULT_PLAN_WEEKS = [
  {
    weekNumber: 0,
    startDate: '2026-11-09',
    endDate: '2026-11-10',
    focusTopic: 'Baseline & Environment Setup',
    dsaGoal: 'Solve 3 medium problems timed; setup spaced repetition',
    studyGoal: 'Read terminology list end-to-end; configure Telegram reminders',
  },
  {
    weekNumber: 1,
    startDate: '2026-11-11',
    endDate: '2026-11-17',
    focusTopic: 'Arrays, Two Pointers, Sliding Window + OS & Node.js',
    dsaGoal: '20-25 problems: arrays, hashing, two pointers, sliding window',
    studyGoal: 'OS: processes, threads, event loop phases, scheduling, memory leaks',
  },
  {
    weekNumber: 2,
    startDate: '2026-11-18',
    endDate: '2026-11-24',
    focusTopic: 'Stack, Monotonic Stack, Binary Search, Linked Lists + DBMS',
    dsaGoal: '25 problems: stack, monotonic stack, binary search, linked lists',
    studyGoal: 'DBMS: ACID, B-Tree indexes, isolation levels, transactions, EXPLAIN ANALYZE',
  },
  {
    weekNumber: 3,
    startDate: '2026-11-25',
    endDate: '2026-12-01',
    focusTopic: 'Trees, BST, Heaps, Priority Queues + Networks & Auth',
    dsaGoal: '25 problems: binary trees, BST traversal, heaps, top-K',
    studyGoal: 'Networks: HTTP/1.1-3, TCP, TLS, WebSockets, JWT, OAuth2 sessions',
  },
  {
    weekNumber: 4,
    startDate: '2026-12-02',
    endDate: '2026-12-08',
    focusTopic: 'Graphs (BFS/DFS), Topological Sort, Union Find + LLD 1-3',
    dsaGoal: '25 problems: graph BFS/DFS, cycle detection, topological sort, union find',
    studyGoal: 'OOP, SOLID, Design Patterns, LLD 1-3 (LRU/LFU cache, Rate limiter, Parking lot)',
  },
  {
    weekNumber: 5,
    startDate: '2026-12-09',
    endDate: '2026-12-15',
    focusTopic: 'Backtracking, Intervals, Greedy, 1D DP + LLD 4-8',
    dsaGoal: '25 problems: intervals, greedy, 1D dynamic programming',
    studyGoal: 'LLD 4-8: BookMyShow concurrency, Splitwise, Elevator, In-memory KV store with TTL',
  },
  {
    weekNumber: 6,
    startDate: '2026-12-16',
    endDate: '2026-12-22',
    focusTopic: '2D DP, Shortest Path (Dijkstra), Trie + HLD Systems',
    dsaGoal: '20 problems: 2D DP, Dijkstra, Trie',
    studyGoal: 'HLD Core: Load balancers, CDN, Caching strategies, Partitioning, Kafka & Redis deep dive',
  },
  {
    weekNumber: 7,
    startDate: '2026-12-23',
    endDate: '2026-12-29',
    focusTopic: 'Complex System Design (HLD) + Behavioural Mastery',
    dsaGoal: '15 hard/mixed problem drills + spaced revision',
    studyGoal: 'HLD Systems: Chat/WhatsApp, Video Upload, Distributed Idempotent Payment/Ledger',
  },
  {
    weekNumber: 8,
    startDate: '2026-12-30',
    endDate: '2027-01-10',
    focusTopic: 'Full Timed Mocks + FULL JOB APPLICATION DRIVE',
    dsaGoal: '10 timed mocks (2 problems in 60 min) + revise weak patterns',
    studyGoal: 'Full mock interviews aloud, AI debugging scenarios, final interview polish',
  },
]

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown) {
  if (!TELEGRAM_BOT_TOKEN) return
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  }
  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: false,
    }),
  })
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // 1. Verify webhook secret header or authenticated frontend session
  const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token")
  const authHeader = req.headers.get("Authorization")
  const isFromTelegram = TELEGRAM_WEBHOOK_SECRET ? secretHeader === TELEGRAM_WEBHOOK_SECRET : true
  const isFromFrontend = Boolean(authHeader)

  if (!isFromTelegram && !isFromFrontend) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("OK", { status: 200, headers: corsHeaders })
  }

  try {
    const update = await req.json()

    // Handle test reminder request from frontend
    if (update.test) {
      let userId: string | null = null
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "")
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      }
      if (userId) {
        const { data: ch } = await supabase
          .from("notification_channels")
          .select("telegram_chat_id")
          .eq("user_id", userId)
          .eq("type", "telegram")
          .single()

        if (ch?.telegram_chat_id) {
          await sendTelegramMessage(
            ch.telegram_chat_id,
            "🧪 <b>Test Reminder from Job Switch Tracker!</b>\n\n" +
            "Your Telegram bot connection is verified and active! Daily battle plans and reality check reminders will arrive here.",
            {
              inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
            }
          )
          return jsonResponse({ ok: true, message: "Test reminder sent" })
        }
      }
      return jsonResponse({ error: "Telegram channel not found or not connected yet" }, 400)
    }

    // 2. Handle callback queries (e.g. Snooze 1h button on reminders)
    if (update.callback_query) {
      const cq = update.callback_query
      const chatId = cq.message?.chat?.id
      const data = cq.data

      if (chatId) {
        const { data: channel } = await supabase
          .from("notification_channels")
          .select("user_id")
          .eq("telegram_chat_id", chatId)
          .eq("type", "telegram")
          .single()

        if (channel?.user_id) {
          if (data === "snooze_1h") {
            const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
            const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

            await supabase
              .from("daily_status")
              .update({ snoozed_until: snoozeUntil })
              .eq("user_id", channel.user_id)
              .eq("date", todayStr)

            await answerCallbackQuery(cq.id, "Snoozed for 1 hour!")
            await sendTelegramMessage(chatId, "💤 Reminders snoozed for 1 hour. Get back to work soon!")
            return jsonResponse({ ok: true })
          }
        }
      }

      await answerCallbackQuery(cq.id, "Acknowledged")
      return jsonResponse({ ok: true })
    }

    // 3. Handle incoming messages & commands
    const msg = update.message
    if (!msg || !msg.text) {
      return jsonResponse({ ok: true })
    }

    const chatId = msg.chat.id
    const text = msg.text.trim()
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // Command: /start <code>
    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      if (parts.length > 1) {
        const code = parts[1].trim()

        const { data: linkCode, error } = await supabase
          .from("telegram_link_codes")
          .select("*")
          .eq("code", code)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single()

        if (linkCode && !error) {
          await supabase
            .from("notification_channels")
            .upsert({
              user_id: linkCode.user_id,
              type: "telegram",
              telegram_chat_id: chatId,
              verified: true,
              enabled: true,
              last_error: null,
            }, { onConflict: "user_id,type" })

          await supabase
            .from("telegram_link_codes")
            .update({ used: true })
            .eq("code", code)

          await sendTelegramMessage(
            chatId,
            "🔥 <b>Hardcore Mode Activated!</b>\n\n" +
            "Connected to Job Switch Tracker. I will hold you ruthlessly accountable every single day until your must-do tasks are complete.\n\n" +
            "• Every night at 21:30, I will send you <b>Tomorrow's Battle Plan</b>.\n" +
            "• If you slack off after 19:00, I will nag you every 30 minutes until you execute.\n\n" +
            "Type /help to see all commands.",
            {
              inline_keyboard: [
                [{ text: "📱 Open App", url: APP_URL }],
              ],
            }
          )
          return jsonResponse({ ok: true })
        } else {
          await sendTelegramMessage(
            chatId,
            "❌ This connection link is invalid or has expired. Please generate a new code in the Tracker Settings."
          )
          return jsonResponse({ ok: true })
        }
      }
    }

    // Authenticate user via chatId
    const { data: channel } = await supabase
      .from("notification_channels")
      .select("user_id, verified, enabled")
      .eq("telegram_chat_id", chatId)
      .eq("type", "telegram")
      .single()

    if (!channel || !channel.verified) {
      return jsonResponse({ ok: true })
    }

    const userId = channel.user_id

    // Fetch daily status & settings
    const [{ data: dailyStatus }, { data: userSettings }] = await Promise.all([
      supabase.from("daily_status").select("*").eq("user_id", userId).eq("date", todayStr).single(),
      supabase.from("reminder_settings").select("*").eq("user_id", userId).single(),
    ])

    const why = userSettings?.why_i_must_switch || "To escape career stagnation and land a high-impact Tier-1 role"

    if (text === "/today" || text === "/status") {
      if (!dailyStatus) {
        await sendTelegramMessage(
          chatId,
          "📋 <b>No tasks synced yet for today.</b>\n\n" +
          `Remember why you're here: <i>"${why}"</i>.\n` +
          "Open the app now to view your schedule and start executing!"
        )
      } else {
        const remaining = dailyStatus.must_do_total - dailyStatus.must_do_done
        const taskList = dailyStatus.remaining_titles.length > 0
          ? dailyStatus.remaining_titles.map((t: string) => `• ${t}`).join("\n")
          : "None (All done! 🏆)"

        const reply = `<b>📅 Today's Status (${todayStr})</b>\n\n` +
          `• Progress: <b>${dailyStatus.must_do_done}/${dailyStatus.must_do_total}</b> must-do tasks done\n` +
          `• Status: ${dailyStatus.done_for_today ? "✅ DONE FOR TODAY" : remaining === 0 ? "🎉 All Completed" : `⚠️ ${remaining} TASKS REMAINING`}\n` +
          `• Rest day: ${dailyStatus.rest_day ? "🛋️ Yes" : "No"}\n` +
          `• Why you're doing this: <i>"${why}"</i>\n\n` +
          `<b>Remaining Tasks:</b>\n${taskList}`

        await sendTelegramMessage(chatId, reply, {
          inline_keyboard: [
            [
              { text: "💤 Snooze 1h", callback_data: "snooze_1h" },
              { text: "📱 Open App", url: APP_URL },
            ],
          ],
        })
      }
    } else if (text === "/tomorrow") {
      // Calculate tomorrow's plan
      const now = new Date()
      const tomorrowObj = new Date(now)
      tomorrowObj.setDate(tomorrowObj.getDate() + 1)
      const tomorrowStr = tomorrowObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      const tomorrowWeekday = tomorrowObj.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long" })

      const { data: planWeekRecords } = await supabase
        .from("sync_records")
        .select("data")
        .eq("user_id", userId)
        .eq("entity", "planWeeks")
        .eq("deleted", false)

      let matchingWeek: any = null
      if (planWeekRecords && planWeekRecords.length > 0) {
        matchingWeek = planWeekRecords
          .map((r: any) => r.data)
          .find((w: any) => tomorrowStr >= w.startDate && tomorrowStr <= w.endDate)
      }

      if (!matchingWeek) {
        matchingWeek = DEFAULT_PLAN_WEEKS.find((w) => tomorrowStr >= w.startDate && tomorrowStr <= w.endDate)
      }

      let planReply = matchingWeek
        ? `🎯 <b>TOMORROW'S BATTLE PLAN (${tomorrowWeekday}, ${tomorrowStr})</b>\n\n` +
          `• <b>Week ${matchingWeek.weekNumber}:</b> ${matchingWeek.focusTopic}\n` +
          `• <b>DSA Target:</b> ${matchingWeek.dsaGoal}\n` +
          `• <b>System Design / CS:</b> ${matchingWeek.studyGoal}\n\n` +
          `<i>"Tomorrow you don't negotiate with your laziness. You wake up and execute."</i>`
        : `🎯 <b>TOMORROW'S PLAN (${tomorrowWeekday}, ${tomorrowStr})</b>\n\nPlan begins on 11th Nov. Review terminology and set up your environment!`

      if (matchingWeek) {
        try {
          const aiPlan = await generateAITomorrowPlan({
            todayDate: todayStr,
            tomorrowDate: tomorrowStr,
            tomorrowWeekday,
            weekNumber: matchingWeek.weekNumber,
            focusTopic: matchingWeek.focusTopic,
            dsaGoal: matchingWeek.dsaGoal,
            studyGoal: matchingWeek.studyGoal,
            mustDoTotal: dailyStatus?.must_do_total || 4,
            mustDoDone: dailyStatus?.must_do_done || 0,
            remainingTitles: dailyStatus?.remaining_titles || [],
            streak: 0,
            whyIMustSwitch: why,
          })
          if (aiPlan) {
            planReply = aiPlan
          }
        } catch (e) {
          console.warn("AI plan generation error, using standard template:", e)
        }
      }

      await sendTelegramMessage(chatId, planReply, {
        inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
      })
    } else if (text === "/done") {
      if (!dailyStatus) {
        await sendTelegramMessage(chatId, "Open the app to log your tasks first.")
      } else if (dailyStatus.must_do_done >= dailyStatus.must_do_total) {
        await supabase
          .from("daily_status")
          .update({ done_for_today: true })
          .eq("user_id", userId)
          .eq("date", todayStr)

        await sendTelegramMessage(
          chatId,
          "🏆 <b>STREAK PROTECTED!</b>\n\n" +
          "All must-do tasks are complete. You did what you said you would do. Rest well and be ready for tomorrow's briefing at 21:30!"
        )
      } else {
        const remaining = dailyStatus.must_do_total - dailyStatus.must_do_done
        await sendTelegramMessage(
          chatId,
          `⛔ <b>NOT YET!</b> You still have ${remaining} must-do task(s) remaining:\n\n` +
          dailyStatus.remaining_titles.map((t: string) => `• ${t}`).join("\n") +
          "\n\nNo shortcuts. Sit down, complete them, or mark partial progress in the app."
        )
      }
    } else if (text === "/snooze") {
      const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      await supabase
        .from("daily_status")
        .update({ snoozed_until: snoozeUntil })
        .eq("user_id", userId)
        .eq("date", todayStr)

      await sendTelegramMessage(chatId, "💤 Reminders snoozed for 1 hour. Make sure you return to your desk!")
    } else if (text === "/help") {
      const help = "<b>Job Switch Tracker Hardcore Bot Commands:</b>\n\n" +
        "/today - View today's checklist and progress\n" +
        "/tomorrow - View tomorrow's battle plan\n" +
        "/done - Mark today complete and lock in your streak\n" +
        "/snooze - Snooze nagging for 1 hour\n" +
        "/status - Summary of your current preparation streak\n" +
        "/help - Show this guide"

      await sendTelegramMessage(chatId, help, {
        inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
      })
    } else {
      await sendTelegramMessage(chatId, "Type /today to view remaining tasks, /tomorrow for tomorrow's plan, or /help for all commands.")
    }

    return jsonResponse({ ok: true })
  } catch (err: any) {
    console.error("Webhook processing error:", err)
    return jsonResponse({ error: err.message }, 500)
  }
})
