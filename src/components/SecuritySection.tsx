import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const TIMELOCKS = [
  { label: "Wallet recovery", value: "72 h", note: "Never shorter than 48 hours" },
  { label: "Split or multiplier", value: "48 h", note: "Forward or reverse" },
  { label: "Rule change", value: "24 h", note: "Add or remove a module" },
  { label: "Token upgrade", value: "7 days", note: "UUPS through CompanyTimelock" },
  { label: "Pausing", value: "Instant", note: "Unpausing has no delay either" },
] as const;

const ROLES = [
  { role: "ISSUER_ADMIN", holder: "The company's multi-sig", can: "Configures modules, offerings, windows, distributions and votes." },
  { role: "REGISTRAR", holder: "The registrar", can: "Mints and burns against cap table records, and approves recoveries." },
  { role: "OPERATOR", holder: "Pincer's relayers", can: "Relays and sponsors transactions. It can never move holder tokens on its own." },
  { role: "PAUSER", holder: "Issuer or registrar", can: "Pauses and unpauses a share class, recording the reason on-chain." },
] as const;

type Stop = { name: string; body: string; event?: string; done: boolean };

const RECOVERY: Stop[] = [
  { name: "Holder reports the loss", body: "The holder flags the lost wallet and goes through identity verification again with a trusted verifier.", done: true },
  {
    name: "Two of three approve",
    body: "Two of ISSUER_ADMIN, REGISTRAR and OPERATOR must approve the replacement wallet, so no single party can push it through.",
    done: true,
  },
  {
    name: "Publicly scheduled",
    body: "Scheduling happens on-chain and shows the execution time, so the holder and any observer can see the recovery coming.",
    event: "RecoveryScheduled",
    done: true,
  },
  { name: "Waiting period", body: "The balance stays frozen for 72 hours by default, leaving time to cancel a recovery that is mistaken or disputed.", event: "RecoveryCancelled", done: false },
  { name: "Balance moves", body: "The full balance arrives in the replacement wallet, with its lots and holding periods intact.", event: "RecoveryExecuted", done: false },
];

export function SecuritySection() {
  return (
    <section id="security" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              High-stakes actions wait in public, <span className="accent-word">and the company signs</span>.
            </>
          }
          description="Roles are kept apart, every sensitive action goes through a timelocked multi-sig with the issuer as a signer, and a pause always states its reason. Each deployment is rehearsed on testnet with the same configuration before mainnet."
        />

        <Glass as="figure" className="mt-16">
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {TIMELOCKS.map((t, i) => (
            <div key={t.label} className={cn("p-6 md:p-7", i > 0 && "lg:border-l lg:border-line-soft")}>
              <dt className="text-[14px] text-fog">{t.label}</dt>
              <dd className="font-display mt-2 text-[30px] leading-none text-navy">{t.value}</dd>
              <dd className="mt-2.5 text-[13px] leading-snug text-fog">{t.note}</dd>
            </div>
          ))}
          </dl>
        </Glass>
        <p className="mt-4 text-[14px] text-fog">Defaults shown. Each company can tune its timelocks within fixed limits.</p>

        <div className="mt-20 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="text-[22px] tracking-[-0.02em]">Who can do what</h3>
            <ul className="mt-5 divide-y divide-line-soft border-y border-line-soft">
              {ROLES.map((r) => (
                <li key={r.role} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-mono text-[13px] text-navy">{r.role}</span>
                    <span className="text-[13.5px] text-fog">{r.holder}</span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-tide">{r.can}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px] leading-relaxed text-fog">
              Found a vulnerability? Email{" "}
              <a href={`mailto:${SITE.securityEmail}`} className="text-tide underline underline-offset-4 hover:text-navy">
                {SITE.securityEmail}
              </a>
              .
            </p>
          </div>

          <div className="lg:col-span-7">
            <h3 className="text-[22px] tracking-[-0.02em]">Recovery without custody</h3>
            <ol className="mt-6">
              {RECOVERY.map((stop, i) => (
                <li key={stop.name} className="relative grid grid-cols-[32px_1fr] gap-4 pb-8 last:pb-0">
                  {i < RECOVERY.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[15px] top-8 w-px bg-line" />}
                  <span
                    className={cn(
                      "relative flex size-8 items-center justify-center rounded-full text-[13px] font-semibold",
                      stop.done ? "bg-navy text-canvas" : "border border-line bg-canvas text-tide"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="text-[17px] tracking-[-0.015em]">{stop.name}</h4>
                      {stop.event && <span className="font-mono text-[12.5px] text-fog">{stop.event}</span>}
                    </div>
                    <p className="mt-1.5 max-w-[560px] text-[15px] leading-relaxed text-tide">{stop.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
