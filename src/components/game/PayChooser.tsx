import { useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import starsIcon from "@/assets/icon-stars.png";
import { resolveProduct } from "@/lib/holo/products";

type Req = { product: string; resolve: (m: "stars" | "gram" | null) => void } | null;
let req: Req = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Confirms the exact Stars price; no alternative digital-goods checkout. */
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
        <Dialog.Title className="pay-chooser-title">Confirm purchase</Dialog.Title>
        {p && <p className="pay-chooser-sub">{p.title}</p>}
        <div className="pay-chooser-options">
          <Button type="button" disabled={!p} onClick={() => done("stars")}><img src={starsIcon} alt="" /><span>Telegram Stars</span><b>{p?.stars ?? ""} ⭐</b></Button>
        </div>
        <Dialog.Close asChild><Button variant="ghost" className="pay-chooser-cancel">Cancel</Button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
