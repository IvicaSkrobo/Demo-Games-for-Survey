export const SINGLE_CHOICE_IDLE_MS=5000;
// Inactivity is a real delay, independent of animation speed/reduced motion.
export function createPlacementTimer({onExpire,delay=SINGLE_CHOICE_IDLE_MS,setTimer=setTimeout,clearTimer=clearTimeout}){
 let card=null,handle=null,paused=false;
 const clear=()=>{if(handle!==null)clearTimer(handle);handle=null};
 const start=()=>{clear();if(!card||paused)return;const expected=card;handle=setTimer(()=>{handle=null;if(card!==expected||paused)return;card=null;onExpire(expected)},delay)};
 return {
  arm(next){clear();card=next?.suits?.length===1?next:null;start()},
  activity(){if(card)start()},
  pause(){paused=true;clear()},
  resume(){paused=false;start()},
  cancel(){clear();card=null;paused=false}
 };
}
