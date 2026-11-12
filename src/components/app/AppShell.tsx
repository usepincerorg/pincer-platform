"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronsUpDown,
  CircleDollarSign,
  FileText,
  Gavel,
  Globe,
  Layers,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Repeat,
  Telescope,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Blockie } from "@/components/Blockie";
import { useSandbox } from "@/lib/pincer/store";
import { useAuth } from "@/lib/pincer/auth";
import { byId, classesOf, shortHex } from "@/lib/pincer/engine";
import { Drawer } from "@/components/app/ui";
import { ConsoleOnboarding, CreateCompanyForm, LoadError, SignIn, Splash } from "@/components/app/Onboarding";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const SECTIONS: { id: "console" | "portfolio" | "explorer"; label: string; icon: typeof LayoutDashboard; items: NavItem[] }[] = [
  {
    id: "console",
    label: "Console",
    icon: Building2,
    items: [
      { href: "/console", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/console/cap-table", label: "Ownership", icon: Users },
      { href: "/console/share-classes", label: "Share classes", icon: Layers },
      { href: "/console/offerings", label: "Capital raises", icon: CircleDollarSign },
      { href: "/console/liquidity", label: "Liquidity Windows", icon: Repeat },
      { href: "/console/corporate-actions", label: "Payouts and voting", icon: Gavel },
      { href: "/console/disclosures", label: "Reports and valuations", icon: FileText },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    items: [
      { href: "/portfolio", label: "Positions", icon: Wallet, exact: true },
      { href: "/portfolio/invest", label: "Invest", icon: CircleDollarSign },
      { href: "/portfolio/liquidity", label: "Liquidity Windows", icon: CalendarClock },
      { href: "/portfolio/actions", label: "Payouts and voting", icon: Gavel },
      { href: "/portfolio/documents", label: "Records", icon: FileText },
    ],
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: Telescope,
    items: [{ href: "/explorer", label: "Companies and events", icon: Telescope }],
  },
];

function activeSection(pathname: string) {
  return SECTIONS.find((s) => pathname.startsWith(`/${s.id}`))?.id ?? "console";
}

/** A label that appears beside an icon when the sidebar is collapsed to a rail. */
function RailTip({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded-lg border border-line bg-popover px-2.5 py-1.5 text-[12.5px] font-medium text-navy opacity-0 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.7)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

/** The signed-in account: the company the Console administers, the holder identity, and sign-out. */
function AccountSwitcher({ section, rail = false }: { section: "console" | "portfolio" | "explorer"; rail?: boolean }) {
  const { s, viewer, setViewer, me } = useSandbox();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!auth.authenticated) {
    return (
      <button type="button" onClick={auth.login} disabled={!auth.ready} aria-label="Sign in" className={cn("btn btn-primary btn-sm w-full", rail && "px-0")}>
        <LogIn className="size-3.5" aria-hidden="true" />
        {!rail && "Sign in"}
      </button>
    );
  }

  const company = byId(s.companies, viewer.companyId);
  const holder = byId(s.holders, viewer.holderId);
  const companies = (me?.companyIds ?? []).map((id) => byId(s.companies, id)).filter((c) => !!c);
  const isConsole = section === "console" && !!company;
  const title = isConsole ? company.name : (holder?.name ?? auth.email ?? "My account");
  const sub = isConsole ? "Company admin" : holder ? shortHex(holder.wallets[0]) : (auth.email ?? "");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={rail ? title : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl border border-line bg-haze text-left transition-colors hover:border-lagoon-line",
          rail ? "justify-center p-1.5" : "px-3 py-2.5"
        )}
      >
        {isConsole ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-haze-2 text-[12px] font-semibold text-navy">
            {company.name.slice(0, 1)}
          </span>
        ) : (
          <span className="size-8 shrink-0 overflow-hidden rounded-full bg-haze-2">{holder && <Blockie address={holder.wallets[0]} className="block size-full" />}</span>
        )}
        {!rail && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-navy">{title}</span>
              <span className={cn("block truncate text-[12px] text-fog", !isConsole && "font-mono")}>{sub}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-fog" aria-hidden="true" />
          </>
        )}
        <RailTip show={rail && !open}>{title}</RailTip>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 max-h-[420px] overflow-y-auto rounded-xl border border-line bg-popover/95 p-1.5 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl",
            rail ? "bottom-0 left-full ml-4 w-[264px]" : "inset-x-0 bottom-full mb-2"
          )}
        >
          {section === "console" && (
            <>
              <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-fog">Companies you manage</p>
              {companies.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => {
                    setViewer({ companyId: x.id });
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-haze-2",
                    x.id === viewer.companyId ? "text-navy" : "text-tide"
                  )}
                >
                  <span className="truncate">{x.name}</span>
                  {x.id === viewer.companyId && <CheckCircle2 className="size-3.5 shrink-0 text-lagoon" aria-hidden="true" />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-tide transition-colors hover:bg-haze-2 hover:text-navy"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add a company
              </button>
              <div className="my-1.5 border-t border-line-soft" />
            </>
          )}
          <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-fog">Logged in as</p>
          <p className="truncate px-2.5 pb-2 text-[13px] text-navy">{auth.email ?? (auth.wallet ? shortHex(auth.wallet) : holder?.name)}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void auth.logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-tide transition-colors hover:bg-haze-2 hover:text-navy"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title="Add a company">
        <CreateCompanyForm onDone={() => setCreating(false)} />
      </Drawer>
    </div>
  );
}

