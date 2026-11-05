import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Crown, Gift, Ticket } from "lucide-react";
import hero from "@/assets/hero-character.png";
import { Screen } from "@/components/game/Shell";
import { useGame, fmt, beep, haptic, passNeed, currentEvent, evNeed, evReward, clock, prizeTier, applyPrizeMult } from "@/lib/game";
import { EventsRow } from "@/components/game/LiveEvents";
import { REEL_WEIGHTS, payout } from "@/lib/slots";
import { LIVE_EVENTS } from "@/lib/events";
import { ART, SYM_ART, TOKEN_ART } from "@/lib/art";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solo Slots — Spin & Win" },
      { name: "description", content: "Spin the cartoon slot machine and win coins, spins and tickets." },
      { property: "og:title", content: "Solo Slots — Spin & Win" },
      { property: "og:description", content: "Spin the cartoon slot machine and win coins, spins and tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

type Cell = string; // base symbol, "token" (main event) or a live event key
type WinInfo = { coins: number; spins: number; tickets: number; ton: number; k: number; mult: number; tok?: { key: string; n: number } };
type Burst = { img: string; left: number; top: number; size: number; tx: number; ty: number; s: number; rot: number; dur: number; delay: number };

const rand = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Prize burst: a shower of coins flying out beside the machine toward the player.
function burstParts(p: WinInfo): Burst[] {
  const rng = rand(p.k + 1);
  const kinds: { img: string; n: number; size: number }[] = [];
  if (p.coins) kinds.push({ img: ART.coin, n: Math.min(18, 9 + Math.floor(Math.log10(p.coins + 1) * 3)), size: 28 });
  if (p.spins) kinds.push({ img: ART.bolt, n: 3, size: 24 });
  if (p.tickets) kinds.push({ img: ART.wheelSpin, n: 3, size: 26 });
  if (p.ton) kinds.push({ img: ART.ton, n: 5, size: 30 });
  const out: Burst[] = [];
  for (const kind of kinds) {
    for (let i = 0; i < kind.n; i++) {
      out.push({
        img: kind.img,
        left: 40 + rng() * 20, // start beside the machine
        top: 30 + rng() * 14,
        size: kind.size + Math.round(rng() * 14),
        tx: (rng() * 2 - 1) * 190, // spread across the screen
        ty: 90 + rng() * 280, // fly toward the player
        s: 1.3 + rng() * 1.2, // grow as it gets closer
        rot: (rng() * 2 - 1) * 260,
        dur: 1150 + rng() * 750,
        delay: i * 45 + Math.round(rng() * 120),
      });
    }
  }
  return out.sort((a, b) => a.delay - b.delay);
}
const BASE = ["coin", "bolt", "wheel", "chest", "gem"] as const;
const STRIP: Cell[] = [...BASE, "token", ...LIVE_EVENTS.map((e) => e.key)];
const isLive = (c: Cell) => LIVE_EVENTS.some((e) => e.key === c);
const POOL: [Cell, number][] = [
  ...BASE.map((b) => [b, REEL_WEIGHTS[b]] as [Cell, number]),
  ["token", REEL_WEIGHTS.token],
  ...LIVE_EVENTS.map((e) => [e.key, REEL_WEIGHTS.live / LIVE_EVENTS.length] as [Cell, number]),
];
const rnd = (): Cell => {
  let r = Math.random() * POOL.reduce((a, [, w]) => a + w, 0);
  for (const [c, w] of POOL) { r -= w; if (r <= 0) return c; }
  return "coin";
};
const at = (c: Cell, d: number) => STRIP[(STRIP.indexOf(c) + d) % STRIP.length]!;
const BETS = [1, 3, 5, 10];
const CELL_ART: Record<string, string> = { coin: SYM_ART.coin, bolt: SYM_ART.bolt, chest: SYM_ART.chest, wheel: ART.wheelSpin, gem: SYM_ART.gem };

function SymImg({ sym, className }: { sym: Cell; className: string }) {
  const src = sym === "token" ? TOKEN_ART[currentEvent(Date.now()).key]! : CELL_ART[sym] ?? TOKEN_ART[sym]!;
  return <img src={src} alt={sym} draggable={false} className={`object-contain ${className}`} />;
}

function Home() {
  const { s, spend, grant, gainPass, gainLive, gainEvent } = useGame();
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ev = currentEvent(now);
  const evTok = s.eventId === ev.id ? s.evTokens : 0, evTier = s.eventId === ev.id ? s.evTier : 0;
  const [reels, setReels] = useState<Cell[]>(["bolt", "coin", "chest"]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [bet, setBet] = useState(1);
  const [win, setWin] = useState<WinInfo | null>(null);
  const [pop, setPop] = useState<WinInfo | null>(null);
  const [name, setName] = useState("Player");
  const [levelUp, setLevelUp] = useState(false);
  useEffect(() => {
    const u = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { first_name?: string } } } } }).Telegram?.WebApp?.initDataUnsafe?.user;
    if (u?.first_name) setName(u.first_name);
  }, []);
  const [shake, setShake] = useState(false);
  const [auto, setAuto] = useState(false);
  const holdT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busy = spinning.some(Boolean);

  const spin = () => {
    if (busy) return;
    if (!spend({ spins: bet })) { toast.error("Out of spins! Wait for recharge or earn more."); setAuto(false); return; }
    haptic(); setWin(null);
    const up = gainPass(bet);
    if (up) setTimeout(() => setLevelUp(true), 1500);
    if (up) setTimeout(() => toast.success(`Pass level ${up}! Gifts added`), 1500);
    const raw: Cell[] = [rnd(), rnd(), rnd()];
    // Only one token type may land in the same spin.
    const tokCell = raw.find((c) => c === "token" || isLive(c));
    const result: Cell[] = raw.map((c) => (c !== tokCell && (c === "token" || isLive(c)) ? BASE[Math.floor(Math.random() * BASE.length)]! : c));
    setSpinning([true, true, true]);
    result.forEach((sym, i) => setTimeout(() => {
      setReels((r) => { const n = [...r]; n[i] = sym; return n; });
      setSpinning((sp) => { const n = [...sp]; n[i] = false; return n; });
      beep(s.sound, 300 + i * 120);
      if (i === 2) {
        const p = payout(result, bet);
        const mainHits = result.filter((x) => x === "token").length * bet;
        const tokenCoins = mainHits ? gainEvent(mainHits) : 0;
        const hits: Record<string, number> = {};
        result.filter(isLive).forEach((k) => { hits[k] = (hits[k] ?? 0) + bet; });
        if (Object.keys(hits).length) gainLive(hits);
        // The more spins the player holds, the bigger every prize lands.
        const luck = prizeTier(s.spins);
        const total = applyPrizeMult({ ...p, coins: p.coins + tokenCoins }, luck.mult);
        grant(total);
        if (total.coins || total.spins || total.tickets || total.ton) {
          setShake(true); setTimeout(() => setShake(false), 650);
          beep(s.sound, 900, 0.25);
          const info: WinInfo = { ...total, k: Date.now(), mult: luck.mult };
          setWin(info); setPop(info);
          setTimeout(() => setPop((cur) => (cur?.k === info.k ? null : cur)), 3200);
        }
      }
    }, 700 + i * 350));
  };

  useEffect(() => {
    if (auto && !busy) { const t = setTimeout(spin, 400); return () => clearTimeout(t); }
    return undefined;
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const spinBtn = (
    <div className="relative h-full w-full">
      {/* dark ring behind the diamond */}

      <div className="absolute inset-[6px] rotate-45 rounded-[30px] border-[3px] border-ink bg-night" />
      <button
        onClick={() => { if (auto) setAuto(false); else spin(); }}
        onPointerDown={() => { holdT.current = setTimeout(() => { setAuto(true); toast("Autospin ON — tap to stop"); }, 700); }}
        onPointerUp={() => clearTimeout(holdT.current)} onPointerLeave={() => clearTimeout(holdT.current)}
        aria-label="Spin"
        className="group absolute inset-[13px] transition-transform active:scale-95"
      >
        <span
          className={`absolute inset-0 rotate-45 rounded-[24px] border-[3px] border-ink ${auto ? "bg-berry" : "bg-gradient-to-b from-sun to-sun-dark"}`}
          style={{ boxShadow: "inset 0 -7px 0 oklch(0 0 0 / .18), inset 0 5px 0 oklch(1 0 0 / .55), 0 4px 0 var(--ink)" }}
        />
        <span className="relative flex h-full flex-col items-center justify-center">
          <span className="font-display text-[30px] leading-none text-cream text-outline">{auto ? "STOP" : "SPIN"}</span>
          <span className="mt-1 font-display text-[8px] leading-tight text-ink/60">HOLD FOR<br />AUTOSPIN</span>
        </span>
      </button>
      <button
        onClick={() => setBet((b) => BETS[(BETS.indexOf(b) + 1) % BETS.length]!)}
        aria-label="Change bet"
        className="absolute -right-5 top-0 grid h-11 w-11 rotate-45 place-items-center rounded-[11px] border-[3px] border-ink bg-gradient-to-b from-sun to-sun-dark transition-transform active:scale-90"
        style={{ boxShadow: "inset 0 -4px 0 oklch(0 0 0 / .18), inset 0 3px 0 oklch(1 0 0 / .5), 0 3px 0 var(--ink)" }}
      >
        <span className="-rotate-45 font-display text-base leading-none text-cream text-outline">x{bet}</span>
      </button>
    </div>
  );

  return (
    <Screen bare scroll={false} center={spinBtn}>
      <div className="flex h-full flex-col items-center justify-center px-3 pb-14 pt-2">
        <div className={`relative w-full max-w-[360px] ${shake ? "animate-shake" : ""}`}>
          <div className="slot-card rounded-[32px] border border-cream/20 bg-cream/10 p-3 shadow-[0_20px_50px_-12px_oklch(0_0_0/.6),inset_0_1px_0_oklch(1_0_0/.25)] backdrop-blur-2xl">
            {/* status / winner */}
            <div className="flex h-14 items-center gap-3 overflow-hidden rounded-[20px] bg-ink/40 px-3">
              {win ? (
                <div key={win.k} className="animate-pop flex w-full items-center justify-center gap-2">
                  <span className="font-display text-xs tracking-wider text-cream/70">YOU WON</span>
                  {([["coins", ART.coin], ["spins", ART.bolt], ["tickets", ART.wheelSpin], ["ton", ART.ton]] as const).filter(([k]) => win[k] > 0).map(([k, img]) => (
                    <span key={k} className="flex items-center gap-1 rounded-full bg-cream/15 py-0.5 pl-0.5 pr-2.5">
                      <img src={img} alt="" className="h-7 w-7 object-contain" />
                      <span className="font-display text-base leading-none text-sun">+{k === "ton" ? win[k] : fmt(win[k])}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <img src={hero} alt="" className="h-10 w-10 rounded-full bg-cream/15 object-cover object-top" />
                  <div className="min-w-0 leading-tight">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-cream/60">Welcome back</div>
                    <div className="truncate font-display text-base text-cream">{name}</div>
                  </div>
                  <span className="ml-auto rounded-full bg-cream/15 px-2.5 py-1 text-xs font-semibold text-cream">Good luck!</span>
                </>
              )}
            </div>

            {/* main 48h event token track */}
            <div className="mt-3 flex items-center gap-2 px-1">
              <img src={TOKEN_ART[ev.key]} alt="" className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_3px_0_var(--ink)]" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="truncate font-display text-[11px] leading-none text-cream">{ev.name.toUpperCase()}</span>
                  <span className="font-display text-[10px] leading-none text-cream/60">{now ? clock(ev.endsIn) : ""}</span>
                </div>
                <div className="bar mt-0.5">
                  <div className="bar-fill" style={{ width: `${Math.max(4, (evTok / evNeed(evTier)) * 100)}%`, background: "linear-gradient(90deg, var(--berry), var(--sun))" }} />
                  <span className="bar-label">{evTok}/{evNeed(evTier)}</span>
                </div>
              </div>
              <span className="relative shrink-0">
                <img src={ART.coin} alt="" className="h-9 w-9 object-contain" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[10px] leading-none text-cream text-outline">{fmt(evReward(evTier))}</span>
              </span>
            </div>

            {/* reels */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {reels.map((sym, i) => (
                <div key={i} className="slot-reel relative overflow-hidden rounded-[22px] bg-reel shadow-[inset_0_14px_14px_-10px_oklch(0_0_0/.3),inset_0_-14px_14px_-10px_oklch(0_0_0/.3)]">
                  {spinning[i] ? (
                    <div className="animate-reel flex flex-col items-center blur-[1px]">
                      {[...STRIP, ...STRIP].map((x, k) => <SymImg key={k} sym={x} className="slot-sym-spin" />)}
                    </div>
                  ) : (
                    <div key={sym + i + s.spins} className="animate-thud flex h-full flex-col items-center justify-between">
                      <SymImg sym={at(sym, 1)} className="slot-sym-peek opacity-40" />
                      <SymImg sym={sym} className="slot-sym-main drop-shadow-[0_6px_8px_oklch(0_0_0/.25)]" />
                      <SymImg sym={at(sym, 2)} className="slot-sym-peek slot-sym-peek-b opacity-40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* spin pass */}
            <Link to="/pass" onClick={() => setLevelUp(false)} aria-label="Open spin pass gifts" className={`relative mx-auto mt-3 flex w-[88%] items-center transition-transform active:scale-95 ${levelUp ? "animate-bob" : ""}`}>
              {levelUp && (
                <span className="absolute -top-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink bg-berry px-2 py-0.5 shadow-[0_2px_0_var(--ink)]">
                  <Gift className="h-3 w-3 text-cream" strokeWidth={3} />
                  <span className="font-display text-[10px] leading-none text-cream">TAP TO CLAIM</span>
                </span>
              )}
              <span className={`relative z-10 -mr-2 flex h-6 -rotate-6 items-center gap-1 rounded-md border-2 border-ink px-1.5 shadow-[0_2px_0_var(--ink)] ${s.premium ? "bg-gradient-to-b from-sun to-sun-dark" : "bg-gradient-to-b from-sky to-grape"}`}>
                {s.royal || s.premium ? <Crown className="h-3 w-3 text-ink" strokeWidth={3} /> : <Ticket className="h-3 w-3 text-cream" strokeWidth={3} />}
                <span className={`font-display text-[10px] leading-none tracking-wider ${s.premium ? "text-ink" : "text-cream"}`}>{s.royal ? "ROYAL" : s.premium ? "PREMIUM" : "FREE"}</span>
              </span>
              <div className="bar relative flex-1">
                <div className="bar-fill" style={{ width: `${Math.max(4, Math.min(100, (s.passXp / passNeed(s.passLevel)) * 100))}%`, background: "linear-gradient(90deg, var(--lime), var(--sky))" }} />
                <span className="bar-label">{fmt(s.passXp)}/{fmt(passNeed(s.passLevel))}</span>
              </div>
              <span className={`relative z-10 -ml-2 grid h-8 w-8 rotate-45 place-items-center rounded-[9px] border-2 border-ink bg-gradient-to-br from-sun to-sun-dark ${levelUp ? "ring-4 ring-sun/50" : ""} shadow-[0_2px_0_var(--ink),inset_0_2px_0_oklch(1_0_0/.5)]`}>
                <span className="-rotate-45 font-display text-sm leading-none text-cream text-outline">{s.passLevel}</span>
              </span>
            </Link>
          </div>
          {pop && (
            <div key={pop.k} className="win-burst" role="status">
              {burstParts(pop).map((b, i) => (
                <img
                  key={i}
                  src={b.img}
                  alt=""
                  className="win-burst-coin"
                  style={{
                    left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size,
                    animationDelay: `${b.delay}ms`,
                    ["--tx" as string]: `${b.tx}px`, ["--ty" as string]: `${b.ty}px`,
                    ["--s" as string]: b.s, ["--rot" as string]: `${b.rot}deg`, ["--dur" as string]: `${b.dur}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 w-full max-w-[360px] space-y-2">
          <EventsRow now={now} />
        </div>
      </div>
    </Screen>
  );
}
