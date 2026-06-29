# Hyperliquid Referral Strategy — Research Report

**Date:** 2026-06-29
**Research method:** Direct Tavily web search across 5 angles (Hyperliquid mechanics, paid ad channels, organic channels, landing pages, ROI), source-cited and cross-checked against Hyperliquid's official docs and a real on-chain API example.

**Bottom line up front:** Paid cold-traffic advertising for a Hyperliquid referral link is **very likely unprofitable** on a per-referee basis. The math only breaks even if you acquire *high-volume* traders (~$1M+/month volume), which paid ads rarely deliver. The best "bang for the buck" is **content + SEO (free, warm traffic) with a landing page**, using paid crypto ad networks only as a small, measured test.

---

## 1. How the Hyperliquid referral program actually works

From Hyperliquid's official docs (https://hyperliquid.gitbook.io/hyperliquid-docs/referrals):

- **To become a referrer:** you must first do **$10,000 in trading volume**.
- **Referrer earns:** **10% of the referred user's fees**, "less any fee discount they receive." Your link is `app.hyperliquid.xyz/join/YOURCODE`.
- **Referee gets:** a **4% fee discount** for their first **$25M** in volume.
- **Referral rewards apply** to the referee's first **$1B** in volume — effectively uncapped for almost everyone.
- **Payout:** rewards accrue across all quote assets, claimable once >$1, **credited to your spot balance (USDC)**. No manual claim hassle.
- **Can't be applied retroactively** — the code must be used at signup via the link. (https://hyperliquidguide.com/referral)
- Base fees: **taker 0.045%, maker 0.015%** (volume tiers reduce these). The 4% discount stacks with HYPE staking discounts. (https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees)

