import { describe, it, expect } from "vitest";
import { addPassXp, passGift, passNeed } from "./game";
describe("spin pass", () => {
  it("each spin used adds XP and levels up at the threshold", () => {
    const r = addPassXp(99, 1, 1, false);
    expect(r.level).toBe(2); expect(r.xp).toBe(0);
  });
  it("higher levels need more XP", () => { expect(passNeed(5)).toBeGreaterThan(passNeed(1)); });
  it("premium gifts double the spins and add a ticket", () => {
    const f = passGift(4, false), p = passGift(4, true);
    expect(p.spins).toBe(f.spins * 2); expect(p.tickets).toBe(1); expect(f.tickets).toBe(0);
  });
  it("royal gifts quadruple the spins and add two tickets", () => {
    const f = passGift(4, false), r = passGift(4, true, true);
    expect(r.spins).toBe(f.spins * 4); expect(r.tickets).toBe(2);
  });
  it("pass gifts never contain coins — coins come from slots only", () => {
    for (const level of [1, 5, 12]) for (const prem of [false, true]) for (const royal of [false, true]) {
      expect(passGift(level, prem, royal).coins).toBe(0);
    }
  });
});
