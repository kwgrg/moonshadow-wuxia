// Preserve an older compressed chapter as explicit history, not newly played scenes.
export function migrateEvilDocks(raw,state,quests,oldIds,maps,sceneFor){
 if((raw.campaignRevision||1)>=8||state.flags.route!=='evil')return raw;
 const id=quests[state.quest].id,oldIndex=oldIds.indexOf(id),dockIndex=oldIds.indexOf('e08');
 const passed=state.done.includes('e08')||oldIndex>dockIndex;
 if(id!=='e08'&&!passed)return raw;
 state.flags.evilLegacyIslandPassage=true;
 const choice=state.choices.e08,choiceValid=choice===0||choice===1;
 const kill=state.flags.evilZixuanKill===true,refuse=state.flags.evilZixuanRefuse===true;
 const conflict=(kill&&refuse)||(choice===0&&kill)||(choice===1&&refuse),known=choiceValid&&!conflict;
 if(passed||(id==='e08'&&choiceValid&&conflict)){
  if(id==='e08'){state.quest=quests.findIndex(q=>q.id==='e09');state.phase=state.map===quests[state.quest].map?'talk':'travel';raw={...raw,sequence:null,skirmish:null,destination:null,objectiveProgress:null};}
  state.flags.evilLegacyZixuanOutcome=true;state.flags.evilZixuanDead=true;
  if(known){state.flags.evilZixuanDecision=true;state.flags.evilZixuanKill=choice===1;state.flags.evilZixuanRefuse=choice===0;}
  else{state.flags.evilLegacyZixuanUnknown=true;delete state.flags.evilZixuanKill;delete state.flags.evilZixuanRefuse;}
  return raw;
 }
 // The old chapter used a town as its dock placeholder. Preserve the previous
 // position as metadata and resume this still-pending chapter at the new dock.
 // No new island events, visits to intermediary maps or rewards are fabricated.
 state.flags.evilLegacyDockMap=state.map;state.flags.evilLegacyDockX=state.hero.x;state.flags.evilLegacyDockY=state.hero.y;
 state.map='r_mainland_dock';Object.assign(state.hero,sceneFor(state.map,maps[state.map]).spawn);
 if(!state.visited.includes(state.map))state.visited.push(state.map);
 delete state.flags.staged_e08;
 let phase='talk';
 if(known){
  state.flags.evilLegacyDocksPrelude=true;state.flags.evilZixuanDecision=true;
  state.flags.evilZixuanKill=choice===1;state.flags.evilZixuanRefuse=choice===0;
  state.quest=quests.findIndex(q=>q.id===(choice===1?'e08_kill':'e08_refuse'));
 }else if(raw.phase==='choice'||raw.phase==='after'||raw.objectiveProgress?.phase==='choice'){
  state.flags.evilLegacyDocksPrelude=true;phase='choice';
 }else delete state.flags.evilLegacyDocksPrelude;
 state.phase=phase;
 return {...raw,sequence:null,skirmish:null,destination:null,objectiveProgress:null};
}
