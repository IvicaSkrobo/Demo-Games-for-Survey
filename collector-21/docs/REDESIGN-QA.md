# Collector 21 redesign — acceptance review

Reviewed 10 November 2026 (Europe/Zagreb), against the signed-in Claude canvas and local handoff. The canvas's measured geometry supersedes approximate layout heights in the handoff: mobile collectors 122.4px and stage 150px; desktop collectors 195.8px and stage 219px. Payout values are the recalibrated engine values rather than canvas placeholders.

- [x] 390×844: actual iframe viewport, document scroll size 390×844. Deck and card 70×98, clear 28px spacing plus deck margin. Dock follows stage; unused space below.
- [x] 375×667: actual iframe viewport, document scroll size 375×667. Short-screen card/deck shrink equally; controls fit without overlap.
- [x] 1440×900 and 1024×768: collectors above stage; status, stepper and action below. No clipping. Equal 108×151 deck/card.
- [x] Only the game is visible. Rules and RTP explanation are in the dialog; no demo/reset/lab controls in the public game.
- [x] Rest, valid, exact, over, dim, win and bust inspected using the production renderer in local fixtures. No collector box shadow. Preview segments and correct suit restrictions checked.
- [x] Dual card, Joker, BUST and empty card reviewed; live single-suit draw routes automatically. Exact-21 award resets one lane and preserves the instant prize. Over-21 resets only its lane.
- [x] Draw/Auto-place swap, disabled stepper while pending, card and receiving-collector speed-up handled by existing motion controls. Flight scales uniformly to the suit badge.
- [x] Phone bottom sheet and desktop dialog reviewed. All three tabs checked; Escape and backdrop dismissal verified. Close button uses dialog.close(). Numeric rules and collector factors read engine exports.
- [x] Reduced-motion local fixture skips JS animations and reaches the correct bust/reset state; no flight nodes remain. CSS also disables transitions/animations under prefers-reduced-motion.
- [x] Survey rehearsal reports round_completed after placement and switches to the existing Suit Society comparison slot. Public root remains Collector 21 only.
- [x] `node --test`: seeded RTP regression for both auto-place and greedy-by-factor; uniform bust suit; existing payout/routing and survey bridge checks.

QA fixtures are outside the hosted distribution. `qa/build-scenarios.mjs` generates a local copy of the current renderer with scenario data; rebuild after UI edits. No QA routes, scenario selector or demo wallet are published.
