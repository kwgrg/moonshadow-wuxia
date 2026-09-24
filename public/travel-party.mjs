// Authored companion movement uses the same collision graph as the player.
const companionCast=new Set(['紫轩','月眉儿','纳兰真','蔷薇']);
export const normalizeCompanions=value=>Array.isArray(value)?[...new Set(value.filter(name=>companionCast.has(name)))].slice(0,4):[];
export function applyCompanionEffects(flags,effects){
 if(Array.isArray(effects.companions)){flags.companions=normalizeCompanions(effects.companions);flags.companion=flags.companions[0]||null;}
 else if(effects.companion!==undefined){flags.companion=effects.companion;flags.companions=effects.companion?[effects.companion]:[];}
}
export const partyMethods={
 travelPartyNames(){
  if(this.s.completed)return [];
  const stored=normalizeCompanions(this.s.flags.companions),primary=this.s.flags.companion;
  const names=stored.length&&primary===stored[0]?stored:primary?[primary]:[];
  if(this.s.flags.route==='good'&&this.s.flags.valleyMeiAwake&&!this.s.flags.valleyCareSettled&&['g07_mainland','g07_island','g07_settle'].includes(this.q.id))names.push('月眉儿');
  if(this.s.flags.route==='good'&&this.s.flags.goodForbiddenReunited&&!this.s.flags.goodForbiddenCaptured&&['g13','g13_captured'].includes(this.q.id))names.splice(0,names.length,'蔷薇','纳兰真','月眉儿');
  if(this.q.rescueMission&&this.s.flags['staged_'+this.q.id]&&this.s.skirmish?.questId===this.q.id)names.splice(0,names.length,this.q.rescueMission.companion);
  return [...new Set(names)].filter(name=>name!==this.q.playAs);
 },
 resetParty(){this._partyPositions={};this._partyPaths={};this._partyTime=0;this.followPosition={...this.s.hero};},
 travelCompanions(){
  if(this.scene.hidePlayer||this.q.hideCompanion)return [];
  const actors=this.stagingPresentation()?.actors||[],mainName=this.s.phase==='choice'?(this.q.choiceSpeaker||this.q.npc):this.q.npc;
  return this.partyNames.filter(name=>{
   if(this.q.firstMeeting&&this.s.map===this.q.map&&this.q.firstMeeting.actors.some(actor=>actor.name===name))return false;
   if(this.s.skirmish&&(this.s.allies||[]).some(ally=>ally.name===name))return false;
   if(!this.q.rescueMission&&this.s.map===this.q.map&&['talk','after','choice','return'].includes(this.s.phase)&&!this.canStartStaging()&&mainName===name)return false;
   return !actors.some(actor=>actor.name===name&&(this.s.sequence||!actor.hidden)&&!(actor.residentUntilQuest&&this.hasReachedQuest(actor.residentUntilQuest)));
  }).map(name=>({...(this._partyPositions?.[name]||{x:this.s.hero.x,y:this.s.hero.y}),name,sprite:['紫轩','月眉儿'].includes(name)?2:1,direction:this.s.hero.direction}));
 },
 stepParty(dt){
  this._partyPositions??={};this._partyPaths??={};this._partyTime=(this._partyTime||0)-dt;
  const names=this.partyNames;
  for(const name of Object.keys(this._partyPositions))if(!names.includes(name)){delete this._partyPositions[name];delete this._partyPaths[name];}
  for(const [index,name] of names.entries()){
   const h=this.s.hero,offset=[[-65,35],[65,35],[-110,-45]][index%3],goal=this.nearestOpen(h.x+offset[0],h.y+offset[1]);
   let position=this._partyPositions[name];
   if(!position){position=this._partyPositions[name]={x:h.x,y:h.y};this._partyPaths[name]=[];}
   let path=this._partyPaths[name]||[];
   if(this._partyTime<=0||!path.length){path=this.findPath(goal.x,goal.y,position);this._partyPaths[name]=path;}
   while(path.length&&Math.hypot(path[0].x-position.x,path[0].y-position.y)<4)path.shift();
   if(path.length){const target=path[0],dx=target.x-position.x,dy=target.y-position.y,length=Math.hypot(dx,dy),step=Math.min(length,220*dt),next={x:position.x+dx/length*step,y:position.y+dy/length*step};if(this.clearSegment(position,next))Object.assign(position,next);else this._partyPaths[name]=[];}
  }
  if(this._partyTime<=0)this._partyTime=.4;
  this.followPosition=this._partyPositions[names[0]]||{...this.s.hero};
 },
};
