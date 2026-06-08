// src/app/model/page.tsx
import { db } from '@/lib/db'
import { FeatureWeightsChart, EnsembleModelsPanel, AccuracyMetrics } from '@/components/model/model-charts'
import { ModelHistoryChart } from '@/components/model/model-history-chart'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function ModelPage() {
  const [latestAccuracy, history, predCount] = await Promise.all([
    db.modelAccuracy.findFirst({ orderBy: { date: 'desc' } }),
    db.modelAccuracy.findMany({ orderBy: { date: 'desc' }, take: 30 }),
    db.modelPrediction.count(),
  ])

  const metrics = latestAccuracy
    ? [
        { label: 'Top-10 Accuracy', value: `${((latestAccuracy.correctTop10 / Math.max(latestAccuracy.totalPreds, 1)) * 100).toFixed(1)}%`, good: true },
        { label: 'Brier Score',     value: latestAccuracy.brierScore.toFixed(3), good: latestAccuracy.brierScore < 0.1 },
        { label: 'Season ROI',      value: `${latestAccuracy.roi > 0 ? '+' : ''}${(latestAccuracy.roi * 100).toFixed(1)}%`, good: latestAccuracy.roi > 0 },
        { label: 'Predictions',     value: predCount.toLocaleString(), good: true },
      ]
    : undefined

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center gap-3">
        <BarChart3 className="text-nuke-blue" size={24} />
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Model <span className="text-nuke-red">Transparency</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Every prediction tracked forever · Accuracy, calibration &amp; ROI
          </p>
        </div>
      </div>

      {/* Accuracy strip */}
      <AccuracyMetrics metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature weights */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-4">
            Default Model Feature Weights
          </div>
          <FeatureWeightsChart />
        </div>

        {/* Ensemble */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-4">
            Ensemble Models
          </div>
          <EnsembleModelsPanel />
        </div>
      </div>

      {/* History chart */}
      {history.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-4">
            30-Day Accuracy History
          </div>
          <ModelHistoryChart data={history} />
        </div>
      )}

      {/* Methodology */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-4">Model Methodology</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Data Sources', items: ['MLB Stats API', 'Baseball Savant', 'The Odds API', 'Tomorrow.io Weather', 'Rotowire Lineups'] },
            { title: 'ML Models', items: ['XGBoost (35%)', 'LightGBM (30%)', 'Neural Network (20%)', 'Random Forest (15%)'] },
            { title: 'Simulations', items: ['50,000 Monte Carlo sims', 'Per player per day', 'P5/P25/P75/P95 intervals', 'Confidence calibration'] },
            { title: 'Calibration', items: ['Brier Score tracking', 'Log-loss calibration', 'Platt scaling', 'Isotonic regression'] },
          ].map((section) => (
            <div key={section.title} className="bg-surface-2 rounded-lg p-3">
              <div className="text-xs font-semibold text-nuke-muted2 mb-2">{section.title}</div>
              {section.items.map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-nuke-muted py-0.5">
                  <span className="text-nuke-red text-[10px]">→</span>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
