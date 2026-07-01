# Hyperliquid Referral Project — Roadmap

## Goal
Drive signups to the Hyperliquid referral link **HYPEANLY** (referrer earns ~10% of a referee's fees). **Strategy:** a free, institutional-grade **trader-analytics / leaderboard** tool as traffic bait, with the deepest metrics gated behind a referral unlock — plus the existing landing page.

## Status (as of 2026-07)

### ✅ Done
- **Landing page** — LIVE at `polohot.github.io/hyperliquid-fees` (classic GitHub Pages); real referral link `HYPEANLY` activated.
- **Data sources — all FREE, resolved & verified:**
  - Leaderboard snapshot (~40k traders, pnl/roi/vlm × day/week/month/allTime) — one fetch.
  - Per-account fills (`userFillsByTime`, forward-paginated) — full trade history.
  - Hydromancer Reservoir S3 (requester-pays) — per-account **daily** equity + daily raw fills, ~11 months (2025-07-29 → now). AWS creds set up & verified.
- **Metrics validated:** snapshot ✅ · fills-based (win rate, profit factor, payoff, expectancy, holding period, maker/taker, per-coin PnL, edge t-stat) ✅ · risk-adjusted (Sharpe/Sortino/Calmar) ✅ via daily equity.
- **Backend built** (`backend/`): metrics engine + Hyperliquid fetcher + account profiler. **Hydromancer backfill DONE** (284 days → ~6.2M equity rows, 896 MB derived SQLite, process-and-discard, multi-dex SUM). **Clean-metrics pipeline** (deposit-stripped + validated quality gates) built.
- **Research:** 16 traffic tactics ranked · metric catalog (~30 metrics, bait/full tiering) · competitive landscape (risk-metrics = whitespace; referral-gating unique).

### 🏗 Architecture (decided)
- **Split stack:** hosted backend API (refresh + metrics + referral-gating) + thin Pages frontend.
- **Watchlist:** ~40k leaderboard accounts; snapshot daily (1 fetch) + incremental fills (1 call/account).
- **Storage:** derived only (~1.3 GB full), raw discarded after processing. Prod on a VPS (~$5/mo); laptop = dev only.
- **"Paste your account":** leaderboard 40k precomputed (instant, full panel); any other address → compute on the fly from free API (fills-based) + on-demand Hydromancer daily equity for risk ratios.
- **Tiers:** Bait (free) = snapshot + fills-basics + address lookup + viral scorecard · Full (referral-unlock) = risk ratios + per-coin + depth.
- **Rejected:** self-hosted node ($50–500/mo, doesn't solve API caps); Nansen (free endpoint is better).

## 🟧 Next (build order)
1. ~~Full equity backfill~~ ✅ **DONE** (284 days). **Clean-metrics batch** (deposit-stripped risk ratios for ~39k accounts) — *running* → risk-adjusted leaderboard ranking.
2. ~~Clean Sharpe/Sortino layer~~ ✅ **DONE** (ledger deposit-stripping + validation gates; the accuracy moat vs Hyperdash).
3. **Backend API server** — serve leaderboard + profile + metrics; bait/full gating stub. (#18)
4. **Frontend leaderboard tool page.** (#17)
5. **JSON-LD / SEO schema** for the site. (#13, low-effort, anytime)

## 🔮 Future (beyond v1)
- **Copy-trade service** — non-custodial, agent-based (WebSocket → `/exchange`); copy traders by **Sortino**, not raw PnL. ⚠️ **REGULATORY-gated** (copy-trading = regulated portfolio management: SEC/CFTC, MiFID/MiCA, FCA; full compliance ≈ $50–200K+). ~3–4mo MVP; needs **securities counsel + jurisdiction strategy before building**. See `research/2026-07-01 copy-trade-design.md`.

## 🟦 Parallel / open (user)
- Spot-check competitors (HyperTracker / ASXN) — confirm risk-metrics whitespace.
- Backend hosting decision (Hetzner VPS ~$5/mo).
- Domain / brand for the analytics tool.

## Key decisions log
- **Free data only** — leaderboard + per-account fills from Hyperliquid's public API; daily equity + bulk fills from Hydromancer Reservoir (free S3). No paid provider needed.
- **Multi-dex SUM** — `account_value` must be summed across all dexes per user per day (HIP-3 traders' value lives under deployer dexes like `xyz`, not `hyperliquid`).
- **Equity-curve Sortino from the public `portfolio` endpoint is unreliable** (coarse weekly + deposit-contaminated); use Hydromancer daily equity, and pair with fills daily-PnL for clean ratios.
- **Process-and-discard** backfill — keep only derived (~1.3 GB), never raw.
