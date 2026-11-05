import { createFileRoute } from "@tanstack/react-router";
import { HOLO_CHAT_URL, HOLO_NEWS_URL } from "@/lib/holo/products";

type Update = {
  update_id: number;
  message?: { chat: { id: number; type: string }; from?: { id: number; username?: string; first_name?: string; language_code?: string }; text?: string;
    successful_payment?: { invoice_payload: string; telegram_payment_charge_id: string; total_amount: number } };
  callback_query?: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number }; message_id: number } };
  pre_checkout_query?: { id: string; from: { id: number }; invoice_payload: string; total_amount: number };
};

function startMarkup(appUrl: string) {
  return {
    inline_keyboard: [
      [{ text: "▶️  Play Holo", web_app: { url: appUrl }, style: "primary" }],
      [{ text: "💬  Community", url: HOLO_CHAT_URL, style: "success" }, { text: "📣  News", url: HOLO_NEWS_URL, style: "danger" }],
    ],
  };
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const t = await import("@/lib/holo/tg.server");
        const expected = await t.webhookSecret();
        if (request.headers.get("x-telegram-bot-api-secret-token") !== expected) return new Response("Unauthorized", { status: 401 });
        const u = (await request.json()) as Update;
        const { db, markPaidAndCredit } = await import("@/lib/holo/admin.server");
        const d = await db();

        if (u.pre_checkout_query) {
          const q = u.pre_checkout_query;
          const { data: pay } = await d.from("holo_payments").select("id, amount, status, telegram_id").eq("id", q.invoice_payload).maybeSingle();
          const ok = !!pay && pay.status === "pending" && Number(pay.amount) === q.total_amount && Number(pay.telegram_id) === q.from.id;
          await t.tg("answerPreCheckoutQuery", { pre_checkout_query_id: q.id, ok, ...(ok ? {} : { error_message: "This order expired. Please try again in the app." }) });
          return Response.json({ ok: true });
        }

        const m = u.message;
        if (m?.successful_payment) {
          const sp = m.successful_payment;
          const pay = await markPaidAndCredit(sp.invoice_payload, { charge_id: sp.telegram_payment_charge_id });
          if (pay) await t.sendHtml(m.chat.id, `<b>${t.emoji("✅")} Payment received!</b>\n\n<b>${pay.product}</b> was added to your Holo account. Open the app to see it.`, startMarkup(t.APP_URL()));
          return Response.json({ ok: true });
        }

        if (u.callback_query?.data?.startsWith("gift:")) {
          const cq = u.callback_query;
          const giftId = cq.data!.slice(5);
          const { data: reward } = /^[0-9a-f-]{36}$/.test(giftId) ? await d.rpc("holo_claim_gift", { p_gift: giftId, p_user: cq.from.id }) : { data: null };
          const r = reward as { spins?: number; coins?: number; tickets?: number } | null;
          const parts = r ? [r.spins && `+${r.spins} spins`, r.tickets && `+${r.tickets} wheel`, r.coins && `+${r.coins} coins`].filter(Boolean).join(" · ") : "";
          await t.tg("answerCallbackQuery", { callback_query_id: cq.id, text: r ? `🎁 ${parts} added to your account!` : "This gift was already claimed.", show_alert: !!r });
          if (r && cq.message) await t.tg("editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id,
            reply_markup: { inline_keyboard: [[{ text: "✅  Claimed — Play now", web_app: { url: t.APP_URL() }, style: "success" }]] } });
          return Response.json({ ok: true });
        }

        if (m?.text?.startsWith("/start") && m.chat.type === "private" && m.from) {
          const f = m.from;
          const ref = m.text.split(" ")[1]?.replace(/^ref_?/, "");
          await d.from("holo_players").upsert({ telegram_id: f.id, username: f.username?.toLowerCase() ?? null, first_name: f.first_name ?? null,
            language_code: f.language_code ?? null, bot_started: true, blocked_bot: false }, { onConflict: "telegram_id" });
          if (ref && /^\d+$/.test(ref) && Number(ref) !== f.id) await d.from("holo_players").update({ referred_by: Number(ref) }).eq("telegram_id", f.id).is("referred_by", null);
          const appUrl = ref ? `${t.APP_URL()}?ref=${ref}` : t.APP_URL();
          const name = (f.first_name ?? "friend").replace(/[<>&]/g, "");
          const html = `${t.emoji("✨")} <b>Welcome to Holo, ${name}!</b>\n\n` +
            `<b>Spin. Merge. Collect.</b>\nThe cutest slot adventure on Telegram.\n\n` +
            `${t.emoji("🎰")} <b>Free spins every minute</b>\n${t.emoji("🎁")} <b>Daily gifts right here in chat</b>\n${t.emoji("🏆")} <b>Live events &amp; GRAM prizes</b>\n\n` +
            `<b>Tap Play to start ↓</b>`;
          await t.sendHtml(m.chat.id, html, startMarkup(appUrl), "https://holo-silk-omega.vercel.app/holo-start.jpg");
          return Response.json({ ok: true });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
