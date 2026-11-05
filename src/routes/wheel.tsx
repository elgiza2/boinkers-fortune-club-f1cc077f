import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/game/Shell";
import { useGame, beep, haptic } from "@/lib/game";
import prizeBolt from "@/assets/wheel-prize-bolt.png";
import { ART } from "@/lib/art";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import mascot from "@/assets/merge-mascot-3.png";
import { WHEEL_PRIZES, nextWheelBet, wheelLandingRotation } from "@/lib/wheel";

export const Route = createFileRoute("/wheel")({
  head: () => ({
    meta: [
      { title: "Wheel of Fortune — Solo Slots" },
      { name: "description", content: "Use wheel spins to win spins, more wheel spins and TON." },
      { property: "og:title", content: "Wheel of Fortune — Solo Slots" },
      { property: "og:description", content: "Spin the wheel for big prizes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WheelPage,
});

const PRIZES = WHEEL_PRIZES;
const prizeArt = { bolt: prizeBolt, wheel: ART.wheelSpin, ton: ART.ton };
function WheelPage() {
  const { s, spend, grant } = useGame();
  const [rot, setRot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [bet, setBet] = useState(1);
  const seg = 360 / PRIZES.length;
  const go = () => {
    if (busy) return;
    if (!spend({ tickets: bet })) { setWinner("Not enough wheel spins"); return; }
    setBusy(true); setWinner(null); haptic();
    const idx = Math.floor(Math.random() * PRIZES.length);
    setRot(wheelLandingRotation(rot, idx));
    setTimeout(() => { const p = PRIZES[idx]; if (p) { const r = p.reward as { spins?: number; tickets?: number; ton?: number }; grant({ spins: (r.spins ?? 0) * bet, tickets: (r.tickets ?? 0) * bet, ton: +((r.ton ?? 0) * bet).toFixed(2) }); beep(s.sound, 1000, 0.3); setWinner(`+${p.kind === "ton" ? +(Number(p.label) * bet).toFixed(2) + " TON" : p.label + (bet > 1 ? ` ×${bet}` : "")}`); } setBusy(false); }, 4200);
  };
  return (
    <Screen bare scroll={false} navigation={false}>
      <div className="fortune-page">
        <Link to="/" className="fortune-back" aria-label="Back to slots"><ArrowLeft size={24} /></Link>
        <h1 className="fortune-title">WHEEL OF FORTUNE</h1>
        <div className="fortune-stage">
          <div className="fortune-stand"><span>SOLO</span></div>
          <div className="fortune-wheel" aria-label="Prize wheel">
          <Star className="fortune-pointer" strokeWidth={1.8} />
          <div className="fortune-rim">
            {Array.from({ length: 12 }, (_, i) => <span key={i} className={`fortune-bulb ${i % 2 ? "fortune-bulb-pink" : ""}`} style={{ transform: `rotate(${i * 30 + 15}deg)` }}><i /></span>)}
          </div>
          <div className="fortune-disc" style={{ transform: `rotate(${rot}deg)` }}>
            {PRIZES.map((p, i) => (
              <div key={i} className="fortune-prize" style={{ transform: `translateX(-50%) rotate(${i * seg}deg)` }}>
                <div className="fortune-prize-content">
                  <img src={prizeArt[p.kind]} alt="" />
                  <span>{p.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="fortune-hub"><img src={mascot} alt="Golden mascot" /></div>
          </div>
        </div>
        <div className="fortune-controls">
          <span className="fortune-result" role="status">{winner ?? ""}</span>
          <button onClick={() => !busy && setBet((b) => nextWheelBet(b, s.tickets))} aria-label="Change wheel multiplier" className="absolute right-[6%] top-6 grid h-12 w-12 rotate-45 place-items-center rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-sun to-sun-dark shadow-[0_3px_0_var(--ink)] active:scale-90"><span className="-rotate-45 font-display text-base text-cream text-outline">x{bet}</span></button>
          <Button onClick={go} disabled={busy} className="fortune-spin" aria-label="Spin prize wheel">{busy ? "SPINNING" : "SPIN"}</Button>
          <span className="fortune-tickets"><img src={ART.wheelSpin} alt="" className="h-5 w-5" />{s.tickets} wheel spins</span>
        </div>
      </div>
    </Screen>
  );
}
