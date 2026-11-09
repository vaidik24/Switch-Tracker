import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useSync } from '../store/useSyncStore'
import { getSupabase } from '../lib/supabaseClient'

interface NotificationChannel {
  id: string
  type: 'telegram' | 'ntfy'
  telegram_chat_id: number | null
  ntfy_topic: string | null
  enabled: boolean
  verified: boolean
  last_error: string | null
}

interface ServerReminderSettings {
  timezone: string
  morning_time: string
  midday_time: string
  evening_time: string
  final_time: string
  next_day_plan_time?: string
  accountability_tone?: 'hardcore' | 'coach' | 'roast'
  why_i_must_switch?: string
  start_date_resets_remaining?: number
  nag_enabled: boolean
  nag_interval_minutes: number
  quiet_start: string
  quiet_end: string
  weekly_review_enabled: boolean
}

interface ReminderLog {
  id: string
  kind: string
  slot_key: string
  channel_type: string
  sent_at: string
  status: string
  error: string | null
}

export default function PhoneRemindersSection() {
  const { user } = useSync()
  const [telegramChannel, setTelegramChannel] = useState<NotificationChannel | null>(null)
  const [ntfyChannel, setNtfyChannel] = useState<NotificationChannel | null>(null)
  const [serverSettings, setServerSettings] = useState<ServerReminderSettings | null>(null)
  const [logs, setLogs] = useState<ReminderLog[]>([])
  const [showLogs, setShowLogs] = useState(false)

  // Telegram link flow
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [testSentTg, setTestSentTg] = useState(false)
  const [testSentNtfy, setTestSentNtfy] = useState(false)
  const [ntfyInput, setNtfyInput] = useState('')
  const [lastCronAgeMinutes, setLastCronAgeMinutes] = useState<number | null>(null)

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'VaidikJobTrackerBot'

  useEffect(() => {
    if (!user) return
    loadChannelsAndSettings()
  }, [user])

  // Polling for Telegram verification when linkCode is active
  useEffect(() => {
    if (!linkCode || !user || telegramChannel?.verified) return
    const interval = setInterval(async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const { data } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'telegram')
        .single()

      if (data?.verified) {
        setTelegramChannel(data)
        setLinkCode(null)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [linkCode, user, telegramChannel?.verified])

  async function loadChannelsAndSettings() {
    const supabase = getSupabase()
    if (!supabase || !user) return

    // 1. Channels
    const { data: chs } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', user.id)

    if (chs) {
      const tg = chs.find(c => c.type === 'telegram') || null
      const ntfy = chs.find(c => c.type === 'ntfy') || null
      setTelegramChannel(tg)
      setNtfyChannel(ntfy)
      if (ntfy?.ntfy_topic) {
        setNtfyInput(ntfy.ntfy_topic)
      }
    }

    // 2. Reminder settings
    const { data: setts } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (setts) {
      setServerSettings(setts)
    }

    // 3. Recent logs
    const { data: logRows } = await supabase
      .from('reminder_log')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (logRows) {
      setLogs(logRows)
      if (logRows.length > 0) {
        const lastSent = new Date(logRows[0].sent_at).getTime()
        const age = Math.round((Date.now() - lastSent) / 60000)
        setLastCronAgeMinutes(age)
      }
    }
  }

  async function generateTelegramCode() {
    const supabase = getSupabase()
    if (!supabase || !user) return
    setIsGeneratingCode(true)

    // Generate random 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error } = await supabase.from('telegram_link_codes').insert({
      code,
      user_id: user.id,
      expires_at: expiresAt,
    })

    setIsGeneratingCode(false)
    if (!error) {
      setLinkCode(code)
    }
  }

  async function saveNtfyTopic() {
    const supabase = getSupabase()
    if (!supabase || !user || !ntfyInput) return

    const { data } = await supabase.from('notification_channels').upsert({
      user_id: user.id,
      type: 'ntfy',
      ntfy_topic: ntfyInput,
      enabled: true,
      verified: true,
    }, { onConflict: 'user_id,type' }).select().single()

    if (data) {
      setNtfyChannel(data)
    }
  }

  function generateRandomNtfyTopic() {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const topic = `vaidik-tracker-${randomHex}`
    setNtfyInput(topic)
  }

  async function sendTestTelegram() {
    if (!telegramChannel?.telegram_chat_id) return
    setTestSentTg(true)
    const supabase = getSupabase()
    if (supabase) {
      // Edge function will also log it or we can ping test
      await supabase.functions.invoke('telegram-webhook', {
        body: { test: true },
      }).catch(() => {})
    }
    setTimeout(() => setTestSentTg(false), 3000)
  }

  async function sendTestNtfy() {
    if (!ntfyInput) return
    setTestSentNtfy(true)
    await fetch(`https://ntfy.sh/${encodeURIComponent(ntfyInput)}`, {
      method: 'POST',
      headers: {
        Title: 'Job Switch Tracker',
        Priority: 'high',
        Tags: 'white_check_mark',
      },
      body: '🧪 Test reminder from Job Switch Tracker! Your ntfy channel is working.',
    }).catch(console.error)
    setTimeout(() => setTestSentNtfy(false), 3000)
  }

  async function updateServerSetting<K extends keyof ServerReminderSettings>(
    key: K,
    val: ServerReminderSettings[K]
  ) {
    if (!serverSettings || !user) return
    const updated = { ...serverSettings, [key]: val }
    setServerSettings(updated)

    const supabase = getSupabase()
    if (supabase) {
      await supabase.from('reminder_settings').upsert({
        user_id: user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      })
    }
  }

  if (!user) {
    return (
      <div className="card p-4 mb-4 opacity-75">
        <h2 className="section-header">Phone Reminders & Nag Mode</h2>
        <p className="text-xs text-gray-400">
          Sign in to Cloud Sync above to connect your phone via Telegram or ntfy.sh and enable background reminders that reach you even when your browser is closed.
        </p>
      </div>
    )
  }

  const deepLink = linkCode ? `https://t.me/${botUsername}?start=${linkCode}` : ''

  return (
    <div className="card p-4 mb-4">
      <h2 className="section-header">Phone Reminders & Nag Mode</h2>
      <p className="text-xs text-gray-400 mb-4">
        Guaranteed alerts that buzz your phone even when all tabs and browsers are closed. Nag mode repeats until your must-do tasks are done.
      </p>

      {/* Watchdog Banner */}
      {lastCronAgeMinutes !== null && lastCronAgeMinutes > 45 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-400 font-semibold mb-0.5">⚠️ Server reminders may be delayed</p>
          <p className="text-xs text-amber-200/80">
            Last server reminder was recorded {lastCronAgeMinutes} minutes ago. If this was during your active preparation hours, verify that pg_cron is enabled in your Supabase project.
          </p>
        </div>
      )}

      {/* 1. Telegram Connection Card */}
      <div className="bg-surface-200/50 rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <div>
              <p className="text-sm font-semibold text-gray-200">Telegram Bot (Primary)</p>
              <p className="text-[11px] text-gray-400">Direct alerts with Snooze and Open App buttons</p>
            </div>
          </div>
          <span className={`badge ${
            telegramChannel?.verified
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {telegramChannel?.verified ? 'CONNECTED ✅' : 'NOT LINKED'}
          </span>
        </div>

        {telegramChannel?.verified ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-300">
              Bot is linked to your Telegram chat. It will remind you according to your schedule and nag you until you're done.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={sendTestTelegram}
                className="btn-secondary text-xs py-1.5 flex-1"
              >
                {testSentTg ? '✅ Test Sent!' : '🧪 Send Test Reminder'}
              </button>
              <button
                onClick={async () => {
                  const supabase = getSupabase()
                  if (supabase && telegramChannel) {
                    await supabase.from('notification_channels').delete().eq('id', telegramChannel.id)
                    setTelegramChannel(null)
                  }
                }}
                className="btn-secondary text-xs py-1.5 text-red-400 hover:text-red-300"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!linkCode ? (
              <button
                onClick={generateTelegramCode}
                disabled={isGeneratingCode}
                className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <span>🔗 Connect Telegram Bot</span>
              </button>
            ) : (
              <div className="bg-surface-300/40 rounded-xl p-3 text-center space-y-3">
                <p className="text-xs text-gray-200 font-medium">Scan QR Code or tap the link on your phone:</p>
                <div className="flex justify-center p-2 bg-white rounded-lg w-fit mx-auto">
                  <QRCodeSVG value={deepLink} size={140} />
                </div>
                <div>
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-4 inline-block"
                  >
                    Open @{botUsername} in Telegram
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 animate-pulse">
                  Waiting for you to tap START in Telegram... (expires in 10m)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. ntfy.sh Alternative Channel */}
      <div className="bg-surface-200/50 rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <div>
              <p className="text-sm font-semibold text-gray-200">ntfy.sh (Alternative Channel)</p>
              <p className="text-[11px] text-gray-400">Push notifications via free open-source mobile app</p>
            </div>
          </div>
          <span className={`badge ${
            ntfyChannel?.verified
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {ntfyChannel?.verified ? 'CONFIGURED' : 'OPTIONAL'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. vaidik-tracker-private-topic"
              value={ntfyInput}
              onChange={e => setNtfyInput(e.target.value)}
              className="input text-xs flex-1"
            />
            <button
              onClick={generateRandomNtfyTopic}
              title="Generate a random secure topic"
              className="btn-secondary text-xs px-2.5 py-1"
            >
              🎲 Random
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveNtfyTopic}
              disabled={!ntfyInput}
              className="btn-primary text-xs py-1.5 flex-1"
            >
              Save Topic
            </button>
            <button
              onClick={sendTestNtfy}
              disabled={!ntfyInput}
              className="btn-secondary text-xs py-1.5 flex-1"
            >
              {testSentNtfy ? '✅ Alert Sent!' : '🧪 Test Alert'}
            </button>
          </div>

          <p className="text-[11px] text-amber-400/80 mt-1">
            ⚠️ Note: Anyone who knows this topic name can read messages sent to it. Use a random unguessable name.
          </p>
        </div>
      </div>

      {/* 3. Schedule & Nag Preferences */}
      {serverSettings && (
        <div className="bg-surface-200/30 rounded-xl p-4 border border-white/5 mb-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Server Reminder Schedule (IST)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Morning check-in</label>
              <input
                type="time"
                value={serverSettings.morning_time}
                onChange={e => updateServerSetting('morning_time', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Midday check-in</label>
              <input
                type="time"
                value={serverSettings.midday_time}
                onChange={e => updateServerSetting('midday_time', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Evening checkpoint</label>
              <input
                type="time"
                value={serverSettings.evening_time}
                onChange={e => updateServerSetting('evening_time', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Final call</label>
              <input
                type="time"
                value={serverSettings.final_time}
                onChange={e => updateServerSetting('final_time', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Quiet hours start</label>
              <input
                type="time"
                value={serverSettings.quiet_start}
                onChange={e => updateServerSetting('quiet_start', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Quiet hours end</label>
              <input
                type="time"
                value={serverSettings.quiet_end}
                onChange={e => updateServerSetting('quiet_end', e.target.value)}
                className="input text-xs py-1.5"
              />
            </div>
          </div>

          {/* Tomorrow's Plan Time & Accountability Tone */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Tomorrow's Plan Briefing</label>
              <input
                type="time"
                value={serverSettings.next_day_plan_time || '21:30'}
                onChange={e => updateServerSetting('next_day_plan_time', e.target.value)}
                className="input text-xs py-1.5"
              />
              <span className="text-[10px] text-gray-500">Sent to Telegram nightly</span>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Accountability Tone</label>
              <select
                value={serverSettings.accountability_tone || 'hardcore'}
                onChange={e => updateServerSetting('accountability_tone', e.target.value as any)}
                className="input text-xs py-1.5"
              >
                <option value="hardcore">⚔️ Hardcore Reality-Check</option>
                <option value="coach">🛡️ Disciplined Coach</option>
                <option value="roast">🔥 Savage Roast Mode</option>
              </select>
            </div>
          </div>

          <div className="pt-1">
            <label className="block text-[11px] text-gray-500 mb-1">My North Star (Why I Must Switch)</label>
            <textarea
              value={serverSettings.why_i_must_switch || ''}
              onChange={e => updateServerSetting('why_i_must_switch', e.target.value)}
              placeholder="e.g. To escape career stagnation, command 35L+ CTC, and master engineering at scale."
              className="input text-xs py-1.5 w-full h-14"
            />
            <span className="text-[10px] text-gray-500">Injected into your daily check-ins to destroy excuses</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-gray-200 font-medium">Nag Mode Interval</p>
              <p className="text-[11px] text-gray-500">Repeats every N minutes after evening</p>
            </div>
            <select
              value={serverSettings.nag_interval_minutes}
              onChange={e => updateServerSetting('nag_interval_minutes', parseInt(e.target.value))}
              className="input text-xs py-1.5 px-3 w-28"
            >
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
            </select>
          </div>
        </div>
      )}

      {/* 4. Reminder Log Viewer */}
      <div className="pt-1">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
        >
          <span>{showLogs ? '▼ Hide' : '▶ Show'} Recent Server Reminder Logs ({logs.length})</span>
        </button>

        {showLogs && (
          <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 text-xs bg-surface-200/30 p-2 rounded-xl">
            {logs.length === 0 ? (
              <p className="text-[11px] text-gray-500 text-center py-2">No reminder logs recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-1.5 bg-surface-200/50 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-300 capitalize">{log.kind}</span>
                    <span className="text-[10px] text-gray-500 ml-2">({log.channel_type})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${log.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
