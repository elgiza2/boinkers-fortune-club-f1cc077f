import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { addTokens, eventRun, eventTiers, LIVE_EVENTS, progressFor, type EventProgress, type EventReward } from "./events";
import { holoSync } from "./holo/holo.functions";
import { bankProduction, buyCharacter, mergeRate, moveCharacter, starterBoard, type Board } from "./merge";

export const MAX_SPINS = 50;
export const SPIN_REGEN_MS = 60_000; // 1 spin / minute
export const PART_MAX = 3;
export type Part = "head" | "body" | "gear";

export const SYMBOLS = ["coin", "bolt", "gem", "chest", "token"] as const;
export type Sym = (typeof SYMBOLS)[number];

export interface GameState {
  coins: number;
  solo: number;
  spins: number;
  tickets: number;
  tokens: number;
  level: number;
  parts: Record<Part, number>;
  lastSpinRegen: number;
  lastSoloClaim: number;
  tasksDone: string[];
  claimedMilestones: number[];
  sound: boolean;
  lang: "en" | "ar";
  passXp: number;
  passLevel: number;
  passEndsAt: number;
  premium: boolean;
  royal: boolean;
  eventId: number;
  evTokens: number;
  evTier: number;
  mergeBoard: Board;
  mergeBest: number;
  soloBank: number;
  live: Record<string, EventProgress>;
  ton: number;
}

const initial = (): GameState => ({
  coins: 5000, solo: 0, spins: MAX_SPINS, tickets: 1, tokens: 0, level: 1,
  parts: { head: 0, body: 0, gear: 0 },
  lastSpinRegen: Date.now(), lastSoloClaim: Date.now(),
  tasksDone: [], claimedMilestones: [], sound: true, lang: "en",
  passXp: 0, passLevel: 1, passEndsAt: Date.now() + PASS_MS, premium: false, royal: false,
  eventId: -1, evTokens: 0, evTier: 0,
  mergeBoard: starterBoard(), mergeBest: 1, soloBank: 0, live: {}, ton: 0,
});

/** Solo per hour grows with character upgrades and level. */
export function soloRate(s: Pick<GameState, "parts" | "level"> & Partial<Pick<GameState, "mergeBoard">>) {
  if (s.mergeBoard) return mergeRate(s.mergeBoard);
  const total = s.parts.head + s.parts.body + s.parts.gear;
  return Math.round(100 * (1 + total * 0.5) * (1 + (s.level - 1) * 0.25));
}
/** Coin cost of the next upgrade on a part — escalates per tier and level. */
export function upgradeCost(level: number, tier: number) {
  return Math.round(1000 * Math.pow(2, tier) * Math.pow(1.8, level - 1));
}
/** Payout for a slot result, scaled by bet multiplier. */
export function slotPayout(r: Sym[], bet: number) {
  const [a, b, c] = r as [Sym, Sym, Sym];
  const out = { coins: 0, spins: 0, tickets: 0, tokens: 1 * bet };
  if (a === b && b === c) {
    const map: Record<Sym, Partial<typeof out>> = {
      coin: { coins: 5000 }, bolt: { spins: 10 }, gem: { coins: 20000, tickets: 1 }, chest: { coins: 10000, spins: 5 }, token: { coins: 15000 },
    };
    const m = map[a];
    out.coins += (m.coins ?? 0) * bet; out.spins += (m.spins ?? 0) * bet; out.tickets += m.tickets ?? 0;
    out.tokens += 5 * bet;
  } else if (a === b || b === c || a === c) {
    out.coins += 300 * bet;
  }
  return out;
}

