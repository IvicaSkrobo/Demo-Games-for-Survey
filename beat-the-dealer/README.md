# Beat the Dealer

A Gamio survey prototype for phone and desktop. The balance uses play chips.

## How to play

Tap **Play** to bet 10 play chips, shuffle one shared 56-card deck, and reveal the dealer’s first card. The pile contains the standard 52 cards plus four Jokers. **Back out** ends the round and forfeits the bet. **Draw card** flips your first card from the same pile at no extra cost. Match or beat the current top rank to keep the streak. Ranks run from 2 through 10, then Jack, Queen, King, Ace, and Joker. Suits have equal value. Either side can draw a Joker. When the dealer opens with a Joker, any player card wins the first draw and becomes the new top rank.

After a hit, draw again against your own top card, cash out, or ask the dealer for a new card. If the dealer draws higher than your card, you lose. A lower dealer card becomes the new rank to beat, and an equal dealer card keeps the rank the same. After the dealer draws, you can draw or cash out.

Choose a mode before starting a round. In **Normal**, you draw one card at a time. In **Daredevil**, use **Number of cards** to select 2–10 player cards per tap. The batch keeps drawing until it finishes, you lose, or the deck runs out. With one card left, you can cash out or ask the dealer if available. Each hit becomes the next target. A successful final draw cashes out automatically. A loss forfeits the bet. If the balance drops below 10, you can refill it to 100.

## Run locally

From this folder, run `npx serve .` and open the printed URL. You can also open `index.html` directly while offline. The game is plain HTML, CSS, and JavaScript with inline SVG card faces and no build step. The balance resets on reload.

## Payout math

**Demo opening** is on by default for presentations. It gives the opening dealer card an 80% chance of being a 2–6, compared with 20 out of 56 cards (about 35.71%) with the setting off. The remaining deck is uniformly shuffled after accounting for the revealed card. Later draws and the displayed odds use that remaining deck as usual. Change the setting between rounds.

The hit probability is the number of eligible cards divided by the number of cards left. The first hit usually pays `0.95 ÷ hit probability` times the stake. After an opening King, three Kings, four Aces, and four Jokers can hit. That gives 11 hits out of 55 cards (20%) and a 4.75× payout. An opening Joker guarantees the first hit at 1×.

Each successful draw divides the current multiplier by that draw’s success probability. When the player always takes the first draw, Normal mode has a theoretical RTP of about 95.11% with Demo opening on or 95.36% with it off. The opening Joker accounts for the difference from the 95% base. Backing out returns zero.

In Daredevil, completing a player batch boosts the resulting multiplier by 10% per card beyond the first, from +10% for two cards to +90% for ten. The boost uses the number of cards actually available to draw and compounds across completed batches. Losing a batch pays nothing. Daredevil RTP depends on batch size, cash-out strategy, and whether a batch forces a draw with zero chance of success. Display values are rounded and the game retains the unrounded play-chip balance.
