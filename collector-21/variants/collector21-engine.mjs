export const C21_BONUS_SCALE=1;
export const C21_TARGET_RTP=.94;
export const C21_TARGET=21;
export const C21_BETS=[1,2,5,10,20,50,100];
export const C21_JOKER_POINTS=1;
export const C21_BUST_CHANCE=.1;
export const C21_INSTANT_CHANCE=.56;
export const C21_FREE_INSTANT_CHANCE=.20;
export const C21_INSTANT_PAYOUTS=Object.freeze({'10':1,J:1.25,Q:1.5,K:2,A:2.5,JOKER:3});
export const C21_DECK={single:52,jokers:4,total:56};
export const C21_SECOND_SUIT_CHANCE=.25;
export const C21_FACTORS=[2.5,2,1.5,4];
export const C21_FREE_BASE_FACTOR=1;
export const C21_FREE_SUIT_BONUS=.5;

export function collectorFactor21(index, cards, freePlacement, pending) {
 if (!freePlacement) return C21_FACTORS[index];
 const matchingPoints = card => !card.joker && !card.bust && card.suit===index ? card.number : 0;
 const points = cards.reduce((sum, card) => sum+matchingPoints(card), 0) + (pending ? matchingPoints(pending) : 0);
 return Math.round((C21_FREE_BASE_FACTOR+C21_FREE_SUIT_BONUS*Math.min(points,C21_TARGET)/C21_TARGET)*100)/100;
}
export const CARD_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export function cardPoints(rank){if(!CARD_RANKS.includes(rank))throw Error('Unknown rank');return rank==='A'?1:['J','Q','K'].includes(rank)?10:Number(rank)}
export function shuffle21(rng=Math.random){
 const deck=Array.from({length:4},(_,suit)=>CARD_RANKS.map(rank=>({rank,suit,suits:[suit],number:cardPoints(rank)}))).flat();
 for(let suit=0;suit<4;suit++)deck.push({rank:'JOKER',suit,suits:[0,1,2,3],joker:true,number:C21_JOKER_POINTS});
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck;
}
export function draw21(bet,rng=Math.random,deck=null, freePlacement=false){
 if(!Number.isFinite(bet)||bet<=0)throw Error('Invalid bet');
 const roll=rng();
 const identity=(deck||shuffle21(rng)).pop();if(!identity)throw Error('Empty deck');
 const bust=roll<C21_BUST_CHANCE;
 const suit=bust?Math.floor(rng()*4):identity.suit;
 const multiplier=!bust && roll<C21_BUST_CHANCE+(freePlacement?C21_FREE_INSTANT_CHANCE:C21_INSTANT_CHANCE)
  ? C21_INSTANT_PAYOUTS[identity.rank]??0
  : 0;
 let suits=bust?[suit]:identity.suits;
 if (!bust && freePlacement) {
  suits=[0,1,2,3];
 } else if (!bust && !identity.joker && suits.length===1 && rng()<C21_SECOND_SUIT_CHANCE) {
  const alternate=Math.floor(rng()*3);
  suits=[suit,alternate>=suit?alternate+1:alternate];
 }
 return {...identity,freePlacement:freePlacement&&!bust,suit,color:bust?null:identity.color,rank:bust?'BUST':identity.rank,number:bust?0:identity.number,suits,joker:!bust&&!!identity.joker,bet,bust,multiplier,prize:Math.round(bet*multiplier*100)/100};
}
export function place21(lanes,index,card) {
 if (!Number.isInteger(index) || index<0 || index>3 || card.bust || !(card.suits||[card.suit]).includes(index)) throw Error('Invalid placement');
 const next=lanes.map(lane=>({...lane,cards:[...lane.cards]}));
 const lane=next[index];
 lane.total+=card.number;
 lane.stakes+=card.bet;
 lane.cards.push({...card});
 const total=lane.total;
 const hit=total===C21_TARGET;
 const bust=total>C21_TARGET;
 const factor=collectorFactor21(index,lane.cards,card.freePlacement);
 const prize=hit ? Math.round(lane.stakes*factor*100)/100 : 0;
 if (hit||bust) next[index]={total:0,stakes:0,cards:[]};
 return {lanes:next,total,hit,bust,prize,factor};
}

export function bustSuit21(lanes,card){if(!card.bust||!Number.isInteger(card.suit)||card.suit<0||card.suit>3)throw Error('Not a suit bust');return lanes.map((lane,i)=>i===card.suit?{total:0,stakes:0,cards:[]}:{...lane,cards:[...lane.cards]})}

// Prefer the largest immediate exact-21 award, then the strongest safe collector.
export function autoLane21(lanes,card){return greedyLane21(lanes,card)}

export function greedyLane21(lanes,card) {
 const score=index=>{
  const lane=lanes[index];
  const total=lane.total+card.number;
  const factor=collectorFactor21(index,lane.cards,card.freePlacement,card);
  if (total===C21_TARGET) return 10000+(lane.stakes+card.bet)*factor;
  if (!card.freePlacement) return total<C21_TARGET ? 100+factor : -total;
  if (total<C21_TARGET) return 100+factor-total*.01;
  return -lane.stakes*factor;
 };
 return [...card.suits].sort((a,b)=>score(b)-score(a))[0];
}
