import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ConsoleDemo } from "@/components/demo/ConsoleDemo";
import { Atmosphere } from "@/components/atmosphere";
import { SITE } from "@/lib/site";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <Atmosphere image="/images/hero-asset.jpg" focus="50% 12%" />

      <div className="container pb-20 pt-[148px] md:pb-28 md:pt-[196px]">
        <div className="mx-auto max-w-[1160px] text-center">
          <h1 className="display text-[42px] leading-[1.02] md:text-[64px] lg:text-[80px]">
            <span className="mask-line">
              <span>
                Private stock tokens, <br/>issued <span className="whitespace-nowrap">on Robinhood Chain.</span>
              </span>
            </span>
          </h1>
          <p className="animate-reveal delay-3 mx-auto mt-8 max-w-[640px] text-[17px] leading-[1.6] text-tide md:text-[19px]">
            Pincer lets a private company issue its shares as tokens on Robinhood Chain. The token tests every transfer against the company&apos;s rules
            before it settles, and every issuance, offering and corporate action is recorded where anyone can check it.
          </p>
          <div className="animate-reveal delay-4 mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={SITE.appHref} className="btn btn-primary btn-lg">
              Enter the Console
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={SITE.explorerHref} className="btn btn-secondary btn-lg">
              View the Explorer
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* The Console at work: a live window that plays the issuer's main flow */}
        <div className="animate-reveal delay-5 mt-20 md:mt-24 md:ml-[calc(50%-40vw)] md:w-[80vw]">
          <ConsoleDemo />
        </div>

        <p className="mt-10 text-center text-[14px] text-fog">Issuer-sponsored by design: each Pincer token is issued by the company it represents.</p>
      </div>
    </section>
  );
}
