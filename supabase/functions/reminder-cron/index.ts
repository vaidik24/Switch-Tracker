import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { shouldSend, ReminderSettings, DailyStatus, ReminderLogEntry, MessageToSend, TomorrowPlanSummary } from "../_shared/shouldSend.ts"
import { generateAITomorrowPlan, generateAINagMessage } from "../_shared/gemini.ts"
import { NEETCODE_150 } from "../_shared/neetcode150.ts"
import { CS_MICRO_CURRICULUM } from "../_shared/csMicroCurriculum.ts"

const CRON_SECRET = Deno.env.get("CRON_SECRET") || ""
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const APP_URL = Deno.env.get("APP_URL") || "https://tracker.vaidik.dev"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Default 2-month plan schedule (11 Nov 2026 - 10 Jan 2027) fallback
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

/** Helper to compute local time parts in an IANA timezone */
function getLocalTimeInTimezone(tz: string): {
  iso: string
  dateStr: string
  hour: number
  minute: number
  dayOfWeek: number
} {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`
  const hour = parseInt(get("hour"), 10) || 0
  const minute = parseInt(get("minute"), 10) || 0

  const weekdayStr = get("weekday")
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const dayOfWeek = weekdayMap[weekdayStr] ?? 0

  return {
    iso: now.toISOString(),
    dateStr,
    hour,
    minute,
    dayOfWeek,
  }
}

/** Sends message to Telegram */
async function sendTelegram(chatId: number, message: MessageToSend): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, status: 0, error: "No bot token configured" }

  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = []
  const row: Array<{ text: string; callback_data?: string; url?: string }> = []

  if (message.suggestSnooze) {
    row.push({ text: "💤 Snooze 1h", callback_data: "snooze_1h" })
  }
  row.push({ text: "📱 Open App", url: APP_URL })
  keyboard.push(row)

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.warn("Telegram sendMessage failed with HTML mode:", errText)
    // Retry as plain text if HTML tags/parsing caused error
    const retryRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text.replace(/<[^>]*>/g, ""),
        reply_markup: { inline_keyboard: keyboard },
      }),
    })
    if (!retryRes.ok) {
      return { ok: false, status: res.status, error: errText }
    }
  }
  return { ok: true, status: 200 }
}

/** Sends message to ntfy.sh */
async function sendNtfy(topic: string, message: MessageToSend): Promise<{ ok: boolean; status: number; error?: string }> {
  const priorityMap: Record<string, string> = {
    default: "3",
    high: "4",
    urgent: "5",
  }

  const url = `https://ntfy.sh/${encodeURIComponent(topic)}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Title: "Job Switch Tracker",
      Priority: priorityMap[message.priority] || "3",
      Click: APP_URL,
      Tags: message.kind === "nag" ? "warning" : "dart",
    },
    body: message.text,
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, status: res.status, error: errText }
  }
  return { ok: true, status: 200 }
}

