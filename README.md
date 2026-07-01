# Hyperliquid Referral Project

Drive signups to a Hyperliquid referral link via a free, institutional-grade **trader-analytics / leaderboard** tool (deep metrics gated behind a referral unlock), plus a landing page.

## Structure
```
docs/        Landing page — LIVE at polohot.github.io/hyperliquid-fees (classic GitHub Pages)
backend/     Analytics backend (Node, ESM): metrics engine, Hyperliquid fetcher, Hydromancer backfill
tools/       Dev/exploration scripts (Playwright screenshot, API probes, Sortino scans)
research/    Strategy & analysis docs (traffic tactics, metric catalog, competitive landscape)
.env         Secrets (gitignored) — copy from .env.example
ROADMAP.md   Plan, status, next steps
```

## Landing page (`docs/`)
- Source: `docs/index.html`. Live at https://polohot.github.io/hyperliquid-fees
- Deploy: classic GitHub Pages (branch `main`, `/docs`). Edit → commit → push → live in ~1 min.
- Referral link: `REFERRAL_URL` const (source of truth: `.env` `HYPE_REFERRAL_LINK`, currently `HYPEANLY`).
- Screenshot tool: `npm run shot -- <url-or-file> <out.png> [w] [h] [fullPage]` (Playwright headless Chromium).

## Backend (`backend/`)
Node (ESM) analytics engine + data pipeline. Uses the free public Hyperliquid API + Hydromancer Reservoir S3 (free, requester-pays).

### Setup
```bash
cd backend && npm install
cp ../.env.example ../.env     # then fill in AWS creds + referral link
```

### Scripts (run from `backend/`; args pass through)
| Command | What |
|---|---|
| `npm run profile -- <addr>` | Full metric panel for an account (snapshot + fills-based: win rate, PF, payoff, t-stat…) |
| `npm run backfill -- [days]` | Pull Hydromancer daily equity → derived SQLite `data/hl.db` (raw discarded). `days=0` = all ~284 |
| `npm run aws-check` | Verify AWS creds + Hydromancer bucket access |
| `npm run s3-explore` | Map the Hydromancer archive structure |
| `npm run sanity` | Pull one parquet, confirm schema + multi-dex SUM |
| `npm run clean -- [N]` | Batch deposit-stripped, validated risk ratios → `clean_metrics` (vault/gate-filtered). `N=0` = all |
| `npm run clean-one -- [addr]` | Clean Sortino/Sharpe for one account — raw (contaminated) vs clean |

## Data sources (all free)
| Source | What | Endpoint |
|---|---|---|
| Leaderboard snapshot | ~40k traders, pnl/roi/vlm × 4 windows | `GET stats-data.hyperliquid.xyz/Mainnet/leaderboard` |
| Per-account fills | full trade history (2000/page, forward-paged) | `POST api.hyperliquid.xyz/info {type:userFillsByTime}` |
| Portfolio / ledger | equity curve, capital flows | `POST api.hyperliquid.xyz/info {type:portfolio / userNonFundingLedgerUpdates}` |
| Hydromancer Reservoir | per-account **daily** equity + daily fills, ~11 mo | `s3://hydromancer-reservoir` (ap-northeast-1, requester-pays) |

## Architecture & roadmap
See [ROADMAP.md](./ROADMAP.md) for the full plan, status, and next steps.

## Notes
- `.env` and `.mcp.json` are gitignored (secrets). Never commit them.
- `backend/data/` is gitignored (regenerable derived DB).
- Referral economics: referrer earns ~10% of a referee's post-discount fees (~$20–43 per $1M referee volume); referee gets 4% off first $25M. A user can add a referral code to an existing account (low-friction unlock).
