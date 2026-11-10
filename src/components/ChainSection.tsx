import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";

const FACTS = [
  { label: "Built on", value: "Arbitrum" },
  { label: "Final settlement", value: "Ethereum" },
  { label: "Network fees", value: "ETH, sponsored for holders" },
  { label: "Payments in", value: "USDG" },
] as const;

const FEATURES = [
  {
    title: "A standard ERC-20 with permissions built in",
    body: "Every share class is one Pincer Share Token: an 18-decimal ERC-20 with ERC-3643-compatible permissioned transfers and the ERC-8056 multiplier. Wallets and indexers on the chain treat it like any other stock token.",
  },
  {
    title: "Reference Valuations as a Chainlink-compatible feed",
    body: "ValuationFeed publishes each Reference Valuation on-chain and answers latestRoundData the way an AggregatorV3 feed does. Call latestValuation to get the source, the date and the hash of the supporting document.",
  },
  {
    title: "Splits without a rebase",
    body: "After a 48 hour timelock, a split changes the ERC-8056 uiMultiplier. Raw balances never move, so pools and integrations keep working through it, and the oracle pauses while it takes effect.",
  },
  {
    title: "Gated pools next to existing AMMs",
    body: "The chain already runs AMMs and stablecoin rails. A company that opts in can put a class in a pool behind PoolGuard, which enforces the class's rules on each swap.",
  },
  {
    title: "Embedded wallets and account abstraction",
    body: "New holders get an embedded wallet at onboarding, and any EVM wallet they already have connects as it is. Pincer relays their transactions, so investors and employees never need to hold ETH.",
  },
  {
    title: "A full rule check on each transfer, at low cost",
    body: "Low fees and sub-second soft confirmation make a complete rule check on every transfer practical, and settlement still inherits Ethereum's security.",
  },
] as const;

export function ChainSection() {
  return (
    <section id="chain" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              On the chain where <span className="accent-word">stock tokens</span> already live.
            </>
          }
          description="Robinhood Chain has stock token conventions that its wallets, pools and oracles already read. Pincer tokens follow every one and add identity-gated transfers and issuer governance. Pincer is an independent company building on Robinhood Chain."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-x-10 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="border-t border-line py-7">
                <h3 className="text-[17px] leading-snug tracking-[-0.015em]">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-tide">{feature.body}</p>
              </article>
            ))}
          </div>

          {/* The chain at a glance, held beside the features on large screens */}
          <Glass as="aside" className="self-start lg:sticky lg:top-32">
            <dl className="divide-y divide-line-soft">
              {FACTS.map((fact) => (
                <div key={fact.label} className="px-6 py-5">
                  <dt className="text-[13px] text-fog">{fact.label}</dt>
                  <dd className="mt-1 text-[19px] font-medium tracking-[-0.02em] text-navy">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Glass>
        </div>
      </div>
    </section>
  );
}
