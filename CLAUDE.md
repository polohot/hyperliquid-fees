# CLAUDE.md — guidance for working in this repo

Project: Hyperliquid referral project — a free, institutional-grade trader-analytics/leaderboard (deep metrics referral-gated) + a landing page. Goal: drive signups to the referral link `HYPEANLY`. See `README.md` (setup) and `ROADMAP.md` (plan/status).

## ⚠ Secrets (critical)
- `.env` (AWS, Nansen, Tavily, referral link) and `.mcp.json` (Tavily key) are **gitignored**. **NEVER echo their values in output, NEVER commit them.** The referral link itself is public (it lives in `docs/index.html`); API keys are not.
- Template with placeholder values: `.env.example`.

## Layout
- `docs/` — landing page (LIVE at polohot.github.io/hyperliquid-fees; classic GitHub Pages, branch `main` / `/docs`).
- `backend/` — Node (ESM) analytics: metrics engine, Hyperliquid fetcher, Hydromancer backfill.
- `tools/` — dev/exploration scripts (Playwright screenshot, API probes, Sortino scans).
- `research/` — strategy & analysis docs.

## Running things
- Landing page screenshot: `npm run shot -- <url-or-file> <out.png> [w] [h] [fullPage]` (run from repo root).
- Backend: `cd backend && npm install`, then `npm run profile -- <addr>` | `npm run backfill -- [days]` | `npm run aws-check` | `npm run s3-explore` | `npm run sanity`. Scripts auto-load `../.env`.

## Data sources (all free, no paid provider)
- Hyperliquid public API (no auth): leaderboard `GET stats-data.hyperliquid.xyz/Mainnet/leaderboard`; per-account `POST api.hyperliquid.xyz/info`.
- Hydromancer Reservoir S3 (requester-pays, region `ap-northeast-1`): per-account daily equity + daily fills, ~11 months.

## ⚠ Gotchas (learned the hard way)
- **Multi-dex SUM**: `account_values` has ONE row per user PER DEX (`hyperliquid`, `xyz`, `flx`, `vntl`, …). Sum `account_value` across ALL dexes per user per day, or HIP-3/tokenized-stock traders read `$0`.
- **Fills pagination**: `userFillsByTime` returns the **earliest 2000 fills after `startTime`**. Page **forward** by setting `startTime = last_fill_time + 1`. (Backward `endTime` paging returns nothing.)
- **Trustworthy Sortino/Sharpe need deposit-stripping**: raw equity-curve ratios are deposit-contaminated (deposits inflate returns *and* mask drawdowns). Use `cleanMetrics()` (`metrics.js`) = clean_pnl (Δequity − ledger capital flows) on **Hydromancer daily equity**, then the **quality gates** in `compute-clean-metrics.js` — only `quality='good'` ranks (filters vaults / inactive / degenerate / bad_stripping / low_coverage; validates cleanTotalPnl ≤ Hyperliquid snapshot allTime pnl). Public `portfolio` is coarse ~weekly, unusable.
- **DuckDB's native binding is broken in this Node 24 env** (`duckdb_api` init failure) → use **hyparquet** (parquet parse) + **better-sqlite3** (store) instead.
- **Rate limit**: Hyperliquid public API sustains ~3.5 req/s — use bounded concurrency + backoff for batch jobs; expect ~10% throttle failures at concurrency 6.
- **Backfill = process-and-discard**: download raw → derive → **delete raw**. Keep only derived data in `backend/data/` (gitignored, ~1.3 GB full). Raw Hydromancer files are ~68 MB/day.

## Locked decisions
Free data only (leaderboard + per-account fills + Hydromancer). Self-hosted node **rejected** ($50–500/mo, doesn't lift API caps, no queryable historical API). Nansen **abandoned** (the free Hyperliquid endpoint is better). Referral-gated **bait/full** tiers; gating can go live (referral link `HYPEANLY` obtained).

## Notes for this environment
- User runs Claude Code on a GLM/ZAI model — **concurrent subagents hit rate limits hard**; prefer serial work or a small number of agents. Tavily MCP is configured for web search.
- Project memory (loaded each session via `MEMORY.md`) holds the detailed facts: `hyperliquid-referral-project`, `hyperliquid-leaderboard-endpoint`, `hydromancer-reservoir-archive`, `leaderboard-product-architecture`, `hyperliquid-analytics-competition`.
