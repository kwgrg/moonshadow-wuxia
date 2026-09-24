// Independent save repair: historical answers own static branches, never rewards.
import {applyCompanionEffects} from './travel-party.mjs';
export function repairMedicineBranch(state,currentId){
 if(state.flags.route!=='good'||state.flags.cultPath)return null;
 const bad=['gBad1','gBad2'].includes(currentId)||['gBad1','gBad2'].some(id=>state.done.includes(id))||state.flags.goodRoseDead||state.flags.goodRoseBuried;
 if(bad)state.flags.forsake=true;
 const answer=state.choices.g23;
 const first=answer===0?'zi':answer===1?'mei':['zi','mei'].includes(state.flags.firstWoman)?state.flags.firstWoman:null;
 if(first){state.flags.firstWoman=first;state.flags.goodFirstZi=first==='zi';state.flags.goodFirstMei=first==='mei';}
 return state.flags.forsake?'forsake':first;
}
export function migrateGoodMedicineReunion(raw,state,quests,oldIds){
 if(state.flags.route!=='good'||state.flags.cultPath||raw.completed||raw.ending)return raw;
 const id=raw.questId||oldIds[raw.quest],done=name=>state.done.includes(name);
 // A stale route flag must not turn an unrelated chapter into this care chain.
 if(!/^(?:g2[1-4](?:_|$)|gBad[12]$)/.test(id||''))return raw;
 if(['gBad1','gBad2'].includes(id))state.flags.forsake=true;
 const branch=repairMedicineBranch(state);
 if((raw.campaignRevision||1)<16&&(['gBad1','gBad2'].includes(id)||['gBad1','gBad2'].some(done)))state.flags.goodTowerValleyLegacy=true;
 if((raw.campaignRevision||1)>=16||state.flags.forsake)return raw;
 const at=name=>oldIds.indexOf(name),index=at(id),later=name=>at(name)>=0&&index>at(name);
 const resetTo=target=>{
  const next=quests.findIndex(q=>q.id===target);if(next<0)throw Error('Unknown medicine migration target: '+target);
  state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';
  state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;state.combatProgress=null;state.pursuit=null;state.training=null;state.failure=null;
  delete state.flags['staged_'+target];
  raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,combatProgress:null,pursuit:null,training:null,failure:null};
 };
 const unknownFirst=(returnId='g24')=>{
  state.flags.goodMedicineLegacy=true;state.flags.goodMedicineLegacyUnknownFirstMeeting=true;state.flags.goodMedicineFirstMeetingReturn=returnId;
  delete state.flags.firstWoman;delete state.flags.goodFirstZi;delete state.flags.goodFirstMei;
  applyCompanionEffects(state.flags,{companions:[]});resetTo('g23');
 };
 if(id==='g24'||later('g23')||done('g23')){
  state.flags.goodMedicineLegacy=true;if(done('g24'))state.flags.goodMedicineLegacyFinalDuel=true;
  if(!branch){unknownFirst(done('g24')&&quests.some(q=>q.id==='g24_aftermath')?'g24_aftermath':'g24');return raw;}
  applyCompanionEffects(state.flags,{companions:[]});
  if(id!=='g24'||done('g24'))resetTo(done('g24')&&quests.some(q=>q.id==='g24_aftermath')?'g24_aftermath':'g24');
  return raw;
 }
 if(id==='g23'||later('g22')||(done('g22')&&id!=='g22')){
  state.flags.goodMedicineLegacy=true;
  // Only the selected person follows during pending first conversation.
  applyCompanionEffects(state.flags,{companions:branch?[branch==='zi'?'紫轩':'月眉儿']:[]});
  resetTo('g23');return raw;
 }
 if(id==='g22'){
  state.flags.goodMedicineLegacy=true;
  if([0,1].includes(state.choices.g22)){
   state.flags.goodMedicineUnderstood=state.choices.g22===0;state.flags.goodMedicineNightTalk=true;
   applyCompanionEffects(state.flags,{companions:['纳兰真']});resetTo('g22_rest');
  }else{
   if(state.claimedRewards.includes('g22')||done('g22'))state.flags.goodMedicineLegacyG22ChoicePaid=true;
   state.flags.goodMedicineExamined=true;state.flags.goodMedicineLegacyExamined=true;
   applyCompanionEffects(state.flags,{companions:['蔷薇']});resetTo('g21_return');
  }
  return raw;
 }
 if(id==='g21'&&done('g21')){
  state.flags.goodMedicineExamined=true;state.flags.goodMedicineLegacyExamined=true;
  applyCompanionEffects(state.flags,{companions:['蔷薇']});resetTo('g21_return');return raw;
 }
 if(id==='g21'){
  applyCompanionEffects(state.flags,{companions:['蔷薇']});resetTo('g21');
 }
 return raw;
}
