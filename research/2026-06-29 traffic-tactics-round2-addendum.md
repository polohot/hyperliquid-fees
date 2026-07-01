# Traffic Tactics — Round 2 Addendum (Expanded Action List)

**Date:** 2026-06-29
**Purpose:** Add **new** unconventional-but-automatable traffic tactics (T9–T16) to the selection list from `2026-06-29 unconventional-automatable-traffic.md` (T1–T8). Source-cited. Ends with a consolidated master action list.

**Same strategic filter applies:** target *referee quality* (high-volume traders/devs) over raw reach, because referral economics reward volume (≈$520/yr per $1M/mo referee vs ≈$50/yr for $100k/mo retail).

---

## New tactics (T9–T16)

| # | Tactic | Type | Auto? | Referee quality | Effort | Risk |
|---|---|---|---|---|---|---|
| 9 | **Dune / on-chain dashboards** | Organic / authority | ✅ | 🟢 High (pros/research) | Med | Low |
| 10 | **TradingView PineScript + Ideas** | Organic / community | ⚠️ semi | 🟡 Med (traders) | Med | Low |
| 11 | **Directory submission at scale** | Backlinks / discovery | ✅ | 🟡 Med | Low | Low |
| 12 | **Content syndication (Medium/dev.to/Hashnode)** | Organic / reach | ✅ | 🟡 Med | Low | Low |
| 13 | **Structured data / JSON-LD schema** | AI-search (GEO) enabler | ✅ | 🟢 High (intent) | Low | Low |
| 14 | **Digital PR via journalist queries** | Authority / backlinks | ⚠️ semi | 🟡 Med | Med | Low |
| 15 | **Compliance-safe companion extension** | Build asset / discovery | ✅ build | 🟡 Med | High | Med |
| 16 | **On-chain wallet-targeted ads** | Paid precision | ✅ | 🟢 High (perp traders) | Low | Med (cost) |

