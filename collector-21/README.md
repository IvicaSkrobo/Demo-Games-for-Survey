# Collector 21 — current game reference

**Updated:** 10 November 2026 (Europe/Zagreb)
**Status:** playable redesign, virtual euros only
**Source:** `/Users/ivicaskrobo/Documents/ChatGPT/wheel porject/card-lab`
**Demo checkout:** `/Users/ivicaskrobo/Documents/ChatGPT/wheel porject/demo-games-survey`

## Play

- Main prototype: https://gamio-card-lab.bravegiant2049.chatgpt.site/collector-21/
- Public demo: https://ivicaskrobo.github.io/Demo-Games-for-Survey/collector-21/
- Survey iframe: https://ivicaskrobo.github.io/Demo-Games-for-Survey/collector-21/study/
- Source UI: `dist/collector21.mjs`; maths: `dist/collector21-engine.mjs`; styles: `dist/style.css`.
- Local preview: `python3 -m http.server 4174 --directory dist`.
- Tests: `node --test`.

The root and Collector 21 routes show only this game. The public game has no prototype navigation, reset, demo mode or explanatory paragraphs. Rules are in a three-tab dialog, shown as a bottom sheet on phones. Euros are the display unit for a simulated wallet; no real money is involved.

## One bet, two layers

Choose €1, €2, €5, €10, €20, €50 or €100 with the stepper. Every draw charges one bet.

- **A–9:** €0 instant return, still add the printed points and full original bet to a matching collector. A zero-return card is not a BUST card; going over 21 can still bust its collector.
- **10/J/Q/K:** every non-bust card pays more than its bet: ×1.25, ×1.5 or ×1.75 gross return. Bet €10 returns €12.50, €15 or €17.50 (net +€2.50, +€5 or +€7.50).
- **Joker:** remains the special exception: one point, any collector, ×3 instant return when not bust.
- **Dedicated BUST card:** 10% chance per draw. Zero points and €0 return; clears one uniformly selected collector.

| Outcome roll on a 10/J/Q/K identity | Probability | Gross return |
| --- | ---: | ---: |
| Dedicated BUST | 10% | €0 |
| Win | 50% | 1.25× bet |
| Bigger win | 30% | 1.5× bet |
| Big win | 10% | 1.75× bet |

The same roll chooses bust versus non-bust on lower ranks, but every non-bust A–9 return is overridden to €0 while retaining its rank and points. A non-bust Joker overrides the return to ×3. The UI labels safe zero-return cards **Collector card** and keeps them placeable. Awards round to cents.

## Our 78-card deck

52 single-suit cards (A, 2–10, J, Q, K per suit); 18 dual-suit cards (every suit pair at 3, 5 and 7); four colour cards (red and black 4/Q); four one-point Jokers. Draw without replacement; reshuffle when empty. A = 1, numbers = printed value, J/Q/K = 10. A dual 7 is one seven-point card, not fourteen points.

Single suits route to their matching collector. Dual suits permit either printed suit. Red colour cards permit Hearts or Diamonds; black permit Clubs or Spades. Jokers permit any collector. Invalid collectors are disabled. Tap the card or Auto-place to choose: largest exact-21 award first; otherwise strongest safe collector by factor, then smallest overshoot. Tap a moving card or its receiving collector to speed up.

## Collectors

Below 21 retains points and original stakes. Exactly 21 pays the sum of the original bets in that collector × its factor, then clears it. Above 21 clears only that collector. A bust card flies into its independently chosen collector and clears it. Already-paid instant returns remain yours.

| Collector | Factor |
| --- | ---: |
| Spades | 4× |
| Hearts | 3× |
| Diamonds | 2× |
| Clubs | 1× |

Changing the bet affects future cards only. Hearts assembled from bets €1 + €2 + €5 + €10 pays `€18 × 3 = €54`, rounded to cents. All engine awards round to cents. The wallet and collector state reset on page refresh.

## RTP calibration

The theoretical instant layer is **42.6923%**: `18/78 × 1.25 + 4/78 × 0.9 × 3`. There are 18 eligible 10-point identities and four Jokers; all other non-bust cards collect only. Collector factors remain `[3, 2, 1, 4]`. Dedicated BUST-card probability is **10%**.

Independent verification: four held-out seeds × 500,000 draws, fixed bet €10, retained collectors, finite shuffled deck and cent rounding. Improved auto-place/greedy routing returned **92.048425%**, split into **42.673925% instant returns + 49.3745% collector awards**. Auto-place now delegates to that stronger greedy routing, so the two named simulation runs are the same policy, not independent strategies.

`docs/rtp-calibration.json` records the payout table, factors, policy and runs. Reproduce with `node calibrate-collector21.mjs --heldout`. Seeded regression tests fail outside 91–93%. This is a simulation estimate for the tested policy, not a certified or strategy-independent guarantee. Manual placement, adaptive bets and abandoned collectors can change observed return.

## Design and validation

The approved Claude canvas and `design/COLLECTOR21_HANDOFF.md` define the redesign. The old `design/collector21-redesign.html` is a timing reference only. The implementation uses the artboard's measured dimensions, including equal-sized deck/card: 70×98 on phone, 108×151 on desktop, reduced on short phones. No collector glow; states use borders, tint and progress previews. Joker and BUST styling follows the approved artboards.

See `docs/REDESIGN-QA.md` for the dated acceptance review. Local visual fixtures are under `qa/`, outside deployed `dist/`; generate them with `node qa/build-scenarios.mjs`, serve this source folder on port 4175 and open `qa/viewport.html?width=390&height=844&state=choose`. These fixtures use the production renderer and are not a playable demo mode.

## Survey integration

See `docs/SURVEY-INTEGRATION.md`. The host-controlled iframe retains two assigned slots (Collector 21 and Suit Society) for the existing comparison blueprint; the public game exposes only Collector 21. One resolved paid bet emits `round_completed`, with ten per variant. Rules, bets and rendering are isolated from the legacy comparison stylesheet. `dist/legacy.css` serves the existing Suit Society slot only.

The blueprint and manifests are included; no live study, participants or responses are created by a code deployment. Import `dist/study-blueprint.json` into a new draft and rehearse in the target survey environment before activating it.
