// Historical summary only: migration never grants transmission XP, invents a
// staged scene, or retroactively counts the new manor battle as played.
export function migrateValleyDefense(raw,state,quests,oldIds){
 if((raw.campaignRevision||1)>=12||state.flags.route!=='good')return raw;
 const id=raw.questId||oldIds[raw.quest],oldIndex=oldIds.indexOf(id),teaching=oldIds.indexOf('g14');
 const passed=state.done.includes('g14')||(teaching>=0&&oldIndex>teaching);
 const matches=q=>!q.when||(!(q.when.route&&q.when.route!==state.flags.route)&&!(q.when.flag&&!state.flags[q.when.flag])&&!(q.when.not&&state.flags[q.when.not])&&!q.when.notAll?.some(key=>state.flags[key]));
 const resetTo=target=>{
  let cursor=quests.findIndex(q=>q.id===target);if(cursor<0)throw new Error('Unknown valley defense migration target');
  while(cursor<quests.length-1&&(state.done.includes(quests[cursor].id)||!matches(quests[cursor])))cursor++;
  state.quest=cursor;state.phase=state.map===quests[cursor].map?'talk':'travel';
  state.sequence=null;state.destination=null;state.objectiveProgress=null;state.enemies=[];state.allies=[];state.skirmish=null;state.pursuit=null;state.training=null;
  raw={...raw,sequence:null,destination:null,objectiveProgress:null,enemies:[],allies:[],skirmish:null,pursuit:null,training:null};
 };
 if(passed){state.flags.valleyDefenseLegacy=true;if(id==='g14')resetTo('g15');return raw;}
 if(id==='g14')resetTo('g14_dock_report');
 return raw;
}
