import { useState } from "react";
import { useGame, fmt, clock } from "@/lib/game";
import { ART, TOKEN_ART, OFFER_ART } from "@/lib/art";
import { LIVE_EVENTS, eventRun, type EventDef, type EventReward } from "@/lib/events";
import { currentOffers } from "@/lib/offers";
import { Button } from "@/components/ui/button";
import { SlotsOfferDialog } from "@/components/game/OfferPresentation";

export function RewardChip({ r, size = "md" }: { r: EventReward; size?: "md" | "lg" }) {
  const [img, n] = r.spins ? [ART.bolt, fmt(r.spins)] : r.tickets ? [ART.wheelSpin, fmt(r.tickets)] : [ART.ton, String(r.ton ?? 0)];
  return (
    <span className="flex items-center gap-1.5">
      <img src={img} alt="" className={size === "lg" ? "h-9 w-9 object-contain" : "h-7 w-7 object-contain"} />
      <span className={`font-display leading-none text-cream text-outline ${size === "lg" ? "text-2xl" : "text-xl"}`}>{n}</span>
    </span>
  );
}

function Chip({ img, timer, label }: { img: string; timer: string; label: string }) {
  return (
    <span className="relative flex w-[62px] shrink-0 flex-col items-center">
      <img src={img} alt="" className="h-11 w-11 object-contain drop-shadow-[0_3px_0_var(--ink)]" />
      <span className="mt-0.5 rounded-full bg-cream px-1.5 font-display text-[9px] leading-[14px] text-berry">{timer}</span>
      <span className="mt-0.5 line-clamp-2 text-center font-display text-[9px] leading-[10px] text-cream text-outline">{label}</span>
    </span>
  );
}

export function EventsRow({ now }: { now: number }) {
  const [offerKey, setOfferKey] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDef | null>(null);
  const offers = currentOffers(now || 0);
  const offer = offers.find((o) => o.key === offerKey);
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto px-1 pb-1 pt-2.5 [scrollbar-width:none]">
        {LIVE_EVENTS.map((e) => {
          const { endsIn } = eventRun(e, now || 0);
          return (
            <Button variant="ghost" key={e.key} onClick={() => setEvent(e)} aria-label={`Open ${e.name}`} className="h-auto shrink-0 p-0 hover:bg-transparent active:scale-90">
              <Chip img={TOKEN_ART[e.key] ?? ART.gem} timer={now ? clock(endsIn) : "--:--:--"} label={e.name.toUpperCase()} />
            </Button>
          );
        })}
        {offers.map((o) => (
          <Button variant="ghost" key={o.key} onClick={() => setOfferKey(o.key)} aria-label={`Open ${o.name} offer`} className="h-auto shrink-0 p-0 hover:bg-transparent active:scale-90">
            <Chip img={OFFER_ART[o.key] ?? ART.chest} timer={now ? clock(o.endsIn) : "--:--:--"} label={o.name.toUpperCase()} />
          </Button>
        ))}
      </div>
      <SlotsOfferDialog selection={event ? { kind: "event", value: event } : offer ? { kind: "offer", value: offer } : null} now={now} onClose={() => { setEvent(null); setOfferKey(null); }} />
    </>
  );
}
