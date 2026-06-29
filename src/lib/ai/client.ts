export interface AISettings {
  provider: string
  model: string
  baseUrl: string | null
  apiKey: string | null
}

export async function callAI({
  settings,
  prompt,
  userContent,
  temperature = 0.3,
}: {
  settings: AISettings
  prompt: string
  userContent: string
  temperature?: number
}): Promise<string> {
  const apiKey = settings.apiKey || process.env.AI_API_KEY
  if (!apiKey) {
    throw new Error('AI API key not configured')
  }

  const baseUrl = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = settings.model || 'gpt-4o-mini'

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userContent },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI request failed: ${res.status} ${text}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI response did not contain content')
  }

  return content.trim()
}

export async function testAI(settings: AISettings): Promise<string> {
  return callAI({
    settings,
    prompt: 'Kamu adalah asisten yang membantu. Jawab singkat.',
    userContent: 'Halo, apakah koneksi AI berfungsi?',
    temperature: 0.5,
  })
}
