import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";

const ROWS = [
  {
    label: "Who issues",
    manual: "The company, tracked in spreadsheets and cap table software",
    wrapper: "A third party, acting without the company",
    pincer: "The company itself, through contracts it controls",
  },
  {
    label: "What a holder owns",
    manual: "A line in a ledger someone else keeps",
    wrapper: "A claim that tracks the price",
    pincer: "The actual share, with its class's rights",
  },
  {
    label: "Rule enforcement",
    manual: "Manual review that takes weeks",
    wrapper: "Geographic gating at most",
    pincer: "Eight modules check every transfer and return a reason code",
  },
  {
    label: "How trading happens",
    manual: "Private negotiations and occasional tenders",
    wrapper: "Continuous, and outside the company's control",
    pincer: "Windows, RFQ and pools the company schedules and approves",
  },
  {
    label: "Price discovery",
    manual: "Seldom disclosed and hard to compare",
    wrapper: "Price signals the company cannot shape",
    pincer: "Published clearing prices and Reference Valuations with source and date",
  },
  {
    label: "Corporate actions",
    manual: "Updated by hand once the paperwork clears",
    wrapper: "Approximated at best",
    pincer: "Splits, distributions, votes and conversions as on-chain transactions",
  },
  {
    label: "Audit trail",
    manual: "Fragmented and closed",
    wrapper: "Just price data",
    pincer: "Every issuance and transfer on-chain, with identities kept private",
  },
] as const;

const COLS = "md:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]";

export function ComparisonSection() {
  return (
    <section id="compare" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              The company is the issuer. <span className="accent-word">The rest follows from there.</span>
            </>
          }
          description="Today, private shares mostly move one of two ways: manually against off-chain records, or as tokens a third party creates without the company. Pincer is the issuer-sponsored option."
        />

        <Glass className="mt-16 overflow-hidden">
          <div className={`hidden text-[14px] font-medium md:grid ${COLS}`}>
            <div className="border-b border-line-soft p-5" />
            <div className="border-b border-line-soft p-5 text-fog">Manual records</div>
            <div className="border-b border-line-soft p-5 text-fog">Wrapper tokens</div>
            <div className="border-b border-line-soft bg-lagoon-faint p-5 font-semibold text-navy">Pincer tokens</div>
          </div>
          <ul>
            {ROWS.map((row, i) => {
              const rule = i < ROWS.length - 1 ? "md:border-b md:border-line-soft" : "";
              return (
                <li key={row.label} className={`grid max-md:border-b max-md:border-line-soft ${COLS}`}>
                  <div className={`px-5 pt-5 text-[14px] font-medium text-navy md:py-5 ${rule}`}>{row.label}</div>
                  <div className={`px-5 pt-2 text-[14.5px] leading-relaxed text-fog md:py-5 ${rule}`}>
                    <span className="mr-2 font-medium md:hidden">By hand:</span>
                    {row.manual}
                  </div>
                  <div className={`px-5 pb-3 pt-1 text-[14.5px] leading-relaxed text-fog md:py-5 ${rule}`}>
                    <span className="mr-2 font-medium md:hidden">Wrapped:</span>
                    {row.wrapper}
                  </div>
                  <div className={`bg-lagoon-faint px-5 py-4 text-[14.5px] leading-relaxed text-navy md:py-5 ${rule}`}>
                    <span className="mr-2 font-medium text-tide md:hidden">Pincer:</span>
                    {row.pincer}
                  </div>
                </li>
              );
            })}
          </ul>
        </Glass>

        <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-tide">No issuer, no token. Every Pincer token is issued by the company whose shares it represents.</p>
      </div>
    </section>
  );
}
