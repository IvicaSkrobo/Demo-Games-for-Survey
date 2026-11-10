export const SUITS=['♥','♦','♣','♠'];
export const pick=(n,rng=Math.random)=>Math.floor(rng()*n);
export const sum=a=>a.reduce((x,y)=>x+y,0);
export function royalDeal(rng=Math.random,showcase=false){
 const cards=Array.from({length:9},()=>{let r=rng();return r<.48?{kind:'cash',value:[5,10,15,20][pick(4,rng)]}:r<.61?{kind:'key'}:r<.73?{kind:'crown'}:{kind:'blank'}});
 if(showcase){cards[0]={kind:'cash',value:10};cards[1]={kind:'cash',value:15};cards[2]={kind:'cash',value:20};cards[3]={kind:'key'};cards[4]={kind:'crown'}}
 const crowns=cards.filter(c=>c.kind==='crown').length;for(const c of cards)if(c.kind==='cash')c.value*=1+crowns;
 const keys=cards.filter(c=>c.kind==='key').length;const bonus=cards.filter(c=>c.kind==='cash').length>=3;
 return {cards,bonus,respins:bonus?3:0,prize:sum(cards.map(c=>c.value||0)),extraSlots:Math.min(3,keys),crowns};
}
export function royalRespin(cards,rng=Math.random){let added=0;const next=cards.map(c=>{if(c.kind==='cash')return {...c};if(rng()<.24){added++;return {kind:'cash',value:[5,10,15,25,50][pick(5,rng)]}}return {kind:'blank'}});return {cards:next,added,prize:sum(next.map(c=>c.value||0)),full:next.every(c=>c.kind==='cash')};}
export const SUIT_BET=10;
export const SUIT_AWARDS=[40,32,24,51.2]; // Hearts, Diamonds, Clubs, Spades; sum / (4 suits × 4 cards × 10 bet) = .92.
export const SUIT_BETS=[1,2,5,10,20,50,100];
export function suitPayout(suit,stakes){
 if(!Number.isInteger(suit)||suit<0||suit>3||stakes.length!==4||stakes.some(b=>!SUIT_BETS.includes(b)))throw new Error('Invalid suit or card stakes');
 return Math.round(sum(stakes)*SUIT_AWARDS[suit]/(4*SUIT_BET)*100)/100;
}
export function suitDeal(counts,rng=Math.random,showcase=false,cardCount=5,forcedSuit=null,bet=SUIT_BET,stakeSums=counts.map(n=>n*bet)){
 if(!SUIT_BETS.includes(bet))throw new Error('Unsupported card bet');
 const cards=Array.from({length:cardCount},()=>({suit:forcedSuit??pick(4,rng),rank:['A','K','Q','J','10'][pick(5,rng)],bet}));
 if(showcase)cards.splice(0,5,...[0,1,2,3,0].map(suit=>({suit,rank:'A',bet})));
 const next=[...counts],nextStakes=[...stakeSums],bonuses=[];let prize=0;
 for(const c of cards){next[c.suit]++;nextStakes[c.suit]+=bet;if(next[c.suit]>=4){next[c.suit]-=4;const value=Math.round(nextStakes[c.suit]*SUIT_AWARDS[c.suit]/(4*SUIT_BET)*100)/100;nextStakes[c.suit]=0;prize=Math.round((prize+value)*100)/100;bonuses.push({suit:c.suit,value,values:[[20,20],[8],[8,8],[12.8,12.8,12.8,12.8]][c.suit],base:c.suit===2?8:0,multiplier:4,mode:['Extra draw','Diamond multiplier','Card upgrade','Sweep collector'][c.suit]})}}
 return {cards,counts:next,stakeSums:nextStakes,bonuses,prize};
}
export function findClusters(board,width=5,min=3){const seen=new Set(),groups=[];for(let i=0;i<board.length;i++){if(seen.has(i))continue;const todo=[i],group=[];seen.add(i);while(todo.length){const at=todo.pop();group.push(at);const x=at%width;const near=[at-width,at+width,...(x?[at-1]:[]),...(x<width-1?[at+1]:[])];for(const j of near)if(j>=0&&j<board.length&&!seen.has(j)&&board[j]===board[i]){seen.add(j);todo.push(j)}}if(group.length>=min)groups.push(group)}return groups;}
export function collapse(board,groups,rng=Math.random,width=5){const removed=new Set(groups.flat()),height=board.length/width,next=[...board];for(let x=0;x<width;x++){let kept=[];for(let y=0;y<height;y++)if(!removed.has(y*width+x))kept.push(board[y*width+x]);const col=[...Array.from({length:height-kept.length},()=>pick(4,rng)),...kept];for(let y=0;y<height;y++)next[y*width+x]=col[y]}return next;}
export function chainDeal(rng=Math.random,showcase=false){let board=Array.from({length:20},()=>pick(4,rng));if(showcase)board.splice(0,3,0,0,0);const joker=rng()<.3||showcase;let transformed=[];if(joker){const at=pick(20,rng),target=board[at];for(const j of [at,at-1,at+1])if(j>=0&&j<20&&Math.floor(j/5)===Math.floor(at/5)){board[j]=target;transformed.push(j)}}const frames=[];let prize=0;for(let step=1;step<=8;step++){const groups=findClusters(board);if(!groups.length)break;const amount=sum(groups.map(g=>g.length*2))*step;prize+=amount;frames.push({board:[...board],groups,multiplier:step,amount});board=collapse(board,groups,rng)}return {frames,board,prize,joker,transformed,capped:frames.length===8};}
export function houseDeal(previous,rng=Math.random,showcase=false){let board=previous.map(c=>({...c}));const dealt=[];for(let n=0;n<4;n++){const at=showcase?n:pick(16,rng),value=[5,10,15,20][pick(4,rng)];board[at].value+=value;dealt.push({at,value})}const lines=[];for(let y=0;y<4;y++){const indices=[0,1,2,3].map(x=>y*4+x);if(indices.every(i=>board[i].value>0))lines.push(indices)}for(let x=0;x<4;x++){const indices=[0,1,2,3].map(y=>y*4+x);if(indices.every(i=>board[i].value>0))lines.push(indices)}const hits=new Map();for(const line of lines)for(const i of line)hits.set(i,(hits.get(i)||0)+1);const intersections=[...hits].filter(([,n])=>n>1).length;const prize=sum([...hits.keys()].map(i=>board[i].value))+intersections*20;const shown=board.map(c=>({...c}));for(const i of hits.keys())board[i].value=0;return {board,shown,dealt,lines,intersections,prize};}
