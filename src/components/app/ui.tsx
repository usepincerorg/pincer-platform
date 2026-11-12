"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, X, XCircle } from "lucide-react";
import { Blockie } from "@/components/Blockie";
import { shortHex } from "@/lib/pincer/engine";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Page structure: a header, a row of figures, then panels */
/* ------------------------------------------------------------------ */

export type Accent = "lagoon" | "amber" | "leaf" | "rose";

export interface ReadoutProps {
  label: string;
  value: string;
  hint?: string;
  accent?: Accent;
}

const accentText: Record<Accent, string> = {
  lagoon: "text-lagoon-deep",
  amber: "text-amber-deep",
  leaf: "text-leaf-deep",
  rose: "text-rose-deep",
};

/** One figure, for use inside a strip or a panel: label, value, then a line of context. */
export function Readout({ label, value, hint, accent }: ReadoutProps) {
  if (/^[^1-9]*0[^1-9]*$/.test(value)) accent = undefined;
  return (
    <div className="flex min-w-0 flex-col px-5 py-4 md:px-6 md:py-5">
      <span className="truncate text-[12.5px] leading-snug text-fog">{label}</span>
      <div className={cn("font-display mt-2.5 truncate text-[26px] leading-none md:text-[30px]", accent ? accentText[accent] : "text-navy")}>{value}</div>
      {hint && <div className="mt-2 text-[12px] leading-snug text-fog">{hint}</div>}
    </div>
  );
}

/**
 * The key figures of a page as one glass strip divided by hairlines, rather
 * than a card per number.
 */
export function StatStrip({ stats, className }: { stats: ReadoutProps[]; className?: string }) {
  return (
    <div
      className={cn(
        "glass grid grid-cols-2 [&>*]:border-line-soft",
        stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        // Hairlines between cells: a right edge on each cell but the last in its row, a top edge from the second row on
        "[&>*:nth-child(2n+1)]:border-r [&>*:nth-child(n+3)]:border-t lg:[&>*]:border-t-0 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0",
        className
      )}
    >
      {stats.map((s) => (
        <Readout key={s.label} {...s} />
      ))}
    </div>
  );
}

/** The page header: a title, an optional line of context and action, then the key figures as one strip. */
export function PageHeader({ title, description, action, stats }: { title: string; description?: string; action?: React.ReactNode; stats?: ReadoutProps[] }) {
  return (
    <header className="px-4 pt-6 md:px-10 md:pt-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[34px] leading-[1.05] md:text-[44px] [text-wrap:balance]">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-tide">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {stats && stats.length > 0 && <StatStrip stats={stats} className="mt-8" />}
      <div aria-hidden="true" className="seam seam-full -mx-4 mt-8 hidden md:-mx-10 md:mt-10 xl:block" />
    </header>
  );
}

/** The working area under the header. */
export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-4 py-6 md:px-10 md:py-8", className)}>{children}</div>;
}

/**
 * A two-column workspace: the main stage, and a narrower operational column
 * that holds still beside it on wide screens and stacks under it otherwise.
 */
export function Workspace({ aside, children, className }: { aside: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]", className)}>
      <div className="min-w-0 space-y-5">{children}</div>
      <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">{aside}</aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("card min-w-0 p-5 md:p-6", className)}>{children}</section>;
}

/**
 * A panel's header bar: the title and its action on one hairline-divided row
 * across the top of the panel, with an optional line of context under it.
 */
export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="-mx-5 -mt-5 mb-5 flex flex-col gap-3 border-b border-line-soft px-5 py-4 sm:flex-row sm:items-start sm:justify-between md:-mx-6 md:-mt-6 md:mb-6 md:px-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] leading-snug tracking-[-0.012em]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fog">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export type Tone = Accent | "muted";

/** A stat on its own card. */
export function StatCard(props: ReadoutProps) {
  return (
    <div className="card min-w-0">
      <Readout {...props} />
    </div>
  );
}

/** A small label over a figure, for use inside cards. */
export function StatPill({ label, value, tone, sub, onTint = false }: { label: string; value: string; tone?: Tone; sub?: string; onTint?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-lg px-4 py-3", onTint ? "bg-haze/80" : "bg-haze")}>
      <div className="truncate text-[12px] font-medium text-fog">{label}</div>
      <div
        className={cn(
          "mt-1 truncate font-display text-[20px] leading-none",
          tone === "amber" ? "text-amber-deep" : tone === "leaf" ? "text-leaf-deep" : tone === "rose" ? "text-rose-deep" : tone === "lagoon" ? "text-lagoon-deep" : "text-navy"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-[11.5px] text-fog">{sub}</div>}
    </div>
  );
}

/** A short status word. */
export function Badge({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-medium leading-[1.4]",
        tone === "lagoon" && "bg-lagoon-soft text-lagoon-deep",
        tone === "amber" && "bg-amber-soft text-amber-deep",
        tone === "leaf" && "bg-leaf-soft text-leaf-deep",
        tone === "rose" && "bg-rose-soft text-rose-deep",
        tone === "muted" && "bg-haze text-tide"
      )}
    >
      {typeof children === "string" && /^[A-Z]+$/.test(children) ? children[0] + children.slice(1).toLowerCase() : children}
    </span>
  );
}

