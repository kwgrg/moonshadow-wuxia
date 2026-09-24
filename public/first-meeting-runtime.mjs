// Authored first-person interaction contract. A menu cannot establish first talk.
import {QUESTS} from './campaign.mjs';
import {applyCompanionEffects} from './travel-party.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const selected=(q,s)=>{const index=s.choices[q.id];return Number.isInteger(index)&&q.choice?.options?.[index]&&q.firstMeeting?.actors.some(a=>a.index===index)?index:null;};
const repair=(q,s,index)=>{const effects=q.choice.options[index].effects||{};Object.assign(s.flags,effects.flags||{});applyCompanionEffects(s.flags,effects);};
export function restoreFirstMeeting(q,s){
 if(!q.firstMeeting||s.completed)return;
 const index=selected(q,s);if(index!==null)repair(q,s,index);
 s.sequence=null;s.phase=s.map===q.map?(index===null?'talk':'after'):'travel';
 if(s.objectiveProgress?.questId===q.id)s.objectiveProgress.phase=index===null?'talk':'after';
}
export const firstMeetingMethods={
 recoverUnknownFirstMeeting(returnId){
  const next=QUESTS.findIndex(q=>q.id==='g23');if(next<0)return false;
  this.s.flags.goodMedicineLegacy=true;this.s.flags.goodMedicineLegacyUnknownFirstMeeting=true;this.s.flags.goodMedicineFirstMeetingReturn=returnId;
  delete this.s.flags.firstWoman;delete this.s.flags.goodFirstZi;delete this.s.flags.goodFirstMei;applyCompanionEffects(this.s.flags,{companions:[]});
  this.s.quest=next;this.s.phase=this.s.map===this.q.map?'talk':'travel';this.s.sequence=null;this.s.objectiveProgress=null;this.s.destination=null;this.s.enemies=[];this.s.allies=[];this.s.skirmish=null;this.s.combatProgress=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.resetParty();this.emit('quest');return true;
 },
 firstMeetingReady(){const q=this.q,index=selected(q,this.s);return index!==null&&Object.entries(q.choice.options[index].effects?.flags||{}).every(([k,v])=>this.s.flags[k]===v);},
 firstMeetingMarkers(){
  const q=this.q;if(!q.firstMeeting||this.s.map!==q.map||this.s.completed||this.s.sequence)return [];
  const index=selected(q,this.s);
  return q.firstMeeting.actors.map(actor=>({...actor,kind:'firstMeeting',main:index===null||actor.index===index,interactive:index===null||actor.index===index}));
 },
 interactFirstMeeting(marker){
  const q=this.q,actor=q.firstMeeting?.actors.find(a=>a.id===marker.id),replay=this.s.flags.goodMedicineLegacyUnknownFirstMeeting===true;
  if(!actor||this.s.map!==q.map||this.s.completed||this.s.sequence||this.s.failure||this.s.skirmish?.failed||this.s.combatProgress?.failed||this.s.hero.hp<=0||!['talk','after'].includes(this.s.phase)||(this.s.done.includes(q.id)&&!replay)||distance(this.s.hero,actor)>135||!this.requireQuestFlags()||!this.requireQuestItems())return false;
  const previous=selected(q,this.s);if(previous!==null&&previous!==actor.index)return false;
  if(previous===null){this.s.choices[q.id]=actor.index;if(replay)repair(q,this.s,actor.index);else this.applyEffects(q.choice.options[actor.index].effects);}
  else repair(q,this.s,actor.index);
  this._partyPositions??={};this._partyPaths??={};if(this.partyNames.includes(actor.name)){this._partyPositions[actor.name]={x:actor.x,y:actor.y};this._partyPaths[actor.name]=[];}
  this.s.phase='after';this.s.destination=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.keys.clear();
  this.emit('firstMeetingCommitted',{questId:q.id,index:actor.index});
  this.emit('firstMeetingDialogue',{questId:q.id,index:actor.index,lines:[...(q.choice.options[actor.index].after||[]),...(q.after||[])]});return true;
 },
 finishFirstMeeting(questId=this.q.id){
  const q=this.q;if(questId!==q.id||!q.firstMeeting||!this.firstMeetingReady()||this.s.map!==q.map||this.s.sequence||this.s.failure||this.s.completed)return false;
  if(this.s.flags.goodMedicineLegacyUnknownFirstMeeting===true){
   const target=this.s.flags.goodMedicineFirstMeetingReturn||'g24',next=QUESTS.findIndex(q=>q.id===target);if(next<0)return false;
   delete this.s.flags.goodMedicineLegacyUnknownFirstMeeting;delete this.s.flags.goodMedicineFirstMeetingReturn;applyCompanionEffects(this.s.flags,{companions:[]});
   this.s.quest=next;this.s.phase=this.s.map===this.q.map?'talk':'travel';this.s.objectiveProgress=null;this.s.destination=null;this.s.enemies=[];this.s.allies=[];this.s.skirmish=null;this.s.combatProgress=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.resetParty();this.emit('quest');return true;
  }
  this._firstMeetingFinishCommit=q.id;try{this.completeQuest();return this.q.id!==q.id||this.s.completed;}finally{this._firstMeetingFinishCommit=null;}
 }
};
