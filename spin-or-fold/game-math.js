/* Spin or Fold — game math (shared by the prototype and the RTP calculator).
 *
 * Wheel: 53 pockets = 52 poker cards + 1 Joker.
 * 3 balls per round. Each ball lands independently and uniformly (balls CAN share a pocket).
 * A bet pays by HOW MANY of the 3 balls hit it: PAYS[type][hits] = total return x stake (stake included).
 * Joker is WILD for group bets (suit, colour, high) because it holds all 4 suits.
 * Single-card and rank bets need the real card — Joker does not count for them.
 */
(function (root) {
  'use strict';

  // Wheel order: suits alternate red / black, Joker sits between Clubs and Hearts (the "zero").
  const SUITS = [
    { id: 'H', name: 'Hearts',   sym: '♥', color: 'red'   },
    { id: 'S', name: 'Spades',   sym: '♠', color: 'black' },
    { id: 'D', name: 'Diamonds', sym: '♦', color: 'red'   },
    { id: 'C', name: 'Clubs',    sym: '♣', color: 'black' },
  ];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const HIGH = new Set(['10', 'J', 'Q', 'K', 'A']);

  const POCKETS = [{ id: 'JK', joker: true, label: 'JOKER' }];
  for (const s of SUITS) {
    for (const r of RANKS) {
      POCKETS.push({ id: r + s.id, rank: r, suit: s.id, sym: s.sym, color: s.color, high: HIGH.has(r), joker: false });
    }
  }
  const N = POCKETS.length; // 53

  // ---- Pay tables: index = number of balls that hit (0,1,2,3). Total return incl. stake. ----
  // Base pays are ~10 points under the target because the Joker Bonus (below) returns ~10.4%.
  const PAYS = {
    card:  [0, 15, 30, 45],      // exact card, every ball pays -> 3 balls = 3x
    rank:  [0, 3.8, 7.6, 11.4],  // any suit of one rank (e.g. all Kings)
    suit:  [0, 1, 2.3, 3.6],     // one suit, Joker wild — 1 ball gives the stake back
    color: [0, 0, 1.3, 2.7],     // red / black, Joker wild — needs 2+ balls
    high:  [0, 0, 2.2, 3.6],     // 10 J Q K A, Joker wild — needs 2+ balls
    joker: [0, 13, 120, 1500],   // Joker jackpot
  };

  // ---- Joker Bonus ----
  // Any ball on the Joker opens a bonus for EVERY player who had a bet in that round
  // (whatever they bet on). Each such player gets one ball on the golden wheel and wins
  // (their total bet of that round) x (multiplier). Skull = the ball is out (0x).
  // Outer ring: 54 equal pockets. The Crown pocket sends the ball to the inner ring,
  // which holds the one 200x.
  const BONUS_INNER = [200, 15, 15, 25, 15, 15, 15, 25, 15, 15];
  const BONUS_OUTER = (() => {
    const slots = new Array(54).fill(null).map(() => ({ m: 0, death: true }));
    const spots = Array.from({ length: 24 }, (_, k) => Math.round(k * 54 / 24)); // 24 paying pockets, evenly spread
    const val = new Array(24).fill(2);                    // 15 x 2x
    [3, 8, 13, 17, 21].forEach((k) => (val[k] = 3));      //  5 x 3x
    [6, 18].forEach((k) => (val[k] = 5));                 //  2 x 5x
    val[12] = 10;                                         //  1 x 10x
    spots.forEach((s, k) => (slots[s] = k === 0 ? { crown: true, m: null } : { m: val[k] }));
    return slots;
  })();
  const P_TRIGGER = 1 - Math.pow((N - 1) / N, 3); // at least one of 3 balls on the Joker

  function bonusSpin() {
    const outer = randomInt(BONUS_OUTER.length);
    const seg = BONUS_OUTER[outer];
    if (!seg.crown) return { outer, inner: null, mult: seg.m };
    const inner = randomInt(BONUS_INNER.length);
    return { outer, inner, mult: BONUS_INNER[inner] };
  }
  function bonusStats() {
    const n = BONUS_OUTER.length, innerMean = BONUS_INNER.reduce((a, b) => a + b, 0) / BONUS_INNER.length;
    let ev = 0, ev2 = 0, alive = 0;
    const innerSq = BONUS_INNER.reduce((a, b) => a + b * b, 0) / BONUS_INNER.length;
    for (const s of BONUS_OUTER) {
      if (s.crown) { ev += innerMean / n; ev2 += innerSq / n; alive += 1 / n; }
      else { ev += s.m / n; ev2 += s.m * s.m / n; if (s.m) alive += 1 / n; }
    }
    return { ev, sd: Math.sqrt(ev2 - ev * ev), alive, top: 1 / (n * BONUS_INNER.length) * BONUS_INNER.filter((x) => x === 200).length };
  }

  const BET_LABEL = { card: 'Card', rank: 'Rank', suit: 'Suit', color: 'Colour', high: 'High 10-A', joker: 'Joker' };

  function hits(type, target, p) {
    switch (type) {
      case 'card':  return p.id === target;
      case 'rank':  return !p.joker && p.rank === target;
      case 'suit':  return p.joker || p.suit === target;
      case 'color': return p.joker || p.color === target;
      case 'high':  return p.joker || p.high;
      case 'joker': return p.joker;
    }
    throw new Error('unknown bet ' + type);
  }

  // balls: array of 3 pocket indexes. Returns {hits, mult}
  function settle(type, target, balls) {
    let h = 0;
    for (const b of balls) if (hits(type, target, POCKETS[b])) h++;
    return { hits: h, mult: PAYS[type][h] };
  }

  // Uniform integer 0..n-1 (crypto RNG with rejection sampling when available).
  const buf = new Uint32Array(1);
  function randomInt(n) {
    const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
    if (!c) return Math.floor(Math.random() * n);
    const limit = Math.floor(0x100000000 / n) * n;
    do { c.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  const randomPocket = () => randomInt(N);
  function spin() { return [randomPocket(), randomPocket(), randomPocket()]; }
  const triggersBonus = (balls) => balls.includes(0); // pocket 0 = Joker

  // Exact maths for one bet: hit probability per ball -> binomial over 3 balls,
  // plus the Joker Bonus share (same for every bet, because any bet qualifies).
  function exact(type, target) {
    let c = 0;
    for (const p of POCKETS) if (hits(type, target, p)) c++;
    const q = c / N;
    const P = [Math.pow(1 - q, 3), 3 * q * Math.pow(1 - q, 2), 3 * q * q * (1 - q), Math.pow(q, 3)];
    const pay = PAYS[type];
    let ev = 0, ev2 = 0, win = 0;
    for (let k = 0; k <= 3; k++) { ev += P[k] * pay[k]; ev2 += P[k] * pay[k] * pay[k]; if (pay[k] > 1) win += P[k]; }
    const bonus = P_TRIGGER * bonusStats().ev;
    return { pockets: c, perBall: q, P, rtpBase: ev, rtpBonus: bonus, rtp: ev + bonus, sd: Math.sqrt(ev2 - ev * ev), winChance: win, maxWin: pay[3] };
  }

  const api = { SUITS, RANKS, POCKETS, N, PAYS, BET_LABEL, BONUS_OUTER, BONUS_INNER, P_TRIGGER,
    hits, settle, spin, randomPocket, randomInt, triggersBonus, bonusSpin, bonusStats, exact };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpinOrFoldMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
