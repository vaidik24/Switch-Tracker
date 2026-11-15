import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { Settings } from '../db/db'
import { useAppStore } from '../store/useAppStore'
import { requestNotificationPermission, sendNotification } from '../lib/nagMode'
import { todayIST } from '../lib/dates'
import { recalculatePlanWeeksFromNewStart } from '../lib/planShift'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'
import CloudSyncSection from '../components/CloudSyncSection'
import PhoneRemindersSection from '../components/PhoneRemindersSection'

export default function Settings() {
  const { theme, toggleTheme } = useAppStore()
  const [testSent, setTestSent] = useState(false)
  const [permissionMsg, setPermissionMsg] = useState('')

  const settings = useLiveQuery(() => db.settings.toArray().then(r => r[0]))
  const today = todayIST()

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings?.id) return
    const updated = { ...settings, [key]: value }
    await db.settings.update(settings.id, { [key]: value })
    await recordLocalChange('settings', settings.id, 'upsert', updated)
    await pushDailyStatus()
  }

  async function handlePlanStartDateChange(newDate: string) {
    if (!settings?.id || !newDate) return
    const currentWeeks = await db.planWeeks.toArray()
    const updatedWeeks = recalculatePlanWeeksFromNewStart(currentWeeks, newDate)

    for (const week of updatedWeeks) {
      await db.planWeeks.put(week)
      await recordLocalChange('planWeeks', week.weekNumber, 'upsert', week)
    }

    const newResets = Math.max(0, (settings.startDateResetsRemaining ?? 3) - 1)
    const updatedSettings: Settings = {
      ...settings,
      planStartDate: newDate,
      startDateResetsRemaining: newResets,
    }
    await db.settings.put(updatedSettings)
    await recordLocalChange('settings', settings.id, 'upsert', updatedSettings)
    await pushDailyStatus()
  }

  async function requestPermission() {
    const perm = await requestNotificationPermission()
    await updateSetting('notificationsPermission', perm)
    setPermissionMsg(
      perm === 'granted' ? '✅ Notifications enabled!' :
      perm === 'denied' ? '❌ Denied — enable in browser settings' :
      '⚠️ Not granted'
    )
  }

  async function sendTest() {
    await sendNotification('🧪 Test Reminder', 'Hey Vaidik! This is a test notification from your Tracker. Working great! 🎯')
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  async function exportData() {
    const [
      settingsData, problems, reviews, logs, concepts, stories, jobs,
      mocks, weeklyReviews, planWeeks, lldHld, checklists, neetcode, csTasks
    ] = await Promise.all([
      db.settings.toArray(),
      db.problems.toArray(),
      db.reviews.toArray(),
      db.dailyLogs.toArray(),
      db.concepts.toArray(),
      db.stories.toArray(),
      db.jobs.toArray(),
      db.mockLogs.toArray(),
      db.weeklyReviews.toArray(),
      db.planWeeks.toArray(),
      db.lldHldItems.toArray(),
      db.checklistItems.toArray(),
      db.neetcodeProblems.toArray(),
      db.csMicroTasks.toArray(),
    ])
    const data = {
      exportedAt: new Date().toISOString(),
      version: 2,
      settings: settingsData, problems, reviews, logs, concepts, stories, jobs, mocks,
      weeklyReviews, planWeeks, lldHld, checklists, neetcodeProblems: neetcode, csMicroTasks: csTasks
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracker-backup-${today}.json`
    a.click()
    if (settings?.id) await updateSetting('lastBackupDate', today)
  }

  async function clearData() {
    const confirmed = window.confirm('⚠️ This will DELETE ALL your data. Are you absolutely sure? This cannot be undone.')
    if (!confirmed) return
    const confirmed2 = window.confirm('Last chance: delete all Tracker data?')
    if (!confirmed2) return
    await db.delete()
    window.location.reload()
  }

  const reminderTimeInputs = settings?.reminderTimes ?? ['08:00', '13:30', '19:00', '22:00']

  async function updateReminderTime(idx: number, value: string) {
    const times = [...reminderTimeInputs]
    times[idx] = value
    await updateSetting('reminderTimes', times)
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <h1 className="text-2xl font-bold gradient-text mb-6">Settings</h1>

      {/* Appearance */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-surface-200 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-surface-300"
          >
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>

      {/* Cloud Sync (Phase 2) */}
      <CloudSyncSection />

      {/* Phone Reminders & Nag Mode (Phase 2) */}
      <PhoneRemindersSection />

      {/* Plan & Motivation */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">2-Month Plan & Accountability</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Plan start date</label>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                (settings?.startDateResetsRemaining ?? 3) > 0 ? 'bg-brand-500/20 text-brand-300' : 'bg-red-500/20 text-red-400'
              }`}>
                {settings?.startDateResetsRemaining ?? 3}/3 changes left
              </span>
            </div>
            <input
              type="date"
              className="input"
              value={settings?.planStartDate ?? '2026-11-16'}
              onChange={e => handlePlanStartDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">My North Star (Why I Must Switch)</label>
            <textarea
              className="input text-xs w-full h-16 py-1.5"
              value={settings?.whyIMustSwitch ?? 'To escape career stagnation, command top-tier compensation (35L+), and master engineering at scale.'}
              onChange={e => updateSetting('whyIMustSwitch', e.target.value)}
              placeholder="What drives this switch? Be honest and raw."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Accountability Tone</label>
              <select
                className="input text-xs py-2"
                value={settings?.accountabilityTone ?? 'hardcore'}
                onChange={e => updateSetting('accountabilityTone', e.target.value as any)}
              >
                <option value="hardcore">⚔️ Hardcore Reality-Check</option>
                <option value="coach">🛡️ Disciplined Coach</option>
                <option value="roast">🔥 Savage Roast Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tomorrow's Plan Delivery</label>
              <input
                type="time"
                className="input text-xs py-2"
                value={settings?.nextDayPlanTime ?? '21:30'}
                onChange={e => updateSetting('nextDayPlanTime', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <div>
              <p className="text-sm text-gray-300">Weekend light mode</p>
              <p className="text-xs text-gray-600">Skip weekday tasks on weekends</p>
            </div>
            <button
              onClick={() => updateSetting('weekendLightMode', !settings?.weekendLightMode)}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative
                ${settings?.weekendLightMode ? 'bg-brand-500' : 'bg-surface-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
                ${settings?.weekendLightMode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">Reminders</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Reminder times (IST)</label>
            <div className="grid grid-cols-2 gap-2">
              {reminderTimeInputs.map((t, i) => (
                <input
                  key={i}
                  type="time"
                  className="input text-sm py-2"
                  value={t}
                  onChange={e => updateReminderTime(i, e.target.value)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quiet hours start</label>
              <input type="time" className="input text-sm py-2"
                value={settings?.quietHoursStart ?? '23:30'}
                onChange={e => updateSetting('quietHoursStart', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quiet hours end</label>
              <input type="time" className="input text-sm py-2"
                value={settings?.quietHoursEnd ?? '07:00'}
                onChange={e => updateSetting('quietHoursEnd', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nag interval (minutes)</label>
            <input type="number" className="input text-sm" min="15" max="60"
              value={settings?.nagIntervalMinutes ?? 30}
              onChange={e => updateSetting('nagIntervalMinutes', parseInt(e.target.value))} />
          </div>

          {/* Notification permission */}
          <div className="bg-surface-200/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-300">Notification permission</p>
              <span className={`badge ${
                settings?.notificationsPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {settings?.notificationsPermission ?? 'default'}
              </span>
            </div>
            {permissionMsg && <p className="text-xs text-gray-400 mb-2">{permissionMsg}</p>}
            <div className="flex gap-2">
              <button onClick={requestPermission} className="btn-secondary flex-1 text-xs py-2">
                Enable Notifications
              </button>
              <button onClick={sendTest} className="btn-secondary flex-1 text-xs py-2"
                disabled={settings?.notificationsPermission !== 'granted'}>
                {testSent ? '✅ Sent!' : '🧪 Test'}
              </button>
            </div>
          </div>

          {/* Honesty note */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-xs text-emerald-400 font-medium mb-1">🚀 Phone Reminders Active</p>
            <p className="text-xs text-emerald-200/80">
              With Telegram or ntfy.sh connected above, reminders and Nag Mode will reach your phone even when all tabs and devices are turned off.
            </p>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">Data & Backup</h2>
        <div className="space-y-2">
          {settings?.lastBackupDate && (
            <p className="text-xs text-gray-500">Last backup: {settings.lastBackupDate}</p>
          )}
          <button onClick={exportData} className="btn-primary w-full text-sm">
            💾 Export all data (JSON)
          </button>
          <p className="text-xs text-gray-600 text-center">Back up every Sunday to be safe</p>
          <button onClick={clearData} className="btn-danger w-full text-sm mt-2">
            🗑️ Reset all data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">About</h2>
        <p className="text-xs text-gray-500">Job Switch Tracker v2.0 · Phase 2 (Multi-device Sync & Nag Mode)</p>
        <p className="text-xs text-gray-600 mt-1">Built for Vaidik · Local-first with optional Supabase Cloud Sync · Zero telemetry</p>
      </div>

      <div className="h-8" />
    </div>
  )
}