serve(async (req: Request) => {
  // 1. Authorization check
  const cronHeader = req.headers.get("X-Cron-Secret")
  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "")
  if (CRON_SECRET && cronHeader !== CRON_SECRET && authHeader !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  const url = new URL(req.url)
  const isDryRun = url.searchParams.get("dry_run") === "1"

  try {
    // 2. Fetch all users with enabled notification channels
    const { data: channels, error: chErr } = await supabase
      .from("notification_channels")
      .select("*")
      .eq("enabled", true)

    if (chErr) throw chErr

    const userIds = [...new Set((channels || []).map((c) => c.user_id))]
    const dryRunResults: unknown[] = []
    let totalSent = 0

    // 3. Process each user
    for (const userId of userIds) {
      // Fetch settings
      const { data: rawSettings } = await supabase
        .from("reminder_settings")
        .select("*")
        .eq("user_id", userId)
        .single()

      const settings: ReminderSettings = {
        timezone: rawSettings?.timezone || "Asia/Kolkata",
        morning_time: rawSettings?.morning_time?.slice(0, 5) || "08:00",
        midday_time: rawSettings?.midday_time?.slice(0, 5) || "13:30",
        evening_time: rawSettings?.evening_time?.slice(0, 5) || "19:00",
        final_time: rawSettings?.final_time?.slice(0, 5) || "22:00",
        next_day_plan_time: rawSettings?.next_day_plan_time?.slice(0, 5) || "21:30",
        accountability_tone: rawSettings?.accountability_tone || "hardcore",
        why_i_must_switch: rawSettings?.why_i_must_switch || "To escape career stagnation and master engineering at scale",
        nag_enabled: rawSettings?.nag_enabled ?? true,
        nag_interval_minutes: rawSettings?.nag_interval_minutes ?? 30,
        quiet_start: rawSettings?.quiet_start?.slice(0, 5) || "23:30",
        quiet_end: rawSettings?.quiet_end?.slice(0, 5) || "07:00",
        weekly_review_enabled: rawSettings?.weekly_review_enabled ?? true,
      }

      // Compute local time
      const now = getLocalTimeInTimezone(settings.timezone)

      // Fetch today's status
      const { data: statusRow } = await supabase
        .from("daily_status")
        .select("*")
        .eq("user_id", userId)
        .eq("date", now.dateStr)
        .single()

      const status: DailyStatus | null = statusRow
        ? {
            date: statusRow.date,
            must_do_total: statusRow.must_do_total,
            must_do_done: statusRow.must_do_done,
            remaining_titles: statusRow.remaining_titles || [],
            done_for_today: statusRow.done_for_today,
            rest_day: statusRow.rest_day,
            snoozed_until: statusRow.snoozed_until,
            followups_due: statusRow.followups_due || 0,
          }
        : null

      // Fetch recent logs for user today
      const { data: logsData } = await supabase
        .from("reminder_log")
        .select("slot_key, sent_at, kind")
        .eq("user_id", userId)
        .gte("sent_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("sent_at", { ascending: false })

      const logs: ReminderLogEntry[] = (logsData || []).map((l) => ({
        slot_key: l.slot_key,
        sent_at: l.sent_at,
        kind: l.kind,
      }))

      // Compute tomorrow's plan summary
      const tomorrowObj = new Date(now.iso)
      tomorrowObj.setDate(tomorrowObj.getDate() + 1)
      const tomorrowDateStr = tomorrowObj.toLocaleDateString("en-CA", { timeZone: settings.timezone })
      const tomorrowWeekday = tomorrowObj.toLocaleDateString("en-US", { timeZone: settings.timezone, weekday: "short" })

      // Check synced plan weeks and settings
      const [{ data: planWeekRecords }, { data: syncedSettingsRecord }] = await Promise.all([
        supabase
          .from("sync_records")
          .select("data")
          .eq("user_id", userId)
          .eq("entity", "planWeeks")
          .eq("deleted", false),
        supabase
          .from("sync_records")
          .select("data")
          .eq("user_id", userId)
          .eq("entity", "settings")
          .eq("deleted", false)
          .maybeSingle(),
      ])

      let matchingWeek: any = null
      if (planWeekRecords && planWeekRecords.length > 0) {
        matchingWeek = planWeekRecords
          .map((r: any) => r.data)
          .find((w: any) => tomorrowDateStr >= w.startDate && tomorrowDateStr <= w.endDate)
      }

      if (!matchingWeek) {
        matchingWeek = DEFAULT_PLAN_WEEKS.find((w) => tomorrowDateStr >= w.startDate && tomorrowDateStr <= w.endDate)
      }

      let tomorrowPlanSummary: TomorrowPlanSummary | null = null
      if (matchingWeek) {
        tomorrowPlanSummary = {
          dateStr: tomorrowDateStr,
          weekdayName: tomorrowWeekday,
          weekNumber: matchingWeek.weekNumber,
          focusTopic: matchingWeek.focusTopic,
          dsaGoal: matchingWeek.dsaGoal,
          studyGoal: matchingWeek.studyGoal,
        }
      }

      // Evaluate messages to send
      const messages = shouldSend(now, settings, status, logs, tomorrowPlanSummary)

      if (isDryRun) {
        dryRunResults.push({
          userId,
          localTime: now,
          status,
          evaluatedMessages: messages,
        })
        continue
      }

      // User channels
      const userChannels = (channels || []).filter((c) => c.user_id === userId)

      function getWeekAndDay(planStartDate: string, targetDateStr: string): { weekNumber: number; dayNumber: number } {
        const dStart = new Date(planStartDate + "T00:00:00+05:30").getTime()
        const dTarget = new Date(targetDateStr + "T00:00:00+05:30").getTime()
        const diffDays = Math.floor((dTarget - dStart) / 86400000)
        if (diffDays < 0) return { weekNumber: 0, dayNumber: 0 }
        const weekNumber = Math.min(Math.floor(diffDays / 7) + 1, 8)
        const dayNumber = (diffDays % 7) + 1
        return { weekNumber, dayNumber }
      }

      for (const msg of messages) {
        let dispatchMsg = { ...msg }

        // Use Gemini API dynamically for Nightly Tomorrow Plan
        if (msg.kind === 'next_day_plan' && tomorrowPlanSummary) {
          try {
            const planStartDate = syncedSettingsRecord?.data?.planStartDate || settings.plan_start_date || "2026-11-16"
            const { weekNumber: tomWeek, dayNumber: tomDay } = getWeekAndDay(planStartDate, tomorrowPlanSummary.dateStr)
            const targetWeek = tomWeek || 1
            const targetDay = tomDay || 1
            const tomorrowNeetCode = NEETCODE_150.filter(p => p.weekNumber === targetWeek && p.dayNumber === targetDay)
            const tomorrowCsTopic = CS_MICRO_CURRICULUM.find(t => t.weekNumber === targetWeek && t.dayNumber === targetDay)

            const aiPlan = await generateAITomorrowPlan({
              todayDate: now.dateStr,
              tomorrowDate: tomorrowPlanSummary.dateStr,
              tomorrowWeekday: tomorrowPlanSummary.weekdayName,
              weekNumber: tomWeek,
              dayNumber: tomDay,
              focusTopic: tomorrowPlanSummary.focusTopic,
              dsaGoal: tomorrowPlanSummary.dsaGoal,
              studyGoal: tomorrowPlanSummary.studyGoal,
              mustDoTotal: status?.must_do_total || 4,
              mustDoDone: status?.must_do_done || 0,
              remainingTitles: status?.remaining_titles || [],
              streak: status?.streak || 0,
              whyIMustSwitch: settings.why_i_must_switch || '',
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
              dispatchMsg.text = aiPlan
            }
          } catch (e) {
            console.warn("AI Tomorrow Plan generation failed, falling back to template:", e)
          }
        }

        // Use Gemini API dynamically for Nighttime Nag Reality Checks
        if (msg.kind === 'nag' && status && status.remaining_titles.length > 0) {
          try {
            const aiNag = await generateAINagMessage({
              todayDate: now.dateStr,
              remainingTasks: status.remaining_titles,
              streak: status?.streak || 0,
              whyIMustSwitch: settings.why_i_must_switch || '',
              currentHour: now.hour,
            })
            if (aiNag) {
              dispatchMsg.text = aiNag
            }
          } catch (e) {
            console.warn("AI Nag reality check generation failed, falling back to template:", e)
          }
        }

        for (const ch of userChannels) {
          if (!ch.enabled) continue

          let dispatchResult: { ok: boolean; status: number; error?: string } = { ok: false, status: 0 }

          if (ch.type === "telegram" && ch.telegram_chat_id && ch.verified) {
            dispatchResult = await sendTelegram(ch.telegram_chat_id, dispatchMsg)

            if (!dispatchResult.ok) {
              if (dispatchResult.status === 403) {
                await supabase
                  .from("notification_channels")
                  .update({ verified: false, last_error: "Bot was blocked by user (403)" })
                  .eq("id", ch.id)
              } else {
                await supabase
                  .from("notification_channels")
                  .update({ last_error: dispatchResult.error || "Send failed" })
                  .eq("id", ch.id)
              }
            }
          } else if (ch.type === "ntfy" && ch.ntfy_topic) {
            dispatchResult = await sendNtfy(ch.ntfy_topic, msg)
            if (!dispatchResult.ok) {
              await supabase
                .from("notification_channels")
                .update({ last_error: dispatchResult.error || "Ntfy failed" })
                .eq("id", ch.id)
            }
          }

          if (dispatchResult.ok) {
            totalSent++
          }

          await supabase.from("reminder_log").insert({
            user_id: userId,
            kind: msg.kind,
            slot_key: msg.slot_key,
            channel_type: ch.type,
            status: dispatchResult.ok ? "sent" : "failed",
            error: dispatchResult.error || null,
          })
        }
      }
    }

    if (isDryRun) {
      return new Response(JSON.stringify({ dryRun: true, results: dryRunResults }, null, 2), {
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersCount: userIds.length,
        totalSent,
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("Reminder cron error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
