"use client";

import { useState } from "react";
import { ArrowLeftRight, CheckCircle2, Coins, UserPlus, XCircle } from "lucide-react";
import {
  Address,
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  Input,
  Notice,
  PageBody,
  PageHeader,
  Panel,
  PanelHeader,
  Segmented,
  Select,
  Switch,
  Table,
  Td,
  Th,
} from "@/components/app/ui";
import {
  CLAIM_LABEL,
  REASON_TEXT,
  breakdown,
  byId,
  canTransfer,
  claimState,
  fmtDay,
  fmtPct,
  fmtRelative,
  fmtShares,
  holdersOf,
  identityStatus,
  isEmployeeOf,
  moduleConfig,
  totalSupply,
  vestedOf,
  type TransferCheck, plural } from "@/lib/pincer/engine";
import type { Holder, HolderKind, ShareClass } from "@/lib/pincer/types";
import { cn } from "@/lib/utils";
import { Call, Caption, DAY, ErrorList, FormFooter, HolderCell, IDENTITY_BADGE, KIND_LABEL, KV, Num, num, registryOf, useConsole } from "../_components/kit";

const CLAIM_TONE = { valid: "leaf", expiring: "amber", expired: "rose", missing: "muted" } as const;

export default function Page() {
  const { s, now, company, classes } = useConsole();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"invite" | "issue" | null>(null);

  const cls = byId(classes, classId) ?? classes[0];
  if (!cls) {
    return (
      <>
        <PageHeader title="Ownership" />
        <PageBody>
          <EmptyState title="No share classes yet" body="Deploy a share class and its holders will appear here." />
        </PageBody>
      </>
    );
  }

  const rows = holdersOf(s, cls.id);
  const supply = totalSupply(s, cls.id);
  const verified = rows.filter((r) => identityStatus(r.holder, now) === "VERIFIED").length;
  const employees = rows.filter((r) => isEmployeeOf(r.holder, company.id, now)).length;
  const registry = registryOf(s, company.id, now);
  const withoutShares = registry.filter((h) => !rows.some((r) => r.holder.id === h.id));
  const selectedHolder = selected ? byId(s.holders, selected) : undefined;

  return (
    <>
      <PageHeader
        title="Ownership"
        description="Holders, balances and lots, read straight from the share token. Balances live on-chain; names stay with the registrar."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="btn-sm" onClick={() => setDrawer("invite")}>
              <UserPlus className="size-4" aria-hidden="true" />
              Add a holder
            </Button>
            <Button className="btn-sm" onClick={() => setDrawer("issue")}>
              <Coins className="size-4" aria-hidden="true" />
              Mint shares
            </Button>
          </div>
        }
        stats={[
          { label: `${cls.symbol} holders`, value: fmtShares(rows.length), hint: `${registry.length} identities on the registry`, accent: "lagoon" },
          { label: "Verified", value: fmtPct(rows.length ? (verified / rows.length) * 100 : 0, 0), hint: `${verified} of ${rows.length} have current identity and screening claims`, accent: verified === rows.length ? "leaf" : "amber" },
          { label: "Employees", value: fmtShares(employees), hint: `Carry an EMPLOYEE_OF claim for ${company.name}` },
          { label: "Authorized", value: fmtShares(cls.authorized), hint: `${fmtShares(supply)} minted so far, ${fmtPct((supply / cls.authorized) * 100)}` },
        ]}
      />

      <PageBody className="space-y-5">
        <Panel>
          <PanelHeader
            title={`${cls.name} holders`}
            description="Unlocked shares can move now. Locked shares are frozen, unvested, still in a holding period or committed to a sell order."
            action={classes.length > 1 && <Segmented label="Share class" value={cls.id} onChange={setClassId} options={classes.map((c) => ({ value: c.id, label: c.symbol }))} />}
          />
          {rows.length === 0 ? (
            <EmptyState title="Nobody holds this class yet" body="Mint shares to a verified holder to start the register." />
          ) : (
            <Table minWidth={920}>
              <thead>
                <tr>
                  <Th>Holder</Th>
                  <Th>Region</Th>
                  <Th>Identity</Th>
                  <Th className="text-right">Balance</Th>
                  <Th className="text-right">Share of class</Th>
                  <Th className="w-[180px]">Unlocked / locked</Th>
                  <Th className="text-right">Latest lot</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ holder, balance }) => {
                  const b = breakdown(s, cls.id, holder.id, now);
                  const st = IDENTITY_BADGE[identityStatus(holder, now)];
                  const last = Math.max(...s.lots.filter((l) => l.classId === cls.id && l.holderId === holder.id).map((l) => l.acquiredAt));
                  const unlockedPct = balance ? (b.unlocked / balance) * 100 : 0;
                  return (
                    <tr key={holder.id} className="cursor-pointer" onClick={() => setSelected(holder.id)}>
                      <Td>
                        <button type="button" className="text-left" onClick={() => setSelected(holder.id)}>
                          <HolderCell holder={holder} />
                        </button>
                      </Td>
                      <Td>
                        <span className="font-mono text-[12px] text-tide">{holder.region}</span>
                      </Td>
                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </Td>
                      <Td className="text-right">
                        <Num>{fmtShares(balance)}</Num>
                      </Td>
                      <Td className="text-right">
                        <Num className="text-tide">{fmtPct((balance / supply) * 100, 2)}</Num>
                      </Td>
                      <Td>
                        <div className="rounded-full flex h-1.5 overflow-hidden bg-haze-2" aria-hidden="true">
                          <div className="h-full bg-sky" style={{ width: `${unlockedPct}%` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between font-mono text-[11px]">
                          <span className="text-tide">{fmtShares(b.unlocked)}</span>
                          <span className="text-fog">{fmtShares(balance - b.unlocked)} locked</span>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-right text-[12.5px]">{fmtDay(last)}</Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <Td className="pt-4 text-[12px] text-fog">{plural(rows.length, "holder")}</Td>
                  <Td />
                  <Td />
                  <Td className="pt-4 text-right">
                    <Num>{fmtShares(supply)}</Num>
                  </Td>
                  <Td className="pt-4 text-right">
                    <Num className="text-tide">100.00%</Num>
                  </Td>
                  <Td />
                  <Td />
                </tr>
              </tfoot>
            </Table>
          )}
        </Panel>

        {withoutShares.length > 0 && (
          <Panel>
            <PanelHeader title={`Registered, no ${cls.symbol} yet`} description="Identities on the company registry that hold none of this class. They can receive shares as soon as every rule passes." />
            <Table minWidth={640}>
              <thead>
                <tr>
                  <Th>Holder</Th>
                  <Th>Region</Th>
                  <Th>Tier</Th>
                  <Th>Identity</Th>
                  <Th className="text-right">Joined</Th>
                </tr>
              </thead>
              <tbody>
                {withoutShares.map((h) => {
                  const st = IDENTITY_BADGE[identityStatus(h, now)];
                  return (
                    <tr key={h.id} className="cursor-pointer" onClick={() => setSelected(h.id)}>
                      <Td>
                        <HolderCell holder={h} />
                      </Td>
                      <Td>
                        <span className="font-mono text-[12px]">{h.region}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-[12px]">{h.tier > 0 ? `Tier ${h.tier}` : "No tier"}</span>
                      </Td>
                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </Td>
                      <Td className="text-right text-[12.5px]">{fmtRelative(h.joinedAt, now)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Panel>
        )}

        <TransferTool cls={cls} classes={classes} registry={registry} onClassChange={setClassId} />
      </PageBody>

      <Drawer open={!!selectedHolder} onClose={() => setSelected(null)} title={selectedHolder ? `Holder · ${selectedHolder.name}` : "Holder"}>
        {selectedHolder && <HolderDetail holder={selectedHolder} cls={cls} />}
      </Drawer>
      <Drawer open={drawer === "invite"} onClose={() => setDrawer(null)} title="Add a holder">
        <InviteForm onDone={() => setDrawer(null)} />
      </Drawer>
      <Drawer open={drawer === "issue"} onClose={() => setDrawer(null)} title="Mint shares">
        <IssueForm initialClass={cls.id} registry={registry} onDone={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Holder detail                                                       */
/* ------------------------------------------------------------------ */

function HolderDetail({ holder, cls }: { holder: Holder; cls: ShareClass }) {
  const { s, now, company } = useConsole();
  const b = breakdown(s, cls.id, holder.id, now);
  const hp = moduleConfig(cls, "HOLDING_PERIOD");
  const lots = s.lots.filter((l) => l.classId === cls.id && l.holderId === holder.id).sort((a, z) => a.acquiredAt - z.acquiredAt);
  const grants = s.grants.filter((g) => g.classId === cls.id && g.holderId === holder.id);
  const st = IDENTITY_BADGE[identityStatus(holder, now)];

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-3">
        <HolderCell holder={holder} sub={`${KIND_LABEL[holder.kind]} · ${holder.region} · ${holder.tier > 0 ? `Tier ${holder.tier}` : "No tier"}`} />
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      <section>
        <Caption>{cls.symbol} balance</Caption>
        <div className="frame grid grid-cols-2 gap-px sm:grid-cols-3">
          {[
            ["Balance", b.balance],
            ["Unlocked", b.unlocked],
            ["Holding period", b.held],
            ["Unvested", b.unvested],
            ["Frozen", b.frozen],
            ["Committed to sell orders", b.inOrders],
          ].map(([label, v]) => (
            <div key={label} className="frame-cell px-4 py-3">
              <div className="text-[11.5px] text-fog">{label}</div>
              <div className="readout mt-1 font-mono text-[14px] text-navy">{fmtShares(v as number)}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-fog">Locked is frozen shares, plus whichever is larger of unvested or held, plus shares in open sell orders.</p>
      </section>

      <section>
        <Caption>Claims</Caption>
        <ul className="rounded-lg divide-y divide-line-soft border border-line">
          {holder.claims.map((c) => {
            const cs = claimState(holder, c.topic, now);
            return (
              <li key={c.topic} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-navy">{CLAIM_LABEL[c.topic]}</div>
                  <div className="truncate font-mono text-[11px] text-fog">
                    {c.topic} · {c.topic === "EMPLOYEE_OF" ? (c.value === company.id ? company.name : c.value) : c.value} · {c.verifier}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone={CLAIM_TONE[cs]}>{cs}</Badge>
                  <div className="mt-1 font-mono text-[11px] text-fog">{c.expiresAt <= now ? "lapsed" : "valid to"} {fmtDay(c.expiresAt)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <Caption>Lots, used oldest first</Caption>
        {lots.length === 0 ? (
          <p className="text-[13px] text-tide">This holder has no {cls.symbol} lots.</p>
        ) : (
          <div className="rounded-lg overflow-hidden border border-line">
            <table className="ledger w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-fog">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="py-2.5 pr-3 font-medium">Source</th>
                  <th className="py-2.5 pr-3 font-medium">Acquired</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Shares</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l, i) => {
                  const until = hp ? l.acquiredAt + hp.days * DAY : 0;
                  const held = hp && until > now;
                  return (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 font-mono text-fog">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11.5px] text-tide">{l.source}</td>
                      <td className="py-2.5 pr-3 text-tide">{fmtDay(l.acquiredAt)}</td>
                      <td className="readout py-2.5 pr-3 text-right font-mono text-navy">{fmtShares(l.quantity)}</td>
                      <td className="py-2.5 pr-4 text-right">{held ? <span className="text-[12.5px] text-amber-deep">Held until {fmtDay(until)}</span> : <span className="text-[12.5px] text-leaf-deep">Unlocked</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {grants.length > 0 && (
        <section>
          <Caption>Vesting</Caption>
          <div className="space-y-3">
            {grants.map((g) => {
              const vested = vestedOf(g, now);
              const cliffAt = g.start + g.cliffDays * DAY;
              return (
                <div key={g.id} className="rounded-lg rounded-lg border border-line p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="readout text-[13px] text-navy">
                      {fmtShares(vested)} <span className="text-fog">vested out of {fmtShares(g.total)}</span>
                    </span>
                    {g.accelerated && <Badge tone="lagoon">Accelerated</Badge>}
                  </div>
                  <div className="rounded-full mt-2.5 h-1.5 overflow-hidden bg-haze-2">
                    <div className="h-full bg-sky" style={{ width: `${(vested / g.total) * 100}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-fog">
                    <span>Starts {fmtDay(g.start)}</span>
                    <span>Cliff {fmtDay(cliffAt)}</span>
                    <span>Fully vested {fmtDay(g.start + g.durationDays * DAY)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <Caption>Wallets and identity</Caption>
        <KV
          rows={[
            { label: "Identity contract", value: <Address address={holder.identity} /> },
            ...holder.wallets.map((w, i) => ({ label: `Wallet ${i + 1}`, value: <Address address={w} /> })),
            { label: "Joined", value: fmtDay(holder.joinedAt) },
          ]}
        />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invite                                                              */
/* ------------------------------------------------------------------ */

function InviteForm({ onDone }: { onDone: () => void }) {
  const { inviteHolder, company } = useConsole();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<HolderKind>("investor");
  const [region, setRegion] = useState("US");
  const [tier, setTier] = useState(1);
  const [employee, setEmployee] = useState(false);
  const [wallet, setWallet] = useState("");

  const errors: string[] = [];
  if (!name.trim()) errors.push("Enter the holder's legal name.");
  if (!/^[A-Z]{2}$/.test(region)) errors.push("Use a two-letter ISO 3166 region code such as US or DE.");
  if (wallet.trim() && !/^0x[0-9a-fA-F]{40}$/.test(wallet.trim())) errors.push("A wallet address is 0x followed by 40 hex characters.");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length) return;
        if (inviteHolder({ name, kind, region, tier, employee, wallet: wallet.trim() || undefined }).ok) onDone();
      }}
    >
      <p className="mb-5 text-[13.5px] leading-relaxed text-tide">
        A holder verifies once and the claims live in {company.name}&apos;s HolderRegistry. Add their wallet and they take over this record on their first Portfolio sign-in. Leave it blank and they get an embedded wallet with sponsored gas.
      </p>
      <div className="space-y-4">
        <Field label="Legal name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on their ID" autoFocus />
        </Field>
        <Field label="Wallet" hint="Optional. The address they will sign in to Pincer with.">
          <Input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" className="font-mono" spellCheck={false} />
        </Field>
        <Field label="Holder type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as HolderKind)}>
            {(["investor", "fund", "employee", "founder"] as HolderKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Region" hint="ISO 3166, two letters">
            <Input value={region} maxLength={2} onChange={(e) => setRegion(e.target.value.toUpperCase())} className="" />
          </Field>
          <Field label="Eligibility tier" hint="Tier 0 skips the INVESTOR_ELIGIBLE claim">
            <Select value={tier} onChange={(e) => setTier(Number(e.target.value))}>
              {[0, 1, 2, 3].map((t) => (
                <option key={t} value={t}>
                  Tier {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Switch checked={employee} onChange={setEmployee} label="Employee" hint={`Adds an EMPLOYEE_OF claim for ${company.name}, which can waive the eligibility tier for them.`} />
      </div>
      <Caption className="mt-6">Claims to be written</Caption>
      <p className="font-mono text-[11.5px] leading-relaxed text-tide">
        IDENTITY_VERIFIED, SCREENED, REGION {region || "??"}
        {tier > 0 ? `, INVESTOR_ELIGIBLE tier ${tier}` : ""}
        {employee ? ", EMPLOYEE_OF" : ""}
      </p>
      <ErrorList errors={name ? errors : errors.slice(1)} />
      <FormFooter call="HolderRegistry.registerIdentity(wallet, identity) + addClaim(topic, data, expiry)">
        <Button type="submit" disabled={errors.length > 0}>
          Register holder
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </FormFooter>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Issue                                                               */
/* ------------------------------------------------------------------ */

function IssueForm({ initialClass, registry, onDone }: { initialClass: string; registry: Holder[]; onDone: () => void }) {
  const { s, now, classes, issueShares } = useConsole();
  const [classId, setClassId] = useState(initialClass);
  const [holderId, setHolderId] = useState(registry[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const cls = byId(classes, classId)!;
  const quantity = num(qty);
  const supply = totalSupply(s, classId);
  const headroom = cls.authorized - supply;
  const valid = quantity > 0 && Number.isInteger(quantity);
  const check = holderId && valid ? canTransfer(s, classId, null, holderId, quantity, now) : null;
  const overAuthorized = valid && quantity > headroom;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!check?.ok || overAuthorized) return;
        if (issueShares(classId, holderId, quantity).ok) onDone();
      }}
    >
      <p className="mb-5 text-[13.5px] leading-relaxed text-tide">Each mint matches the cap table record and passes the same recipient checks as canTransfer, so it can never produce a holding the rules would block.</p>
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
        <Field label="Holder">
          <Select value={holderId} onChange={(e) => setHolderId(e.target.value)}>
            {registry.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} · {KIND_LABEL[h.kind]} · {h.region}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Shares" hint={`${fmtShares(headroom)} authorized ${cls.symbol} shares remain unissued.`}>
          <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="0" suffix={cls.symbol} />
        </Field>
      </div>

      <div className="mt-6">
        <Caption>canTransfer result</Caption>
        {!check ? (
          <p className="text-[13px] text-fog">Enter a whole number of shares to see the checks.</p>
        ) : overAuthorized ? (
          <Notice tone="warn">{cls.symbol} only has {fmtShares(cls.authorized)} authorized shares, and this would exceed them.</Notice>
        ) : (
          <CheckResult check={check} />
        )}
      </div>

      <FormFooter call="PincerEquityToken.mint(to, amount, reference)">
        <Button type="submit" disabled={!check?.ok || overAuthorized}>
          Mint {valid ? fmtShares(quantity) : ""} {cls.symbol}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </FormFooter>
    </form>
  );
}

function CheckResult({ check }: { check: TransferCheck }) {
  return (
    <div className={cn("rounded-lg border px-4 py-3", check.ok ? "border-leaf/25 bg-leaf-soft" : "border-rose/25 bg-rose-soft")}>
      <div className="flex items-center gap-2">
        {check.ok ? <CheckCircle2 className="size-4 text-leaf-deep" aria-hidden="true" /> : <XCircle className="size-4 text-rose-deep" aria-hidden="true" />}
        <span className={cn("font-mono text-[12px] font-semibold", check.ok ? "text-leaf-deep" : "text-rose-deep")}>{check.reason}</span>
      </div>
      <p className="mt-1 text-[13px] text-navy">{REASON_TEXT[check.reason]}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transfer check                                                      */
/* ------------------------------------------------------------------ */

function TransferTool({ cls, classes, registry, onClassChange }: { cls: ShareClass; classes: ShareClass[]; registry: Holder[]; onClassChange: (id: string) => void }) {
  const { s, now, transfer } = useConsole();
  const senders = holdersOf(s, cls.id);
  const [fromId, setFromId] = useState(senders[0]?.holder.id ?? "");
  const [toId, setToId] = useState(registry.find((h) => h.id !== senders[0]?.holder.id)?.id ?? "");
  const [qty, setQty] = useState("1000");
  const [route, setRoute] = useState<"direct" | "rfq">("direct");

  const from = senders.some((x) => x.holder.id === fromId) ? fromId : senders[0]?.holder.id ?? "";
  const quantity = num(qty);
  const valid = quantity > 0 && Number.isInteger(quantity) && from && toId && from !== toId;
  const check = valid ? canTransfer(s, cls.id, from, toId, quantity, now, route === "rfq" ? "rfq" : null) : null;
  const rfqCheck = valid ? (route === "rfq" ? check : canTransfer(s, cls.id, from, toId, quantity, now, "rfq")) : null;
  const b = from ? breakdown(s, cls.id, from, now) : null;

  return (
    <Panel>
      <PanelHeader
        title="Test a transfer"
        description="Runs the PincerEquityToken checks in contract order and shows the reason code the chain would return."
        action={<ArrowLeftRight className="size-5 text-fog" aria-hidden="true" />}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Share class">
              <Select value={cls.id} onChange={(e) => onClassChange(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Amount" hint={b ? `${fmtShares(b.unlocked)} of ${fmtShares(b.balance)} unlocked` : undefined}>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" suffix={cls.symbol} />
            </Field>
          </div>
          <Field label="From">
            <Select value={from} onChange={(e) => setFromId(e.target.value)}>
              {senders.map(({ holder, balance }) => (
                <option key={holder.id} value={holder.id}>
                  {holder.name} · {fmtShares(balance)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={toId} onChange={(e) => setToId(e.target.value)}>
              {registry.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} · {h.region} · {h.tier > 0 ? `Tier ${h.tier}` : "No tier"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Route" hint="Approved venues such as RFQ settlement skip ROFR.">
            <Segmented
              label="Route"
              value={route}
              onChange={setRoute}
              options={[
                { value: "direct", label: "Direct" },
                { value: "rfq", label: "RFQ settlement" },
              ]}
            />
          </Field>
        </div>

        <div>
          <Caption>Check by check</Caption>
          {!check ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-fog">
              {from === toId && from ? "Pick a recipient other than the sender." : "Enter a whole number of shares."}
            </p>
          ) : (
            <>
              <ol className="rounded-lg overflow-hidden border border-line">
                {check.trace.map((t, i) => {
                  const ok = t.result === "OK";
                  return (
                    <li key={`${t.step}-${i}`} className={cn("flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0", !ok && "bg-rose-soft")}>
                      <span className="index w-5">{String(i + 1).padStart(2, "0")}</span>
                      <span className={cn("flex-1 font-mono text-[12px]", ok ? "text-tide" : "text-rose-deep")}>{t.step}</span>
                      {ok ? <CheckCircle2 className="size-3.5 text-leaf-deep" aria-hidden="true" /> : <XCircle className="size-3.5 text-rose-deep" aria-hidden="true" />}
                      <span className={cn("w-[190px] text-right font-mono text-[11px]", ok ? "text-leaf-deep" : "text-rose-deep")}>{t.result}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-3">
                <CheckResult check={check} />
              </div>
              {route === "direct" && check.reason === "ROFR_PENDING" && rfqCheck?.ok && (
                <p className="mt-2 text-[12px] text-fog">Routed through RFQ settlement, this transfer would pass, since ROFR is skipped there.</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  className="btn-sm"
                  disabled={!rfqCheck?.ok || !cls.rfqEnabled}
                  onClick={() => {
                    if (valid) transfer(cls.id, from, toId, quantity, "rfq");
                  }}
                >
                  Settle via RFQ
                </Button>
                {!cls.rfqEnabled && <span className="text-[12px] text-fog">RFQ is disabled for {cls.symbol}. Enable it under Share classes.</span>}
              </div>
              <Call className="mt-2">QuoteSettlement.fill(quote, signature, quantity)</Call>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
