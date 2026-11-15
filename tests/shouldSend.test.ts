import { describe, it, expect } from 'vitest'
import {
  shouldSend,
  isInQuietHours,
  ReminderSettings,
  DailyStatus,
  ReminderLogEntry,
  TomorrowPlanSummary,
} from '../src/lib/serverReminderEngine'

describe('serverReminderEngine (shouldSend with Hardcore Mode & Tomorrow Plan)', () => {
  const baseSettings: ReminderSettings = {
    timezone: 'Asia/Kolkata',
    morning_time: '08:00',
    midday_time: '13:30',
    evening_time: '19:00',
    final_time: '22:00',
    next_day_plan_time: '21:30',
    accountability_tone: 'hardcore',
    why_i_must_switch: 'To escape career stagnation and command 35L+ CTC',
    nag_enabled: true,
    nag_interval_minutes: 30,
    quiet_start: '23:30',
    quiet_end: '07:00',
    weekly_review_enabled: true,
  }

  const unfinishedStatus: DailyStatus = {
    date: '2026-11-11',
    must_do_total: 4,
    must_do_done: 1,
    remaining_titles: ['DSA Revision', 'System Design LLD', 'STAR Story'],
    done_for_today: false,
    rest_day: false,
    snoozed_until: null,
    followups_due: 0,
  }

  const dummyTomorrowPlan: TomorrowPlanSummary = {
    dateStr: '2026-11-12',
    weekdayName: 'Thursday',
    weekNumber: 1,
    focusTopic: 'Arrays, Two Pointers, Sliding Window + OS & Node.js',
    dsaGoal: '20-25 problems: arrays, hashing, two pointers',
    studyGoal: 'OS: processes, threads, event loop phases',
  }

  it('checks quiet hours crossing midnight correctly', () => {
    expect(isInQuietHours(23 * 60 + 45, '23:30', '07:00')).toBe(true)
    expect(isInQuietHours(3 * 60, '23:30', '07:00')).toBe(true)
    expect(isInQuietHours(6 * 60 + 59, '23:30', '07:00')).toBe(true)
    expect(isInQuietHours(7 * 60 + 1, '23:30', '07:00')).toBe(false)
    expect(isInQuietHours(14 * 60, '23:30', '07:00')).toBe(false)
  })

  it('sends morning reminder with hardcore battle mindset at 08:05 and is idempotent', () => {
    const now = {
      iso: '2026-11-11T08:05:00+05:30',
      dateStr: '2026-11-11',
      hour: 8,
      minute: 5,
      dayOfWeek: 3, // Wednesday
    }

    const messages = shouldSend(now, baseSettings, unfinishedStatus, [])
    expect(messages.length).toBe(1)
    expect(messages[0].kind).toBe('morning')
    expect(messages[0].slot_key).toBe('fixed:2026-11-11:morning')
    expect(messages[0].text).toContain('DAY OF BATTLE')
    expect(messages[0].text).toContain('escape career stagnation')

    // If slot is already logged, do not duplicate
    const logs: ReminderLogEntry[] = [
      { slot_key: 'fixed:2026-11-11:morning', sent_at: now.iso, kind: 'morning' },
    ]
    const afterLogged = shouldSend(now, baseSettings, unfinishedStatus, logs)
    expect(afterLogged.length).toBe(0)
  })

  it('sends midday reality-check reminder at 13:35 if tasks are remaining', () => {
    const now = {
      iso: '2026-11-11T13:35:00+05:30',
      dateStr: '2026-11-11',
      hour: 13,
      minute: 35,
      dayOfWeek: 3,
    }

    const messages = shouldSend(now, baseSettings, unfinishedStatus, [])
    const midday = messages.find(m => m.kind === 'midday')
    expect(midday).toBeDefined()
    expect(midday?.text).toContain('MIDDAY REALITY CHECK')
  })

  it('sends evening checkpoint at 19:05 with urgency', () => {
    const now = {
      iso: '2026-11-11T19:05:00+05:30',
      dateStr: '2026-11-11',
      hour: 19,
      minute: 5,
      dayOfWeek: 3,
    }

    const messages = shouldSend(now, baseSettings, unfinishedStatus, [])
    const eveningMsg = messages.find(m => m.kind === 'evening')
    expect(eveningMsg).toBeDefined()
    expect(eveningMsg?.priority).toBe('high')
    expect(eveningMsg?.text).toContain('EVENING CHECKPOINT')
  })

  it("dispatches Tomorrow's Battle Plan at 21:30 with full briefing", () => {
    const now = {
      iso: '2026-11-11T21:35:00+05:30',
      dateStr: '2026-11-11',
      hour: 21,
      minute: 35,
      dayOfWeek: 3,
    }

    const messages = shouldSend(now, baseSettings, unfinishedStatus, [], dummyTomorrowPlan)
    const planMsg = messages.find(m => m.kind === 'next_day_plan')
    expect(planMsg).toBeDefined()
    expect(planMsg?.slot_key).toBe('next_day_plan:2026-11-11')
    expect(planMsg?.text).toContain("TOMORROW'S BATTLE PLAN")
    expect(planMsg?.text).toContain('Arrays, Two Pointers')
    expect(planMsg?.text).toContain('OS: processes, threads')
  })

  it('triggers hardcore nag mode after evening time spaced by nag_interval_minutes', () => {
    const now = {
      iso: '2026-11-11T20:30:00+05:30',
      dateStr: '2026-11-11',
      hour: 20,
      minute: 30,
      dayOfWeek: 3,
    }

    const logs: ReminderLogEntry[] = [
      { slot_key: 'fixed:2026-11-11:evening', sent_at: '2026-11-11T19:00:00+05:30', kind: 'evening' },
    ]

    const messages = shouldSend(now, baseSettings, unfinishedStatus, logs)
    const nagMsg = messages.find(m => m.kind === 'nag')
    expect(nagMsg).toBeDefined()
    expect(nagMsg?.priority).toBe('urgent')
    expect(nagMsg?.text).toContain('HARDCORE NAG')

    // If nag was sent 10 minutes ago, do NOT nag yet
    const recentNagLogs: ReminderLogEntry[] = [
      { slot_key: 'nag:2026-11-11:40', sent_at: '2026-11-11T20:20:00+05:30', kind: 'nag' },
    ]
    const shouldNotNag = shouldSend(now, baseSettings, unfinishedStatus, recentNagLogs)
    expect(shouldNotNag.filter(m => m.kind === 'nag').length).toBe(0)
  })

  it('suppresses nags when snoozed', () => {
    const now = {
      iso: '2026-11-11T20:30:00+05:30',
      dateStr: '2026-11-11',
      hour: 20,
      minute: 30,
      dayOfWeek: 3,
    }

    const snoozedStatus: DailyStatus = {
      ...unfinishedStatus,
      snoozed_until: '2026-11-11T21:00:00+05:30',
    }

    const messages = shouldSend(now, baseSettings, snoozedStatus, [])
    expect(messages.filter(m => m.kind === 'nag').length).toBe(0)
  })

  it('stops nagging automatically when done_for_today is true or all tasks done', () => {
    const now = {
      iso: '2026-11-11T20:30:00+05:30',
      dateStr: '2026-11-11',
      hour: 20,
      minute: 30,
      dayOfWeek: 3,
    }

    const doneStatus: DailyStatus = {
      ...unfinishedStatus,
      done_for_today: true,
      must_do_done: 4,
    }

    const messages = shouldSend(now, baseSettings, doneStatus, [])
    expect(messages.filter(m => m.kind === 'nag').length).toBe(0)
  })

  it('suppresses nags on a rest day', () => {
    const now = {
      iso: '2026-11-11T20:30:00+05:30',
      dateStr: '2026-11-11',
      hour: 20,
      minute: 30,
      dayOfWeek: 3,
    }

    const restDayStatus: DailyStatus = {
      ...unfinishedStatus,
      rest_day: true,
    }

    const messages = shouldSend(now, baseSettings, restDayStatus, [])
    expect(messages.filter(m => m.kind === 'nag').length).toBe(0)
  })

  it('sends generic nag fallback if no daily_status synced today (max once per 60m)', () => {
    const now = {
      iso: '2026-11-11T20:15:00+05:30',
      dateStr: '2026-11-11',
      hour: 20,
      minute: 15,
      dayOfWeek: 3,
    }

    const messages = shouldSend(now, baseSettings, null, [])
    const generic = messages.find(m => m.kind === 'generic_nag')
    expect(generic).toBeDefined()
    expect(generic?.text).toContain('ZERO ACTIVITY DETECTED')
  })

  it('triggers final call with streak at risk at 22:00', () => {
    const now = {
      iso: '2026-11-11T22:05:00+05:30',
      dateStr: '2026-11-11',
      hour: 22,
      minute: 5,
      dayOfWeek: 3,
    }

    const messages = shouldSend(now, baseSettings, unfinishedStatus, [])
    const finalMsg = messages.find(m => m.kind === 'final')
    expect(finalMsg).toBeDefined()
    expect(finalMsg?.text).toContain('STREAK AT RISK')
  })

  it('suppresses nag mode and sends baseline kickoff message during Week 0 before plan_start_date', () => {
    const baselineSettings: ReminderSettings = {
      ...baseSettings,
      plan_start_date: '2026-11-16', // Kickoff is tomorrow
    }

    const baselineNow = {
      iso: '2026-11-15T20:30:00+05:30', // Sunday evening
      dateStr: '2026-11-15',
      hour: 20,
      minute: 30,
      dayOfWeek: 0,
    }

    // Nag mode should NOT fire on baseline day
    const nagMessages = shouldSend(baselineNow, baselineSettings, unfinishedStatus, [])
    expect(nagMessages.filter(m => m.kind === 'nag').length).toBe(0)

    // Final call at 22:00 should not threaten streak loss
    const lateNow = {
      ...baselineNow,
      iso: '2026-11-15T22:05:00+05:30',
      hour: 22,
      minute: 5,
    }
    const lateMessages = shouldSend(lateNow, baselineSettings, unfinishedStatus, [])
    const finalMsg = lateMessages.find(m => m.kind === 'final')
    expect(finalMsg).toBeDefined()
    expect(finalMsg?.text).toContain('BASELINE DAY COMPLETE')
    expect(finalMsg?.text).not.toContain('STREAK AT RISK')
  })
})