**What "10% less the discount" means in practice** — verified against a real on-chain example in the Hyperliquid API docs (https://docs.chainstack.com/reference/hyperliquid-info-referral):

> A referee with ~$960k cumulative volume had `cumRewardedFeesSinceReferred: $196.84` and `cumFeesRewardedToReferrer: $19.68` — i.e., the referrer received **exactly 10% of the (post-discount) fee base**.

So: **referrer ≈ 10% of the referee's net fees ≈ $20–43 per $1M of referee trading volume** (lower if the referee is maker-heavy, higher if taker-heavy). Confirmed by real data, not a guess.

## 2. The unit economics — what each referee is worth to you

| Referee monthly volume | Fees they generate (taker) | **Your monthly earnings (~10%)** | Your annual earnings |
|---|---|---|---|
| $100k (typical retail) | ~$45 | **~$4** | ~$50 |
| $1M (serious trader) | ~$450 | **~$43** | ~$520 |
| $10M (pro/algo) | ~$4,500 | **~$430** | ~$5,200 |
| $100M (market-maker) | ~$45,000 | **~$4,300** | ~$52,000 |

**The crux:** referral earnings are *tiny* for retail referees and only meaningful for high-volume traders. This is the single most important fact for strategy.

## 3. Paid advertising channels — what's even allowed

Crypto ads are heavily gated. Mainstream platforms largely **block DEX/referral promotion**:

| Platform | Crypto referral link verdict | Source |
|---|---|---|
| **Google Ads** | ❌ Effectively closed. Requires certification + local exchange licensing. ICOs/DeFi trading protocols/direct "trade crypto" promos **banned**. Hyperliquid is a no-KYC DEX → won't qualify. | https://support.google.com/adspolicy/answer/14009787 , https://legalnodes.com/article/crypto-ad-guidelines-meta-google-twitter |
| **Meta (FB/IG)** | ❌ Requires written permission + regulatory license. DEX without license → not approvable. | https://transparency.meta.com/policies/ad-standards/restricted-goods-services/cryptocurrency-products-and-services |
| **TikTok** | ❌ Bans most crypto ads globally. | https://coinzilla.com/blog/crypto-advertising-regulations |
| **X (Twitter)** | ⚠️ Paid ads require prior authorization via managed advertisers; DeFi trading protocols banned. **Organic posting is free and fine.** | https://business.x.com/en/help/ads-policies/ads-policy-update-log |
| **Reddit** | ⚠️ Allowed as a restricted category with approval. | https://coinzilla.com/blog/crypto-advertising-regulations |

**The viable paid path = crypto-specific ad networks** (https://generis.agency/crypto-marketing/top-10-crypto-ad-networks-in-2025-best-web3-ad-platforms , https://chainaware.ai/blog/best-crypto-advertising-networks , https://coinbound.io/top-crypto-ad-networks):

| Network | Min spend | Pricing | Notes |
|---|---|---|---|
| **Bitmedia** | $20/day, no min deposit | CPM $1.07–3.88 (premium to $30), CPC | 3,000+ crypto sites, AI fraud protection. Best low-budget entry. |
| **Coinzilla** | €50/day, €100 deposit | CPM ~$5–20 | 650+ finance/crypto sites. Broad reach. |
| **A-Ads** | None | CPM/CPC, flexible | Cheapest, but bot-traffic risk. |
| **CoinAd** | $5/day | $0.10 CPC / $0.30 CPM | Very cheap, very low quality. |
| **Blockchain-Ads** | $1,000/mo | CPM/CPA | **On-chain wallet targeting** (82 chains) — can target wallets that have used perp DEXs. Most precise for reaching real traders. |

⚠️ **Bot/invalid traffic averages ~8.5%** across platforms — budget for waste. (https://surgence.io/blog/crypto-paid-advertising-playbook)

## 4. Where Hyperliquid traders actually congregate (organic — free)

Hyperliquid dominates perp DEX trading: **~69% of perp DEX daily active users**, tens of thousands of daily traders, $27B+ peak daily volume (https://finance.yahoo.com/news/hyperliquid-hype-grabs-69-perp-053746372.html , https://eco.com/support/en/articles/11972709-what-is-hyperliquid-the-app-chain-perp-dex). The audience is large and concentrated:

- **X (Twitter)** — the primary hub. @HyperliquidX has 405K+ followers. Threads + strategy content convert here. **Your #1 free channel.**
- **Hyperliquid Discord** — official community, traders request listings/discuss. Active.
- **Telegram** — Hyperliquid Announcements + many trading signal groups.
- **YouTube** — tutorials/overviews convert best (educational content). E.g. https://www.youtube.com/watch?v=WHQRHK_FVuU.
- **Reddit** — r/CryptoCurrency, r/defi (mind self-promotion rules).

**Content formats ranked by conversion** (https://earnpark.com/en/posts/best-crypto-affiliate-programs-honest-2026-rankings):
- Educational long-form (tutorials, "how to use Hyperliquid"): **8–12%**
- Comparison reviews ("Hyperliquid vs Binance/Bybit"): **4–7%**
- Social posts with direct CTA: **2–5%**
- **Generic paid ad traffic (no pre-qualification): 1–3%**

And **warm traffic converts 2–10× better than cold** (https://propellerads.com/blog/adv-crypto-affiliate-programs). This is the decisive point: content/warm traffic is dramatically more efficient than cold paid ads.

## 5. Landing page — yes, build one

For a DEX referral, a landing page that **presells** beats a bare link, especially for less crypto-savvy users (Hyperliquid's signup auto-applies your code via the `/join/CODE` URL, so the page's job is to explain the benefit + build trust first). Best practices (https://unbounce.com/conversion-rate-optimization/cro-best-practices , https://www.glassbox.com/landing-page-optimization , https://tmco.io/crypto-marketing/how-to-create-a-referral-program):

- **Headline value prop front-and-center:** "Get 4% off Hyperliquid trading fees — for life" (the *referee's* benefit).
- **Step-by-step signup tutorial** (connect wallet → click link → discount auto-applies).
- **Trust signals:** self-custody, on-chain, $27B daily volume, 69% perp DEX share.
- **Single CTA, no nav menu** (one action: "Claim my 4% discount →").
- **Mobile-first, fast** (1s load ≈ 40% conversion).
- **Disclose it's your referral link** + risk warnings (compliance — never "guaranteed returns").

## 6. ROI reality check — the break-even math

Modeling cold paid traffic through a crypto ad network (CPM ~$10, CTR ~0.7%, click→signup ~2%, signup→funded ~30%, funded→active ~40%):

> **Cost per active trading referee ≈ $200–600+** via cold paid ads.

Compare to CAC benchmarks: paid-search CAC averages ~$802; referral/affiliate CAC ~$45–310 depending on vertical (https://www.phoenixstrategy.group/blog/cac-benchmarks-by-channel-2025 , https://www.digitalapplied.com/blog/customer-acquisition-cost-benchmarks-2026-industry). Notably, **CEX affiliate programs pay a flat CPA of $10–200 per funded user** (https://earnpark.com/en/posts/best-crypto-affiliate-programs-honest-2026-rankings , https://changehero.io/blog/best-crypto-affiliate-programs) — that's an upfront payment. **Hyperliquid offers NO upfront CPA, only slow rev-share (~10% of fees).** So Hyperliquid's program is structurally worse for paid acquisition than CEX programs.

**Break-even:** At ~$43/year per $1M of referee volume, recovering a $555 CAC requires a referee doing **~$1M+/month**.

- A **$100k/month retail referee** earns you ~$50/year → **~10 years to recover CAC. Never profitable.**
- A **$1M/month serious trader** → ~$520/year → breaks even in ~13 months.
- A **$10M/month pro** → ~$5,200/year → recovers CAC in ~5 weeks. Highly profitable.

**Conclusion:** Cold paid ads deliver mostly low-volume retail referees → **unprofitable.** Profitable only if you reach high-volume traders, which cold display ads rarely do.

## 7. Recommended strategy

Given an ad budget but **no existing audience**, and paid cold acquisition is likely unprofitable, here's the best bang-for-buck plan:

1. **Lead with content + SEO (free, warm, highest ROI).** Build a landing page + content targeting searches like "Hyperliquid referral code," "Hyperliquid fees," "Hyperliquid vs Binance." Organic search is the #1 affiliate traffic source (~50% of affiliate traffic). Slow to build (months) but compounding and free.
2. **Be active on X + YouTube** — where Hyperliquid traders live and where educational content converts best (8–12%). This builds the warm audience that converts 2–10× better than cold.
3. **Use paid crypto ad networks only as a small, measured test** — start with **Bitmedia ($20/day)** or **Coinzilla (€50/day)**, ~$300–500 total, to gather CAC data. If you can afford precision, **Blockchain-Ads** ($1,000/mo) can on-chain-target wallets that have used perp DEXs — far higher quality than generic display. **Expect paid to likely lose money short-term**; treat it as data-gathering, not profit.
4. **Build the landing page** (primary build) — presell the 4% discount + tutorial → your `/join/CODE` link.
5. **Set realistic expectations:** treat this as a **slow-building passive income stream (months)**, not a quick paid-acquisition arbitrage. The program rewards *audience*, not *ad spend*.

## 8. What to build

- **Primary: a landing page** (static site) — value prop, tutorial, trust signals, single CTA → your referral link. This is the core asset.
- **Secondary (optional): a referral stats tracker** — Hyperliquid's API exposes referral data (the `info` / `type: "referral"` endpoint, per https://docs.chainstack.com/reference/hyperliquid-info-referral), so a small dashboard pulling referees/volume/earnings is feasible and useful for monitoring. But it's premature before you have referrals — build it once you have traffic.
- **Don't over-build.** Given the economics, an elaborate tracker now is premature. Start with the landing page + content.

---

## Sources

- Hyperliquid official referral docs: https://hyperliquid.gitbook.io/hyperliquid-docs/referrals
- Hyperliquid fees docs: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees
- Hyperliquid referral API (real earnings example): https://docs.chainstack.com/reference/hyperliquid-info-referral
- Google Ads crypto policy: https://support.google.com/adspolicy/answer/14009787
- Meta crypto policy: https://transparency.meta.com/policies/ad-standards/restricted-goods-services/cryptocurrency-products-and-services
- X Ads policy log: https://business.x.com/en/help/ads-policies/ads-policy-update-log
- Crypto ad policy overview (Legal Nodes): https://legalnodes.com/article/crypto-ad-guidelines-meta-google-twitter
- Crypto paid ads playbook (Surgence): https://surgence.io/blog/crypto-paid-advertising-playbook
- Crypto ad networks comparison (Generis): https://generis.agency/crypto-marketing/top-10-crypto-ad-networks-in-2025-best-web3-ad-platforms
- Crypto ad networks + conversion (ChainAware): https://chainaware.ai/blog/best-crypto-advertising-networks
- Crypto affiliate conversion benchmarks (Earnpark): https://earnpark.com/en/posts/best-crypto-affiliate-programs-honest-2026-rankings
- Crypto affiliate programs/CPA (Changehero): https://changehero.io/blog/best-crypto-affiliate-programs
- Crypto affiliate funnels (PropellerAds): https://propellerads.com/blog/adv-crypto-affiliate-programs
- CAC benchmarks 2025 (Phoenix Strategy): https://www.phoenixstrategy.group/blog/cac-benchmarks-by-channel-2025
- CAC benchmarks 2026 by industry (digitalapplied): https://www.digitalapplied.com/blog/customer-acquisition-cost-benchmarks-2026-industry
- Landing page CRO (Unbounce): https://unbounce.com/conversion-rate-optimization/cro-best-practices
- Hyperliquid market dominance (Yahoo/99bitcoins): https://finance.yahoo.com/news/hyperliquid-hype-grabs-69-perp-053746372.html
- Hyperliquid overview (Eco): https://eco.com/support/en/articles/11972709-what-is-hyperliquid-the-app-chain-perp-dex
