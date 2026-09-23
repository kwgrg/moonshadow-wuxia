// Old compressed care is labelled history, not completion of newly authored scenes.
export function migrateValleyCare(raw,state,quests,oldIds,maps,sceneFor){
 if((raw.campaignRevision||1)>=10||state.flags.route!=='good')return raw;
 const id=raw.questId||oldIds[raw.quest],index=oldIds.indexOf(id),night=oldIds.indexOf('g07');
 const clear=()=>{state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;raw={...raw,sequence:null,destination:null,objectiveProgress:null,skirmish:null};};
 const setQuest=target=>{state.quest=quests.findIndex(q=>q.id===target);if(state.quest<0)throw Error('Unknown valley migration target');state.phase=state.map===quests[state.quest].map?'talk':'travel';clear();};
 const answer=state.choices.g06,known=answer===0||answer===1;
 const branch=()=>{state.flags.valleyCareStarted=true;state.flags.valleyCareRefused=answer===0;state.flags.valleyCareConsidered=answer===1;};
 if(state.done.includes('g07')||(night>=0&&index>night)){state.flags.valleyLegacyCare=true;if(id==='g07')setQuest('g08');return raw;}
 if(id==='g07'||(id==='g06'&&state.done.includes('g06'))){
  state.flags.valleyLegacyCarePrelude=true;
  if(known)branch();else{state.flags.valleyLegacyCareChoiceUnknown=true;delete state.flags.valleyCareRefused;delete state.flags.valleyCareConsidered;}
  state.flags.companion=null;setQuest('g07');return raw;
 }
 if(id!=='g06')return raw;
 state.flags.companion=null;
 if(known){branch();setQuest('g06_confide');return raw;}
 const pending=['choice','after'].includes(raw.phase)||['choice','after'].includes(raw.objectiveProgress?.phase);
 setQuest('g06');
 if(pending){state.flags.valleyLegacyCareProposal=true;if(state.map===quests[state.quest].map)state.phase='choice';else state.objectiveProgress={questId:'g06',phase:'choice',collectedIds:[]};raw={...raw,objectiveProgress:state.objectiveProgress};}
 return raw;
}
