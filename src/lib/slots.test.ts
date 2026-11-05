import { describe, it, expect } from "vitest";
import { payout } from "./slots";

describe("slots payout rules", () => {
  it("three of a kind pays the big prize", () => {
    expect(payout(["coin", "coin", "coin"], 1).coins).toBe(10000);
    expect(payout(["bolt", "bolt", "bolt"], 1).spins).toBe(50);
    expect(payout(["wheel", "wheel", "wheel"], 1).tickets).toBe(3);
  });
  it("gems pay SOLO, the Holo coin", () => {
    expect(payout(["gem", "gem", "gem"], 1).solo).toBe(500);
    expect(payout(["gem", "gem", "coin"], 1).solo).toBe(40);
  });
  it("two of a kind pays a smaller prize", () => {
    expect(payout(["coin", "coin", "bolt"], 1).coins).toBe(800);
    expect(payout(["bolt", "bolt", "chest"], 1).spins).toBe(3);
  });
  it("no match still pays 150 consolation coins", () => {
    expect(payout(["coin", "bolt", "gem"], 1)).toMatchObject({ coins: 150, spins: 0, solo: 0 });
  });
  it("scales prizes with the bet", () => {
    expect(payout(["coin", "coin", "coin"], 3).coins).toBe(30000);
  });
  it("slots never award GRAM", () => {
    expect(payout(["gem", "gem", "gem"], 10).ton).toBe(0);
  });
});
