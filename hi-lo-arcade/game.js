'use strict';

const suits = [['♠', 'spades'], ['♥', 'hearts'], ['♣', 'clubs'], ['♦', 'diamonds']];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const fullEnergy = 3;
const idleInterval = 5000;
const bonusChance = 0.50;
const vaultSize = 3;
const symbols = [
  { glyph: '☾', name: 'Moon' },
  { glyph: '✦', name: 'Star' },
  { glyph: '◆', name: 'Gem' },
  { glyph: '♛', name: 'Crown' },
  { glyph: '⚡︎', name: 'Bolt' }
];
const goldMultipliers = [1.25, 1.5, 2];
const averageGoldMultiplier = goldMultipliers.reduce((sum, multiplier) => sum + multiplier, 0) / goldMultipliers.length;
const baseReturn = 0.91;
const awakeReturn = 0.96;
const formatPoints = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const formatCash = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' });
const byId = id => document.getElementById(id);
const higher = byId('higher');
const lower = byId('lower');
const bet = byId('bet');
const redraw = byId('redraw');
const takeWin = byId('take-win');
const sound = byId('sound');
const options = byId('options-button');
const stakeMinus = byId('stake-minus');
const stakePlus = byId('stake-plus');
const status = byId('status');
const cashPop = byId('cash-pop');
const bonus = document.querySelector('.bonus');
const familiar = document.querySelector('.familiar');
const symbolSlots = document.querySelectorAll('.symbol-vault span');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let deck;
let current;
let energy = 0;
let idleTimer;
let revealingBonus = false;
const collection = [];
let awardedThisRound = false;
let busy = false;
let ended = true;
let stake = Number(bet.value);
let pot = 0;
let audio;

function shuffle() {
  const cards = suits.flatMap(([suit, name]) => ranks.map((rank, value) => ({
    suit, name, rank, value
  })));
  for (let index = cards.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function pause(milliseconds) {
  return reducedMotion.matches ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, milliseconds));
}

function showCard(slot, card, motion) {
  const tile = document.createElement('span');
  tile.className = 'card ' + motion;
  tile.setAttribute('role', 'img');
  if (!card) {
    tile.classList.add('back');
    tile.setAttribute('aria-label', 'Face-down card');
  } else {
    tile.classList.toggle('red', card.name === 'hearts' || card.name === 'diamonds');
    tile.setAttribute('aria-label', card.rank + ' of ' + card.name);
    const suit = document.createElement('span');
    suit.className = 'suit';
    suit.textContent = card.suit;
    const corner = document.createElement('span');
    corner.className = 'card-corner';
    corner.textContent = card.rank + card.suit;
    corner.setAttribute('aria-hidden', 'true');
    tile.append(card.rank, suit, corner);
  }
  byId(slot).replaceChildren(tile);
  return tile;
}

function showStatus(message, outcome = '') {
  status.className = 'status ' + outcome;
  status.textContent = message;
  if (!reducedMotion.matches) {
    status.animate([{opacity: 0.35, transform: 'translateY(4px)'}, {opacity: 1, transform: 'none'}], 180);
  }
}

function showCash(amount) {
  const value = document.createElement('span');
  value.textContent = formatCash.format(amount);
  cashPop.replaceChildren(value);
}

function updateFamiliar() {
  familiar.dataset.energy = energy;
  byId('familiar-state').textContent = [
    'Familiar asleep.',
    'Familiar stirring.',
    'Familiar waking.',
    'Familiar awake. It can award a vault symbol on your next win.'
  ][energy];
  bonus.classList.toggle('ready', revealingBonus);
  symbolSlots.forEach((slot, index) => {
    const symbol = symbols[collection[index]];
    slot.classList.toggle('lit', Boolean(symbol));
    slot.textContent = symbol?.glyph || '◇';
  });
  const description = collection.map(index => symbols[index].name).join(', ');
  document.querySelector('.symbol-vault').setAttribute('aria-label',
    collection.length + ' of ' + vaultSize + ' symbols collected' + (description ? ': ' + description : ''));
}

function doze() {
  energy = Math.max(0, energy - 1);
  updateFamiliar();
  if (!busy) updateControls();
  if (energy > 0) idleTimer = setTimeout(doze, idleInterval);
}

function wakeFamiliar() {
  clearTimeout(idleTimer);
  const wasAwake = energy === fullEnergy;
  energy = Math.min(fullEnergy, energy + 1);
  updateFamiliar();
  idleTimer = setTimeout(doze, idleInterval);
  return wasAwake;
}

