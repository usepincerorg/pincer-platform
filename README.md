<div align="center">
  <img src="public/icon-512.png" alt="Pincer" width="88" />
  <h1>Pincer web</h1>
  <p>Source for <a href="https://usepincer.org">usepincer.org</a> along with the three Pincer apps: Console, Portfolio and Explorer.</p>
</div>

Pincer lets a private company put its equity on Robinhood Chain. Every share class is issued as a Pincer Share Token, an ERC-20 with ERC-3643 style permissioned transfers and an ERC-8056 multiplier. Before any transfer settles, the class's configured rules are evaluated and a reason code comes back. All of the browser-facing code lives in this repo.

## What ships from here

| Path | Surface | Audience |
| :-- | :-- | :-- |
| `/` | Landing page | Anyone visiting usepincer.org |
| `/console` | Console | Issuers managing ownership, share classes and their rules, capital raises, Liquidity Windows, payouts, votes and company reports |
| `/portfolio` | Portfolio | Investors and employees viewing positions lot by lot, investing, selling during windows, collecting payouts, voting and reading records |
| `/explorer` | Explorer | The public, browsing supply, holders, rules, raises, windows, valuations and the event log for every company |

Console, Portfolio and Explorer share one layout inside the `src/app/(app)` route group. Persistence is handled by **Supabase** and authentication by **Privy**. A TypeScript port of the on-chain rules in `src/lib/pincer` decides the outcome of every action, and it runs identically in the browser and on the server.

## Running it locally

Requirements: Node 24 or newer (see `.nvmrc`), a Supabase project, and a Privy app.

1. Install packages with `npm install`.
2. Create `.env` from `.env.example` and supply your Privy and Supabase credentials. Comments in that file explain where each value comes from.
3. Open the Supabase SQL editor and execute [`supabase/schema.sql`](supabase/schema.sql). The script is idempotent, so running it twice does no harm.
4. Whitelist `http://localhost:3000` as an allowed origin in your Privy app settings.
5. Start the dev server with `npm run dev`, visit http://localhost:3000/console, sign in, and create a company with its first share class.

Signing in is not required for `/explorer`.

A fresh database is empty. To browse realistic activity right away, load [`supabase/seed.sql`](supabase/seed.sql), which contains three fictional companies; [`supabase/unseed.sql`](supabase/unseed.sql) takes them out again. Both files are produced by `npm run seed:generate`, which replays the app's own actions through the rule model so every balance and event in the seed is consistent.

### Scripts

| Script | What it does |
| :-- | :-- |
| `npm run dev` | Starts Next.js in development mode |
| `npm run build` | Creates an optimized production bundle |
| `npm run start` | Serves that bundle |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |
| `npm run check` | Lint, then typecheck, then build |
| `npm run seed:generate` | Rebuilds `supabase/seed.sql` and `supabase/unseed.sql` |

## Where things live

```
src/app/page.tsx           landing page
src/app/(app)/             Console, Portfolio, Explorer and account pages under a shared layout
src/app/api/pincer/        HTTP routes for loading state and submitting actions
src/components/            landing page sections, header, footer, shared visuals
src/components/app/        app shell plus the UI primitives every app page uses
src/lib/pincer/            domain types, rule engine, actions, client store, Privy sign-in
src/lib/pincer/server/     Supabase access, row conversion, Privy token verification
src/lib/site.ts            brand name, domain, external links, nav and docs paths
scripts/seed.ts            generator for the sample data
supabase/                  schema, seed and unseed SQL
public/                    logo and app icons
```

The UI is built with Tailwind CSS 4, and all design tokens (colors, type scale, component styles) sit in `src/app/globals.css`. Display headings use Instrument Serif, body text and numbers use Geist, and hashes, addresses and code use Geist Mono.

## Request lifecycle

**Loading state.** The app fetches `GET /api/pincer/state`, which reads every table and filters the result for the signed-in caller. On-chain facts are visible to all, but a holder's real name is revealed only to that holder and to companies they hold shares in or were invited by. Everyone else sees only a wallet.

**Submitting an action.** The browser applies the action optimistically so the screen updates instantly. It then calls `POST /api/pincer/action`. The server validates the Privy session and confirms the caller is allowed to act: Console actions need a company admin, while subscribing, placing orders, claiming, voting and transferring must come from the holder in question. Next it replays the action against the database using the same rules and commits every changed row atomically via the `apply_changes` function. When a concurrent write wins the race, the server reloads and retries. If the action is rejected, the browser undoes its optimistic change.

**Accounts.** A user's first sign-in creates a holder linked to their Privy wallets. Holders that a company pre-registered by wallet address are claimed by the person who signs in with that wallet. Whoever creates a company is recorded as its owner in `company_members`.

**Access control.** Every table has row level security enabled and no policies defined. As a result, only the server, using the service-role key, can touch the data.

## Parity with the contracts

The rule model is a faithful reimplementation, not a UI stub. Because it reaches the same verdicts as the contracts, a transfer that Portfolio previews as blocked would be blocked on-chain for the identical reason.

- **`engine.ts`** contains the checks. `canTransfer` follows the same order as `PincerEquityToken` and halts on the first failure. It starts with the pause flag (`TOKEN_PAUSED`), moves to the sender's balance (`INSUFFICIENT_UNLOCKED_BALANCE`, `FROZEN`), then identity on both sides (`SENDER_NOT_VERIFIED`, `RECIPIENT_NOT_VERIFIED`, `CLAIM_EXPIRED`), and finally each active rule in sequence: `REGION_BLOCKED`, `NOT_ELIGIBLE`, `HOLDING_PERIOD_ACTIVE`, `HOLDER_CAP_REACHED`, `WINDOW_CLOSED`, `ROFR_PENDING`, `MAX_OWNERSHIP_EXCEEDED`, `UNVESTED`. A clean pass yields `OK` along with a trace of each step.
- **Window clearing** happens in `previewClearing`, which mirrors `WindowMarket.clear`. It picks the one price that crosses the greatest volume, settles ties toward the most recent Reference Valuation, never goes below the reserve, fills by price priority with pro-rata allocation at the marginal price, and respects the window's volume cap. Fixed-price tenders allocate to sellers pro-rata. The resulting price is recorded as a Reference Valuation tagged `WINDOW_CLEARING`.
- **Positions** are stored as individual lots, and lockups and vesting draw down the oldest lots first, just like the contracts. `breakdown` divides a balance into frozen, unvested, locked, committed to orders, and freely transferable.
- **`actions.ts`** defines every operation: deploying companies and classes, subscribing, opening windows, placing and clearing orders, funding and claiming payouts, voting, anchoring documents, publishing valuations, configuring rules, pausing, and inviting or verifying holders. Each enforces the rules, mutates state, logs the event the matching contract would emit, and returns a receipt that names the corresponding contract function (for example `RaiseEscrow.subscribe`). Pages reach them through `store.tsx`.

## Related

- Solidity sources, tests and deployment scripts: [`contracts/README.md`](contracts/README.md)
- Product docs, synced to GitBook and served at [docs.usepincer.org](https://docs.usepincer.org): [`docs/`](docs/)
- Announcements: [@usepincer on X](https://x.com/usepincer)
