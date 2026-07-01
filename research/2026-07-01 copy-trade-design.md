# Copy-Trade Service — Design

**Date:** 2026-07-01
**Source:** background design agent + Hyperliquid docs. See also `competitive-landscape.md`.

## Bottom line
- **Technically feasible** via Hyperliquid's agent/API-wallet system (non-custodial).
- **#1 risk = REGULATORY** (not technical). Copy-trading-as-a-service = regulated portfolio management (SEC/CFTC US, MiFID/MiCA EU, FCA UK). Not a gray area; "not advice" disclaimers likely insufficient. Full registration ≈ $50K–200K+ (cost-prohibitive). Pragmatic path: non-custodial + jurisdiction blocking + disclaimers + **securities counsel before launch**.
- **Differentiator:** copy by **risk-adjusted rank (Sortino)**, not raw PnL — "copy consistent winners, not lucky blow-up candidates." Leverages our analytics moat.
- **Timing:** later phase (~3–4mo MVP), AFTER core leaderboard + referral-gating ship. Legal prerequisite.

## Technical mechanics
- **Monitor target:** WebSocket `wss://api.hyperliquid.xyz/ws` (sub-second) + `userFillsByTime` polling fallback (2000/call cap; 10k recent). Track last-seen fill per target.
- **Execute copy:** `POST /exchange` signed by an **agent wallet** the user approves (`approveAgent`), trading-only / **no withdrawal**. Copy latency ~100–400ms achievable (low-latency VPS near HL).

## Custody model (pick one)
- ✅ **Non-custodial agent wallet (MVP):** user approves our trading-only agent at `app.hyperliquid.xyz/agents`; we hold the *agent* key encrypted (can trade, can't withdraw). Best UX/safety balance.
- ✅ **User-hosted bot (max non-custodial):** we send signals, user's own bot executes. Strongest legal positioning, worst UX.
- ❌ **Custodial (avoid):** we hold user funds → money-transmission/custody regulation, huge liability.

## Competitors (Hyperliquid copy-trade)
Dexly (non-custodial, mobile), Hyperdash (Copy Score + terminal), BitMEX (entered HL, up to 5 traders + reverse-copy), WunderTrading (user vaults). Risk controls (drawdown limits, auto-stop, slippage guard) are table stakes.

## Sizing & risk controls
- Sizing: **proportional-to-equity** (default) or fixed-$ (simple). `copier_size = target_size / target_equity × copier_equity × scaling`.
- Per-copy: scaling factor, max position/total allocation, max target drawdown auto-stop, slippage protection, per-pair limits.
- Portfolio: total allocation cap, max concurrent traders, daily loss limit, account-level kill switch.
- Skip guards: latency (>5s), size, slippage, illiquidity.

## Architecture (fits split-stack)
Copy-engine microservice: **Target Monitor** (WS + fills) → **State Manager** (positions/configs/perf) → **Execution Engine** (sizing + risk checks + agent-signed orders) → **Agent Manager** (encrypted keys, approvals). API: `/api/copy/{targets,subscribe,unsubscribe,config,positions,performance}`. Stack: Node/TS, Postgres + Redis, low-latency VPS, KMS for keys.

## Monetization & gating
**Tier 3 subscription** ($49–199/mo) above the existing tiers (Tier 1 free leaderboard / Tier 2 referral-unlocked metrics / Tier 3 copy-trade). Optional performance fee (10–20% of profits) later. Copy-trade is a distinct value prop — doesn't cannibalize the referral unlock.

## Phased plan
- **Phase 1 MVP (3–4mo):** non-custodial agent, proportional sizing, single target, core risk controls, WS monitor + HTTP execute, crypto-friendly jurisdictions only, sub-$ or beta pricing. Engage counsel in parallel.
- **Phase 2:** fixed-$ + risk sizing, multi-trader, portfolio controls, perf analytics, mobile web, performance fee.
- **Phase 3:** jurisdiction expansion (post legal review), style-drift detection, API for automated copiers, native mobile.

## Critical risks
🔴 Regulatory enforcement · 🔴 Agent-key security breach · 🟠 Execution failure/slippage/downtime · 🟠 Poor target performance · 🟡 Competition · 🟡 Adoption.

## Action
**Do NOT build before:** (1) core leaderboard + referral gating shipped, (2) securities counsel opinion on positioning, (3) jurisdiction strategy. Strong feature, strong differentiator — but regulatory-gated, not v1.
