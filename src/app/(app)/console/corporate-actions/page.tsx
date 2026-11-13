"use client";

import { useState } from "react";
import { Plus, Split } from "lucide-react";
import { Badge, Button, Drawer, EmptyState, Field, Input, Meter, Notice, PageBody, PageHeader, Panel, PanelHeader, Select, Switch, Table, Td, Th } from "@/components/app/ui";
import { byId, entitlement, fmtCompactUsd, fmtDay, fmtPct, fmtRelative, fmtShares, fmtUsd, supplyAt, tally } from "@/lib/pincer/engine";
import type { Proposal } from "@/lib/pincer/types";
import { cn } from "@/lib/utils";
import { Bar, Call, Checks, Confirm, DAY, ErrorList, FormFooter, Num, fromDateInput, num, toDateInput, useConsole } from "../_components/kit";

export default function Page() {
  const { s, now, company, classes } = useConsole();
  const [drawer, setDrawer] = useState<"fund" | "propose" | null>(null);
  const distributions = s.distributions.filter((d) => d.companyId === company.id).sort((a, b) => b.fundedAt - a.fundedAt);
  const proposals = s.proposals.filter((p) => p.companyId === company.id).sort((a, b) => (a.status === b.status ? b.snapshotAt - a.snapshotAt : a.status === "ACTIVE" ? -1 : 1));

  const funded = distributions.reduce((a, d) => a + d.amount, 0);
  const claimed = distributions.reduce((a, d) => a + Object.values(d.claimed).reduce((x, y) => x + y, 0), 0);
  const active = proposals.filter((p) => p.status === "ACTIVE");
  const nextEnd = active.map((p) => p.endsAt).sort((a, b) => a - b)[0];

  return (
    <>
      <PageHeader
        title="Payouts and voting"
        description="Send USDG to holders of record and run snapshot votes weighted by balance. Claiming and voting in Portfolio cost holders no gas."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="btn-sm" onClick={() => setDrawer("propose")}>
              <Plus className="size-4" aria-hidden="true" />
              Start a vote
            </Button>
            <Button className="btn-sm" onClick={() => setDrawer("fund")}>
              <Plus className="size-4" aria-hidden="true" />
              Fund a payout
            </Button>
          </div>
        }
        stats={[
          { label: "Paid in", value: fmtCompactUsd(funded), hint: `Over ${distributions.length} ${distributions.length === 1 ? "distribution" : "distributions"}`, accent: "leaf" },
          { label: "Claimed", value: fmtPct(funded ? (claimed / funded) * 100 : 0), hint: `${fmtUsd(funded - claimed, 0)} not yet collected` },
          { label: "Votes running", value: String(active.length), hint: nextEnd ? `Soonest ends ${fmtRelative(nextEnd, now)}` : "Nothing running", accent: active.length ? "lagoon" : undefined },
          { label: "Votes decided", value: String(proposals.length - active.length), hint: "Outcomes recorded on-chain" },
        ]}
      />
      <PageBody className="space-y-5">
        <Panel>
          <PanelHeader title="Distributions" description="Entitlements lock on the record date. Holders collect their share themselves; whatever is left at the deadline returns to the treasury." />
          {distributions.length === 0 ? (
            <EmptyState title="Nothing paid out" body="Fund a distribution and each holder of the class gets a cut sized to their record-date balance." />
          ) : (
            <Table minWidth={820}>
              <thead>
                <tr>
                  <Th>Distribution</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Record date</Th>
                  <Th className="w-[240px]">Claimed</Th>
                  <Th className="text-right">Holders</Th>
                  <Th className="text-right">Claim by</Th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => {
                  const c = Object.values(d.claimed).reduce((a, b) => a + b, 0);
                  const cls = byId(s.classes, d.classId);
                  const entitled = s.holders.map((h) => entitlement(s, d, h.id)).filter((e) => e.entitled > 0);
                  const paid = entitled.filter((e) => e.claimable === 0).length;
                  return (
                    <tr key={d.id}>
                      <Td>
                        <div className="font-medium text-navy">{d.name}</div>
                        <div className="font-mono text-[11px] text-fog">
                          {cls?.symbol} · {d.asset} · paid in {fmtDay(d.fundedAt)}
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Num>{fmtUsd(d.amount, 0)}</Num>
                        <div className="font-mono text-[11px] text-fog">{fmtUsd(d.amount / Math.max(1, supplyAt(s, d.classId, d.recordAt)), 4)} a share</div>
                      </Td>
                      <Td className="text-right text-[12.5px]">{fmtDay(d.recordAt)}</Td>
                      <Td>
                        <Meter value={(c / d.amount) * 100} className="h-1.5" />
                        <div className="mt-1.5 flex justify-between font-mono text-[11px]">
                          <span className="text-navy">{fmtUsd(c, 0)}</span>
                          <span className="text-fog">{fmtPct((c / d.amount) * 100)}</span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Num>
                          {paid} <span className="text-fog">/ {entitled.length}</span>
                        </Num>
                      </Td>
                      <Td className="whitespace-nowrap text-right text-[12.5px]">{d.claimDeadline ? fmtDay(d.claimDeadline) : "None"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Call className="mt-4">PayoutVault.claim(distributionId), called by each holder</Call>
        </Panel>

        <div>
          <div className="mb-3 flex items-baseline justify-between px-1">
            <div>
              <h2 className="mt-1 font-sans text-[18px] font-semibold tracking-[-0.02em]">Votes</h2>
            </div>
            <span className="text-[12px] text-fog">Weight is the snapshot balance multiplied by the multiplier.</span>
          </div>
          {proposals.length === 0 ? (
            <Panel>
              <EmptyState title="No votes so far" body="Put a question to one class or several. Weights come from the snapshot." />
            </Panel>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {proposals.map((p) => (
                <ProposalCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>

        <Panel>
          <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <span className="icon-tile">
              <Split className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-sans text-[18px] font-semibold tracking-[-0.02em]">Stock splits, forward and reverse</h2>
              <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-tide">
                A split changes the uiMultiplier, never the balances. The CompanyTimelock queues it 48 hours out and emits MultiplierScheduled so wallets and integrators can prepare. Raw balances do not move, and the ValuationFeed pauses while the change lands.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11.5px] text-fog">
                {classes.map((c) => (
                  <span key={c.id}>
                    {c.symbol} {c.multiplier.toFixed(4)}x{c.pendingMultiplier ? `, ${c.pendingMultiplier.value}x ${fmtRelative(c.pendingMultiplier.effectiveAt, now)}` : ""}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Button variant="secondary" className="btn-sm" disabled>
                Queue a split
              </Button>
              <Call>PincerEquityToken.scheduleMultiplier</Call>
            </div>
          </div>
        </Panel>
      </PageBody>

      <Drawer open={drawer === "fund"} onClose={() => setDrawer(null)} title="Fund a payout">
        {classes.length > 0 && <FundForm onDone={() => setDrawer(null)} />}
      </Drawer>
      <Drawer open={drawer === "propose"} onClose={() => setDrawer(null)} title="Start a vote">
        {classes.length > 0 && <ProposalForm onDone={() => setDrawer(null)} />}
      </Drawer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* A proposal                                                          */
/* ------------------------------------------------------------------ */

function ProposalCard({ p }: { p: Proposal }) {
  const { s, now, finalizeProposal } = useConsole();
  const t = tally(s, p);
  const turnout = t.eligible ? (t.cast / t.eligible) * 100 : 0;
  const quorum = p.quorumBps / 100;
  const ended = now >= p.endsAt;
  const leading = t.cast ? t.weights.indexOf(Math.max(...t.weights)) : -1;
  const symbols = p.classIds.map((id) => byId(s.classes, id)?.symbol).filter(Boolean).join(", ");

  return (
    <Panel className={cn(p.status === "ACTIVE" && "")}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {p.status === "ACTIVE" ? <Badge tone="lagoon">{ended ? "Voting over" : "Open"}</Badge> : <Badge tone="leaf">Decided</Badge>}
        <Badge tone={p.binding ? "amber" : "muted"}>{p.binding ? "Binding" : "Advisory"}</Badge>
        <span className="font-mono text-[11px] text-fog">{symbols}</span>
      </div>
      <h3 className="text-[16px] font-semibold leading-snug text-navy">{p.title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-tide">{p.summary}</p>

      <div className="mt-5 space-y-3">
        {p.options.map((o, i) => {
          const won = p.status === "FINALIZED" && p.result === i;
          return (
            <div key={`${o}-${i}`}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                <span className={cn(won || (p.status === "ACTIVE" && leading === i) ? "font-medium text-navy" : "text-tide")}>
                  {o}
                  {won && <span className="ml-2 text-[12.5px] text-leaf-deep">Passed</span>}
                </span>
                <span className="readout text-[12px] text-tide">
                  {fmtShares(t.weights[i])} <span className="text-fog">· {t.cast ? fmtPct((t.weights[i] / t.cast) * 100) : "0.0%"}</span>
                </span>
              </div>
              <Bar value={t.weights[i]} max={t.cast || 1} tone={won ? "leaf" : i === leading ? "lagoon" : "muted"} />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg mt-5 bg-haze px-4 py-3">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[12.5px]">
          <span className="text-tide">
            <span className="readout text-navy">{fmtPct(turnout)}</span> turnout from {fmtShares(t.eligible)} eligible
          </span>
          {t.quorumMet ? <Badge tone="leaf">Quorum met</Badge> : <Badge tone="amber">Needs {fmtPct(quorum, 0)}</Badge>}
        </div>
        <Bar value={turnout} max={100} marker={quorum} tone={t.quorumMet ? "leaf" : "amber"} />
        <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-fog">
          <span>{Object.keys(p.votes).length} votes cast</span>
          <span>Snapshot {fmtDay(p.snapshotAt)}</span>
          <span>{ended ? `Ended ${fmtDay(p.endsAt)}` : `Ends ${fmtRelative(p.endsAt, now)}`}</span>
        </div>
      </div>

      {p.status === "ACTIVE" ? (
        <div className="mt-5">
          <Confirm
            variant={ended ? "primary" : "secondary"}
            label="Record result"
            confirmLabel="Record it now"
            message={
              <>
                {!ended && `There are ${fmtRelative(p.endsAt, now).replace("in ", "")} of voting left; recording now cuts it short. `}
                {t.quorumMet ? `"${p.options[leading]}" passes with ${fmtPct((t.weights[leading] / t.cast) * 100)} of the votes cast.` : "Quorum was not reached, so the vote ends with no outcome."} The ProposalFinalized event puts the result on-chain.
              </>
            }
            onConfirm={() => finalizeProposal(p.id)}
          />
          <Call className="mt-2">ShareholderBallot.finalize(proposalId)</Call>
        </div>
      ) : (
        <p className="mt-5 text-[13px] text-tide">
          Outcome: <span className="font-medium text-navy">{p.result === undefined || p.result === 255 ? "No quorum" : p.options[p.result]}</span>
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

function FundForm({ onDone }: { onDone: () => void }) {
  const { s, now, company, classes, fundDistribution } = useConsole();
  const [classId, setClassId] = useState(classes[classes.length - 1].id);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [record, setRecord] = useState(toDateInput(now));
  const [withDeadline, setWithDeadline] = useState(true);
  const [deadline, setDeadline] = useState(toDateInput(now + 366 * DAY));
  const cls = byId(classes, classId)!;

  const amt = num(amount);
  const recordAt = record === toDateInput(now) ? now : fromDateInput(record, now, "end");
  const deadlineAt = fromDateInput(deadline, now, "end");
  const supply = Number.isFinite(recordAt) ? supplyAt(s, classId, recordAt) : 0;

  const errors: string[] = [];
  if (!name.trim()) errors.push("Name the distribution.");
  if (!(amt > 0)) errors.push("Enter an amount greater than zero.");
  if (!(recordAt <= now + DAY)) errors.push("The record date cannot be in the future.");
  if (withDeadline && !(deadlineAt - recordAt >= 365 * DAY)) errors.push("The claim deadline has to be at least 12 months past the record date.");
  if (supply === 0) errors.push(`No ${cls.symbol} shares existed on that record date.`);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length) return;
        const r = fundDistribution({ companyId: company.id, classId, name: name.trim(), asset: "USDG", amount: amt, recordAt, claimDeadline: withDeadline ? deadlineAt : undefined });
        if (r.ok) onDone();
      }}
    >
      <p className="mb-5 text-[13.5px] leading-relaxed text-tide">Funds move from the treasury into the PayoutVault. Each holder is owed their record-date balance as a fraction of that day&apos;s supply.</p>
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
        <Field label="Distribution name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preferred dividend, 2027" />
        </Field>
        <Field label="Amount" hint={amt > 0 && supply > 0 ? `Spread over ${fmtShares(supply)} ${cls.symbol}, each share gets ${fmtUsd(amt / supply, 4)}.` : undefined}>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" suffix="USDG" />
        </Field>
        <Field label="Record date" hint="Choose today to snapshot balances right now.">
          <Input type="date" value={record} max={toDateInput(now)} onChange={(e) => setRecord(e.target.value)} />
        </Field>
        <div className="rounded-lg rounded-lg border border-line px-3 py-1">
          <Switch checked={withDeadline} onChange={setWithDeadline} label="Set a claim deadline" hint="Whatever is left at the deadline returns to the treasury. The deadline must be 12 months or more past the record date." />
        </div>
        {withDeadline && (
          <Field label="Claim by">
            <Input type="date" value={deadline} min={toDateInput((Number.isFinite(recordAt) ? recordAt : now) + 365 * DAY)} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        )}
      </div>
      <ErrorList errors={name || amount ? errors : []} />
      <FormFooter call="PayoutVault.fund(shareToken, asset, amount, recordBlock, claimDeadline, excluded)">
        <Button type="submit" disabled={errors.length > 0}>
          Pay in {amt > 0 ? fmtUsd(amt, 0) : "funds"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </FormFooter>
    </form>
  );
}

function ProposalForm({ onDone }: { onDone: () => void }) {
  const { s, now, company, classes, createProposal } = useConsole();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [classIds, setClassIds] = useState<string[]>(classes.map((c) => c.id));
  const [options, setOptions] = useState("For, Against, Abstain");
  const [days, setDays] = useState("7");
  const [quorum, setQuorum] = useState("50");
  const [binding, setBinding] = useState(true);

  const opts = options.split(",").map((o) => o.trim()).filter(Boolean);
  const d = num(days);
  const q = num(quorum);
  const eligible = classIds.reduce((a, id) => a + supplyAt(s, id, now), 0);

  const errors: string[] = [];
  if (!title.trim()) errors.push("Give the vote a title.");
  if (!classIds.length) errors.push("Select at least one class to vote.");
  if (opts.length < 2) errors.push("List at least two options, separated by commas.");
  if (new Set(opts).size !== opts.length) errors.push("Each option has to be different.");
  if (!(d >= 1 && d <= 60 && Number.isInteger(d))) errors.push("Run the vote for 1 to 60 whole days.");
  if (!(q > 0 && q <= 100)) errors.push("Set a quorum from 1% to 100%.");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length) return;
        const r = createProposal({
          companyId: company.id,
          classIds,
          title: title.trim(),
          summary: summary.trim(),
          options: opts,
          snapshotAt: now,
          endsAt: now + d * DAY,
          quorumBps: Math.round(q * 100),
          binding,
        });
        if (r.ok) onDone();
      }}
    >
      <p className="mb-5 text-[13.5px] leading-relaxed text-tide">Balances are snapshotted the moment you open the vote. Shares bought afterward do not count.</p>
      <div className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Approve the 2027 budget" />
        </Field>
        <Field label="Description">
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className="input resize-none" placeholder="A few sentences on the question being decided." />
        </Field>
        <Field label="Classes that vote" hint={`${fmtShares(eligible)} shares can vote at the snapshot.`}>
          <Checks<string> value={classIds} onChange={setClassIds} options={classes.map((c) => ({ value: c.id, label: c.name, hint: c.symbol }))} />
        </Field>
        <Field label="Choices" hint="Separate each choice with a comma.">
          <Input value={options} onChange={(e) => setOptions(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Runs for">
            <Input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" suffix="days" />
          </Field>
          <Field label="Quorum" hint={q > 0 && eligible ? `${fmtShares(Math.ceil((eligible * q) / 100))} shares must take part.` : undefined}>
            <Input value={quorum} onChange={(e) => setQuorum(e.target.value)} inputMode="decimal" suffix="%" />
          </Field>
        </div>
        <div className="rounded-lg rounded-lg border border-line px-3 py-1">
          <Switch checked={binding} onChange={setBinding} label="Binding" hint="A binding result commits the company. An advisory one just records what holders think." />
        </div>
      </div>
      {d > 0 && <p className="mt-4 text-[12.5px] text-fog">Snapshot taken now · voting ends {fmtDay(now + d * DAY)}</p>}
      <div className="mt-4">
        <Notice tone="info">Holders vote once each from Portfolio, and Pincer covers the gas.</Notice>
      </div>
      <ErrorList errors={title ? errors : []} />
      <FormFooter call="ShareholderBallot.propose(params)">
        <Button type="submit" disabled={errors.length > 0}>
          Start the vote
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </FormFooter>
    </form>
  );
}
