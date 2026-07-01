# Hyperliquid Tracker — Expanded Metric Catalog (v2)

**Date:** 2026-07-01
**Sources:** 3 parallel research agents (quant-finance / trade-execution / crypto-perp-native), synthesized + de-duplicated, feasibility-checked against our actual data.
**Supplements** the metrics we already have: Sharpe, Sortino, Calmar, MAR, Omega, MaxDD, drawdown duration, recovery factor, profit factor, payoff ratio, expectancy, win rate, maker/taker ratio, annualized volatility, rank/accountValue/pnl/roi/volume.

## Data we actually have (feasibility basis)
- **Equity curve** per account, since inception, perp vs spot split (`portfolio` → `allTime.accountValueHistory`). → all drawdown/shape metrics.
- **Fills** (`userFillsByTime`): coin, side, price, size, time, dir(open/close), closedPnl, crossed(maker/taker), fee, startPosition. Caps at 2000/call → paginate for whales.
- **PnL ledger** (`userNonFundingLedgerUpdates`): per-event delta over time.
- **Funding** per user (separately queryable).
- **Market price history** for any coin via `candles` endpoint → **BTC/ETH return series obtainable from Hyperliquid itself.**
- **Cross-account**: all ~39k traders visible → cluster/copy-trade detection possible.
- **We do NOT have:** intra-trade mark-to-market (→ MAE/MFE hard), true stop prices (→ R-multiples approximate), decision/arrival price (→ slippage approximate).

### ⭐ Key enabler the agents missed
Benchmark-relative metrics (Information Ratio, Beta/R², Upside/Downside Capture) are **feasible** — we can pull BTC/ETH daily candles from Hyperliquid's own `candles` endpoint to build the benchmark return series. The agents assumed we lacked a benchmark.

---

## GROUP 1 — Drawdown & equity-curve shape (cheap, from equity curve)
*Strong candidates to add to the FREE tier — impressive-sounding and intuitive.*

| Metric | Measures | Feasibility | Tier |
|---|---|---|---|
| **Ulcer Index** | RMS of % drawdowns from peak (depth+duration of pain) | Easy | Bait |
| **Pain Index** | Average drawdown depth across all underwater spells | Easy | Bait |
| **Time Under Water** | Longest stretch (days) below a prior peak | Easy | Bait |
| **K-Ratio** | Consistency = slope/SE of log-equity regression line | Easy–Med | Bait |
| **Burke Ratio** | Return ÷ √(Σ drawdown²) — penalizes big DDs over many small | Easy | Full |
| **Sterling Ratio** | CAGR ÷ (avg of largest DDs − 10%) | Med | Full |
| **Upside Potential Ratio** | E[upside above target] ÷ downside dev | Med | Full |

## GROUP 2 — Significance & robustness (the "is the edge REAL?" crown jewels)
*The intellectual core of the Full unlock — separates skill from luck.*

| Metric | Measures | Feasibility | Tier |
|---|---|---|---|
| **Probabilistic Sharpe (PSR)** | P(true Sharpe > 0) adjusting skew/kurtosis, sample size | Med | Full ⭐flagship |
| **Per-trade return t-stat** | Statistical significance of mean per-trade return | Med | Full |
| **Bootstrap confidence intervals** | Resampled CI around Sharpe/PF (robust vs fragile) | Med | Full |
| **Edge persistence** | Sharpe/win-rate decay across consecutive periods | Med | Full |
| **Streakiness Z-score (runs test)** | Are W/L sequences random or autocorrelated (tilt)? | Med | Full |
| Skewness / excess kurtosis | Tail-risk shape of daily returns | Easy | Full (supporting) |
| Deflated Sharpe (DSR) | PSR + multiple-testing correction | Hard | Full (later) |

## GROUP 3 — Trade-execution & behavioral (from fills)

