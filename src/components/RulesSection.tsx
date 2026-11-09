import { ArrowRight } from "lucide-react";
import { Glass } from "@/components/atmosphere";
import { SectionHeading } from "@/components/SectionHeading";

/* The eight modules a share class can enable, and the code each returns. */
const MODULES = [
  { contract: "JurisdictionRule", code: "REGION_BLOCKED", rule: "Allows or blocks holders by country, using an allow-list or a block-list." },
  { contract: "InvestorTierRule", code: "NOT_ELIGIBLE", rule: "Requires the recipient to hold a valid eligibility claim at or above the class's tier." },
  { contract: "LockupRule", code: "HOLDING_PERIOD_ACTIVE", rule: "Locks each lot for a set time after acquisition, spending the oldest lots first." },
  { contract: "HolderLimitRule", code: "HOLDER_CAP_REACHED", rule: "Sets a ceiling on the number of distinct holders in the class." },
  { contract: "TradingWindowRule", code: "WINDOW_CLOSED", rule: "Lets transfers through only during windows the company schedules." },
  { contract: "FirstRefusalRule", code: "ROFR_PENDING", rule: "Gives the company a right of first refusal, exercised on-chain." },
  { contract: "OwnershipCeilingRule", code: "MAX_OWNERSHIP_EXCEEDED", rule: "Caps the portion of the class any single holder may own." },
  { contract: "VestingScheduleRule", code: "UNVESTED", rule: "Releases employee shares only as they vest on their schedule." },
] as const;

/* canTransfer runs in this order and stops at the first failure. */
const ORDER = [
  {
    title: "Token state",
    body: "First, the token: the class must be active, and the sender needs enough shares that are unlocked and not frozen.",
    codes: ["TOKEN_PAUSED", "INSUFFICIENT_UNLOCKED_BALANCE", "FROZEN"],
  },
  {
    title: "Identity",
    body: "Next, both wallets must map to verified identities on the company's registry, with claims that are still in date.",
    codes: ["SENDER_NOT_VERIFIED", "RECIPIENT_NOT_VERIFIED", "CLAIM_EXPIRED"],
  },
  {
    title: "Rule modules",
    body: "Last, each module the company enabled runs in turn. If every one passes, the check returns OK and the transfer settles.",
    codes: ["Codes from 8 modules", "OK"],
  },
] as const;

const CLAIMS = [
  { topic: "IDENTITY_VERIFIED", body: "Confirms the holder passed identity verification. It expires on a set date." },
  { topic: "INVESTOR_ELIGIBLE", body: "Records the holder's eligibility tier, signed by a trusted verifier." },
  { topic: "REGION", body: "Carries the ISO 3166 country code that JurisdictionRule checks." },
  { topic: "EMPLOYEE_OF", body: "Identifies the holder's employer, used for vesting and employee windows." },
  { topic: "SCREENED", body: "Records the date of the latest screening, and is revoked automatically if a re-screen fails." },
  { topic: "VENUE", body: "Marks a pool or venue contract as approved to hold shares." },
] as const;

export function RulesSection() {
  return (
    <section id="rules" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              Every transfer is checked. <span className="accent-word">Every refusal is explained.</span>
            </>
          }
          description="The rules travel with the token, so they hold in every wallet, venue and pool on a permissionless chain. A transfer that breaks one cannot settle, and canTransfer returns the reason before anyone signs."
        />

        {/* Check order: token, identity, then the modules. One shell, three stages, read left to right. */}
        <Glass as="ol" className="mt-16 grid md:grid-cols-3">
          {ORDER.map((step, i) => (
            <li key={step.title} className="relative flex flex-col border-b border-line-soft p-7 last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0">
              <h3 className="text-[20px] tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-tide">{step.body}</p>
              <ul className="mt-auto flex flex-col gap-1 pt-7 font-mono text-[12px] text-fog">
                {step.codes.map((code) => (
                  <li key={code} className={code === "OK" ? "text-leaf-deep" : undefined}>
                    {code}
                  </li>
                ))}
              </ul>
              {i < ORDER.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[15px] top-1/2 z-10 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-canvas text-fog md:flex"
                >
                  <ArrowRight className="size-3.5" />
                </span>
              )}
            </li>
          ))}
        </Glass>

        {/* The eight modules */}
        <Glass className="mt-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-6 py-4 md:px-8">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Rule modules</h3>
            <span className="text-[13px] text-fog">Reason code returned on failure</span>
          </div>
          <ul className="grid md:grid-cols-2">
            {MODULES.map((m, i) => (
              <li
                key={m.contract}
                className={`border-line-soft px-6 py-5 md:px-8 ${i < MODULES.length - 1 ? "border-b" : ""} ${i === MODULES.length - 2 ? "md:border-b-0" : ""} ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[15px] font-semibold text-navy">{m.contract}</span>
                  <span className="font-mono text-[12px] text-rose-deep">{m.code}</span>
                </div>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-tide">{m.rule}</p>
              </li>
            ))}
          </ul>
        </Glass>
        <p className="mt-5 text-[14px] text-fog">
          Modules are configured per share class and can change without a token upgrade. Adding or removing one passes through a 24 hour timelock first.
        </p>

        {/* Identity and claims */}
        <div className="mt-28 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="display text-[34px] font-normal md:text-[42px] [text-wrap:balance]">Signed claims on-chain. Personal data stays off it.</h3>
            <p className="mt-6 text-[15.5px] leading-relaxed text-tide">
              Each company has an HolderRegistry that ties wallets to an on-chain identity. Claims on that identity are signed by verifiers the company trusts, and each carries a topic, a value and an expiry. Names, documents and contact details stay with the verifier, off-chain.
            </p>
          </div>
          <ol className="grid gap-x-10 sm:grid-cols-2 lg:col-span-7">
            {CLAIMS.map((claim) => (
              <li key={claim.topic} className="border-t border-line py-6">
                <p className="font-mono text-[13px] text-navy">{claim.topic}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-tide">{claim.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