/** Fire Pass season length: 4 days. */
export const PASS_MS = 4 * 24 * 3600_000;
/** Spin pass: XP needed to finish a level grows with level. */
export function passNeed(level: number) { return Math.round(100 * Math.pow(1.35, level - 1)); }
/** Gift for reaching a new pass level. Premium doubles spins + a ticket; Royal quadruples + 2 tickets. Coins never come from the pass — slots only. */
export function passGift(level: number, premium: boolean, royal = false) {
  // Big spin piles plus wheel spins on every track keep players spinning.
  const spins = 20 + level * 4;
  const wheel = level % 3 === 0 ? 1 : 0;
  if (royal) return { coins: 0, spins: spins * 4, tickets: 3 + wheel * 2 };
  if (premium) return { coins: 0, spins: spins * 2, tickets: 1 + wheel };
  return { coins: 0, spins, tickets: wheel };
}
/** Add XP (1 per spin used), rolling over levels. Returns new xp/level and total gifts earned. */
export function addPassXp(xp: number, level: number, add: number, premium: boolean, royal = false) {
  let x = xp + add, l = level; const gift = { coins: 0, spins: 0, tickets: 0 };
  while (x >= passNeed(l)) { x -= passNeed(l); l += 1; const g = passGift(l, premium, royal); gift.coins += g.coins; gift.spins += g.spins; gift.tickets += g.tickets; }
  return { xp: x, level: l, gift, levelsUp: l - level };
}

/** Luck tiers: the more spins the player holds, the bigger every prize. A full bar of 50 spins pays double. */
export const PRIZE_STEP = 10;
export function prizeTier(spins: number) {
  const step = Math.min(5, Math.floor(Math.max(0, spins) / PRIZE_STEP));
  const mult = 1 + step * 0.2;
  const nextStep = step < 5 ? step + 1 : null;
  return { mult, next: nextStep === null ? null : +(1 + nextStep * 0.2).toFixed(1), spinsToNext: nextStep === null ? 0 : nextStep * PRIZE_STEP - Math.max(0, spins) };
}
/** Scale a slot payout by the luck multiplier, rounding up so a bigger balance never pays less. */
export function applyPrizeMult(win: { coins: number; spins: number; tickets: number; ton: number; solo?: number }, mult: number) {
  return {
    solo: Math.round((win.solo ?? 0) * mult),
    coins: Math.round((win.coins * mult) / 10) * 10,
    spins: Math.ceil(win.spins * mult),
    tickets: Math.ceil(win.tickets * mult),
    ton: +(win.ton * mult).toFixed(2),
  };
}

/** 48h rotating events, each with its own reel token. */
export const EVENT_MS = 48 * 3600_000;
export const EVENTS = [
  { key: "pumpkin", name: "Pumpkin Party" },
  { key: "frog", name: "Frog Frenzy" },
  { key: "star", name: "Star Rush" },
] as const;
export function eventIndex(now: number) { return Math.floor(now / EVENT_MS); }
export function currentEvent(now: number) {
  const id = eventIndex(now);
  return { id, ...EVENTS[id % EVENTS.length]!, endsIn: EVENT_MS - (now % EVENT_MS) };
}
/** Tokens needed for the next reward tier; grows forever. */
export function evNeed(tier: number) { return Math.round(5 * Math.pow(1.4, tier)); }
/** Coin reward for finishing a tier; bigger every tier. */
export function evReward(tier: number) { return Math.round(2000 * Math.pow(1.5, tier)); }
/** Coins paid instantly per event token landed. */
export const COINS_PER_TOKEN = 250;
export function addEventTokens(st: { eventId: number; evTokens: number; evTier: number }, id: number, add: number) {
  let t = (st.eventId === id ? st.evTokens : 0) + add, tier = st.eventId === id ? st.evTier : 0, coins = add * COINS_PER_TOKEN;
  while (t >= evNeed(tier)) { t -= evNeed(tier); coins += evReward(tier); tier += 1; }
  return { eventId: id, evTokens: t, evTier: tier, coins };
}

