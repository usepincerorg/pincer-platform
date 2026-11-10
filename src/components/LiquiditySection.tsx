import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";
import { cn } from "@/lib/utils";

const MECHANISMS = [
  {
    title: "Primary offerings",
    contract: "RaiseEscrow",
    body: "The company sets the price per share, minimum and maximum raise, minimum ticket and dates. Investors subscribe in USDG, held in escrow until close, when one transaction either mints the shares and releases the funds or refunds everyone.",
  },
  {
    title: "Liquidity Windows",
    contract: "WindowMarket",
    body: "Fixed-period sales on dates the company chooses. Sellers lock shares, eligible buyers lock USDG, and the window clears at one uniform price. With ROFR enabled, the company gets a priority bid at that price before settlement. Fixed-price tenders work the same way.",
  },
  {
    title: "RFQ",
    contract: "QuoteSettlement",
    body: "Between windows, eligible holders trade against signed EIP-712 quotes. Each fill settles on-chain after canTransfer checks both sides, and the company can restrict RFQ to its transfer windows.",
  },
  {
    title: "Permissioned pools",
    contract: "PoolGuard",
    body: "Companies that opt in can list a class in an AMM pool. PoolGuard runs canTransfer on every swap and liquidity change, so only eligible holders can trade or provide liquidity.",
  },
] as const;

/* A sample window, cleared with the same algorithm the contract uses. */
type Order = { id: string; qty: number; price: number; filled: number };

const ASKS: Order[] = [
  { id: "A1", qty: 4_000, price: 21.0, filled: 4_000 },
  { id: "A2", qty: 6_000, price: 23.0, filled: 6_000 },
  { id: "A3", qty: 5_000, price: 24.0, filled: 5_000 },
  { id: "A4", qty: 3_000, price: 26.0, filled: 0 },
];

const BIDS: Order[] = [
  { id: "B1", qty: 5_000, price: 26.0, filled: 5_000 },
  { id: "B2", qty: 4_000, price: 24.5, filled: 4_000 },
  { id: "B3", qty: 8_000, price: 24.0, filled: 6_000 },
  { id: "B4", qty: 4_000, price: 22.0, filled: 0 },
];

const CLEARING = 24.0;
const VOLUME = 15_000;

const fmt = (n: number) => n.toLocaleString("en-US");
const usd = (n: number) => n.toFixed(2);

function OrderList({ title, note, orders }: { title: string; note: string; orders: Order[] }) {
  return (
    <div className="p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-semibold text-navy">{title}</p>
        <p className="caption">{note}</p>
      </div>
      <div className="mt-5 grid grid-cols-[32px_1fr_1fr_1fr] gap-x-3 border-b border-line-soft pb-2.5 caption">
        <span>ID</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Limit</span>
        <span className="text-right">Filled</span>
      </div>
      <ul className="divide-y divide-line-soft text-[14px]">
        {orders.map((o) => {
          const status = o.filled === o.qty ? "full" : o.filled > 0 ? "partial" : "none";
          return (
            <li key={o.id} className="readout grid grid-cols-[32px_1fr_1fr_1fr] gap-x-3 py-[18px]">
              <span className="text-fog">{o.id}</span>
              <span className="text-right text-tide">{fmt(o.qty)}</span>
              <span className="text-right text-tide">{usd(o.price)}</span>
              <span
                className={cn(
                  "text-right font-medium",
                  status === "full" && "text-leaf-deep",
                  status === "partial" && "text-amber-deep",
                  status === "none" && "text-fog"
                )}
              >
                {status === "none" ? "0" : fmt(o.filled)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LiquiditySection() {
  return (
    <section id="liquidity" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              Capital and liquidity, on <span className="accent-word">the company&apos;s schedule</span>.
            </>
          }
          description="The company plans its liquidity rather than leaving it to chance. Every mechanism settles delivery versus payment in USDG: shares and stablecoin move together in one transaction, or nothing moves."
        />

        <Glass className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4">
          {MECHANISMS.map((item, i) => (
            <article
              key={item.title}
              className={cn(
                "flex flex-col border-line-soft",
                i < MECHANISMS.length - 1 && "border-b lg:border-b-0 lg:border-r",
                i === 1 && "sm:border-r-0 lg:border-r",
                i === 0 && "sm:border-r",
                i === 2 && "sm:border-b-0 sm:border-r"
              )}
            >
              <div className="flex-1 p-6 md:p-7">
                <h3 className="text-[19px] tracking-[-0.015em]">{item.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
              </div>
              <p className="border-t border-line-soft px-6 py-3.5 font-mono text-[12px] text-fog md:px-7">{item.contract}</p>
            </article>
          ))}
        </Glass>

        {/* A worked example: one window, eight orders, one price */}
        <div className="mt-28 grid gap-6 lg:grid-cols-12 lg:gap-12">
          <h3 className="display text-[34px] font-normal md:text-[44px] lg:col-span-5">Eight orders. One price.</h3>
          <p className="text-[15.5px] leading-relaxed text-tide lg:col-span-7 lg:self-end">
            In this example, a Liquidity Window runs on LKW-B, an illustrative Series B Preferred class at the sample company Larkway Labs. After close, anyone can call{" "}
            <span className="font-mono text-[14px] text-navy">clear(windowId)</span>. The contract picks the price that matches the most shares, breaks ties toward the latest
            Reference Valuation, and fills by price priority, pro-rata at the margin. Unmatched orders are released.
          </p>
        </div>

        <Glass strong className="mt-10 grid lg:grid-cols-3">
          <div className="border-b border-line-soft lg:border-b-0 lg:border-r">
            <OrderList title="Asks" note="Shares locked by sellers" orders={ASKS} />
          </div>
          <div className="border-b border-line-soft lg:border-b-0 lg:border-r">
            <OrderList title="Bids" note="USDG locked by buyers" orders={BIDS} />
          </div>
          <div className="flex flex-col p-6 md:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-semibold text-navy">Result</p>
              <p className="font-mono text-[12px] text-leaf-deep">WindowCleared</p>
            </div>
            <p className="font-display mt-6 text-[56px] leading-none text-navy">
              {usd(CLEARING)} <span className="text-[20px] font-normal tracking-normal text-fog">USDG</span>
            </p>
            <p className="mt-2 text-[14px] text-fog">Every matched buyer and seller gets this price</p>
            <dl className="mt-7 divide-y divide-line-soft border-y border-line-soft text-[14px]">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-tide">Matched shares</dt>
                <dd className="readout text-navy">{fmt(VOLUME)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-tide">Value settled</dt>
                <dd className="readout text-navy">{fmt(VOLUME * CLEARING)} USDG</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-tide">Marginal bid (B3)</dt>
                <dd className="readout text-amber-deep">6,000 of 8,000</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-tide">Previous Reference Valuation</dt>
                <dd className="readout text-navy">22.50</dd>
              </div>
            </dl>
            <p className="mt-auto pt-6 text-[14px] leading-relaxed text-tide">
              The clearing price is then published as the new Reference Valuation, with source <span className="font-mono text-[13px] text-navy">WINDOW_CLEARING</span>.
            </p>
          </div>
        </Glass>
      </div>
    </section>
  );
}
