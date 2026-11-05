/** Slot reel symbols, their chance per reel, and the pay table. */
export const REEL_WEIGHTS = { coin: 30, bolt: 22, wheel: 10, chest: 14, gem: 4, token: 10, live: 10 } as const;
export type BaseSym = "coin" | "bolt" | "wheel" | "chest" | "gem";
export type SlotWin = { coins: number; spins: number; tickets: number; ton: number; solo: number };

/** Payout per bet x1. Three of a kind pays big; two of a kind pays a smaller prize so wins come often. Gems pay SOLO, the Holo coin. Slots never award GRAM. */
export const PAYTABLE: { sym: BaseSym; label: string; three: Partial<SlotWin>; two: Partial<SlotWin> }[] = [
  { sym: "coin", label: "Coins", three: { coins: 10000 }, two: { coins: 800 } },
  { sym: "chest", label: "Treasure", three: { coins: 40000, spins: 10 }, two: { coins: 2500 } },
  { sym: "bolt", label: "Spins", three: { spins: 50 }, two: { spins: 3 } },
  { sym: "wheel", label: "Wheel spins", three: { tickets: 3 }, two: { spins: 2 } },
  { sym: "gem", label: "SOLO", three: { solo: 500, coins: 10000 }, two: { solo: 40 } },
];

const TOTAL = Object.values(REEL_WEIGHTS).reduce((a, b) => a + b, 0);
export function symChance(sym: keyof typeof REEL_WEIGHTS) { return REEL_WEIGHTS[sym] / TOTAL; }
/** Probability of exactly 3 or exactly 2 of a symbol in 3 reels. */
export function odds(sym: BaseSym) {
  const p = symChance(sym);
  return { three: p ** 3, two: 3 * p * p * (1 - p) };
}

export function payout(cells: string[], bet: number): SlotWin {
  const out: SlotWin = { coins: 0, spins: 0, tickets: 0, ton: 0, solo: 0 };
  for (const row of PAYTABLE) {
    const n = cells.filter((c) => c === row.sym).length;
    const r = n === 3 ? row.three : n === 2 ? row.two : null;
    if (!r) continue;
    out.coins += (r.coins ?? 0) * bet; out.spins += (r.spins ?? 0) * bet;
    out.tickets += (r.tickets ?? 0) * bet; out.solo += (r.solo ?? 0) * bet;
  }
  // Consolation: any spin with no prize still pays a little coins.
  if (!out.coins && !out.spins && !out.tickets && !out.solo) out.coins = 150 * bet;
  return out;
}
