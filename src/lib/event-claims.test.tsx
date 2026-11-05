import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GameProvider, useGame } from "./game";
import { eventRun, eventTiers, LIVE_EVENTS } from "./events";

afterEach(() => localStorage.clear());

it("credits a reached free milestone exactly once", async () => {
  const def = LIVE_EVENTS.find(e => e.key === "robot");
  if (!def) throw new Error("Game Loot is missing");
  const first = eventTiers(def)[0];
  if (!first) throw new Error("First milestone is missing");
  localStorage.setItem("solo-slots-v1", JSON.stringify({ spins: 10, live: { robot: { run: eventRun(def, Date.now()).run, tokens: first.need, claimed: [] } } }));
  const { result } = renderHook(() => useGame(), { wrapper: GameProvider });
  await waitFor(() => expect(result.current.ready).toBe(true));
  let prize: unknown;
  act(() => { prize = result.current.claimLive("robot", 0); });
  expect(prize).toEqual({ spins: 12 });
  expect(result.current.s.spins).toBe(22);
  act(() => { prize = result.current.claimLive("robot", 0); });
  expect(prize).toBeNull();
  expect(result.current.s.spins).toBe(22);
});