// src/app/ai/page.tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateInsights } from '@/lib/ml/ai-insights'
import { InsightCard } from '@/components/ai/insight-card'
import { ProGate } from '@/components/ui/pro-gate'
import { Brain, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 1800 // 30 min — insights are expensive

export default async function AIPage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
    : null
  const isPro = user?.plan === 'PRO' || user?.plan === 'ELITE'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const limit = isPro ? 10 : 3
  const topScores = await db.dailyScore.findMany({
    where: { date: today },
    orderBy: { nukeScore: 'desc' },
    take: limit,
    include: {
      player: { include: { team: { include: { stadium: true } } } },
    },
  })

  // Build DashboardPlayer-compatible objects
  const players = topScores.map((s) => ({
    rank: s.rank ?? 0,
    player: s.player as any,
    team: (s.player as any).team ?? null,
    opponent: null,
    game: null,
    score: s as any,
    stadium: (s.player as any).team?.stadium ?? null,
    pitcher: null,
    weather: null,
  }))

  // Generate insights (uses Claude API or fallback)
  const insights = await generateInsights(players, limit, isPro)

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            AI <span className="text-nuke-red">Insights</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Natural language explanations powered by the Nuke model · Refreshes every 30 minutes
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-nuke-muted">
          <RefreshCw size={12} />
          <span>Last generated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-4 py-3 text-xs text-nuke-muted2">
        <span className="text-purple-400 font-bold">How AI Insights work: </span>
        For each top-ranked player, the model assembles their full Statcast profile, matchup data, weather, park factors, and odds edge — then generates a plain-English explanation of exactly why they rank where they do today.
      </div>

      {/* Insights */}
      <div className="flex flex-col gap-3">
        {insights.map((insight, i) => {
          const score = topScores[i]
          return score ? (
            <InsightCard
              key={insight.playerId}
              insight={insight}
              rank={i + 1}
              hrProb={score.hrProbability}
              nukeScore={score.nukeScore}
              delay={i * 0.06}
            />
          ) : null
        })}
        {insights.length === 0 && (
          <div className="text-center py-16 text-nuke-muted text-sm">
            No insights generated yet today. Run the data sync first.
          </div>
        )}
      </div>

      {/* Pro gate */}
      {!isPro && (
        <ProGate
          title="Unlock Full AI Insights"
          description="Get AI-generated insights for all top 10 HR candidates, including risk notes, trend analysis, and detailed Statcast breakdowns."
          plan="PRO"
        />
      )}
    </div>
  )
}
