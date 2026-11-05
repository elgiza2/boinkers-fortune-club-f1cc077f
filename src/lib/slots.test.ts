import { describe, it, expect } from "vitest";
import { payout, PAYTABLE } from "./slots";

describe("slots payout rules", () => {
  it("pays only when a symbol comes 3 times", () => {
    expect(payout(["coin", "coin", "coin"], 1).coins).toBe(5000);
    expect(payout(["chest", "chest", "chest"], 1).coins).toBe(20000);
    expect(payout(["bolt", "bolt", "bolt"], 1).spins).toBe(25);
    expect(payout(["wheel", "wheel", "wheel"], 1).tickets).toBe(3);
    expect(payout(["gem", "gem", "gem"], 1).coins).toBe(10000);
  });

  it("never pays for 2 of a kind — every symbol needs 3, except tokens", () => {
    for (const row of PAYTABLE) {
      const other = row.sym === "chest" ? "bolt" : "chest";
      const w = payout([row.sym, row.sym, other], 1);
      expect(w.coins).toBe(100); // only the consolation coins, no symbol prize
      expect(w.spins).toBe(0);
      expect(w.tickets).toBe(0);
    }
  });

  it("still pays the small consolation when nothing matches", () => {
    expect(payout(["coin", "bolt", "gem"], 1).coins).toBe(100);
  });

  it("scales prizes with the bet", () => {
    expect(payout(["coin", "coin", "coin"], 2).coins).toBe(10000);
  });
});
