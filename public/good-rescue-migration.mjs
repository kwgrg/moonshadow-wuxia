// Retain historical progress without inventing newly played rescue encounters.
export function migrateGoodRescue(raw,state,quests,oldIds){
 if((raw.campaignRevision||1)>=14||state.flags.route!=='good'||state.flags.cultPath||raw.ending==='cult')return raw;
 const id=raw.questId||oldIds[raw.quest],index=oldIds.indexOf(id);
 const at=name=>oldIds.indexOf(name);
 const passed=name=>state.done.includes(name)||(at(name)>=0&&index>at(name));
 const eligible=q=>!q.when||(!(q.when.route&&q.when.route!==state.flags.route)&&!(q.when.flag&&!state.flags[q.when.flag])&&!(q.when.not&&state.flags[q.when.not])&&!q.when.notAll?.some(key=>state.flags[key]));
 const resetTo=target=>{
  let next=quests.findIndex(q=>q.id===target);if(next<0)throw new Error('Unknown good-rescue migration target');
  while(next<quests.length-1&&(state.done.includes(quests[next].id)||!eligible(quests[next])))next++;
  state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';state.sequence=null;state.destination=null;state.objectiveProgress=null;
  state.enemies=[];state.allies=[];state.skirmish=null;state.pursuit=null;state.training=null;
  for(const key of ['g15_escape','g16','g16_homecoming','g17','g17_departure','g17_manor','g18'])delete state.flags['staged_'+key];
  const clearFailure=['g16','g17','g18'].includes(state.failure?.questId);if(clearFailure)state.failure=null;
  raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,pursuit:null,training:null,...(clearFailure?{failure:null}:{})};
 };
 if(passed('g18')){
  state.flags.goodRescueLegacy=true;
  if(['g15','g16','g17','g18'].includes(id)){
   state.flags.companion=null;
   const after=quests[quests.findIndex(q=>q.id==='g18')+1];if(after)resetTo(after.id);
  }
  return raw;
 }
 if(passed('g17')){
  state.flags.goodRescueLegacyZiSettled=true;state.flags.goodRescueLegacyMeiDeparted=true;
  state.flags.companion=null;
  if(['g15','g16','g17','g18'].includes(id))resetTo('g17_manor');
  return raw;
 }
 if(passed('g16')){
  state.flags.goodRescueLegacyZiSettled=true;state.flags.companion=null;
  if(['g15','g16','g17'].includes(id))resetTo('g17');
  return raw;
 }
 if(id==='g16'||(id==='g15'&&state.done.includes('g15'))){
  state.flags.goodRescueLegacyRefused=true;state.flags.companion=null;resetTo('g15_escape');return raw;
 }
 // The old refusal effect may already have been committed before the final
 // dialogue was saved; preserve that history without answering for the player.
 if(id==='g15'&&state.choices.g15===1&&Number(state.flags.refusal_g15)>=3){state.flags.goodRescueLegacyRefused=true;state.flags.companion=null;resetTo('g15_escape');}
 return raw;
}
