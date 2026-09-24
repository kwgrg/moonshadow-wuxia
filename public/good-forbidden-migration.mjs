// Compatibility for the former one-battle g13 summary. Historical flags are
// explicit exceptions, never evidence of playing the newly authored sequence.
export function migrateGoodForbidden(raw,state,quests,oldIds){
  if((raw.campaignRevision||1)>=13||state.flags.route!=='good')return raw;
  const originalId=raw.questId||oldIds[raw.quest];
  const index=oldIds.indexOf(originalId),battleIndex=oldIds.indexOf('g13');
  const currentId=quests[state.quest]?.id;
  const resetTo=id=>{
    let next=quests.findIndex(q=>q.id===id);
    if(next<0)throw new Error('Unknown good-forbidden migration target');
    const eligible=q=>!q.when||(!(q.when.route&&q.when.route!==state.flags.route)&&!(q.when.flag&&!state.flags[q.when.flag])&&!(q.when.not&&state.flags[q.when.not])&&!q.when.notAll?.some(key=>state.flags[key]));
    while(next<quests.length-1&&(state.done.includes(quests[next].id)||!eligible(quests[next])))next++;
    state.quest=next;state.phase=state.map===quests[next].map?'talk':'travel';
    state.sequence=null;state.destination=null;state.objectiveProgress=null;
    state.enemies=[];state.allies=[];state.skirmish=null;state.pursuit=null;state.training=null;
    if(['g12','g13'].includes(state.failure?.questId))state.failure=null;
    raw={...raw,phase:state.phase,sequence:null,destination:null,objectiveProgress:null,
      enemies:[],allies:[],skirmish:null,pursuit:null,training:null,
      ...(['g12','g13'].includes(raw.failure?.questId)?{failure:null}:{})};
  };
  const passed=state.done.includes('g13')||(battleIndex>=0&&index>battleIndex);
  if(passed){
    state.flags.goodForbiddenLegacy=true;
    if(['g12','g13'].includes(currentId))resetTo('g14_dock_report');
    return raw;
  }
  // An old pending g13 already passed the testimony, but did not play the new
  // empty-hut search, 36-unit battle, reunion, 53-unit ambush or departure.
  if(originalId==='g13'||(originalId==='g12'&&state.done.includes('g12'))){
    state.flags.goodForbiddenLegacyTestimony=true;
    state.flags.companion='蔷薇';
    resetTo('g13_hut');return raw;
  }
  if(originalId==='g12'){
    // An already-claimed old reward is not paid again after the new staging.
    // Restore its chapter companion here so a stale Zi follower cannot persist.
    if(state.claimedRewards.includes('g12'))state.flags.companion='蔷薇';
    delete state.flags.staged_g12;
    resetTo('g12');
  }
  return raw;
}
