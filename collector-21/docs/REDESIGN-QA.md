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

## Stronger collector update — 10 November 2026

Collector factors now Hearts ×3, Diamonds ×2, Clubs ×1, Spades ×4. Payout table and chips read the engine constants. Instant outcomes rebalance to 40% bust / 25% ×0.5 / 30% ×1.5 / 5% ×2.5; non-bust Jokers remain ×3. Independent four-million-draw verification: auto-place 91.38915%, greedy-by-factor 92.72070%. No layout changes.

## Points-only cards — 10 November 2026

Dedicated BUST cards reduced to 10%. A–9 return €0 but remain normal cards: fixed points, correct suit routing and full original stake added to the pot. Non-bust 10/J/Q/K return ×1.25, ×1.5 or ×1.75; non-bust Jokers retain ×3 and one point. Strong collector factors unchanged. Improved auto-place chooses the largest exact-21 award, otherwise the strongest safe factor. Independent held-out estimate: 92.048425%; auto-place and greedy now share the same policy. The in-game rules and dated README describe the current version; earlier entries above record previous review states.

## More choice and manual placement — 10 November 2026

96-card deck: 52 single-suit, 30 dual-suit, ten colour cards, four Jokers. Colour faces have rank + RED/BLACK, no suit symbols. Click a valid collector to place any revealed card. Single-destination cards (including dedicated BUST cards) wait five seconds of inactivity; pointer/key activity restarts it, Rules pauses it, and manual placement cancels it. Multiple-destination cards and Jokers wait indefinitely for a choice. Animation fast-forward and reduced motion do not shorten the inactivity timer. Timer behavior is covered with a fake-clock regression suite.

Smallest non-bust 10/J/Q/K return is now ×1.1; other returns and collector factors remain. Recalibrated with the expanded deck; current runs are in rtp-calibration.json. Browser control remains with the user; validation for this update uses the engine, timer and renderer/rules tests in Node.

Controller integration test: the real draw/collector/card handlers run against lightweight controls and a fake clock, verifying immediate manual collection, full five-second idle waits under reduced motion, no timeout for dual suits, and manual placement of BUST cards. No browser control is required.
