import { describe, it, expect } from "vitest";
import { prizeTier, applyPrizeMult } from "./game";
describe("luck tiers — the more spins the player holds, the bigger the prizes", () => {
  it("multiplier never shrinks as the spin balance grows", () => {
    let prev = 0;
    for (let s = 0; s <= 50; s++) {
      const m = prizeTier(s).mult;
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });
  it("a full bar of 50 spins pays double, 49 pays 1.8x", () => {
    expect(prizeTier(50).mult).toBe(2);
    expect(prizeTier(49).mult).toBe(1.8);
    expect(prizeTier(0).mult).toBe(1);
  });
  it("counts the spins left until the next multiplier", () => {
    expect(prizeTier(12).spinsToNext).toBe(8);
    expect(prizeTier(12).next).toBe(1.4);
    expect(prizeTier(50).next).toBeNull();
    expect(prizeTier(50).spinsToNext).toBe(0);
  });
  it("scaling rounds up so a bigger balance never pays less", () => {
    expect(applyPrizeMult({ coins: 5000, spins: 25, tickets: 3, ton: 0.05 }, 1.4))
      .toEqual({ solo: 0, coins: 7000, spins: 35, tickets: 5, ton: 0.07 });
  });
});
