import { createFileRoute } from "@tanstack/react-router";

// Daily jobs: ?job=notify&slot=morning|noon|evening  (notifications + chat gifts)
//             ?job=post&slot=1|2|3                    (news channel posts)
// Caller must send header x-cron-secret = LOVABLE_CRON_SECRET.
const NOTES: Record<string, { title: string; body: string; reward: { spins?: number; tickets?: number; coins?: number } }> = {
  morning: { title: "Good morning! Your free gift is here", body: "Start the day with free spins — new event tokens are waiting.", reward: { spins: 15 } },
  noon: { title: "Lunch-break bonus", body: "A quick spin could land today's jackpot. Grab your gift first!", reward: { coins: 2000, spins: 5 } },
  evening: { title: "Evening wheel gift", body: "Events are ending soon — finish strong with a free wheel spin.", reward: { tickets: 1, spins: 10 } },
};

export const Route = createFileRoute("/api/public/cron/holo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOVABLE_CRON_SECRET"];
        if (!secret || request.headers.get("x-cron-secret") !== secret) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const job = url.searchParams.get("job");
        const slot = url.searchParams.get("slot") ?? "";
        const day = new Date().toISOString().slice(0, 10);
        const t = await import("@/lib/holo/tg.server");
        const { db } = await import("@/lib/holo/admin.server");
        const d = await db();

        if (job === "notify" && NOTES[slot]) {
          const key = `${day}:${slot}`;
          const { error: dup } = await d.from("holo_notifications").insert({ slot: key });
          if (dup) return Response.json({ ok: true, skipped: "already sent" });
          const n = NOTES[slot]!;
          const { data: players } = await d.from("holo_players").select("telegram_id").eq("bot_started", true).eq("blocked_bot", false).limit(5000);
          let sent = 0, failed = 0;
          for (const p of players ?? []) {
            const { data: gift } = await d.from("holo_gifts").insert({ telegram_id: p.telegram_id, reward: n.reward, reason: slot }).select("id").single();
            if (!gift) { failed++; continue; }
            const r = await t.sendHtml(p.telegram_id, `${t.emoji("🎁")} <b>${n.title}</b>\n\n${n.body}`, {
              inline_keyboard: [[{ text: "🎁  Claim gift", callback_data: `gift:${gift.id}`, style: "success" }], [{ text: "▶️  Play Holo", web_app: { url: t.APP_URL() }, style: "primary" }]],
            });
            if (r.ok) sent++; else { failed++; if (/blocked|deactivated|not found/i.test(r.description ?? "")) await d.from("holo_players").update({ blocked_bot: true }).eq("telegram_id", p.telegram_id); }
          }
          await d.from("holo_notifications").update({ sent, failed }).eq("slot", key);
          return Response.json({ ok: true, sent, failed });
        }

        if (job === "post" && /^[1-3]$/.test(slot)) {
          const key = `${day}:${slot}`;
          const { data: exists } = await d.from("holo_posts").select("id").eq("slot", key).maybeSingle();
          if (exists) return Response.json({ ok: true, skipped: "already posted" });
          const { generateResponse } = await import("@lovable.dev/ai-gateway");
          const topics = ["a new live event and its token", "a tip to win more spins and climb the Fire Pass", "community hype, today's gifts and Royal Pass perks"];
          const res = await generateResponse({
            model: "openai/gpt-6-astra",
            instructions: "You write short Telegram channel posts for Holo, a cute pastel slot & merge game on Telegram with fluffy mascots. Use Telegram HTML only (<b>, <i>). Bold headline on line 1, 2-3 short lines, 2-4 emojis, end with a call to play. Max 400 characters. English. Never invent prices or real-money promises.",
            input: `Write today's post #${slot} about ${topics[Number(slot) - 1]}.`,
          });
          const text = extractText(res).trim().slice(0, 900);
          if (!text) return Response.json({ ok: false, error: "empty post" }, { status: 502 });
          const r = await t.sendHtml(t.NEWS_CHAT, text, { inline_keyboard: [[{ text: "▶️  Play Holo", url: "https://t.me/holoiobot", style: "primary" }]] });
          await d.from("holo_posts").insert({ slot: key, text, message_id: (r.result as { message_id?: number } | undefined)?.message_id ?? null });
          return Response.json({ ok: r.ok });
        }
        return Response.json({ ok: false, error: "unknown job" }, { status: 400 });
      },
    },
  },
});

function extractText(res: unknown): string {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (o["type"] === "output_text" && typeof o["text"] === "string") out.push(o["text"]);
    for (const x of Object.values(o)) if (typeof x === "object") walk(x);
  };
  walk((res as { output?: unknown }).output ?? res);
  return out.join("\n");
}
