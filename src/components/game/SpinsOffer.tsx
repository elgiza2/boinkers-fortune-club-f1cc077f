import { useState } from "react";
import { Modal } from "@/components/game/Shell";
import { PriceTag, type PayCurrency } from "@/components/game/PayToggle";
import { PRODUCTS, SPIN_OFFERS } from "@/lib/holo/products";
import { usePurchase } from "@/lib/holo/use-purchase";
import { ART } from "@/lib/art";
import mascot from "@/assets/holo-mascot-wave.png";

/** Shown when the player runs out of spins: Stars or GRAM spin packs. */
export function SpinsOffer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pay, setPay] = useState<PayCurrency>("stars");
  const { buy, busy } = usePurchase();
  return (
    <Modal open={open} onClose={onClose} title="Out of spins">
      <img src={mascot} alt="Holo mascot waving" width={512} height={512} className="mx-auto -mt-2 h-28 w-28 object-contain" />
      <p className="mb-3 text-center text-sm text-muted-foreground">Spins refill 1 per minute — or grab a pack and keep playing now.</p>
      <div className="grid gap-2">
        {SPIN_OFFERS.map((id, i) => {
          const p = PRODUCTS[id];
          return (
            <button key={id} type="button" disabled={!!busy} onClick={() => void buy(id, pay === "ton" ? "gram" : "stars")}
              className="ios-offer-row" data-best={i === 1 || undefined}>
              <img src={ART.bolt} alt="" className="h-9 w-9 object-contain" />
              <span className="flex-1 text-left"><strong className="block text-[15px]">{p.title}</strong>{i === 1 && <small className="text-xs text-primary">Most popular</small>}</span>
              <PriceTag ton={p.gram} currency={pay} />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
