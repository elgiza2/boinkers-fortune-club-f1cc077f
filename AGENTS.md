<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Fire Pass presentation isolated in its route and scoped CSS; its reward previews must use existing passGift values because pass payouts are already automatic in the game provider.
- Keep slots offer overlays in the shared OfferPresentation module with slots-offer scoped styles; derive rewards, prices, timers and claim state from existing offer/event helpers to keep presentation separate from game mechanics.
- Keep the reference event identities on stable legacy keys to preserve saved progress; never fabricate other players, payment success or chapter rewards in presentation-only screens.
- Render all slots event and paid-offer entry points through the same Chip, and share reward actions across event-specific layouts so visual variants cannot diverge in claim behavior.
