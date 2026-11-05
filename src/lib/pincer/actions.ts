import { addr, slug, txHash, uid } from "./ids";
import {
  balanceOf,
  breakdown,
  byId,
  canTransfer,
  entitlement,
  fmtShares,
  fmtUsd,
  latestValuation,
  MODULE_META,
  previewClearing,
  REASON_TEXT,
  tally,
} from "./engine";
import type {
  ChainEvent,
  ClaimTopic,
  Claim,
  Company,
  Disclosure,
  Distribution,
  Holder,
  LiquidityWindow,
  Lot,
  ModuleConfig,
  Offering,
  Proposal,
  Sandbox,
  ShareClass,
  Valuation,
} from "./types";

/*
 * Every state change in the app, as a pure function of the current state.
 * The browser runs an action first so the interface answers at once; the
 * server then runs the same action against the database, authorizes it for
 * the signed-in user, and writes the result. Each action checks the rules
 * the contracts enforce, writes the event the contract would emit, and
 * returns a receipt naming the call it maps to.
 */

export interface Receipt {
  id: string;
  ok: boolean;
  title: string;
  detail: string;
  /** The contract call this action maps to, e.g. RaiseEscrow.subscribe(offeringId, amount). */
  call?: string;
  tx?: `0x${string}`;
}

export type ReceiptDraft = Omit<Receipt, "id">;

export interface CompanyInput {
  name: string;
  legalName: string;
  sector: string;
  hq: string;
  founded: number;
  description: string;
  website: string;
}

export interface ShareClassInput {
  companyId: string;
  name: string;
  symbol: string;
  authorized: number;
  multiplier: number;
}

export interface InviteInput {
  companyId: string;
  name: string;
  kind: Holder["kind"];
  region: string;
  tier: number;
  employee: boolean;
  /** Links the holder to this wallet, so its owner sees the record when they sign in. */
  wallet?: string;
}

export interface IdentityInput {
  holderId: string;
  name: string;
  kind: Holder["kind"];
  region: string;
  tier: number;
}

export interface ActionArgs {
  createCompany: [input: CompanyInput];
  createShareClass: [input: ShareClassInput];

  subscribe: [offeringId: string, holderId: string, amount: number];
  createOffering: [o: Omit<Offering, "id" | "subscriptions" | "status" | "result">];
  closeOffering: [offeringId: string];
  cancelOffering: [offeringId: string];

  openWindow: [w: Omit<LiquidityWindow, "id" | "orders" | "status" | "result">];
  placeOrder: [windowId: string, holderId: string, side: "SELL" | "BUY", quantity: number, limitPrice: number];
  cancelOrder: [windowId: string, orderId: string];
  clearWindow: [windowId: string];
  cancelWindow: [windowId: string];

  fundDistribution: [d: Omit<Distribution, "id" | "claimed" | "fundedAt">];
  claimDistribution: [distributionId: string, holderId: string];

  createProposal: [p: Omit<Proposal, "id" | "votes" | "status" | "result">];
  castVote: [proposalId: string, holderId: string, option: number];
  finalizeProposal: [proposalId: string];

  anchorDocument: [d: Omit<Disclosure, "id" | "hash" | "anchoredAt">];
  publishValuation: [classId: string, price: number, source: Valuation["source"]];

  setModule: [classId: string, config: ModuleConfig, enabled: boolean];
  setPaused: [classId: string, paused: boolean];
  setRfq: [classId: string, enabled: boolean];
  inviteHolder: [input: InviteInput];
  verifyIdentity: [input: IdentityInput];
  issueShares: [classId: string, holderId: string, quantity: number];
  transfer: [classId: string, fromId: string, toId: string, quantity: number, venue: "rfq" | null];
}

export type ActionName = keyof ActionArgs;

export interface ActionContext {
  now: number;
  /** The block the action is recorded at. */
  block: number;
}

export interface Outcome {
  /** The new state, or null when the action was rejected. */
  next: Sandbox | null;
  receipt: ReceiptDraft;
}

const DAY = 86_400_000;
const YEAR = 365 * DAY;
export const VERIFIER = "Pincer Identity";

/** Removes `quantity` from a holder's lots, oldest first. */
function consumeLots(lots: Lot[], classId: string, holderId: string, quantity: number): Lot[] {
  let remaining = quantity;
  const next: Lot[] = [];
  const ordered = [...lots].sort((a, b) => a.acquiredAt - b.acquiredAt);
  for (const l of ordered) {
    if (remaining > 0 && l.classId === classId && l.holderId === holderId) {
      const take = Math.min(l.quantity, remaining);
      remaining -= take;
      if (l.quantity - take > 0) next.push({ ...l, quantity: l.quantity - take });
    } else next.push(l);
  }
  return next;
}

/** The claims Pincer Identity signs for a verified holder. */
export function standardClaims(now: number, region: string, tier: number, employeeOf?: string): Claim[] {
  const base = { verifier: VERIFIER, issuedAt: now, expiresAt: now + 2 * YEAR };
  return [
    { topic: "IDENTITY_VERIFIED", value: "Verified", ...base },
    { topic: "SCREENED", value: "Clear", ...base, expiresAt: now + YEAR },
    { topic: "REGION", value: region, ...base },
    ...(tier > 0 ? [{ topic: "INVESTOR_ELIGIBLE" as const, value: `Tier ${tier}`, ...base }] : []),
    ...(employeeOf ? [{ topic: "EMPLOYEE_OF" as const, value: employeeOf, ...base }] : []),
  ];
}

