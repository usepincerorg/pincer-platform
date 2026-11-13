"use client";

import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, UserPlus } from "lucide-react";
import { Badge, EmptyState, Meter, PageBody, PageHeader, Panel, PanelHeader, Table, Td, Th, Workspace, type Tone } from "@/components/app/ui";
import {
  CLAIM_LABEL,
  MODULE_META,
  claimState,
  fmtCompactUsd,
  fmtDay,
  fmtPct,
  fmtRelative,
  fmtShares,
  fmtUsd,
  holdersOf,
  identityStatus,
  latestValuation,
  previewClearing,
  tally,
  totalSupply,
  VALUATION_SOURCE_LABEL,
  byId, plural } from "@/lib/pincer/engine";
import { Bar, Hex, LinkButton, MoreLink, Num, registryOf, useConsole } from "./_components/kit";

type Attention = { key: string; tone: Tone; label: string; title: string; detail: string; href: string };

export default function Page() {
  const { s, now, company, classes } = useConsole();
  const primary = classes[0];

  const holderIds = new Set<string>();
  for (const c of classes) for (const h of holdersOf(s, c.id)) holderIds.add(h.holder.id);
  const verified = [...holderIds].filter((id) => identityStatus(byId(s.holders, id), now) === "VERIFIED").length;

  const outstanding = classes.reduce((a, c) => a + totalSupply(s, c.id), 0);
  const authorized = classes.reduce((a, c) => a + c.authorized, 0);
  const primaryVal = primary ? latestValuation(s, primary.id) : undefined;

  const offerings = s.offerings.filter((o) => o.companyId === company.id);
  const raised = offerings.filter((o) => o.status === "CLOSED").reduce((a, o) => a + (o.result?.raised ?? 0), 0);
  const closedCount = offerings.filter((o) => o.status === "CLOSED").length;
  const escrowed = offerings.filter((o) => o.status === "OPEN").reduce((a, o) => a + o.subscriptions.reduce((x, y) => x + y.amount, 0), 0);

  const openOffering = offerings.find((o) => o.status === "OPEN");
  const openWindow = s.windows.find((w) => w.companyId === company.id && w.status === "OPEN");
  const activeVote = s.proposals.find((p) => p.companyId === company.id && p.status === "ACTIVE");

  /* Attention ------------------------------------------------------- */
  const attention: Attention[] = [];
  for (const c of classes) {
    if (c.paused) attention.push({ key: `pause-${c.id}`, tone: "rose", label: "Paused", title: `${c.symbol} transfers are paused`, detail: "Every transfer fails with TOKEN_PAUSED while the pause holds.", href: "/console/share-classes" });
    for (const m of c.modules) {
      if (m.pendingUntil && m.pendingUntil > now)
        attention.push({ key: `tl-${c.id}-${m.config.id}`, tone: "amber", label: "Timelock", title: `${c.symbol}: ${MODULE_META[m.config.id].name} change queued`, detail: `Applied by the CompanyTimelock ${fmtRelative(m.pendingUntil, now)}.`, href: "/console/share-classes" });
    }
    if (c.pendingMultiplier && c.pendingMultiplier.effectiveAt > now)
      attention.push({ key: `mul-${c.id}`, tone: "amber", label: "Timelock", title: `${c.symbol} multiplier set to become ${c.pendingMultiplier.value}x`, detail: `Takes effect ${fmtRelative(c.pendingMultiplier.effectiveAt, now)}.`, href: "/console/corporate-actions" });
  }
  for (const h of registryOf(s, company.id, now)) {
    const due = h.claims.filter((c) => ["expiring", "expired"].includes(claimState(h, c.topic, now))).sort((a, b) => a.expiresAt - b.expiresAt);
    if (due.length) {
      const first = due[0];
      const expired = first.expiresAt <= now;
      attention.push({
        key: `claim-${h.id}`,
        tone: expired ? "rose" : "amber",
        label: expired ? "Lapsed" : "Due soon",
        title: `${h.name}: ${due.map((c) => CLAIM_LABEL[c.topic]).join(", ")}`,
        detail: expired
          ? `Ran out ${fmtRelative(first.expiresAt, now)}. Transfers fail with CLAIM_EXPIRED until a verifier renews it.`
          : `${due.length === 1 ? "Runs out" : "Run out"} ${fmtRelative(first.expiresAt, now)}, on ${fmtDay(first.expiresAt)}. Renew before then and transfers carry on.`,
        href: "/console/cap-table",
      });
    }
  }
  for (const o of offerings) {
    if (o.status === "OPEN" && o.closesAt <= now)
      attention.push({ key: `off-${o.id}`, tone: "lagoon", label: "Due", title: `${o.name} is ready to close`, detail: "Close it to mint the shares or return the funds.", href: "/console/offerings" });
  }
  for (const w of s.windows) {
    if (w.companyId === company.id && w.status === "OPEN" && w.closesAt <= now)
      attention.push({ key: `win-${w.id}`, tone: "lagoon", label: "Due", title: `${w.name} is ready to clear`, detail: "Clear it to settle every matched order.", href: "/console/liquidity" });
  }
  for (const d of s.distributions.filter((x) => x.companyId === company.id)) {
    const claimed = Object.values(d.claimed).reduce((a, b) => a + b, 0);
    const unclaimed = d.amount - claimed;
    if (unclaimed > 0)
      attention.push({
        key: `dst-${d.id}`,
        tone: "muted",
        label: "Unclaimed",
        title: `${fmtUsd(unclaimed, 0)} of ${d.name} still unclaimed`,
        detail: d.claimDeadline ? `Holders can claim until ${fmtDay(d.claimDeadline)}; the rest returns to the treasury.` : "Holders can claim at any time.",
        href: "/console/corporate-actions",
      });
  }
  const order: Record<Tone, number> = { rose: 0, amber: 1, lagoon: 2, leaf: 3, muted: 4 };
  attention.sort((a, b) => order[a.tone] - order[b.tone]);

  const events = s.events.filter((e) => e.companyId === company.id).sort((a, b) => b.at - a.at).slice(0, 9);

  return (
    <>
      <PageHeader
        title={company.name}
        description={`${company.sector}, based in ${company.hq}. ${company.registrar} keeps the register. ${classes.length} ${classes.length === 1 ? "share class" : "share classes"} live on ${s.network.name}.`}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/console/cap-table">
              <UserPlus className="size-4" aria-hidden="true" />
              Holders
            </LinkButton>
            <LinkButton href="/console/offerings" variant="primary">
              <CircleDollarSign className="size-4" aria-hidden="true" />
              Start an offering
            </LinkButton>
          </div>
        }
        stats={[
          { label: "Holders", value: fmtShares(holderIds.size), hint: `${verified} with verified identity`, accent: "lagoon" },
          { label: "Shares issued", value: fmtShares(outstanding), hint: `${fmtPct(authorized ? (outstanding / authorized) * 100 : 0)} of ${fmtShares(authorized)} authorized shares` },
          {
            label: `Reference Valuation${primary ? `, ${primary.symbol}` : ""}`,
            value: primaryVal ? fmtUsd(primaryVal.price) : "None",
            hint: primaryVal ? `${VALUATION_SOURCE_LABEL[primaryVal.source]}, ${fmtDay(primaryVal.asOf)}` : "Publish one from Disclosures",
          },
          { label: "Raised in offerings", value: fmtCompactUsd(raised), hint: `${closedCount} closed${escrowed > 0 ? `, ${fmtCompactUsd(escrowed)} held in escrow` : ""}`, accent: "leaf" },
        ]}
      />

      <PageBody>
        <Workspace
          aside={
            <>
              {/* What needs a decision, most urgent first */}
              <Panel>
                <PanelHeader title={attention.length ? `Needs attention · ${attention.length}` : "Nothing pending"} description="Expiring claims, queued timelock changes and unclaimed funds." />
            {attention.length === 0 ? (
              <p className="text-[13.5px] text-tide">Every claim is valid and no timelock change is waiting.</p>
            ) : (
              <ul className="-my-1 max-h-[420px] divide-y divide-line-soft overflow-y-auto pr-1">
                {attention.map((a) => (
                  <li key={a.key}>
                    <Link href={a.href} className="group flex items-start gap-3 py-3">
                      <span className="w-[86px] shrink-0 pt-0.5">
                        <Badge tone={a.tone}>{a.label}</Badge>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-navy group-hover:underline group-hover:underline-offset-4">{a.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-fog">{a.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
              </Panel>

              {/* What is running right now: one row each for raising, trading and voting */}
              <Panel>
                <PanelHeader title="Running now" />
                <div className="-my-1 divide-y divide-line-soft">
                  <section className="pb-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 className="min-w-0 truncate text-[13.5px] font-medium text-navy">{openOffering ? openOffering.name : "Offering"}</h3>
                      <MoreLink href="/console/offerings">Offerings</MoreLink>
                    </div>
            {openOffering ? (
              (() => {
                const r = openOffering.subscriptions.reduce((a, x) => a + x.amount, 0);
                const subs = new Set(openOffering.subscriptions.map((x) => x.holderId)).size;
                return (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="readout font-display text-[26px] text-navy">{fmtCompactUsd(r)}</span>
                      <span className="font-mono text-[11.5px] text-fog">of {fmtCompactUsd(openOffering.maxRaise)}</span>
                    </div>
                    <Meter value={(r / openOffering.maxRaise) * 100} className="mt-3" />
                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-fog">
                      <span>Min {fmtCompactUsd(openOffering.minRaise)}</span>
                      <span>{r >= openOffering.minRaise ? "Minimum met" : `${fmtPct((r / openOffering.minRaise) * 100, 0)} of the minimum`}</span>
                    </div>
                    <dl className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
                      <div>
                        <dt className="text-fog">Price</dt>
                        <dd className="readout mt-1 font-mono text-navy">{fmtUsd(openOffering.pricePerShare)}</dd>
                      </div>
                      <div>
                        <dt className="text-fog">Investors</dt>
                        <dd className="readout mt-1 font-mono text-navy">{subs}</dd>
                      </div>
                      <div>
                        <dt className="text-fog">Closes</dt>
                        <dd className="readout mt-1 font-mono text-navy">{fmtRelative(openOffering.closesAt, now)}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })()
            ) : (
              <p className="text-[13px] text-fog">None running.</p>
            )}
                  </section>
                  <section className="py-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 className="min-w-0 truncate text-[13.5px] font-medium text-navy">{openWindow ? openWindow.name : "Liquidity Window"}</h3>
                      <MoreLink href="/console/liquidity">Liquidity</MoreLink>
                    </div>
            {openWindow ? (
              (() => {
                const live = openWindow.orders.filter((o) => !o.cancelled);
                const asks = live.filter((o) => o.side === "SELL").reduce((a, o) => a + o.quantity, 0);
                const bids = live.filter((o) => o.side === "BUY").reduce((a, o) => a + o.quantity, 0);
                const ref = latestValuation(s, openWindow.classId)?.price;
                const p = previewClearing(openWindow, ref);
                const depth = Math.max(asks, bids, 1);
                return (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="readout font-display text-[26px] text-navy">{p ? fmtUsd(p.price) : "No match"}</span>
                      <span className="font-mono text-[11.5px] text-fog">estimate</span>
                    </div>
                    <p className="mt-1 text-[12px] text-fog">{p ? `At this price, ${fmtShares(p.volume)} shares would change hands between ${p.sellers} sellers and ${p.buyers} buyers.` : "No bid meets an ask yet."}</p>
                    <div className="mt-4 space-y-2.5">
                      <div>
                        <div className="mb-1 flex justify-between font-mono text-[11px]">
                          <span className="text-fog">Asks</span>
                          <span className="text-tide">{fmtShares(asks)}</span>
                        </div>
                        <Bar value={asks} max={depth} tone="rose" />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between font-mono text-[11px]">
                          <span className="text-fog">Bids</span>
                          <span className="text-tide">{fmtShares(bids)}</span>
                        </div>
                        <Bar value={bids} max={depth} tone="leaf" />
                      </div>
                    </div>
                    <p className="mt-4 font-mono text-[11px] text-fog">
                      {plural(live.length, "order")} · closes {fmtRelative(openWindow.closesAt, now)}
                    </p>
                  </div>
                );
              })()
            ) : (
              <p className="text-[13px] text-fog">None running.</p>
            )}
                  </section>
                  <section className="pt-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 className="min-w-0 truncate text-[13.5px] font-medium text-navy">{activeVote ? activeVote.title : "Vote"}</h3>
                      <MoreLink href="/console/corporate-actions">Votes</MoreLink>
                    </div>
            {activeVote ? (
              (() => {
                const t = tally(s, activeVote);
                const quorumPct = t.eligible ? (t.cast / t.eligible) * 100 : 0;
                return (
                  <div>
                    <div className="space-y-2.5">
                      {activeVote.options.map((o, i) => (
                        <div key={o}>
                          <div className="mb-1 flex justify-between text-[12px]">
                            <span className="text-tide">{o}</span>
                            <span className="readout text-[11.5px] text-navy">{t.cast ? fmtPct((t.weights[i] / t.cast) * 100) : "0.0%"}</span>
                          </div>
                          <Bar value={t.weights[i]} max={t.cast || 1} tone={i === 0 ? "lagoon" : "muted"} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-fog">
                      <span>
                        Turnout {fmtPct(quorumPct)} / quorum {fmtPct(activeVote.quorumBps / 100, 0)}
                      </span>
                      {t.quorumMet ? <Badge tone="leaf">Quorum met</Badge> : <Badge tone="amber">Quorum not met</Badge>}
                    </div>
                    <p className="mt-2 text-[12.5px] text-fog">Closes {fmtRelative(activeVote.endsAt, now)}</p>
                  </div>
                );
              })()
            ) : (
              <p className="text-[13px] text-fog">None running.</p>
            )}
                  </section>
                </div>
              </Panel>
            </>
          }
        >
          {/* Share classes */}
          <Panel>
            <PanelHeader title="Share classes" description="One Pincer Share Token per class. Its rule modules check every transfer." action={<MoreLink href="/console/share-classes">Edit rules</MoreLink>} />
            <Table minWidth={620}>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th className="text-right">Supply</Th>
                  <Th className="text-right">Holders</Th>
                  <Th className="text-right">Valuation</Th>
                  <Th>Rules</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => {
                  const supply = totalSupply(s, c.id);
                  const v = latestValuation(s, c.id);
                  return (
                    <tr key={c.id}>
                      <Td>
                        <div className="font-medium text-navy">{c.name}</div>
                        <div className="font-mono text-[11px] text-fog">{c.symbol}</div>
                      </Td>
                      <Td className="text-right">
                        <Num>{fmtShares(supply)}</Num>
                        <div className="font-mono text-[11px] text-fog">{fmtPct((supply / c.authorized) * 100)} of the authorized total</div>
                      </Td>
                      <Td className="text-right">
                        <Num>{holdersOf(s, c.id).length}</Num>
                      </Td>
                      <Td className="text-right">
                        <Num>{v ? fmtUsd(v.price) : "None"}</Num>
                      </Td>
                      <Td>
                        <Link href="/console/share-classes" className="font-mono text-[12px] text-tide hover:text-navy">
                          {plural(c.modules.filter((m) => m.enabled).length, "module")}
                        </Link>
                      </Td>
                      <Td>{c.paused ? <Badge tone="rose">Paused</Badge> : <Badge tone="leaf">Live</Badge>}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Panel>

          {/* Events */}
          <Panel>
            <PanelHeader title="Latest events" description={`Pulled from ${s.network.name}. Anyone can see the same events in the Explorer.`} action={<MoreLink href={`/explorer/${company.id}`}>Explorer</MoreLink>} />
            {events.length === 0 ? (
              <EmptyState title="Nothing recorded" body="Events appear here as soon as a transaction confirms." />
            ) : (
              <Table minWidth={680}>
                <thead>
                  <tr>
                    <Th>Event</Th>
                    <Th>Details</Th>
                    <Th className="text-right">When</Th>
                    <Th className="text-right">Block</Th>
                    <Th>Tx</Th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <Td>
                        <span className="font-mono text-[12px] text-navy">{e.name}</span>
                      </Td>
                      <Td className="max-w-[320px]">
                        <span className="line-clamp-1 text-[13px]">{e.summary}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-right text-[12.5px]">{fmtRelative(e.at, now)}</Td>
                      <Td className="text-right">
                        <Num className="text-[12px] text-tide">{e.block.toLocaleString("en-US")}</Num>
                      </Td>
                      <Td>
                        <a href={`${s.network.explorer}/tx/${e.tx}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-navy">
                          <Hex value={e.tx} />
                          <ArrowUpRight className="size-3 text-fog" aria-hidden="true" />
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>
        </Workspace>
      </PageBody>
    </>
  );
}
