import { companyOfAction, runAction, type ActionArgs, type ActionName } from "@/lib/pincer/actions";
import { byId } from "@/lib/pincer/engine";
import { actorFrom } from "@/lib/pincer/server/auth";
import { ApiError, errorResponse } from "@/lib/pincer/server/http";
import { addMember, applyChanges, Conflict, ensureMe, latestBlock, loadSnapshot, planChanges, visibleTo, type Changes, type Me } from "@/lib/pincer/server/repo";
import type { Row, TableName } from "@/lib/pincer/server/rows";
import type { Sandbox } from "@/lib/pincer/types";

export const dynamic = "force-dynamic";

/*
 * Runs one action for the signed-in user. The server loads the current state,
 * decides whether the user may take the action, runs the same rules the
 * browser ran, and writes the changed rows in one transaction. If another
 * write landed in between, it reloads and runs the action again.
 */

/** Actions a holder takes for themselves, and the argument that names the holder. */
const HOLDER_ARG: Partial<Record<ActionName, number>> = { subscribe: 1, placeOrder: 1, claimDistribution: 1, castVote: 1 };

/** Tables each self-service action may touch. */
const HOLDER_TABLES: Partial<Record<ActionName, TableName[]>> = {
  subscribe: ["subscriptions", "chain_events"],
  placeOrder: ["window_orders", "chain_events"],
  cancelOrder: ["window_orders", "chain_events"],
  claimDistribution: ["distribution_claims", "chain_events"],
  castVote: ["votes", "chain_events"],
  transfer: ["lots", "chain_events"],
  verifyIdentity: ["holders", "claims", "chain_events"],
};

type Scope = { kind: "admin"; companyId: string } | { kind: "holder" } | { kind: "user" };

function scopeOf(s: Sandbox, me: Me, name: ActionName, args: unknown[]): Scope {
  if (name === "createCompany") return { kind: "user" };
  if (name === "verifyIdentity") {
    if ((args[0] as { holderId?: string })?.holderId !== me.holderId) throw new ApiError("You can only verify your own identity.", 403);
    return { kind: "holder" };
  }
  const holderArg = HOLDER_ARG[name];
  if (holderArg !== undefined) {
    if (args[holderArg] !== me.holderId) throw new ApiError("This can only be done from your own holder account.", 403);
    return { kind: "holder" };
  }
  if (name === "transfer" && args[1] === me.holderId) return { kind: "holder" };
  if (name === "cancelOrder") {
    const order = byId(byId(s.windows, String(args[0]))?.orders ?? [], String(args[1]));
    if (order?.holderId === me.holderId) return { kind: "holder" };
  }
  const companyId = companyOfAction(s, name, args as ActionArgs[typeof name]);
  if (!companyId || !me.companyIds.includes(companyId)) throw new ApiError("Only an admin of this company can do that.", 403);
  return { kind: "admin", companyId };
}

function authorizeRows(scope: Scope, me: Me, name: ActionName, changes: Changes, created?: string) {
  const all = [...Object.entries(changes.upserts), ...Object.entries(changes.deletes)] as [TableName, Row[]][];
  for (const [table, rows] of all) {
    for (const r of rows) {
      if (scope.kind === "admin" && r.company_id !== scope.companyId) throw new ApiError("This change reaches outside your company.", 403);
      if (scope.kind === "user" && r.company_id !== created) throw new ApiError("This change reaches outside the company you are setting up.", 403);
      if (scope.kind === "holder") {
        if (!HOLDER_TABLES[name]?.includes(table)) throw new ApiError("Your account does not have permission for this change.", 403);
        if ((table === "holders" && r.id !== me.holderId) || (table === "claims" && r.holder_id !== me.holderId)) throw new ApiError("You can only edit your own identity.", 403);
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const actor = await actorFrom(req);
    if (!actor) throw new ApiError("Please sign in first.", 401);
    const body = (await req.json().catch(() => null)) as { name?: string; args?: unknown } | null;
    const name = body?.name as ActionName | undefined;
    const args = body?.args;
    if (!name || !Array.isArray(args)) throw new ApiError("Send an action name together with its arguments.", 400);

    for (let attempt = 0; attempt < 3; attempt++) {
      const { version, sandbox } = await loadSnapshot();
      const me = await ensureMe(actor, sandbox);
      const scope = scopeOf(sandbox, me, name, args);
      const block = await latestBlock(sandbox.block + 1);
      let outcome;
      try {
        outcome = runAction(sandbox, name, args as ActionArgs[typeof name], { now: Date.now(), block });
      } catch {
        throw new ApiError("That action is not available.", 400);
      }
      if (!outcome.next) return Response.json({ receipt: outcome.receipt, sandbox: visibleTo(sandbox, me), me });

      const created = name === "createCompany" ? outcome.next.companies.find((c) => !byId(sandbox.companies, c.id))?.id : undefined;
      const changes = planChanges(sandbox, outcome.next);
      authorizeRows(scope, me, name, changes, created);
      try {
        await applyChanges(version, changes);
      } catch (e) {
        if (e instanceof Conflict) continue;
        throw e;
      }
      if (created) {
        await addMember(created, actor.userId);
        me.companyIds = [...me.companyIds, created];
      }
      return Response.json({ receipt: outcome.receipt, sandbox: visibleTo(outcome.next, me), me, companyId: created });
    }
    throw new ApiError("Several changes landed at once. Try again in a moment.", 409);
  } catch (e) {
    return errorResponse(e);
  }
}
