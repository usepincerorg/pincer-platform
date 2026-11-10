import { SectionHeading } from "@/components/SectionHeading";

const PUBLIC = [
  "Total supply and holder count for every share class",
  "Every mint, burn, transfer, freeze, recovery and pause",
  "Offering terms and progress, and window clearing prices",
  "The full history of corporate actions and multipliers",
  "The rule module setup of each class",
  "Hashes of every anchored document",
] as const;

const PRIVATE = [
  "Holder names and contact details",
  "Documents used for identity verification",
  "The cap table with identities, visible to the issuer alone",
  "Financial statements, shown only to verified holders",
  "Documents the company has not published",
  "The details inside individual claims",
] as const;

const EVENTS = [
  "SharesIssued",
  "Transfer",
  "ModuleConfigured",
  "OfferingClosed",
  "WindowCleared",
  "QuoteFilled",
  "DistributionFunded",
  "ProposalFinalized",
  "DocumentAnchored",
  "ValuationPublished",
  "RecoveryScheduled",
  "Paused",
] as const;

const DOCUMENTS = [
  "SHARE_CLASS_TERMS",
  "OFFERING_DOCUMENT",
  "FINANCIAL_STATEMENT",
  "COMPANY_UPDATE",
  "BOARD_RESOLUTION",
  "VALUATION_REPORT",
] as const;

function Column({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="text-[19px] tracking-[-0.02em]">{title}</h3>
      <ul className="mt-5 divide-y divide-line-soft border-y border-line">
        {items.map((item) => (
          <li key={item} className="py-3.5 text-[15px] leading-relaxed text-tide">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[12.5px] text-tide sm:grid-cols-3">
      {items.map((item) => (
        <li key={item} className="truncate">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TransparencySection() {
  return (
    <section id="transparency" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              The public sees what happened. <span className="accent-word">Not who did it.</span>
            </>
          }
          description="The Explorer reads its public record straight from Robinhood Chain. Personal data never goes on-chain, so the record can be fully public while holders remain private."
        />

        <div className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2">
          <Column title="On-chain and public" items={PUBLIC} />
          <Column title="Off-chain and access-controlled" items={PRIVATE} />
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2">
          <div>
            <h3 className="text-[19px] leading-snug tracking-[-0.02em]">Every state change emits an event</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-tide">
              Nothing changes supply silently. Each mint, burn, recovery, freeze and pause carries a reference, and the Explorer and API index every event with its block and transaction.
            </p>
            <Chips items={EVENTS} />
          </div>
          <div>
            <h3 className="text-[19px] leading-snug tracking-[-0.02em]">Disclosures anchored by hash</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-tide">
              DocumentAnchor records the kind, hash and location of every document the company publishes. Verified holders open the contents in Portfolio, and anyone can confirm a document has not changed since it was anchored.
            </p>
            <Chips items={DOCUMENTS} />
          </div>
        </div>
      </div>
    </section>
  );
}
