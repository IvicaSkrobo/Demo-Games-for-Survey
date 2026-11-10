export const STUDY_CHANNEL='superbet.study.v1';
export const STUDY_BUILD='collector-21-2026-11-10-redesign';
export const STUDY_VARIANTS=[{slotIndex:1,id:'collector21',label:'Collector 21'},{slotIndex:2,id:'suits',label:'Suit Society'}];
const enabled=typeof document!=='undefined'&&document.body.dataset.study==='true';
let context=null,origin=null,started=!enabled,sequence=0,outbox=[],rounds=0,completed=false,options={},retryTimer=null,storageKey=null;
export function canPlayStudy(){return !enabled||started}
export function inStudy(){return enabled}
export function studyPayload(ctx,eventName,number,metadata={},id=globalThis.crypto.randomUUID()){
 return {sessionId:ctx.sessionId,attemptId:ctx.attemptId,studyId:ctx.studyId,participantToken:ctx.participantToken,currentVersionId:ctx.version.id,currentVersionLabel:ctx.version.label,gameId:'gamio-card-lab',buildId:STUDY_BUILD,integrationMode:'web_embed',eventId:id,sequenceNumber:number,eventName,occurredAt:new Date().toISOString(),metadata:{...metadata,currentRoundIndex:ctx.currentRoundIndex??0,variantSlotIndex:ctx.variantSlotIndex??1,versionLabel:ctx.version.label}};
}
function post(messageType,payload){if(window.parent===window||!origin)return;window.parent.postMessage({channel:STUDY_CHANNEL,messageType,messageId:crypto.randomUUID(),gameId:'gamio-card-lab',buildId:STUDY_BUILD,sessionId:context?.sessionId,payload},origin)}
function persist(){if(!storageKey)return;try{localStorage.setItem(storageKey,JSON.stringify({sequence,outbox,rounds,completed}))}catch{}}
function flush(){if(!context||!origin)return;const now=Date.now();for(const item of outbox){if(item.nextAt>now)continue;post('study_event',item.event);item.tries++;item.nextAt=now+Math.min(30000,1000*2**Math.min(item.tries,5));}persist()}
export function studyTrack(eventName,metadata={}){if(!enabled||!context)return;const event=studyPayload(context,eventName,++sequence,metadata);outbox.push({event,tries:0,nextAt:0});persist();flush()}
export function studyRound(metadata={}){if(!enabled||!context||!started)return;rounds++;const replay=completed;studyTrack('round_completed',{...metadata,resolvedCount:rounds,countsTowardStudyCompletion:!replay,progressionPhase:replay?'replay':'required'});if(!completed&&rounds>=10){completed=true;studyTrack('version_completed',{resolvedCount:rounds,completionThreshold:10});const plan=context.variantPlan||[];if((context.currentRoundIndex??0)>=Math.max(0,plan.length-1)){for(const name of ['all_versions_completed','session_completed','study_completed'])studyTrack(name,{resolvedCount:rounds})}post('study_framing',{framingState:'completion',roundIndex:context.currentRoundIndex??0,totalRounds:plan.length||1,currentVersionId:context.version.id});persist();}}
function gate(show){document.body.classList.toggle('study-paused',show);const el=document.getElementById('study-gate');if(el)el.hidden=!show;const cabinet=document.getElementById('cabinet');if(cabinet)cabinet.inert=show;}
function applyContext(payload){const slot=Number(payload.variantSlotIndex)||1,version=STUDY_VARIANTS.find(v=>v.slotIndex===slot);if(!version){gate(true);return false}context={...payload,version:{...version,id:payload.variantId||version.id,label:payload.variantLabel||version.label},variantSlotIndex:slot};storageKey=`collector-study:${context.attemptId}:${context.currentRoundIndex??0}:${slot}`;sequence=0;outbox=[];rounds=0;completed=false;try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&Array.isArray(saved.outbox)){sequence=Number(saved.sequence)||0;outbox=saved.outbox;rounds=Number(saved.rounds)||0;completed=!!saved.completed}}catch{}options.onVariant?.(version.id);return true;}
export function initStudyBridge(config={}){
 if(!enabled)return;options=config;document.body.classList.add('study-mode');gate(true);
 try{origin=new URL(document.referrer).origin}catch{const allowed=new URLSearchParams(location.search).get('hostOrigin');try{const url=new URL(allowed);if(['https:','http:'].includes(url.protocol))origin=url.origin}catch{}}
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||!origin||event.origin!==origin||event.data?.channel!==STUDY_CHANNEL)return;
  const {messageType,payload={}}=event.data;
  if(messageType==='host_handshake_ack'){
   if(!payload.attemptId||!payload.sessionId||!payload.studyId)return;
   if(context?.sessionId===payload.sessionId&&context.variantSlotIndex===(Number(payload.variantSlotIndex)||1)&&context.currentRoundIndex===(payload.currentRoundIndex??0))return;
   started=false;gate(true);if(!applyContext({...payload,currentRoundIndex:payload.currentRoundIndex??0}))return;
   if(!sequence){studyTrack('session_started');studyTrack('variant_order_assigned',{variantPlan:payload.variantPlan||[]});studyTrack('version_started')}
   post('study_framing',{framingState:'intro',roundIndex:context.currentRoundIndex,totalRounds:payload.variantPlan?.length||1,currentVersionId:context.version.id});flush();return;
  }
  if(messageType==='study_event_ack'&&context&&event.data.sessionId===context.sessionId){outbox=outbox.filter(item=>item.event.eventId!==payload.eventId);persist();return;}
  if(messageType!=='host_control'||!context||(event.data.sessionId&&event.data.sessionId!==context.sessionId))return;
  if(payload.action==='set_muted'){options.onMuted?.(!!payload.muted);return;}
  if(payload.action==='advance_round'){
   started=false;gate(true);if(!applyContext({...context,...payload,currentRoundIndex:payload.nextRoundIndex??context.currentRoundIndex+1}))return;studyTrack('version_started');return;
  }
  if(['start_game','set_gameplay'].includes(payload.action)){started=true;gate(false);post('study_framing',{framingState:'gameplay',roundIndex:context.currentRoundIndex,totalRounds:context.variantPlan?.length||1,currentVersionId:context.version.id});}
 });
 const handshake=()=>{if(context||!origin)return;post('host_handshake_request',{integrationMode:'web_embed'})};handshake();retryTimer=setInterval(()=>{handshake();flush()},1000);window.addEventListener('online',flush);window.addEventListener('pagehide',persist);
}
