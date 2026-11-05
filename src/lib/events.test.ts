import { describe, expect, it } from "vitest";
import { LIVE_EVENTS, PAID_PRICE, addTokens, claimable, eventRun, eventTiers } from "./events";
import { PAYTABLE, payout } from "./slots";
import { currentOffers, OFFER_MS } from "./offers";

describe("live events", () => {
  it("has the two reference events lasting 24h or 48h", () => {
    expect(LIVE_EVENTS.map(e => e.name)).toEqual(["Vlad's Egg Trail", "Game Loot"]);
    expect(LIVE_EVENTS.every((e) => e.hours === 24 || e.hours === 48)).toBe(true);
  });
  it("restarts after its duration", () => {
    const e = LIVE_EVENTS[0]!;
    expect(eventRun(e, 0).run).not.toBe(eventRun(e, 24 * 3600_000).run);
  });
  it("counts even a single token and resets on a new run", () => {
    expect(addTokens(undefined, 1, 1).tokens).toBe(1);
    expect(addTokens({ run: 1, tokens: 9, claimed: [0] }, 2, 1)).toEqual({ run: 2, tokens: 1, claimed: [] });
  });
  it("follows free, paid, free, free, free, paid with 0.25 TON / 25 Stars", () => {
    const t = eventTiers(LIVE_EVENTS[0]!).slice(0, 6).map((x) => !!x.price);
    expect(t).toEqual([false, true, false, false, false, true]);
    expect(PAID_PRICE).toEqual({ ton: 0.25, stars: 25 });
  });
  it("some events are fully free", () => {
    expect(LIVE_EVENTS.some((e) => eventTiers(e).every((t) => !t.price))).toBe(true);
  });
  it("paid rewards are bigger than free ones and never coins", () => {
    for (const e of LIVE_EVENTS) for (const t of eventTiers(e)) expect("coins" in t.reward).toBe(false);
    const t = eventTiers(LIVE_EVENTS[0]!);
    const val = (r: { spins?: number; tickets?: number }) => (r.spins ?? 0) + (r.tickets ?? 0) * 20;
    expect(val(t[1]!.reward)).toBeGreaterThan(val(t[2]!.reward));
  });
  it("only counts reached free rewards as claimable", () => {
    const e = LIVE_EVENTS[0]!, t = eventTiers(e);
    expect(claimable(e, { run: 1, tokens: t[0]!.need - 1, claimed: [] })).toBe(0);
    expect(claimable(e, { run: 1, tokens: t[2]!.need, claimed: [] })).toBe(2);
  });
});

describe("slots", () => {
  it("pays spins, wheel spins and coins, not only coins", () => {
    expect(payout(["bolt", "bolt", "bolt"], 1).spins).toBe(25);
    expect(payout(["wheel", "wheel", "wheel"], 1).tickets).toBe(3);
    expect(payout(["wheel", "wheel", "coin"], 1).tickets).toBe(0);
    expect(payout(["gem", "gem", "gem"], 2).coins).toBe(20000);
  });
  it("never awards TON from the slots", () => {
    for (const a of PAYTABLE) expect(payout([a.sym, a.sym, a.sym], 3).ton).toBe(0);
  });
  it("pays consolation coins on a spin with no prize", () => {
    expect(payout(["coin", "bolt", "wheel"], 1).coins).toBe(100);
    expect(payout(["token", "live", "token"], 5).coins).toBe(500);
  });
});

describe("offers", () => {
  it("has Sale Blast and Fusion bundles", () => {
    expect(currentOffers(0).map(o => o.name)).toEqual(["Sale Blast", "Fusion!"]);
  });
  it("change every 4 hours", () => {
    expect(currentOffers(0)).not.toEqual(currentOffers(OFFER_MS));
    expect(currentOffers(1000).map((o) => o.ton)).toEqual(currentOffers(2000).map((o) => o.ton));
  });
});
