import { describe, expect, it } from "vitest";
import { bankProduction, buyCharacter, CHARACTER_COST, mergeRate, moveCharacter, starterBoard } from "./merge";

describe("Merge Island", () => {
  it("buys only level one with coins", () => {
    const result = buyCharacter(starterBoard(), 5000);
    expect(result?.board[2]).toBe(1);
    expect(result?.coins).toBe(5000 - CHARACTER_COST);
  });
  it("rejects insufficient coins and full boards", () => {
    expect(buyCharacter(starterBoard(), 499)).toBeNull();
    expect(buyCharacter(Array(12).fill(1), 5000)).toBeNull();
  });
  it("merges two equal levels into one next-level character", () => {
    const result = moveCharacter(starterBoard(), 0, 1);
    expect(result?.board.slice(0, 2)).toEqual([null, 2]);
    expect(result?.merged).toBe(true);
  });
  it("does not merge unequal characters", () => {
    const board = starterBoard(); board[1] = 2;
    expect(moveCharacter(board, 0, 1)).toBeNull();
  });
  it("moves into empty spaces without leveling up", () => {
    expect(moveCharacter(starterBoard(), 0, 2)?.board.slice(0, 3)).toEqual([null, 1, 1]);
  });
  it("increases total SOLO production after a merge", () => {
    const result = moveCharacter(starterBoard(), 0, 1);
    expect(mergeRate(starterBoard())).toBe(200);
    expect(mergeRate(result?.board ?? [])).toBe(250);
  });
  it("unlocks the coral family at level four", () => {
    const board = starterBoard(); board[0] = 3; board[1] = 3;
    expect(moveCharacter(board, 0, 1)?.level).toBe(4);
  });
  it("banks elapsed production at the old rate, retaining fractions", () => {
    expect(bankProduction(0.5, 0, 1800000, 200)).toBe(100.5);
    expect(bankProduction(2, 1000, 500, 200)).toBe(2);
  });
  it("rejects out of bounds moves and caps the illustrated collection", () => {
    expect(moveCharacter(starterBoard(), 0, 12)).toBeNull();
    const board = starterBoard(); board[0] = 6; board[1] = 6;
    expect(moveCharacter(board, 0, 1)).toBeNull();
  });
});