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
  const PAYS = {
    card:  [0, 17, 34, 51],      // exact card, every ball pays -> 3 balls = 3x
    rank:  [0, 4.2, 8.4, 12.6],  // any suit of one rank (e.g. all Kings)
    suit:  [0, 1.2, 2.4, 3.6],   // one suit, Joker wild
    color: [0, 0, 1.5, 3],       // red / black, Joker wild — needs 2+ balls
    high:  [0, 0, 2.5, 4],       // 10 J Q K A, Joker wild — needs 2+ balls
    joker: [0, 15, 120, 1500],   // Joker jackpot
  };

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

  // Uniform pocket 0..52 (crypto RNG with rejection sampling when available).
  function randomPocket() {
    const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
    if (!c) return Math.floor(Math.random() * N);
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / N) * N;
    do { c.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % N;
  }
  function spin() { return [randomPocket(), randomPocket(), randomPocket()]; }

  // Exact maths for one bet: hit probability per ball -> binomial over 3 balls.
  function exact(type, target) {
    let c = 0;
    for (const p of POCKETS) if (hits(type, target, p)) c++;
    const q = c / N;
    const P = [Math.pow(1 - q, 3), 3 * q * Math.pow(1 - q, 2), 3 * q * q * (1 - q), Math.pow(q, 3)];
    const pay = PAYS[type];
    let ev = 0, ev2 = 0, win = 0;
    for (let k = 0; k <= 3; k++) { ev += P[k] * pay[k]; ev2 += P[k] * pay[k] * pay[k]; if (pay[k] > 1) win += P[k]; }
    return { pockets: c, perBall: q, P, rtp: ev, sd: Math.sqrt(ev2 - ev * ev), winChance: win, maxWin: pay[3] };
  }

  const api = { SUITS, RANKS, POCKETS, N, PAYS, BET_LABEL, hits, settle, spin, randomPocket, exact };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpinOrFoldMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
