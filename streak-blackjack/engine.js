/* Streak Blackjack engine: rules, rail generator, provably-fair draws.
   Pure logic, no DOM. Works in the browser (window.HB) and in Node (module.exports). */
(function (root) {
'use strict';

/* ---------- Parameters ---------- */
const DEFAULTS = {
  feePctOfHandBet: 100,            // 100 => stake splits 50/50
  maxHeat: 5,
  railRanges: [[1.1, 3], [1.2, 5], [1.5, 10], [2, 20], [3, 40], [5, 100]], // per heat: [low, high] x
  maxMultiplier: 100,
  maxSplits: 2,                    // 2 => split, then split one hand again (up to 3 hands)
  blackjackPayoutNoMultiplier: 1.5,
  insurancePayout: 2,
  maxStake: 4000,
  maxPayout: 214000,
  minStake: 1,
  freePlayStartBalance: 1000
};
const cloneParams = p => JSON.parse(JSON.stringify(p));
const round2 = x => Math.round(x * 100) / 100;

/* ---------- SHA-256 / HMAC-SHA256 (sync, so every draw can be re-derived) ---------- */
const PRIMES = []; for (let n = 2; PRIMES.length < 64; n++) if (PRIMES.every(p => n % p)) PRIMES.push(n);
const frac = x => x - Math.floor(x);
const K256 = PRIMES.map(p => Math.floor(frac(Math.cbrt(p)) * 4294967296) >>> 0);
const H256 = PRIMES.slice(0, 8).map(p => Math.floor(frac(Math.sqrt(p)) * 4294967296) >>> 0);
const enc = s => new TextEncoder().encode(s);
function sha256(data) {
  const l = data.length, padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  padded.set(data); padded[l] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(l * 8 / 4294967296));
  dv.setUint32(padded.length - 4, (l * 8) >>> 0);
  const h = H256.slice(), w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) >>> 0; });
  }
  const out = new Uint8Array(32), odv = new DataView(out.buffer);
  h.forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}
function hmacSha256(key, msg) {
  if (key.length > 64) key = sha256(key);
  const k = new Uint8Array(64); k.set(key);
  const ipad = k.map(b => b ^ 0x36), opad = k.map(b => b ^ 0x5c);
  const inner = new Uint8Array(64 + msg.length); inner.set(ipad); inner.set(msg, 64);
  const outer = new Uint8Array(96); outer.set(opad); outer.set(sha256(inner), 64);
  return sha256(outer);
}
const toHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const sha256Hex = s => toHex(sha256(enc(s)));

/* ---------- Draw sources ----------
   Provably fair: draw i of a round = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${i}`).
   Draws 0-5 are the six rail rolls, draws 6+ are cards in the order they are dealt. */
function pfSource(serverSeed, clientSeed, nonce) {
  let idx = 0;
  const key = enc(serverSeed), railLog = [], cardLog = [];
  const next = () => {
    const h = hmacSha256(key, enc(clientSeed + ':' + nonce + ':' + idx++));
    return (h[0] * 16777216 + (h[1] << 16) + (h[2] << 8) + h[3]) / 4294967296;
  };
  return {
    rand() { const u = next(); railLog.push(u); return u; },
    card() { const i = Math.floor(next() * 52); const c = { r: i % 13 + 1, s: Math.floor(i / 13) }; cardLog.push(c); return c; },
    railLog, cardLog
  };
}
const randomSource = () => ({
  rand: Math.random,
  card() { const i = (Math.random() * 52) | 0; return { r: i % 13 + 1, s: (i / 13) | 0 }; }
});
function scriptedSource(cards, rails) { // for tests: cards = ranks 1-13, rails = floats
  let ci = 0, ri = 0;
  return { rand: () => rails ? rails[ri++] : 0.5, card: () => ({ r: cards[ci++], s: 0 }) };
}

/* ---------- Rail ---------- */
function rollRail(params, heat, rand) {
  const [lo, hi] = params.railRanges[Math.min(heat, params.maxHeat, params.railRanges.length - 1)];
  const vals = [];
  for (let i = 0; i < 6; i++) vals.push(lo * Math.pow(hi / lo, rand()));
  vals.sort((a, b) => a - b);
  const out = vals.map(v => {
    v = Math.min(v, params.maxMultiplier);
    return v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  });
  // Blackjack is rarer than any other 21, so keep it clearly above the 21 row (at least 1.5x)
  const minBJ = Math.min(params.maxMultiplier, out[4] * 1.5);
  if (out[5] < minBJ) out[5] = minBJ < 10 ? Math.ceil(minBJ * 10) / 10 : Math.ceil(minBJ);
  return out;
}
const SLOT_LABELS = ['4–17', '18', '19', '20', '21', 'Blackjack'];
const slotFor = total => total >= 21 ? 4 : total <= 17 ? 0 : total - 17;