| Metric | Measures | Feasibility | Tier |
|---|---|---|---|
| **Avg holding period** | Mean/median open→close time (scalper vs swing) | Easy | Bait |
| **Trade frequency** | Trades/day — overtrading signal | Easy | Bait |
| **Win/loss streak stats** | Max win/loss streak, expected-loss-streak | Easy | Bait |
| **Position-size consistency** | Mean/var of trade size as % of account | Med | Bait |
| **Overtrading / burst detection** | Clusters of rapid-fire trades (revenge/tilt) | Med | Full |
| **Time-of-day / day-of-week PnL** | Session strengths/weaknesses | Med | Full |
| **R-multiples** | PnL per unit risk (stops inferred) | Med | Full |
| **Fee drag ratio** | Fees ÷ gross profit (execution cost) | Easy | Bait |
| Arrival slippage estimate | Fill vs reference (decision price unknown) | Hard | Full (approx) |
| MAE / MFE | Worst unrealized loss / best gain per trade | Hard | Full (approx, needs MTM) |

## GROUP 4 — Crypto / perp-native (the differentiators for a crypto audience)
*Mostly Full; these are what make the tool feel "Hyperliquid-native."*

| Metric | Measures | Feasibility | Tier |
|---|---|---|---|
| **Funding PnL decomposition** ⭐ | Trading PnL vs funding paid/received | Med | Full (flagship) |
| **Long/short directional bias** | Net long vs short tilt across positions | Med | Bait |
| **Coin specialization (HHI)** | Concentration of activity across markets | Easy | Bait |
| **Best/worst market** | Top/bottom PnL-contributing coins | Easy | Bait |
| **Effective leverage profile** | Avg/max notional ÷ equity over time | Med–Hard | Full |
| **Liquidation frequency & survivorship** | How often liquidated + recovery ratio | Med | Full |
| **BTC/ETH beta & correlation** | Market sensitivity (alpha vs levered beta) | Med | Full (benchmark via candles) |
| **Capital efficiency** | PnL per $ of margin deployed | Med–Hard | Full |
| **Wash-trading / volume-inflation score** | Same-coin opposite small round-size patterns | Med | Full |
| **Airdrop/points-farming pattern score** | Low-value repetitive activity | Med | Full |
| **Maker-rebate farming ratio** | Net rebate ÷ PnL | Easy | Full |
| **Copy-trade / wallet-correlation cluster** | Similarity to other wallets (cross-account) | Hard | Full (later) |
| HLP contribution | Share of fees/liquidations feeding HLP vault | Hard | Full (later) |

---

## Recommended build subsets

**Bait expansion (cheap + impressive + intuitive — add to FREE tier):**
Ulcer Index, Time Under Water, Best/Worst market, Coin specialization (HHI), Avg holding period, Win/loss streaks, Long/short bias, Fee drag ratio. *(8 metrics, all Easy/Med.)*

**Full flagship (the unlock "wow" panel):**
Probabilistic Sharpe (PSR), Funding PnL decomposition, BTC/ETH beta & correlation, Per-trade t-stat + Bootstrap CI, Liquidation survivorship, Effective leverage profile, Overtrading/tilt detection, Per-coin dominance. *(These are the metrics traders can't easily get elsewhere — the conversion drivers.)*

## De-dup notes
- "Fee drag" (Agent B) ≡ "Fee efficiency" (Agent C) → merged.
- "Funding drag" (B) ≡ "Funding PnL decomposition" (C) → merged (keep decomposition, richer).
- "Beta & R² vs benchmark" (A) ≡ "BTC/ETH beta & correlation" (C) → merged.
- "Modified Sharpe" ≈ Sortino (already have) → dropped as redundant.
- "Maker-rebate farming" overlaps our existing maker/taker ratio but adds PnL-relative framing → kept as distinct.

## Open questions (for when we build #17/#18)
1. Benchmark choice for beta/IR/capture: BTC-perp daily candles (default) vs equal-weight trader cohort. Recommend BTC-perp from `candles`.
2. MAE/MFE/R-multiples: build approximate versions (using candles MTM between fill timestamps) or defer? Recommend defer to v2.
3. Cross-account copy-trade clustering: expensive (O(n²)); do offline batch nightly, not per-request.
4. Long/short bias: `clearingHouseState`/`userState` returned 422 in our probe — need the correct per-user positions type, else approximate from fills.
