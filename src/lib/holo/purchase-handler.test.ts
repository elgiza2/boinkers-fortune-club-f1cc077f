import { expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: (fn: unknown) => fn }),
  }),
}));

import { holoBuy } from "./holo.functions";

it("rejects a direct GRAM request before authentication or payment insertion", async () => {
  const handler = holoBuy as unknown as (input: { data: { initData: string; product: string; method: "gram" } }) => Promise<{ ok: boolean; error: string }>;
  const result = await handler({ data: { initData: "invalid-not-a-session", product: "spins_100", method: "gram" } });
  expect(result).toEqual({ ok: false, error: "Digital goods in Telegram must be purchased with Stars" });
});