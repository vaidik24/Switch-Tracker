import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabaseClient'
import {
  subscribeSyncState,
  syncNow,
  downloadLocalBackup,
  SyncStatus,
  SyncSummary,
} from '../lib/syncEngine'
import db from '../db/db'

export function useSync() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  useEffect(() => {
    const supabase = getSupabase()
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      })

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess)
        setUser(sess?.user ?? null)
        if (sess) {
          syncNow().catch(console.error)
        }
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    const unsub = subscribeSyncState((s, lastSync, err) => {
      setStatus(s)
      setLastSyncedAt(lastSync)
      setError(err)
      setIsSyncing(s === 'syncing')
    })
    return unsub
  }, [])

  const triggerSync = async (): Promise<SyncSummary> => {
    setIsSyncing(true)
    try {
      const summary = await syncNow()
      return summary
    } finally {
      setIsSyncing(false)
    }
  }

  const signOut = async (clearDevice: boolean = false) => {
    const supabase = getSupabase()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    await db.syncMeta.clear()
    await db.outbox.clear()

    if (clearDevice) {
      // Clear all local tables
      const tables = [
        'settings', 'dailyLogs', 'problems', 'reviews', 'lldHldItems',
        'concepts', 'conceptReviews', 'stories', 'jobs', 'interviewRounds',
        'contacts', 'templates', 'mockLogs', 'weeklyReviews', 'planWeeks',
        'checklistItems', 'offerComparisons', 'outbox', 'syncMeta'
      ]
      for (const t of tables) {
        // @ts-ignore
        await db[t].clear()
      }
      window.location.reload()
    }
  }

  return {
    user,
    session,
    status,
    lastSyncedAt,
    error,
    isSyncing,
    triggerSync,
    downloadBackup: downloadLocalBackup,
    signOut,
  }
}