/** Shows sign-in, setup or onboarding in place of a page until the page can render. */
function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { s, status, error, me, viewer } = useSandbox();
  const auth = useAuth();
  const section = pathname.split("/")[1] ?? "";

  if (!auth.ready || status === "loading") return <Splash />;
  if (status === "error") return <LoadError message={error ?? "Pincer couldn't fetch your data."} />;
  if (section === "explorer") return <>{children}</>;
  if (!auth.authenticated) return <SignIn section={section} />;
  if (!me) return <Splash label="Fetching your account" />;
  if (section === "console" && (!me.companyIds.length || !byId(s.companies, viewer.companyId) || classesOf(s, viewer.companyId).length === 0)) return <ConsoleOnboarding />;
  return <>{children}</>;
}

function Sidebar({ onNavigate, rail = false, onToggleRail }: { onNavigate?: () => void; rail?: boolean; onToggleRail?: () => void }) {
  const pathname = usePathname();
  const active = activeSection(pathname);
  const section = SECTIONS.find((s) => s.id === active)!;
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  const items: (NavItem & { on: boolean })[] = [
    ...section.items.map((item) => ({ ...item, on: isActive(item) })),
    { href: "/account", label: "Your account", icon: UserRound, on: pathname.startsWith("/account") },
  ];

  const linkBase = "group relative flex items-center rounded-lg text-[13.5px] font-medium transition-colors";

  return (
    <div className={cn("flex h-full flex-col", rail ? "items-stretch gap-5 px-3 py-4" : "gap-6 px-4 py-5")}>
      {/* Brand row */}
      <div className={cn("flex items-center", rail ? "flex-col gap-3" : "justify-between pl-1.5")}>
        <Logo size={rail ? 28 : 28} withWordmark={!rail} href="/" />
        {onToggleRail && (
          <button
            type="button"
            onClick={onToggleRail}
            aria-label={rail ? "Show full sidebar" : "Shrink sidebar"}
            className="inline-flex size-8 items-center justify-center rounded-full text-fog transition-colors hover:bg-haze-2 hover:text-navy"
          >
            {rail ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Product switcher */}
      <div className={cn("border border-line-soft bg-haze p-1", rail ? "flex flex-col gap-1 rounded-2xl" : "grid grid-cols-3 gap-1 rounded-full")}>
        {SECTIONS.map((s) => {
          const on = s.id === active;
          const Icon = s.icon;
          return (
            <Link
              key={s.id}
              href={`/${s.id}`}
              onClick={onNavigate}
              aria-label={rail ? s.label : undefined}
              aria-current={on ? "true" : undefined}
              className={cn(
                "group relative flex items-center justify-center rounded-full text-[12.5px] font-medium transition-colors",
                rail ? "h-9" : "px-2 py-1.5",
                on ? "bg-navy text-canvas" : "text-tide hover:text-navy"
              )}
            >
              {rail ? <Icon className="size-4" aria-hidden="true" /> : s.label}
              <RailTip show={rail}>{s.label}</RailTip>
            </Link>
          );
        })}
      </div>

      <nav aria-label={section.label} className="flex-1">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={item.on ? "page" : undefined}
                  aria-label={rail ? item.label : undefined}
                  className={cn(
                    linkBase,
                    rail ? "h-10 justify-center" : "gap-3 px-3 py-2.5",
                    item.on ? "bg-haze-2 text-navy" : "text-tide hover:bg-haze hover:text-navy"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", item.on ? "text-navy" : "text-fog group-hover:text-tide")} aria-hidden="true" />
                  {!rail && <span className="truncate">{item.label}</span>}
                  <RailTip show={rail}>{item.label}</RailTip>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 space-y-0.5 border-t border-line-soft pt-4">
          <a
            href={SITE.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={rail ? "Docs" : undefined}
            className={cn(linkBase, "text-[13px] text-fog hover:bg-haze hover:text-navy", rail ? "h-10 justify-center" : "gap-3 px-3 py-2")}
          >
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />
            {!rail && (
              <>
                Docs
                <ArrowUpRight className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </>
            )}
            <RailTip show={rail}>Docs</RailTip>
          </a>
          <Link
            href="/"
            onClick={onNavigate}
            aria-label={rail ? SITE.domain : undefined}
            className={cn(linkBase, "text-[13px] text-fog hover:bg-haze hover:text-navy", rail ? "h-10 justify-center" : "gap-3 px-3 py-2")}
          >
            <Globe className="size-4 shrink-0" aria-hidden="true" />
            {!rail && SITE.domain}
            <RailTip show={rail}>{SITE.domain}</RailTip>
          </Link>
        </div>
      </nav>

      <AccountSwitcher section={active} rail={rail} />
    </div>
  );
}

/**
 * The workspace's top bar: where you are on the left; on the right, whether a
 * change is being saved. A glass pill on wide screens; on phones the menu bar already
 * sits at the top, so only the saving note shows.
 */
function TopBar() {
  const pathname = usePathname();
  const { saving } = useSandbox();
  const section = SECTIONS.find((x) => x.id === activeSection(pathname))!;
  const item =
    section.items.find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href))) ??
    (pathname.startsWith("/account") ? { label: "Your account" } : undefined);
  const saveNote = saving && (
    <span className="flex items-center gap-2 text-[12.5px] text-tide">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      Saving changes
    </span>
  );
  return (
    <>
      <div className="glass glass-pill sticky top-4 z-30 mx-4 mt-4 hidden h-12 items-center pl-5 pr-2 lg:mx-10 lg:flex">
        <div className="flex w-full items-center gap-4">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px]">
            <Link href={`/${section.id}`} className="text-fog transition-colors hover:text-navy">
              {section.label}
            </Link>
            {item && item.label !== section.label && (
              <>
                <span aria-hidden="true" className="text-pale">/</span>
                <span className="truncate font-medium text-navy">{item.label}</span>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-4" aria-live="polite">
            {saveNote}
          </div>
        </div>
      </div>
      {saving && <div className="px-4 pt-3 lg:hidden">{saveNote}</div>}
    </>
  );
}

/** Transaction receipts, stacked in the corner and dismissed after a few seconds. */
function Receipts() {
  const { receipts, dismiss, s } = useSandbox();
  useEffect(() => {
    if (!receipts.length) return;
    const t = setTimeout(() => dismiss(receipts[receipts.length - 1].id), 7000);
    return () => clearTimeout(t);
  }, [receipts, dismiss]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(400px,calc(100vw-32px))] flex-col gap-2">
      {receipts.map((r) => (
        <div key={r.id} className="card card-tint pointer-events-auto bg-popover/95 animate-in fade-in slide-in-from-bottom-2 p-4 duration-300">
          <div className="flex items-start gap-3">
            {r.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-deep" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-rose-deep" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-navy">{r.title}</p>
              {r.detail && <p className="mt-1 text-[12.5px] leading-relaxed text-tide">{r.detail}</p>}
              {r.call && <p className="mt-2 truncate font-mono text-[11px] text-fog">{r.call}</p>}
              {r.tx && (
                <p className="mt-1 font-mono text-[11px] text-fog">
                  tx {shortHex(r.tx)} · {s.network.name}
                </p>
              )}
            </div>
            <button type="button" onClick={() => dismiss(r.id)} aria-label="Close receipt" className="text-fog transition-colors hover:text-navy">
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const RAIL_KEY = "pincer.sidebar.rail";

function readRail() {
  try {
    return window.localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [rail, setRail] = useState(readRail);
  const pathname = usePathname();
  const active = SECTIONS.find((s) => s.id === activeSection(pathname))!;

  const toggleRail = () =>
    setRail((v) => {
      try {
        window.localStorage.setItem(RAIL_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });

  const panel = "glass glass-strong";

  return (
    <div className="min-h-screen">
      {/* Desktop: a floating panel inset from the viewport edges */}
      <aside
        className={cn(
          "fixed bottom-4 left-4 top-4 z-40 hidden transition-[width] duration-200 ease-out lg:block",
          panel,
          rail ? "w-[76px] overflow-visible" : "w-[264px] overflow-y-auto"
        )}
      >
        <Sidebar rail={rail} onToggleRail={toggleRail} />
      </aside>

      {/* Mobile: a floating top bar and a floating drawer */}
      <div className="sticky top-0 z-40 px-3 pt-3 lg:hidden">
        <div className={cn("glass-pill flex h-14 items-center justify-between pl-4 pr-2", panel)}>
          <Logo size={24} href="/" />
          <span className="text-[13px] font-medium text-tide">{active.label}</span>
          <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" className="inline-flex size-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-haze-2">
            <Menu className="size-4" />
          </button>
        </div>
      </div>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className={cn("absolute bottom-3 left-3 top-3 w-[min(300px,calc(100vw-24px))] overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-200", panel)}>
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="absolute right-3 top-4 z-10 inline-flex size-8 items-center justify-center rounded-full text-fog transition-colors hover:bg-haze-2 hover:text-navy">
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}

      <main className={cn("min-w-0 pb-16 transition-[padding] duration-200 ease-out xl:pr-4", rail ? "lg:pl-[92px] xl:pl-[108px]" : "lg:pl-[280px] xl:pl-[296px]")}>
        {/* The workspace frame: hairline rails at its edges, everything centred inside */}
        <div className="relative mx-auto min-h-screen max-w-[1360px] xl:border-x xl:border-line-soft">
          <TopBar />
          <Gate>{children}</Gate>
        </div>
      </main>

      <Receipts />
    </div>
  );
}
