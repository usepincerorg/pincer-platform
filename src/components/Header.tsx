"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GitHubIcon, XIcon } from "@/components/icons";
import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const link = "rounded-full px-3.5 py-2 text-[14px] font-medium text-tide transition-colors hover:bg-haze-2 hover:text-navy";

  return (
    <header className="fixed inset-x-0 top-3 z-40 px-3 md:top-5 md:px-6">
      {/* The pill: a dark glass bar with a gradient edge, fixed above the page */}
      <div
        className={cn(
          "glass glass-pill relative z-10 mx-auto flex h-[60px] max-w-[1120px] items-center pl-5 pr-2 transition-[background] duration-300",
          (scrolled || open) && "glass-strong"
        )}
      >
        <div className="relative z-[1] flex w-full items-center">
          <Logo size={26} />

          <nav aria-label="Main" className="ml-6 hidden items-center xl:flex">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className={link}>
                {item.label}
              </Link>
            ))}
            <a href={SITE.docsUrl} target="_blank" rel="noopener noreferrer" className={link}>
              Docs
            </a>
          </nav>

          <div className="ml-auto hidden items-center xl:flex">
            <Link href={SITE.appHref} className="btn btn-primary btn-sm">
              Enter the Console
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-navy transition-colors hover:bg-haze-2 xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen navigation on small screens */}
      <div id="mobile-nav" className={cn("fixed inset-0 z-0 overflow-y-auto bg-canvas/95 backdrop-blur-2xl xl:hidden", open ? "block" : "hidden")}>
        <div className="container flex min-h-full flex-col pb-10 pt-28">
          <nav aria-label="Mobile menu" className="flex flex-col">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-line-soft py-4 text-[22px] font-medium tracking-[-0.02em] text-navy">
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-b border-line-soft py-4 text-[22px] font-medium tracking-[-0.02em] text-navy"
            >
              Docs
              <ArrowUpRight className="size-4 text-fog" aria-hidden="true" />
            </a>
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <Link href={SITE.appHref} className="btn btn-primary btn-lg w-full" onClick={() => setOpen(false)}>
              Enter the Console
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                <XIcon className="size-3.5" />
                {SITE.xHandle}
              </a>
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                <GitHubIcon className="size-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
