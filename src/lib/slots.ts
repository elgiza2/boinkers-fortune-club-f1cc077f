/** Slot reel symbols, their chance per reel, and the pay table. */
export const REEL_WEIGHTS = { coin: 30, bolt: 22, wheel: 10, chest: 14, gem: 4, token: 10, live: 10 } as const;
export type BaseSym = "coin" | "bolt" | "wheel" | "chest" | "gem";
export type SlotWin = { coins: number; spins: number; tickets: number; ton: number };

/** Payout per bet x1 for matching exactly 3 of a symbol. Two matches never pay: every symbol must come 3 times, except tokens (which always pay per hit). Slots never award TON. */
export const PAYTABLE: { sym: BaseSym; label: string; three: Partial<SlotWin> }[] = [
  { sym: "coin", label: "Coins", three: { coins: 5000 } },
  { sym: "chest", label: "Treasure", three: { coins: 20000 } },
  { sym: "bolt", label: "Spins", three: { spins: 25 } },
  { sym: "wheel", label: "Wheel spins", three: { tickets: 3 } },
  { sym: "gem", label: "Gems", three: { coins: 10000 } },
];

const TOTAL = Object.values(REEL_WEIGHTS).reduce((a, b) => a + b, 0);
export function symChance(sym: keyof typeof REEL_WEIGHTS) { return REEL_WEIGHTS[sym] / TOTAL; }
/** Probability of exactly 3 or exactly 2 of a symbol in 3 reels. */
export function odds(sym: BaseSym) {
  const p = symChance(sym);
  return { three: p ** 3, two: 3 * p * p * (1 - p) };
}

export function payout(cells: string[], bet: number): SlotWin {
  const out: SlotWin = { coins: 0, spins: 0, tickets: 0, ton: 0 };
  for (const row of PAYTABLE) {
    if (cells.filter((c) => c === row.sym).length !== 3) continue;
    const r = row.three;
    out.coins += (r.coins ?? 0) * bet; out.spins += (r.spins ?? 0) * bet;
    out.tickets += (r.tickets ?? 0) * bet; out.ton = +(out.ton + (r.ton ?? 0) * bet).toFixed(2);
  }
  // Consolation: any spin with no prize still pays a little coins.
  if (!out.coins && !out.spins && !out.tickets && !out.ton) out.coins = 100 * bet;
  return out;
}
