import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Clock, LockKeyhole, Moon, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import headerArt from "@/assets/holo-royal-header.jpg";
import { ART } from "@/lib/art";
import { usePurchase } from "@/lib/holo/use-purchase";
import { useGame, passGift, passNeed, fmt } from "@/lib/game";
import { PayToggle, PriceTag, type PayCurrency } from "@/components/game/PayToggle";

export const Route = createFileRoute("/pass")({
  head: () => ({
    meta: [
      { title: "Fire Pass — Solo Slots" },
      { name: "description", content: "Track your Fire Pass progress and explore free, premium and royal spin rewards." },
      { property: "og:title", content: "Fire Pass — Solo Slots" },
      { property: "og:description", content: "Free, premium and royal reward tracks for your spins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PassPage,
});

function PassPage() {
  const { s } = useGame();
  const { buy } = usePurchase();
  const [now, setNow] = useState(() => Date.now());
  const [pay, setPay] = useState<PayCurrency>("ton");
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = passTimeLeft(s.passEndsAt - now);
  const firstLevel = Math.max(2, s.passLevel - 2);
  const levels = Array.from({ length: 20 }, (_, i) => firstLevel + i);
  const premiumActive = s.premium || s.royal;
  return (
    <div className="fire-pass-page">
      <header className="fire-pass-header">
        <img src={headerArt} alt="Holo mascot with a crown on gold coins" className="fire-pass-header-art" />
        <Button asChild variant="ghost" size="icon" className="fire-pass-close" aria-label="Close Fire Pass"><Link to="/"><X /></Link></Button>
        <div className="fire-pass-title"><h1>Fire Pass</h1><span className="fire-pass-level"><Clock /> {left}</span></div>
      </header>
      <section className="fire-pass-progress" aria-label="Pass progress">
        <p>Spin the slot and progress!</p>
        <div className="fire-pass-progress-track">
          <span className="fire-pass-progress-ticket"><Ticket /><Moon /></span>
          <progress max={passNeed(s.passLevel)} value={s.passXp} aria-label="Experience to next level" />
          <span className="fire-pass-progress-value">{fmt(s.passXp)} / {fmt(passNeed(s.passLevel))}</span>
          <span className="fire-pass-progress-badge">{s.passLevel}</span>
        </div>
      </section>
      <div className="fire-pass-columns" aria-label="Reward tracks">
        <div><span className="fire-pass-ticket fire-pass-ticket-free">FREE</span></div>
        <div><span className="fire-pass-ticket fire-pass-ticket-pink"><Moon /> PREMIUM</span></div>
        <div><span className="fire-pass-ticket fire-pass-ticket-gold"><Moon /> ROYAL</span></div>
      </div>
      <main className="fire-pass-rewards" aria-label="Pass level rewards">
        {levels.map(level => {
          const free = passGift(level, false), prem = passGift(level, true), royal = passGift(level, true, true);
          const earned = level <= s.passLevel;
          return <div className="fire-pass-row" key={level}>
            <RewardTile label={`${free.spins} spins`} earned={earned}><img src={ART.wheelSpin} alt="Spins" /><strong>x{free.spins}</strong></RewardTile>
            <RewardTile label={`${prem.spins} spins, ${prem.tickets} ticket`} earned={earned && premiumActive} premium locked={!premiumActive}>
              <img src={ART.wheelSpin} alt="Premium spins" /><strong>x{prem.spins}</strong>
            </RewardTile>
            <RewardTile label={`${royal.spins} spins, ${royal.tickets} tickets`} earned={earned && s.royal} premium locked={!s.royal}>
              <img src={ART.wheelSpin} alt="Royal spins" /><strong>x{royal.spins}</strong>
            </RewardTile>
            <span className="fire-pass-row-level">{level}</span>
          </div>;
        })}
      </main>
      <footer className="fire-pass-footer">
        <div className="fire-pass-subscribe">
          <PayToggle value={pay} onChange={setPay} />
          <div className="fire-pass-sub-cards">
            <button type="button" className="fire-pass-sub-card" disabled={premiumActive} onClick={() => void buy("premium_pass", pay === "ton" ? "gram" : "stars")}>
              <span>PREMIUM ×2</span>
              <PriceTag ton={1.5} currency={pay} />
              {premiumActive && <small>ACTIVE</small>}
            </button>
            <button type="button" className="fire-pass-sub-card fire-pass-sub-royal" disabled={s.royal} onClick={() => void buy("royal_pass", pay === "ton" ? "gram" : "stars")}>
              <span>ROYAL ×4</span>
              <PriceTag ton={3} currency={pay} />
              {s.royal && <small>ACTIVE</small>}
            </button>
          </div>
          <p className="fire-pass-sub-note">Rewards are added automatically after payment.</p>
        </div>
      </footer>
    </div>
  );
}

/** Formats the remaining Fire Pass season time as D H / H M / M S. */
function passTimeLeft(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60);
  if (d > 0) return `${d}D ${h}H`;
  if (h > 0) return `${h}H ${m}M`;
  return `${m}M ${String(t % 60).padStart(2, "0")}S`;
}

function RewardTile({ children, label, earned, premium, locked }: { children: React.ReactNode; label: string; earned: boolean; premium?: boolean; locked?: boolean }) {
  return <div className={`fire-pass-cell${premium ? " fire-pass-cell-premium" : ""}`} aria-label={`${label}: ${earned ? "received" : locked ? "premium locked" : "upcoming"}`}>
    <div className={`fire-pass-reward${earned ? " fire-pass-reward-earned" : ""}`}>
      {earned ? <Check className="fire-pass-check" /> : <LockKeyhole className="fire-pass-lock" />}
      {children}
    </div>
  </div>;
}
