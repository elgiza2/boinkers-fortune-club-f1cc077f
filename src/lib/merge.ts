export const BOARD_SIZE = 12;
export const CHARACTER_COST = 500;
export const MAX_MERGE_LEVEL = 6;
export const CHARACTERS = [
  { name: "Buddy", family: "Buddies", rate: 100 },
  { name: "Scout", family: "Buddies", rate: 250 },
  { name: "Hero", family: "Buddies", rate: 625 },
  { name: "Champion", family: "Royals", rate: 1563 },
  { name: "Prince", family: "Royals", rate: 3908 },
  { name: "King", family: "Royals", rate: 9770 },
] as const;
export type Board = (number | null)[];
export const starterBoard = (): Board => [1, 1, null, null, null, null, null, null, null, null, null, null];
export function mergeRate(board: Board) {
  return board.reduce<number>((sum, level) => sum + (level ? CHARACTERS[level - 1]?.rate ?? 0 : 0), 0);
}
export function buyCharacter(board: Board, coins: number) {
  const slot = board.indexOf(null);
  if (slot < 0 || coins < CHARACTER_COST) return null;
  const next = [...board]; next[slot] = 1;
  return { board: next, coins: coins - CHARACTER_COST, slot };
}
export function moveCharacter(board: Board, from: number, to: number) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= BOARD_SIZE || to >= BOARD_SIZE || from === to) return null;
  const source = board[from], target = board[to];
  if (!source) return null;
  const next = [...board];
  if (target === null) { next[to] = source; next[from] = null; return { board: next, merged: false, level: source }; }
  if (source !== target || source >= MAX_MERGE_LEVEL) return null;
  next[from] = null; next[to] = source + 1;
  return { board: next, merged: true, level: source + 1 };
}
export function bankProduction(bank: number, lastClaim: number, now: number, rate: number) {
  return bank + Math.max(0, now - lastClaim) / 3600000 * rate;
}