import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GitHubIcon, XIcon } from "@/components/icons";
import { DOCS_LINKS, SITE, docsHref } from "@/lib/site";

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Console", href: SITE.appHref },
      { label: "Portfolio", href: SITE.portfolioHref },
      { label: "Explorer", href: SITE.explorerHref },
      { label: "API and SDK", href: docsHref("products/api-and-sdk"), external: true },
      { label: "Rule engine", href: "/#rules" },
      { label: "Liquidity options", href: "/#liquidity" },
    ],
  },
  {
    heading: "Documentation",
    links: DOCS_LINKS.map((d) => ({ label: d.label, href: docsHref(d.path), external: true })),
  },
  {
    heading: "Get in touch",
    links: [
      { label: "Talk to our team", href: `mailto:${SITE.contactEmail}` },
      { label: "Report a vulnerability", href: `mailto:${SITE.securityEmail}` },
      { label: SITE.xHandle, href: SITE.xUrl, external: true },
      { label: "GitHub", href: SITE.githubUrl, external: true },
    ],
  },
];

export function Footer() {
  const iconLink =
    "inline-flex size-10 items-center justify-center rounded-full border border-line text-tide transition-colors hover:bg-haze-2 hover:text-navy";
  return (
    <footer className="relative">
      <div className="container pb-10 pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-8">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Logo size={28} />
            <p className="mt-5 text-[14.5px] leading-relaxed text-tide">
              Private companies use Pincer to issue, govern and trade their shares as tokens on Robinhood Chain, with the rules
              built into the token.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" aria-label="Follow Pincer on X" className={iconLink}>
                <XIcon className="size-3.5" />
              </a>
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Pincer source on GitHub" className={iconLink}>
                <GitHubIcon className="size-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-[14px] font-semibold tracking-[-0.01em]">{column.heading}</h3>
              <ul className="mt-5 flex flex-col gap-2.5">
                {column.links.map((link) => {
                  const cls = "text-[14px] text-tide transition-colors hover:text-navy";
                  return (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {link.label}
                        </a>
                      ) : link.href.startsWith("mailto:") ? (
                        <a href={link.href} className={cls}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={cls}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-line pt-7 text-[13px] text-fog md:flex-row md:items-center">
          <p>&copy; 2026 Pincer · {SITE.domain}</p>
          <p>Independent, building on Robinhood Chain, with settlement on Ethereum.</p>
        </div>
      </div>
    </footer>
  );
}
