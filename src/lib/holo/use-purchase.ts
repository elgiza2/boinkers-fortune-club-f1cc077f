import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { holoBuy, holoCheckGram } from "./holo.functions";
import { tgInitData, useGame } from "@/lib/game";
import { choosePayMethod } from "@/components/game/PayChooser";

type WA = { openInvoice?: (url: string, cb: (status: string) => void) => void; openLink?: (url: string) => void };
const wa = () => (window as unknown as { Telegram?: { WebApp?: WA } }).Telegram?.WebApp;

/** Starts a Stars or GRAM purchase; rewards arrive through the server and are applied by the game sync. */
export function usePurchase() {
  const buyFn = useServerFn(holoBuy), checkFn = useServerFn(holoCheckGram);
  const { syncNow } = useGame();
  const [busy, setBusy] = useState<string | null>(null);
  const buy = useCallback(async (product: string, _preset?: "stars" | "gram") => {
    const initData = tgInitData();
    if (!initData) { toast.error("Open Holo inside Telegram to buy"); return; }
    const method = await choosePayMethod(product);
    if (!method) return;
    setBusy(product);
    try {
      const r = await buyFn({ data: { initData, product, method } });
      if (!r.ok) { toast.error(r.error); return; }
      if (r.method === "stars") {
        const open = wa()?.openInvoice;
        if (!open) { window.open(r.link, "_blank"); return; }
        open(r.link, (status) => {
          if (status === "paid") { toast.success("Payment received! Adding your rewards…"); setTimeout(() => void syncNow(), 1500); }
          else if (status === "failed") toast.error("Payment failed");
        });
        return;
      }
      const nano = Math.round(r.amount * 1e9);
      const link = `https://app.tonkeeper.com/transfer/${r.address}?amount=${nano}&text=${encodeURIComponent(r.comment)}`;
      wa()?.openLink ? wa()!.openLink!(link) : window.open(link, "_blank");
      toast(`Send ${r.amount} GRAM with comment ${r.comment}. We'll confirm automatically.`, { duration: 10000 });
      for (let i = 0; i < 36; i++) {
        await new Promise((res) => setTimeout(res, 5000));
        const c = await checkFn({ data: { initData, paymentId: r.paymentId } });
        if (c.status === "paid") { toast.success("GRAM payment confirmed!"); await syncNow(); return; }
      }
      toast("Still waiting for your GRAM transfer — rewards will appear once it confirms.");
    } catch (e) { console.error(e); toast.error("Payment could not start"); }
    finally { setBusy(null); }
  }, [buyFn, checkFn, syncNow]);
  return { buy, busy };
}
