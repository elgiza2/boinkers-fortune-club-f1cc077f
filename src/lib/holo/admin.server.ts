import type { SupabaseClient } from "@supabase/supabase-js";
import { tg } from "./tg.server";

// Holo tables are server-only (service role). Untyped client keeps this independent of generated types.
export async function db(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

export async function adminRole(username?: string): Promise<"owner" | "tasks" | null> {
  if (!username) return null;
  const { data } = await (await db()).from("holo_admins").select("role").eq("username", username.toLowerCase()).maybeSingle();
  return (data?.role as "owner" | "tasks" | undefined) ?? null;
}

/** Sends a message to every owner admin who has opened the bot. */
export async function notifyOwners(html: string) {
  const d = await db();
  const { data: admins } = await d.from("holo_admins").select("username").eq("role", "owner");
  const names = (admins ?? []).map((a) => a.username as string);
  if (!names.length) return;
  const { data: players } = await d.from("holo_players").select("telegram_id, username").in("username", names);
  await Promise.all((players ?? []).map((p) => tg("sendMessage", { chat_id: p.telegram_id, text: html, parse_mode: "HTML" })));
}

export async function markPaidAndCredit(paymentId: string, extra: Record<string, unknown>) {
  const d = await db();
  const { data: pay } = await d.from("holo_payments").update({ status: "paid", paid_at: new Date().toISOString(), ...extra })
    .eq("id", paymentId).eq("status", "pending").select("*").maybeSingle();
  if (!pay) return null;
  await d.rpc("holo_credit", { p_user: pay.telegram_id, p_reward: pay.reward });
  const { data: player } = await d.from("holo_players").select("username, first_name").eq("telegram_id", pay.telegram_id).maybeSingle();
  const who = player?.username ? `@${player.username}` : (player?.first_name ?? String(pay.telegram_id));
  const unit = pay.method === "stars" ? "⭐ Stars" : "GRAM";
  await notifyOwners(`<b>💰 New payment</b>\n\n<b>User:</b> ${who}\n<b>Product:</b> ${pay.product}\n<b>Amount:</b> ${pay.amount} ${unit}`);
  return pay;
}
