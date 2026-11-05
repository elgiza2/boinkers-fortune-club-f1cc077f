import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Volume2, VolumeX, X, Menu, Wallet } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero-character.png";
import sky from "@/assets/night-sky.jpg";
import { fmt, useGame, MAX_SPINS } from "@/lib/game";
import { ART } from "@/lib/art";
import { getTonWallet } from "@/lib/ton-wallet";
import nftIcon from "@/assets/nav-nft.png";

type TgWebApp = { safeAreaInset?: { top?: number }; contentSafeAreaInset?: { top?: number }; initDataUnsafe?: { user?: { first_name?: string; username?: string } }; onEvent?: (e: string, cb: () => void) => void };
function useTelegramSafeTop() {
  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
    const apply = () => {
      const top = (tg?.safeAreaInset?.top ?? 0) + (tg?.contentSafeAreaInset?.top ?? 0);
      document.documentElement.style.setProperty("--tg-safe-top", `${top}px`);
    };
    apply();
    tg?.onEvent?.("safeAreaChanged", apply);
    tg?.onEvent?.("contentSafeAreaChanged", apply);
  }, []);
}

export function TopBar() {
  const { s } = useGame();
  const [settings, setSettings] = useState(false);
  const [name, setName] = useState("Player");
  useTelegramSafeTop();
  useEffect(() => {
    const u = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp?.initDataUnsafe?.user;
    if (u?.first_name || u?.username) setName(u.username ?? u.first_name ?? "Player");
  }, []);
  return (
    <header className="safe-top relative z-30 shrink-0 border-b border-cream/10 bg-ink/45 backdrop-blur-xl">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-[3px] border-lime bg-ink">
            <img src={hero} alt="" className="h-full w-full scale-125 object-cover object-top" />
          </div>
          <div className="min-w-0 leading-none">
            <div className="max-w-[64px] truncate font-display text-[11px] text-cream">{name}</div>
            <div className="mt-0.5 flex items-center gap-0.5"><img src={ART.gem} alt="" className="h-3.5 w-3.5" /><span className="font-display text-[11px] text-cream">{fmt(s.solo)}</span></div>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3">
          <Pill icon={ART.coin} value={fmt(s.coins)} />
          <Pill icon={ART.wheelSpin} value={fmt(s.tickets)} />
          <Pill icon={ART.ton} value={String(s.ton)} />
        </div>
        <button onClick={() => setSettings(true)} aria-label="Open settings" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gradient-to-b from-sky to-grape text-cream shadow-[0_2px_0_var(--ink)] active:scale-90">
          <Menu className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </header>
  );
}

function Pill({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="relative flex h-7 shrink-0 items-center rounded-full border border-cream/15 bg-ink/70 pl-5 pr-2">
      <img src={icon} alt="" className="absolute -left-2.5 h-7 w-7 object-contain drop-shadow-[0_2px_0_var(--ink)]" />
      <span className="font-display text-xs leading-none text-cream">{value}</span>
    </div>
  );
}

