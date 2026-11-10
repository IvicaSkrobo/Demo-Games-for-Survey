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

Choose €1, €2, €5, €10, €20, €50 or €100 with the stepper. Every draw charges one bet and settles an instant **gross return**, including any returned stake. For example, bet €10 and receive €15 means net +€5; receive €5 means net −€5. The instant prize is independent of the card's rank.

| Regular-card outcome | Probability | Gross return |
| --- | ---: | ---: |
| Bust | 40% | €0 |
| Small return | 25% | 0.5× bet |
| Win | 30% | 1.5× bet |
| Big win | 5% | 2.5× bet |

A non-bust Joker pays 3× bet and contributes one point. A bust becomes a dedicated zero-point BUST card. Its collector is chosen **uniformly and independently** among the four suits, avoiding the earlier first-suit bias on dual and colour identities.

## Our 78-card deck

52 single-suit cards (A, 2–10, J, Q, K per suit); 18 dual-suit cards (every suit pair at 3, 5 and 7); four colour cards (red and black 4/Q); four one-point Jokers. Draw without replacement; reshuffle when empty. A = 1, numbers = printed value, J/Q/K = 10. A dual 7 is one seven-point card, not fourteen points.

Single suits route to their matching collector. Dual suits permit either printed suit. Red colour cards permit Hearts or Diamonds; black permit Clubs or Spades. Jokers permit any collector. Invalid collectors are disabled. Tap the card or Auto-place to choose: exact 21 first, stronger multiplier breaks ties; otherwise highest safe total, then smallest overshoot. Tap a moving card or its receiving collector to speed up.

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

The theoretical instant layer is **75.6410%** including the Joker uplift. Collectors now use clean, stronger factors `[3, 2, 1, 4]`. Bust probability is 40%, small returns 25%, wins 30% and big wins 5%. More reward comes from completing collectors; busts are more frequent. The tested strategies remain inside the 91–93% prototype band around the 92% target.

Independent verification: four seeds × 500,000 draws per strategy (four million draws total), fixed bet €10, retained collectors, finite shuffled deck and cent rounding:

- Auto-place: **91.38915%** observed total RTP.
- Greedy by factor, prioritising exact-21 award: **92.72070%**.

`docs/rtp-calibration.json` contains the runs. Reproduce with `node calibrate-collector21.mjs --heldout`. Both policies have a seeded regression test that fails outside 91–93%. These are policy-specific simulation estimates, not certified or strategy-independent guarantees. Adaptive bets, manual choices, finite play and abandoned collectors can change results.

## Design and validation

The approved Claude canvas and `design/COLLECTOR21_HANDOFF.md` define the redesign. The old `design/collector21-redesign.html` is a timing reference only. The implementation uses the artboard's measured dimensions, including equal-sized deck/card: 70×98 on phone, 108×151 on desktop, reduced on short phones. No collector glow; states use borders, tint and progress previews. Joker and BUST styling follows the approved artboards.

See `docs/REDESIGN-QA.md` for the dated acceptance review. Local visual fixtures are under `qa/`, outside deployed `dist/`; generate them with `node qa/build-scenarios.mjs`, serve this source folder on port 4175 and open `qa/viewport.html?width=390&height=844&state=choose`. These fixtures use the production renderer and are not a playable demo mode.

## Survey integration

See `docs/SURVEY-INTEGRATION.md`. The host-controlled iframe retains two assigned slots (Collector 21 and Suit Society) for the existing comparison blueprint; the public game exposes only Collector 21. One resolved paid bet emits `round_completed`, with ten per variant. Rules, bets and rendering are isolated from the legacy comparison stylesheet. `dist/legacy.css` serves the existing Suit Society slot only.

The blueprint and manifests are included; no live study, participants or responses are created by a code deployment. Import `dist/study-blueprint.json` into a new draft and rehearse in the target survey environment before activating it.
