import { usePurchase } from "@/lib/holo/use-purchase";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Lock, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/game/PayToggle";
import { ART, TOKEN_ART } from "@/lib/art";
import fusionScene from "@/assets/event-fusion-scene.jpg";
import { clock, fmt, useGame } from "@/lib/game";
import { eventRun, eventTiers, progressFor, type EventDef, type Tier } from "@/lib/events";
import { type Offer } from "@/lib/offers";
import { resolveProduct } from "@/lib/holo/products";

type Selection = { kind: "offer"; value: Offer } | { kind: "event"; value: EventDef };
export function SlotsOfferDialog({ selection, now, onClose }: { selection: Selection | null; now: number; onClose: () => void }) {
  const layout = selection?.kind === "event" ? selection.value.key === "robot" ? "loot" : "egg" : selection?.value.key === "starter" ? "fusion" : "sale";
  return <Dialog.Root open={selection !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className="slots-offer-backdrop" />
      <Dialog.Content className={`slots-offer-dialog slots-offer-${layout} slots-offer-clean`} aria-describedby={undefined}>
        <Dialog.Close asChild><Button variant="ghost" size="icon" className="slots-offer-close" aria-label="Close offer"><X /></Button></Dialog.Close>
        <div className="slots-offer-heading"><span className="slots-offer-kind">{selection?.kind === "event" ? "COLLECTION" : "BUNDLE"}</span>
          <Dialog.Title className="slots-offer-title">{selection?.value.name}</Dialog.Title>
        </div>
        {selection?.kind === "event" && <EventPresentation key={selection.value.key} def={selection.value} now={now} />}
        {selection?.kind === "offer" && <PaidPresentation key={selection.value.key} offer={selection.value} now={now} />}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
function Countdown({ ms, now, offer = false }: { ms: number; now: number; offer?: boolean }) {
  return <div className="slots-offer-countdown"><Timer /><span>{offer ? "REFRESHES IN" : "ENDS IN"} {now ? clock(ms) : "--:--:--"}</span></div>;
}
function Reward({ tier, large = false }: { tier: Tier; large?: boolean }) {
  return <span className={`slots-offer-reward ${large ? "slots-offer-reward-large" : ""}`}>
    {tier.reward.spins ? <span><img src={ART.bolt} alt="Spins" /><strong>{fmt(tier.reward.spins)}</strong></span> : null}
    {tier.reward.tickets ? <span><img src={ART.wheelSpin} alt="Wheel spins" /><strong>{fmt(tier.reward.tickets)}</strong></span> : null}
    {tier.reward.ton ? <span><img src={ART.ton} alt="TON" /><strong>{tier.reward.ton}</strong></span> : null}
  </span>;
}
function EventPresentation({ def, now }: { def: EventDef; now: number }) {
  const { s, claimLive } = useGame();
  const { buy, busy } = usePurchase();
  const { run, endsIn } = eventRun(def, now);
  const p = progressFor(s.live[def.key], run), tiers = eventTiers(def);
  const next = tiers.find((t, i) => !t.price && !p.claimed.includes(i));
  const earned = tiers.filter((_, i) => p.claimed.includes(i)).length;
  const action = (tier: Tier, i: number) => {
    const done = p.claimed.includes(i), reached = p.tokens >= tier.need;
    return <Button className="slots-offer-action slots-offer-step-action" disabled={!!busy || done || (!tier.price && !reached)} aria-label={done ? `Reward ${i + 1} claimed` : tier.price ? `Buy reward ${i + 1}` : `Claim reward ${i + 1}`} onClick={() => {
      if (tier.price) void buy(`event:${def.key}:${i}`, "stars");
      else claimLive(def.key, i);
    }}>{done ? <Check /> : tier.price ? <PriceTag ton={tier.price.ton} stars={tier.price.stars} currency="stars" /> : reached ? "CLAIM" : <><Lock /><img src={TOKEN_ART[def.key]} alt="Tokens" />{fmt(tier.need)}</>}</Button>;
  };
  return <>
    <div className="slots-offer-summary"><img src={TOKEN_ART[def.key]} alt="Event tokens" /><div><strong>{fmt(p.tokens)}</strong><span>Tokens collected</span></div><div className="slots-offer-completion"><strong>{earned} / {tiers.length}</strong><span>Rewards collected</span></div></div>
    {def.key === "robot" && <div className="slots-offer-personal-progress"><span>{next ? `${fmt(p.tokens)} / ${fmt(next.need)}` : "Collection complete"}</span><progress value={next ? Math.min(p.tokens, next.need) : 1} max={next?.need ?? 1} aria-label="Next collection reward" /></div>}
    <div className="slots-offer-trail-scroll"><div className="slots-offer-trail">{tiers.map((tier, i) => {
      const done = p.claimed.includes(i), active = !done && p.tokens >= tier.need;
      return <div key={i} className={`slots-offer-step ${active ? "slots-offer-step-active" : ""} ${done ? "slots-offer-step-done" : ""}`}>
        <span className="slots-offer-stage">{String(i + 1).padStart(2, "0")}</span><Reward tier={tier} large />{action(tier, i)}
      </div>;
    })}</div></div>
    <Countdown ms={endsIn} now={now} />
  </>;
}
function PaidPresentation({ offer, now }: { offer: Offer; now: number }) {
  const { buy, busy } = usePurchase();
  const product = resolveProduct(`offer:${offer.key}`, now);
  return <>
    {offer.key === "starter" ? <img className="slots-offer-bundle-art" src={fusionScene} alt="Two characters joining forces" /> : <img className="slots-offer-bundle-art slots-offer-bundle-icon" src={ART.chest} alt="Reward chest" />}
    <div className="slots-offer-bundle-rewards"><div><img src={ART.bolt} alt="Spins" /><strong>{fmt(offer.spins)}</strong><span>Spins</span></div><div><img src={ART.wheelSpin} alt="Wheel spins" /><strong>{fmt(offer.tickets)}</strong><span>Wheel spins</span></div></div>
    <Button className="slots-offer-action slots-offer-buy" disabled={!!busy || !product} onClick={() => void buy(`offer:${offer.key}`, "stars")}><PriceTag ton={offer.ton} stars={product?.stars} currency="stars" /></Button>
    <Countdown ms={offer.endsIn} now={now} offer />
  </>;
}
