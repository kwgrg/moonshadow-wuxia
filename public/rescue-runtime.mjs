// Independently authored rescue interaction. Combat can continue after release;
// only reaching the real return portal commits the quest and its one-time award.
const range=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
export const rescueMethods={
 rescueRosterValid(){
  if(!this.q.rescueMission||this.s.skirmish?.questId!==this.q.id)return false;
  return ['enemies','allies'].every(side=>{const units=this.s[side],entries=this.q.skirmish[side];return Array.isArray(units)&&units.length===entries.length&&new Set(units.map(u=>u?.id)).size===entries.length&&entries.every(e=>units.some(u=>u?.id===e.id&&Number.isFinite(u.hp)&&u.hp>=0&&Number.isFinite(u.x)&&Number.isFinite(u.y)));});
 },
 rescueReady(){return !!this.q.rescueMission&&this.s.map===this.q.map&&this.s.hero.hp>0&&!this.s.skirmish?.failed&&this.rescueRosterValid()&&!!this.s.flags['staged_'+this.q.id]&&!this.s.sequence;},
 canStartRescueStaging(){return !!this.q.rescueMission&&this.s.map===this.q.map&&['battle','after'].includes(this.s.phase)&&this.s.hero.hp>0&&!this.s.skirmish?.failed&&!this.s.flags['staged_'+this.q.id]&&!!this.stagingDefinition()&&this.rescueRosterValid();},
 rescueMarker(){
  if(!this.canStartRescueStaging())return null;
  const p=this.stagingDefinition().startPoint||this.scene.objective;
  return {id:'rescue-person',kind:'rescue',x:p.x,y:p.y,name:'救出'+this.q.rescueMission.companion,main:true,sprite:null};
 },
 ensureRescueEncounter(){
  if(!this.q.rescueMission||this.s.map!==this.q.map||this.s.phase!=='talk'||this.s.sequence||this.s.skirmish||this.s.completed)return false;
  if(!this.requireQuestFlags()||!this.requireQuestItems())return false;
  // A release flag without the encounter is insufficient to resume an escort.
  delete this.s.flags['staged_'+this.q.id];this.resetParty();
  return this.startSkirmish();
 },
 resumeRescueCombat(){
  this.s.phase=this.s.skirmish?.finished?'after':'battle';this.walkTime=0;this._routeCache=null;this.resetParty();this.emit('objective');
 },
 trackRescue(){
  if(this.rescueReady())return this.travel(this.q.rescueMission.exitMap);
  this.ensureRescueEncounter();const marker=this.rescueMarker();return marker?this.interact(marker):false;
 },
 finishRescueAtExit(id){
  if(!this.rescueReady()||id!==this.q.rescueMission.exitMap)return false;
  const qid=this.q.id,portal=this.scene.portals?.[id];
  if(!portal||range(this.s.hero,portal.exit)>135||!this.exits().some(e=>e.to===id&&!e.locked))return false;
  this._rescueExitCommit=qid;
  try{this.completeQuest();return this.q.id!==qid&&this.s.done.includes(qid);}finally{this._rescueExitCommit=null;}
 },
 resetRescueAttempt(){
  if(!this.q.rescueMission)return;
  delete this.s.flags['staged_'+this.q.id];this.s.sequence=null;this._stagingPrompt=null;this._stagingMove=null;this._routeCache=null;this.resetParty();
 },
};
