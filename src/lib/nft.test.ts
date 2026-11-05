import { expect, it } from "vitest";
import { NFT_ITEMS, filterNfts } from "./nft";
it("provides more than 50 distinct collectible artworks", () => {
  expect(NFT_ITEMS.length).toBeGreaterThan(50);
  expect(new Set(NFT_ITEMS.map(item => item.image)).size).toBe(NFT_ITEMS.length);
  expect(NFT_ITEMS.every(item => item.image.length > 0)).toBe(true);
});
it("filters collectibles by collection and name", () => {
  expect(filterNfts("Astronaut", "Explorers").map(item => item.id)).toEqual([1]);
  expect(filterNfts("Astronaut", "Fantasy")).toEqual([]);
});
it("prices spread from 1 to 5000 TON", () => {
  const prices = NFT_ITEMS.map(item => item.price);
  expect(Math.min(...prices)).toBe(1);
  expect(Math.max(...prices)).toBe(5000);
  expect(prices.every(p => Number.isFinite(p) && p >= 1 && p <= 5000)).toBe(true);
});