### 9. Dune / on-chain analytics dashboards
**Concept:** Dune is a SQL-native onchain analytics platform — 1M+ published queries, 100+ chains, free tier in 2026. "Protocol-overview" dashboards (TVL, volume, active users, leaderboards) are among the highest-traffic public dashboards; 21Shares already publishes a Hyperliquid dashboard. (https://eco.com/support/en/articles/14800359-dune-analytics-build-custom-dashboards , https://www.21shares.com/en-eu/insights/dune-dashboards , https://ourcryptotalk.com/blog/top-10-dune-analytics-dashboards-for-navigating-web3-in-2026)

**Hyperliquid fit (strong):** build a public "Hyperliquid stats" dashboard — volume/OI/funding, a **referral leaderboard**, top traders, fee tiers. The crypto-research crowd (traders, analysts, journalists) searches for and shares these, and your Dune **profile links out** to your site/referral. Attracts exactly the pro audience.

**Automation:** SQL queries + Dune's scheduled refresh = near-zero ongoing maintenance once built.

### 10. TradingView PineScript indicators + Trading Ideas
**Concept:** TradingView's Community Scripts has 100,000+ free indicators/strategies and a huge active trader audience; published scripts and "Ideas" (chart analysis) get views and followers. (https://www.tradingview.com/support/solutions/43000561836-what-is-pine-script , https://www.tradingview.com/scripts)

**Hyperliquid fit:** publish PineScript indicators or Trading Ideas focused on perps/Hyperliquid-listed assets; your profile/link drives traders to the referral. Trader audience = on-target, though somewhat TradFi-skewed.

**Automation:** write scripts/ideas once; they keep earning views. Semi-automatable (idea generation can be AI-assisted).

### 11. Directory submission at scale
**Concept:** List the site/tool on 100+ AI/SaaS/startup directories (Product Hunt, There's An AI For That, FutureTools, Toolify, BetaList, AlternativeTo, SaasHub, etc.). Claimed effect: domain rating 0→30+ in weeks via backlinks, plus direct discovery traffic. A free, maintained list with domain-rating + monthly-visit data exists on GitHub. (https://github.com/submitaitools/Free-AI-Directories , https://aiso.blog/best-directories-ai-tools , https://launchdirectories.com/directory-submission/ai-tool)

**Fit:** once the **fee calculator** (T1) exists, submit it as a "free crypto fee calculator" to these dirs → instant backlinks + authority that lifts SEO for *everything else*. Best ROI-after-a-tool tactic.

**Automation:** semi-automated (form-fill via a submission tool/script); done-for-you services exist (~€79–179) but free manual submission to the top ~25 is plenty.

### 12. Content syndication (Medium / dev.to / Hashnode / HackerNoon)
**Concept:** Republish each article on high-authority platforms with a **canonical tag** pointing to your original → taps their audience (Medium DA 94 / 22M visits; dev.to ~4k views/post; In Plain English 3.5M views) while consolidating ranking signals on your site. (https://resources.plainenglish.io/in-plain-english-vs-devto-hashnode-medium-and-hackernoon-best-platform-for-reach-in-2026 , https://dev.to/radiomorillo/how-blog-post-syndication-can-help-you-reach-more-readers-8ik , https://townhall.hashnode.com/why-you-should-republish-your-devblog-posts-and-how-to-do-it , https://www.digitalapplied.com/blog/content-amplification-strategy-2025)

**Fit:** every "Hyperliquid vs Binance" / "Hyperliquid fees" article gets syndicated → wider reach + backlinks. **Must use canonical** (set at publish time — can't add later on some platforms) or the big platform outranks your own site.

**Automation:** import tools + canonical; can be wired into the content pipeline (T6).

### 13. Structured data / JSON-LD schema (quick win that powers GEO)
**2026 reality check:** Google's March 2026 update narrowed FAQ/HowTo **rich snippets** (FAQ impressions ~halved; HowTo removed for non-primary content). BUT structured data is now decisive for **AI search**: "Gemini, ChatGPT, Perplexity, and Claude still actively read FAQPage markup during answer extraction." A Search Engine Land experiment found only the page **with** JSON-LD appeared in a Google AI Overview (and ranked highest); the no-schema page wasn't even indexed. (https://www.gwcontent.com/blogs/news/structured-data-for-seo , https://www.digitalapplied.com/blog/schema-markup-after-march-2026-structured-data-strategies , https://www.seostrategy.co.uk/learn/faq-schema-deprecation-2026-rich-result-vs-schema)

**Action:** add JSON-LD to the site — `Article`/`BlogPosting` + `Person` author + `BreadcrumbList` (still earn rich results), and `FAQPage` as machine-readable Q&A (3–7 Qs, 40–60 words each, no marketing copy) even though its SERP snippet is restricted. This directly **supercharges T3 (GEO/AI-citation)** and indexing. **Lowest effort, highest leverage per minute** on the list.

### 14. Digital PR via journalist-query platforms (post-HARO)
**Update:** HARO shut down → Connectively → also shut down (2024) → relaunched. Current platforms: **Qwoted, Featured, SourceBottle (free), Help a B2B Writer, Source of Sources**, plus the `#JournoRequest` hashtag and JournoFinder. (https://searchcompendium.com/haro-alternatives , https://questiondb.io/learn/best-haro-alternatives-for-media-placements , https://www.buzzstream.com/blog/haro-alternatives , https://www.harolinkbuilding.com/blog/how-to-pitch-an-opportunity-on-qwoted)

**Fit:** respond to crypto/finance/trading journalist queries with genuine expert insight → Tier-1 media backlinks (high domain authority) → lifts the whole site's SEO. **Never AI auto-reply** (instant ban); AI-draft + human-send is fine. Semi-automatable (monitor queries, draft, approve).

### 15. Compliance-safe companion extension
**Concept:** Build a genuine utility extension (not an affiliate-injector) — e.g., a "Hyperliquid companion" that surfaces funding/OI/fees inline, or a fee calculator popup. Chrome policy requires extensions to be a "helpful companion… providing complementary functionality" that adds unique value. (https://developer.chrome.com/docs/webstore/program-policies/policies , https://developer.chrome.com/docs/webstore/best-practices) A real tool with a **disclosed, user-initiated** referral link (in About/Settings) clears the June 2025 affiliate policy that killed undisclosed injectors (see round-1 avoid list).

**Fit:** the Chrome Web Store is itself a discovery channel with its own search SEO; a useful trading tool can accumulate installs and funnel to the referral. **Higher effort** (build + maintain + store review), so later-phase.

### 16. On-chain wallet-targeted ads (paid precision)
**Concept:** Programmatic crypto ad networks that target by **on-chain wallet behavior** — not cookies. Blockchain-Ads indexes 11M+ wallets / 82 chains / 69+ segments (used by Coinbase/Binance/OKX), **€100 min deposit**; HypeLab serves ads *inside* Web3 apps/wallets/DEXs; Addressable builds on-chain audience segments → programmatic. You can target wallets that have **traded perps or used competitor DEXs (dYdX, GMX)** — i.e., the high-volume audience directly. (https://chainaware.ai/blog/best-crypto-advertising-networks , https://www.blockchain-ads.com , https://coinpedia.org/information/the-10-best-crypto-ad-networks-find-top-crypto-advertising-platforms-in-2026)

**Fit:** the one *paid* tactic that can reach the profitable high-volume segment with precision. Still subject to the cold-CAC math from the first strategy doc (likely needs high-volume converters to break even) — treat as a measured data test (~€100–300), not a profit center.

---

## Consolidated master action list (T1–T16)

Grouped by role in the flywheel. **Bold** = recommended to start early.

**A. Core assets (build once, everything points here)**
- **T1 Free API-driven tools** (fee calc, funding monitor) — 🟢 build first
- T15 Compliance-safe companion extension — later phase
- T9 Dune dashboard — 🟢 high-value, builds authority

**B. Organic reach / SEO (compounding, free)**
- **T2 Programmatic SEO (live API data)**
- **T3 GEO / AI-search optimization**
- T13 JSON-LD schema — 🟢 quick win, do immediately (powers T3)
- T12 Content syndication (Medium/dev.to)
- T4 GitHub utility repos — 🟢 we're already here
- T10 TradingView PineScript/Ideas

**C. Distribution / amplification (multipliers)**
- **T6 Content atomization pipeline**
- T7 Reddit/Q&A AI-assisted engagement
- T11 Directory submission at scale — 🟢 right after a tool exists

**D. Authority / backlinks (lifts all SEO)**
- T14 Digital PR (journalist queries)
- (T9 Dune + T4 GitHub also build authority)

**E. Paid precision (measured tests only)**
- T16 On-chain wallet-targeted ads
- (Round-1 paid crypto networks: Bitmedia/Coinzilla)

**Avoid (round 1):** coupon-aggregator listings (attribution hijack), affiliate-injecting extensions (policy), "Hyperliquid"-trademark/typo/expired domains (legal + Google penalty), full-auto spam posting.

---

## Recommended sequencing (updated)

1. **Now — quick wins on the live site:** add **JSON-LD schema (T13)** + a basic **GEO baseline (T3)**. Minutes of work, biggest AI-search leverage.
2. **Build the fee calculator (T1)** → then **submit to directories (T11)** for instant backlinks/authority.
3. **Stand up distribution:** content-atomization pipeline (T6) + Reddit monitoring (T7); syndicate articles (T12).
4. **Authority plays:** publish a **Dune dashboard (T9)** + a **GitHub utility repo (T4)**.
5. **Scale SEO:** programmatic per-token pages (T2).
6. **Later / optional:** companion extension (T15), TradingView (T10), digital PR (T14), a small wallet-targeted ad test (T16).

---

## Sources (round 2)
- Dune: https://eco.com/support/en/articles/14800359-dune-analytics-build-custom-dashboards , https://www.21shares.com/en-eu/insights/dune-dashboards , https://ourcryptotalk.com/blog/top-10-dune-analytics-dashboards-for-navigating-web3-in-2026 , https://docs.dune.com/docs/use-cases/analytics
- TradingView/PineScript: https://www.tradingview.com/support/solutions/43000561836-what-is-pine-script , https://www.tradingview.com/scripts
- Directories: https://github.com/submitaitools/Free-AI-Directories , https://aiso.blog/best-directories-ai-tools , https://launchdirectories.com/directory-submission/ai-tool , https://submitsaas.com/blog/best-sites-for-directory-submission
- Wallet-targeted ads: https://chainaware.ai/blog/best-crypto-advertising-networks , https://www.blockchain-ads.com , https://coinpedia.org/information/the-10-best-crypto-ad-networks-find-top-crypto-advertising-platforms-in-2026
- Content syndication: https://resources.plainenglish.io/in-plain-english-vs-devto-hashnode-medium-and-hackernoon-best-platform-for-reach-in-2026 , https://dev.to/radiomorillo/how-blog-post-syndication-can-help-you-reach-more-readers-8ik , https://townhall.hashnode.com/why-you-should-republish-your-devblog-posts-and-how-to-do-it , https://www.digitalapplied.com/blog/content-amplification-strategy-2025
- Schema / structured data: https://www.gwcontent.com/blogs/news/structured-data-for-seo , https://www.digitalapplied.com/blog/schema-markup-after-march-2026-structured-data-strategies , https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide , https://www.seostrategy.co.uk/learn/faq-schema-deprecation-2026-rich-result-vs-schema , https://wearesuper.digital/blog/google-drops-faq-schema-does-it-still-matter-for-seo-in-2026
- Digital PR / HARO alternatives: https://searchcompendium.com/haro-alternatives , https://questiondb.io/learn/best-haro-alternatives-for-media-placements , https://www.buzzstream.com/blog/haro-alternatives , https://www.buzzstream.com/blog/journalist-requests , https://www.harolinkbuilding.com/blog/how-to-pitch-an-opportunity-on-qwoted
- Chrome extension policy: https://developer.chrome.com/docs/webstore/program-policies/policies , https://developer.chrome.com/docs/webstore/best-practices
