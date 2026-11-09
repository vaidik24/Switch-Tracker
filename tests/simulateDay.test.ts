import { describe, it, expect } from 'vitest'
import {
  shouldSend,
  ReminderSettings,
  DailyStatus,
  ReminderLogEntry,
  TomorrowPlanSummary,
} from '../src/lib/serverReminderEngine'

describe('Day Simulation (08:00 to 23:30) with Hardcore Mode & Tomorrow Battle Plan', () => {
  it('simulates a full day of 15-minute cron runs and collects scheduled messages', () => {
    const settings: ReminderSettings = {
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
      remaining_titles: ['DSA Revision', 'Topic of the Week', 'STAR Story'],
      done_for_today: false,
      rest_day: false,
      snoozed_until: null,
      followups_due: 0,
    }

    const tomorrowPlan: TomorrowPlanSummary = {
      dateStr: '2026-11-12',
      weekdayName: 'Thursday',
      weekNumber: 1,
      focusTopic: 'Arrays, Two Pointers, Sliding Window + OS & Node.js',
      dsaGoal: '20-25 problems: arrays, hashing, two pointers',
      studyGoal: 'OS: processes, threads, event loop phases',
    }

    const logHistory: ReminderLogEntry[] = []
    const sentHistory: Array<{ time: string; kind: string; slot_key: string; text: string }> = []

    // Simulate every 15 minutes from 08:00 to 23:30
    for (let totalMinutes = 8 * 60; totalMinutes <= 23 * 60 + 30; totalMinutes += 15) {
      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      const iso = `2026-11-11T${timeStr}:00+05:30`

      const now = {
        iso,
        dateStr: '2026-11-11',
        hour: h,
        minute: m,
        dayOfWeek: 3, // Wednesday
      }

      const toSend = shouldSend(now, settings, unfinishedStatus, logHistory, tomorrowPlan)

      for (const msg of toSend) {
        sentHistory.push({
          time: timeStr,
          kind: msg.kind,
          slot_key: msg.slot_key,
          text: msg.text,
        })
        logHistory.push({
          slot_key: msg.slot_key,
          sent_at: iso,
          kind: msg.kind,
        })
      }
    }

    // Verify key checkpoints occurred
    expect(sentHistory.some(s => s.time === '08:00' && s.kind === 'morning')).toBe(true)
    expect(sentHistory.some(s => s.time === '13:30' && s.kind === 'midday')).toBe(true)
    expect(sentHistory.some(s => s.time === '19:00' && s.kind === 'evening')).toBe(true)
    expect(sentHistory.some(s => s.time === '21:30' && s.kind === 'next_day_plan')).toBe(true)
    expect(sentHistory.some(s => s.time === '22:00' && s.kind === 'final')).toBe(true)

    // Verify nags fired between 19:30 and 23:15 every 30 minutes
    const nagEntries = sentHistory.filter(s => s.kind === 'nag')
    expect(nagEntries.length).toBeGreaterThanOrEqual(6)

    // Verify no messages at 23:30 (quiet hours start)
    const quietMessages = sentHistory.filter(s => s.time === '23:30')
    expect(quietMessages.length).toBe(0)

    console.log('\n--- SIMULATED HARDCORE DAY DISPATCH (08:00 - 23:30) ---')
    sentHistory.forEach(s => {
      console.log(`[${s.time}] (${s.kind.toUpperCase()}) ${s.text.replace(/<[^>]*>?/gm, '').slice(0, 80)}...`)
    })
    console.log(`Total messages sent: ${sentHistory.length}\n`)
  })
})
