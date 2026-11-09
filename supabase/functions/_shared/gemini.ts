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
 * Calls Gemini API with fallback handling. Returns null if key is missing or call fails.
 */
export async function callGemini({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 600,
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
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
    return candidateText ? candidateText.trim() : null
  } catch (err) {
    console.warn("Failed to call Gemini API:", err)
    return null
  }
}

/**
 * Generates an adaptive "Tomorrow's Battle Plan" tailored to today's completed vs missed tasks.
 */
export async function generateAITomorrowPlan(params: {
  todayDate: string
  tomorrowDate: string
  tomorrowWeekday: string
  weekNumber: number
  focusTopic: string
  dsaGoal: string
  studyGoal: string
  mustDoTotal: number
  mustDoDone: number
  remainingTitles: string[]
  streak: number
  whyIMustSwitch: string
}): Promise<string | null> {
  const systemPrompt = `You are an elite, uncompromising Silicon Valley Principal SDE and interview coach for Vaidik, a software engineer preparing for a 2-month career switch into Tier-1 tech (Google, Amazon, Uber, Atlassian, Microsoft).
Your output must be concise, punchy, battle-ready HTML formatted for Telegram (use <b>, <i>, <code> tags; do NOT use markdown symbols like ** or #). Max 160 words.`

  const userPrompt = `Today is ${params.todayDate}.
Today's progress: ${params.mustDoDone} of ${params.mustDoTotal} tasks completed.
Unfinished tasks from today: ${params.remainingTitles.length > 0 ? params.remainingTitles.join(", ") : "None! All completed."}
Current streak: ${params.streak} days.
His North Star motivation: "${params.whyIMustSwitch}".

Tomorrow is ${params.tomorrowWeekday}, ${params.tomorrowDate} (Week ${params.weekNumber}: ${params.focusTopic}).
Curriculum targets for this week:
- DSA Goal: ${params.dsaGoal}
- Study Goal: ${params.studyGoal}

Generate a clear, tailored "Tomorrow's Battle Plan" that:
1. Briefly acknowledges today's reality (praise if all done, or firm accountability if tasks were skipped).
2. Sets a concrete 4-step action plan for tomorrow covering DSA, concepts, and practice.
3. Closes with a sharp, high-intensity motivational push referencing his North Star.`

  return await callGemini({
    systemPrompt,
    userPrompt,
    temperature: 0.6,
    maxTokens: 500,
  })
}

/**
 * Generates a dynamic Hardcore Nag reality-check message when tasks are unfinished at night.
 */
export async function generateAINagMessage(params: {
  todayDate: string
  remainingTasks: string[]
  streak: number
  whyIMustSwitch: string
  currentHour: number
}): Promise<string | null> {
  const systemPrompt = `You are a brutally honest, no-excuses personal accountability coach.
Your job is to snap Vaidik out of procrastination and make him feel the immediate urgency to sit down and finish his preparation tasks right now.
Do not use generic motivational fluff. Call out the exact tasks he is currently avoiding.
Remind him of the painful cost of staying at his current salary/company for another year.
Output clean HTML formatted for Telegram (use <b>, <i>; no markdown). Max 75 words.`

  const userPrompt = `It is currently ${params.currentHour}:00 IST.
Vaidik has ${params.remainingTasks.length} tasks still unfinished: ${params.remainingTasks.join(", ")}.
His current streak is ${params.streak} days (it will reset to 0 at midnight if he doesn't finish).
His North Star: "${params.whyIMustSwitch}".

Generate an intense, urgent reality-check reminder to get him off his phone/couch and to his desk right now.`

  return await callGemini({
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxTokens: 250,
  })
}
