"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Lock } from "lucide-react";
import { Address, Badge, Button, EmptyState, PageBody, PageHeader, Panel, PanelHeader, Select } from "@/components/app/ui";
import { CompanyMark, positionsOf } from "@/components/app/holder-kit";
import { useSandbox } from "@/lib/pincer/store";
import { DOCUMENT_LABEL, fmtDay, shortHex, plural } from "@/lib/pincer/engine";
import type { Company, Disclosure, DocumentKind } from "@/lib/pincer/types";
import { cn } from "@/lib/utils";

export default function Page() {
  const { s, now, viewer } = useSandbox();
  const positions = useMemo(() => positionsOf(s, viewer.holderId, now), [s, viewer.holderId, now]);
  const held = useMemo(() => new Set(positions.map((p) => p.company.id)), [positions]);
  const [kind, setKind] = useState<DocumentKind | "ALL">("ALL");

  const visible = (d: Disclosure) => d.visibility === "public" || held.has(d.companyId);
  const docs = s.documents.filter((d) => kind === "ALL" || d.kind === kind);
  const groups = s.companies
    .map((c) => ({ company: c, docs: docs.filter((d) => d.companyId === c.id).sort((a, b) => b.anchoredAt - a.anchoredAt) }))
    .filter((g) => g.docs.length > 0)
    .sort((a, b) => Number(held.has(b.company.id)) - Number(held.has(a.company.id)));

  const available = s.documents.filter(visible);
  const locked = s.documents.length - available.length;
  const latest = available.sort((a, b) => b.anchoredAt - a.anchoredAt)[0];

  return (
    <>
      <PageHeader
        title="Records"
        description="Companies anchor a hash of each disclosure in their DocumentAnchor. You can open holder-only files for companies you hold, and check any saved copy against its anchored hash."
        stats={[
          { label: "You can open", value: String(available.length), hint: `Across ${plural(held.size, "company", "companies")} you hold`, accent: "lagoon" },
          { label: "Locked to you", value: String(locked), hint: "Holder-only, other companies" },
          { label: "Most recent", value: latest ? fmtDay(latest.anchoredAt) : "None", hint: latest?.title },
          { label: "Publishing companies", value: String(new Set(s.documents.map((d) => d.companyId)).size) },
        ]}
      />
      <PageBody className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] text-tide">Grouped by company. Companies you hold come first.</p>
          <Select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind | "ALL")} className="sm:w-64" aria-label="Document type">
            <option value="ALL">All types</option>
            {(Object.keys(DOCUMENT_LABEL) as DocumentKind[]).map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_LABEL[k]}
              </option>
            ))}
          </Select>
        </div>

        {groups.length === 0 ? (
          <Panel>
            <EmptyState title="No documents of this type" body="Try another type or remove the filter." action={<Button variant="secondary" className="btn-sm" onClick={() => setKind("ALL")}>Clear filter</Button>} />
          </Panel>
        ) : (
          groups.map((g) => <CompanyDocs key={g.company.id} company={g.company} docs={g.docs} holds={held.has(g.company.id)} />)
        )}

        <Panel className="card-tint">
          <div>
            <div className="min-w-0">
              <h2 className="font-sans text-[15px] font-semibold text-navy">Verifying a document</h2>
              <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-tide">
                When a document is published, DocumentAnchor records its kind, keccak-256 hash and timestamp in one transaction. Verification hashes your copy and compares it to that record. A match proves you hold exactly what the company anchored, unchanged since. The chain only ever sees the hash, so holder-only content stays private while every hash is public.
              </p>
            </div>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}

function CompanyDocs({ company, docs, holds }: { company: Company; docs: Disclosure[]; holds: boolean }) {
  return (
    <Panel>
      <PanelHeader
        title={company.name}
        description={holds ? "You hold shares here, so holder-only documents are open to you." : "You are not a holder here. Public documents open as usual; holder-only ones show only their hash."}
        action={
          <span className="flex items-center gap-3">
            {holds ? <Badge tone="leaf">Holder</Badge> : <Badge tone="muted">Not a holder</Badge>}
            <CompanyMark name={company.name} size={34} />
          </span>
        }
      />
      <ul className="-my-1 divide-y divide-line-soft">
        {docs.map((d) => (
          <DocRow key={d.id} d={d} company={company} open={d.visibility === "public" || holds} />
        ))}
      </ul>
    </Panel>
  );
}

function DocRow({ d, company, open }: { d: Disclosure; company: Company; open: boolean }) {
  const [verifying, setVerifying] = useState(false);
  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("mt-0.5 shrink-0", open ? "text-lagoon" : "text-fog")}>
            {open ? <FileText className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="caption">{DOCUMENT_LABEL[d.kind]}</p>
            <p className={cn("mt-1 truncate text-[14px] font-medium", open ? "text-navy" : "text-fog")}>{open ? d.title : `${DOCUMENT_LABEL[d.kind]} (holders only)`}</p>
            <p className="mt-1 text-[12.5px] text-fog">
              Anchored {fmtDay(d.anchoredAt)} · {shortHex(d.hash)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:pl-4">
          <Badge tone={d.visibility === "public" ? "muted" : "lagoon"}>{d.visibility === "public" ? "Public" : "Holders only"}</Badge>
          {open ? (
            <Button variant="secondary" className="btn-sm" onClick={() => setVerifying((v) => !v)} aria-expanded={verifying}>
              {verifying ? "Hide" : "Check hash"}
            </Button>
          ) : (
            <Link href="/portfolio/invest" className="btn btn-ghost btn-sm">
              Invest to unlock
            </Link>
          )}
        </div>
      </div>
      {verifying && open && (
        <div className="mt-4 rounded-lg border border-leaf/20 bg-leaf-soft/60 p-4">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-leaf-deep">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Matches the DocumentAnchor record
          </div>
          <dl className="mt-3 grid gap-2 text-[12px] md:grid-cols-[150px_minmax(0,1fr)]">
            <dt className="text-fog">Local hash (keccak-256)</dt>
            <dd className="break-all font-mono text-navy">{d.hash}</dd>
            <dt className="text-fog">On-chain hash</dt>
            <dd className="break-all font-mono text-navy">{d.hash}</dd>
            <dt className="text-fog">Registry</dt>
            <dd>{company.contracts.DocumentAnchor ? <Address address={company.contracts.DocumentAnchor} size={18} /> : "n/a"}</dd>
            <dt className="text-fog">Anchored at</dt>
            <dd className="text-navy">
              {new Date(d.anchoredAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}, via DocumentAnchored event
            </dd>
          </dl>
        </div>
      )}
    </li>
  );
}
