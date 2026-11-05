const images = import.meta.glob<string>("../assets/nft-*-*.webp", { eager: true, query: "?url", import: "default" });
const groups = [
  { key: "explorers", name: "Explorers", names: ["Astronaut", "Pirate", "Knight", "Diver", "Aviator", "Explorer", "Firefighter", "Doctor", "Chef", "Detective", "Sailor", "Cowboy", "Ninja", "Samurai", "Ranger", "Skier", "Surfer", "Cyclist", "Racer", "Mountaineer"] },
  { key: "fantasy", name: "Fantasy", names: ["Ice King", "Fire Wizard", "Forest Fairy", "Moon Mage", "Dragon Keeper", "Crystal Knight", "Mushroom Druid", "Ocean Prince", "Star Angel", "Shadow Rogue", "Royal Queen", "Golden Emperor", "Emerald Sorcerer", "Rainbow Unicorn", "Phoenix Warrior", "Snow Elf", "Flower Guardian", "Thunder Hero", "Candy Monarch", "Celestial Oracle"] },
  { key: "legends", name: "Legends", names: ["Neon DJ", "Rock Star", "Street Dancer", "Disco Star", "Street Artist", "Engineer", "Cyber Hero", "Arcade Champion", "Basketball Pro", "Football Star", "Tennis Ace", "Boxer", "Scientist", "Gardener", "Photographer", "Magician", "Gold Tycoon", "Jewel Collector", "Carnival Star", "Future Pilot"] },
] as const;

/** Rarity bands and their TON price ranges, from 1 TON up to 5000 TON. */
const BANDS = [
  { from: 0, count: 10, lo: 1, hi: 50 },
  { from: 10, count: 6, lo: 80, hi: 500 },
  { from: 16, count: 4, lo: 800, hi: 5000 },
] as const;

/** Rounds to two significant digits so prices stay readable. */
function nice(v: number) {
  const exp = Math.floor(Math.log10(v)) - 1;
  const m = Math.pow(10, exp);
  return +(Math.round(v / m) * m).toFixed(Math.max(0, -exp));
}
function bandPrice(i: number) {
  const band = BANDS.find((b) => i >= b.from && i < b.from + b.count) ?? BANDS[0];
  const j = i - band.from;
  return nice(band.lo * Math.pow(band.hi / band.lo, band.count > 1 ? j / (band.count - 1) : 0));
}

export const NFT_ITEMS = groups.flatMap((group, g) => group.names.map((name, i) => ({
  id: g * 20 + i + 1, name, group: group.name,
  rarity: i >= 16 ? "Legendary" : i >= 10 ? "Epic" : "Rare",
  price: bandPrice(i), // TON
  image: images[`../assets/nft-${group.key}-${i + 1}.webp`] ?? "",
})));
export type NftItem = typeof NFT_ITEMS[number];
export function filterNfts(query: string, group: string) {
  const q = query.trim().toLowerCase();
  return NFT_ITEMS.filter(item => (group === "All" || item.group === group) && (!q || `${item.name} ${item.id}`.toLowerCase().includes(q)));
}
