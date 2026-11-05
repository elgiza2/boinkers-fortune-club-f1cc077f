import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PRODUCTS, type ProductId } from "./products";

const init = z.object({ initData: z.string().min(10).max(4096) });

async function auth(initData: string) {
  const { verifyInitData } = await import("./tg.server");
  return verifyInitData(initData);
}

/** Loads/saves the player's progress and hands over any rewards credited by the bot or payments. */
export const holoSync = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.extend({ state: z.record(z.string(), z.unknown()).nullable(), ref: z.string().max(32).optional() }).parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const { db, adminRole } = await import("./admin.server");
    const d = await db();
    const { data: existing } = await d.from("holo_players").select("state, referred_by").eq("telegram_id", user.id).maybeSingle();
    const s = data.state as Record<string, number> | null;
    const ref = data.ref && /^\d+$/.test(data.ref) && Number(data.ref) !== user.id ? Number(data.ref) : null;
    await d.from("holo_players").upsert({
      telegram_id: user.id, username: user.username?.toLowerCase() ?? null, first_name: user.first_name ?? null,
      photo_url: user.photo_url ?? null, language_code: user.language_code ?? null, last_seen_at: new Date().toISOString(),
      ...(s ? { state: s, coins: Math.floor(Number(s.coins) || 0), spins: Math.floor(Number(s.spins) || 0), tickets: Math.floor(Number(s.tickets) || 0), gram: Number(s.ton) || 0, solo: Number(s.solo) || 0 } : {}),
      ...(!existing && ref ? { referred_by: ref } : {}),
    }, { onConflict: "telegram_id" });
    const { data: pending } = await d.rpc("holo_take_pending", { p_user: user.id });
    return {
      saved: (existing?.state ?? null) as Record<string, unknown> | null,
      pending: (pending ?? {}) as { coins?: number; spins?: number; tickets?: number; gram?: number; premium?: boolean; royal?: boolean },
      role: await adminRole(user.username),
    };
  });

export const holoTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const { db } = await import("./admin.server");
    const d = await db();
    const [{ data: tasks }, { data: done }] = await Promise.all([
      d.from("holo_tasks").select("id,title,url,kind,reward_spins,reward_tickets,reward_coins").eq("active", true).order("sort"),
      d.from("holo_task_completions").select("task_id").eq("telegram_id", user.id),
    ]);
    const doneIds = new Set((done ?? []).map((x) => x.task_id as string));
    return (tasks ?? []).map((t) => ({ ...t, done: doneIds.has(t.id as string) })) as {
      id: string; title: string; url: string | null; kind: string; reward_spins: number; reward_tickets: number; reward_coins: number; done: boolean;
    }[];
  });

export const holoClaimTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.extend({ taskId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const { db } = await import("./admin.server");
    const { isMember } = await import("./tg.server");
    const d = await db();
    const { data: t } = await d.from("holo_tasks").select("*").eq("id", data.taskId).eq("active", true).maybeSingle();
    if (!t) return { ok: false as const, error: "Task not found" };
    if ((t.kind === "join_channel" || t.kind === "join_group") && t.chat_id) {
      if (!(await isMember(t.chat_id as string, user.id))) return { ok: false as const, error: "Join first, then tap Check" };
      await d.from("holo_players").update(t.kind === "join_channel" ? { joined_channel: true } : { joined_group: true }).eq("telegram_id", user.id);
    }
    const { error } = await d.from("holo_task_completions").insert({ telegram_id: user.id, task_id: t.id });
    if (error) return { ok: false as const, error: "Already claimed" };
    return { ok: true as const, reward: { spins: t.reward_spins as number, tickets: t.reward_tickets as number, coins: t.reward_coins as number } };
  });

const productId = z.enum(Object.keys(PRODUCTS) as [ProductId, ...ProductId[]]);

export const holoBuy = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.extend({ product: productId, method: z.enum(["stars", "gram"]) }).parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const p = PRODUCTS[data.product];
    const { db } = await import("./admin.server");
    const d = await db();
    const comment = `holo-${crypto.randomUUID().slice(0, 8)}`;
    const amount = data.method === "stars" ? p.stars : p.gram;
    const { data: pay, error } = await d.from("holo_payments").insert({
      telegram_id: user.id, product: p.id, method: data.method, amount, reward: p.reward, comment,
    }).select("id").single();
    if (error || !pay) return { ok: false as const, error: "Could not start payment" };
    if (data.method === "stars") {
      const { tg } = await import("./tg.server");
      const r = await tg<string>("createInvoiceLink", {
        title: `Holo · ${p.title}`, description: `${p.title} for your Holo account`, payload: pay.id,
        currency: "XTR", prices: [{ label: p.title, amount: p.stars }],
      });
      if (!r.ok || !r.result) return { ok: false as const, error: "Stars payment unavailable" };
      return { ok: true as const, method: "stars" as const, link: r.result, paymentId: pay.id as string };
    }
    const address = process.env["HOLO_TON_WALLET"];
    if (!address) return { ok: false as const, error: "Wallet not configured" };
    return { ok: true as const, method: "gram" as const, address, amount, comment, paymentId: pay.id as string };
  });

