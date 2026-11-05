import { describe, expect, it } from "vitest";
import { WHEEL_PRIZES, nextWheelBet, wheelLandingRotation } from "./wheel";

describe("Wheel rewards", () => {
  it("offers more prizes than the previous eight", () => {
    expect(WHEEL_PRIZES.length).toBeGreaterThan(8);
  });
  it("lands the awarded segment under the pointer on repeated spins", () => {
    for (const rotation of [0, 2190, 7890]) {
      WHEEL_PRIZES.forEach((_, index) => {
        const next = wheelLandingRotation(rotation, index);
        expect((next + index * 360 / WHEEL_PRIZES.length) % 360).toBe(0);
        expect(next - rotation).toBeGreaterThanOrEqual(2160);
      });
    }
  });
  it("never gives coins", () => {
    expect(WHEEL_PRIZES.some((p) => "coins" in p.reward)).toBe(false);
  });
  it("multiplier only grows when the player has enough wheel spins", () => {
    expect(nextWheelBet(1, 1)).toBe(1);
    expect(nextWheelBet(1, 3)).toBe(2);
    expect(nextWheelBet(2, 3)).toBe(1);
  });
});