/** A wallet address with its blockie, shortened. */
export function Address({ address, size = 22, className }: { address: string | null | undefined; size?: number; className?: string }) {
  if (!address) return <span className="text-fog">None</span>;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)} title={address}>
      <span className="shrink-0 overflow-hidden rounded-full ring-1 ring-line" style={{ width: size, height: size }}>
        <Blockie address={address} className="block size-full" />
      </span>
      <span className="readout truncate font-mono text-[12.5px] text-navy">{shortHex(address)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-2 block text-[13px] font-medium text-navy">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] leading-snug text-fog">{hint}</span>}
    </label>
  );
}

export function Input({ suffix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  const numeric = props.inputMode === "decimal" || props.inputMode === "numeric";
  const input = <input {...props} className={cn("input h-11", numeric && "readout", suffix && "pr-16", props.className)} />;
  if (!suffix) return input;
  return (
    <span className="relative block">
      {input}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-haze-2 px-1.5 py-0.5 text-[11.5px] font-semibold text-tide">
        {suffix}
      </span>
    </span>
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative block", className)}>
      <select {...props} className="input h-11 cursor-pointer appearance-none pr-10" />
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fog" aria-hidden="true" />
    </span>
  );
}

/** A row of options, for short choices such as a side or a scope. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  label,
  className,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1 rounded-xl border border-line-soft bg-haze p-1", disabled && "opacity-60", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed",
              active ? "bg-haze-2 text-navy shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]" : "text-tide hover:text-navy"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** An on/off switch with a title and a line of explanation. */
export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 px-1 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-navy">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-fog">{hint}</span>}
      </span>
      <span className={cn("relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-sky" : "bg-haze-2")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full transition-all", checked ? "left-[18px] bg-canvas" : "left-0.5 bg-tide")} />
      </span>
    </button>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "secondary" }) {
  return (
    <button
      {...props}
      className={cn(
        "btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-navy">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-tide">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const NOTICE_ICON = { info: Info, success: CheckCircle2, warn: AlertTriangle, error: XCircle } as const;

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "success"; children: React.ReactNode }) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed",
        tone === "info" && "bg-lagoon-soft text-navy",
        tone === "success" && "bg-leaf-soft text-leaf-deep",
        tone === "warn" && "bg-amber-soft text-amber-deep",
        tone === "error" && "bg-rose-soft text-rose-deep"
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "info" && "text-lagoon")} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export function Table({ children, minWidth = 640 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="scrollbar-none -mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
      <table className="ledger w-full border-collapse text-left text-[13.5px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("whitespace-nowrap pb-3 pr-4 text-[12px] font-medium text-fog", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("py-3.5 pr-4 align-middle text-tide", className)}>{children}</td>;
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 rounded-lg bg-haze" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gauges                                                              */
/* ------------------------------------------------------------------ */

/** A progress bar in the accent. */
export function Meter({ value, className, tone = "lagoon" }: { value: number; className?: string; tone?: "lagoon" | "amber" | "rose" }) {
  const pct = Math.max(0, Math.min(100, value));
  const fill =
    tone === "amber"
      ? "var(--color-amber)"
      : tone === "rose"
        ? "var(--color-rose)"
        : "var(--color-sky)";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-haze-2", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays and links                                                  */
/* ------------------------------------------------------------------ */

/** A panel that slides in from the right over a dimmed page. Escape or the backdrop closes it. */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close panel" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm animate-in fade-in" />
      <div className="glass glass-strong absolute inset-y-2 right-2 flex w-[min(560px,calc(100vw-16px))] flex-col overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <p className="truncate text-[15px] font-semibold text-navy">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-9 items-center justify-center rounded-full bg-haze text-tide transition-colors hover:bg-haze-2 hover:text-navy">
            <X className="size-4" />
          </button>
        </div>
        <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-navy underline decoration-lagoon-muted underline-offset-4 hover:decoration-navy">
      {children}
    </Link>
  );
}
