import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Glass } from "@/components/atmosphere";
import { docsHref } from "@/lib/site";

const FEATURES = [
  {
    title: "A REST API with a typed SDK",
    body: "Resources cover companies, share classes, holders, offerings, windows, distributions, proposals, documents and valuations. Responses are JSON with cursor pagination, and every POST accepts an Idempotency-Key.",
  },
  {
    title: "Webhooks you can verify",
    body: "Every on-chain event arrives with its block number, transaction hash and confirmation level. Each delivery is signed with HMAC-SHA256 and retried for up to three days.",
  },
  {
    title: "A sandbox that mirrors mainnet",
    body: "Keys that start with sk_test_ point at Robinhood Chain testnet, with the same contracts and reason codes as mainnet.",
  },
  {
    title: "Publishable keys for the browser",
    body: "With pk_live_ keys, browsers and wallets can run transfer checks and read public data, Explorer data included, without a server.",
  },
] as const;

const WEBHOOKS = ["share_class.deployed", "holder.verified", "transfer.settled", "transfer.blocked", "offering.closed", "liquidity_window.cleared"] as const;

/* Colour classes for the snippet, so it needs no syntax highlighter. */
const C = {
  kw: "text-lagoon",
  str: "text-leaf-deep",
  com: "text-fog",
  fn: "text-navy",
} as const;

export function DevelopersSection() {
  return (
    <section id="developers" className="section relative scroll-mt-24">
      <div className="container">
        <SectionHeading
          title={
            <>
              Check a transfer before it is sent. <span className="accent-word">From anywhere.</span>
            </>
          }
          description="Integrate the rule engine once, and a venue or wallet works with every company on Pincer. canTransfer returns the same answer on-chain, through the API and in the SDK."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* The snippet */}
          <div className="min-w-0 lg:col-span-7">
            <Glass strong className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
                <span className="font-mono text-[12.5px] text-tide">check-transfer.ts</span>
                <span className="font-mono text-[12.5px] text-fog">@pincer/sdk</span>
              </div>
              <pre className="scrollbar-none overflow-x-auto px-5 py-6 font-mono text-[13px] leading-[1.75] text-tide">
                <code>
                  <span className={C.com}>{"$ npm install @pincer/sdk"}</span>
                  {"\n\n"}
                  <span className={C.kw}>import</span>
                  {" { Pincer } "}
                  <span className={C.kw}>from</span> <span className={C.str}>{'"@pincer/sdk"'}</span>
                  {";\n\n"}
                  <span className={C.kw}>const</span>
                  {" pincer = "}
                  <span className={C.kw}>new</span> <span className={C.fn}>Pincer</span>
                  {"(process.env.PINCER_SECRET_KEY);\n\n"}
                  <span className={C.kw}>const</span>
                  {" check = "}
                  <span className={C.kw}>await</span>
                  {" pincer.transfers."}
                  <span className={C.fn}>check</span>
                  {"({\n  share_class: "}
                  <span className={C.str}>{'"cls_8QwZr4Tn"'}</span>
                  {",\n  from: "}
                  <span className={C.str}>{'"0x71c3a0d5f1b84e2c9a07d36b5e8f12c4d0a39e4a"'}</span>
                  {",\n  to: "}
                  <span className={C.str}>{'"0x4e8817b3a9c25d06e4f71b8a2d93c5e6f048c0b1"'}</span>
                  {",\n  amount: "}
                  <span className={C.str}>{'"500"'}</span>
                  {",\n});\n\n"}
                  <span className={C.com}>{"// {"}</span>
                  {"\n"}
                  <span className={C.com}>{"//   ok: false,"}</span>
                  {"\n"}
                  <span className={C.com}>{'//   reason_code: "NOT_ELIGIBLE",'}</span>
                  {"\n"}
                  <span className={C.com}>{'//   message: "The recipient hasn\'t completed eligibility for this share class."'}</span>
                  {"\n"}
                  <span className={C.com}>{"// }"}</span>
                </code>
              </pre>
            </Glass>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-navy">Events you can subscribe to</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[12.5px] text-tide sm:grid-cols-3">
                {WEBHOOKS.map((w) => (
                  <li key={w} className="truncate">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What comes with it */}
          <div className="min-w-0 lg:col-span-5">
            <ul className="divide-y divide-line-soft border-y border-line-soft">
              {FEATURES.map((f) => (
                <li key={f.title} className="py-6">
                  <div>
                    <h3 className="text-[16px] leading-snug tracking-[-0.015em]">{f.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-tide">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={docsHref("developers/quickstart")} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Start the quickstart
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <a href={docsHref("developers/api-reference")} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Read the API reference
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
