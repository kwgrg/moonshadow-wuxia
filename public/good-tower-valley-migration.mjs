// Preserve committed history, without inventing new battles, staging, or rewards.
export function migrateGoodTowerValley(raw,state,quests,oldIds){
 if((raw.campaignRevision||1)>=15||state.flags.route!=='good'||state.flags.cultPath||raw.completed||raw.ending)return raw;
 const id=raw.questId||oldIds[raw.quest],index=oldIds.indexOf(id),at=name=>oldIds.indexOf(name);
 const later=name=>at(name)>=0&&index>at(name);
 const done=name=>state.done.includes(name);
 const eligible=q=>!q.when||(!(q.when.route&&q.when.route!==state.flags.route)&&!(q.when.flag&&!state.flags[q.when.flag])&&!(q.when.not&&state.flags[q.when.not])&&!q.when.notAll?.some(key=>state.flags[key]));
 const newIds=new Set(['g19_departure','g19_return','g19_burial','g20_escort','g20_return1','g20_call2','g20_return2','g20_call3','g20_return3','g20_call4','g20_cry','g20_stay','g20_lastwords','g20_founddead','g20_rose_burial']);
 const resetTo=target=>{
  let next=quests.findIndex(q=>q.id===target);if(next<0)throw new Error('Unknown good-tower-valley migration target');
  while(next<quests.length-1&&(state.done.includes(quests[next].id)||!eligible(quests[next])))next++;
  state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';
  state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;state.pursuit=null;state.training=null;
  for(const key of ['gTower8','g19','g20',...newIds])delete state.flags['staged_'+key];
  const clearFailure=/^gTower[1-8]$/.test(state.failure?.questId||'')||['g19','g20'].includes(state.failure?.questId);
  if(clearFailure)state.failure=null;
  raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,pursuit:null,training:null,...(clearFailure?{failure:null}:{})};
 };
 const roseHistory=()=>{state.flags.goodTowerLegacyAscent=true;state.flags.goodTowerLegacyRoseFreed=true;state.flags.goodTowerLegacyDeparture=true;};
 // Already later than the old night: no replay, new milestones, or grants.
 if(later('g20')){state.flags.goodTowerValleyLegacy=true;return raw;}
 if(id==='g20'||done('g20')){
  roseHistory();const refusals=Math.min(4,Math.max(0,Math.floor(Number(state.flags.refusals)||0)));
  const stayed=state.choices.g20===0&&!state.flags.forsake;
  const refused=state.flags.forsake||refusals>=4;
  if(stayed||refused||refusals>0){
   state.flags.goodTowerLegacyMengBuried=true;state.flags.goodTowerLegacyNight=true;state.flags.companion=null;
   if(stayed){state.flags.goodRoseStayed=true;state.flags.forsake=false;resetTo('g20_stay');return raw;}
   for(let n=1;n<=(refused?4:refusals);n++)state.flags[`goodRoseRefusal${n}`]=true;
   if(refused){state.flags.forsake=true;resetTo('g20_cry');}else resetTo(`g20_return${refusals}`);
   return raw;
  }
  state.flags.companion='蔷薇';resetTo('g19_return');return raw;
 }
 if(later('g19')||done('g19')){roseHistory();state.flags.companion='蔷薇';resetTo('g19_return');return raw;}
 if(id==='g19'){
  state.flags.goodTowerLegacyAscent=true;
  const answer=state.choices.g19;
  if(answer===0||answer===1){
   state.flags.goodTowerLegacyRoseFreed=true;state.flags.goodTowerKissed=answer===0;state.flags.goodTowerNoKiss=answer===1;state.flags.companion='蔷薇';resetTo('g19_departure');
  }else{state.flags.companion=null;resetTo('g19');}
  return raw;
 }
 if(/^gTower[1-8]$/.test(id||'')){
  state.flags.goodTowerLegacyAccess=true;if(done('gTower8'))state.flags.goodTowerLegacyAscent=true;state.flags.companion=null;
  // Completed former three-enemy circles are history, not fresh 252-unit wins.
  resetTo(id);return raw;
 }
 return raw;
}
