/**
 * Gemini API helper for Supabase Edge Functions.
 * Uses official Gemini REST API (gemini-2.0-flash / gemini-1.5-flash).
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || ""
const MODEL_NAME = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash"

interface CallGeminiOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

/**
 * Calls Gemini API with fallback handling. Returns null if key is missing, call fails, or output was truncated.
 */
export async function callGemini({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 1000,
}: CallGeminiOptions): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.warn(`Gemini API error ${res.status}:`, await res.text())
      return null
    }

    const data = await res.json()
    const candidate = data.candidates?.[0]
    const candidateText = candidate?.content?.parts?.[0]?.text?.trim()
    const finishReason = candidate?.finishReason

    // If Gemini was cut off by token limit or returned an incomplete snippet (like "its 21:00,")
    if (finishReason === "MAX_TOKENS" || !candidateText || candidateText.length < 50 || candidateText.endsWith(",")) {
      console.warn("Gemini output incomplete or truncated (finishReason:", finishReason, "), rejecting text:", candidateText)
      return null
    }

    return candidateText
  } catch (err) {
    console.warn("Failed to call Gemini API:", err)
    return null
  }
}

export interface NeetCodeProblemBrief {
  title: string
  difficulty: string
  estMinutes: number
  url: string
}

export interface CsTopicBrief {
  title: string
  estMinutes: number
  deliverable: string
}

/**
 * Generates an adaptive "Tomorrow's Battle Plan" tailored to today's completed vs missed tasks
 * in raw, brutally honest HINGLISH with exact NeetCode 150 questions and CS micro-topics.
 */
export async function generateAITomorrowPlan(params: {
  todayDate: string
  tomorrowDate: string
  tomorrowWeekday: string
  weekNumber: number
  dayNumber?: number
  focusTopic: string
  dsaGoal: string
  studyGoal: string
  mustDoTotal: number
  mustDoDone: number
  remainingTitles: string[]
  streak: number
  whyIMustSwitch: string
  tomorrowNeetCode?: NeetCodeProblemBrief[]
  tomorrowCsTopic?: CsTopicBrief | null
  revisionsDue?: string[]
}): Promise<string | null> {
  const systemPrompt = `You are Vaidik's uncompromising, brutally honest elder brother and mentor preparing him for a high-stakes 2-month tech switch into Tier-1 product companies (35L+ CTC).
You speak exclusively in natural, punchy HINGLISH (Roman Hindi + English technical terms like LeetCode, Sliding Window, DP, Event Loop, Streak, CTC, Tier-1, PR, Context Switch).
Your tone is serious, demanding, and direct — like a real elder brother who wants him to win and refuses to let him settle for excuses or mediocrity.

Telegram Formatting Rules:
- Output clean HTML only: <b>, <i>, <code>, <a href="...">.
- NEVER use markdown symbols like ** or # or ##.
- Keep links concise: <a href="URL">Title</a>.
- Length: Around 160-220 words. High-density, zero fluff.`

  let neetCodeListStr = ""
  if (params.tomorrowNeetCode && params.tomorrowNeetCode.length > 0) {
    neetCodeListStr = params.tomorrowNeetCode
      .map(p => `• <a href="${p.url}">${p.title}</a> (${p.difficulty}, ⏱️ ${p.estMinutes}m)`)
      .join("\n")
  } else {
    neetCodeListStr = `• ${params.dsaGoal}`
  }

  let csTopicStr = ""
  if (params.tomorrowCsTopic) {
    csTopicStr = `• <b>${params.tomorrowCsTopic.title}</b> (⏱️ ${params.tomorrowCsTopic.estMinutes}m)\n  <i>Deliverable:</i> ${params.tomorrowCsTopic.deliverable}`
  } else {
    csTopicStr = `• ${params.studyGoal}`
  }

  const userPrompt = `Aaj ki tareekh: ${params.todayDate}
Aaj ka scorecard: ${params.mustDoDone}/${params.mustDoTotal} tasks complete huye.
Aaj ke bache huye tasks: ${params.remainingTitles.length > 0 ? params.remainingTitles.join(", ") : "Ekdum zero! Sab khatam kar diya."}
Current streak: ${params.streak} din.
Vaidik ka North Star (Kyu switch karna hai): "${params.whyIMustSwitch}".

Kal ka din: ${params.tomorrowWeekday}, ${params.tomorrowDate} (Week ${params.weekNumber}${params.dayNumber ? `, Day ${params.dayNumber}` : ''}: ${params.focusTopic}).

Kal ke prescribed targets:
DSA Questions (NeetCode 150):
${neetCodeListStr}

CS / System Design Micro-Topic:
${csTopicStr}

${params.revisionsDue && params.revisionsDue.length > 0 ? `Spaced Revisions Due: ${params.revisionsDue.join(", ")}` : ""}

Generate kal ka complete "Tomorrow's Battle Plan" in natural HINGLISH:
1. 🎯 <b>Kal Ka Battle Plan (${params.tomorrowWeekday}, Week ${params.weekNumber})</b>
2. 1-2 lines on today's performance: agar sab task khatam kiye to acknowledge kar, agar bache reh gaye to daant laga aur bol ki kal compensate karna padega.
3. 💻 <b>NeetCode 150 Targets:</b>
${neetCodeListStr}
4. 🧠 <b>CS Micro-Topic:</b>
${csTopicStr}
5. 💥 <b>North Star Reality Check:</b> Uska North Star ("${params.whyIMustSwitch}") yaad dila. Aage badhne ke liye kal subah se sharp execution chahiye bina kisi excuses ke.`

  return await callGemini({
    systemPrompt,
    userPrompt,
    temperature: 0.65,
    maxTokens: 1600,
  })
}