export function treasuryOf(s: Sandbox, companyId: string): Holder | undefined {
  return s.holders.find((h) => h.kind === "treasury" && h.companyId === companyId);
}

/** The company an action touches, used by the server to authorize it. */
export function companyOfAction<N extends ActionName>(s: Sandbox, name: N, args: ActionArgs[N]): string | undefined {
  const a = args as unknown[];
  const classCompany = (id: unknown) => byId(s.classes, String(id))?.companyId;
  switch (name) {
    case "createShareClass":
    case "createOffering":
    case "openWindow":
    case "fundDistribution":
    case "createProposal":
    case "anchorDocument":
    case "inviteHolder":
      return (a[0] as { companyId: string }).companyId;
    case "closeOffering":
    case "cancelOffering":
    case "subscribe":
      return byId(s.offerings, String(a[0]))?.companyId;
    case "clearWindow":
    case "cancelWindow":
    case "cancelOrder":
    case "placeOrder":
      return byId(s.windows, String(a[0]))?.companyId;
    case "claimDistribution":
      return byId(s.distributions, String(a[0]))?.companyId;
    case "castVote":
    case "finalizeProposal":
      return byId(s.proposals, String(a[0]))?.companyId;
    case "publishValuation":
    case "setModule":
    case "setPaused":
    case "setRfq":
    case "issueShares":
    case "transfer":
      return classCompany(a[0]);
    default:
      return undefined;
  }
}

export function runAction<N extends ActionName>(s: Sandbox, name: N, args: ActionArgs[N], ctx: ActionContext): Outcome {
  const handler = HANDLERS[name] as (h: Helpers, ...args: ActionArgs[N]) => Outcome;
  return handler(helpers(s, ctx), ...args);
}

interface Helpers {
  s: Sandbox;
  now: number;
  holderName: (id: string) => string;
  symbolOf: (classId: string) => string;
  hasClaims: (h: Holder | undefined, topics: ClaimTopic[]) => boolean;
  reject: (title: string, detail: string, call?: string) => Outcome;
  commit: (mutate: (d: Sandbox) => void, event: Omit<ChainEvent, "id" | "at" | "block" | "tx">, r: Omit<ReceiptDraft, "ok" | "tx">) => Outcome;
}

function helpers(s: Sandbox, ctx: ActionContext): Helpers {
  const now = ctx.now;
  return {
    s,
    now,
    holderName: (id) => byId(s.holders, id)?.name ?? id,
    symbolOf: (classId) => byId(s.classes, classId)?.symbol ?? "",
    hasClaims: (h, topics) => !!h && topics.every((topic) => h.claims.some((c) => c.topic === topic && c.expiresAt > now)),
    reject: (title, detail, call) => ({ next: null, receipt: { ok: false, title, detail, call } }),
    commit: (mutate, event, r) => {
      const d: Sandbox = structuredClone(s);
      mutate(d);
      d.block = Math.max(ctx.block, s.block + 1);
      const tx = txHash(`${event.name}:${d.block}:${now}:${Math.random()}`);
      d.events = [{ ...event, id: uid("evt"), at: now, block: d.block, tx }, ...d.events];
      return { next: d, receipt: { ...r, ok: true, tx } };
    },
  };
}

type Handlers = { [N in ActionName]: (h: Helpers, ...args: ActionArgs[N]) => Outcome };

