import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { SITE } from "@/lib/site";

export function CTASection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/*
       * Panes of glass lit from below, shown sharp. The headline sits in the
       * dark upper half of the photograph and the lit edges run beneath the
       * actions. Edges fade into the ink so the band has no hard border.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 aspect-[2400/1345] w-[max(100%,1100px)] -translate-x-1/2 bg-cover bg-center mix-blend-screen [mask-image:linear-gradient(90deg,transparent_0%,#000_22%,#000_78%,transparent_100%),linear-gradient(180deg,transparent_30%,#000_55%,#000_80%,transparent_100%)] [mask-composite:intersect]"
        style={{ backgroundImage: "url(/images/cta-bg.jpg)" }}
      />
      <div aria-hidden="true" className="grain -z-10" />
      <div className="container flex flex-col items-center pb-[300px] pt-32 text-center md:pb-[380px] md:pt-44">
        <h2 className="display max-w-[900px] text-[42px] md:text-[68px] [text-wrap:balance]">
          Bring your shares <span className="whitespace-nowrap">on-chain.</span> <span className="accent-word">Keep the rules yours.</span>
        </h2>
        <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-tide md:text-[18px]">
          Tell us about your company and the share classes you want to issue. We will walk your team through the Console, test your setup on testnet, and deploy when you are ready.
        </p>
        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <a href={`mailto:${SITE.contactEmail}`} className="btn btn-primary btn-lg">
            <Mail className="size-4" aria-hidden="true" />
            Talk to our team
          </a>
          <Link href={SITE.appHref} className="btn btn-secondary btn-lg">
            Enter the Console
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-7 text-[14px] text-fog">Most companies go live in under four weeks · {SITE.contactEmail}</p>
      </div>
    </section>
  );
}
