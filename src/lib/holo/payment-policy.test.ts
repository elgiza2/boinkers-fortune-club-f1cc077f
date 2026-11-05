import { describe, expect, it } from "vitest";
import { digitalPaymentAllowed } from "./payment-policy";
import { PRODUCTS, resolveProduct } from "./products";

describe("digital goods checkout", () => {
  it("accepts Stars for digital goods", () => {
    expect(digitalPaymentAllowed("stars")).toBe(true);
  });
  it("rejects direct GRAM checkout for digital goods", () => {
    expect(digitalPaymentAllowed("gram")).toBe(false);
  });
  it("preserves the listed Stars prices", () => {
    expect(Object.values(PRODUCTS).map(p => p.stars)).toEqual([50, 200, 500, 150, 300]);
    expect(resolveProduct("event:neon-soda:1", 0)?.stars).toBe(25);
  });
});