export const MILESTONES = [
  { at: 10, label: "5 Spins", reward: { spins: 5 } },
  { at: 30, label: "1 Ticket", reward: { tickets: 1 } },
  { at: 60, label: "15 Spins", reward: { spins: 15 }, big: true },
  { at: 100, label: "3 Tickets", reward: { tickets: 3 } },
  { at: 160, label: "40 Spins", reward: { spins: 40 }, big: true },
  { at: 250, label: "8 Tickets", reward: { tickets: 8 } },
  { at: 400, label: "100 Spins", reward: { spins: 100 }, big: true },
];

type Reward = Partial<Pick<GameState, "coins" | "spins" | "tickets" | "solo" | "tokens" | "ton">>;

interface Ctx {
  s: GameState;
  ready: boolean;
  pendingSolo: number;
  nextSpinIn: number;
  grant: (r: Reward) => void;
  spend: (r: Reward) => boolean;
  claimSolo: () => number;
  upgrade: (p: Part) => boolean;
  completeTask: (id: string, r: Reward) => void;
  claimMilestone: (i: number) => void;
  subscribePass: (tier: "premium" | "royal") => void;
  toggleSound: () => void;
  setLang: (lang: "en" | "ar") => void;
  gainPass: (spinsUsed: number) => number;
  gainEvent: (tokens: number) => number;
  buyMerge: () => void;
  moveMerge: (from: number, to: number) => void;
  gainLive: (hits: Record<string, number>) => void;
  claimLive: (key: string, tier: number) => EventReward | null;
  role: "owner" | "tasks" | null;
  syncNow: (first?: boolean) => Promise<void>;
  applyPending: (r: { coins?: number; spins?: number; tickets?: number; gram?: number; premium?: boolean; royal?: boolean }) => void;
}
const GameCtx = createContext<Ctx | null>(null);
const KEY = "solo-slots-v1";

