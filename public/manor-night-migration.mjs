// Compatibility preserves an old compressed night as labelled history.
// It does not manufacture completion records for newly authored scenes.
export function migrateManorNight(raw,state,quests,oldIds,maps,sceneFor){
 if((raw.campaignRevision||1)>=9||state.flags.route!=='evil')return raw;
 const originalId=raw.questId||oldIds[raw.quest],oldIndex=oldIds.indexOf(originalId),nightIndex=oldIds.indexOf('e09');
 const currentId=quests[state.quest].id,passed=state.done.includes('e09')||(oldIndex>nightIndex&&nightIndex>=0);
 const clear=()=>{state.sequence=null;state.skirmish=null;state.allies=[];state.enemies=[];state.destination=null;state.objectiveProgress=null;raw={...raw,sequence:null,skirmish:null,destination:null,objectiveProgress:null};};
 const setQuest=id=>{state.quest=quests.findIndex(q=>q.id===id);if(state.quest<0)throw new Error('Unknown manor migration target');state.phase=state.map===quests[state.quest].map?'talk':'travel';clear();};
 if(originalId!=='e09'&&!passed){if(currentId==='e09')setQuest('e09_report');return raw;}
 const choice=raw.choices?.e09,hasChoice=Object.hasOwn(raw.choices||{},'e09'),choiceValid=choice===0||choice===1;
 const escorted=state.flags.evilMeiEscorted===true,alone=state.flags.evilMeiAlone===true;
 const conflict=(escorted&&alone)||(choice===0&&alone)||(choice===1&&escorted),known=choiceValid&&!conflict;
 const recorded=hasChoice||escorted||alone||state.flags.evilManorDecision===true;
 if(passed||(originalId==='e09'&&((raw.phase==='after'&&!known)||(recorded&&!known)))){
  state.flags.evilLegacyManorNight=true;state.flags.evilMeiStaysAtManor=true;
  if(known){state.flags.evilManorDecision=true;state.flags.evilMeiEscorted=choice===0;state.flags.evilMeiAlone=choice===1;}
  else{state.flags.evilLegacyManorUnknown=true;delete state.flags.evilManorDecision;delete state.flags.evilMeiEscorted;delete state.flags.evilMeiAlone;}
  if(currentId==='e09')setQuest('e10_teaching');
  if(state.quest<quests.findIndex(q=>q.id==='e10')&&state.flags.companion==='月眉儿')state.flags.companion=null;
  return raw;
 }
 if(originalId!=='e09')return raw;
 const pendingChoice=raw.phase==='choice'||raw.objectiveProgress?.phase==='choice';
 if(!known&&!pendingChoice){setQuest('e09_report');return raw;}
 state.flags.evilLegacyManorPrelude=true;state.flags.evilManorNightStarted=true;
 state.flags.evilLegacyManorMap=state.map;state.flags.evilLegacyManorX=state.hero.x;state.flags.evilLegacyManorY=state.hero.y;
 state.map='m50';Object.assign(state.hero,sceneFor(state.map,maps[state.map]).spawn);
 if(!state.visited.includes(state.map))state.visited.push(state.map);
 if(known){state.flags.evilManorDecision=true;state.flags.evilMeiEscorted=choice===0;state.flags.evilMeiAlone=choice===1;state.flags.companion=choice===0?'月眉儿':null;setQuest(choice===0?'e09_room_talk':'e09_part');}
 else{state.phase='choice';state.flags.companion=null;clear();}
 return raw;
}