function payouts() {
  const counts = { '-1': 0, 0: 0, 1: 0 };
  for (const card of deck) counts[Math.sign(card.value - current.value)]++;
  const risk = pot || stake;
  const awake = energy === fullEnergy;
  const expectedReturn = pot ? risk : stake * (awake ? awakeReturn : baseReturn);
  const canTriggerGold = awake && !awardedThisRound && collection.length === vaultSize - 1;
  const expectedMultiplier = canTriggerGold ? 1 + bonusChance * (averageGoldMultiplier - 1) : 1;
  const quote = direction => {
    const wins = counts[direction] + counts[0];
    if (!counts[direction] || !wins) return null;
    const payout = Math.round(100 * expectedReturn * deck.length / (wins * expectedMultiplier)) / 100;
    return payout > risk ? { payout, chance: wins / deck.length } : null;
  };
  return { 1: quote(1), '-1': quote(-1) };
}

function dealStarter() {
  deck = shuffle();
  // A fresh starter from 4 through Q always offers two profitable wins.
  const index = deck.findIndex(card => card.value >= 2 && card.value <= 10);
  current = deck.splice(index, 1)[0];
  showCard('current', current, 'arrive');
}

function setChoice(button, label, quote) {
  const detail = document.createElement('small');
  detail.textContent = quote ? Math.round(quote.chance * 100) + '% · ' + formatPoints.format(quote.payout / (pot || stake)) + '×' : 'Unavailable';
  button.replaceChildren(label, detail);
  button.setAttribute('aria-disabled', String(busy || !quote));
}

function updateControls() {
  if (ended) {
    setChoice(higher, 'Higher ↑', null);
    setChoice(lower, 'Lower ↓', null);
  } else if (!busy) {
    const prices = payouts();
    setChoice(higher, 'Higher ↑', prices[1]);
    setChoice(lower, 'Lower ↓', prices[-1]);
  } else {
    higher.setAttribute('aria-disabled', 'true');
    lower.setAttribute('aria-disabled', 'true');
  }
  bet.disabled = !ended;
  stakeMinus.disabled = bet.disabled || (bet.validity.valid && bet.valueAsNumber <= Number(bet.min));
  stakePlus.disabled = bet.disabled || (bet.validity.valid && bet.valueAsNumber >= Number(bet.max));
  redraw.disabled = ended || busy || pot > 0;
  takeWin.classList.toggle('collect-action', !ended);
  takeWin.classList.toggle('primary', ended || Boolean(pot));
  if (ended) {
    takeWin.textContent = 'Play';
  } else {
    takeWin.replaceChildren('Take', document.createElement('br'), 'Win');
  }
  takeWin.disabled = busy || (ended ? !bet.validity.valid : !pot);
}

function start() {
  cashPop.replaceChildren();
  ended = false;
  awardedThisRound = false;
  pot = 0;
  stake = Number(bet.value);
  dealStarter();
  showCard('next', null, '');
  showStatus('Will the next card be higher or lower?');
  updateFamiliar();
  updateControls();
}

async function advanceCards(nextCard) {
  const currentSlot = byId('current');
  const nextSlot = byId('next');
  const incoming = nextSlot.firstElementChild;
  const outgoing = currentSlot.firstElementChild;
  const from = incoming.getBoundingClientRect();

  if (!reducedMotion.matches) {
    outgoing.animate([
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translate(-22px, 9px) rotate(-7deg)' }
    ], { duration: 115, fill: 'forwards', easing: 'ease-in' });
    await pause(110);
  }

  current = nextCard;
  const prices = payouts();
  if (prices[1] || prices[-1]) {
    incoming.classList.remove('reveal');
    currentSlot.replaceChildren(incoming);
    if (!reducedMotion.matches) {
      const to = incoming.getBoundingClientRect();
      incoming.animate([
        { transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px)' },
        { transform: 'none' }
      ], { duration: 210, easing: 'cubic-bezier(.2,.7,.3,1)' });
      await pause(115);
    }
  } else {
    dealStarter();
  }

  showCard('next', null, 'arrive');
  await pause(130);
  return prices[1] || prices[-1];
}

