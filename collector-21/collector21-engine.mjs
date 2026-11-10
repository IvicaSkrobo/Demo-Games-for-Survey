export const C21_BONUS_SCALE=1;
export const C21_TARGET_RTP=.92;
export const C21_TARGET=21;
export const C21_BETS=[1,2,5,10,20,50,100];
export const C21_JOKER_POINTS=1;
export const C21_JOKER_MULTIPLIER=3;
export const C21_INSTANT_MIN_POINTS=10;
export const C21_PAYOUTS=[{label:'Bust',probability:.1,multiplier:0},{label:'Win',probability:.5,multiplier:1.25},{label:'Bigger win',probability:.3,multiplier:1.5},{label:'Big win',probability:.1,multiplier:1.75}];
export const C21_DECK={single:52,dual:18,colour:4,jokers:4,total:78,dualRanks:['3','5','7'],colourRanks:['4','Q']};
export const C21_FACTORS=[3,2,1,4];
export const CARD_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export function cardPoints(rank){if(!CARD_RANKS.includes(rank))throw Error('Unknown rank');return rank==='A'?1:['J','Q','K'].includes(rank)?10:Number(rank)}
export function shuffle21(rng=Math.random){
 const deck=Array.from({length:4},(_,suit)=>CARD_RANKS.map(rank=>({rank,suit,suits:[suit],number:cardPoints(rank)}))).flat();
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(const rank of C21_DECK.dualRanks)deck.push({rank,suit:a,suits:[a,b],number:cardPoints(rank)});
 for(const color of ['red','black'])for(const rank of C21_DECK.colourRanks){const suits=color==='red'?[0,1]:[2,3];deck.push({rank,color,suit:suits[0],suits,number:cardPoints(rank)})}
 for(let suit=0;suit<4;suit++)deck.push({rank:'JOKER',suit,suits:[0,1,2,3],joker:true,number:C21_JOKER_POINTS});
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck;
}
export function draw21(bet,rng=Math.random,deck=null){
 if(!Number.isFinite(bet)||bet<=0)throw Error('Invalid bet');
 const r=rng();let sum=0;const outcome=C21_PAYOUTS.find(o=>(sum+=o.probability)>r)||C21_PAYOUTS.at(-1);
 const identity=(deck||shuffle21(rng)).pop();if(!identity)throw Error('Empty deck');
 const bust=outcome.multiplier===0,suit=bust?Math.floor(rng()*4):identity.suit;
 const multiplier=bust?0:identity.joker?C21_JOKER_MULTIPLIER:identity.number<C21_INSTANT_MIN_POINTS?0:outcome.multiplier;
 return {...identity,suit,color:bust?null:identity.color,rank:bust?'BUST':identity.rank,number:bust?0:identity.number,suits:bust?[suit]:identity.suits,joker:!bust&&!!identity.joker,bet,bust,multiplier,prize:Math.round(bet*multiplier*100)/100};
}
export function place21(lanes,index,card){if(!Number.isInteger(index)||index<0||index>3||card.bust||!(card.suits||[card.suit]).includes(index))throw Error('Invalid placement');const next=lanes.map(l=>({...l,cards:[...l.cards]})),lane=next[index],total=lane.total+card.number;lane.total=total;lane.stakes+=card.bet;lane.cards.push({...card});const hit=total===21,bust=total>21,prize=hit?Math.round(lane.stakes*C21_FACTORS[index]*100)/100:0;if(hit||bust)next[index]={total:0,stakes:0,cards:[]};return {lanes:next,total,hit,bust,prize}}

export function bustSuit21(lanes,card){if(!card.bust||!Number.isInteger(card.suit)||card.suit<0||card.suit>3)throw Error('Not a suit bust');return lanes.map((lane,i)=>i===card.suit?{total:0,stakes:0,cards:[]}:{...lane,cards:[...lane.cards]})}

// Prefer the largest immediate exact-21 award, then the strongest safe collector.
export function autoLane21(lanes,card){return greedyLane21(lanes,card)}

export function greedyLane21(lanes,card){return [...card.suits].sort((a,b)=>{const score=i=>{const total=lanes[i].total+card.number;return total===21?10000+(lanes[i].stakes+card.bet)*C21_FACTORS[i]:total<21?100+C21_FACTORS[i]:-total};return score(b)-score(a)})[0]}
