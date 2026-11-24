# Hi-Lo

Enter a simulated stake from 1 to 10,000 below the buttons, or adjust it in steps of 1 with **−** and **+**, then tap **Play**. Guess **Higher** or **Lower** than the face-up card. A same-rank card wins for either choice. Buttons show the approximate probability and multiplier for the current choice.

- **Redraw** gives you a fresh starter before the first guess.
- **Take Win** collects the current round payout and ends the round. Continuing risks that payout in full. A wrong guess ends the round with no collection.
- **Menu** opens the rules, and the sound button toggles optional audio. The game has no account, running balance, or monetary value.

The familiar gains one energy each guess and loses one per five idle seconds. A correct guess started while the familiar is fully awake has a 50% chance to earn one random symbol. Each round can award at most one symbol, and symbols carry across rounds until reload. The third symbol deals one face-down Gold Card and clears the slots. Make a free Higher or Lower guess against the current card. A correct guess adds the displayed bonus to the round payout. A miss leaves the payout intact. The Gold Card comes from a separate 51-card deck that excludes the current card. Its rank does not change the current card for regular play. All rewards are simulated.

## Run locally

Run `python3 -m http.server 8000` here and open `http://localhost:8000/`, or open `index.html` directly to play offline.

## Return to player

The first guess targets 91% expected return while the familiar is waking and 96% while it is awake. All 35 unordered combinations of three symbols have distinct Gold Card values from 10% to 44%. The on-screen Paytable shows each combination. A Gold Card reward on a correct guess is its combination value times the current round payout divided by that choice's win probability. Its expected value therefore equals the combination percentage of the payout before rounding. When a regular win can complete the vault, its quote accounts for a 50% chance of drawing one of the five equally likely final symbols. Wrong regular guesses lose the amount risked.

On continuation guesses, the target expected return in points is the current round payout. Cashout timing therefore preserves the theoretical first-guess return before rounding. Individual results vary.

Choices that cannot increase the round payout are unavailable. A new starter is dealt if neither direction qualifies. Starters are chosen from ranks 4 through queen. Other cards are drawn without replacement from the remaining shuffled deck.

## Tech

Static HTML, CSS, and JavaScript. It runs offline, including synthesized sound, and respects reduced-motion settings.
