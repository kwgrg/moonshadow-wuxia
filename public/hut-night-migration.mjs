// Label compressed legacy history; never invent a dream choice or new rewards.
export function migrateHutNight(raw,state,quests,oldIds){
 if((raw.campaignRevision||1)>=11||state.flags.route!=='evil')return raw;
 const originalId=raw.questId||oldIds[raw.quest],oldIndex=oldIds.indexOf(originalId),hutIndex=oldIds.indexOf('e04'),restIndex=oldIds.indexOf('e06_rest');
 const clear=()=>{state.sequence=null;state.enemies=[];state.allies=[];state.skirmish=null;state.destination=null;state.objectiveProgress=null;raw={...raw,sequence:null,skirmish:null,destination:null,objectiveProgress:null};};
 const go=id=>{state.quest=quests.findIndex(q=>q.id===id);if(state.quest<0)throw Error('Unknown hut migration target');state.phase=state.map===quests[state.quest].map?'talk':'travel';clear();};
 const answer=state.choices.e04,known=answer===0||answer===1;
 if(state.done.includes('e04')||(hutIndex>=0&&oldIndex>hutIndex)){state.flags.evilLegacyHutNight=true;if(originalId==='e04')go('e05');}
 else if(originalId==='e04'&&known){state.flags.evilHutDecision=true;state.flags.evilHutForgiven=answer===0;state.flags.evilHutRefused=answer===1;go('e04_departure');}
 else if(originalId==='e04'&&(raw.phase==='after'||raw.objectiveProgress?.phase==='after')){state.flags.evilLegacyHutNight=true;state.flags.evilLegacyHutUnknown=true;go('e05');}
 if(state.done.includes('e06_rest')||(restIndex>=0&&oldIndex>restIndex)){state.flags.evilLegacyFirstTowerInterlude=true;if(originalId==='e06_rest')go('e07_village');}
 else if(originalId==='e06_rest'){delete state.flags.staged_e06_rest;go('e06_first_interlude');}
 return raw;
}