/* ---------- Hands ---------- */
const cardVal = c => Math.min(c.r, 10);
function handValue(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += cardVal(c); if (c.r === 1) aces++; }
  const soft = aces > 0 && t + 10 <= 21;
  return { total: soft ? t + 10 : t, soft };
}

/* ---------- Round ---------- */
class Round {
  /* o: { handBet, fee, heat, active } ; src: draw source */
  constructor(params, src, o) {
    this.p = params; this.src = src;
    this.handBet = o.handBet; this.fee = o.fee; this.heat = o.heat;
    this.active = o.active != null ? o.active : null;
    this.rail = rollRail(params, o.heat, () => src.rand());
    this.hands = [{ cards: [], bet: o.handBet, extra: 0, done: false, fromSplit: false, aces: false, doubled: false }];
    this.cur = 0; this.dealer = []; this.insBet = 0; this.result = null;
    const h = this.hands[0];
    h.cards.push(src.card()); this.dealer.push(src.card()); h.cards.push(src.card()); this.dealer.push(src.card());
    this.phase = this.dealer[0].r === 1 ? 'insurance' : 'peek';
    if (this.phase === 'peek') this._peek();
  }
  get hand() { return this.hands[this.cur]; }
  get dealerBJ() { return this.dealer.length === 2 && handValue(this.dealer).total === 21; }
  insure(take) {
    if (this.phase !== 'insurance') return;
    if (take) this.insBet = round2(this.handBet / 2);
    this._peek();
  }
  _peek() {
    const h = this.hands[0];
    const pBJ = handValue(h.cards).total === 21;
    if (this.dealerBJ || pBJ) { this._settle(); return; }
    this.phase = 'player';
    this._autoFinish();
  }
  legal() {
    if (this.phase !== 'player') return { hit: false, stand: false, double: false, split: false };
    const h = this.hand, v = handValue(h.cards);
    const free = !h.done && !h.aces;
    return {
      hit: free && v.total < 21,
      stand: free,
      double: free && h.cards.length === 2,
      split: free && this.hands.length <= this.p.maxSplits && h.cards.length === 2 && cardVal(h.cards[0]) === cardVal(h.cards[1])
    };
  }
  _autoFinish() { // auto-stand on 21 / bust, then move on
    const h = this.hand;
    if (!h.done && handValue(h.cards).total >= 21) h.done = true;
    if (h.done) this._advance();
  }
  _advance() {
    const next = this.hands.findIndex(x => !x.done);
    if (next >= 0) { this.cur = next; this._autoFinish(); return; }
    if (this.hands.every(x => handValue(x.cards).total > 21)) { this._settle(); return; }
    this.phase = 'dealer';
  }
  hit() { if (!this.legal().hit) return; this.hand.cards.push(this.src.card()); this._autoFinish(); }
  stand() { if (!this.legal().stand) return; this.hand.done = true; this._advance(); }
  double() {
    if (!this.legal().double) return;
    const h = this.hand; h.extra = h.bet; h.doubled = true;
    h.cards.push(this.src.card()); h.done = true; this._advance();
  }
  split() {
    if (!this.legal().split) return;
    const h = this.hand, aces = h.cards[0].r === 1;
    const second = { cards: [h.cards.pop()], bet: this.handBet, extra: 0, done: false, fromSplit: true, aces, doubled: false };
    h.fromSplit = true; h.aces = aces;
    this.hands.splice(this.cur + 1, 0, second); // new hand plays right after this one
    h.cards.push(this.src.card()); second.cards.push(this.src.card());
    if (aces) { h.done = true; second.done = true; }
    this._autoFinish();
  }
  dealerStep() { // returns true if the dealer drew a card; false when finished (round settled)
    if (this.phase !== 'dealer') return false;
    if (handValue(this.dealer).total < 17) { this.dealer.push(this.src.card()); return true; }
    this._settle(); return false;
  }
  runDealer() { while (this.dealerStep()); }
  voidRound() { // refund bet and fee, forfeit any multiplier riding on it
    const staked = this.fee + this.hands.reduce((s, h) => s + h.bet + h.extra, 0) + this.insBet;
    this.phase = 'done';
    this.result = { voided: true, totalStaked: round2(staked), totalReturned: round2(staked), net: 0, roundWin: false, bankedMult: null, multUsed: null, outcome: 'void', hands: [] };
    return this.result;
  }
  _settle() {
    const p = this.p, dv = handValue(this.dealer), dBJ = this.dealerBJ, dBust = dv.total > 21;
    const single = this.hands.length === 1;
    let multLeft = this.active, multUsed = null, anyWin = false, anyPush = false, bestSlot = -1, raw = 0, extrasStaked = 0;
    const hands = this.hands.map(h => {
      const total = handValue(h.cards).total;
      const pBJ = single && !h.fromSplit && h.cards.length === 2 && total === 21;
      let o;
      if (total > 21) o = 'loss';
      else if (dBJ) o = pBJ ? 'push' : 'loss';
      else if (pBJ) o = 'blackjack';
      else if (dBust || total > dv.total) o = 'win';
      else if (total === dv.total) o = 'push';
      else o = 'loss';
      const stakedHere = h.bet + h.extra; extrasStaked += stakedHere;
      let profit = 0, returned = 0, applied = null;
      if (o === 'win' || o === 'blackjack') {
        anyWin = true;
        let m = null;
        if (multLeft != null) { m = multLeft; multLeft = null; multUsed = m; applied = m; }
        profit = o === 'blackjack' ? h.bet * (m != null ? Math.max(m, p.blackjackPayoutNoMultiplier) : p.blackjackPayoutNoMultiplier)
                                   : h.bet * (m != null ? m : 1) + h.extra;
        profit = round2(profit);
        returned = round2(stakedHere + profit);
        bestSlot = Math.max(bestSlot, o === 'blackjack' ? 5 : slotFor(total));
      } else if (o === 'push') { anyPush = true; returned = stakedHere; }
      raw += returned;
      return { cards: h.cards.slice(), total, outcome: o, bet: h.bet, extra: h.extra, doubled: h.doubled, profit, returned, mult: applied };
    });
    const insReturn = this.insBet && dBJ ? round2(this.insBet * (1 + p.insurancePayout)) : 0;
    raw = round2(raw + insReturn);
    const capped = raw > p.maxPayout;
    const totalReturned = capped ? p.maxPayout : raw;
    const totalStaked = round2(this.fee + extrasStaked + this.insBet);
    let outcome;
    if (dBJ) outcome = 'dealerBJ';
    else if (anyWin) outcome = hands.some(h => h.outcome === 'blackjack') ? 'blackjack' : 'win';
    else if (anyPush) outcome = 'push';
    else outcome = 'loss';
    this.phase = 'done';
    this.result = {
      outcome, hands, dealerTotal: dv.total, dealerBust: dBust, dealerBJ: dBJ,
      insurance: { bet: this.insBet, returned: insReturn },
      totalStaked, totalReturned, net: round2(totalReturned - totalStaked), capped,
      roundWin: anyWin, bankSlot: bestSlot,
      bankedMult: anyWin ? this.rail[bestSlot] : null,
      multUsed, multForfeited: !anyWin && this.active != null ? this.active : null,
      active: this.active
    };
  }
}

/* ---------- Streak bookkeeping ---------- */
function nextStreak(params, state, res) {
  if (res.roundWin) return { heat: Math.min(state.heat + 1, params.maxHeat), active: res.bankedMult, count: state.count + 1 };
  return { heat: 0, active: null, count: 0 };
}
function splitStake(params, stake) {
  const handBet = round2(stake / (1 + params.feePctOfHandBet / 100));
  return { handBet, fee: round2(stake - handBet) };
}

/* ---------- Provably fair verification ---------- */
function verifyRound(params, serverSeed, clientSeed, nonce, heat, cardCount) {
  const src = pfSource(serverSeed, clientSeed, nonce);
  const rail = rollRail(params, heat, () => src.rand());
  const cards = []; for (let i = 0; i < cardCount; i++) cards.push(src.card());
  return { rail, cards };
}

const api = {
  DEFAULTS, cloneParams, round2, sha256, hmacSha256, sha256Hex, toHex, enc,
  pfSource, randomSource, scriptedSource, rollRail, SLOT_LABELS, slotFor,
  handValue, cardVal, Round, nextStreak, splitStake, verifyRound
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HB = api;
})(typeof window !== 'undefined' ? window : globalThis);
