// Preserve the old recruitment checkpoint as explicit history, without claiming
// that the newly authored return, quarrel, overnight and message were played.
export function migrateHutReturn(raw,state,quests,oldIds){
 if((raw.campaignRevision||1)>=12||state.flags.route!=='evil')return raw;
 const originalId=raw.questId||oldIds[raw.quest],originalIndex=oldIds.indexOf(originalId),offerIndex=oldIds.indexOf('e05');
 const currentId=quests[state.quest]?.id;
 const clear=()=>{
  state.sequence=null;state.enemies=[];state.allies=[];state.skirmish=null;state.destination=null;state.objectiveProgress=null;
  if(state.failure?.questId==='e05')state.failure=null;
  raw={...raw,sequence:null,enemies:[],allies:[],skirmish:null,destination:null,objectiveProgress:null,
   ...(raw.failure?.questId==='e05'?{failure:null}:{})};
 };
 const go=id=>{const next=quests.findIndex(q=>q.id===id);if(next<0)throw new Error('Unknown hut-return migration target');state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';clear();};
 const completed=state.done.includes('e05'),passed=completed||(offerIndex>=0&&originalIndex>offerIndex);
 if(passed){
  state.flags.evilLegacyHutReport=true;
  if(currentId==='e05')go('e06');
  return raw;
 }
 // An earlier migration can move old e04 history to e05. That is still before
 // recruitment; its old after-phase must not become evidence of this message.
 if(originalId!=='e05'){
  if(currentId==='e05')go('e04_homecoming');
  return raw;
 }
 const checkpoint=raw.objectiveProgress?.questId==='e05'?raw.objectiveProgress:null;
 const phase=raw.phase==='travel'?checkpoint?.phase:raw.phase;
 const answer=state.choices.e05,knownAnswer=answer===0||answer===1;
 const count=Number(state.flags.refusal_e05),hasRefusal=Number.isFinite(count)&&count>0;
 const claimed=state.claimedRewards.includes('e05');
 const entered=['battle','choice','failed','after'].includes(phase)||knownAnswer||hasRefusal||claimed;
 if(!entered){go('e04_homecoming');return raw;}
 state.flags.evilLegacyHutReport=true;
 // A saved response/count proves that the forced defeat was already passed.
 // Resume the reply without applying its effects or changing its refusal count.
 // A real terminal failure is restored by the existing recruitment subsystem.
 const fatal=raw.failure?.kind==='refusal'&&raw.failure.questId==='e05';
 const reply=phase==='after'||phase==='choice'||((knownAnswer||hasRefusal||claimed)&&phase!=='battle');
 if(reply&&!fatal){
  state.phase=state.map===quests[state.quest].map?'choice':'travel';
  raw={...raw,phase:state.phase,sequence:null,
   objectiveProgress:state.map===quests[state.quest].map?null:{questId:'e05',phase:'choice',collectedIds:[]}};
  state.sequence=null;state.objectiveProgress=raw.objectiveProgress;
 }
 return raw;
}
