import { usePurchase } from "@/lib/holo/use-purchase";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { ArrowRight, ArrowUp, Check, ChevronDown, Lock, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag, type PayCurrency } from "@/components/game/PayToggle";
import { ART, TOKEN_ART } from "@/lib/art";
import fusionScene from "@/assets/event-fusion-scene.jpg";
import { clock, fmt, useGame } from "@/lib/game";
import { eventRun, eventTiers, progressFor, type EventDef, type Tier } from "@/lib/events";
import { currentOffers, type Offer } from "@/lib/offers";

type Selection = { kind: "offer"; value: Offer } | { kind: "event"; value: EventDef };
export function SlotsOfferDialog({ selection, now, onClose }: { selection: Selection | null; now: number; onClose: () => void }) {
  const layout = selection?.kind === "event" ? selection.value.key === "robot" ? "loot" : "egg" : selection?.value.key === "starter" ? "fusion" : "sale";
  const [pay, setPay] = useState<PayCurrency>("ton");
  return <Dialog.Root open={selection !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className="slots-offer-backdrop" />
      <Dialog.Content className={`slots-offer-dialog slots-offer-${layout}`} aria-describedby={undefined}>
        <Dialog.Close asChild><Button variant="ghost" size="icon" className="slots-offer-close" aria-label="Close offer"><X /></Button></Dialog.Close>
        {selection && <Dialog.Title className="slots-offer-title">{layout === "egg" ? <><span>VLAD’S</span><span>EGG TRAIL</span></> : layout === "loot" ? <><span>GAME</span><span>LOOT</span></> : selection.value.name.toUpperCase()}</Dialog.Title>}
        {selection &&}
        {selection?.kind === "event" && <EventPresentation key={selection.value.key} def={selection.value} now={now} pay={pay} />}
        {selection?.kind === "offer" && <PaidPresentation key={selection.value.key} offer={selection.value} now={now} pay={pay} />}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
function Countdown({ ms, now }: { ms: number; now: number }) {
  return <div className="slots-offer-countdown"><Timer /><span>ENDS IN: {now ? clock(ms) : "--:--:--"}</span></div>;
}
function Reward({ tier, large = false }: { tier: Tier; large?: boolean }) {
  return <span className={`slots-offer-reward ${large ? "slots-offer-reward-large" : ""}`}><img src={tier.reward.spins ? ART.bolt : tier.reward.tickets ? ART.wheelSpin : ART.ton} alt={tier.reward.spins ? "Spins" : tier.reward.tickets ? "Wheel spins" : "TON"} /><strong>{fmt(tier.reward.spins ?? tier.reward.tickets ?? tier.reward.ton ?? 0)}</strong></span>;
}
function EventPresentation({ def, now, pay }: { def: EventDef; now: number; pay: PayCurrency }) {
  const { s, claimLive } = useGame();
  const { buy } = usePurchase();
  const [notice, setNotice] = useState("");
  const { run, endsIn } = eventRun(def, now);
  const p = progressFor(s.live[def.key], run), tiers = eventTiers(def);
  const nextIndex = tiers.findIndex((t, i) => !p.claimed.includes(i) && !t.price);
  const next = tiers[nextIndex];
  const action = (tier: Tier, i: number) => {
    const done = p.claimed.includes(i), reached = p.tokens >= tier.need;
    return <Button className="slots-offer-action slots-offer-step-action" disabled={done || (!tier.price && !reached)} aria-label={done ? `Reward ${i + 1} claimed` : tier.price ? `Buy reward ${i + 1}` : `Claim reward ${i + 1}`} onClick={() => {
      if (tier.price) void buy(`event:${def.key}:${i}`, pay === "ton" ? "gram" : "stars");
      else if (claimLive(def.key, i)) setNotice("Reward collected!");
    }}>{done ? <Check /> : tier.price ? <PriceTag ton={tier.price.ton} currency={pay} /> : <><img src={TOKEN_ART[def.key]} alt="Tokens" />{fmt(tier.need)}</>}{!done && !reached && <Lock className="slots-offer-step-lock" />}</Button>;
  };
  if (def.key === "robot") return <>
    <img className="slots-offer-loot-art" src={TOKEN_ART["robot"]} alt="Green tank and red dragon" width={1152} height={576} />
    <div className="slots-offer-loot-panel">
      <div className="slots-offer-loot-stats"><div><img src={ART.chest} alt="Reward chest" /><strong>{tiers.length}</strong><small>1 PLAYER</small></div><div><strong>COLLECT</strong><img src={TOKEN_ART["robot"]} alt="" /><small><Timer />{now ? clock(endsIn) : "--:--:--"}</small></div></div>
      {next && <div className="slots-offer-loot-claim"><img src={TOKEN_ART["robot"]} alt="Event tokens" /><div><progress value={Math.min(p.tokens, next.need)} max={next.need} /><strong>{fmt(p.tokens)} / {fmt(next.need)}</strong><Button className="slots-offer-action" disabled={p.tokens < next.need} onClick={() => { if (claimLive(def.key, nextIndex)) setNotice("Reward collected!"); }}>CLAIM</Button></div><Reward tier={next} /></div>}
      <div className="slots-offer-loot-standings"><div className="slots-offer-player-row"><strong>1</strong><span className="slots-offer-avatar">Y</span><div><b>YOU</b><span>{fmt(p.tokens)} <img src={TOKEN_ART["robot"]} alt="Event tokens" /></span></div><img src={ART.chest} alt="Reward chest" /></div>
        <div className="slots-offer-loot-empty">No other players yet</div>
      </div>
    </div>
    {notice && <p className="slots-offer-notice" role="status">{notice}</p>}<Countdown ms={endsIn} now={now} />
  </>;
  const final = tiers[tiers.length - 1];
  return <>
    <div className="slots-offer-token-balance"><img src={TOKEN_ART[def.key]} alt="Egg tokens" /><strong>{fmt(p.tokens)}</strong></div>
    {final && <div className="slots-offer-egg-grand"><Reward tier={final} large />{action(final, tiers.length - 1)}<ArrowUp className="slots-offer-grand-arrow" /></div>}
    <div className="slots-offer-trail-scroll"><div className="slots-offer-trail">{tiers.map((tier, i) => {
      const row = Math.floor(i / 3), col = row % 2 === 0 ? i % 3 : 2 - i % 3;
      const done = p.claimed.includes(i), active = !done && p.tokens >= tier.need;
      return <div key={i} className={`slots-offer-step slots-offer-position-${i} ${active ? "slots-offer-step-active" : ""} ${done ? "slots-offer-step-done" : ""}`}>
        <Reward tier={tier} large />{action(tier, i)}
        {i < tiers.length - 1 && <span className={`slots-offer-trail-arrow ${i % 3 === 2 ? "slots-offer-trail-up" : row % 2 ? "slots-offer-trail-left" : "slots-offer-trail-right"}`}>{col === 0 && i % 3 === 2 || col === 2 && i % 3 === 2 ? <ArrowUp /> : <ArrowRight />}</span>}
      </div>;
    })}</div></div>
    {notice && <p className="slots-offer-notice" role="status">{notice}</p>}<Countdown ms={endsIn} now={now} />
  </>;
}
function PaidPresentation({ offer, now, pay }: { offer: Offer; now: number; pay: PayCurrency }) {
  const { buy } = usePurchase();
  const notice = false;
  const payment = () => void buy(`offer:${offer.key}`, pay === "ton" ? "gram" : "stars");
  if (offer.key === "starter") return <>
    <div className="slots-offer-fusion-poster"><img src={fusionScene} alt="Masked hero and knight joining fingers in a lightning burst" width={768} height={1024} /><div className="slots-offer-fusion-copy">COMPLETE ANY<br /><em>JUST A SQUIRE</em><br />CHAPTER NOW!</div><div className="slots-offer-fusion-prize"><Reward tier={{ need: 0, reward: { spins: offer.spins } }} large /><Reward tier={{ need: 0, reward: { tickets: offer.tickets } }} large /></div></div>
    <Button className="slots-offer-action slots-offer-buy" onClick={payment}><PriceTag ton={offer.ton} currency={pay} /></Button>
    {notice && <p role="status" className="slots-offer-notice"></p>}<Countdown ms={offer.endsIn} now={now} />
  </>;
  const upcoming = currentOffers(now + offer.endsIn).find(o => o.key === offer.key);
  const bundle = (value: Offer, locked: boolean) => {
    const part = Math.floor(value.spins / 4);
    const rewards = [{ spins: part }, { spins: part }, { tickets: value.tickets }, { spins: part }, { spins: value.spins - part * 3 }];
    return <div className="slots-offer-sale-panel"><div className="slots-offer-sale-rewards">{rewards.map((reward, i) => <Reward key={i} tier={{ need: 0, reward }} large />)}</div><Button className="slots-offer-action slots-offer-sale-buy" disabled={locked} onClick={payment}><PriceTag ton={value.ton} currency={pay} />{locked && <Lock />}</Button></div>;
  };
  return <>
    <div className="slots-offer-sale-subtitle">SPINS + WHEEL SPINS</div>
    <div className="slots-offer-sale-scroll">{bundle(offer, false)}<ChevronDown className="slots-offer-sale-arrow" /><div className="slots-offer-sale-panel slots-offer-sale-free"><div className="slots-offer-sale-chests">{[0,1,2,3,4].map(i => <img key={i} src={ART.chest} alt="Locked chest" className={`slots-offer-chest-${i}`} />)}</div><Button className="slots-offer-action slots-offer-sale-buy" disabled>FREE <Lock /></Button></div><ChevronDown className="slots-offer-sale-arrow" />{upcoming && bundle(upcoming, true)}</div>
    {notice && <p role="status" className="slots-offer-notice"></p>}<Countdown ms={offer.endsIn} now={now} />
  </>;
}
