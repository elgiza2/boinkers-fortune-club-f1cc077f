// Server-only Telegram helpers for Holo (bot API + Mini App initData verification).
const enc = new TextEncoder();

export function botToken() {
  const t = process.env["HOLO_TELEGRAM_BOT_TOKEN"];
  if (!t) throw new Error("HOLO_TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export const APP_URL = () => process.env["HOLO_APP_URL"] ?? "https://holo-silk-omega.vercel.app";
export const HOLO_EMOJI_ID = "5368765414136364384"; // from t.me/addemoji/creatoper
export const NEWS_CHAT = "@holocom";
export const COMMUNITY_CHAT = "@holoik";

async function hmac(key: Uint8Array, data: string) {
  const k = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export interface TgUser { id: number; username?: string; first_name?: string; photo_url?: string; language_code?: string }

/** Verifies Telegram WebApp initData and returns the user. Rejects data older than 24h. */
export async function verifyInitData(initData: string): Promise<TgUser> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Invalid Telegram session");
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmac(enc.encode("WebAppData"), botToken());
  const sig = hex(await hmac(secret, check));
  if (sig.length !== hash.length || sig !== hash) throw new Error("Invalid Telegram session");
  const age = Date.now() / 1000 - Number(params.get("auth_date") ?? 0);
  if (age > 86400) throw new Error("Telegram session expired");
  const user = JSON.parse(params.get("user") ?? "null") as TgUser | null;
  if (!user?.id) throw new Error("Invalid Telegram session");
  return user;
}

export async function webhookSecret() {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(`holo-webhook:${botToken()}`));
  return hex(new Uint8Array(d));
}

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; result?: T; description?: string }> {
  const r = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const j = (await r.json()) as { ok: boolean; result?: T; description?: string };
  if (!j.ok) console.error(`Telegram ${method} failed: ${j.description}`);
  return j;
}

/** Sends HTML text; retries without custom emoji if Telegram refuses it. */
export async function sendHtml(chat_id: number | string, html: string, reply_markup?: unknown, photo?: string) {
  const plain = html.replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1");
  const unstyled = reply_markup ? JSON.parse(JSON.stringify(reply_markup, (k, v) => (k === "style" || k === "icon_custom_emoji_id" ? undefined : v))) : undefined;
  const send = (text: string, markup: unknown, pic?: string) => pic
    ? tg("sendPhoto", { chat_id, photo: pic, caption: text, parse_mode: "HTML", reply_markup: markup })
    : tg("sendMessage", { chat_id, text, parse_mode: "HTML", reply_markup: markup, link_preview_options: { is_disabled: true } });
  // Progressive fallbacks: full → no custom emoji → no button colors → no photo.
  const attempts: [string, unknown, string | undefined][] = [
    [html, reply_markup, photo], [plain, reply_markup, photo], [plain, unstyled, photo], [plain, unstyled, undefined],
  ];
  let r = { ok: false } as Awaited<ReturnType<typeof tg>>;
  for (const [t, m, p] of attempts) {
    r = await send(t, m, p);
    if (r.ok || /chat not found|blocked|deactivated/i.test(r.description ?? "")) break;
  }
  return r;
}

export const emoji = (fallback = "✨") => `<tg-emoji emoji-id="${HOLO_EMOJI_ID}">${fallback}</tg-emoji>`;

/** True when the user is a member of the chat (bot must be admin in channels). */
export async function isMember(chat: string, userId: number) {
  const r = await tg<{ status: string }>("getChatMember", { chat_id: chat, user_id: userId });
  return !!r.ok && ["creator", "administrator", "member", "restricted"].includes(r.result?.status ?? "");
}
