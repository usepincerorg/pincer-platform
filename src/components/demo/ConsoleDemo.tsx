"use client";

import { useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  CircleDollarSign,
  FileText,
  Gavel,
  Layers,
  LayoutDashboard,
  Pencil,
  Plus,
  Repeat,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import StepWindow, { Cursor, ease, glide, held, typed, type Step } from "./StepWindow";

/*
 * The Console's main flow, drawn from t: an issuer sets a transfer rule,
 * raises into escrow, watches a transfer get refused for the reason the rule
 * gives, and clears a Liquidity Window. Every label, receipt and reason code
 * is the app's own, copied from its source. The company and its figures are
 * the homepage's sample: Larkway Labs, class LKW-B, Reference Valuation 22.50,
 * and the same order book the Liquidity section works through.
 *
 * Layout is in fixed stage pixels (1200 × 750), so the pointer's targets are
 * known numbers; they were checked against screenshots.
 */

/* ------------------------------------------------------------------ */
/* Shell: sidebar, top bar, page header, figures, receipt              */
/* ------------------------------------------------------------------ */

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Ownership" },
  { icon: Layers, label: "Share classes" },
  { icon: CircleDollarSign, label: "Capital raises" },
  { icon: Repeat, label: "Liquidity Windows" },
  { icon: Gavel, label: "Payouts and voting" },
  { icon: FileText, label: "Reports and valuations" },
] as const;

type Page = (typeof NAV)[number]["label"];

/* Main column, in stage pixels */
const MAIN_L = 244;
const MAIN_R = 1186;
const PANEL_TOP = 290;