async function awardSymbol() {
  awardedThisRound = true;
  const index = Math.floor(Math.random() * symbols.length);
  const symbol = symbols[index];
  const target = symbolSlots[collection.length];
  revealingBonus = true;
  updateFamiliar();

  if (!reducedMotion.matches) {
    const cat = familiar.querySelector('.familiar-head').getBoundingClientRect();
    const socket = target.getBoundingClientRect();
    const token = document.createElement('span');
    token.className = 'flying-symbol';
    token.textContent = symbol.glyph;
    token.setAttribute('aria-hidden', 'true');
    bonus.append(token);
    const panel = bonus.getBoundingClientRect();
    token.style.left = cat.left + cat.width / 2 - panel.left + 'px';
    token.style.top = cat.top + cat.height / 2 - panel.top + 'px';
    const dx = socket.left + socket.width / 2 - cat.left - cat.width / 2;
    const dy = socket.top + socket.height / 2 - cat.top - cat.height / 2;
    await token.animate([
      { transform: 'translate(-50%, -50%) scale(.55)', opacity: .5 },
      { transform: 'translate(calc(-50% + ' + dx / 2 + 'px), -85%) rotate(-32deg) scale(1.3)', opacity: 1 },
      { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.75)', opacity: 1 }
    ], { duration: 430, easing: 'ease-in-out' }).finished;
    token.remove();
  }

  collection.push(index);
  updateFamiliar();
  if (collection.length === vaultSize) {
    const previousPot = pot;
    const multiplier = goldMultipliers[Math.floor(Math.random() * goldMultipliers.length)];
    pot = Math.round(100 * pot * multiplier) / 100;
    showCash(pot - previousPot);
    byId('next-label').textContent = 'Gold card';
    byId('next').firstElementChild.classList.add('gold-card');
    bonus.classList.add('vault-open');
    playTone(660);
    await pause(850);
    byId('next-label').textContent = 'Next';
    collection.length = 0;
    bonus.classList.remove('vault-open');
  } else {
    playTone(520);
    await pause(170);
  }
  revealingBonus = false;
  updateFamiliar();
}
async function guess(direction) {
  if (busy || ended) return;
  const quote = payouts()[direction];
  if (!quote) return;
  busy = true;
  cashPop.replaceChildren();
  const wasAwake = wakeFamiliar();
  updateControls();
  const next = deck.pop();
  const difference = next.value - current.value;
  const correct = difference === 0 || Math.sign(difference) === direction;
  const earnedSymbol = correct && wasAwake && !awardedThisRound && Math.random() < bonusChance;
  const hidden = byId('next').firstElementChild;
  hidden.classList.add('lift-card');
  playTone(240);
  await pause(110);
  showCard('next', next, 'reveal');

  await pause(240);
  if (correct) {
    pot = quote.payout;
    status.textContent = '';
    status.className = 'status';
    if (earnedSymbol) await awardSymbol();
    else await pause(180);
    const carriedCard = await advanceCards(next);
    if (!carriedCard) showStatus('New starter dealt.');
  } else {
    showStatus(difference > 0 ? 'It was higher. Round ended.' : 'It was lower. Round ended.', 'lose');
    ended = true;
    pot = 0;
  }
  busy = false;
  updateControls();
}

function collect() {
  if (busy || ended || !pot) return;
  status.textContent = '';
  status.className = 'status';
  showCash(pot);
  playTone(440);
  pot = 0;
  ended = true;
  updateControls();
}

function playTone(frequency) {
  if (!audio || audio.state !== 'running') return;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.frequency.value = frequency;
  volume.gain.setValueAtTime(.055, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .15);
  tone.connect(volume).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + .15);
}

higher.addEventListener('click', () => {
  guess(1);
});
lower.addEventListener('click', () => {
  guess(-1);
});
takeWin.addEventListener('click', () => {
  if (ended) start();
  else collect();
});
redraw.addEventListener('click', () => {
  dealStarter();
  showCard('next', null, 'arrive');
  showStatus('New starter dealt.');
  updateControls();
});
function changeStake(delta) {
  const amount = bet.validity.valid ? bet.valueAsNumber : stake;
  stake = Math.min(Number(bet.max), Math.max(Number(bet.min), amount + delta));
  stake = Math.round(stake * 100) / 100;
  bet.value = stake;
  updateControls();
}

stakeMinus.addEventListener('click', () => changeStake(-1));
stakePlus.addEventListener('click', () => changeStake(1));
bet.addEventListener('input', () => {
  if (bet.validity.valid) stake = bet.valueAsNumber;
  updateControls();
});
bet.addEventListener('keydown', event => {
  if (event.key === 'Enter' && ended && bet.reportValidity()) {
    start();
    takeWin.focus();
  }
});
options.addEventListener('click', () => {
  const panel = byId('options');
  panel.hidden = !panel.hidden;
  options.setAttribute('aria-expanded', String(!panel.hidden));
});
sound.addEventListener('click', async () => {
  if (sound.getAttribute('aria-pressed') === 'true') {
    await audio.suspend();
    sound.setAttribute('aria-pressed', 'false');
    sound.setAttribute('aria-label', 'Sound off');
    return;
  }
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) {
    sound.setAttribute('aria-label', 'Sound unavailable');
    return;
  }
  try {
    audio ||= new Audio();
    await audio.resume();
    sound.setAttribute('aria-pressed', 'true');
    sound.setAttribute('aria-label', 'Sound on');
    playTone(330);
  } catch {
    sound.setAttribute('aria-label', 'Sound unavailable');
  }
});
showCard('current', null, '');
showCard('next', null, '');
showStatus('Tap Play to deal.');
updateFamiliar();
updateControls();