/**
 * Generates an intense, brutally honest Hardcore Nag reality-check message in HINGLISH
 * with escalation tiers when tasks are avoided late at night.
 */
export async function generateAINagMessage(params: {
  todayDate: string
  remainingTasks: string[]
  streak: number
  whyIMustSwitch: string
  currentHour: number
}): Promise<string | null> {
  const isLateNight = params.currentHour >= 21
  const isSevere = params.streak === 0 || params.remainingTasks.length >= 2

  const systemPrompt = `You are Vaidik's brutally honest elder brother and mentor.
Language: Pure, natural, hard-hitting HINGLISH (Roman Hindi + English for tech terms).
Tone: Brutally direct, zero-fluff, raw accountability. You despise excuses and procrastination.
Vaidik tends to forget why he started after a few days and wastes time scrolling.
Your objective: Shake him out of complacency immediately. Make him feel the stinging urgency to drop his phone, sit at his desk, and conquer at least one task right now.

Escalation Level:
- Level 1 (19:00 - 20:30): Firm reality check. "Shaam ke ${params.currentHour}:00 ho gaye hain, abhi bhi ${params.remainingTasks.length} tasks bache hain."
- Level 2 (21:00 - 22:30): Brutal call-out. "Raat ke ${params.currentHour}:00 baj chuke hain. Tu fir wahi purani galtiyan repeat kar raha hai. Kal subah fir regret hoga."
- Level 3 (Streak in danger or 0): High-intensity wake-up. Remind him of his North Star: "${params.whyIMustSwitch}". "Wahi same stagnant salary aur company me aur ek saal nikaalna hai kya? Bahane band kar aur abhi solve kar!"

Formatting:
- Telegram HTML: <b>, <i> only (NO markdown symbols like **).
- Keep length between 45 and 90 words.`

  const userPrompt = `Waqt: Raat ke ${params.currentHour}:00 IST.
Pending tasks: ${params.remainingTasks.join(", ")}.
Streak: ${params.streak} days (aadhi raat ko 0 ho jayegi agar ye nahi kiye).
North Star reason: "${params.whyIMustSwitch}".
Severity: ${isLateNight ? 'HIGH (Raat ho chuki hai, streak khatam hone wali hai)' : 'MEDIUM (Shaam nikal rahi hai)'}.

Generate a brutal, punchy Hinglish nag to force him to open the code editor right now.`

  return await callGemini({
    systemPrompt,
    userPrompt,
    temperature: 0.75,
    maxTokens: 1000,
  })
}

