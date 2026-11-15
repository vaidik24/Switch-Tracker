/**
 * Pure decision module for reminder dispatching inside Supabase Edge Functions.
 */

export interface ReminderSettings {
  timezone: string
  morning_time: string         // "08:00"
  midday_time: string          // "13:30"
  evening_time: string         // "19:00"
  final_time: string           // "22:00"
  next_day_plan_time?: string  // "21:30"
  accountability_tone?: 'hardcore' | 'coach' | 'roast' // default "hardcore"
  why_i_must_switch?: string   // personal North Star
  plan_start_date?: string     // "YYYY-MM-DD" kickoff date
  nag_enabled: boolean
  nag_interval_minutes: number // 15-60
  quiet_start: string          // "23:30"
  quiet_end: string            // "07:00"
  weekly_review_enabled: boolean
}

export interface DailyStatus {
  date: string             // "YYYY-MM-DD"
  must_do_total: number
  must_do_done: number
  remaining_titles: string[]
  done_for_today: boolean
  rest_day: boolean
  snoozed_until: string | null // ISO string
  followups_due: number
}

export interface ReminderLogEntry {
  slot_key: string
  sent_at: string
  kind: string
}

export interface TomorrowPlanSummary {
  dateStr: string
  weekdayName: string
  weekNumber: number
  focusTopic: string
  dsaGoal: string
  studyGoal: string
}

export interface MessageToSend {
  kind: 'morning' | 'midday' | 'evening' | 'final' | 'nag' | 'weekly_review' | 'followup' | 'generic_nag' | 'next_day_plan'
  slot_key: string
  text: string
  priority: 'default' | 'high' | 'urgent'
  suggestSnooze: boolean
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function isInQuietHours(currentMinutes: number, quietStart: string, quietEnd: string): boolean {
  const start = parseTimeToMinutes(quietStart)
  const end = parseTimeToMinutes(quietEnd)

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end
  } else {
    return currentMinutes >= start || currentMinutes < end
  }
}

