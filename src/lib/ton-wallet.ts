import type { TonConnectUI } from "@tonconnect/ui";

let walletUI: Promise<TonConnectUI> | undefined;
export function getTonWallet() {
  if (!walletUI) {
    walletUI = import("@tonconnect/ui").then(({ TonConnectUI }) => new TonConnectUI({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
    })).catch(error => { walletUI = undefined; throw error; });
  }
  return walletUI;
}