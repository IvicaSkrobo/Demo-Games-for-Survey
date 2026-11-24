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
  // (whatever they bet on). Each such player gets ONE ball and wins
  // (their total bet of that round) x (bonus multiplier). Three versions to compare:
  //   v1 Golden wheel - golden wheel, skulls knock balls out, Crown -> inner ring with the one 200x
  //   v2 Card match   - balls roll on the card wheel again; pays by matching the round's cards
  //                     (Joker / exact card 20x, same rank 3x, same suit 1x); each Joker on the board multiplies
  //   v3 Poker hand   - every round each player is dealt 2 hidden cards; in the bonus they are shown and
  //                     joined with the 3 round cards (Joker wild) into a 5-card poker hand.
  //                     Bonus = golden-wheel ball (smaller wheel) + poker hand multiplier.
  const BONUS_MODES = { 1: 'Golden wheel', 2: 'Card match', 3: 'Poker hand' };

  // Place paying pockets evenly among skulls on a 54-pocket ring.
  function ring(pays) { // pays: array of {m} / {crown} in ring order (index 0 sits at the top)
    const slots = new Array(54).fill(null).map(() => ({ m: 0, death: true }));
    pays.forEach((p, k) => (slots[Math.round(k * 54 / pays.length)] = p));
    return slots;
  }
  const BONUS_INNER = [200, 15, 15, 25, 15, 15, 15, 25, 15, 15];
  // v1: 30 skulls, 15x2, 5x3, 2x5, 1x10, Crown
  const BONUS_OUTER = ring(Array.from({ length: 24 }, (_, k) =>
    k === 0 ? { crown: true, m: null } : k === 12 ? { m: 10 } : (k === 6 || k === 18) ? { m: 5 } : [3, 8, 13, 17, 21].includes(k) ? { m: 3 } : { m: 2 }));
  // v3: smaller wheel (the poker hand adds the rest): 34 skulls, 14x2, 4x3, 1x5, 1x10
  const BONUS_OUTER_V3 = ring(Array.from({ length: 20 }, (_, k) =>
    k === 0 ? { m: 10 } : k === 10 ? { m: 5 } : [3, 8, 13, 17].includes(k) ? { m: 3 } : { m: 2 }));
  const P_TRIGGER = 1 - Math.pow((N - 1) / N, 3); // at least one of 3 balls on the Joker

  function spinRing(outerRing) {
    const outer = randomInt(outerRing.length);
    const seg = outerRing[outer];
    if (!seg.crown) return { outer, inner: null, mult: seg.m };
    const inner = randomInt(BONUS_INNER.length);
    return { outer, inner, mult: BONUS_INNER[inner] };
  }
  const bonusSpin = () => spinRing(BONUS_OUTER);
  function ringStats(outerRing) {
    const n = outerRing.length, innerMean = BONUS_INNER.reduce((a, b) => a + b, 0) / BONUS_INNER.length;
    const innerSq = BONUS_INNER.reduce((a, b) => a + b * b, 0) / BONUS_INNER.length;
    let ev = 0, ev2 = 0, alive = 0;
    for (const sg of outerRing) {
      if (sg.crown) { ev += innerMean / n; ev2 += innerSq / n; alive += 1 / n; }
      else { ev += sg.m / n; ev2 += sg.m * sg.m / n; if (sg.m) alive += 1 / n; }
    }
    return { ev, sd: Math.sqrt(ev2 - ev * ev), alive, top: outerRing.some((x) => x.crown) ? 1 / (n * BONUS_INNER.length) : 0 };
  }
  const bonusStats = () => ringStats(BONUS_OUTER);

  // ---- v2 Card match ----
  const V2_PAY = { top: 20, rank: 3, suit: 1 };
  // board = the 3 pocket indexes of the round that opened the bonus. Returns per-pocket tier + multiplier.
  function matchTable(board) {
    const keys = board.filter((i) => i !== 0).map((i) => POCKETS[i]);
    const jokers = 3 - keys.length; // each Joker on the board multiplies the bonus: x1, x2, x3
    return POCKETS.map((p) => {
      let tier = null;
      if (!keys.length || p.joker || keys.some((k) => k.id === p.id)) tier = 'top';
      else if (keys.some((k) => k.rank === p.rank)) tier = 'rank';
      else if (keys.some((k) => k.suit === p.suit)) tier = 'suit';
      return { tier, mult: tier ? V2_PAY[tier] * jokers : 0 };
    });
  }
  let v2Cache = null;
  function v2Stats() { // exact: every ordered trigger board (>=1 Joker) is equally likely
    if (v2Cache) return v2Cache;
    let ev = 0, n = 0, alive = 0;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) for (let c = 0; c < N; c++) {
      if (a && b && c) continue;
      const t = matchTable([a, b, c]);
      for (const x of t) { ev += x.mult; if (x.mult) alive++; }
      n += N;
    }
    return (v2Cache = { ev: ev / n, alive: alive / n });
  }

  // ---- v3 Poker hand ----
  const HANDS = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush', 'Five of a kind'];
  const HAND_PAY = [0, 0, 0, 1, 2, 3, 5, 8, 50, 100, 200];
  // Exact odds (2 hidden cards from a fresh 52-card deck + 3 trigger cards, Joker wild);
  // math/rtp.js recomputes these by full enumeration (10,964,694 hands).
  const HAND_P = [0, 0.5576560549706175, 0, 0.3517953168597318, 0.03707463245212315, 0.014275637787976574, 0.015024222290197975, 0.022974831764570904, 0.0006632196028452778, 0.00010214603344151692, 0.0004339382384953014];
  const RV = { A: 14, J: 11, Q: 12, K: 13 };
  function evalHand(idx) { // idx: 5 pocket indexes (0 = Joker, wild). Returns HANDS index.
    const real = idx.filter((i) => i !== 0).map((i) => POCKETS[i]), w = 5 - real.length;
    const cnt = {};
    for (const c of real) { const v = RV[c.rank] || Number(c.rank); cnt[v] = (cnt[v] || 0) + 1; }
    const counts = Object.values(cnt).sort((x, y) => y - x), a = counts[0] || 0, b = counts[1] || 0;
    const vals = Object.keys(cnt).map(Number), distinct = vals.length === real.length;
    const oneSuit = real.every((c) => c.suit === real[0].suit);
    const fits = (lo) => vals.every((v) => (v >= lo && v <= lo + 4) || (v === 14 && lo === 1));
    let straight = false; for (let lo = 1; lo <= 10 && distinct; lo++) if (fits(lo)) { straight = true; break; }
    if (a + w >= 5) return 10;
    if (straight && oneSuit) return distinct && fits(10) ? 9 : 8;
    if (a + w >= 4) return 7;
    if (a + b + w >= 5 && w >= Math.max(0, 3 - a) + Math.max(0, 2 - b)) return 6;
    if (oneSuit) return 5;
    if (straight) return 4;
    if (a + w >= 3) return 3;
    if (a >= 2 && b >= 2) return 2;
    if (a + w >= 2) return 1;
    return 0;
  }
  function dealHole() { // 2 different cards from a 52-card deck (pocket indexes 1..52)
    const x = 1 + randomInt(52); let y; do { y = 1 + randomInt(52); } while (y === x);
    return [x, y];
  }

  // ---- one bonus ball, any version ----
  // board: the round's 3 pocket indexes; hole: the player's 2 hidden cards (v3 only)
  function bonusBall(mode, board, hole) {
    if (mode === 2) { const pocket = randomPocket(); const t = matchTable(board)[pocket]; return { pocket, tier: t.tier, mult: t.mult }; }
    if (mode === 3) {
      const r = spinRing(BONUS_OUTER_V3), hand = evalHand(board.concat(hole));
      return { outer: r.outer, inner: null, wheel: r.mult, hand, handMult: HAND_PAY[hand], mult: r.mult + HAND_PAY[hand] };
    }
    return spinRing(BONUS_OUTER);
  }
  function bonusEV(mode) {
    if (mode === 2) return v2Stats().ev;
    if (mode === 3) return ringStats(BONUS_OUTER_V3).ev + HAND_P.reduce((t, p, k) => t + p * HAND_PAY[k], 0);
    return ringStats(BONUS_OUTER).ev;
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
  function exact(type, target, mode = 1) {
    let c = 0;
    for (const p of POCKETS) if (hits(type, target, p)) c++;
    const q = c / N;
    const P = [Math.pow(1 - q, 3), 3 * q * Math.pow(1 - q, 2), 3 * q * q * (1 - q), Math.pow(q, 3)];
    const pay = PAYS[type];
    let ev = 0, ev2 = 0, win = 0;
    for (let k = 0; k <= 3; k++) { ev += P[k] * pay[k]; ev2 += P[k] * pay[k] * pay[k]; if (pay[k] > 1) win += P[k]; }
    const bonus = P_TRIGGER * bonusEV(mode);
    return { pockets: c, perBall: q, P, rtpBase: ev, rtpBonus: bonus, rtp: ev + bonus, sd: Math.sqrt(ev2 - ev * ev), winChance: win, maxWin: pay[3] };
  }

  const api = { SUITS, RANKS, POCKETS, N, PAYS, BET_LABEL, P_TRIGGER, BONUS_MODES,
    BONUS_OUTER, BONUS_OUTER_V3, BONUS_INNER, V2_PAY, HANDS, HAND_PAY, HAND_P,
    hits, settle, spin, randomPocket, randomInt, triggersBonus, bonusSpin, bonusStats, ringStats,
    matchTable, v2Stats, evalHand, dealHole, bonusBall, bonusEV, exact };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpinOrFoldMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
