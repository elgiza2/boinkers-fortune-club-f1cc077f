/** Paid bundles that refresh every 4 hours; each refresh moves the price and amounts up or down. */
export const OFFER_MS = 4 * 3600_000;
export interface Offer { key: string; name: string; spins: number; tickets: number; ton: number; endsIn: number; trend: "up" | "down" }

const BASE = [
  { key: "mega", name: "Sale Blast", spins: 1500, tickets: 5, ton: 2 },
  { key: "starter", name: "Fusion!", spins: 250, tickets: 3, ton: 0.5 },
];

/** Deterministic 0..1 value for a window + offer, so every player sees the same deal. */
function roll(win: number, i: number) {
  const x = Math.sin(win * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function currentOffers(now: number): Offer[] {
  const win = Math.floor(now / OFFER_MS), endsIn = OFFER_MS - (now % OFFER_MS);
  return BASE.map((b, i) => {
    const f = 0.7 + roll(win, i) * 0.6; // 0.7x .. 1.3x
    const g = 0.8 + roll(win + 99, i) * 0.4;
    return {
      key: b.key, name: b.name, endsIn,
      spins: Math.round((b.spins * f) / 10) * 10,
      tickets: Math.max(1, Math.round(b.tickets * f)),
      ton: Math.max(0.1, Math.round(b.ton * g * 10) / 10),
      trend: f >= 1 ? "up" : "down",
    };
  });
}
