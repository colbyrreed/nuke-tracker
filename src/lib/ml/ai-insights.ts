// src/lib/ml/ai-insights.ts
// Nuke Tracker — AI Insights Engine
// Uses Claude API to generate natural language HR probability explanations

import type { DashboardPlayer } from '@/types'

interface InsightResult {
  playerId: string
  playerName: string
  headline: string
  summary: string
  bullets: string[]
  riskNote?: string
  trendNote?: string
  generatedAt: Date
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildInsightPrompt(player: DashboardPlayer): string {
  const s = player.score
  const p = player.player
  const stadium = player.stadium
  const pitcher = player.pitcher
  const wx = player.game?.weather

  const windDesc = wx
    ? `${wx.windSpeed.toFixed(0)} mph ${wx.windDirectionLabel} (${wx.ballCarry})`
    : 'unknown'

  return `You are a concise MLB home run analytics expert. Generate a brief, data-driven insight for why this player ranks #${s.rank ?? '?'} on today's Nuke Tracker HR leaderboard.

PLAYER DATA:
- Name: ${p.name}
- Team: ${player.team?.abbreviation ?? 'N/A'} vs ${player.opponent?.abbreviation ?? 'N/A'}
- Batting: ${p.bats}-handed, lineup spot ${s.battingOrder ?? 'TBD'}
- HR Probability: ${(s.hrProbability * 100).toFixed(1)}%
- Nuke Score: ${s.nukeScore}/100
- Confidence: ${s.confidence > 0.75 ? 'High' : s.confidence > 0.45 ? 'Medium' : 'Low'}

STATCAST METRICS:
- Barrel Rate: ${p.barrelPct.toFixed(1)}%
- Exit Velocity: ${p.avgExitVelo.toFixed(1)} mph avg
- xSLG: ${p.xSLG.toFixed(3)}
- Hard Hit %: ${p.hardHitPct.toFixed(1)}%
- Fly Ball %: ${p.flyBallPct.toFixed(1)}%
- Pull %: ${p.pullPct.toFixed(1)}%

BOOST FACTORS:
- Weather Boost: ${s.weatherBoost > 0 ? '+' : ''}${s.weatherBoost.toFixed(1)}% (Wind: ${windDesc}, Temp: ${wx?.temperature?.toFixed(0) ?? '?'}°F)
- Park Boost: ${s.parkBoost > 0 ? '+' : ''}${s.parkBoost.toFixed(1)}% (${stadium?.name ?? 'Unknown'}, HR Factor: ${stadium?.hrFactor?.toFixed(3) ?? '?'})
- Matchup Boost: ${s.matchupBoost > 0 ? '+' : ''}${s.matchupBoost.toFixed(1)}%
- Recent Form: ${s.formBoost > 0 ? 'Hot' : s.formBoost < -2 ? 'Cold' : 'Neutral'} (${s.formBoost > 0 ? '+' : ''}${s.formBoost.toFixed(1)})

PITCHER OPPONENT:
- Name: ${pitcher?.name ?? 'Unknown'}
- HR/9: ${pitcher?.hr9?.toFixed(2) ?? '?'}
- Barrel Rate Allowed: ${pitcher?.barrelPct?.toFixed(1) ?? '?'}%
- xERA: ${pitcher?.xERA?.toFixed(2) ?? '?'}
- HR Vulnerability Score: ${pitcher?.hrVulnScore ?? '?'}/100
- Throws: ${pitcher?.throws ?? '?'}

VALUE:
- Book Implied Prob: ${s.bookOdds !== null && s.bookOdds !== undefined ? (s.bookOdds * 100).toFixed(1) + '%' : 'N/A'}
- Edge: ${s.edge !== null && s.edge !== undefined ? (s.edge > 0 ? '+' : '') + (s.edge * 100).toFixed(1) + '%' : 'N/A'}

RESPOND WITH VALID JSON ONLY (no markdown, no explanation outside JSON):
{
  "headline": "One punchy 8-12 word headline explaining the top reason",
  "summary": "2-sentence plain-English summary of why this player scores high today",
  "bullets": [
    "Specific stat-backed reason 1 (include the actual number)",
    "Specific stat-backed reason 2 (include the actual number)",
    "Specific stat-backed reason 3 (include the actual number)",
    "Specific stat-backed reason 4 (include the actual number)"
  ],
  "riskNote": "One sentence about the biggest risk factor, or null if confidence is high",
  "trendNote": "One sentence about recent trend (hot/cold streak), or null if neutral"
}`
}

// ─── Anthropic API Call ───────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}

// ─── Parse Response ───────────────────────────────────────────────────────────

function parseInsight(raw: string, player: DashboardPlayer): InsightResult {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      playerId: player.player.id,
      playerName: player.player.name,
      headline: parsed.headline ?? 'Strong HR candidate today',
      summary: parsed.summary ?? '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 4) : [],
      riskNote: parsed.riskNote ?? null,
      trendNote: parsed.trendNote ?? null,
      generatedAt: new Date(),
    }
  } catch {
    // Fallback: generate from data without AI
    return generateFallbackInsight(player)
  }
}