function Shell({ page, children }: { page: Page; children: React.ReactNode }) {
  return (
    <>
      {/* Sidebar */}
      <aside className="glass glass-strong absolute flex flex-col" style={{ left: 14, top: 14, bottom: 14, width: 214, borderRadius: 18 }}>
        <div className="flex items-center gap-2 px-5 pb-4 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="" width={22} height={22} />
          <span className="text-[16px] font-semibold tracking-[-0.02em] text-navy">Pincer</span>
        </div>
        <div className="mx-3 grid grid-cols-3 gap-1 rounded-full border border-line-soft bg-haze p-1 text-[11.5px] font-medium">
          <span className="rounded-full bg-navy py-1 text-center text-canvas">Console</span>
          <span className="py-1 text-center text-tide">Portfolio</span>
          <span className="py-1 text-center text-tide">Explorer</span>
        </div>
        <ul className="mt-4 space-y-0.5 px-3">
          {NAV.map((n) => {
            const on = n.label === page;
            return (
              <li key={n.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium ${on ? "bg-haze-2 text-navy" : "text-tide"}`}>
                <n.icon className={`size-[15px] ${on ? "text-navy" : "text-fog"}`} aria-hidden="true" />
                {n.label}
              </li>
            );
          })}
        </ul>
        <div className="mx-3 mb-3 mt-auto flex items-center gap-2.5 rounded-xl border border-line bg-haze px-3 py-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-line bg-haze-2 text-[11px] font-semibold">L</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold">Larkway Labs</span>
            <span className="block text-[11px] text-fog">Company admin</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-fog" aria-hidden="true" />
        </div>
      </aside>

      {/* Top bar */}
      <div className="glass glass-pill absolute flex items-center pl-5 pr-2" style={{ left: MAIN_L, right: 14, top: 14, height: 40 }}>
        <div className="flex w-full items-center gap-2 text-[12px]">
          <span className="text-fog">Console</span>
          <span className="text-pale">/</span>
          <span className="font-medium">{page}</span>
        </div>
      </div>

      {children}
    </>
  );
}

function Header({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="absolute flex items-end justify-between gap-8" style={{ left: MAIN_L + 4, right: 1200 - MAIN_R, top: 66 }}>
      <div className="min-w-0">
        <h2 className="display text-[30px] leading-[1.05]">{title}</h2>
        <p className="mt-2 max-w-[600px] text-[12px] leading-relaxed text-tide">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Figures({ items }: { items: { label: string; value: string; hint: string; tone?: string }[] }) {
  return (
    <div className="glass absolute grid grid-cols-4" style={{ left: MAIN_L, right: 1200 - MAIN_R, top: 162, height: 112, borderRadius: 16 }}>
      {items.map((f, i) => (
        <div key={f.label} className={`px-5 py-4 ${i < items.length - 1 ? "border-r border-line-soft" : ""}`}>
          <div className="text-[11px] text-fog">{f.label}</div>
          <div className={`font-display mt-1.5 text-[21px] leading-none ${f.tone ?? "text-navy"}`}>{f.value}</div>
          <div className="mt-1.5 line-clamp-2 text-[10.5px] leading-snug text-fog">{f.hint}</div>
        </div>
      ))}
    </div>
  );
}

/** A panel with the app's header bar, at fixed stage coordinates. */
function Panel({ left, width, top = PANEL_TOP, bottom = 14, title, description, action, children }: { left: number; width: number; top?: number; bottom?: number; title: React.ReactNode; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card absolute overflow-hidden" style={{ left, width, top, bottom }}>
      <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="text-[14px] leading-snug tracking-[-0.012em]">{title}</h3>
          {description && <p className="mt-0.5 text-[11.5px] leading-relaxed text-fog">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A transaction receipt, as the app stacks them in the corner. `p` is how far it has come in (0 to 1). */
function Receipt({ p, title, detail, call, tx }: { p: number; title: string; detail: string; call: string; tx: string }) {
  if (p <= 0) return null;
  return (
    <div
      className="card card-tint absolute z-20 bg-popover/95 p-3.5"
      style={{ right: 26, bottom: 26, width: 330, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, boxShadow: "0 24px 50px -24px rgb(0 0 0 / 0.9)" }}
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-deep" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold">{title}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-tide">{detail}</p>
          <p className="mt-2 truncate font-mono text-[10px] text-fog">{call}</p>
          <p className="mt-0.5 font-mono text-[10px] text-fog">tx {tx} · Robinhood Chain</p>
        </div>
        <X className="size-3.5 text-fog" aria-hidden="true" />
      </div>
    </div>
  );
}

/** The app's on/off switch; `p` slides it from off (0) to on (1). */
function Toggle({ p }: { p: number }) {
  return (
    <span className={`relative block h-6 w-10 shrink-0 rounded-full transition-colors ${p > 0.5 ? "bg-lagoon" : "bg-haze-2"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full shadow-sm ${p > 0.5 ? "bg-canvas" : "bg-tide"}`} style={{ left: 2 + 16 * p }} />
    </span>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-medium">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[10.5px] text-fog">{hint}</div>}
    </div>
  );
}

/** An input or select box, with an optional caret while focused and a suffix. */
function Box({ value, placeholder, focus, caret, suffix, select, mono }: { value: string; placeholder?: string; focus?: boolean; caret?: boolean; suffix?: string; select?: boolean; mono?: boolean }) {
  return (
    <div
      className={`input flex h-10 items-center gap-2 text-[12.5px] ${mono ? "readout" : ""}`}
      style={focus ? { borderColor: "var(--color-lagoon-muted)", boxShadow: "0 0 0 3px var(--color-lagoon-soft)" } : undefined}
    >
      <span className={`min-w-0 flex-1 truncate ${value ? "text-navy" : "text-fog"}`}>
        {value || placeholder}
        {caret && <span className="ml-px inline-block h-[14px] w-px translate-y-[2px] bg-navy" />}
      </span>
      {suffix && <span className="rounded-md bg-haze-2 px-1.5 py-0.5 text-[10px] font-semibold text-tide">{suffix}</span>}
      {select && <ChevronDown className="size-3.5 text-fog" aria-hidden="true" />}
    </div>
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/* 1. Set a rule: turn on the holding period for LKW-B                 */
/* ------------------------------------------------------------------ */

const R_ARRIVE = 1.5;
const R_CLICK = 1.95;
const R_RECEIPT = 2.25;
const R_AWAY = 3.1;

/* The fifth rule list row sits at these coordinates; see ROW_* below. */
const ROW_TOP = PANEL_TOP + 56 + 16 + 30 + 1;
const ROW_H = 62;
const TOGGLE_X = MAIN_R - 20 - 16 - 20;

const RULES = [
  { name: "Region filter", contract: "JurisdictionRule", reason: "REGION_BLOCKED", on: "Recipients in CU, IR, KP, RU, SY are refused; every other region is fine." },
  { name: "Eligibility tier", contract: "InvestorTierRule", reason: "NOT_ELIGIBLE", on: "Every recipient needs tier 2 or higher, except company employees." },
  { name: "Holding period", contract: "LockupRule", reason: "HOLDING_PERIOD_ACTIVE", on: "Each lot is locked for 365 days after it is acquired.", off: "Off. Lock every lot for a fixed time after it is acquired." },
  { name: "Holder limit", contract: "HolderLimitRule", reason: "HOLDER_CAP_REACHED", on: "No more than 2,000 distinct holders may own the class." },
  { name: "Transfer schedule", contract: "TradingWindowRule", reason: "WINDOW_CLOSED", off: "Not added. Only let transfers settle in scheduled windows." },
] as const;

function SetRule({ t }: { t: number }) {
  const flip = ease(t, R_CLICK + 0.05, R_CLICK + 0.3);
  const on = t >= R_CLICK + 0.05;
  const target = { x: TOGGLE_X, y: ROW_TOP + ROW_H * 2 + ROW_H / 2 };
  const c = glide(t, [[0, 0, 760, 640], [0.4, R_ARRIVE, target.x + 2, target.y + 2]], [R_CLICK]);
  return (
    <Shell page="Share classes">
      <Header
        title="Share classes"
        description="Every class is its own Pincer Share Token with its own TransferPolicy. Modules check each transfer in sequence and stop at the first one that fails."
        action={
          <span className="btn btn-primary btn-sm">
            <Plus className="size-3.5" aria-hidden="true" />
            Add share class
          </span>
        }
      />
      <Figures
        items={[
          { label: "Share classes", value: "1", hint: "LKW-B" },
          { label: "Active modules", value: on ? "4" : "3", hint: "Summed over all classes", tone: "text-lagoon-deep" },
          { label: "RFQ on", value: "1 of 1", hint: "Eligible holders can trade on signed quotes" },
          { label: "Paused", value: "0", hint: "Pauses take effect immediately" },
        ]}
      />
      <Panel
        left={MAIN_L}
        width={MAIN_R - MAIN_L}
        title={
          <>
            Series B Preferred <span className="ml-1.5 font-mono text-[11px] font-normal text-fog">LKW-B</span>
          </>
        }
        description="184 holders. ERC-20 token, 18 decimals, ERC-3643-compatible transfers, ERC-8056 multiplier."
        action={<span className="rounded-full bg-leaf-soft px-2.5 py-[3px] text-[11px] font-medium text-leaf-deep">Transfers on</span>}
      >
        <div className="px-5 pt-4">
          <div className="flex h-[30px] items-baseline justify-between">
            <span className="text-[12.5px] font-medium">Rule modules, in run order</span>
            <span className="text-[11px] text-fog">Module changes wait 24 hours in the CompanyTimelock.</span>
          </div>
          <ul className="overflow-hidden rounded-lg border border-line">
            {RULES.map((r, i) => {
              const live = i === 2 ? on : "on" in r;
              const text = live ? ("on" in r ? r.on : "") : "off" in r ? r.off : "";
              return (
                <li key={r.name} className={`flex items-center gap-4 border-b border-line-soft px-4 last:border-b-0 ${live ? "" : "bg-canvas/40"}`} style={{ height: ROW_H }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[13px] font-medium ${live ? "text-navy" : "text-tide"}`}>{r.name}</span>
                      <span className="font-mono text-[10.5px] text-fog">{r.contract}</span>
                    </div>
                    <p className={`mt-0.5 truncate text-[12px] ${live ? "text-tide" : "text-fog"}`}>{text}</p>
                    <p className="font-mono text-[10px] text-fog">Fails with {r.reason}</p>
                  </div>
                  <span className="btn btn-ghost btn-sm">
                    <Pencil className="size-3" aria-hidden="true" />
                    Edit
                  </span>
                  <Toggle p={i === 2 ? flip : live ? 1 : 0} />
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>
      <Receipt
        p={ease(t, R_RECEIPT, R_RECEIPT + 0.35)}
        title="Holding period updated"
        detail="Takes effect through the CompanyTimelock after the module delay."
        call="TransferPolicy.configureModule(module, config)"
        tx="0x4b1e…20c7"
      />
      <Cursor {...c} hide={t > R_AWAY} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Raise: start an offering and watch subscriptions arrive          */
/* ------------------------------------------------------------------ */

const O_START_AT = 0.95;
const O_OPEN = [1.05, 1.45] as const;
const O_NAME_AT = 1.85;
const O_NAME = [1.95, 2.75] as const;
const O_PRICE_AT = 3.15;
const O_PRICE = [3.25, 3.55] as const;
const O_LAUNCH_AT = 4.2;
const O_CLOSE = [4.3, 4.65] as const;
const O_RECEIPT = 4.4;
const O_FILL = [4.9, 7.2] as const;
const O_AWAY = 4.8;

const RAISE = 3_120_000;
const MAX = 4_000_000;
const MIN = 1_500_000;

/* Drawer fields, top to bottom, in stage pixels */
const DRAWER_L = 1200 - 14 - 420;
const NAME_Y = 214;
const PRICE_Y = 280;
const LAUNCH = { x: DRAWER_L + 24 + 66, y: 540 };

function Raise({ t }: { t: number }) {
  const open = ease(t, ...O_OPEN) * (1 - ease(t, ...O_CLOSE));
  const launched = t >= O_LAUNCH_AT + 0.05;
  const fill = ease(t, ...O_FILL);
  const raised = launched ? RAISE * fill : 0;
  const investors = launched ? Math.round(38 * fill) : 0;
  const daysLeft = launched ? Math.round(14 - 8 * fill) : 14;
  const name = typed("Series B extension", t, ...O_NAME);
  const price = typed("22.50", t, ...O_PRICE);
  const c = glide(
    t,
    [
      [0, 0, 700, 560],
      [0.2, 0.75, 1112, 100],
      [1.35, O_NAME_AT - 0.1, DRAWER_L + 150, NAME_Y + 20],
      [2.8, O_PRICE_AT - 0.1, DRAWER_L + 120, PRICE_Y + 20],
      [3.6, O_LAUNCH_AT - 0.1, LAUNCH.x, LAUNCH.y],
    ],
    [O_START_AT, O_NAME_AT, O_PRICE_AT, O_LAUNCH_AT]
  );
  return (
    <Shell page="Capital raises">
      <Header
        title="Capital raises"
        description="Eligible investors commit USDG, and the RaiseEscrow keeps it in escrow until the close. At that point shares mint and the money goes to the treasury, or everyone is refunded."
        action={
          <span className="btn btn-primary btn-sm" style={held(t, O_START_AT) ? { background: "#fff" } : undefined}>
            <Plus className="size-3.5" aria-hidden="true" />
            Start an offering
          </span>
        }
      />
      <Figures
        items={[
          { label: "Total raised", value: "6.80M USDG", hint: "Across 1 closed offerings", tone: "text-leaf-deep" },
          { label: "Held in escrow", value: `${(raised / 1e6).toFixed(2)}M USDG`, hint: `${launched ? 1 : 0} ${launched ? "offering" : "offerings"} running`, tone: raised > 0 ? "text-lagoon-deep" : undefined },
          { label: "Shares minted", value: "359,788", hint: "Created when offerings close" },
          { label: "Investors", value: String(investors), hint: "Committed to running offerings" },
        ]}
      />
      <Panel left={MAIN_L} width={MAIN_R - MAIN_L} title="Every offering" description="Pick a row to see its allocation and subscription ledger.">
        <div className="px-5 pt-2">
          <div className="grid grid-cols-[1.4fr_0.7fr_0.6fr_1.4fr_0.6fr_0.7fr] gap-4 border-b border-line py-2.5 text-[11px] text-fog">
            <span>Offering</span>
            <span>Status</span>
            <span className="text-right">Price</span>
            <span>Raised</span>
            <span className="text-right">Investors</span>
            <span className="text-right">Closes</span>
          </div>
          {[
            launched && { name: "Series B extension", status: "Open", tone: "bg-lagoon-soft text-lagoon-deep", price: "22.50 USDG", raised, of: MAX, inv: investors, closes: `in ${daysLeft} days`, fresh: ease(t, O_LAUNCH_AT + 0.1, O_LAUNCH_AT + 0.6) },
            { name: "Series B round", status: "Closed", tone: "bg-leaf-soft text-leaf-deep", price: "18.90 USDG", raised: 6_800_000, of: 6_800_000, inv: 52, closes: "Mar 3, 2026", fresh: 1 },
          ]
            .filter((r) => !!r)
            .map((r) => (
              <div key={r.name} className="grid grid-cols-[1.4fr_0.7fr_0.6fr_1.4fr_0.6fr_0.7fr] items-center gap-4 border-b border-line-soft py-3.5 text-[12.5px]" style={{ opacity: r.fresh }}>
                <span>
                  <span className="block font-medium">{r.name}</span>
                  <span className="font-mono text-[10.5px] text-fog">LKW-B</span>
                </span>
                <span>
                  <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-medium ${r.tone}`}>{r.status}</span>
                </span>
                <span className="readout text-right">{r.price}</span>
                <span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-haze-2">
                    <span className="block h-full rounded-full bg-sky" style={{ width: `${(r.raised / r.of) * 100}%` }} />
                  </span>
                  <span className="readout mt-1.5 block text-[11px] text-tide">
                    {fmt(r.raised)} of {fmt(r.of)} USDG
                  </span>
                </span>
                <span className="readout text-right">{r.inv}</span>
                <span className="text-right text-[12px] text-tide">{r.closes}</span>
              </div>
            ))}
        </div>
      </Panel>

      {/* The drawer: dims the page and slides in from the right */}
      {open > 0 && (
        <>
          <div className="absolute inset-0 z-10 bg-black/55" style={{ opacity: open }} />
          <div className="glass glass-strong absolute z-10 flex flex-col overflow-hidden" style={{ top: 10, bottom: 10, left: DRAWER_L, width: 420, transform: `translateX(${(1 - open) * 440}px)` }}>
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
              <span className="text-[14px] font-semibold">Start an offering</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-haze">
                <X className="size-3.5 text-tide" aria-hidden="true" />
              </span>
            </div>
            <div className="space-y-3.5 px-6 pt-5">
              <Field label="Share class">
                <Box value="LKW-B · Series B Preferred" select />
              </Field>
              <Field label="Offering name">
                <Box value={name} focus={t >= O_NAME_AT && t < O_PRICE_AT} caret={t >= O_NAME_AT && t < O_PRICE_AT} />
              </Field>
              <Field label="Price per share" hint={price === "22.50" ? "At the maximum raise, that is 177,777 LKW-B." : undefined}>
                <Box value={price} placeholder="0.00" suffix="USDG" mono focus={t >= O_PRICE_AT && t < O_LAUNCH_AT} caret={t >= O_PRICE_AT && t < O_LAUNCH_AT} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum raise">
                  <Box value={fmt(MIN)} suffix="USDG" mono />
                </Field>
                <Field label="Maximum raise">
                  <Box value={fmt(MAX)} suffix="USDG" mono />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Opens" hint="Choose today to open right away.">
                  <Box value="11/15/2026" />
                </Field>
                <Field label="Closes" hint="At the end of that day, local time.">
                  <Box value="11/29/2026" />
                </Field>
              </div>
              <div className="border-t border-line-soft pt-4">
                <div className="flex gap-2">
                  <span className="btn btn-primary btn-sm" style={held(t, O_LAUNCH_AT) ? { background: "#fff" } : undefined}>
                    Launch offering
                  </span>
                  <span className="btn btn-ghost btn-sm">Cancel</span>
                </div>
                <p className="mt-2.5 font-mono text-[10px] text-fog">RaiseEscrow.createOffering(params)</p>
              </div>
            </div>
          </div>
        </>
      )}

      <Receipt
        p={ease(t, O_RECEIPT, O_RECEIPT + 0.35)}
        title="Offering ready"
        detail="Series B extension is open for subscriptions."
        call="RaiseEscrow.createOffering(params)"
        tx="0x9a02…e61d"
      />
      <Cursor {...c} hide={t > O_AWAY} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Check a transfer: a tier 1 recipient meets the eligibility rule  */
/* ------------------------------------------------------------------ */

const C_OPEN_AT = 1.15;
const C_PICK_AT = 2.25;
const C_RUN = 2.4;
const C_EACH = 0.22;
const C_AWAY = 2.9;

const COL_L = MAIN_L + 20;
const TO_Y = PANEL_TOP + 56 + 20 + 2 * 74 + 20;
const OPTION_H = 34;

const TO_OPTIONS = ["Holder 0xb02f…17d3 · US · Tier 2", "Holder 0x58aa…903c · GB · Tier 3", "Holder 0x4e88…c0b1 · DE · Tier 1"];

const PASSING = ["Transfers not paused", "Sender has the shares", "Sender verified", "Recipient verified", "JurisdictionRule", "InvestorTierRule", "LockupRule", "HolderLimitRule"];
const FAILING = PASSING.slice(0, 6);

function Check({ t }: { t: number }) {
  const listOpen = t >= C_OPEN_AT + 0.05 && t < C_PICK_AT + 0.05;
  const picked = t >= C_PICK_AT + 0.05;
  const shown = picked ? Math.min(FAILING.length, Math.floor((t - C_RUN) / C_EACH) + 1) : PASSING.length;
  const trace = picked ? FAILING.slice(0, Math.max(0, shown)) : PASSING;
  const done = picked && shown >= FAILING.length;
  const optionY = (i: number) => TO_Y + 40 + 4 + OPTION_H * i + OPTION_H / 2;
  const c = glide(
    t,
    [
      [0, 0, 980, 640],
      [0.3, C_OPEN_AT - 0.08, COL_L + 250, TO_Y + 22],
      [1.4, C_PICK_AT - 0.12, COL_L + 230, optionY(2)],
    ],
    [C_OPEN_AT, C_PICK_AT]
  );
  return (
    <Shell page="Ownership">
      <Header
        title="Ownership"
        description="Holders, balances and lots, read straight from the share token. Balances live on-chain; names stay with the registrar."
        action={
          <span className="flex gap-2">
            <span className="btn btn-secondary btn-sm">
              <UserPlus className="size-3.5" aria-hidden="true" />
              Add a holder
            </span>
            <span className="btn btn-primary btn-sm">Mint shares</span>
          </span>
        }
      />
      <Figures
        items={[
          { label: "LKW-B holders", value: "184", hint: "184 identities on the registry" },
          { label: "Verified", value: "100%", hint: "184 of 184 have current identity and screening claims", tone: "text-leaf-deep" },
          { label: "Employees", value: "26", hint: "Carry an EMPLOYEE_OF claim for Larkway Labs" },
          { label: "Authorized", value: "3,000,000", hint: "2,400,000 minted so far, 80.0%" },
        ]}
      />
      <Panel
        left={MAIN_L}
        width={MAIN_R - MAIN_L}
        title="Test a transfer"
        description="Runs the PincerEquityToken checks in contract order and shows the reason code the chain would return."
        action={<ArrowLeftRight className="size-4 text-fog" aria-hidden="true" />}
      >
        <div className="grid grid-cols-[400px_minmax(0,1fr)] gap-6 px-5 pt-5">
          <div className="relative space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Share class">
                <Box value="LKW-B" select />
              </Field>
              <Field label="Amount">
                <Box value="500" suffix="LKW-B" mono />
              </Field>
            </div>
            <Field label="From">
              <Box value="Holder 0x71c3…9e4a · 120,000" select />
            </Field>
            <Field label="To">
              <Box value={picked ? TO_OPTIONS[2] : TO_OPTIONS[0]} select focus={listOpen} />
            </Field>
            <Field label="Route">
              <div className="flex gap-1 rounded-xl border border-line-soft bg-haze p-1 text-[12px] font-medium">
                <span className="flex-1 rounded-lg bg-haze-2 py-1.5 text-center">Direct</span>
                <span className="flex-1 py-1.5 text-center text-tide">RFQ settlement</span>
              </div>
            </Field>
            {listOpen && (
              <ul className="absolute left-0 right-0 z-10 rounded-xl border border-line bg-popover p-1 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.9)]" style={{ top: TO_Y - (PANEL_TOP + 56 + 20) + 44 }}>
                {TO_OPTIONS.map((o, i) => {
                  const hover = i === 2 ? t >= C_PICK_AT - 0.12 : i === 0 && t < 1.7;
                  return (
                    <li key={o} className={`flex items-center rounded-lg px-3 text-[12.5px] ${hover ? "bg-haze-2 text-navy" : "text-tide"}`} style={{ height: OPTION_H }}>
                      {o}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 text-[12.5px] font-medium">Check by check</div>
            <ol className="overflow-hidden rounded-lg border border-line">
              {trace.map((step, i) => {
                const fails = picked && i === FAILING.length - 1;
                return (
                  <li key={`${picked}-${step}`} className={`flex items-center gap-3 border-b border-line-soft px-4 py-[6px] last:border-b-0 ${fails ? "bg-rose-soft" : ""}`}>
                    <span className="index w-5 text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`flex-1 font-mono text-[11.5px] ${fails ? "text-rose-deep" : "text-tide"}`}>{step}</span>
                    {fails ? <XCircle className="size-3.5 text-rose-deep" aria-hidden="true" /> : <CheckCircle2 className="size-3.5 text-leaf-deep" aria-hidden="true" />}
                    <span className={`w-[120px] text-right font-mono text-[10.5px] ${fails ? "text-rose-deep" : "text-leaf-deep"}`}>{fails ? "NOT_ELIGIBLE" : "OK"}</span>
                  </li>
                );
              })}
            </ol>
            {(!picked || done) && (
              <div className={`mt-3 rounded-lg border px-4 py-3 ${picked ? "border-rose/25 bg-rose-soft" : "border-leaf/25 bg-leaf-soft"}`} style={{ opacity: picked ? ease(t, C_RUN + C_EACH * 6, C_RUN + C_EACH * 6 + 0.3) : 1 }}>
                <div className="flex items-center gap-2">
                  {picked ? <XCircle className="size-4 text-rose-deep" aria-hidden="true" /> : <CheckCircle2 className="size-4 text-leaf-deep" aria-hidden="true" />}
                  <span className={`font-mono text-[11.5px] font-semibold ${picked ? "text-rose-deep" : "text-leaf-deep"}`}>{picked ? "NOT_ELIGIBLE" : "OK"}</span>
                </div>
                <p className="mt-1 text-[12.5px]">{picked ? "The recipient is below the eligibility tier this share class requires." : "The transfer passes every rule set on this share class."}</p>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <Cursor {...c} hide={t > C_AWAY} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Clear a window: one price for every matched order                */
/* ------------------------------------------------------------------ */

const W_CLEAR_AT = 1.3;
const W_ASK = 1.4;
const W_SETTLE_AT = 2.85;
const W_DONE = 2.95;
const W_RECEIPT = 3.15;
const W_AWAY = 3.6;

const LEFT_W = 330;
const RIGHT_L = MAIN_L + LEFT_W + 18;
const CLEAR_BTN = { x: MAIN_L + 20 + 68, y: 565 };
const SETTLE_BTN = { x: MAIN_L + 20 + 72, y: 667 };

const ASKS = [
  { who: "Holder 0x71c3…9e4a", qty: 4_000, floor: "21.00 USDG", fill: 4_000 },
  { who: "Holder 0x9d20…5b1e", qty: 6_000, floor: "23.00 USDG", fill: 6_000 },
  { who: "Holder 0x3f8a…d204", qty: 5_000, floor: "24.00 USDG", fill: 5_000 },
  { who: "Holder 0xc61b…77e0", qty: 3_000, floor: "26.00 USDG", fill: 0 },
];

function Clear({ t }: { t: number }) {
  const asking = t >= W_ASK && t < W_DONE;
  const cleared = t >= W_DONE;
  const c = glide(
    t,
    [
      [0, 0, 900, 470],
      [0.3, W_CLEAR_AT - 0.1, CLEAR_BTN.x, CLEAR_BTN.y],
      [1.9, W_SETTLE_AT - 0.1, SETTLE_BTN.x, SETTLE_BTN.y],
    ],
    [W_CLEAR_AT, W_SETTLE_AT]
  );
  return (
    <Shell page="Liquidity Windows">
      <Header
        title="Liquidity Windows"
        description="Liquidity Windows run on a schedule and settle everyone at one price. RFQ and permissioned pools stay open between them. Every route passes canTransfer."
        action={
          <span className="btn btn-primary btn-sm">
            <Plus className="size-3.5" aria-hidden="true" />
            Set up a window
          </span>
        }
      />
      <Figures
        items={[
          { label: "Windows running", value: cleared ? "0" : "1", hint: "0 more on the calendar", tone: cleared ? undefined : "text-lagoon-deep" },
          { label: "Latest clearing price", value: cleared ? "24.00 USDG" : "None", hint: cleared ? "Series B Liquidity Window, Nov 15, 2026" : "No window has cleared" },
          { label: "Shares cleared", value: cleared ? "15,000" : "0", hint: cleared ? "Worth 360,000 USDG" : "Worth 0 USDG" },
          { label: "RFQ on", value: "1 of 1", hint: "Classes with signed quotes" },
        ]}
      />

      {/* The window */}
      <Panel
        left={MAIN_L}
        width={LEFT_W}
        title="Series B Liquidity Window"
        action={<span className={`rounded-full px-2.5 py-[3px] text-[11px] font-medium ${cleared ? "bg-leaf-soft text-leaf-deep" : "bg-lagoon-soft text-lagoon-deep"}`}>{cleared ? "Cleared" : "Open"}</span>}
      >
        <dl className="divide-y divide-line-soft px-5 pt-1 text-[12px]">
          {[
            ["Format", "Auction"],
            ["Opens", "Nov 8, 9:00 AM"],
            ["Closes", "Nov 15, 5:00 PM"],
            ["Reserve price", "20.00 USDG"],
            ["Volume cap", "20,000"],
            ["Cap per seller", "10,000"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5">
              <dt className="text-fog">{k}</dt>
              <dd className="readout">{v}</dd>
            </div>
          ))}
        </dl>
        {!cleared && (
          <div className="mx-5 mt-3 border-t border-line-soft pt-4">
            {asking ? (
              <div className="rounded-xl border border-line bg-haze p-3.5">
                <p className="text-[11.5px] leading-relaxed text-tide">
                  In a single transaction, 15,000 LKW-B moves at 24.00 USDG from 3 sellers to 3 buyers. Unfilled orders are released and the price becomes a Reference Valuation.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="btn btn-primary btn-sm" style={held(t, W_SETTLE_AT) ? { background: "#fff" } : undefined}>
                    Settle at 24.00 USDG
                  </span>
                  <span className="btn btn-ghost btn-sm">Keep as is</span>
                </div>
              </div>
            ) : (
              <span className="btn btn-primary btn-sm" style={held(t, W_CLEAR_AT) ? { background: "#fff" } : undefined}>
                Clear and settle
              </span>
            )}
            <p className="mt-2.5 font-mono text-[10px] text-fog">WindowMarket.clear(windowId)</p>
          </div>
        )}
      </Panel>

      {/* The book */}
      <Panel
        left={RIGHT_L}
        width={MAIN_R - RIGHT_L}
        title={cleared ? "Cleared at 24.00 USDG" : "15,000 shares at 24.00 USDG"}
        description={cleared ? undefined : "Settles at the price, at or above the reserve, that matches the most shares; ties lean toward the Reference Valuation."}
      >
        <div className="px-5 pt-4">
          <div className={`frame grid gap-px text-[11px] ${cleared ? "grid-cols-3" : "grid-cols-4"}`}>
            {(cleared
              ? [
                  ["Clearing price", "24.00 USDG"],
                  ["Volume", "15,000"],
                  ["Value", "360,000 USDG"],
                ]
              : [
                  ["Price", "24.00 USDG"],
                  ["Volume", "15,000"],
                  ["Sellers matched", "3"],
                  ["Buyers matched", "3"],
                ]
            ).map(([l, v]) => (
              <div key={l} className="frame-cell px-3.5 py-2.5">
                <div className="text-fog">{l}</div>
                <div className="readout mt-1 truncate font-mono text-[12.5px] text-navy">{v}</div>
              </div>
            ))}
          </div>
          <div className="mb-2 mt-4 text-[12.5px] font-medium">Asks, cheapest first</div>
          <div className="overflow-hidden rounded-lg border border-line text-[12px]">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.8fr_1fr] gap-3 border-b border-line px-3 py-2 text-fog">
              <span>Holder</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Floor</span>
              <span className="text-right">Status</span>
            </div>
            {ASKS.map((a) => (
              <div key={a.who} className="grid grid-cols-[1.4fr_0.6fr_0.8fr_1fr] gap-3 border-b border-line-soft px-3 py-2 last:border-b-0">
                <span className="truncate">{a.who}</span>
                <span className="readout text-right font-mono">{fmt(a.qty)}</span>
                <span className="readout text-right font-mono text-rose-deep">{a.floor}</span>
                <span className="text-right font-mono text-[10.5px]">
                  {a.fill > 0 ? <span className={cleared ? "text-leaf-deep" : "text-navy"}>{cleared ? "Filled" : "Would fill"} in full</span> : <span className="text-fog">{cleared ? "No fill" : "Misses"}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Receipt
        p={ease(t, W_RECEIPT, W_RECEIPT + 0.35)}
        title="Cleared at 24.00 USDG"
        detail="15,000 LKW-B changed hands between 3 sellers and 3 buyers in a single transaction. The Reference Valuation now uses this price."
        call="WindowMarket.clear(windowId)"
        tx="0x6c3d…1f88"
      />
      <Cursor {...c} hide={t > W_AWAY} />
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* The window                                                          */
/* ------------------------------------------------------------------ */

export const STEPS: Step[] = [
  { id: "rule", name: "Set a rule", dur: 6.2, path: "usepincer.org/console/share-classes", View: SetRule },
  { id: "raise", name: "Raise", dur: 8.2, path: "usepincer.org/console/offerings", View: Raise },
  { id: "check", name: "Check a transfer", dur: 6.8, path: "usepincer.org/console/cap-table", View: Check },
  { id: "clear", name: "Clear a window", dur: 7.4, path: "usepincer.org/console/liquidity", View: Clear },
];

/* In development, ?frame=2:3.5 freezes step 3 at 3.5 s, for screenshots. */
const noSubscribe = () => () => {};
function useFrozenFrame() {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  if (process.env.NODE_ENV === "production") return undefined;
  const m = /[?&]frame=(\d+):([\d.]+)/.exec(search);
  return m ? { i: Number(m[1]), t: Number(m[2]) } : undefined;
}

export function ConsoleDemo() {
  const start = useFrozenFrame();
  return (
    <StepWindow
      key={start ? `${start.i}:${start.t}` : "live"}
      steps={STEPS}
      start={start}
      label="The Pincer Console, with a sample company"
      tab={
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="" width={14} height={14} />
          Pincer Console
        </>
      }
    />
  );
}
