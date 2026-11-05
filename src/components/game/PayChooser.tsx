import { useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ART } from "@/lib/art";
import starsIcon from "@/assets/icon-stars.png";
import { resolveProduct } from "@/lib/holo/products";

type Req = { product: string; resolve: (m: "stars" | "gram" | null) => void } | null;
let req: Req = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Asks the player how to pay (Stars or GRAM) for one product; resolves null when dismissed. */
export function choosePayMethod(product: string) {
  return new Promise<"stars" | "gram" | null>((resolve) => { req?.resolve(null); req = { product, resolve }; emit(); });
}
function done(m: "stars" | "gram" | null) { const r = req; req = null; emit(); r?.resolve(m); }

export function PayChooser() {
  const cur = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => req, () => null);
  const p = cur ? resolveProduct(cur.product) : null;
  return <Dialog.Root open={!!cur} onOpenChange={(o) => { if (!o) done(null); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="pay-chooser-backdrop" />
      <Dialog.Content className="pay-chooser" aria-describedby={undefined}>
        <span className="pay-chooser-grab" />
        <Dialog.Title className="pay-chooser-title">Choose payment</Dialog.Title>
        {p && <p className="pay-chooser-sub">{p.title}</p>}
        <div className="pay-chooser-options">
          <button type="button" onClick={() => done("stars")}><img src={starsIcon} alt="" /><span>Telegram Stars</span><b>{p?.stars ?? ""} ⭐</b></button>
          <button type="button" onClick={() => done("gram")}><img src={ART.ton} alt="" /><span>GRAM</span><b>{p?.gram ?? ""} GRAM</b></button>
        </div>
        <Dialog.Close className="pay-chooser-cancel">Cancel</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