/** Looks for the GRAM transfer on-chain (matching comment + amount) and credits the reward once. */
export const holoCheckGram = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.extend({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const { db, markPaidAndCredit } = await import("./admin.server");
    const d = await db();
    const { data: pay } = await d.from("holo_payments").select("*").eq("id", data.paymentId).eq("telegram_id", user.id).maybeSingle();
    if (!pay) return { status: "missing" as const };
    if (pay.status === "paid") return { status: "paid" as const };
    const address = process.env["HOLO_TON_WALLET"]!;
    const r = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${address}&limit=50`);
    if (!r.ok) return { status: "pending" as const };
    const j = (await r.json()) as { result?: { transaction_id: { hash: string }; in_msg?: { value: string; message?: string } }[] };
    const need = Math.round(Number(pay.amount) * 1e9);
    const tx = (j.result ?? []).find((t) => t.in_msg?.message?.trim() === pay.comment && Number(t.in_msg?.value ?? 0) >= need);
    if (!tx) return { status: "pending" as const };
    const done = await markPaidAndCredit(pay.id as string, { tx_hash: tx.transaction_id.hash });
    return { status: done ? ("paid" as const) : ("pending" as const) };
  });

// ---------------- Admin (/101) ----------------
const taskInput = z.object({
  title: z.string().min(1).max(120), url: z.string().url().max(300).nullable(), kind: z.enum(["link", "join_channel", "join_group"]),
  chat_id: z.string().max(64).nullable(), reward_spins: z.number().int().min(0).max(100000), reward_tickets: z.number().int().min(0).max(1000),
  reward_coins: z.number().int().min(0).max(10_000_000), active: z.boolean(), sort: z.number().int().min(0).max(1000),
});
const adminAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("overview") }),
  z.object({ action: z.literal("saveTask"), id: z.string().uuid().nullable(), task: taskInput }),
  z.object({ action: z.literal("deleteTask"), id: z.string().uuid() }),
  z.object({ action: z.literal("setAdmin"), username: z.string().regex(/^@?[a-zA-Z0-9_]{3,32}$/), role: z.enum(["owner", "tasks"]) }),
  z.object({ action: z.literal("removeAdmin"), username: z.string().max(40) }),
]);

export const holoAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => init.extend({ op: adminAction }).parse(d))
  .handler(async ({ data }) => {
    const user = await auth(data.initData);
    const { db, adminRole } = await import("./admin.server");
    const role = await adminRole(user.username);
    if (!role) return { ok: false as const, error: "Not allowed" };
    const d = await db();
    const op = data.op;
    const ownerOnly = op.action === "setAdmin" || op.action === "removeAdmin";
    if (ownerOnly && role !== "owner") return { ok: false as const, error: "Not allowed" };
    if (op.action === "saveTask") {
      const q = op.id ? d.from("holo_tasks").update(op.task).eq("id", op.id) : d.from("holo_tasks").insert(op.task);
      const { error } = await q; if (error) return { ok: false as const, error: error.message };
    } else if (op.action === "deleteTask") {
      await d.from("holo_tasks").delete().eq("id", op.id);
    } else if (op.action === "setAdmin") {
      await d.from("holo_admins").upsert({ username: op.username.replace("@", "").toLowerCase(), role: op.role, added_by: user.username });
    } else if (op.action === "removeAdmin") {
      const u = op.username.replace("@", "").toLowerCase();
      if (u === user.username?.toLowerCase()) return { ok: false as const, error: "You can't remove yourself" };
      await d.from("holo_admins").delete().eq("username", u);
    }
    const { data: tasks } = await d.from("holo_tasks").select("*").order("sort");
    if (role !== "owner") return { ok: true as const, role, tasks: tasks ?? [], stats: null, payments: [], admins: [] };
    const since = new Date(Date.now() - 86400_000).toISOString();
    const count = async (f: (q: ReturnType<typeof d.from>) => unknown) => {
      const q = d.from("holo_players").select("telegram_id", { count: "exact", head: true });
      const { count: c } = (await (f(q as never) as Promise<{ count: number | null }>)) ?? { count: 0 };
      return c ?? 0;
    };
    const [players, active24, joinedCh, joinedGr, { data: paid }, { data: payments }, { data: admins }] = await Promise.all([
      count((q) => q), count((q) => (q as unknown as { gte: (a: string, b: string) => unknown }).gte("last_seen_at", since)),
      count((q) => (q as unknown as { eq: (a: string, b: boolean) => unknown }).eq("joined_channel", true)),
      count((q) => (q as unknown as { eq: (a: string, b: boolean) => unknown }).eq("joined_group", true)),
      d.from("holo_payments").select("method, amount").eq("status", "paid"),
      d.from("holo_payments").select("id, telegram_id, product, method, amount, status, created_at").order("created_at", { ascending: false }).limit(30),
      d.from("holo_admins").select("username, role").order("created_at"),
    ]);
    const stars = (paid ?? []).filter((p) => p.method === "stars").reduce((a, p) => a + Number(p.amount), 0);
    const gram = (paid ?? []).filter((p) => p.method === "gram").reduce((a, p) => a + Number(p.amount), 0);
    return { ok: true as const, role, tasks: tasks ?? [], stats: { players, active24, joinedCh, joinedGr, stars, gram, orders: (paid ?? []).length }, payments: payments ?? [], admins: admins ?? [] };
  });
