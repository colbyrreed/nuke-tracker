# 💣 Nuke Tracker

**The most advanced MLB home run analytics platform on the internet.**

Ranks every MLB hitter by home run probability every day using live Statcast data, machine learning, weather modeling, park factors, pitcher vulnerabilities, and real-time game updates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, TailwindCSS, ShadCN UI, Framer Motion |
| State | Zustand, TanStack Query |
| Charts | Recharts, TanStack Table |
| Backend | Node.js, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Cache | Redis (Railway) |
| Auth | Clerk |
| Payments | Stripe |
| Notifications | Firebase, OneSignal |
| Hosting | Vercel (app) + Railway (Redis) |
| ML | Custom ensemble: XGBoost + LightGBM + Neural Net + Random Forest |

---

## Features

### Pages (20 total)
1. **Dashboard** — Top 25 HR hitters ranked by Nuke Score
2. **Live HR Tracker** — Real-time home run feed with Statcast data
3. **Player Profiles** — Deep-dive stats, heat maps, spray charts
4. **Game Center** — HR environment rating per game
5. **Park Center** — Stadium database with dimensions & factors
6. **Weather Center** — Map view with HR boost % per game
7. **Pitcher Targets** — Rank pitchers most likely to allow HRs
8. **Value Finder** — Model vs. sportsbook edge calculator
9. **Parlay Builder** — Auto-generated HR parlays
10. **Spray Chart Lab** — Interactive spray charts
11. **Lineup Center** — Confirmed & projected lineups
12. **Trend Lab** — Hot hitters with surge metrics
13. **AI Insights** — Natural language model explanations
14. **Model Transparency** — Accuracy, Brier Score, ROI tracking
15. **Leaderboards** — Season & player rankings
16. **Alert Center** — Push notification subscriptions
17. **Custom Model Builder** — User-adjustable feature weights
18. **DFS Mode** — FanDuel & DraftKings lineup optimizer
19. **Research Database** — Historical player search
20. **Admin Panel** — User, API, and system management

### ML Model
- **Ensemble**: XGBoost (35%) + LightGBM (30%) + Neural Net (20%) + Random Forest (15%)
- **50,000 Monte Carlo simulations** per player per day
- **18+ model inputs**: Barrel %, Exit Velocity, Park Factor, Weather, Platoon, Form, Matchup
- **HR Score** 0-100 with sub-scores: Value, Risk, Leverage, Upside
- **Weather Engine**: Air density, wind carry, temperature effect
- **Auto-recalculates** on lineup confirmation and every 60 seconds

### Plans
| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Top rankings | 10 | Full | Full |
| Value Finder | — | ✓ | ✓ |
| Parlay Builder | — | ✓ | ✓ |
| AI Insights | — | ✓ | ✓ |
| DFS Mode | — | — | ✓ |
| Custom Models | — | — | ✓ |
| API Access | — | — | ✓ |
| Data Export | — | — | ✓ |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for local Postgres + Redis)
- Accounts: Clerk, Stripe, The Odds API, OpenWeather, Tomorrow.io

### 1. Clone & Install
```bash
git clone https://github.com/your-org/nuke-tracker
cd nuke-tracker
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# Fill in all API keys
```

### 3. Start Services
```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
```

### 4. Database Setup
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Run Dev Server
```bash
npm run dev
# http://localhost:3000
```

### 6. Initial Data Sync
```bash
npm run data:sync
```

---

## Deployment

### Vercel (Frontend + API)
```bash
vercel --prod
```
Set all env vars in Vercel dashboard. Cron jobs run automatically via `vercel.json`.

### Railway (Redis)
```bash
railway login
railway new
railway add redis
railway env set REDIS_URL=...
```

### Supabase (PostgreSQL)
1. Create project at supabase.com
2. Copy `DATABASE_URL` from project settings
3. Run `npm run db:push`

### Stripe Setup
1. Create products: **Pro** ($19/mo) and **Elite** ($49/mo)
2. Copy price IDs to `.env`
3. Set webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Enable event: `checkout.session.completed`, `customer.subscription.*`

---

## Data Sources

| Source | Data | Refresh |
|--------|------|---------|
| MLB Stats API | Games, lineups, scores | 60s |
| Baseball Savant | Statcast, exit velo, barrel rate | 5 min |
| The Odds API | Player HR props | 60s |
| Tomorrow.io | Stadium weather | 30 min |
| OpenWeather | Fallback weather | 30 min |
| Rotowire | Confirmed lineups | 2 min |

---

## ML Model Details

### Feature Weights (Default)
| Feature | Weight |
|---------|--------|
| Exit Velocity | 18% |
| Barrel Rate | 18% |
| Pitcher HR/9 | 17% |
| Park HR Factor | 14% |
| Weather Boost | 12% |
| Platoon Advantage | 9% |
| Recent Form (L7) | 7% |
| Historical Matchup | 5% |

### Nuke Score → HR Probability Calibration
| Nuke Score | HR Probability |
|------------|---------------|
| 90+ | ~30% |
| 75-89 | ~20% |
| 60-74 | ~14% |
| 45-59 | ~9% |
| < 45 | < 6% |

---

## Project Structure

```
nuke-tracker/
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── api/             # REST endpoints
│   │   ├── dashboard/       # Main rankings page
│   │   ├── live/            # Live HR tracker
│   │   ├── games/           # Game center
│   │   ├── pitchers/        # Pitcher targets
│   │   ├── value/           # Value finder
│   │   ├── parlay/          # Parlay builder
│   │   ├── ai/              # AI insights
│   │   ├── dfs/             # DFS mode
│   │   ├── model/           # Model transparency
│   │   └── admin/           # Admin panel
│   ├── components/          # React components
│   │   ├── layout/          # Nav, sidebar, shell
│   │   ├── dashboard/       # Dashboard-specific
│   │   ├── charts/          # Recharts wrappers
│   │   └── ui/              # ShadCN components
│   ├── lib/
│   │   ├── ml/              # Scoring engine, daily scorer
│   │   ├── api/             # External API integrations
│   │   ├── data/            # DB query functions
│   │   └── utils/           # Cache, helpers
│   ├── store/               # Zustand stores
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── prisma/
│   └── schema.prisma        # Full DB schema (20 models)
├── scripts/
│   ├── sync-data.ts         # Master data sync
│   ├── seed.ts              # Seed DB with stadiums, teams
│   └── train-model.ts       # Offline model training
└── docker/
    └── docker-compose.yml   # Local Postgres + Redis
```

---

## License
Proprietary — Nuke Tracker © 2026
