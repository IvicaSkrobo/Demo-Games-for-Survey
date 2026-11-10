export const C21_BONUS_SCALE=.5532;
export const C21_FACTORS=[2,1.5,1,3].map(f=>f*C21_BONUS_SCALE);
export const CARD_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export function cardPoints(rank){if(!CARD_RANKS.includes(rank))throw Error('Unknown rank');return rank==='A'?1:['J','Q','K'].includes(rank)?10:Number(rank)}
export function shuffle21(rng=Math.random){
 const deck=Array.from({length:4},(_,suit)=>CARD_RANKS.map(rank=>({rank,suit,suits:[suit],number:cardPoints(rank)}))).flat();
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(const rank of ['3','5','7'])deck.push({rank,suit:a,suits:[a,b],number:cardPoints(rank)});
 for(const color of ['red','black'])for(const rank of ['4','Q']){const suits=color==='red'?[0,1]:[2,3];deck.push({rank,color,suit:suits[0],suits,number:cardPoints(rank)})}
 for(let suit=0;suit<4;suit++)deck.push({rank:'JOKER',suit,suits:[0,1,2,3],joker:true,number:1});
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck;
}
export function draw21(bet,rng=Math.random,example=false,deck=null){if(!Number.isFinite(bet)||bet<=0)throw Error('Invalid bet');const r=example?.5:rng();let multiplier=r<.3?0:r<.7?.5:r<.9?1.5:2.5;const identity=example?{rank:'7',suit:0,suits:[0,1],number:7}:(deck||shuffle21(rng)).pop();if(!identity)throw Error('Empty deck');if(identity.joker&&multiplier>0)multiplier=3;return {...identity,color:multiplier===0?null:identity.color,rank:multiplier===0?'BUST':identity.rank,number:multiplier===0?0:identity.number,suits:multiplier===0?[identity.suit]:(identity.suits||[identity.suit]),joker:multiplier!==0&&!!identity.joker,bet,bust:multiplier===0,multiplier,prize:Math.round(bet*multiplier*100)/100}}
export function place21(lanes,index,card){if(!Number.isInteger(index)||index<0||index>3||card.bust||!(card.suits||[card.suit]).includes(index))throw Error('Invalid placement');const next=lanes.map(l=>({...l,cards:[...l.cards]})),lane=next[index],total=lane.total+card.number;lane.total=total;lane.stakes+=card.bet;lane.cards.push({...card});const hit=total===21,bust=total>21,prize=hit?Math.round(lane.stakes*C21_FACTORS[index]*100)/100:0;if(hit||bust)next[index]={total:0,stakes:0,cards:[]};return {lanes:next,total,hit,bust,prize}}

export function bustSuit21(lanes,card){if(!card.bust||!Number.isInteger(card.suit)||card.suit<0||card.suit>3)throw Error('Not a suit bust');return lanes.map((lane,i)=>i===card.suit?{total:0,stakes:0,cards:[]}:{...lane,cards:[...lane.cards]})}

export function autoLane21(lanes,card){const allowed=card.suits||[card.suit];return [...allowed].sort((a,b)=>{const score=i=>{const n=lanes[i].total+card.number;return n===21?1000+C21_FACTORS[i]:n<21?100+n: -n};return score(b)-score(a)})[0]}
