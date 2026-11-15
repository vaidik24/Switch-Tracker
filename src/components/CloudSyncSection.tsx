import { useState } from 'react'
import { useSync } from '../store/useSyncStore'
import { isSupabaseConfigured, getSupabase } from '../lib/supabaseClient'

export default function CloudSyncSection() {
  const { user, status, lastSyncedAt, error, isSyncing, triggerSync, downloadBackup, signOut } = useSync()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'magiclink'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [authError, setAuthError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const configured = isSupabaseConfigured()

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setIsSubmitting(true)
    const supabase = getSupabase()
    if (!supabase) {
      setAuthError('Supabase is not configured yet. Check your environment variables.')
      setIsSubmitting(false)
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (err) {
      setAuthError(err.message)
    }
    setIsSubmitting(false)
  }

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setIsSubmitting(true)
    const supabase = getSupabase()
    if (!supabase) {
      setAuthError('Supabase is not configured yet. Check your environment variables.')
      setIsSubmitting(false)
      return
    }

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (err) {
      setAuthError(err.message)
    } else {
      setMagicLinkSent(true)
    }
    setIsSubmitting(false)
  }

  async function handleManualSync() {
    setSyncMessage('')
    const summary = await triggerSync()
    if (summary.error) {
      setSyncMessage(`❌ Sync failed: ${summary.error}`)
    } else {
      setSyncMessage(`✅ Synced! Uploaded: ${summary.uploaded}, Downloaded: ${summary.downloaded}`)
      setTimeout(() => setSyncMessage(''), 5000)
    }
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header mb-0">Cloud Sync (Multi-Device)</h2>
        <span className={`badge ${
          status === 'synced' ? 'bg-emerald-500/20 text-emerald-400' :
          status === 'syncing' ? 'bg-brand-500/20 text-brand-400' :
          status === 'offline' ? 'bg-yellow-500/20 text-yellow-400' :
          status === 'error' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {status === 'syncing' ? '🔄 Syncing...' : status.toUpperCase()}
        </span>
      </div>

      {!configured ? (
        <div className="bg-surface-200/50 rounded-xl p-3 border border-white/5">
          <p className="text-xs text-amber-400 font-medium mb-1">⚙️ Cloud sync setup required</p>
          <p className="text-xs text-gray-400 mb-2">
            Configure <code className="text-brand-300">VITE_SUPABASE_URL</code> and <code className="text-brand-300">VITE_SUPABASE_ANON_KEY</code> in your environment to sync your phone and laptop seamlessly.
          </p>
          <p className="text-[11px] text-gray-500">
            The app continues to work 100% offline with local IndexedDB storage.
          </p>
        </div>
      ) : !user ? (
        <div>
          <p className="text-xs text-gray-400 mb-3">
            Sign in to sync data across your devices and enable server-side phone reminders.
          </p>

          <div className="flex bg-surface-200/60 p-0.5 rounded-lg mb-3">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setAuthError('') }}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                authMode === 'password'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🔑 Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('magiclink'); setAuthError('') }}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                authMode === 'magiclink'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ✉️ Magic Link
            </button>
          </div>

          {authMode === 'password' ? (
            <form onSubmit={handlePasswordAuth} className="space-y-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input text-sm"
              />
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input text-sm"
              />
              {authError && <p className="text-xs text-red-400">{authError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-xs py-2.5"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In with Password'}
              </button>
            </form>
          ) : magicLinkSent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-xs text-emerald-300 font-medium">📬 Magic link sent to {email}!</p>
              <p className="text-xs text-emerald-400/70 mt-1">
                Click the link in your email to authenticate. Once signed in, this screen will update automatically.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input text-sm"
              />
              {authError && <p className="text-xs text-red-400">{authError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full text-xs py-2.5"
              >
                {isSubmitting ? 'Sending...' : '✉️ Send Magic Link'}
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-1">
                Single-user: After your first sign-in, disable new signups in your Supabase dashboard.
              </p>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-surface-200/40 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-semibold text-gray-200 truncate max-w-[200px]">{user.email}</p>
              {lastSyncedAt && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {syncMessage && (
            <div className="bg-surface-300/40 rounded-lg p-2 text-xs text-center text-gray-300">
              {syncMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={downloadBackup}
              className="btn-secondary text-xs py-2 text-center"
            >
              💾 Local Backup (JSON)
            </button>
            <button
              onClick={() => signOut(false)}
              className="btn-secondary text-xs py-2 text-center text-gray-400 hover:text-white"
            >
              Sign Out
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('⚠️ Are you sure you want to sign out and WIPE all local data on this device? Make sure you have a backup.')) {
                signOut(true)
              }
            }}
            className="w-full text-center text-[11px] text-red-400/80 hover:text-red-300 py-1"
          >
            Sign out and clear this device
          </button>
        </div>
      )}
    </div>
  )
}