function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, toggleSound, setLang } = useGame();
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  async function connect() {
    setConnecting(true);
    try {
      const wallet = await getTonWallet();
      wallet.onStatusChange(value => setAddress(value?.account.address ?? ""));
      if (wallet.connected) { setAddress(wallet.account?.address ?? ""); return; }
      await wallet.openModal();
    } catch { toast.error("Wallet connection unavailable. Please try again."); }
    finally { setConnecting(false); }
  }
  return (
    <div className={`fixed inset-0 z-50 grid place-items-end bg-ink/80 backdrop-blur-md transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} aria-hidden={!open}>
      <div
        className={`glass-card sheet-card relative w-full max-w-md rounded-t-[28px] border-white/15 p-5 pb-8 backdrop-blur-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/25" />
        <button onClick={onClose} aria-label="Close settings" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-ink/60 text-cream transition-transform active:scale-90"><X className="h-4 w-4" strokeWidth={3} /></button>
        <h2 className="mb-4 text-center font-display text-xl text-sun">Settings</h2>
        <div className="flex flex-col gap-2.5">
          <div className="flex min-w-0 items-center justify-between rounded-2xl border border-white/10 bg-ink/45 px-4 py-3">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-cream">
              {s.sound ? <Volume2 className="h-4 w-4" strokeWidth={2.5} /> : <VolumeX className="h-4 w-4" strokeWidth={2.5} />}
              Sound
            </span>
            <button onClick={toggleSound} aria-label="Toggle sound" className={`relative h-7 w-12 rounded-full border transition-colors ${s.sound ? "border-transparent bg-gradient-to-b from-lime to-sky" : "border-white/15 bg-ink/70"}`}>
              <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-cream shadow transition-all ${s.sound ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex min-w-0 items-center justify-between rounded-2xl border border-white/10 bg-ink/45 px-4 py-3">
            <span className="text-sm font-semibold text-cream">Language</span>
            <div className="flex gap-1.5">
              {(["en", "ar"] as const).map(l => (
                <button key={l} onClick={() => { setLang(l); toast("Full Arabic translation is coming soon."); }} className={`rounded-full px-3.5 py-1.5 font-display text-xs leading-none transition-transform active:scale-95 ${s.lang === l ? "bg-gradient-to-b from-sun to-sun-dark text-cream" : "border border-white/15 bg-ink/60 text-muted-foreground"}`}>
                  {l === "en" ? "English" : "العربية"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-ink/45 px-4 py-3">
            <span className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-cream"><Wallet className="h-4 w-4" strokeWidth={2.5} />TON Wallet</span>
            <button onClick={connect} disabled={connecting} className="shrink-0 rounded-full bg-gradient-to-b from-sun to-sun-dark px-4 py-2 font-display text-xs leading-none text-cream transition-transform active:scale-95 disabled:opacity-60">
              {address ? `${address.slice(0, 4)}…${address.slice(-4)}` : connecting ? "…" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type To = "/" | "/upgrade" | "/earn" | "/nft" | "/wheel";
function NavItem({ icon, label, to }: { icon: string; label: string; to: To }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="group flex flex-col items-center justify-center gap-1"
    >
      <span className="nav-icon grid h-10 w-10 place-items-center rounded-2xl">
        <img src={icon} alt="" className="nav-icon-img h-9 w-9 object-contain" />
      </span>
      <span className="font-display text-[11px] leading-none text-muted-foreground transition-colors group-data-[status=active]:text-sun">{label}</span>
    </Link>
  );
}

/** Bottom bar: big diamond SPIN rises out of the middle on the slot page; a compact chip elsewhere. */
export function BottomNav({ center }: { center?: ReactNode }) {
  const { s } = useGame();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const compact = !center && pathname !== "/";
  const pct = Math.min(100, (s.spins / MAX_SPINS) * 100);
  return (
    <nav className="relative z-30 pb-[env(safe-area-inset-bottom)]">
      <div className={`relative grid grid-cols-[1fr_1fr_1.9fr_1fr_1fr] border-t border-white/10 bg-ink/45 backdrop-blur-2xl ${compact ? "h-[66px]" : "h-[78px]"}`}>
        <NavItem icon={ART.rocket} label="UPGRADE" to="/upgrade" />
        <NavItem icon={ART.bag} label="EARN" to="/earn" />
        <div className="relative">
          <div className={`absolute left-1/2 -translate-x-1/2 ${compact ? "top-[-26px] h-[80px] w-[80px]" : "top-[-58px] h-[112px] w-[112px]"}`}>
            {center ?? (
              <Link to="/" className="chunk-btn h-full w-full rounded-[2rem] bg-gradient-to-b from-sun to-sun-dark">
                <span className={`font-display leading-none ${compact ? "text-xl" : "text-2xl"}`}>SPIN</span>
              </Link>
            )}
          </div>
          <div className={`absolute inset-x-2 flex items-center rounded-full border border-white/15 bg-ink/60 pl-4 pr-2 backdrop-blur-md ${compact ? "bottom-2 h-[20px]" : "bottom-2.5 h-[22px]"}`}>
            <img src={ART.bolt} alt="" className={`absolute left-1 object-contain ${compact ? "h-5 w-5" : "h-6 w-6"}`} />
            <div className={`flex-1 overflow-hidden rounded-full bg-ink/70 ${compact ? "h-3" : "h-3.5"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-sky to-grape transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className={`absolute inset-0 grid place-items-center font-display leading-none text-cream ${compact ? "pl-2.5 text-[11px]" : "pl-3 text-[12px]"}`}>{s.spins}/{MAX_SPINS}</span>
          </div>
        </div>
        <NavItem icon={nftIcon} label="NFT" to="/nft" />
        <NavItem icon={ART.wheel} label="WHEEL" to="/wheel" />
      </div>
    </nav>
  );
}

/** Full-height, non-scrolling app frame. `scroll` lets inner pages scroll their content area only. */
export function Screen({ children, center, bare, scroll = true, navigation = true }: { children: ReactNode; center?: ReactNode; bare?: boolean; scroll?: boolean; navigation?: boolean }) {
  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-night">
      <img src={sky} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <TopBar />
      <main className={`relative min-h-0 flex-1 ${scroll ? "overflow-y-auto" : "overflow-hidden"} ${bare ? "" : "px-3 py-3"}`}>{children}</main>
      {navigation && <BottomNav center={center} />}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="glass-card relative w-full max-w-sm border-white/15 bg-night/80 p-5 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-center font-display text-2xl text-sun">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-berry text-cream shadow-[0_2px_6px_oklch(0_0_0/.4)] transition-transform active:scale-90"><X className="h-4 w-4" strokeWidth={3.5} /></button>
        {children}
      </div>
    </div>
  );
}
