import db from '../db/db'
import type { OutboxItem } from '../db/db'
import { getSupabase } from './supabaseClient'
import { todayIST, isWeekend } from './dates'
import { getDailyChecklistItems } from './dailyTasks'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface SyncSummary {
  uploaded: number
  downloaded: number
  conflictsResolved: number
  error?: string
}

let syncStatus: SyncStatus = 'idle'
let lastSyncedAt: string | null = null
let syncError: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<(status: SyncStatus, lastSync: string | null, error: string | null) => void>()

function notifyListeners() {
  listeners.forEach(cb => cb(syncStatus, lastSyncedAt, syncError))
}

export function subscribeSyncState(cb: (status: SyncStatus, lastSync: string | null, error: string | null) => void) {
  listeners.add(cb)
  cb(syncStatus, lastSyncedAt, syncError)
  return () => {
    listeners.delete(cb)
  }
}

/**
 * Downloads a local JSON snapshot of the entire Dexie database.
 */
export async function downloadLocalBackup(): Promise<void> {
  const backup: Record<string, any[]> = {}
  const tables = [
    'settings', 'dailyLogs', 'problems', 'reviews', 'lldHldItems',
    'concepts', 'conceptReviews', 'stories', 'jobs', 'interviewRounds',
    'contacts', 'templates', 'mockLogs', 'weeklyReviews', 'planWeeks',
    'checklistItems', 'offerComparisons', 'neetcodeProblems', 'csMicroTasks'
  ]

  for (const t of tables) {
    // @ts-ignore
    backup[t] = await db[t].toArray()
  }

  const jsonStr = JSON.stringify(backup, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `job_tracker_backup_${todayIST()}_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Records a change in the local Dexie outbox and triggers a debounced push.
 */
export async function recordLocalChange(
  entity: string,
  recordId: string | number,
  action: 'upsert' | 'delete',
  data?: any
): Promise<void> {
  try {
    const item: OutboxItem = {
      entity,
      recordId: String(recordId),
      action,
      data: data || {},
      updatedAt: new Date().toISOString(),
    }
    await db.outbox.add(item)

    // Debounce push by 2 seconds
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      syncNow().catch(console.error)
    }, 2000)
  } catch (err) {
    console.error('Failed to record local change to outbox:', err)
  }
}

/**
 * Computes and pushes today's daily_status to Supabase so the server reminder engine
 * has accurate, up-to-date task progress.
 */
export async function pushDailyStatus(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return

  const today = todayIST()
  const log = await db.dailyLogs.get(today)
  const settings = await db.settings.toArray().then(r => r[0])

  // Determine active plan context: Baseline vs Weekday vs Weekend
  const planStartDate = settings?.planStartDate || '2026-11-16'
  const daysSinceStart = Math.floor(
    (new Date(today + 'T00:00:00+05:30').getTime() - new Date(planStartDate + 'T00:00:00+05:30').getTime()) / 86400000
  )
  const isBaselineDay = daysSinceStart < 0
  const isWeekendDay = isWeekend(today)
  const dailyItems = getDailyChecklistItems(isWeekendDay, settings?.weekendLightMode ?? false, isBaselineDay)

  let mustDoTotal = dailyItems.length
  let mustDoDone = 0
  const remainingTitles: string[] = []

  for (const item of dailyItems) {
    if (log?.checklistState?.[item.id]) {
      mustDoDone++
    } else {
      remainingTitles.push(item.label)
    }
  }

  if (log?.doneForToday) {
    mustDoDone = Math.max(mustDoDone, mustDoTotal)
  }

  // Calculate follow-ups due today from jobs and contacts
  const jobs = await db.jobs.toArray()
  const contacts = await db.contacts.toArray()
  const followupsDue =
    jobs.filter(j => j.nextFollowUp && j.nextFollowUp <= today && j.status !== 'Rejected/Closed' && j.status !== 'Offer').length +
    contacts.filter(c => c.nextFollowUp && c.nextFollowUp <= today && !c.replied).length

  await supabase.from('daily_status').upsert({
    user_id: user.id,
    date: today,
    must_do_total: mustDoTotal,
    must_do_done: mustDoDone,
    remaining_titles: remainingTitles,
    done_for_today: log?.doneForToday ?? false,
    rest_day: log?.missReason === 'rest day',
    followups_due: followupsDue,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' })
}

/**
 * Main Sync Routine:
 * Pushes outbox batches and pulls remote changes newer than the last sync cursor.
 */
export async function syncNow(): Promise<SyncSummary> {
  const summary: SyncSummary = { uploaded: 0, downloaded: 0, conflictsResolved: 0 }

  if (!navigator.onLine) {
    syncStatus = 'offline'
    notifyListeners()
    return summary
  }

  const supabase = getSupabase()
  if (!supabase) {
    syncStatus = 'idle'
    notifyListeners()
    return summary
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) {
    syncStatus = 'idle'
    notifyListeners()
    return summary
  }

  syncStatus = 'syncing'
  syncError = null
  notifyListeners()

  try {
    // Check if this is the very first sync
    const lastSyncMeta = await db.syncMeta.get('lastSyncAt')
    const isFirstSync = !lastSyncMeta

    if (isFirstSync) {
      // Auto-download local backup before first cloud merge
      try {
        await downloadLocalBackup()
      } catch (e) {
        console.warn('Auto backup skipped:', e)
      }
    }

    // 1. PUSH OUTBOX
    const pending = await db.outbox.toArray()
    if (pending.length > 0) {
      // Deduplicate pending outbox items by `${entity}:${recordId}`, keeping the latest change.
      // This prevents PostgreSQL error: "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const latestByRecord = new Map<string, OutboxItem>()
      for (const item of pending) {
        const key = `${item.entity}:${item.recordId}`
        latestByRecord.set(key, item)
      }

      const deduplicated = Array.from(latestByRecord.values())

      const recordsToPush = deduplicated.map(p => ({
        user_id: user.id,
        entity: p.entity,
        id: String(p.recordId),
        data: p.data || {},
        updated_at: p.updatedAt,
        deleted: p.action === 'delete',
      }))

      // Push in chunks of 50
      for (let i = 0; i < recordsToPush.length; i += 50) {
        const chunk = recordsToPush.slice(i, i + 50)
        const { error: pushErr } = await supabase.from('sync_records').upsert(chunk, {
          onConflict: 'user_id,entity,id',
        })
        if (pushErr) throw pushErr
        summary.uploaded += chunk.length
      }

      // Remove all processed items from outbox (including superseded duplicates)
      const idsToDelete = pending.map(p => p.id!).filter(Boolean)
      await db.outbox.bulkDelete(idsToDelete)
    }

    // Always push current daily_status
    await pushDailyStatus()

    // 2. PULL REMOTE CHANGES
    const lastSyncTime = lastSyncMeta?.value || '1970-01-01T00:00:00Z'
    const { data: remoteRows, error: pullErr } = await supabase
      .from('sync_records')
      .select('*')
      .eq('user_id', user.id)
      .gt('updated_at', lastSyncTime)
      .order('updated_at', { ascending: true })

    if (pullErr) throw pullErr

    if (remoteRows && remoteRows.length > 0) {
      for (const row of remoteRows) {
        const table = (db as any)[row.entity]
        if (table) {
          if (row.deleted) {
            // Tombstone
            await table.delete(isNaN(Number(row.id)) ? row.id : Number(row.id))
          } else {
            // Put record locally (Last-write-wins)
            await table.put(row.data)
          }
          summary.downloaded++
        }
      }
    }

    // Record new cursor
    const nowIso = new Date().toISOString()
    await db.syncMeta.put({ key: 'lastSyncAt', value: nowIso })
    lastSyncedAt = nowIso
    syncStatus = 'synced'
    notifyListeners()

    return summary
  } catch (err: any) {
    console.error('Sync failed:', err)
    syncStatus = 'error'
    syncError = err.message || 'Sync failed'
    notifyListeners()
    summary.error = syncError || undefined
    return summary
  }
}

/**
 * Initializes sync engine background listeners (online, focus, 60s timer).
 */
export function initSyncEngine(): () => void {
  const onOnline = () => { syncNow().catch(console.error) }
  const onFocus = () => { syncNow().catch(console.error) }

  window.addEventListener('online', onOnline)
  window.addEventListener('focus', onFocus)
  const interval = setInterval(() => {
    syncNow().catch(console.error)
  }, 60000)

  // Initial pull/push on load
  setTimeout(() => {
    syncNow().catch(console.error)
  }, 1000)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('focus', onFocus)
    clearInterval(interval)
  }
}
