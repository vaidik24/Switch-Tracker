import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { generateAITomorrowPlan } from "../_shared/gemini.ts"
import { NEETCODE_150 } from "../_shared/neetcode150.ts"
import { CS_MICRO_CURRICULUM } from "../_shared/csMicroCurriculum.ts"

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const APP_URL = Deno.env.get("APP_URL") || "https://tracker.vaidik.dev"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const DEFAULT_PLAN_WEEKS = [
  {
    weekNumber: 0,
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    focusTopic: 'Baseline & Environment Setup',
    dsaGoal: 'Solve 3 medium problems timed; setup spaced repetition',
    studyGoal: 'Read terminology list end-to-end; configure Telegram reminders',
  },
  {
    weekNumber: 1,
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    focusTopic: 'Arrays, Two Pointers, Sliding Window + OS & Node.js',
    dsaGoal: '20-25 problems: arrays, hashing, two pointers, sliding window',
    studyGoal: 'OS: processes, threads, event loop phases, scheduling, memory leaks',
  },
  {
    weekNumber: 2,
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    focusTopic: 'Stack, Monotonic Stack, Binary Search, Linked Lists + DBMS',
    dsaGoal: '25 problems: stack, monotonic stack, binary search, linked lists',
    studyGoal: 'DBMS: ACID, B-Tree indexes, isolation levels, transactions, EXPLAIN ANALYZE',
  },
  {
    weekNumber: 3,
    startDate: '2026-11-30',
    endDate: '2026-12-06',
    focusTopic: 'Trees, BST, Heaps, Priority Queues + Networks & Auth',
    dsaGoal: '25 problems: binary trees, BST traversal, heaps, top-K',
    studyGoal: 'Networks: HTTP/1.1-3, TCP, TLS, WebSockets, JWT, OAuth2 sessions',
  },
  {
    weekNumber: 4,
    startDate: '2026-12-07',
    endDate: '2026-12-13',
    focusTopic: 'Graphs (BFS/DFS), Topological Sort, Union Find + LLD 1-3',
    dsaGoal: '25 problems: graph BFS/DFS, cycle detection, topological sort, union find',
    studyGoal: 'OOP, SOLID, Design Patterns, LLD 1-3 (LRU/LFU cache, Rate limiter, Parking lot)',
  },
  {
    weekNumber: 5,
    startDate: '2026-12-14',
    endDate: '2026-12-20',
    focusTopic: 'Backtracking, Intervals, Greedy, 1D DP + LLD 4-8',
    dsaGoal: '25 problems: intervals, greedy, 1D dynamic programming',
    studyGoal: 'LLD 4-8: BookMyShow concurrency, Splitwise, Elevator, In-memory KV store with TTL',
  },
  {
    weekNumber: 6,
    startDate: '2026-12-21',
    endDate: '2026-12-27',
    focusTopic: '2D DP, Shortest Path (Dijkstra), Trie + HLD Systems',
    dsaGoal: '20 problems: 2D DP, Dijkstra, Trie',
    studyGoal: 'HLD Core: Load balancers, CDN, Caching strategies, Partitioning, Kafka & Redis deep dive',
  },
  {
    weekNumber: 7,
    startDate: '2026-12-28',
    endDate: '2027-01-03',
    focusTopic: 'Complex System Design (HLD) + Behavioural Mastery',
    dsaGoal: '15 hard/mixed problem drills + spaced revision',
    studyGoal: 'HLD Systems: Chat/WhatsApp, Video Upload, Distributed Idempotent Payment/Ledger',
  },
  {
    weekNumber: 8,
    startDate: '2027-01-04',
    endDate: '2027-01-15',
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

async function sendChatAction(chatId: number, action = "typing") {
  if (!TELEGRAM_BOT_TOKEN) return
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    })
  } catch (err) {
    console.warn("Failed to send chat action:", err)
  }
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set in Edge Function secrets!")
    return
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  }
  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn("Telegram sendMessage failed with HTML mode:", errText)
      // If Telegram rejects due to HTML entity formatting, fallback to plain text
      delete body.parse_mode
      body.text = text.replace(/<[^>]*>/g, "")
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    }
  } catch (err) {
    console.error("Failed to call Telegram API:", err)
  }
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
    const command = text.split("@")[0].split(" ")[0].toLowerCase()
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // Command: /start <code>
    if (command === "/start") {
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
      } else {
        await sendTelegramMessage(
          chatId,
          "👋 <b>Welcome to Job Switch Tracker!</b>\n\n" +
          "To link this bot to your account, open the tracker web app, go to <b>Settings -> Phone Reminders</b>, and tap <b>Connect Telegram Bot</b>."
        )
        return jsonResponse({ ok: true })
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
      await sendTelegramMessage(
        chatId,
        "⚠️ <b>Account Not Linked</b>\n\n" +
        "Your Telegram account is not linked to your Job Switch Tracker yet.\n\n" +
        "<b>To connect:</b>\n" +
        "1. Open your tracker app\n" +
        "2. Go to <b>Settings -> Phone Reminders</b>\n" +
        "3. Tap <b>Connect Telegram Bot</b> and tap the generated link.",
        {
          inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
        }
      )
      return jsonResponse({ ok: true })
    }

    const userId = channel.user_id

    // Fetch daily status, reminder settings, synced settings, and plan weeks
    const [
      { data: dailyStatus },
      { data: userSettings },
      { data: syncedSettingsRecord },
      { data: planWeekRecords },
    ] = await Promise.all([
      supabase.from("daily_status").select("*").eq("user_id", userId).eq("date", todayStr).single(),
      supabase.from("reminder_settings").select("*").eq("user_id", userId).single(),
      supabase.from("sync_records").select("data").eq("user_id", userId).eq("entity", "settings").eq("deleted", false).maybeSingle(),
      supabase.from("sync_records").select("data").eq("user_id", userId).eq("entity", "planWeeks").eq("deleted", false),
    ])

    const why = syncedSettingsRecord?.data?.whyIMustSwitch || userSettings?.why_i_must_switch || "To escape career stagnation and land a high-impact Tier-1 role"
    const planStartDate = syncedSettingsRecord?.data?.planStartDate || userSettings?.plan_start_date || "2026-11-16"

    function getWeekAndDay(startDate: string, targetDateStr: string): { weekNumber: number; dayNumber: number } {
      const dStart = new Date(startDate + "T00:00:00+05:30").getTime()
      const dTarget = new Date(targetDateStr + "T00:00:00+05:30").getTime()
      const diffDays = Math.floor((dTarget - dStart) / 86400000)
      if (diffDays < 0) return { weekNumber: 0, dayNumber: 0 }
      const weekNumber = Math.min(Math.floor(diffDays / 7) + 1, 8)
      const dayNumber = (diffDays % 7) + 1
      return { weekNumber, dayNumber }
    }

    const { weekNumber, dayNumber } = getWeekAndDay(planStartDate, todayStr)
    const isBaseline = weekNumber === 0

    if (command === "/today" || command === "/status") {
      await sendChatAction(chatId, "typing")

      if (isBaseline) {
        const tomorrowObj = new Date()
        tomorrowObj.setDate(tomorrowObj.getDate() + 1)
        const tomorrowStr = tomorrowObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        const isTomorrowStart = tomorrowStr === planStartDate

        const day1NeetCode = NEETCODE_150.filter(p => p.weekNumber === 1 && p.dayNumber === 1)
        const day1CsTopic = CS_MICRO_CURRICULUM.find(t => t.weekNumber === 1 && t.dayNumber === 1)

        const reply = `<b>📅 AAJ KA STATUS: Baseline Setup (Week 0)</b>\n\n` +
          `<b>North Star:</b> <i>"${why}"</i>\n\n` +
          (isTomorrowStart
            ? `🚀 <b>Kal (${planStartDate}) se tera 2-month hardcore switch plan officially shuru ho raha hai!</b>\n\n`
            : `⏳ Plan start date: <b>${planStartDate}</b>\n\n`) +
          `🎯 <b>Aaj ka Baseline Goal:</b>\n` +
          `• Environment setup complete kar (IDE, LeetCode, Notes)\n` +
          `• 3 baseline medium problems timed solve kar\n` +
          `• Spaced repetition revision flow samajh le\n` +
          `• Target 60 companies ki list bana (Zero applications right now!)\n\n` +
          `💻 <b>Kal (Week 1, Day 1) ke first NeetCode 150 targets ready hain:</b>\n` +
          day1NeetCode.map(p => `• <a href="${p.url}">${p.title}</a> (<b>${p.difficulty}</b>, ⏱️ ${p.estMinutes}m)`).join("\n") +
          (day1CsTopic ? `\n\n🧠 <b>Kal ka CS Topic:</b>\n• <b>${day1CsTopic.title}</b> (⏱️ ${day1CsTopic.estMinutes}m)\n  <i>${day1CsTopic.deliverable}</i>` : "") +
          `\n\n<i>Type /tomorrow to preview kal ka complete battle plan from Gemini!</i>`

        await sendTelegramMessage(chatId, reply, {
          inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
        })
        return jsonResponse({ ok: true })
      }

      const todayNeetCode = NEETCODE_150.filter(p => p.weekNumber === weekNumber && p.dayNumber === dayNumber)
      const todayCsTopic = CS_MICRO_CURRICULUM.find(t => t.weekNumber === weekNumber && t.dayNumber === dayNumber)

      const remaining = dailyStatus ? dailyStatus.must_do_total - dailyStatus.must_do_done : 4
      const remainingTasks = dailyStatus?.remaining_titles || []

      let ncListText = todayNeetCode.map(p => `• <a href="${p.url}">${p.title}</a> (<b>${p.difficulty}</b>, ⏱️ ${p.estMinutes}m)`).join("\n")
      if (!ncListText) ncListText = "• Review weak patterns & revision queue"

      let csTopicText = todayCsTopic
        ? `• <b>${todayCsTopic.title}</b> (⏱️ ${todayCsTopic.estMinutes}m)\n  <i>${todayCsTopic.deliverable}</i>`
        : "• Deep dive into week's core concepts"

      let statusLine = ""
      if (dailyStatus?.done_for_today) {
        statusLine = "🏆 <b>DONE FOR TODAY! Streak safe.</b>"
      } else if (remaining === 0 && dailyStatus) {
        statusLine = "🎉 <b>All tasks done! Tap /done to lock streak.</b>"
      } else {
        statusLine = `⚠️ <b>${remaining} tasks pending!</b> Aage badho aur khatam karo.`
      }

      const reply = `<b>📅 AAJ KA BATTLE PLAN (${todayStr} · Week ${weekNumber}, Day ${dayNumber})</b>\n\n` +
        `<b>North Star:</b> <i>"${why}"</i>\n\n` +
        `💻 <b>NeetCode 150 Targets:</b>\n${ncListText}\n\n` +
        `🧠 <b>CS Micro-Topic:</b>\n${csTopicText}\n\n` +
        `📊 <b>Progress:</b> ${dailyStatus?.must_do_done || 0}/${dailyStatus?.must_do_total || 4} done | ${statusLine}\n` +
        (remainingTasks.length > 0 ? `\n<b>Bache huye items:</b>\n${remainingTasks.map((t: string) => `• ${t}`).join("\n")}` : "")

      await sendTelegramMessage(chatId, reply, {
        inline_keyboard: [
          [
            { text: "💤 Snooze 1h", callback_data: "snooze_1h" },
            { text: "📱 Open App", url: APP_URL },
          ],
        ],
      })
    } else if (command === "/tomorrow") {
      // Immediate typing indicator while Gemini analyzes and thinks!
      await sendChatAction(chatId, "typing")

      // Calculate tomorrow's plan
      const now = new Date()
      const tomorrowObj = new Date(now)
      tomorrowObj.setDate(tomorrowObj.getDate() + 1)
      const tomorrowStr = tomorrowObj.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      const tomorrowWeekday = tomorrowObj.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long" })

      const { weekNumber: tomWeek, dayNumber: tomDay } = getWeekAndDay(planStartDate, tomorrowStr)
      const tomorrowNeetCode = NEETCODE_150.filter(p => p.weekNumber === tomWeek && p.dayNumber === tomDay)
      const tomorrowCsTopic = CS_MICRO_CURRICULUM.find(t => t.weekNumber === tomWeek && t.dayNumber === tomDay)

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
        matchingWeek = DEFAULT_PLAN_WEEKS.find((w) => tomorrowStr >= w.startDate && tomorrowStr <= w.endDate) || DEFAULT_PLAN_WEEKS[1]
      }

      let ncListText = tomorrowNeetCode.map(p => `• <a href="${p.url}">${p.title}</a> (${p.difficulty}, ⏱️ ${p.estMinutes}m)`).join("\n")
      if (!ncListText) ncListText = `• ${matchingWeek.dsaGoal}`

      let csTopicText = tomorrowCsTopic
        ? `• <b>${tomorrowCsTopic.title}</b> (⏱️ ${tomorrowCsTopic.estMinutes}m)\n  <i>${tomorrowCsTopic.deliverable}</i>`
        : `• ${matchingWeek.studyGoal}`

      let planReply = `🎯 <b>KAL KA BATTLE PLAN (${tomorrowWeekday}, ${tomorrowStr} · Week ${tomWeek}, Day ${tomDay})</b>\n\n` +
        `• <b>Focus Topic:</b> ${matchingWeek.focusTopic}\n\n` +
        `💻 <b>NeetCode 150 Targets:</b>\n${ncListText}\n\n` +
        `🧠 <b>CS Micro-Topic:</b>\n${csTopicText}\n\n` +
        `<i>"Kal subah apne laziness se koi negotiation nahi. Utho, code editor kholo aur execute karo."</i>`

      try {
        const aiPlan = await generateAITomorrowPlan({
          todayDate: todayStr,
          tomorrowDate: tomorrowStr,
          tomorrowWeekday,
          weekNumber: tomWeek,
          dayNumber: tomDay,
          focusTopic: matchingWeek.focusTopic,
          dsaGoal: matchingWeek.dsaGoal,
          studyGoal: matchingWeek.studyGoal,
          mustDoTotal: dailyStatus?.must_do_total || 4,
          mustDoDone: dailyStatus?.must_do_done || 0,
          remainingTitles: dailyStatus?.remaining_titles || [],
          streak: 0,
          whyIMustSwitch: why,
          tomorrowNeetCode: tomorrowNeetCode.map(p => ({
            title: p.title,
            difficulty: p.difficulty,
            estMinutes: p.estMinutes,
            url: p.url,
          })),
          tomorrowCsTopic: tomorrowCsTopic ? {
            title: tomorrowCsTopic.title,
            estMinutes: tomorrowCsTopic.estMinutes,
            deliverable: tomorrowCsTopic.deliverable,
          } : null,
        })
        if (aiPlan) {
          planReply = aiPlan
        }
      } catch (e) {
        console.warn("AI plan generation error, using fallback template:", e)
      }

      await sendTelegramMessage(chatId, planReply, {
        inline_keyboard: [[{ text: "📱 Open App", url: APP_URL }]],
      })
    } else if (command === "/done") {
      await sendChatAction(chatId, "typing")
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
    } else if (command === "/snooze") {
      const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      await supabase
        .from("daily_status")
        .update({ snoozed_until: snoozeUntil })
        .eq("user_id", userId)
        .eq("date", todayStr)

      await sendTelegramMessage(chatId, "💤 Reminders snoozed for 1 hour. Make sure you return to your desk!")
    } else if (command === "/help") {
      const help = "<b>Job Switch Tracker Hardcore Bot Commands:</b>\n\n" +
        "/today - View today's checklist and progress\n" +
        "/tomorrow - View tomorrow's battle plan (Gemini AI)\n" +
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
