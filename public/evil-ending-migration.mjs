// Explicit compatibility summaries for the independently authored R18 finale.
// These flags preserve witnessed old progress; they never invent new task receipts.
import {applyCompanionEffects} from './travel-party.mjs';
export function repairEvilFinalOutcome(state){
 const value=state.flags.evilFinalOutcome;
 if(value!=='alone'&&value!=='family'){
  delete state.flags.evilFinalOutcome;delete state.flags.evilFinalModel;
  delete state.flags.evilFinalCruel;delete state.flags.evilFinalMercy;return false;
 }
 state.flags.evilFinalModel='web-v1';state.flags.evilFinalCruel=value==='alone';state.flags.evilFinalMercy=value==='family';return true;
}
export function commitEvilFinalOutcome(state){
 if(!repairEvilFinalOutcome(state)){state.flags.evilFinalOutcome=Number(state.flags.evil)>=3?'alone':'family';repairEvilFinalOutcome(state);}
 return state.flags.evilFinalOutcome;
}
export function migrateEvilEnding(raw,state,quests,oldIds,endings={}){
 repairEvilFinalOutcome(state);
 if(state.flags.route!=='evil'||(raw.ending&&Object.hasOwn(endings,raw.ending))||(raw.campaignRevision||1)>=18)return raw;
 const id=raw.questId||oldIds[raw.quest];if(!['e13','e14'].includes(id))return raw;
 const done=name=>state.done.includes(name);
 const resetTo=target=>{
  const next=quests.findIndex(q=>q.id===target);if(next<0)throw Error('Unknown evil ending migration target: '+target);
  state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';
  state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;state.combatProgress=null;state.pursuit=null;state.training=null;state.failure=null;state.collected=0;state.collectedIds=[];
  delete state.flags['staged_'+target];
  raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,combatProgress:null,pursuit:null,training:null,failure:null,collected:0,collectedIds:[]};
 };
 if(id==='e14'||done('e14')){
  state.flags.evilFinalLegacyRescued=true;state.flags.evilFinalLegacyGate=true;state.flags.evilFinalLegacyFourFight=true;
  applyCompanionEffects(state.flags,{companions:[]});
  if(done('e14')){state.flags.evilFinalLegacyBattleWon=true;resetTo('e14_recovery');}
  // Active, lost, and victorious old four-person encounters retain their exact
  // roster, wounds, timers, cooldowns and payment ledger for combat restoration.
  return raw;
 }
 if(done('e13')){state.flags.evilFinalLegacyRescued=true;applyCompanionEffects(state.flags,{companions:[]});resetTo('e14_report');}
 else resetTo('e13');
 return raw;
}

// If a pending new father scene has lost its completed dream evidence, return
// to an explicitly failed dream checkpoint. Preserve all payment receipts.
export function repairEvilDreamCheckpoint(raw,state,quests,maps,getScene){
 if((raw.campaignRevision||1)<18||['alone','family'].includes(raw.ending)||state.flags.route!=='evil'||quests[state.quest]?.id!=='e14_father'||state.dreamCombatOutcomes?.e14_dream)return raw;
 const index=quests.findIndex(q=>q.id==='e14_dream'),q=quests[index];
 state.quest=index;state.map=q.map;state.phase='battle';state.done=state.done.filter(id=>id!=='e14_dream');
 delete state.flags.evilFinalDreamResolved;delete state.flags.staged_e14_father;
 state.sequence=null;state.enemies=[];state.destination=null;state.objectiveProgress=null;
 const spawn=getScene(q.map,maps[q.map]).spawn;Object.assign(state.hero,spawn);
 return {...raw,questId:q.id,quest:index,map:q.map,phase:'battle',sequence:null,destination:null,objectiveProgress:null,enemies:[],combatProgress:{version:1,questId:q.id,activeKey:null,encounters:{},failed:true,failedReason:'incomplete-roster'},hero:{...raw.hero,...spawn}};
}
