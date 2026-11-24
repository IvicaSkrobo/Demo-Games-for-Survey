# Orbit

Orbit is a static fruit wheel for mobile surveys. Players can stake separate demo EUR amounts on multiple fruits in the same round. A charge reveal, a wheel landing and the occasional Harvest bonus determine the payout. Other riders are locally simulated and share the outcome.

## How to play

1. Type a stake of at least €1.00 or use the stake chips. The €1 chip resets the stake to €1. Each + chip adds its amount per tap. Changing the stake applies to future bets.
2. Tap a fruit to place the displayed stake immediately. **Random bet** chooses one uniformly random fruit per tap. Repeat taps stack on the same fruit. Bets placed after the charge reveal are debited once and confirmed for the next round.
3. The step bar shows Bet, Charge and Result. The five-second Bet window leads to a two-second Charge reveal. A random fruit receives a boost of 1.5×, 2× or 3×. The boost applies if that fruit lands. All live bets stay in.
4. The wheel then spins and reveals the outcome after it stops. A fruit landing pays that fruit, boosted if it was charged. A gold Harvest landing sends every active fruit bet to one more reveal. Harvest uses its own paytable.
5. The fruit card and wheel marker flash for a confirmed live bet. The receipt shows the amount and whether the bet is for this round or the next. Payouts go straight to the demo wallet and appear in a dedicated payout panel. The result stays visible for 2.8 seconds before a fresh betting window opens. Bets placed during Result queue for that window. Expand **Last round** to see the most recent round you bet on, including each fruit’s stake and payout. The rider feed shows busted and paid bets before removing them individually. Your bets shows each fruit with its live and next-round amounts. The green You marker shows only the player’s live stake. Pink-bordered markers show simulated stakes, and the Simulated riders panel lists individual bets.

## Run locally

From this folder, run `npx serve .`, or open `index.html` directly for offline play. Keep `fruit.webp` next to it. The game uses HTML, CSS, JavaScript, Canvas and a local WebP sprite sheet, with no build step. Survey iframes need script permission. When the page is hidden, the round countdown pauses. Reduced motion is available in the game and through the system setting.

## Odds and theoretical RTP

Each round draws the charged fruit uniformly from the four fruits, independently of the wheel. Its boost has probabilities 1/2 for 1.5×, 1/4 for 2× and 1/4 for 3×. The subsequent wheel draw samples 16 equal pockets using browser randomness. If Harvest lands, one of four equally probable shared outcomes is drawn and each fruit pays according to its own row.

| Fruit | Ordinary pockets | Uncharged payout | Harvest payouts |
| --- | ---: | ---: | --- |
| Cherries | 6 of 16 | ≈1.8027× | 1.25×, 1.75×, 2.25×, 2.75× |
| Lemon | 4 of 16 | 2.704× | 0.5×, 1.5×, 2×, 4× |
| Plum | 3 of 16 | ≈3.6053× | 0×, 1×, 2×, 5× |
| Watermelon | 2 of 16 | 5.408× | 0×, 0×, 2×, 6× |

The remaining pocket is Harvest. A matching fruit’s expected charge factor is `1 + (2 − 1)/4 = 1.25`. Each fruit’s mean Harvest return is 2×. For a fruit with `n` ordinary pockets and uncharged payout `b`, the expected return is `(n × b × 1.25 + 2) / 16 = 0.97`. Each fruit’s combined stake is rounded to the nearest euro cent at payout. Bets in the same round share their outcomes. Multipliers are rounded on screen.

## Visual reference

[EGT Digital’s Shining Crown](https://egt-digital.com/game/shining-crown/) informed the readable fruit silhouettes, polished highlights and animated wins. Orbit uses an original fruit sprite sheet generated for this prototype with built-in ImageGen. The saved sheet is `fruit.webp`, compressed from the built-in ImageGen output.

> Create ONE square transparent PNG sprite sheet of four ORIGINAL fruit symbols for a premium browser arcade fruit wheel. Exact 2 by 2 grid with equal cells and generous transparent gutters, each icon entirely within center 70 percent of its quadrant. Upper left: two ripe red cherries joined by elegant curved green stems and one small leaf. Upper right: a whole sunny yellow lemon with a dark green leaf, diagonal orientation. Lower left: one blue-purple plum with a small green leaf, plump oval. Lower right: a single triangular watermelon wedge with green rind and a few black seeds. Art direction: richly saturated glossy hand-painted 3D enamel with clean readable silhouettes, two small warm studio highlights on each piece, deep realistic shading, slightly sculpted playful proportions. Consistent upper-left lighting, parallel front view, each fills similar area, clearly legible at 24 pixels. No text, no letters, no crown, no sparkles floating outside the fruit, no panels, no shadows outside silhouette, alpha background. Entirely original game assets.
