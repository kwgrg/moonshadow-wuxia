// Independent compatibility summaries. No newly authored scene is marked played.
import {applyCompanionEffects} from './travel-party.mjs';
export const GOOD_GRIEF_IDS=new Set(['gBad_road','gBad1','gBad1_hut','gBad1_burial','gBad2','gBad2_aftermath','gBad2_departure']);
export function migrateGoodGrief(raw,state,quests,oldIds,endings={}){
 if(state.flags.route!=='good'||state.flags.cultPath||(raw.ending&&Object.hasOwn(endings,raw.ending)))return raw;
 const id=raw.questId||oldIds[raw.quest];
 if(!GOOD_GRIEF_IDS.has(id))return raw;
 state.flags.forsake=true;
 if((raw.campaignRevision||1)>=17)return raw;
 const done=name=>state.done.includes(name);
 const resetTo=target=>{
  const next=quests.findIndex(q=>q.id===target);if(next<0)throw Error('Unknown grief migration target: '+target);
  state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';
  state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;state.combatProgress=null;state.pursuit=null;state.training=null;state.failure=null;state.collected=0;state.collectedIds=[];
  delete state.flags['staged_'+target];
  raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,combatProgress:null,pursuit:null,training:null,failure:null,collected:0,collectedIds:[]};
 };
 if(id==='gBad2'||done('gBad2')){
  state.flags.goodGriefLegacyNews=true;state.flags.goodGriefLegacyRevenge=true;state.flags.goodGriefLegacySingleDuel=true;
  applyCompanionEffects(state.flags,{companions:[]});
  if(done('gBad2')){state.flags.goodGriefLegacyDuel=true;resetTo('gBad2_aftermath');}
  // An unfinished old boss keeps its roster, HP, cooldowns and failure receipt.
  return raw;
 }
 if(id==='gBad1'){
  state.flags.goodGriefLegacyNews=true;
  applyCompanionEffects(state.flags,{companions:[]});
  if(done('gBad1')){state.flags.goodGriefLegacyNews=true;resetTo('gBad1_hut');}
  else resetTo('gBad1');
 }
 return raw;
}
