// Independently implemented timed retreats. The clock follows this quest across
// its configured corridor; pausing menus/dialogue/loading pauses active play.
import {MAPS} from './campaign.mjs';
import {getScene} from './world.mjs';
import {exitsFor} from './routes.mjs';
import {QUESTS} from './campaign.mjs';
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const near=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const pair=(a,b)=>[a,b].sort().join('|');
const point=(p,map)=>p&&MAPS[p.map||map]&&finite(p.x,0,1600)&&finite(p.y,0,1100)?{map:p.map||map,x:p.x,y:p.y}:null;

export function escapeDefinition(q,mode='current'){
 if(q?.type!=='escape'||!finite(q.duration,.1,3600))return null;
 const legacy=mode==='legacy'&&q.escapeLegacyGoal;
 const source=legacy||q.escapeGoal||{map:q.map,...getScene(q.map,MAPS[q.map]).exit};
 const goal=point(source,q.map);if(!goal)return null;
 if(source.to&&!MAPS[source.to])return null;
 Object.assign(goal,{name:source.name||q.object||'出口',radius:Math.min(135,Math.max(20,Number(source.radius)||135)),...(source.to?{to:source.to}:{})});
 const routes=legacy?[]:(q.escapeRoute||[]).filter(e=>Array.isArray(e)&&e.length===2&&e.every(id=>MAPS[id])).map(e=>[...e]);
 const maps=legacy?[goal.map]:[...new Set([q.map,goal.map,...(q.escapeMaps||[]).filter(id=>MAPS[id]),...routes.flat()].filter(id=>MAPS[id]&&id!==goal.to))];
 const fallback={map:legacy?goal.map:q.map,...getScene(legacy?goal.map:q.map,MAPS[legacy?goal.map:q.map]).spawn};
 const retry=point(legacy?q.escapeLegacyRetry:q.escapeRetry,fallback.map)||fallback;
 if(!maps.includes(retry.map))return null;
 return {questId:q.id,duration:q.duration,goal,maps,routes,retry,mode:legacy?'legacy':'current'};
}
function record(q,rule,remaining=rule.duration,status='active',reason=null,attempt=1){
 return {version:1,questId:q.id,duration:rule.duration,remaining,status,reason,attempt,mode:rule.mode,goalReached:null};
}
function goalReached(raw,rule,map){
 const reached=raw?.goalReached,g=rule.goal;
 return !!reached&&reached.map===g.map&&finite(reached.x,0,1600)&&finite(reached.y,0,1100)&&near(reached,g)<=g.radius&&
  (g.to?reached.to===g.to&&map===g.to:map===g.map);
}
function valid(raw,q,rule,s){
 if(!raw||raw.version!==1||raw.questId!==q.id||raw.duration!==rule.duration||raw.mode!==rule.mode||
  !finite(raw.remaining,0,rule.duration)||!Number.isInteger(raw.attempt)||raw.attempt<1||raw.attempt>999999||
  !['active','failed','completed'].includes(raw.status))return null;
 if(raw.status==='active'&&(raw.remaining<=0||!rule.maps.includes(s.map)))return null;
 if(raw.status==='failed'&&!['timeout','incomplete-progress'].includes(raw.reason))return null;
 if(raw.status==='completed'&&(raw.remaining<=0||!goalReached(raw,rule,s.map)))return null;
 return {...record(q,rule,raw.remaining,raw.status,raw.status==='failed'?raw.reason:null,raw.attempt),
  goalReached:raw.status==='completed'?{map:raw.goalReached.map,x:raw.goalReached.x,y:raw.goalReached.y,...(rule.goal.to?{to:rule.goal.to}:{})}:null};
}
export function restoreEscapeProgress(raw,q,s){
 s.escapeProgress=null;
 if(q?.type!=='escape'||s.done.includes(q.id)||s.completed)return;
 const oldMode=raw.escapeProgress?.mode==='legacy'||(!raw.escapeProgress&&(raw.campaignRevision||1)<20&&q.escapeLegacyGoal?.map===s.map)?'legacy':'current';
 const rule=escapeDefinition(q,oldMode);if(!rule)return;
 const saved=valid(raw.escapeProgress,q,rule,s);
 if(saved)s.escapeProgress=saved;
 else if(raw.escapeProgress||raw.phase==='after'||raw.phase==='failed'||raw.objectiveProgress?.phase==='after')s.escapeProgress=record(q,rule,0,'failed','incomplete-progress');
 else if(raw.phase==='escape'&&finite(raw.timer,0,rule.duration)&&rule.maps.includes(s.map)){
  s.escapeProgress=record(q,rule,raw.timer,raw.timer>0?'active':'failed',raw.timer>0?null:'timeout');
 }else if(raw.phase==='escape')s.escapeProgress=record(q,rule,0,'failed','incomplete-progress');
 else if((q.autoEscape||oldMode==='legacy')&&rule.maps.includes(s.map)&&!s.sequence)s.escapeProgress=record(q,rule);
 if(s.escapeProgress){s.timer=s.escapeProgress.remaining;s.phase=s.escapeProgress.status==='failed'?'failed':s.escapeProgress.status==='completed'?'after':'escape';s.objectiveProgress=null;}
}
export const escapeMethods={
 escapeRule(){return escapeDefinition(this.q,this.s.escapeProgress?.mode);},
 escapeFailed(){return this.s.escapeProgress?.questId===this.q.id&&this.s.escapeProgress.status==='failed';},
 escapeActive(){return this.s.escapeProgress?.questId===this.q.id&&this.s.escapeProgress.status==='active';},
 ensureEscapeProgress(start=false){
  const q=this.q,rule=this.escapeRule();
  if(!rule||this.s.done.includes(q.id)||this.s.completed)return null;
  if(this.s.escapeProgress?.questId===q.id){this.s.timer=this.s.escapeProgress.remaining;return this.s.escapeProgress;}
  if(!(start||q.autoEscape)||!rule.maps.includes(this.s.map)||this.s.sequence||!this.hasQuestItems()||
   q.requiredFlags?.some(k=>!this.s.flags[k])||q.requiredAnyFlags?.some(group=>!group.some(k=>this.s.flags[k]))||
   q.requireStaging&&!this.s.flags['staged_'+q.id]&&!this.s.flags[q.legacyStagingFlag])return null;
  this.s.escapeProgress=record(q,rule);this.s.timer=rule.duration;this.s.phase='escape';this.s.objectiveProgress=null;this.emit('escapeProgress');return this.s.escapeProgress;
 },
 startEscape(){return !!this.ensureEscapeProgress(true)&&this.escapeActive();},
 escapeMarker(){
  const rule=this.escapeRule();if(!this.escapeActive()||this.s.map!==rule?.goal.map)return null;
  return {id:'escape',kind:'escape',...rule.goal,main:true,sprite:null};
 },
 escapeCanTravel(to){
  if(!this.escapeActive())return !this.escapeFailed();
  const rule=this.escapeRule(),from=this.s.map;
  if(to===rule.goal.to&&from===rule.goal.map)return this._escapeGateCommit===this.q.id;
  return rule.maps.includes(from)&&rule.maps.includes(to)&&rule.routes.some(e=>pair(...e)===pair(from,to));
 },
 canCompleteEscape(){
  const p=this.s.escapeProgress,rule=this.escapeRule();
  return !!rule&&p?.questId===this.q.id&&p.status==='completed'&&p.remaining>0&&goalReached(p,rule,this.s.map);
 },
 finishEscape(marker){
  const rule=this.escapeRule(),actual=this.escapeMarker();
  if(!rule||!actual||marker?.id!=='escape'||marker.kind!=='escape'||marker.map!==actual.map||
   marker.x!==actual.x||marker.y!==actual.y||!this.requireQuestItems()||!this.requireQuestFlags()||
   near(this.s.hero,actual)>actual.radius||!this.clearSegment(this.s.hero,actual))return false;
  const reached={map:this.s.map,x:this.s.hero.x,y:this.s.hero.y};
  if(rule.goal.to){
   this._escapeGateCommit=this.q.id;
   try{if(!this.enterMap(rule.goal.to))return false;}finally{this._escapeGateCommit=null;}
   reached.to=rule.goal.to;
  }
  this.s.escapeProgress.status='completed';this.s.escapeProgress.goalReached=reached;this.s.phase='after';
  this.target=null;this.waypoints=[];this.autoInteract=null;this.s.destination=null;this.emit('escapeProgress');this.completeQuest();return true;
 },
 escapeRouteTo(target){
  const rule=this.escapeRule();if(!rule||!rule.maps.includes(target))return [];
  const queue=[[this.s.map]],seen=new Set([this.s.map]);
  while(queue.length){const path=queue.shift(),from=path.at(-1);if(from===target)return path;
   for(const exit of exitsFor(from,this.s,QUESTS))if(!exit.locked&&rule.maps.includes(exit.to)&&!seen.has(exit.to)&&rule.routes.some(e=>pair(...e)===pair(from,exit.to))){seen.add(exit.to);queue.push([...path,exit.to]);}
  }
  return [];
 },
 trackEscape(){
  if(this.escapeFailed()){this.emit('escapeFailure');return false;}
  if(!this.escapeActive())return false;
  const rule=this.escapeRule(),marker=this.escapeMarker();
  if(marker)return this.interact(marker);
  const route=this.routeTo(rule.goal.map);if(route.length<2)return false;
  const exit=this.markers.find(m=>m.kind==='travel'&&m.to===route[1]&&!m.locked);
  return !!exit&&this.interact(exit);
 },
 failEscape(reason='timeout'){
  const p=this.s.escapeProgress;if(!p||p.status!=='active')return false;
  p.status='failed';p.reason=reason;p.remaining=0;p.goalReached=null;this.s.timer=0;this.s.phase='failed';
  this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.s.destination=null;this.meditating=false;this.jump=null;this.keys.clear();this.paused=true;
  this.emit('escapeFailure');return true;
 },
 tickEscape(dt){
  const p=this.s.escapeProgress;if(!this.escapeActive())return;
  const rule=this.escapeRule();if(!rule.maps.includes(this.s.map)){this.failEscape('incomplete-progress');return;}
  const previous=Math.ceil(p.remaining);p.remaining=Math.max(0,p.remaining-dt);this.s.timer=p.remaining;
  if(p.remaining===0){this.failEscape();return;}
  if(Math.ceil(p.remaining)!==previous)this.emit('escapeProgress');
 },
 retryEscape(){
  if(!this.escapeFailed())return false;
  const rule=this.escapeRule(),attempt=this.s.escapeProgress.attempt;
  if(!rule||!this.requireQuestItems()||!this.requireQuestFlags())return false;
  this.s.map=rule.retry.map;if(!this.s.visited.includes(this.s.map))this.s.visited.push(this.s.map);
  this.s.escapeProgress=record(this.q,rule,rule.duration,'active',null,Math.min(999999,attempt+1));this.s.timer=rule.duration;this.s.phase='escape';
  Object.assign(this.s.hero,this.nearestOpen(rule.retry.x,rule.retry.y),{pose:'stand'});
  this.s.destination=null;this.s.objectiveProgress=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.meditating=false;this.keys.clear();this.effects=[];this.paused=false;this.resetParty();this.emit('chapter');return true;
 }
};
