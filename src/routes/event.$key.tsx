import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { useGame, clock } from "@/lib/game";
import { ART, TOKEN_ART } from "@/lib/art";
import { LIVE_EVENTS, eventRun, eventTiers, progressFor } from "@/lib/events";
import { RewardChip } from "@/components/game/LiveEvents";
import sky from "@/assets/night-sky.jpg";

export const Route = createFileRoute("/event/$key")({
  loader: ({ params }) => {
    const def = LIVE_EVENTS.find((e) => e.key === params.key);
    if (!def) throw notFound();
    return { def };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.def.name ?? "Event"} — Solo Slots` },
      { name: "description", content: "Collect event tokens on the slots and unlock rewards." },
      { property: "og:title", content: `${loaderData?.def.name ?? "Event"} — Solo Slots` },
      { property: "og:description", content: "Collect event tokens on the slots and unlock rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventPage,
});

function EventPage() {
  const { def } = Route.useLoaderData();
  const { s, claimLive } = useGame();
  const [now, setNow] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const { run, endsIn } = eventRun(def, now);
  const p = progressFor(s.live[def.key], run);
  const tiers = eventTiers(def);
  return (
    <div className="safe-top relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-night">
      <img src={sky} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="relative flex items-center gap-2 px-4 pt-2">
        <Link to="/" aria-label="Back to slots" className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink/60 text-cream active:scale-90"><ArrowLeft className="h-5 w-5" strokeWidth={3} /></Link>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-ink/70 py-1 pl-1 pr-3">
          <img src={TOKEN_ART[def.key]} alt="" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg leading-none text-cream">{p.tokens}</span>
        </span>
      </div>
      <div className="relative mt-2 text-center">
        <img src={TOKEN_ART[def.key]} alt="" className="mx-auto h-20 w-20 object-contain drop-shadow-[0_4px_0_var(--ink)]" />
        <h1 className="font-display text-3xl leading-none text-sun text-outline">{def.name.toUpperCase()}</h1>
        <p className="mt-1 font-display text-xs text-cream/70">{def.hours}H EVENT · ENDS IN {now ? clock(endsIn) : "--:--:--"}</p>
        <p className="mt-1 px-6 text-xs text-cream/60">Every token you land on the reels counts{def.allFree ? " · all rewards free" : ""}.</p>
        {note && <p className="mt-1 text-xs text-sun">{note}</p>}
      </div>
      <div className="relative mt-3 flex-1 space-y-3 overflow-y-auto px-4 pb-8">
        {tiers.map((t, i) => {
          const done = p.claimed.includes(i), reached = p.tokens >= t.need;
          const pct = Math.min(100, (p.tokens / t.need) * 100);
          return (
            <div key={i} className={`rounded-[22px] border-[3px] border-ink p-3 shadow-[0_4px_0_var(--ink)] ${done ? "bg-ink/50 opacity-60" : t.price ? "bg-gradient-to-b from-grape to-berry" : "bg-gradient-to-b from-sun to-sun-dark"}`}>
              {t.price && <div className="mb-1 font-display text-[10px] tracking-wider text-cream">★ BIG REWARD</div>}
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <img src={TOKEN_ART[def.key]} alt="" className="h-12 w-12 object-contain" />
                  <span className="absolute -bottom-1 right-0 font-display text-base leading-none text-cream text-outline">{t.need}</span>
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <RewardChip r={t.reward} />
                  <div className="bar"><div className="bar-fill" style={{ width: `${Math.max(4, pct)}%`, background: "linear-gradient(90deg, var(--berry), var(--lime))" }} /><span className="bar-label">{Math.min(p.tokens, t.need)}/{t.need}</span></div>
                </div>
                {done ? (
                  <span className="font-display text-sm text-cream">CLAIMED</span>
                ) : t.price ? (
                  <button onClick={() => setNote(`Payments coming soon: ${t.price!.ton} TON or ${t.price!.stars} Stars`)} className="flex h-12 min-w-[92px] flex-col items-center justify-center rounded-2xl border-[3px] border-ink bg-cream px-2 shadow-[0_3px_0_var(--ink)] active:scale-95">
                    <span className="flex items-center gap-1 font-display text-sm leading-none text-ink"><img src={ART.ton} alt="" className="h-4 w-4" />{t.price.ton}</span>
                    <span className="mt-0.5 flex items-center gap-0.5 font-display text-[11px] leading-none text-ink/70"><Star className="h-3 w-3 fill-sun text-sun" />{t.price.stars}</span>
                  </button>
                ) : (
                  <button disabled={!reached} onClick={() => claimLive(def.key, i)} className={`flex h-12 min-w-[92px] items-center justify-center gap-1 rounded-2xl border-[3px] border-ink px-2 font-display text-sm text-cream shadow-[0_3px_0_var(--ink)] active:scale-95 ${reached ? "bg-gradient-to-b from-lime to-sky" : "bg-ink/40"}`}>
                    {reached ? "CLAIM" : <><Lock className="h-4 w-4" strokeWidth={3} />FREE</>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