export function shouldSend(
  now: {
    iso: string
    dateStr: string
    hour: number
    minute: number
    dayOfWeek: number
  },
  settings: ReminderSettings,
  status: DailyStatus | null,
  logs: ReminderLogEntry[],
  tomorrowPlan?: TomorrowPlanSummary | null
): MessageToSend[] {
  const messages: MessageToSend[] = []
  const currentMinutes = now.hour * 60 + now.minute
  const loggedSlotKeys = new Set(logs.map(l => l.slot_key))
  const tone = settings.accountability_tone || 'hardcore'
  const why = settings.why_i_must_switch || 'To escape career stagnation and land a high-impact Tier-1 role'

  if (isInQuietHours(currentMinutes, settings.quiet_start, settings.quiet_end)) {
    return []
  }

  const isSnoozed = status?.snoozed_until ? new Date(now.iso) < new Date(status.snoozed_until) : false
  const isRestDay = status?.rest_day === true
  const isAllDone = status ? (status.done_for_today || status.must_do_done >= status.must_do_total) : false
  const isBaseline = settings.plan_start_date ? now.dateStr < settings.plan_start_date : false

  const isSlotDue = (slotTime: string): boolean => {
    const slotMins = parseTimeToMinutes(slotTime)
    return currentMinutes >= slotMins && currentMinutes < slotMins + 15
  }

  // 1. Morning slot (08:00)
  const morningKey = `fixed:${now.dateStr}:morning`
  if (isSlotDue(settings.morning_time) && !loggedSlotKeys.has(morningKey)) {
    if (!status) {
      messages.push({
        kind: 'morning',
        slot_key: morningKey,
        text: tone === 'hardcore'
          ? `⚔️ Wake up Vaidik! Remember why you started: "${why}". Don't let today slip into excuses. Open the app and face today's plan.`
          : "🌅 Good morning Vaidik! Open the app to see today's preparation plan.",
        priority: 'default',
        suggestSnooze: false,
      })
    } else if (isRestDay) {
      messages.push({
        kind: 'morning',
        slot_key: morningKey,
        text: '🌅 Rest Day Active. Rest deeply, clear your mind, and be ready to conquer tomorrow.',
        priority: 'default',
        suggestSnooze: false,
      })
    } else {
      const taskCount = status.must_do_total
      const taskList = status.remaining_titles.slice(0, 3).join(', ')
      messages.push({
        kind: 'morning',
        slot_key: morningKey,
        text: tone === 'hardcore'
          ? `⚔️ DAY OF BATTLE: ${taskCount} must-do tasks on your board: ${taskList || 'Daily targets'}.\n\nWhy you're here: "${why}". No excuses today. Lock in your streak early!`
          : `🌅 Good morning! ${taskCount} target tasks today: ${taskList || 'Ready to start'}. Let's keep the streak alive!`,
        priority: 'default',
        suggestSnooze: false,
      })
    }
  }

  // 2. Midday slot (13:30)
  const middayKey = `fixed:${now.dateStr}:midday`
  if (isSlotDue(settings.midday_time) && !loggedSlotKeys.has(middayKey)) {
    if (status && !isAllDone && !isRestDay && !isSnoozed) {
      const remaining = status.must_do_total - status.must_do_done
      messages.push({
        kind: 'midday',
        slot_key: middayKey,
        text: tone === 'hardcore'
          ? `⏱️ MIDDAY REALITY CHECK: ${remaining} tasks left. Half your day is already gone. Are you going to let today waste away while other engineers prepare? Tackle your DSA problem right now.`
          : `☀️ Midday check-in: ${remaining} tasks remaining for today. Have you tackled your DSA revision yet?`,
        priority: 'default',
        suggestSnooze: true,
      })
    }
  }

  // 3. Evening slot (19:00)
  const eveningKey = `fixed:${now.dateStr}:evening`
  if (isSlotDue(settings.evening_time) && !loggedSlotKeys.has(eveningKey)) {
    if (status && !isAllDone && !isRestDay && !isSnoozed) {
      const remaining = status.must_do_total - status.must_do_done
      const list = status.remaining_titles.slice(0, 3).join(', ')
      messages.push({
        kind: 'evening',
        slot_key: eveningKey,
        text: tone === 'hardcore'
          ? `🌆 EVENING CHECKPOINT: ${remaining} tasks remaining (${list}).\n\nThe only thing between you and your dream role is what you do in the next 90 minutes. Sit down at your desk and start.`
          : `🌆 Evening checkpoint: ${remaining} tasks left (${list}). A solid 45-minute focus session will lock in your streak!`,
        priority: 'high',
        suggestSnooze: true,
      })
    }
  }

  // 4. Nightly Briefing: Tomorrow's Battle Plan (21:30)
  const nextDayPlanTime = settings.next_day_plan_time || '21:30'
  const nextDayPlanKey = `next_day_plan:${now.dateStr}`
  if (isSlotDue(nextDayPlanTime) && !loggedSlotKeys.has(nextDayPlanKey)) {
    let briefingText = ''
    if (tomorrowPlan) {
      briefingText = `🎯 <b>TOMORROW'S BATTLE PLAN (${tomorrowPlan.weekdayName}, ${tomorrowPlan.dateStr})</b>\n\n` +
        `• <b>Week ${tomorrowPlan.weekNumber}:</b> ${tomorrowPlan.focusTopic}\n` +
        `• <b>DSA Focus:</b> ${tomorrowPlan.dsaGoal}\n` +
        `• <b>System Design / CS:</b> ${tomorrowPlan.studyGoal}\n\n` +
        (isAllDone
          ? `🔥 Today is 100% conquered! Sleep well knowing you moved forward. Attack tomorrow with zero hesitation.`
          : `⚠️ You still have tasks today! Finish them up before sleeping so you start tomorrow with a clean slate.`)
    } else {
      briefingText = `🎯 <b>TOMORROW'S PREPARATION BRIEFING</b>\n\n` +
        `Tomorrow is a brand new opportunity to execute. Open the app to view your tailored schedule and protect your momentum.`
    }

    messages.push({
      kind: 'next_day_plan',
      slot_key: nextDayPlanKey,
      text: briefingText,
      priority: 'high',
      suggestSnooze: false,
    })
  }

  // 5. Final slot (22:00)
  const finalKey = `fixed:${now.dateStr}:final`
  if (isSlotDue(settings.final_time) && !loggedSlotKeys.has(finalKey)) {
    if (isBaseline) {
      messages.push({
        kind: 'final',
        slot_key: finalKey,
        text: `🌙 BASELINE DAY COMPLETE: Tomorrow kicks off Week 1, Day 1 of your hardcore prep. Rest up, protect your energy, and be ready to execute at 100%.`,
        priority: 'default',
        suggestSnooze: false,
      })
    } else if (status && !isAllDone && !isRestDay && !isSnoozed) {
      const remaining = status.must_do_total - status.must_do_done
      messages.push({
        kind: 'final',
        slot_key: finalKey,
        text: tone === 'hardcore'
          ? `🚨 LAST CALL — STREAK AT RISK: ${remaining} tasks unfinished. You either finish these before midnight or your streak resets to ZERO. Do you want to start over from Day 1? Get it done!`
          : `🌙 Last call today: ${remaining} tasks left. Finish up or mark your progress before bed to keep your streak intact!`,
        priority: 'urgent',
        suggestSnooze: true,
      })
    }
  }

  // Follow-ups
  const followupKey = `followups:${now.dateStr}`
  if (
    status &&
    status.followups_due > 0 &&
    currentMinutes >= parseTimeToMinutes(settings.midday_time) &&
    !loggedSlotKeys.has(followupKey)
  ) {
    messages.push({
      kind: 'followup',
      slot_key: followupKey,
      text: `📬 You have ${status.followups_due} job application follow-up(s) due today. Check your pipeline to send outreach!`,
      priority: 'default',
      suggestSnooze: false,
    })
  }

  // Sunday weekly review
  const sundayReviewKey = `sunday_review:${now.dateStr}`
  if (
    now.dayOfWeek === 0 &&
    settings.weekly_review_enabled &&
    currentMinutes >= parseTimeToMinutes(settings.evening_time) &&
    !loggedSlotKeys.has(sundayReviewKey)
  ) {
    messages.push({
      kind: 'weekly_review',
      slot_key: sundayReviewKey,
      text: "📊 Sunday Review Time: Complete your 5-minute Weekly Review & download a backup to prepare for next week.",
      priority: 'high',
      suggestSnooze: false,
    })
  }

  // Nag Mode
  const eveningMinutes = parseTimeToMinutes(settings.evening_time)
  const isAfterEvening = currentMinutes >= eveningMinutes

  if (settings.nag_enabled && isAfterEvening && !isRestDay && !isSnoozed && !isBaseline) {
    if (status && !isAllDone) {
      const recentNags = logs.filter(l => l.kind === 'nag' || l.kind === 'evening')
      let shouldNagNow = false

      if (recentNags.length === 0) {
        shouldNagNow = true
      } else {
        const lastSent = new Date(recentNags[0].sent_at).getTime()
        const nowMs = new Date(now.iso).getTime()
        const minutesSinceLast = (nowMs - lastSent) / 60000
        if (minutesSinceLast >= settings.nag_interval_minutes - 2) {
          shouldNagNow = true
        }
      }

      if (shouldNagNow) {
        const bucket = Math.floor(currentMinutes / settings.nag_interval_minutes)
        const nagSlotKey = `nag:${now.dateStr}:${bucket}`

        if (!loggedSlotKeys.has(nagSlotKey)) {
          const remaining = status.must_do_total - status.must_do_done
          const taskList = status.remaining_titles.slice(0, 2).join(' and ')
          messages.push({
            kind: 'nag',
            slot_key: nagSlotKey,
            text: tone === 'hardcore'
              ? `🔥 HARDCORE NAG: ${remaining} tasks still waiting (${taskList}).\n\nYou promised yourself a switch. Don't let your future self down. Stop scrolling, get to your desk, and execute!`
              : `⚠️ NAG: ${remaining} tasks still waiting (${taskList}). Don't break the streak! Get it done now.`,
            priority: 'urgent',
            suggestSnooze: true,
          })
        }
      }
    } else if (!status) {
      const recentGeneric = logs.filter(l => l.kind === 'generic_nag')
      let shouldGenericNag = false

      if (recentGeneric.length === 0) {
        shouldGenericNag = true
      } else {
        const lastSent = new Date(recentGeneric[0].sent_at).getTime()
        const nowMs = new Date(now.iso).getTime()
        const minutesSinceLast = (nowMs - lastSent) / 60000
        if (minutesSinceLast >= 58) {
          shouldGenericNag = true
        }
      }

      if (shouldGenericNag) {
        const bucket60 = Math.floor(currentMinutes / 60)
        const genericKey = `generic_nag:${now.dateStr}:${bucket60}`
        if (!loggedSlotKeys.has(genericKey)) {
          messages.push({
            kind: 'generic_nag',
            slot_key: genericKey,
            text: tone === 'hardcore'
              ? `🚨 ZERO ACTIVITY DETECTED: You haven't opened the tracker today. Are you quitting on your 2-month goal? Open the app and face your tasks now!`
              : "🔔 Haven't seen your daily tracker activity today. Open the app to log your tasks and protect your streak!",
            priority: 'high',
            suggestSnooze: false,
          })
        }
      }
    }
  }

  return messages
}
