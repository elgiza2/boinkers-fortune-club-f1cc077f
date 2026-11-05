/** All currently resolved Holo products are digital goods sold inside Telegram. */
export function digitalPaymentAllowed(method: "stars" | "gram") {
  return method === "stars";
}