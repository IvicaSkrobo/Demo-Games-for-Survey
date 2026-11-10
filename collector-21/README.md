# Collector 21 — current game reference

**Updated:** 10 November 2026 (Europe/Zagreb)  
**Status:** playable virtual-credit prototype; demo and survey integration build  
**Source folder:** `/Users/ivicaskrobo/Documents/ChatGPT/wheel porject/card-lab`  
**Demo repository checkout:** `/Users/ivicaskrobo/Documents/ChatGPT/wheel porject/demo-games-survey`  
**Main game:** `dist/collector21.mjs` · **Maths:** `dist/collector21-engine.mjs`

## Play and publication

- Prototype lab: https://gamio-card-lab.bravegiant2049.chatgpt.site/#collector21
- Focused standalone page: `dist/collector-21.html`
- Public demo path: https://ivicaskrobo.github.io/Demo-Games-for-Survey/collector-21/
- Survey iframe build: https://ivicaskrobo.github.io/Demo-Games-for-Survey/collector-21/study/
- Survey handshake rehearsal: `dist/survey-preview.html`
- Local preview: `python3 -m http.server 4174 --directory dist`
- Checks: `node --test engine.test.mjs collector21.test.mjs study-bridge.test.mjs`

The public demo repository is the distribution copy. Edit the source here, then copy `dist/` to that repository's `collector-21/` directory (use `collector-21.html` as its `index.html`). The Sites source workflow separately stages, commits, pushes and deploys this source checkout.

## One bet, two layers

Choose 1, 2, 5, 10, 20, 50 or 100 virtual credits. Every draw is a new bet. The instant return is paid first; then a non-bust card contributes its fixed points and original stake to a valid collector. A pending placement must finish before the next bet.

**Return includes any returned stake.** Bet 10, return 15 means net +5. Bet 10, return 5 means net −5. The instant-return panel shows bet, net result, gross return and current balance together. A receipt remains visible after the card has been collected.

### Instant returns

| Regular-card outcome | Probability | Gross return |
| --- | ---: | ---: |
| Bust | 30% | 0 |
| Small return | 40% | 0.5× bet |
| Win | 20% | 1.5× bet |
| Larger win | 10% | 2.5× bet |

A non-bust **Joker has 1 point and pays 3× bet**. If the outcome is a bust, it is rendered as a dedicated **0-point BUST card**, not a numbered card or Joker. Its one suit determines which collector is cleared. Instant outcome is random independently of rank; fixed rank values do not imply fixed cash prizes.

## Our custom 78-card deck

This is a game-specific deck, not a poker rules implementation:

- 52 single-suit rank cards: A, 2–10, J, Q, K in each suit.
- 18 dual-suit cards: every pair of suits at ranks 3, 5 and 7.
- 4 colour-only cards: red 4/Q and black 4/Q, without suit symbols.
- 4 Jokers: one point each; all collectors allowed.

The deck shuffles, draws without replacement, and reshuffles when empty. A = 1; numbers = printed value; J/Q/K = 10. A dual 5♦/5♣ is **one 5-point card**, not ten points. Each half shows its rank and suit separately. Individual hearts/diamonds are red; clubs/spades are black. Colour-only cards show a coloured rank and colour label, no suit symbols. Jokers have rainbow styling.

## Valid collectors and controls

- Single suit: automatically goes only to its matching collector.
- Dual suit: choose either printed suit; wrong collectors are disabled.
- Red colour card: Hearts or Diamonds. Black: Clubs or Spades.
- Joker: any collector.
- Clicking a choice card auto-places it: exact 21 first (strongest factor breaks ties), otherwise the highest safe valid total, otherwise the smallest overshoot.
- Clicking the card or its highlighted receiving collector during travel speeds up the animation. It cannot place twice or charge again.
- The receiving collector stays highlighted during the preview, travel and landing.
- Collected cards remain visible as proportional miniatures and wrap within their collector.

## Collector resolution

Below 21: keep the collector's points, cards and original stakes.  
Exactly 21: pay a separate collector award and clear that collector.  
Above 21: show **BUST → 0 / 21** and clear only that collector, without a collector award. Instant returns already paid are retained.  
Bust card: fly into its matching collector, then clear its points and stored stakes. Other collectors stay. The bust label remains until the next draw.

Current collector awards multiply the **sum of original bets stored in that collector**:

| Collector | Factor |
| --- | ---: |
| Spades | 1.6596× |
| Hearts | 1.1064× |
| Diamonds | 0.8298× |
| Clubs | 0.5532× |

Changing the bet affects only future cards. Example: Hearts formed from bets 1 + 2 + 5 + 10 pays `18 × 1.1064 = 19.92` credits, rounded to cents. It does not multiply all cards by the latest bet. Collector 21 state currently resets on page refresh; it is not a persistent wallet.

## RTP — what is and is not established

- Regular-card instant layer: 75% theoretical return.
- With the 4 non-bust Joker uplifts in the 78-card mix: **81.9231% theoretical instant-layer RTP**.
- Collector factors were multiplied by **0.5532** to target a combined return near **92% using fixed-bet auto-placement**.
- Calibration used four seeds × 500,000 draws at bet 10. Mean simulated collector return: **10.07687%**. Added to theoretical instant return: **91.99995%**. These are calibration runs; see `docs/rtp-calibration.json` for held-out verification too.
- Independent verification: four new seeds × 500,000 draws returned **92.00234% observed total RTP** (theoretical instant layer + simulated collector layer: **92.02482%**).
- This is an **estimated benchmark RTP**, not a certified or strategy-independent mathematical guarantee. Manual choices, adaptive betting, finite sessions, rounding and abandoned collections can change observed returns. Do not advertise it as guaranteed 92% for every strategy.
- The separate Suit Society prototype has different rules and a 92% long-run fixed-rules model. Do not mix its payout table with Collector 21.

## Survey setup

See `docs/SURVEY-INTEGRATION.md`. The build uses the platform's `superbet.study.v1` handshake and framing protocol. Manifest slots: 1 Collector 21, 2 Suit Society. An importable participant-free blueprint is included for the existing survey platform. No participants, live study or responses are created by the repository update.

A resolved paid bet emits `round_completed`: after bust-card animation, or after a winning card is placed and its collector result settles. Free examples do not count. Configure the platform's event-count unlock to `round_completed`, 10 bets per variant. The game emits completion lifecycle events at ten resolved paid bets. The survey host owns study order, unlock and survey screens.

## Files and validation

- `dist/collector21-engine.mjs`: card deck, fixed values, return draws, collector rules and valid targets.
- `dist/collector21.mjs`: presentation, placement, receipts and bet state.
- `dist/study-bridge.mjs`: origin-checked parent handshake, event queue/retries, version selection and framing.
- `dist/style.css`: card visuals, responsive layout, proportional collector cards.
- `collector21.test.mjs`: mathematical/routing regressions.
- `study-bridge.test.mjs`: event contract and protocol regressions.
- `calibrate-collector21.mjs`: reproducible RTP simulation.

This reference describes the implementation on the date above. Future rule changes should update the deck composition, event contract, RTP benchmark and this document together.