export function GameProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<GameState>(initial);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initial(), ...JSON.parse(raw) });
    } catch { /* ignore */ }
    loaded.current = true; setReady(true);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (loaded.current) localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);

  // ---- Holo server sync (Telegram players): saves progress and applies bot/payment rewards ----
  const [role, setRole] = useState<"owner" | "tasks" | null>(null);
  const sRef = useRef(s); sRef.current = s;
  const applyPending = useCallback((r: { coins?: number; spins?: number; tickets?: number; gram?: number; premium?: boolean; royal?: boolean }) => {
    if (!r || !Object.keys(r).length) return;
    setS((p) => ({
      ...p, coins: p.coins + (r.coins ?? 0), spins: p.spins + (r.spins ?? 0), tickets: p.tickets + (r.tickets ?? 0), ton: +(p.ton + Number(r.gram ?? 0)).toFixed(2),
      ...(r.premium || r.royal ? { premium: true, royal: p.royal || !!r.royal, passEndsAt: Math.max(p.passEndsAt, Date.now() + PASS_MS) } : {}),
    }));
  }, []);
  const syncNow = useCallback(async (first = false) => {
    const initData = tgInitData(); if (!initData) return;
    try {
      const ref = new URLSearchParams(window.location.search).get("ref") ?? tgStartParam() ?? undefined;
      const res = await holoSync({ data: { initData, state: first ? null : (sRef.current as unknown as Record<string, unknown>), ref: ref ?? undefined } });
      if (first && res.saved && !localStorage.getItem(KEY + ":synced")) setS({ ...initial(), ...(JSON.parse(res.saved) as Partial<GameState>) });
      if (first) localStorage.setItem(KEY + ":synced", "1");
      setRole(res.role);
      applyPending(res.pending);
    } catch (e) { console.error("Holo sync failed", e); }
  }, [applyPending]);
  useEffect(() => {
    if (!ready) return;
    void syncNow(true);
    const t = setInterval(() => void syncNow(), 20_000);
    const vis = () => { if (document.visibilityState === "hidden") void syncNow(); else void syncNow(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [ready, syncNow]);


  // spin regen
  useEffect(() => {
    setS((p) => {
      if (p.spins >= MAX_SPINS) return p.lastSpinRegen === now ? p : { ...p, lastSpinRegen: now };
      const gained = Math.floor((now - p.lastSpinRegen) / SPIN_REGEN_MS);
      if (gained <= 0) return p;
      return { ...p, spins: Math.min(MAX_SPINS, p.spins + gained), lastSpinRegen: p.lastSpinRegen + gained * SPIN_REGEN_MS };
    });
  }, [now]);

  const pendingSolo = Math.floor(bankProduction(s.soloBank, s.lastSoloClaim, now, soloRate(s)));
  const nextSpinIn = s.spins >= MAX_SPINS ? 0 : Math.max(0, SPIN_REGEN_MS - (now - s.lastSpinRegen));

  const grant = useCallback((r: Reward) => setS((p) => ({
    ...p, coins: p.coins + (r.coins ?? 0), spins: p.spins + (r.spins ?? 0), tickets: p.tickets + (r.tickets ?? 0),
    solo: p.solo + (r.solo ?? 0), tokens: p.tokens + (r.tokens ?? 0), ton: +(p.ton + (r.ton ?? 0)).toFixed(2),
  })), []);
  const spend = useCallback((r: Reward) => {
    let ok = true;
    setS((p) => {
      if ((r.coins ?? 0) > p.coins || (r.spins ?? 0) > p.spins || (r.tickets ?? 0) > p.tickets) { ok = false; return p; }
      return { ...p, coins: p.coins - (r.coins ?? 0), spins: p.spins - (r.spins ?? 0), tickets: p.tickets - (r.tickets ?? 0) };
    });
    return ok && (r.coins ?? 0) <= s.coins && (r.spins ?? 0) <= s.spins && (r.tickets ?? 0) <= s.tickets;
  }, [s]);
  const gainPass = useCallback((n: number) => {
    const r = addPassXp(s.passXp, s.passLevel, n, s.premium, s.royal);
    setS((p) => ({ ...p, passXp: r.xp, passLevel: r.level, coins: p.coins + r.gift.coins, spins: p.spins + r.gift.spins, tickets: p.tickets + r.gift.tickets }));
    return r.levelsUp ? r.level : 0;
  }, [s.passXp, s.passLevel, s.premium]);
  const gainEvent = useCallback((n: number) => {
    const r = addEventTokens(s, eventIndex(Date.now()), n);
    setS((p) => ({ ...p, eventId: r.eventId, evTokens: r.evTokens, evTier: r.evTier }));
    return r.coins;
  }, [s]);
  const gainLive = useCallback((hits: Record<string, number>) => setS((p) => {
    const at = Date.now(), live = { ...p.live };
    for (const [k, n] of Object.entries(hits)) {
      const def = LIVE_EVENTS.find((e) => e.key === k); if (!def || n <= 0) continue;
      live[k] = addTokens(live[k], eventRun(def, at).run, n);
    }
    return { ...p, live };
  }), []);
  const claimLive = useCallback((key: string, tier: number) => {
    const def = LIVE_EVENTS.find((e) => e.key === key); if (!def) return null;
    const cur = progressFor(s.live[key], eventRun(def, Date.now()).run), t = eventTiers(def)[tier];
    if (!t || t.price || cur.tokens < t.need || cur.claimed.includes(tier)) return null;
    const r = t.reward;
    setS((p) => ({ ...p, spins: p.spins + (r.spins ?? 0), tickets: p.tickets + (r.tickets ?? 0), ton: +(p.ton + (r.ton ?? 0)).toFixed(2), live: { ...p.live, [key]: { ...cur, claimed: [...cur.claimed, tier] } } }));
    return r;
  }, [s]);
  const claimSolo = useCallback(() => {
    const amt = pendingSolo;
    setS((p) => {
      const at = Date.now(), total = bankProduction(p.soloBank, p.lastSoloClaim, at, soloRate(p));
      return { ...p, solo: p.solo + Math.floor(total), soloBank: total % 1, lastSoloClaim: at };
    });
    return amt;
  }, [pendingSolo]);
  const buyMerge = useCallback(() => setS(p => {
    const result = buyCharacter(p.mergeBoard, p.coins);
    if (!result) return p;
    const at = Date.now();
    return { ...p, coins: result.coins, mergeBoard: result.board, soloBank: bankProduction(p.soloBank, p.lastSoloClaim, at, soloRate(p)), lastSoloClaim: at };
  }), []);
  const moveMerge = useCallback((from: number, to: number) => setS(p => {
    const result = moveCharacter(p.mergeBoard, from, to);
    if (!result) return p;
    const at = Date.now();
    return { ...p, mergeBoard: result.board, mergeBest: Math.max(p.mergeBest, result.level), soloBank: bankProduction(p.soloBank, p.lastSoloClaim, at, soloRate(p)), lastSoloClaim: at };
  }), []);
  const upgrade = useCallback((part: Part) => {
    const tier = s.parts[part];
    const cost = upgradeCost(s.level, tier);
    if (tier >= PART_MAX || s.coins < cost) return false;
    const earned = Math.floor(((Date.now() - s.lastSoloClaim) / 3_600_000) * soloRate(s));
    setS((p) => {
      const parts = { ...p.parts, [part]: p.parts[part] + 1 };
      const full = parts.head + parts.body + parts.gear >= PART_MAX * 3;
      // bank solo at the old rate before the rate changes
      return {
        ...p, coins: p.coins - cost, solo: p.solo + earned, lastSoloClaim: Date.now(),
        parts: full ? { head: 0, body: 0, gear: 0 } : parts, level: full ? p.level + 1 : p.level,
      };
    });
    return true;
  }, [s]);
  const completeTask = useCallback((id: string, r: Reward) => {
    setS((p) => p.tasksDone.includes(id) ? p : {
      ...p, tasksDone: [...p.tasksDone, id], coins: p.coins + (r.coins ?? 0), spins: p.spins + (r.spins ?? 0), tickets: p.tickets + (r.tickets ?? 0),
    });
  }, []);
  const claimMilestone = useCallback((i: number) => {
    const m = MILESTONES[i];
    if (!m) return;
    setS((p) => p.claimedMilestones.includes(i) || p.tokens < m.at ? p : {
      ...p, claimedMilestones: [...p.claimedMilestones, i],
      spins: p.spins + (m.reward.spins ?? 0), tickets: p.tickets + (m.reward.tickets ?? 0),
    });
  }, []);
  const toggleSound = useCallback(() => setS((p) => ({ ...p, sound: !p.sound })), []);
  const setLang = useCallback((lang: "en" | "ar") => setS((p) => ({ ...p, lang })), []);
  const subscribePass = useCallback((tier: "premium" | "royal") => setS((p) => ({
    ...p, premium: true, royal: tier === "royal",
    passEndsAt: Math.max(p.passEndsAt, Date.now() + PASS_MS),
  })), []);

  return <GameCtx.Provider value={{ s, ready, pendingSolo, nextSpinIn, grant, spend, claimSolo, upgrade, completeTask, claimMilestone, subscribePass, toggleSound, setLang, gainPass, gainEvent, buyMerge, moveMerge, gainLive, claimLive, role, syncNow, applyPending }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}

export function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.floor(n));
}
export function clock(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return [h, m, sec].map((x) => String(x).padStart(2, "0")).join(":");
}

let ctx: AudioContext | null = null;
export function beep(on: boolean, freq = 600, dur = 0.08) {
  if (!on || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = freq; g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); o.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}
export function haptic() {
  try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium"); } catch { /* ignore */ }
}

type TgWA = { initData?: string; initDataUnsafe?: { start_param?: string } };
const tgWA = (): TgWA | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { Telegram?: { WebApp?: TgWA } }).Telegram?.WebApp);
export function tgInitData() { return tgWA()?.initData || ""; }
function tgStartParam() { return tgWA()?.initDataUnsafe?.start_param?.replace(/^ref_?/, "") ?? null; }
