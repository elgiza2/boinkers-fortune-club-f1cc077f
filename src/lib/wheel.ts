/** Wheel prizes: spins (small to huge), extra wheel spins, and TON. No coins — coins come from slots only. */
export const WHEEL_PRIZES = [
  { label: "10", kind: "bolt", reward: { spins: 10 } },
  { label: "0.05", kind: "ton", reward: { ton: 0.05 } },
  { label: "25", kind: "bolt", reward: { spins: 25 } },
  { label: "2", kind: "wheel", reward: { tickets: 2 } },
  { label: "50", kind: "bolt", reward: { spins: 50 } },
  { label: "0.5", kind: "ton", reward: { ton: 0.5 } },
  { label: "15", kind: "bolt", reward: { spins: 15 } },
  { label: "5", kind: "wheel", reward: { tickets: 5 } },
  { label: "250", kind: "bolt", reward: { spins: 250 } },
  { label: "0.1", kind: "ton", reward: { ton: 0.1 } },
  { label: "1", kind: "wheel", reward: { tickets: 1 } },
  { label: "5K", kind: "bolt", reward: { spins: 5000 } },
] as const;

export const WHEEL_BETS = [1, 2, 5, 10] as const;
/** Highest affordable multiplier: next bet in the cycle that the player has enough wheel spins for, else x1. */
export function nextWheelBet(current: number, balance: number) {
  const i = WHEEL_BETS.indexOf(current as (typeof WHEEL_BETS)[number]);
  for (let k = 1; k <= WHEEL_BETS.length; k++) {
    const b = WHEEL_BETS[(i + k) % WHEEL_BETS.length]!;
    if (b <= Math.max(1, balance)) return b;
  }
  return 1;
}

export function wheelLandingRotation(rotation: number, index: number) {
  return rotation + 2160 + ((360 - index * 360 / WHEEL_PRIZES.length - rotation % 360) % 360 + 360) % 360;
}