// ─── Fallback (no API key / rate limit) ──────────────────────────────────────

function generateFallbackInsight(player: DashboardPlayer): InsightResult {
  const s = player.score
  const p = player.player
  const pitcher = player.pitcher
  const stadium = player.stadium

  const bullets: string[] = []

  if (p.barrelPct >= 12) bullets.push(`Elite ${p.barrelPct.toFixed(1)}% barrel rate — top-tier contact quality`)
  else if (p.barrelPct >= 8) bullets.push(`Solid ${p.barrelPct.toFixed(1)}% barrel rate — above-average power`)

  if (p.avgExitVelo >= 93) bullets.push(`${p.avgExitVelo.toFixed(1)} mph avg exit velo — hard contact machine`)

  if (pitcher && pitcher.hr9 >= 1.4) bullets.push(`Opponent ${pitcher.name} allows ${pitcher.hr9.toFixed(2)} HR/9 — top-5 most vulnerable`)
  else if (pitcher && pitcher.hrVulnScore >= 75) bullets.push(`Pitcher vulnerability score ${pitcher.hrVulnScore}/100 — favorable matchup`)

  if (s.weatherBoost >= 4) bullets.push(`Wind blowing out +${s.weatherBoost.toFixed(0)}% HR boost — carry advantage`)
  if (s.parkBoost >= 6) bullets.push(`${stadium?.name ?? 'Venue'} is a hitter-friendly park (HR Factor: ${stadium?.hrFactor?.toFixed(3)})`)
  if (s.formBoost >= 5) bullets.push(`Hot streak — well above recent HR pace`)

  if (p.xSLG >= 0.5) bullets.push(`xSLG of ${p.xSLG.toFixed(3)} projects elite power output`)
  if (p.flyBallPct >= 40) bullets.push(`${p.flyBallPct.toFixed(1)}% fly ball rate creates HR opportunities`)
  if (s.battingOrder && s.battingOrder <= 4) bullets.push(`Batting ${s.battingOrder}${['', 'st', 'nd', 'rd', 'th'][s.battingOrder] ?? 'th'} — premium plate appearances`)

  const topReason = bullets[0] ?? 'Strong overall profile'

  return {
    playerId: player.player.id,
    playerName: player.player.name,
    headline: `${topReason.split('—')[0].trim()}`,
    summary: `${p.name} ranks #${s.rank ?? '?'} on today's board with a ${(s.hrProbability * 100).toFixed(1)}% HR probability. ${s.confidence > 0.7 ? 'High model confidence across multiple factors.' : 'Moderate confidence — check lineup confirmation.'}`,
    bullets: bullets.slice(0, 4),
    riskNote: s.confidence < 0.5 ? 'Lower confidence — lineup not yet confirmed' : null,
    trendNote: s.formBoost >= 5 ? 'On a hot streak in recent games' : s.formBoost <= -5 ? 'Recent cold stretch may suppress upside' : null,
    generatedAt: new Date(),
  }
}

// ─── Main: Generate insights for top N players ────────────────────────────────

export async function generateInsights(
  players: DashboardPlayer[],
  topN = 10,
  useAI = true
): Promise<InsightResult[]> {
  const top = players.slice(0, topN)
  const results: InsightResult[] = []

  for (const player of top) {
    try {
      if (useAI && process.env.ANTHROPIC_API_KEY) {
        const prompt = buildInsightPrompt(player)
        const raw = await callClaude(prompt)
        results.push(parseInsight(raw, player))
      } else {
        results.push(generateFallbackInsight(player))
      }
      // Rate limit: 1 insight per 300ms
      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      console.error(`[AI Insights] Failed for ${player.player.name}:`, err)
      results.push(generateFallbackInsight(player))
    }
  }

  return results
}

// ─── Single player insight ────────────────────────────────────────────────────

export async function generatePlayerInsight(player: DashboardPlayer): Promise<InsightResult> {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const prompt = buildInsightPrompt(player)
      const raw = await callClaude(prompt)
      return parseInsight(raw, player)
    }
  } catch (err) {
    console.error('[AI Insights] single player error:', err)
  }
  return generateFallbackInsight(player)
}

// ─── Parlay narrative ─────────────────────────────────────────────────────────

export async function generateParlayNarrative(legs: Array<{
  name: string
  prob: number
  topReason: string
}>): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `This ${legs.length}-leg parlay combines ${legs.map(l => l.name).join(', ')} for a combined probability of ${legs.reduce((a, l) => a * l.prob, 1).toFixed(3)}. Each player shows strong indicators for a home run today.`
  }

  const prompt = `Write a 2-3 sentence sports betting narrative for this MLB HR parlay. Be concise and data-driven:
${legs.map(l => `- ${l.name}: ${(l.prob * 100).toFixed(1)}% HR probability. Key reason: ${l.topReason}`).join('\n')}

RESPOND WITH PLAIN TEXT ONLY, no JSON, no markdown.`

  try {
    const raw = await callClaude(prompt)
    return raw.trim()
  } catch {
    return `This ${legs.length}-leg parlay combines some of today's top HR candidates based on Statcast metrics, weather, and matchup analysis.`
  }
}

export type { InsightResult }
