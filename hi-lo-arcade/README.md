# Hi-Lo

Enter a simulated stake from 1 to 10,000 below the buttons, or adjust it in steps of 1 with **−** and **+**, then tap **Play**. Guess **Higher** or **Lower** than the face-up card. A same-rank card wins for either choice. Buttons show the approximate probability and multiplier for the current choice.

- **Redraw** gives you a fresh starter before the first guess.
- **Take Win** collects the current round payout and ends the round. Continuing risks that payout in full. A wrong guess ends the round with no collection.
- **Menu** opens the rules, and the sound button toggles optional audio. The game has no account, running balance, or monetary value.

The familiar gains one energy each guess and loses one per five idle seconds. If it was already fully awake and your guess wins, there is a 50% chance it awards one of five equally likely vault symbols. Symbols carry across rounds until reload. The third symbol opens the vault, adds a reward based on the unordered trio, and clears the slots. All rewards are simulated.

## Run locally

Run `python3 -m http.server 8000` here and open `http://localhost:8000/`, or open `index.html` directly to play offline.

## Return to player

The first guess targets 91% expected return while the familiar is waking and 96% while it is awake. The base win quote divides that target by the win probability and the expected vault multiplier. With two symbols already collected and the familiar awake, the expected multiplier is 1 plus 50% of the average of the five possible extra payout percentages. In other states it is 1. Quotes and awards are rounded to two decimal places.

On continuation guesses, the target expected return in points is the current round payout. Cashout timing therefore preserves the theoretical first-guess return before rounding. Individual results vary.

Choices that cannot increase the round payout are unavailable. A new starter is dealt if neither direction qualifies. Starters are chosen from ranks 4 through queen. Other cards are drawn without replacement from the remaining shuffled deck.

## Tech

Static HTML, CSS, and JavaScript. It runs offline, including synthesized sound, and respects reduced-motion settings.

## Vault combinations

The reward is added as a percentage of the current win. Symbol order does not matter.

| Combination | Extra payout |
|---|---:|
| Moon · Star · Gem | +10% |
| Moon · Star · Crown | +12% |
| Moon · Star · Bolt | +14% |
| Moon · Gem · Crown | +16% |
| Moon · Gem · Bolt | +18% |
| Moon · Crown · Bolt | +20% |
| Star · Gem · Crown | +22% |
| Star · Gem · Bolt | +24% |
| Star · Crown · Bolt | +26% |
| Gem · Crown · Bolt | +28% |
| Moon · Moon · Star | +30% |
| Moon · Moon · Gem | +32% |
| Moon · Moon · Crown | +34% |
| Moon · Moon · Bolt | +36% |
| Moon · Star · Star | +38% |
| Moon · Gem · Gem | +40% |
| Moon · Crown · Crown | +42% |
| Moon · Bolt · Bolt | +44% |
| Star · Star · Gem | +46% |
| Star · Star · Crown | +48% |
| Star · Star · Bolt | +50% |
| Star · Gem · Gem | +52% |
| Star · Crown · Crown | +54% |
| Star · Bolt · Bolt | +56% |
| Gem · Gem · Crown | +58% |
| Gem · Gem · Bolt | +60% |
| Gem · Crown · Crown | +62% |
| Gem · Bolt · Bolt | +64% |
| Crown · Crown · Bolt | +66% |
| Crown · Bolt · Bolt | +68% |
| Moon · Moon · Moon | +70% |
| Star · Star · Star | +72% |
| Gem · Gem · Gem | +74% |
| Crown · Crown · Crown | +76% |
| Bolt · Bolt · Bolt | +78% |
