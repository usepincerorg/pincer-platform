"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Button, Drawer, EmptyState, Field, Input, Meter, Notice, PageBody, PageHeader, Panel, PanelHeader, Select, Table, Td, Th } from "@/components/app/ui";
import { CLAIM_LABEL, byId, canTransfer, fmtCompactUsd, fmtDateTime, fmtDay, fmtPct, fmtRelative, fmtShares, fmtUsd, totalSupply, plural } from "@/lib/pincer/engine";
import type { ClaimTopic, Offering } from "@/lib/pincer/types";
import { cn } from "@/lib/utils";
import { Call, Caption, Checks, Confirm, DAY, ErrorList, FormFooter, HolderCell, KV, Num, OFFERING_TONE, fromDateInput, num, toDateInput, useConsole } from "../_components/kit";

const raisedOf = (o: Offering) => (o.result ? o.result.raised : o.subscriptions.reduce((a, x) => a + x.amount, 0));
const subscribedOf = (o: Offering) => o.subscriptions.reduce((a, x) => a + x.amount, 0);

export default function Page() {
  const { s, now, company, classes } = useConsole();
  const offerings = s.offerings.filter((o) => o.companyId === company.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = byId(offerings, selectedId ?? undefined) ?? offerings.find((o) => o.status === "OPEN") ?? offerings[0];

  const closed = offerings.filter((o) => o.status === "CLOSED");
  const totalRaised = closed.reduce((a, o) => a + (o.result?.raised ?? 0), 0);
  const open = offerings.filter((o) => o.status === "OPEN");
  const escrow = open.reduce((a, o) => a + subscribedOf(o), 0);
  const issued = closed.reduce((a, o) => a + (o.result?.sharesIssued ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Capital raises"
        description="Eligible investors commit USDG, and the RaiseEscrow keeps it in escrow until the close. At that point shares mint and the money goes to the treasury, or everyone is refunded."
        action={
          <Button className="btn-sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Start an offering
          </Button>
        }
        stats={[
          { label: "Total raised", value: fmtCompactUsd(totalRaised), hint: `Across ${closed.length} closed offerings`, accent: "leaf" },
          { label: "Held in escrow", value: fmtCompactUsd(escrow), hint: `${open.length} ${open.length === 1 ? "offering" : "offerings"} running`, accent: "lagoon" },
          { label: "Shares minted", value: fmtShares(issued), hint: "Created when offerings close" },
          { label: "Investors", value: String(new Set(open.flatMap((o) => o.subscriptions.map((x) => x.holderId))).size), hint: "Committed to running offerings" },
        ]}
      />
      <PageBody className="space-y-5">
        <Panel>
          <PanelHeader title="Every offering" description="Pick a row to see its allocation and subscription ledger." />
          {offerings.length === 0 ? (
            <EmptyState title="Nothing raised yet" body="Raise from eligible investors. Funds wait in escrow and shares mint on their own at close." action={<Button className="btn-sm" onClick={() => setCreating(true)}>Start an offering</Button>} />
          ) : (
            <Table minWidth={860}>
              <thead>
                <tr>
                  <Th>Offering</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="w-[240px]">Raised</Th>
                  <Th className="text-right">Investors</Th>
                  <Th className="text-right">Closes</Th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((o) => {
                  const r = raisedOf(o);
                  const cls = byId(s.classes, o.classId);
                  const active = selected?.id === o.id;
                  return (
                    <tr key={o.id} onClick={() => setSelectedId(o.id)} className={cn("cursor-pointer", active && "[&>td]:bg-lagoon-faint")}>
                      <Td>
                        <button type="button" className="text-left" onClick={() => setSelectedId(o.id)}>
                          <div className="font-medium text-navy">{o.name}</div>
                          <div className="font-mono text-[11px] text-fog">{cls?.symbol}</div>
                        </button>
                      </Td>
                      <Td>
                        <Badge tone={OFFERING_TONE[o.status]}>{o.status}</Badge>
                      </Td>
                      <Td className="text-right">
                        <Num>{fmtUsd(o.pricePerShare)}</Num>
                      </Td>
                      <Td>
                        <Meter value={(r / o.maxRaise) * 100} className="h-1.5" tone={o.status === "FAILED" ? "rose" : "lagoon"} />
                        <div className="mt-1.5 flex justify-between font-mono text-[11px]">
                          <span className="text-navy">{fmtCompactUsd(r)}</span>
                          <span className="text-fog">
                            {fmtCompactUsd(o.minRaise)} to {fmtCompactUsd(o.maxRaise)}
                          </span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Num>{o.subscriptions.length ? new Set(o.subscriptions.map((x) => x.holderId)).size : o.result ? "n/a" : 0}</Num>
                      </Td>
                      <Td className="whitespace-nowrap text-right text-[12.5px]">{o.status === "CLOSED" || o.status === "FAILED" ? fmtDay(o.result?.closedAt ?? o.closesAt) : fmtRelative(o.closesAt, now)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>

        {selected && <OfferingDetail key={selected.id} o={selected} />}
      </PageBody>

      <Drawer open={creating} onClose={() => setCreating(false)} title="Start an offering">
        {classes.length > 0 && <NewOffering onDone={() => setCreating(false)} />}
      </Drawer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

function OfferingDetail({ o }: { o: Offering }) {
  const { s, now, closeOffering, cancelOffering } = useConsole();
  const cls = byId(s.classes, o.classId);
  const doc = byId(s.documents, o.documentId);
  const raised = subscribedOf(o);
  const final = o.status === "CLOSED" || o.status === "FAILED";
  const target = Math.min(raised, o.maxRaise);
  const over = raised > o.maxRaise;
  const reachesMin = raised >= o.minRaise && raised > 0;

  const perHolder = new Map<string, number>();
  for (const x of o.subscriptions) perHolder.set(x.holderId, (perHolder.get(x.holderId) ?? 0) + x.amount);
  const allocation = [...perHolder.entries()]
    .map(([holderId, subscribed]) => {
      const alloc = raised > 0 ? (subscribed * target) / raised : 0;
      const shares = Math.floor(alloc / o.pricePerShare);
      const check = shares > 0 ? canTransfer(s, o.classId, null, holderId, shares, now) : null;
      const accepted = check?.ok ? shares * o.pricePerShare : 0;
      return { holderId, subscribed, alloc, shares, check, accepted, refund: subscribed - accepted };
    })
    .sort((a, b) => b.subscribed - a.subscribed);
  const sharesToMint = allocation.reduce((a, x) => a + (x.check?.ok ? x.shares : 0), 0);
  const accepted = allocation.reduce((a, x) => a + x.accepted, 0);
  const refunds = raised - accepted;
  const supplyAfter = cls ? totalSupply(s, cls.id) + sharesToMint : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel>
        <PanelHeader title={o.name} action={<Badge tone={OFFERING_TONE[o.status]}>{o.status}</Badge>} />
        <KV
          rows={[
            { label: "Price per share", value: fmtUsd(o.pricePerShare), mono: true },
            { label: "Minimum raise", value: fmtUsd(o.minRaise, 0), mono: true },
            { label: "Maximum raise", value: fmtUsd(o.maxRaise, 0), mono: true },
            { label: "Smallest ticket", value: fmtUsd(o.minTicket, 0), mono: true },
            { label: "Opens", value: fmtDateTime(o.opensAt) },
            { label: "Closes", value: `${fmtDateTime(o.closesAt)} (${fmtRelative(o.closesAt, now)})` },
            { label: "Claims needed", value: o.requiredClaims.map((c) => CLAIM_LABEL[c]).join(", ") || "None" },
            { label: "Offering memo", value: doc ? doc.title : "Nothing anchored" },
          ]}
        />

        {o.result && (
          <div className="rounded-lg mt-5 bg-haze px-4 py-3">
            <Caption className="mb-1.5">Outcome</Caption>
            {o.status === "CLOSED" ? (
              <p className="text-[13px] leading-relaxed text-navy">
                Took in {fmtUsd(o.result.raised, 0)} and minted {fmtShares(o.result.sharesIssued)} {cls?.symbol}. After the {fmtUsd(o.result.fee, 0)} platform fee, {fmtUsd(o.result.raised - o.result.fee, 0)} went to the treasury.
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-navy">No shares were minted. Every investor can pull back the full amount with RaiseEscrow.refund.</p>
            )}
          </div>
        )}

        {!final && (
          <div className="mt-6 space-y-3 border-t border-line-soft pt-5">
            <Confirm
              variant="primary"
              label="Close and settle"
              confirmLabel={reachesMin ? `Close and mint ${fmtShares(sharesToMint)} ${cls?.symbol}` : "Close and mark failed"}
              message={
                reachesMin ? (
                  <>
                    This mints {fmtShares(sharesToMint)} {cls?.symbol} across {allocation.filter((a) => a.check?.ok).length} investors and pays {fmtUsd(accepted, 0)}, minus the platform fee, into the treasury.
                    {refunds > 0 && ` ${fmtUsd(refunds, 0)} is refunded.`} The new Reference Valuation will be {fmtUsd(o.pricePerShare)}.
                    {now < o.closesAt && ` It was due to close ${fmtRelative(o.closesAt, now)}; this ends it ahead of time.`}
                  </>
                ) : (
                  <>
                    With {fmtUsd(raised, 0)} committed against a {fmtUsd(o.minRaise, 0)} minimum, the offering closes as failed. Nothing is minted and investors can take back every dollar.
                  </>
                )
              }
              onConfirm={() => closeOffering(o.id)}
            />
            <Call>RaiseEscrow.close(offeringId)</Call>
            <Confirm
              variant="danger"
              label="Withdraw offering"
              confirmLabel="Withdraw and refund"
              message={`No shares are minted. All ${fmtUsd(raised, 0)} held in escrow becomes refundable through RaiseEscrow.refund.`}
              onConfirm={() => cancelOffering(o.id)}
            />
            <Call>RaiseEscrow.cancelOffering(offeringId)</Call>
          </div>
        )}
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelHeader
          title={final ? "Subscription ledger" : over ? "Oversubscribed, allocated pro rata" : "Projected allocation"}
          description={
            final
              ? undefined
              : over
                ? `Investors committed ${fmtUsd(raised, 0)} against a ${fmtUsd(o.maxRaise, 0)} cap. Each gets ${fmtPct((o.maxRaise / raised) * 100)} of their commitment in whole shares; the rest comes back.`
                : reachesMin
                  ? "The minimum is in. Commitments convert to whole shares and any leftover under one share is returned."
                  : `Another ${fmtUsd(o.minRaise - raised, 0)} is needed to hit the minimum. Closing short refunds everyone.`
          }
        />
        {!final && (
          <div className="mb-5">
            <div className="relative">
              <Meter value={(raised / Math.max(o.maxRaise, raised)) * 100} />
              <span aria-hidden="true" className="absolute -top-1 h-4 w-px bg-amber" style={{ left: `${(o.minRaise / Math.max(o.maxRaise, raised)) * 100}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-fog">
              <span className="text-navy">{fmtUsd(raised, 0)} committed</span>
              <span>
                <span className="text-amber-deep">min</span> {fmtCompactUsd(o.minRaise)} · max {fmtCompactUsd(o.maxRaise)}
              </span>
            </div>
          </div>
        )}

        {o.subscriptions.length === 0 ? (
          <EmptyState title={final ? "Ledger closed out" : "No commitments so far"} body={final ? "Subscriptions were settled when the offering closed. Find the minted lots on the cap table." : "Eligible investors commit from Portfolio, and canTransfer checks the shares each would receive."} />
        ) : final ? (
          <Table minWidth={520}>
            <thead>
              <tr>
                <Th>Investor</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Time</Th>
              </tr>
            </thead>
            <tbody>
              {o.subscriptions.map((x, i) => (
                <tr key={`${x.holderId}-${i}`}>
                  <Td>
                    <HolderCell holder={byId(s.holders, x.holderId)} />
                  </Td>
                  <Td className="text-right">
                    <Num>{fmtUsd(x.amount, 0)}</Num>
                  </Td>
                  <Td className="text-right text-[12.5px]">{fmtDateTime(x.at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table minWidth={760}>
            <thead>
              <tr>
                <Th>Investor</Th>
                <Th className="text-right">Committed</Th>
                <Th className="text-right">Allocation</Th>
                <Th className="text-right">Shares</Th>
                <Th className="text-right">Refund</Th>
                <Th>Mint result</Th>
              </tr>
            </thead>
            <tbody>
              {allocation.map((a) => (
                <tr key={a.holderId}>
                  <Td>
                    <HolderCell holder={byId(s.holders, a.holderId)} />
                  </Td>
                  <Td className="text-right">
                    <Num>{fmtUsd(a.subscribed, 0)}</Num>
                  </Td>
                  <Td className="text-right">
                    <Num className="text-tide">{fmtUsd(a.alloc, 0)}</Num>
                  </Td>
                  <Td className="text-right">
                    <Num>{fmtShares(a.check?.ok ? a.shares : 0)}</Num>
                  </Td>
                  <Td className="text-right">
                    <Num className={a.refund > 0.005 ? "text-amber-deep" : "text-fog"}>{fmtUsd(a.refund)}</Num>
                  </Td>
                  <Td>{a.check ? <Badge tone={a.check.ok ? "leaf" : "rose"}>{a.check.reason}</Badge> : <Badge>Under one share</Badge>}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <Td className="pt-4 text-[12px] text-fog">{plural(allocation.length, "investor")}</Td>
                <Td className="pt-4 text-right">
                  <Num>{fmtUsd(raised, 0)}</Num>
                </Td>
                <Td className="pt-4 text-right">
                  <Num className="text-tide">{fmtUsd(target, 0)}</Num>
                </Td>
                <Td className="pt-4 text-right">
                  <Num>{fmtShares(sharesToMint)}</Num>
                </Td>
                <Td className="pt-4 text-right">
                  <Num className="text-amber-deep">{fmtUsd(refunds)}</Num>
                </Td>
                <Td />
              </tr>
            </tfoot>
          </Table>
        )}
        {!final && cls && sharesToMint > 0 && (
          <p className="mt-4 text-[12px] text-fog">
            After the close, {cls.symbol} supply would stand at {fmtShares(supplyAfter)} of {fmtShares(cls.authorized)} authorized.
            {supplyAfter > cls.authorized && " This exceeds the authorized total."}
          </p>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New offering                                                        */
/* ------------------------------------------------------------------ */

function NewOffering({ onDone }: { onDone: () => void }) {
  const { now, company, classes, createOffering } = useConsole();
  const [classId, setClassId] = useState(classes[classes.length - 1].id);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [minRaise, setMinRaise] = useState("");
  const [maxRaise, setMaxRaise] = useState("");
  const [minTicket, setMinTicket] = useState("5000");
  const [opens, setOpens] = useState(toDateInput(now));
  const [closes, setCloses] = useState(toDateInput(now + 21 * DAY));
  const [claims, setClaims] = useState<ClaimTopic[]>(["IDENTITY_VERIFIED", "INVESTOR_ELIGIBLE"]);

  const p = num(price);
  const mn = num(minRaise);
  const mx = num(maxRaise);
  const tk = num(minTicket);
  const opensAt = fromDateInput(opens, now, "start");
  const closesAt = fromDateInput(closes, now, "end");
  const cls = byId(classes, classId)!;

  const errors: string[] = [];
  if (!name.trim()) errors.push("Name the offering.");
  if (!(p > 0)) errors.push("Set a share price greater than zero.");
  if (!(mx > 0)) errors.push("Set a maximum raise greater than zero.");
  if (!(mn >= 0)) errors.push("Enter a minimum raise, or 0 for none.");
  if (mn > mx) errors.push("Keep the minimum raise at or below the maximum.");
  if (!(tk > 0)) errors.push("Set a smallest ticket greater than zero.");
  if (!(closesAt > opensAt)) errors.push("Pick a close date later than the open date.");
  if (opensAt < now - DAY) errors.push("The open date cannot be in the past.");
  const maxShares = p > 0 && mx > 0 ? Math.floor(mx / p) : 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length) return;
        const r = createOffering({ companyId: company.id, classId, name: name.trim(), pricePerShare: p, minRaise: mn, maxRaise: mx, minTicket: tk, opensAt, closesAt, requiredClaims: claims });
        if (r.ok) onDone();
      }}
    >
      <p className="mb-5 text-[13.5px] leading-relaxed text-tide">Investors commit USDG from Portfolio, and it sits in escrow until you close the offering.</p>
      <div className="space-y-4">
        <Field label="Share class">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Offering name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Series C" />
        </Field>
        <Field label="Price per share" hint={maxShares ? `At the maximum raise, that is ${fmtShares(maxShares)} ${cls.symbol}.` : undefined}>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" suffix="USDG" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum raise">
            <Input value={minRaise} onChange={(e) => setMinRaise(e.target.value)} inputMode="decimal" placeholder="0" suffix="USDG" />
          </Field>
          <Field label="Maximum raise">
            <Input value={maxRaise} onChange={(e) => setMaxRaise(e.target.value)} inputMode="decimal" placeholder="0" suffix="USDG" />
          </Field>
        </div>
        <Field label="Smallest ticket">
          <Input value={minTicket} onChange={(e) => setMinTicket(e.target.value)} inputMode="decimal" suffix="USDG" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens" hint="Choose today to open right away.">
            <Input type="date" value={opens} onChange={(e) => setOpens(e.target.value)} />
          </Field>
          <Field label="Closes" hint="At the end of that day, local time.">
            <Input type="date" value={closes} onChange={(e) => setCloses(e.target.value)} />
          </Field>
        </div>
        <Field label="Claims needed">
          <Checks<ClaimTopic>
            value={claims}
            onChange={setClaims}
            options={[
              { value: "IDENTITY_VERIFIED", label: CLAIM_LABEL.IDENTITY_VERIFIED, hint: "IDENTITY_VERIFIED" },
              { value: "INVESTOR_ELIGIBLE", label: CLAIM_LABEL.INVESTOR_ELIGIBLE, hint: "INVESTOR_ELIGIBLE" },
            ]}
          />
        </Field>
      </div>
      <div className="mt-5">
        <Notice tone="info">
          Hit the minimum by the close and investors get shares while the treasury gets the money, net of the platform fee. Anything over the maximum is scaled back pro rata. Miss the minimum and everyone is refunded.
        </Notice>
      </div>
      <ErrorList errors={name || price || maxRaise ? errors : []} />
      <FormFooter call="RaiseEscrow.createOffering(params)">
        <Button type="submit" disabled={errors.length > 0}>
          Launch offering
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </FormFooter>
    </form>
  );
}
