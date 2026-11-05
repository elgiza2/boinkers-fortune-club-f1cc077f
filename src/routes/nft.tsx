import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/game/Shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NFT_ITEMS } from "@/lib/nft";
import { getTonWallet } from "@/lib/ton-wallet";
import { PriceTag, type PayCurrency } from "@/components/game/PayToggle";

export const Route = createFileRoute("/nft")({
  head: () => ({
    meta: [
      { title: "NFT Collection · GRAM — Holo" },
      { name: "description", content: "Discover 60 Solo mascot designs and connect your TON wallet. Sales open when verified listings are available." },
      { property: "og:title", content: "NFT Collection · GRAM — Holo" },
      { property: "og:description", content: "Explore Solo NFT artwork and buy your character with TON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NftPage,
});

function NftPage() {
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [pay, setPay] = useState<PayCurrency>("ton");
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
  async function buy() {
    if (!address) { await connect(); return; }
    toast("Sales are not open yet. No TON will be charged.");
  }
  const [group, setGroup] = useState("All");
  const items = group === "All" ? NFT_ITEMS : NFT_ITEMS.filter((i) => i.group === group);
  return <Screen bare>
    <div className="nft-page">
      <header className="nft-head">
        <div>
          <h1>Holo Collection</h1>
          <p>{NFT_ITEMS.length} characters · paid in GRAM</p>
        </div>
        <button onClick={connect} disabled={connecting} className={`nft-wallet ${address ? "is-on" : ""}`}>
          {address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "Connect wallet"}
        </button>
      </header>
      <div className="nft-filters">
        {["All", "Explorers", "Fantasy", "Legends"].map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={`nft-chip ${group === g ? "is-on" : ""}`}>{g}</button>
        ))}
      </div>
      <div className="nft-grid">
        {items.map(item => (
          <article key={item.id} className={`nft-tile nft-${item.group.toLowerCase()}`}>
            <div className="nft-tile-art">
              <span className={`nft-rarity nft-r-${item.rarity.toLowerCase()}`}>{item.rarity}</span>
              <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
            </div>
            <div className="nft-meta"><h2>{item.name}</h2><span>#{String(item.id).padStart(3, "0")}</span></div>
            <Button onClick={buy} disabled={connecting} className="nft-tile-buy gap-1" aria-label={`Buy ${item.name}`}><PriceTag ton={item.price} currency={pay} /></Button>
          </article>
        ))}
      </div>
    </div>
  </Screen>;
}
