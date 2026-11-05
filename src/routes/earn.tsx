import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen } from "@/components/game/Shell";
import { ART } from "@/lib/art";
import { fmt, useGame } from "@/lib/game";

export const Route = createFileRoute("/earn")({
  head: () => ({
    meta: [
      { title: "Earn & Hub — Solo Slots" },
      { name: "description", content: "Complete tasks, invite friends, climb the leaderboard and grab shop bundles." },
      { property: "og:title", content: "Earn & Hub — Solo Slots" },
      { property: "og:description", content: "Tasks, referrals, leaderboard and shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Earn,
});

const TABS = ["Tasks", "Friends", "Top", "Shop"] as const;

function Earn() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tasks");
  return (
    <Screen>
      <div className="seg grid-cols-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "seg-active" : ""}>{t.toUpperCase()}</button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "Tasks" && <Tasks />}
        {tab === "Friends" && <Friends />}
        {tab === "Top" && <Leaderboard />}
        {tab === "Shop" && <Shop />}
      </div>
    </Screen>
  );
}

const TASKS = [
  { id: "tg", icon: ART.bag, title: "Join our Telegram channel", url: "https://t.me/telegram", r: { spins: 10 } },
  { id: "x", icon: ART.rocket, title: "Follow us on X", url: "https://x.com", r: { spins: 8 } },
  { id: "yt", icon: "▶️", title: "Watch the trailer", url: "https://youtube.com", r: { spins: 15 } },
  { id: "story", icon: ART.book, title: "Share a story", url: "https://t.me", r: { tickets: 1 } },
];

function Tasks() {
  const { s, completeTask } = useGame();
  const [opened, setOpened] = useState<string[]>([]);
  return (
    <div className="space-y-2.5">
      <h2 className="font-display text-2xl text-sun">COMPLETE &amp; EARN</h2>
      {TASKS.map((t) => {
        const done = s.tasksDone.includes(t.id), go = opened.includes(t.id);
        const label = t.r.spins ? `+${t.r.spins} SPINS` : `+${t.r.tickets ?? 0} TICKET${(t.r.tickets ?? 0) > 1 ? "S" : ""}`;
        return (
          <div key={t.id} className="glass-card flex items-center gap-3 p-2.5">
            {t.id === "yt"
              ? <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-lg">▶️</span>
              : <img src={t.icon} alt="" className="h-9 w-9 object-contain" />}
            <div className="flex-1"><div className="font-semibold leading-tight">{t.title}</div><div className="font-display text-sm text-sun">{label}</div></div>
            <button disabled={done} onClick={() => {
              if (!go) { window.open(t.url, "_blank"); setOpened((o) => [...o, t.id]); }
              else { completeTask(t.id, t.r); toast.success(`Reward ${label}`); }
            }} className={`pill-btn ${go ? "pill-btn-lime" : "pill-btn-sky"}`}>{done ? "DONE" : go ? "VERIFY" : "GO"}</button>
          </div>
        );
      })}
    </div>
  );
}

const REF_STEPS = [{ n: 1, r: "10 SPINS" }, { n: 3, r: "1 TICKET" }, { n: 5, r: "100 SPINS" }, { n: 10, r: "3 TICKETS" }, { n: 25, r: "20 TICKETS" }];

function Friends() {
  const link = "https://t.me/SoloSlotsBot?start=ref_" + ((typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) || "demo");
  const invited = 0;
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl text-sun">INVITE FRIENDS</h2>
      <div className="glass-card p-3.5">
        <p className="text-sm">Each friend gives you <b className="text-sun">+10 SPINS</b> and 10% of their Solo.</p>
        <div className="mt-2 truncate rounded-full border border-white/10 bg-ink/50 px-3 py-2 font-mono text-xs">{link}</div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied!"); }} className="pill-btn pill-btn-sky w-full">COPY</button>
          <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Spin with me in Solo Slots!")}`, "_blank")} className="pill-btn pill-btn-lime w-full">SHARE</button>
        </div>
      </div>
      <div className="glass-card p-3.5">
        <div className="mb-2.5 font-display text-sm tracking-wide">REFERRAL REWARDS · {invited} invited</div>
        <div className="flex items-center justify-between">
          {REF_STEPS.map((st) => (
            <div key={st.n} className="flex flex-col items-center gap-1.5">
              <div className={`grid h-11 w-11 place-items-center rounded-full border-2 font-display ${invited >= st.n ? "border-transparent bg-gradient-to-b from-lime to-oklch(0.62 0.13 150) text-cream shadow-[0_3px_8px_-2px_oklch(0_0_0/.45)]" : "border-white/10 bg-ink/50 text-cream/50"}`}>{st.n}</div>
              <span className="font-display text-[10px] text-sun">{st.r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BOARD = [["CozyInk5", 2_000_000], ["BoomKat", 1_420_000], ["Zed", 990_000], ["Luna", 640_000], ["Rex99", 420_000], ["Mo", 180_000]] as const;

function Leaderboard() {
  const { s } = useGame();
  const rows = [...BOARD.map(([n, v]) => ({ n, v, me: false })), { n: "You", v: s.solo, me: true }].sort((a, b) => b.v - a.v);
  return (
    <div className="space-y-2.5">
      <h2 className="font-display text-2xl text-sun">SOLO LEADERBOARD</h2>
      {rows.map((r, i) => (
        <div key={r.n} className={`glass-card flex items-center gap-3 p-2.5 ${r.me ? "!bg-sun/15 !border-sun/40" : ""}`}>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-ink/50 font-display text-sm">{i + 1}</span>
          <span className="flex-1 font-semibold">{r.n}</span>
          <span className="font-display text-sun">{fmt(r.v)}</span>
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground">Sample rivals shown — live rankings need online accounts.</p>
    </div>
  );
}

const PACKS = [
  { name: "Spin Snack", icon: ART.bolt, give: { spins: 30 }, cost: 8000, desc: "30 Spins" },
  { name: "Lucky Ticket", icon: ART.gem, give: { tickets: 1 }, cost: 15000, desc: "1 Roulette ticket" },
  { name: "Mega Bundle", icon: ART.chest, give: { spins: 150, tickets: 3 }, cost: 60000, desc: "150 Spins + 3 tickets" },
];

function Shop() {
  const { grant, spend } = useGame();
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PACKS.map((p) => (
        <div key={p.name} className="glass-card flex flex-col items-center p-3.5 text-center">
          <img src={p.icon} alt="" className="h-14 w-14 object-contain" />
          <div className="mt-1 font-display">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.desc}</div>
          <button onClick={() => {
            if (!spend({ coins: p.cost })) { toast.error("Not enough coins"); return; }
            grant(p.give); toast.success(`${p.name} bought!`);
          }} className="pill-btn pill-btn-lime mt-2.5 w-full">{fmt(p.cost)} COINS</button>
        </div>
      ))}
    </div>
  );
}
