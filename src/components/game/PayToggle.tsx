import { ART } from "@/lib/art";
import starsIcon from "@/assets/icon-stars.png";

export type PayCurrency = "ton" | "stars";
/** Legacy catalogue pricing factor, not a market exchange rate. */
export const STARS_PER_TON = 100;
export function starsFor(ton: number) { return Math.max(1, Math.round(ton * STARS_PER_TON)); }

/** Lets the player pick the currency — Telegram Stars or GRAM — wherever the game sells something. */
export function PayToggle({ value, onChange, className = "" }: { value: PayCurrency; onChange: (c: PayCurrency) => void; className?: string }) {
  return <div className={`pay-toggle ${className}`} role="radiogroup" aria-label="Pay with GRAM or Telegram Stars">
    <button type="button" role="radio" aria-checked={value === "ton"} className={value === "ton" ? "pay-toggle-on" : ""} onClick={() => onChange("ton")}>
      <img src={ART.ton} alt="" />GRAM
    </button>
    <button type="button" role="radio" aria-checked={value === "stars"} className={value === "stars" ? "pay-toggle-on" : ""} onClick={() => onChange("stars")}>
      <img src={starsIcon} alt="" />STARS
    </button>
  </div>;
}

/** Price rendered in the chosen currency. */
export function PriceTag({ ton, currency, stars: listedStars, className = "" }: { ton: number; currency: PayCurrency; stars?: number; className?: string }) {
  const stars = listedStars ?? starsFor(ton);
  return <span className={`price-tag ${className}`}>
    <img src={currency === "ton" ? ART.ton : starsIcon} alt="" />
    {currency === "ton" ? `${ton} GRAM` : `${stars} STARS`}
  </span>;
}
