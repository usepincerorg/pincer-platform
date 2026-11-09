import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";

/*
 * The path a company takes from its existing cap table to a live share
 * token. Each row carries a short tag with the one detail a reader is most
 * likely to look for.
 */
const STAGES = [
  {
    title: "Verify",
    tag: "Registrar named",
    body: "The company completes verification, chooses which share classes go on-chain, and appoints a registrar to hold the authoritative cap table. That can be the company itself or an administrator it selects.",
  },
  {
    title: "Reconcile",
    tag: "CSV upload",
    body: "Upload a CSV or an export from your cap table software, and Pincer reconciles it line by line. Holders then get an invitation, verify their identity, and connect a wallet of their own or take an embedded one.",
  },
  {
    title: "Set rules",
    tag: "Eight modules",
    body: "In the Console, give each class its rules: regions, eligibility tier, holding periods, holder cap, transfer windows, right of first refusal, ownership limit and employee vesting. Modules can be swapped later without upgrading the token.",
  },
  {
    title: "Rehearse",
    tag: "Sandbox",
    body: "Pincer deploys an identical copy of the setup to Robinhood Chain testnet. There the company checks balances against the cap table, confirms the reason codes it expects, and practices a pause and a recovery before mainnet.",
  },
  {
    title: "Launch",
    tag: "One transaction",
    body: "PincerDeployer deploys the company's full contract set to mainnet in one transaction. The registrar then mints to every holder from the reconciled cap table, and each SharesIssued event points back to its source record.",
  },
  {
    title: "Run",
    tag: "Settles in USDG",
    body: "From there the company raises through offerings, opens Liquidity Windows, pays distributions, runs votes and anchors disclosures. Each one begins in the Console and settles as an on-chain transaction.",
  },
] as const;

const PRINCIPLES = [
  "Each token is a share of the company, not a claim on some third party, and it carries its class's economic, information and voting rights.",
  "The company writes the rules in the Console, and contracts it controls enforce them.",
  "Trading happens when the company says so: in windows it schedules or on venues it has explicitly approved.",
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section relative scroll-mt-24">
      <div className="container grid gap-14 lg:grid-cols-12 lg:gap-12">
        {/* Left: the claim and what it rests on, held in place while the stages scroll */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              layout="stack"
              title={
                <>
                  From existing cap table to a <span className="accent-word">live share token</span> in under four weeks.
                </>
              }
              description="Pincer swaps spreadsheets and manual transfer review for one share token per class. After a single reconciliation at onboarding, token balances are the cap table, and the chain keeps them current."
            />
            <Glass className="mt-10">
              <div className="p-6 md:p-7">
                <h3 className="text-[17px] tracking-[-0.015em]">Issued by the company</h3>
                <ul className="mt-4 divide-y divide-line-soft">
                  {PRINCIPLES.map((point) => (
                    <li key={point} className="py-3.5 text-[14.5px] leading-relaxed text-tide first:pt-0 last:pb-0">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Glass>
          </div>
        </div>

        {/* Right: the six stages as one protocol */}
        <Glass as="ol" className="lg:col-span-7">
          {STAGES.map((stage, i) => (
            <li key={stage.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 border-b border-line-soft px-6 py-7 last:border-b-0 md:grid-cols-[56px_minmax(0,1fr)] md:px-8 md:py-8">
              <span className="font-display pt-0.5 text-[15px] text-fog">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h3 className="text-[21px] tracking-[-0.02em]">{stage.title}</h3>
                  <span className="tag">{stage.tag}</span>
                </div>
                <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-tide">{stage.body}</p>
              </div>
            </li>
          ))}
        </Glass>
      </div>
    </section>
  );
}
