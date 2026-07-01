# Hyperliquid Analytics — Competitive Landscape

**Date:** 2026-07-01
**Source:** background research agent (web survey), with critical assessment.
**Purpose:** Validate differentiation strategy for our referral-gated risk-metrics leaderboard.

## Bottom line
The HL analytics space is **crowded with basic PnL leaderboards but empty on institutional risk metrics.** Risk-adjusted ratios (Sharpe/Sortino/Calmar/MaxDD) and trading-skill metrics (win rate, profit factor, maker/taker, holding period, per-coin PnL) are a **clear whitespace.** Nobody uses referral-gating. → Our strategy (free bait + referral-unlocked risk metrics) is well-positioned.

## Competitive set
- **Official:** Hyperliquid leaderboard (PnL/ROI/volume × 4 windows — our free baseline).
- **HL-native trackers:** HyperTracker (market leader, whale tracking + cohorts, free→$179/499/2399/mo), Dexly (wallet explorer + copy-trade), Hyperdash (liquidation heatmaps, Copy Score), HypurrScan (block explorer), ASXN HyperScreener (market dashboard), HyperX (analytics + copy).
- **Cross-platform:** Nansen ($49–69/mo, smart-money), Arkham (entity/fund-flow), DeBank, Cielo (copy/whale), Dune (SQL dashboards), CoinGlass (derivatives).
- **Data/API vendors:** Hydromancer ($300–2,500/mo), GoldRush, QuickNode Hypercore (gRPC).

## The gaps we own
1. **Risk-adjusted metrics** (Sharpe/Sortino/Calmar/MaxDD/drawdown) — absent across the board. Our Full-tier unlock.
2. **Trading-skill metrics** (win rate, profit factor, payoff, maker/taker, holding period, per-coin PnL, edge t-stat) — mostly missing.
3. **Referral-gated monetization** — unique; everyone else is freemium-subscription.
4. **"Look up your own address" self-service hook + automated on-chain metrics** (no manual import — vs TradesViz which has metrics but needs CSV import).

## Differentiation positioning
**"Institutional analytics, retail access."** Don't out-feature HyperTracker on breadth (whales/copy/liquidations). Own the **automated risk-metrics + referral** niche. Data moat = Hydromancer Reservoir daily equity (cheap, competitors lack) → proper risk calcs.

## New tactic (viral scorecard)
Shareable risk-score cards: *"My Sharpe is 2.1 — what's yours?"* Free-bait viral loop nobody does. Add to bait tier.

## ⚠️ Caveat / to verify before launch
Spot-check **HyperTracker** and **ASXN** actual metric offerings (the survey marked them ❌ across risk metrics, but ASXN lists "risk metrics" — slight inconsistency). Confirm the whitespace is real, not just under-surfaced. TradesViz has Sharpe etc. but requires manual CSV import, so our **automated on-chain** angle remains differentiated regardless.

## Pricing benchmarks (for context)
HyperTracker free→$179/499/2399 · Nansen $49/69 · CoinGlass $29/299/699 · Hydromancer $300/1200/2500 · Arkham free→enterprise. Our model: **free + referral unlock** (no subscription friction) — distinct.

## Implication for build
- **Bait (free):** basic leaderboard (snapshot) + address lookup + **viral risk-scorecard teaser** (sample Sharpe, 30-day preview).
- **Full (referral-unlocked):** full risk ratios (Sharpe/Sortino/Calmar/MaxDD) + skill metrics (win rate/PF/payoff/maker-taker/holding/per-coin/t-stat) + daily equity curve + drawdown chart + peer benchmarking.
See `research/2026-07-01 metric-catalog.md` + memory `leaderboard-product-architecture`.