const HANDLERS: Handlers = {
  /* Companies and share classes ------------------------------------ */

  createCompany: ({ s, now, reject, commit }, input) => {
    const call = "PincerDeployer.deployCompany(params)";
    const name = input.name.trim();
    if (!name) return reject("Missing name", "Give the company a name before deploying it.", call);
    if (s.companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) return reject("Name taken", `A company named ${name} is already on Pincer.`, call);
    const id = uid(`cmp_${slug(name)}`);
    const contracts: Record<string, `0x${string}`> = Object.fromEntries(
      ["HolderRegistry", "TransferPolicy", "RaiseEscrow", "WindowMarket", "QuoteSettlement", "PayoutVault", "ShareholderBallot", "DocumentAnchor", "ValuationFeed", "CompanyTimelock"].map((k) => [
        k,
        addr(`${id}:${k}`),
      ])
    );
    const company: Company = {
      id,
      name,
      legalName: input.legalName.trim() || name,
      sector: input.sector.trim(),
      hq: input.hq.trim(),
      founded: input.founded,
      description: input.description.trim(),
      website: input.website.trim(),
      treasury: addr(`${id}:treasury`),
      registrar: VERIFIER,
      contracts,
      onboardedAt: now,
    };
    const treasury: Holder = {
      id: uid("hld_trs"),
      name: `${name} treasury`,
      kind: "treasury",
      identity: addr(`${id}:treasury:identity`),
      wallets: [company.treasury],
      region: input.hq.trim().slice(0, 2).toUpperCase() || "US",
      tier: 3,
      joinedAt: now,
      companyId: id,
      claims: standardClaims(now, input.hq.trim().slice(0, 2).toUpperCase() || "US", 3),
    };
    return commit(
      (d) => {
        d.companies.push(company);
        d.holders.push(treasury);
      },
      { companyId: id, name: "CompanyDeployed", summary: `${name} contracts live on Pincer` },
      { title: "Company created", detail: `${name} has its identity registry, rule engine, vaults and timelock. Add a share class to start issuing.`, call }
    );
  },

  createShareClass: ({ s, reject, commit }, input) => {
    const call = "PincerDeployer.deployShareClass(name, symbol, authorized)";
    const symbol = input.symbol.trim().toUpperCase();
    if (!byId(s.companies, input.companyId)) return reject("Unknown company", "Pick a company first.", call);
    if (!input.name.trim() || !/^[A-Z0-9-]{2,12}$/.test(symbol)) return reject("Fix the class details", "Enter a name and a symbol made of 2 to 12 letters, digits or hyphens.", call);
    if (s.classes.some((c) => c.symbol === symbol)) return reject("Symbol taken", `${symbol} belongs to another share class.`, call);
    if (!(input.authorized > 0)) return reject("Missing authorized shares", "Authorized shares must be above zero.", call);
    const id = uid(`cls_${slug(symbol)}`);
    const cls: ShareClass = {
      id,
      companyId: input.companyId,
      name: input.name.trim(),
      symbol,
      token: addr(`${id}:token`),
      ruleEngine: addr(`${id}:rules`),
      authorized: Math.floor(input.authorized),
      multiplier: input.multiplier > 0 ? input.multiplier : 1,
      paused: false,
      modules: [],
      frozen: {},
      rfqEnabled: false,
    };
    return commit(
      (d) => {
        d.classes.push(cls);
      },
      { companyId: input.companyId, classId: id, name: "ShareClassDeployed", summary: `${symbol} created with ${fmtShares(cls.authorized)} authorized shares` },
      { title: "Share class created", detail: `${symbol} has no rule modules yet. Configure its transfer rules before issuing.`, call }
    );
  },

  /* Offerings -------------------------------------------------- */

  subscribe: ({ s, now, holderName, reject, commit }, offeringId, holderId, amount) => {
    const call = "RaiseEscrow.subscribe(offeringId, amount)";
    const o = byId(s.offerings, offeringId);
    if (!o) return reject("Unknown offering", "This offering isn't on Pincer anymore.", call);
    if (o.status !== "OPEN" || now < o.opensAt || now >= o.closesAt) return reject("Offering closed", "Subscriptions are accepted only while the offering is open.", call);
    const existing = o.subscriptions.filter((x) => x.holderId === holderId).reduce((a, x) => a + x.amount, 0);
    if (!(amount > 0) || existing + amount < o.minTicket) return reject("Below minimum ticket", `The smallest subscription here is ${fmtUsd(o.minTicket, 0)}.`, call);
    const h = byId(s.holders, holderId);
    const missing = o.requiredClaims.filter((topic) => !h?.claims.some((c) => c.topic === topic && c.expiresAt > now));
    if (missing.length) return reject("Missing claim", `To subscribe you still need: ${missing.join(", ")}.`, call);
    const check = canTransfer(s, o.classId, null, holderId, Math.floor((existing + amount) / o.pricePerShare), now);
    if (!check.ok) return reject(`Blocked: ${check.reason}`, REASON_TEXT[check.reason], call);
    return commit(
      (d) => {
        byId(d.offerings, offeringId)!.subscriptions.push({ holderId, amount, at: now });
      },
      { companyId: o.companyId, classId: o.classId, name: "Subscribed", summary: `${holderName(holderId)} committed ${fmtUsd(amount, 0)} to ${o.name}` },
      { title: "Funds in escrow", detail: `${fmtUsd(amount, 0)} sits in the RaiseEscrow until ${o.name} closes.`, call }
    );
  },

  createOffering: ({ now, reject, commit }, params) => {
    const call = "RaiseEscrow.createOffering(params)";
    if (!(params.pricePerShare > 0) || !(params.maxRaise > 0) || params.minRaise > params.maxRaise || params.closesAt <= params.opensAt)
      return reject("Fix the offering terms", "Price and maximum raise must be above zero, the minimum can't be larger than the maximum, and the offering must close after it opens.", call);
    const id = uid("off");
    const status = params.opensAt <= now ? "OPEN" : "SCHEDULED";
    return commit(
      (d) => {
        d.offerings.unshift({ ...params, id, subscriptions: [], status });
      },
      { companyId: params.companyId, classId: params.classId, name: "OfferingCreated", summary: `${params.name} priced at ${fmtUsd(params.pricePerShare)} per share` },
      { title: "Offering ready", detail: `${params.name} ${status === "OPEN" ? "is open for subscriptions" : "is scheduled to open"}.`, call }
    );
  },

  closeOffering: ({ s, now, symbolOf, reject, commit }, offeringId) => {
    const call = "RaiseEscrow.close(offeringId)";
    const o = byId(s.offerings, offeringId);
    if (!o || o.status === "CLOSED" || o.status === "FAILED") return reject("Offering already settled", "Nothing more can happen to this offering.", call);
    const raised = o.subscriptions.reduce((a, x) => a + x.amount, 0);
    if (raised < o.minRaise || raised === 0) {
      return commit(
        (d) => {
          const x = byId(d.offerings, offeringId)!;
          x.status = "FAILED";
          x.result = { raised, sharesIssued: 0, fee: 0, closedAt: now };
        },
        { companyId: o.companyId, classId: o.classId, name: "OfferingFailed", summary: `${o.name} fell short of its minimum and subscribers can be refunded` },
        { title: "Minimum missed", detail: `Only ${fmtUsd(raised, 0)} came in against a ${fmtUsd(o.minRaise, 0)} minimum. Every subscriber can withdraw in full.`, call }
      );
    }
    const target = Math.min(raised, o.maxRaise);
    const perHolder = new Map<string, number>();
    for (const x of o.subscriptions) perHolder.set(x.holderId, (perHolder.get(x.holderId) ?? 0) + x.amount);
    let accepted = 0;
    let shares = 0;
    const minted: Lot[] = [];
    for (const [holderId, subscribed] of perHolder) {
      const allocation = (subscribed * target) / raised;
      const qty = Math.floor(allocation / o.pricePerShare);
      if (qty > 0 && canTransfer(s, o.classId, null, holderId, qty, now).ok) {
        accepted += qty * o.pricePerShare;
        shares += qty;
        minted.push({ id: uid("lot"), holderId, classId: o.classId, quantity: qty, acquiredAt: now, source: "OFFERING" });
      }
    }
    const fee = Math.round(accepted * 0.015);
    return commit(
      (d) => {
        const x = byId(d.offerings, offeringId)!;
        x.status = "CLOSED";
        x.result = { raised: accepted, sharesIssued: shares, fee, closedAt: now };
        d.lots.push(...minted);
        d.valuations.push({ id: uid("val"), classId: o.classId, price: o.pricePerShare, source: "PRICED_ROUND", asOf: now, documentId: o.documentId });
      },
      { companyId: o.companyId, classId: o.classId, name: "OfferingClosed", summary: `${o.name} closed with ${fmtUsd(accepted, 0)} raised and ${fmtShares(shares)} ${symbolOf(o.classId)} issued` },
      {
        title: "Offering complete",
        detail: `${minted.length} subscribers received ${fmtShares(shares)} newly minted shares and ${fmtUsd(accepted - fee, 0)} went to the treasury. The offering price is now the Reference Valuation.`,
        call,
      }
    );
  },

  cancelOffering: ({ s, now, reject, commit }, offeringId) => {
    const call = "RaiseEscrow.cancelOffering(offeringId)";
    const o = byId(s.offerings, offeringId);
    if (!o || o.status === "CLOSED" || o.status === "FAILED") return reject("Offering already settled", "An offering can only be cancelled before it closes.", call);
    return commit(
      (d) => {
        const x = byId(d.offerings, offeringId)!;
        x.status = "FAILED";
        x.result = { raised: 0, sharesIssued: 0, fee: 0, closedAt: now };
      },
      { companyId: o.companyId, classId: o.classId, name: "OfferingFailed", summary: `${o.name} cancelled by the issuer` },
      { title: "Offering called off", detail: "Every subscriber can pull back their full subscription.", call }
    );
  },

  /* Liquidity Windows ----------------------------------------- */

  openWindow: ({ now, symbolOf, reject, commit }, params) => {
    const call = "WindowMarket.openWindow(params)";
    if (params.closesAt <= params.opensAt || !(params.maxVolume > 0)) return reject("Fix the window terms", "The window must close after it opens, and maximum volume must be above zero.", call);
    if (params.mode === "TENDER" && !(params.tenderPrice && params.tenderPrice > 0)) return reject("Missing tender price", "A tender uses one fixed price per share. Enter it.", call);
    const id = uid("win");
    const status = params.opensAt <= now ? "OPEN" : "SCHEDULED";
    return commit(
      (d) => {
        d.windows.unshift({ ...params, id, orders: [], status });
      },
      { companyId: params.companyId, classId: params.classId, name: "WindowOpened", summary: `${params.name} for ${symbolOf(params.classId)} ${status === "OPEN" ? "is open" : "is scheduled"}` },
      { title: status === "OPEN" ? "Window now open" : "Window on the calendar", detail: `Orders for ${params.name} are accepted until ${new Date(params.closesAt).toLocaleString("en-US")}.`, call }
    );
  },

  placeOrder: ({ s, now, symbolOf, hasClaims, reject, commit }, windowId, holderId, side, quantity, limitPrice) => {
    const call = "WindowMarket.placeOrder(windowId, side, quantity, limitPrice)";
    const w = byId(s.windows, windowId);
    if (!w || w.status !== "OPEN" || now < w.opensAt || now >= w.closesAt) return reject("Window closed", "Orders are accepted only while the window is open.", call);
    if (!(quantity > 0) || (w.mode === "AUCTION" && !(limitPrice > 0))) return reject("Fix the order", "Enter a quantity and a limit price above zero.", call);
    const h = byId(s.holders, holderId);
    if (side === "SELL") {
      if (w.mode === "TENDER") limitPrice = w.tenderPrice ?? 0;
      if (!hasClaims(h, w.sellerClaims)) return reject("Can't sell here", `Sellers in this window need: ${w.sellerClaims.join(", ")}.`, call);
      const b = breakdown(s, w.classId, holderId, now);
      if (quantity > b.unlocked) return reject("Not enough unlocked shares", `You can offer at most ${fmtShares(b.unlocked)} shares right now.`, call);
      const already = w.orders.filter((o) => o.holderId === holderId && o.side === "SELL" && !o.cancelled).reduce((a, o) => a + o.quantity, 0);
      if (already + quantity > w.perSellerCap) return reject("Seller limit exceeded", `Each seller can offer up to ${fmtShares(w.perSellerCap)} shares in this window.`, call);
    } else {
      if (w.mode === "TENDER") return reject("No bids in a tender", "In a tender, holders sell and only the company or its designee buys.", call);
      if (!hasClaims(h, w.buyerClaims)) return reject("Can't buy here", `Buyers in this window need: ${w.buyerClaims.join(", ")}.`, call);
      const check = canTransfer(s, w.classId, null, holderId, quantity, now, "window");
      if (!check.ok) return reject(`Blocked: ${check.reason}`, REASON_TEXT[check.reason], call);
    }
    const sym = symbolOf(w.classId);
    return commit(
      (d) => {
        byId(d.windows, windowId)!.orders.push({ id: uid("ord"), holderId, side, quantity, limitPrice, placedAt: now });
      },
      {
        companyId: w.companyId,
        classId: w.classId,
        name: "OrderPlaced",
        summary: `${side === "SELL" ? "Offer to sell" : "Bid to buy"} ${fmtShares(quantity)} ${sym} at ${side === "SELL" ? "no less than" : "no more than"} ${fmtUsd(limitPrice)}`,
      },
      {
        title: side === "SELL" ? "Shares set aside for sale" : "Bid in escrow",
        detail:
          side === "SELL"
            ? `${fmtShares(quantity)} ${sym} stay locked in the window until it clears.`
            : `${fmtUsd(quantity * limitPrice)} stays locked in the window until it clears. You pay the clearing price, never more than your limit.`,
        call,
      }
    );
  },

  cancelOrder: ({ s, reject, commit }, windowId, orderId) => {
    const call = "WindowMarket.cancelOrder(windowId, orderId)";
    const w = byId(s.windows, windowId);
    if (!w || w.status !== "OPEN") return reject("Window closed", "Orders can only be withdrawn while the window is open.", call);
    if (!byId(w.orders, orderId)) return reject("Unknown order", "This order isn't in the window anymore.", call);
    return commit(
      (d) => {
        const o = byId(byId(d.windows, windowId)!.orders, orderId);
        if (o) o.cancelled = true;
      },
      { companyId: w.companyId, classId: w.classId, name: "OrderCancelled", summary: `Order withdrawn from ${w.name}` },
      { title: "Order withdrawn", detail: "Anything this order locked has been released.", call }
    );
  },

  clearWindow: ({ s, now, symbolOf, reject, commit }, windowId) => {
    const call = "WindowMarket.clear(windowId)";
    const w = byId(s.windows, windowId);
    if (!w || w.status === "CLEARED" || w.status === "CANCELLED") return reject("Window already settled", "This window has finished settling.", call);
    const treasury = treasuryOf(s, w.companyId);
    if (w.mode === "TENDER" && !treasury) return reject("Missing treasury", "A tender needs a company treasury to buy the shares.", call);
    const preview = previewClearing(w, latestValuation(s, w.classId)?.price);
    if (!preview) {
      return commit(
        (d) => {
          const x = byId(d.windows, windowId)!;
          x.status = "CLEARED";
          x.result = { clearingPrice: 0, volume: 0, clearedAt: now };
        },
        { companyId: w.companyId, classId: w.classId, name: "WindowCleared", summary: `${w.name} closed with no matching orders` },
        { title: "Nothing matched", detail: "No bid met an ask, so every order has been released.", call }
      );
    }
    const sym = symbolOf(w.classId);
    return commit(
      (d) => {
        const x = byId(d.windows, windowId)!;
        let lots = d.lots;
        const buyers: Lot[] = [];
        for (const o of x.orders) {
          const fill = preview.fills[o.id] ?? 0;
          o.filled = fill;
          if (!fill) continue;
          if (o.side === "SELL") lots = consumeLots(lots, x.classId, o.holderId, fill);
          else buyers.push({ id: uid("lot"), holderId: o.holderId, classId: x.classId, quantity: fill, acquiredAt: now, source: "WINDOW" });
        }
        if (x.mode === "TENDER" && treasury) {
          buyers.push({ id: uid("lot"), holderId: treasury.id, classId: x.classId, quantity: preview.volume, acquiredAt: now, source: "WINDOW" });
        }
        d.lots = [...lots, ...buyers];
        x.status = "CLEARED";
        x.result = { clearingPrice: preview.price, volume: preview.volume, clearedAt: now };
        d.valuations.push({ id: uid("val"), classId: x.classId, price: preview.price, source: "WINDOW_CLEARING", asOf: now });
      },
      { companyId: w.companyId, classId: w.classId, name: "WindowCleared", summary: `${fmtShares(preview.volume)} ${sym} settled in ${w.name} at ${fmtUsd(preview.price)}` },
      {
        title: `Cleared at ${fmtUsd(preview.price)}`,
        detail: `${fmtShares(preview.volume)} ${sym} changed hands between ${preview.sellers} sellers and ${preview.buyers} buyers in a single transaction. The Reference Valuation now uses this price.`,
        call,
      }
    );
  },

  cancelWindow: ({ s, reject, commit }, windowId) => {
    const call = "WindowMarket.cancelWindow(windowId)";
    const w = byId(s.windows, windowId);
    if (!w || w.status === "CLEARED" || w.status === "CANCELLED") return reject("Window already settled", "This window has finished settling.", call);
    return commit(
      (d) => {
        byId(d.windows, windowId)!.status = "CANCELLED";
      },
      { companyId: w.companyId, classId: w.classId, name: "WindowCancelled", summary: `${w.name} called off` },
      { title: "Window called off", detail: "Every order has been released back to its owner.", call }
    );
  },

  /* Distributions ---------------------------------------------- */

  fundDistribution: ({ now, symbolOf, reject, commit }, params) => {
    const call = "PayoutVault.fund(shareToken, asset, amount, recordBlock, claimDeadline, excluded)";
    if (!(params.amount > 0)) return reject("Missing amount", "The distribution amount must be above zero.", call);
    if (params.claimDeadline && params.claimDeadline - params.recordAt < YEAR)
      return reject("Deadline too soon", "The claim deadline has to be at least 12 months after the record date.", call);
    return commit(
      (d) => {
        d.distributions.unshift({ ...params, id: uid("dst"), claimed: {}, fundedAt: now });
      },
      { companyId: params.companyId, classId: params.classId, name: "DistributionFunded", summary: `${fmtUsd(params.amount, 0)} set aside for ${symbolOf(params.classId)} holders` },
      { title: "Distribution ready", detail: `Holders on the record date can now claim their share of ${fmtUsd(params.amount, 0)}.`, call }
    );
  },

  claimDistribution: ({ s, holderName, reject, commit }, distributionId, holderId) => {
    const call = "PayoutVault.claim(distributionId)";
    const d0 = byId(s.distributions, distributionId);
    if (!d0) return reject("Unknown distribution", "This distribution isn't on Pincer anymore.", call);
    const e = entitlement(s, d0, holderId);
    if (e.claimable <= 0) return reject("Nothing owed", "You either had no shares on the record date or have already been paid.", call);
    return commit(
      (d) => {
        const x = byId(d.distributions, distributionId)!;
        x.claimed[holderId] = (x.claimed[holderId] ?? 0) + e.claimable;
      },
      { companyId: d0.companyId, classId: d0.classId, name: "DistributionClaimed", summary: `${holderName(holderId)} collected ${fmtUsd(e.claimable)}` },
      { title: "Payout collected", detail: `${fmtUsd(e.claimable)} is now in your wallet.`, call }
    );
  },

  /* ShareholderBallot ------------------------------------------------- */

  createProposal: ({ reject, commit }, params) => {
    const call = "ShareholderBallot.propose(params)";
    if (!params.title.trim() || params.options.length < 2) return reject("Proposal incomplete", "A proposal needs a title and at least two options.", call);
    return commit(
      (d) => {
        d.proposals.unshift({ ...params, id: uid("prp"), votes: {}, status: "ACTIVE" });
      },
      { companyId: params.companyId, classId: params.classIds[0], name: "ProposalCreated", summary: `Vote opened on ${params.title}` },
      { title: "Voting started", detail: "Weights are locked at the snapshot. Holders vote from Portfolio until the deadline.", call }
    );
  },

  castVote: ({ s, now, holderName, reject, commit }, proposalId, holderId, option) => {
    const call = "ShareholderBallot.castVote(proposalId, support)";
    const p = byId(s.proposals, proposalId);
    if (!p || p.status !== "ACTIVE" || now >= p.endsAt) return reject("Voting has ended", "This proposal no longer accepts votes.", call);
    if (!Number.isInteger(option) || option < 0 || option >= p.options.length) return reject("Pick an option", "Your vote must be one of the proposal's options.", call);
    if (p.votes[holderId] !== undefined) return reject("Vote already cast", "Each holder votes once per proposal.", call);
    const weight = p.classIds.reduce((sum, c) => sum + balanceOf(s, c, holderId), 0);
    if (weight <= 0) return reject("No votes to cast", "You held no shares in these classes at the snapshot.", call);
    return commit(
      (d) => {
        byId(d.proposals, proposalId)!.votes[holderId] = option;
      },
      { companyId: p.companyId, classId: p.classIds[0], name: "VoteCast", summary: `${holderName(holderId)} voted ${p.options[option]} on "${p.title}"` },
      { title: "Vote counted", detail: `Your vote for "${p.options[option]}" is now on-chain.`, call }
    );
  },

  finalizeProposal: ({ s, reject, commit }, proposalId) => {
    const call = "ShareholderBallot.finalize(proposalId)";
    const p = byId(s.proposals, proposalId);
    if (!p || p.status !== "ACTIVE") return reject("Already finalized", "This proposal has a final result.", call);
    const tl = tally(s, p);
    const result = tl.quorumMet ? tl.weights.indexOf(Math.max(...tl.weights)) : 255;
    return commit(
      (d) => {
        const x = byId(d.proposals, proposalId)!;
        x.status = "FINALIZED";
        x.result = result;
      },
      { companyId: p.companyId, classId: p.classIds[0], name: "ProposalFinalized", summary: `"${p.title}" closed: ${result === 255 ? "no quorum" : p.options[result]}` },
      { title: "Result final", detail: result === 255 ? "Not enough votes were cast to reach quorum." : `"${p.options[result]}" won.`, call }
    );
  },

  /* Disclosures and valuations ---------------------------------- */

  anchorDocument: ({ now, reject, commit }, params) => {
    const call = "DocumentAnchor.anchor(kind, hash, uri)";
    if (!params.title.trim()) return reject("Missing title", "Give the document a title before anchoring it.", call);
    const hash = txHash(`doc:${params.title}:${now}:${Math.random()}`);
    return commit(
      (d) => {
        d.documents.unshift({ ...params, id: uid("doc"), hash, anchoredAt: now });
      },
      { companyId: params.companyId, name: "DocumentAnchored", summary: `${params.title} recorded on-chain` },
      { title: "Document recorded", detail: `Its hash is on-chain, so anyone holding a copy can prove it is unaltered.`, call }
    );
  },

  publishValuation: ({ s, now, reject, commit }, classId, price, source) => {
    const call = "ValuationFeed.publish(price, source, asOf, documentHash)";
    const cls = byId(s.classes, classId);
    if (!cls || !(price > 0)) return reject("Missing price", "The valuation price must be above zero.", call);
    if (cls.paused) return reject("Class paused", "You can't publish a valuation while this share class is paused.", call);
    return commit(
      (d) => {
        d.valuations.push({ id: uid("val"), classId, price, source, asOf: now });
      },
      { companyId: cls.companyId, classId, name: "ValuationPublished", summary: `New ${cls.symbol} Reference Valuation: ${fmtUsd(price)}` },
      { title: "Valuation live", detail: `${cls.symbol} now reads ${fmtUsd(price)} on the ValuationFeed.`, call }
    );
  },

  /* Share class administration ---------------------------------- */

  setModule: ({ s, reject, commit }, classId, config, enabled) => {
    const call = `TransferPolicy.${enabled ? "configureModule" : "removeModule"}(module, config)`;
    const cls = byId(s.classes, classId);
    if (!cls) return reject("Unknown share class", "", call);
    const meta = MODULE_META[config.id];
    if (!meta) return reject("Unsupported module", "This rule module isn't available.", call);
    return commit(
      (d) => {
        const c = byId(d.classes, classId)!;
        const existing = c.modules.find((m) => m.config.id === config.id);
        if (existing) {
          existing.config = config;
          existing.enabled = enabled;
        } else c.modules.push({ config, enabled });
      },
      { companyId: cls.companyId, classId, name: enabled ? "ModuleConfigured" : "ModuleRemoved", summary: `${meta.contract} ${enabled ? "set up" : "turned off"} on ${cls.symbol}` },
      { title: `${meta.name} ${enabled ? "updated" : "turned off"}`, detail: "Takes effect through the CompanyTimelock after the module delay.", call }
    );
  },

  setPaused: ({ s, reject, commit }, classId, paused) => {
    const call = paused ? "PincerEquityToken.pause(reason)" : "PincerEquityToken.unpause()";
    const cls = byId(s.classes, classId);
    if (!cls) return reject("Unknown share class", "", call);
    return commit(
      (d) => {
        byId(d.classes, classId)!.paused = paused;
      },
      { companyId: cls.companyId, classId, name: paused ? "Paused" : "Unpaused", summary: `${cls.symbol} transfers ${paused ? "paused" : "resumed"}` },
      { title: paused ? "Transfers on hold" : "Transfers back on", detail: paused ? `Every ${cls.symbol} transfer now fails with TOKEN_PAUSED.` : `${cls.symbol} can move again.`, call }
    );
  },

  setRfq: ({ s, reject, commit }, classId, enabled) => {
    const call = "QuoteSettlement.setEnabled(shareToken, enabled)";
    const cls = byId(s.classes, classId);
    if (!cls) return reject("Unknown share class", "", call);
    return commit(
      (d) => {
        byId(d.classes, classId)!.rfqEnabled = enabled;
      },
      { companyId: cls.companyId, classId, name: "ShareClassEnabled", summary: `RFQ ${enabled ? "turned on" : "turned off"} for ${cls.symbol}` },
      { title: `${enabled ? "RFQ on" : "RFQ off"}`, detail: enabled ? "Eligible holders can now settle signed quotes with each other." : "Signed quotes no longer fill for this class.", call }
    );
  },

  inviteHolder: ({ s, now, reject, commit }, { companyId, name, kind, region, tier, employee, wallet }) => {
    const call = "HolderRegistry.registerIdentity(wallet, identity) + addClaim(...)";
    if (!name.trim()) return reject("Missing name", "Every holder on the cap table needs a name.", call);
    if (!byId(s.companies, companyId)) return reject("Unknown company", "Pick a company first.", call);
    const linked = wallet?.trim().toLowerCase();
    if (linked && !/^0x[0-9a-f]{40}$/.test(linked)) return reject("Invalid wallet", "A wallet address is 0x followed by 40 hexadecimal characters.", call);
    if (linked && s.holders.some((h) => h.wallets.some((w) => w.toLowerCase() === linked)))
      return reject("Wallet in use", "That wallet already belongs to an identity on the registry. Issue to that holder instead.", call);
    const id = uid("hld");
    const h: Holder = {
      id,
      name: name.trim(),
      kind,
      identity: addr(`identity:${id}`),
      wallets: [(linked ?? addr(`wallet:${id}`)) as `0x${string}`],
      region,
      tier,
      joinedAt: now,
      companyId,
      claims: standardClaims(now, region, tier, employee ? companyId : undefined),
    };
    return commit(
      (d) => {
        d.holders.push(h);
      },
      { companyId, name: "IdentityRegistered", summary: `${h.name} added to the registry as verified` },
      {
        title: "Holder added",
        detail: linked
          ? `${h.name} now has a registry identity with ${h.claims.length} claims, linked to ${linked.slice(0, 6)}…${linked.slice(-4)}.`
          : `${h.name} now has a registry identity with ${h.claims.length} claims and an embedded wallet.`,
        call,
      }
    );
  },

  verifyIdentity: ({ s, now, reject, commit }, { holderId, name, kind, region, tier }) => {
    const call = "HolderRegistry.addClaim(identity, topic, value, expiry)";
    const h = byId(s.holders, holderId);
    if (!h) return reject("Identity unavailable", "Sign in again to load your identity.", call);
    if (!name.trim()) return reject("Missing name", "Your name appears on the cap table of every company you hold.", call);
    if (!/^[A-Z]{2}$/.test(region)) return reject("Missing region", "Pick the country you live in.", call);
    if (kind === "treasury") return reject("Invalid holder type", "Treasury identities are reserved for companies.", call);
    const employeeClaims = h.claims.filter((c) => c.topic === "EMPLOYEE_OF");
    return commit(
      (d) => {
        const x = byId(d.holders, holderId)!;
        x.name = name.trim();
        x.kind = kind;
        x.region = region;
        x.tier = Math.max(0, Math.min(3, Math.floor(tier)));
        x.claims = [...standardClaims(now, region, x.tier), ...employeeClaims];
      },
      { name: "ClaimAdded", companyId: h.companyId ?? "", summary: `${h.identity.slice(0, 10)}… verified in region ${region}` },
      { title: "You're verified", detail: "Pincer Identity has signed your claims. Share classes read them every time shares move.", call }
    );
  },

  issueShares: ({ s, now, holderName, reject, commit }, classId, holderId, quantity) => {
    const call = "PincerEquityToken.mint(to, amount, reference)";
    const cls = byId(s.classes, classId);
    if (!cls || !(quantity > 0)) return reject("Missing quantity", "Issue at least one share.", call);
    const issued = s.lots.filter((l) => l.classId === classId).reduce((a, l) => a + l.quantity, 0);
    if (issued + quantity > cls.authorized) return reject("Exceeds authorized shares", `Only ${fmtShares(cls.authorized - issued)} more ${cls.symbol} shares can be issued.`, call);
    const check = canTransfer(s, classId, null, holderId, quantity, now);
    if (!check.ok) return reject(`Blocked: ${check.reason}`, REASON_TEXT[check.reason], call);
    return commit(
      (d) => {
        d.lots.push({ id: uid("lot"), holderId, classId, quantity, acquiredAt: now, source: "ISSUANCE" });
      },
      { companyId: cls.companyId, classId, name: "SharesIssued", summary: `${holderName(holderId)} received ${fmtShares(quantity)} new ${cls.symbol}` },
      { title: "Shares minted", detail: `${fmtShares(quantity)} ${cls.symbol} minted and recorded on the cap table.`, call }
    );
  },

  transfer: ({ s, now, holderName, reject, commit }, classId, fromId, toId, quantity, venue) => {
    const call = venue === "rfq" ? "QuoteSettlement.fill(quote, signature, quantity)" : "PincerEquityToken.transfer(to, amount)";
    const cls = byId(s.classes, classId);
    if (!cls || !(quantity > 0)) return reject("Missing quantity", "Transfer at least one share.", call);
    if (venue === "rfq" && !cls.rfqEnabled) return reject("RFQ off", `The issuer hasn't turned on RFQ for ${cls.symbol}.`, call);
    const check = canTransfer(s, classId, fromId, toId, quantity, now, venue);
    if (!check.ok) return reject(`Blocked: ${check.reason}`, REASON_TEXT[check.reason], call);
    return commit(
      (d) => {
        d.lots = consumeLots(d.lots, classId, fromId, quantity);
        d.lots.push({ id: uid("lot"), holderId: toId, classId, quantity, acquiredAt: now, source: venue === "rfq" ? "RFQ" : "TRANSFER" });
      },
      { companyId: cls.companyId, classId, name: venue === "rfq" ? "QuoteFilled" : "Transfer", summary: `${fmtShares(quantity)} ${cls.symbol} went from ${holderName(fromId)} to ${holderName(toId)}` },
      { title: "Transfer complete", detail: `${fmtShares(quantity)} ${cls.symbol} moved after passing every class rule.`, call }
    );
  },
};

/** An empty state, before anything has loaded. */
export function emptySandbox(network: Sandbox["network"]): Sandbox {
  return { network, companies: [], classes: [], holders: [], lots: [], grants: [], offerings: [], windows: [], distributions: [], proposals: [], documents: [], valuations: [], events: [], block: 0 };
}
