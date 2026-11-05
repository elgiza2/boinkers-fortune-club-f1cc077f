/** Holo paid products. Prices: Stars (XTR) and GRAM (formerly TON). Shared by client and server. */
export type ProductId = "spins_100" | "spins_500" | "spins_1500" | "premium_pass" | "royal_pass";
export interface Product {
  id: ProductId;
  title: string;
  stars: number;
  gram: number;
  reward: { spins?: number; tickets?: number; coins?: number; premium?: boolean; royal?: boolean };
}

export const PRODUCTS: Record<ProductId, Product> = {
  spins_100: { id: "spins_100", title: "100 Spins", stars: 50, gram: 0.5, reward: { spins: 100 } },
  spins_500: { id: "spins_500", title: "500 Spins + 3 Wheel", stars: 200, gram: 2, reward: { spins: 500, tickets: 3 } },
  spins_1500: { id: "spins_1500", title: "1500 Spins + 10 Wheel", stars: 500, gram: 5, reward: { spins: 1500, tickets: 10 } },
  premium_pass: { id: "premium_pass", title: "Premium Pass ×2", stars: 150, gram: 1.5, reward: { premium: true } },
  royal_pass: { id: "royal_pass", title: "Royal Pass ×4", stars: 300, gram: 3, reward: { royal: true, premium: true } },
};

export const SPIN_OFFERS: ProductId[] = ["spins_100", "spins_500", "spins_1500"];
export const HOLO_CHAT_URL = "https://t.me/holoik";
export const HOLO_NEWS_URL = "https://t.me/holocom";
