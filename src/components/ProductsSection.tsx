import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";
import { SITE, docsHref } from "@/lib/site";

const PRODUCTS = [
  {
    label: "Console",
    audience: "Built for issuers",
    title: "Run your equity from one workspace",
    body: "Boards and finance teams configure share classes and transfer rules, launch offerings and Liquidity Windows, and approve sensitive actions through a multi-sig the company signs on.",
    points: [
      "Upload the cap table, reconcile it and invite holders",
      "Offerings escrowed in USDG that mint at close or refund",
      "Distributions, shareholder votes and anchored disclosures",
      "Reference Valuations labeled with their source and date",
    ],
    cta: { label: "Enter the Console", href: SITE.appHref },
  },
  {
    label: "Portfolio",
    audience: "Built for shareholders",
    title: "Buy, sell and hold under the company’s rules",
    body: "Positions show lot by lot, with locked and unlocked shares separated. Holders subscribe to offerings, sell in Liquidity Windows, claim distributions, vote and read company documents here, and gas is sponsored.",
    points: [
      "Vested and unvested shares shown side by side",
      "A plain-language reason for any rule, before you sign",
      "Identity checks that usually finish the same day",
      "USDG proceeds arrive in the same transaction as the sale",
    ],
    cta: { label: "Go to Portfolio", href: SITE.portfolioHref },
  },
  {
    label: "Explorer and API",
    audience: "Open to anyone",
    title: "A public record and the tools to build on it",
    body: "For every company, the Explorer shows supply, holder count, rules, offerings, windows, valuations and events without any personal data. Venues and wallets use the API and SDK to read the same records and run the same transfer checks.",
    points: [
      "Each issuance, transfer and corporate action linked on-chain",
      "Transfer checks before submission, answered with a reason code",
      "Signed webhooks for every on-chain event",
      "Sandbox keys backed by Robinhood Chain testnet",
    ],
    cta: { label: "View the Explorer", href: SITE.explorerHref },
  },
] as const;

export function ProductsSection() {
  return (
    <section id="products" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              One ownership record, <span className="accent-word">seen from every side</span>.
            </>
          }
          description="Companies operate in the Console, holders in Portfolio, the public in the Explorer and developers through the API. All of them read the same contracts on Robinhood Chain."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <Glass as="article" key={product.label} className="flex flex-col">
              <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-7 py-5 md:px-8">
                <p className="text-[15px] font-semibold text-navy">{product.label}</p>
                <p className="text-[13px] text-fog">{product.audience}</p>
              </div>
              <div className="flex flex-1 flex-col px-7 pb-7 pt-8 md:px-8 md:pb-8">
                <h3 className="display text-[28px] font-normal md:text-[32px]">{product.title}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-tide">{product.body}</p>
                <ul className="mt-7 space-y-3 text-[14.5px] leading-snug text-tide">
                  {product.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <Check className="mt-[2px] size-4 shrink-0 text-lagoon" strokeWidth={2} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-9">
                  <Link href={product.cta.href} className="btn btn-secondary btn-sm group">
                    {product.cta.label}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Glass>
          ))}
        </div>

        <p className="mt-8 text-[14px] text-fog">
          Read more about each surface in the{" "}
          <a href={docsHref("products/console")} target="_blank" rel="noopener noreferrer" className="text-tide underline decoration-line underline-offset-4 hover:text-navy">
            product docs
          </a>
          .
        </p>
      </div>
    </section>
  );
}
