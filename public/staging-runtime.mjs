import {getScene,getStagingScene} from './world.mjs';
import {MAPS} from './campaign.mjs';
import {STAGED_QUESTS} from './staging.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
const near=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const completeKey=id=>'staged_'+id;
const poses=new Set(['kneel','stand','ill','sit','fallen','attack']);
const bound=(value,min,max,fallback)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
export function restoreStagedHandovers(raw,quests){
 const ledger={};
 for(const quest of quests){
  const steps=STAGED_QUESTS[quest.id]?.steps||[],allowed={};
  for(const step of steps)if(step.type==='handover')for(const [id,count] of Object.entries(step.items||{}))allowed[id]=Math.max(allowed[id]||0,Math.min(count,quest.consumeItems?.[id]||0));
  for(const [id,count] of Object.entries(allowed))if(raw?.[quest.id]?.[id]===count)(ledger[quest.id]??={})[id]=count;
 }
 return ledger;
}
const stepMatches=(step,state)=>{const w=step.when;return !w||(!(w.route&&(state.flags.route||'good')!==w.route)&&!(w.flag&&!state.flags[w.flag])&&!(w.not&&state.flags[w.not])&&!w.notAll?.some(key=>state.flags[key]));};
function restoreCues(raw,definition,state,index){
 const cues={};
 for(const step of definition.steps.slice(0,index))if(stepMatches(step,state)&&step.type==='cue'&&raw?.[step.key]===step.value)cues[step.key]=step.value;
 return cues;
}
export function hasStagingBranch(quest,state){if(!quest.exclusiveFlags)return true;const count=quest.exclusiveFlags.filter(key=>state.flags[key]).length;return count===1||(count===0&&state.flags[quest.exclusiveLegacyFlag]===true);}
export function restoreStaging(raw,quest,state){
 const definition=STAGED_QUESTS[quest.id];
 if(!definition||!stepMatches(quest,state)||state.map!==quest.map||state.flags[completeKey(quest.id)]||state.flags[quest.legacyStagingFlag]||quest.requiredFlags?.some(key=>!state.flags[key])||quest.requiredAnyFlags?.some(group=>!group.some(key=>state.flags[key])))return null;
 if(!hasStagingBranch(quest,state))return null;
 if(!raw||raw.questId!==quest.id||!Number.isInteger(raw.step)||raw.step<0||raw.step>=definition.steps.length)return null;
 const lastScene=definition.steps.slice(0,raw.step).filter(step=>step.type==='scene'&&stepMatches(step,state)).at(-1);
 const sceneKey=lastScene?.scene??null;
 if((raw.sceneKey??null)!==sceneKey||(sceneKey&&(!definition.sceneKeys?.includes(sceneKey)||!getStagingScene(sceneKey))))return null;
 const actors=(definition.actors||[]).map(base=>{const saved=Array.isArray(raw.actors)?raw.actors.find(actor=>actor.id===base.id):null;return {...base,x:bound(saved?.x,120,1460,base.x),y:bound(saved?.y,180,950,base.y),direction:saved?.direction===-1?-1:saved?.direction===1?1:(base.direction||1),pose:poses.has(saved?.pose)?saved.pose:(base.pose||'stand'),hidden:Object.hasOwn(base,'sceneKey')&&base.sceneKey!==sceneKey?true:typeof saved?.hidden==='boolean'?saved.hidden:base.hidden===true};});
 const unpaid=definition.steps.findIndex((step,index)=>index<raw.step&&step.type==='handover'&&Object.entries(step.items).some(([id,count])=>(state.stagedHandovers[quest.id]?.[id]||0)<count));
 const step=unpaid<0?raw.step:unpaid;
 const origin=raw.origin?.map===state.map&&Number.isFinite(raw.origin.x)&&Number.isFinite(raw.origin.y)?{map:state.map,x:raw.origin.x,y:raw.origin.y,direction:raw.origin.direction===-1?-1:1}:null;
 const needsOrigin=sceneKey&&(definition.returnToOrigin||definition.steps.some(step=>step.type==='scene'&&step.hero?.restore));
 if(needsOrigin){if(!origin)return null;const real=getScene(state.map,MAPS[state.map]),[left,top,right,bottom]=real.bounds;if(origin.x<left||origin.x>right||origin.y<top||origin.y>bottom||real.obstacles.some(r=>origin.x>r[0]-8&&origin.x<r[2]+8&&origin.y>r[1]-8&&origin.y<r[3]+8))return null;}
 return {questId:quest.id,step,sceneKey,origin,cues:restoreCues(raw.cues,definition,state,step),handoverItems:{...state.stagedHandovers[quest.id]},elapsed:Math.min(30,Math.max(0,Number(raw.elapsed)||0)),actors,heroPose:['kneel','sit'].includes(raw.heroPose)?raw.heroPose:'stand',focus:typeof raw.focus==='string'?raw.focus:'hero'};
}
export const stagingMethods={
 stagingDefinition(){return this.s.map===this.q.map?STAGED_QUESTS[this.q.id]:null;},
 stagingActor(id){return id==='hero'?this.s.hero:this.s.sequence?.actors.find(actor=>actor.id===id);},
 stagingPresentation(){
  const current=this.stagingDefinition();
  if(current)return {definition:current,actors:this.s.sequence?.actors||((this.s.flags[completeKey(this.q.id)]||this.s.flags[this.q.legacyStagingFlag])?current.finalActors:null)||current.actors||[],cues:this.s.sequence?.cues||((this.s.flags[completeKey(this.q.id)]||this.s.flags[this.q.legacyStagingFlag])?current.finalCues:{})||{}};
  for(const [id,definition] of Object.entries(STAGED_QUESTS).reverse())if(this.s.map===definition.map&&(this.s.flags[completeKey(id)]||(definition.legacyPersistFlag&&this.s.flags[definition.legacyPersistFlag]))&&(definition.persistFor?.includes(this.q.id)||(definition.persistFlag&&this.s.flags[definition.persistFlag])))return {definition,actors:definition.persistentActors||definition.finalActors||definition.actors||[],cues:definition.finalCues||{}};
  return null;
 },
 stagingActors(){const presentation=this.stagingPresentation();if(!presentation)return [];return presentation.actors.filter(actor=>stepMatches(actor,this.s)&&(!Object.hasOwn(actor,'sceneKey')||actor.sceneKey===(this.s.sequence?.sceneKey??null))&&!actor.hidden&&!(actor.residentUntilQuest&&this.hasReachedQuest(actor.residentUntilQuest))&&!(actor.enemy&&['battle','after'].includes(this.s.phase))).map(actor=>({...actor,kind:'stagingActor',main:false,interactive:actor.interactive!==false&&actor.pose!=='fallen'}));},
 handoverCredit(){return this.s.stagedHandovers?.[this.q.id]||{};},
 outstandingItems(items){const credit=this.handoverCredit();return Object.fromEntries(Object.entries(items||{}).map(([id,count])=>[id,Math.max(0,count-(credit[id]||0))]));},
 hasQuestItems(){return Object.entries(this.outstandingItems(this.q.requiredItems)).every(([id,count])=>(this.s.inventory[id]||0)>=count);},
 requireQuestItems(){return this.requireItems(this.outstandingItems(this.q.requiredItems));},
 stagingFocus(){if(this.scene.hidePlayer&&(!this.s.sequence?.focus||this.s.sequence.focus==='hero'))return this.scene.focus||this.scene.spawn;return this.s.sequence?this.stagingActor(this.s.sequence.focus)||this.s.hero:this.s.hero;},
 canStartStaging(){if(this.q.rescueMission)return this.canStartRescueStaging();return this.s.phase==='talk'&&!!this.stagingDefinition()&&!this.s.flags[completeKey(this.q.id)]&&!this.s.flags[this.q.legacyStagingFlag];},
 startStaging(){
  if(!this.canStartStaging()||this.s.sequence||!this.requireQuestItems()||!this.requireQuestFlags())return false;
  const definition=this.stagingDefinition();if(this.q.rescueMission&&near(this.s.hero,definition.startPoint||this.scene.objective)>135)return false;if(this.scene.jumps?.length&&definition.startPoint&&!this.findPath(definition.startPoint.x,definition.startPoint.y).length)return false;this.s.sequence={questId:this.q.id,step:0,elapsed:0,sceneKey:null,origin:null,actors:clone(definition.actors||[]),heroPose:'stand',focus:'hero',cues:{},handoverItems:{...this.handoverCredit()}};
  if(definition.heroStart)Object.assign(this.s.hero,this.nearestOpen(definition.heroStart.x,definition.heroStart.y),{direction:definition.heroStart.direction||1});
  this.effects=[];this.numbers=[];this.hitTime=0;this.dashTime=0;this.s.phase='staging';this.s.destination=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.keys.clear();this.meditating=false;this._stagingPrompt=null;this._stagingMove=null;this.emit('stagingStep');return true;
 },
 advanceStaging(){if(!this.s.sequence)return false;this.s.sequence.step++;this.s.sequence.elapsed=0;this._stagingPrompt=null;this._stagingMove=null;this.walkTime=0;this.emit('stagingStep');return true;},
 chooseStartingDifficulty(mode){
  if(!['normal','story'].includes(mode)||this.stagingDefinition()?.steps[this.s.sequence?.step]?.type!=='difficulty')return false;
  this.settings.difficulty=mode;
  if(!this.s.flags.startingDifficulty){this.s.flags.startingDifficulty=mode;if(mode==='story'){const h=this.s.hero,levels=Math.max(0,3-h.level);h.level+=levels;h.maxHp+=38*levels;h.maxMp+=15*levels;h.hp=h.maxHp;h.mp=h.maxMp;}}
  this.paused=false;this.advanceStaging();return true;
 },
 tickStaging(dt){
  const sequence=this.s.sequence,definition=this.stagingDefinition();if(!sequence||!definition)return;
  const step=definition.steps[sequence.step];
  if(step&&!stepMatches(step,this.s)){this.advanceStaging();return;}
  if(step?.type==='scene'){
   if(step.scene&&(!definition.sceneKeys?.includes(step.scene)||!getStagingScene(step.scene)))return;
   if(step.scene&&!sequence.sceneKey)sequence.origin={map:this.s.map,x:this.s.hero.x,y:this.s.hero.y,direction:this.s.hero.direction};
   sequence.sceneKey=step.scene??null;sequence.heroPose='stand';sequence.focus='hero';
   const position=step.hero?.restore?(sequence.origin||this.scene.spawn):step.hero;
   this.s.hero.pose='stand';if(position)Object.assign(this.s.hero,this.nearestOpen(position.x,position.y),{direction:position.direction===-1?-1:1});
   if(!step.scene)sequence.origin=null;
   this.advanceStaging();this.emit('stagingScene');return;
  }
  if(!step||step.type==='release'){if(sequence.sceneKey)return;
   this.s.flags[completeKey(this.q.id)]=true;this.s.hero.pose=definition.finalHeroPose||'stand';this.s.sequence=null;this._stagingPrompt=null;this._stagingMove=null;if(this.q.rescueMission){this.resumeRescueCombat();return;}this.s.phase='talk';this.walkTime=0;this.beginObjective();return;
  }
  if(step.type==='handover'){
   const outstanding=this.outstandingItems(step.items);
   if(!this.requireItems(outstanding))return;
   const ledger=(this.s.stagedHandovers??={})[this.q.id]??={};
   for(const [id,count] of Object.entries(outstanding)){this.s.inventory[id]=(this.s.inventory[id]||0)-count;ledger[id]=(ledger[id]||0)+count;}
   sequence.handoverItems={...ledger};this.advanceStaging();return;
  }
  if(step.type==='cue'){sequence.cues[step.key]=step.value;this.advanceStaging();return;}
  if(step.type==='wait'){sequence.elapsed+=dt;if(sequence.elapsed>=step.duration)this.advanceStaging();return;}
  const actor=this.stagingActor(step.actor||'hero');
  if(step.type==='replace'){const next=this.stagingActor(step.target);if(actor&&next){Object.assign(next,{x:actor.x,y:actor.y,direction:actor.direction,hidden:false});actor.hidden=true;}this.advanceStaging();return;}
  if(step.type==='useJade'||step.type==='readLetter'){sequence.elapsed+=dt;if(sequence.elapsed>=(step.duration||1))this.advanceStaging();return;}
  if(step.type==='show'){if(actor)actor.hidden=false;this.advanceStaging();return;}
  if(step.type==='hide'){if(actor)actor.hidden=true;this.advanceStaging();return;}
  if(step.type==='wallImpact'){
   if(actor){actor.pose='stand';actor.direction=step.direction===-1?-1:1;}
   sequence.elapsed+=dt;if(sequence.elapsed>=(step.duration||.45))this.advanceStaging();return;
  }
  if(step.type==='strike'){
   const victim=this.stagingActor(step.target);if(actor){actor.pose='attack';if(victim)actor.direction=victim.x>=actor.x?1:-1;}
   sequence.elapsed+=dt;if(sequence.elapsed>=(step.duration||.6)){if(actor)actor.pose='stand';this.advanceStaging();}return;
  }
  if(step.type==='pose'){if(actor)actor.pose=step.pose;if(step.actor==='hero')sequence.heroPose=step.pose;sequence.elapsed+=dt;if(sequence.elapsed>=(step.duration||.5))this.advanceStaging();return;}
  if(step.type==='face'){const target=this.stagingActor(step.target);if(actor)actor.direction=target?(target.x>=actor.x?1:-1):(step.direction===-1?-1:1);this.advanceStaging();return;}
  if(step.type==='move'){
   if(!actor){this.advanceStaging();return;}
   if(!this._stagingMove){const hero=this.s.hero;this.s.hero=actor;const destination=this.nearestOpen(step.x,step.y);const path=this.findPath(destination.x,destination.y);this.s.hero=hero;if(!path.length&&near(actor,destination)>12){if(!this._stagingBlocked)this.emit('toast',{text:'前路暂时受阻，正在重新寻找落脚点。'});this._stagingBlocked=true;return;}this._stagingBlocked=false;this._stagingMove={path};}
   const target=this._stagingMove.path[0];if(!target){this.advanceStaging();return;}
   const dx=target.x-actor.x,dy=target.y-actor.y,length=Math.hypot(dx,dy),stride=Math.min(length,(step.speed||160)*dt);
   if(length<3){actor.x=target.x;actor.y=target.y;this._stagingMove.path.shift();}
   else{actor.x+=dx/length*stride;actor.y+=dy/length*stride;if(Math.abs(dx)>1)actor.direction=dx>0?1:-1;if(step.actor==='hero')this.walkTime+=dt*9;}
   return;
  }
  if(step.type==='say'||step.type==='difficulty'){
   const key=sequence.questId+':'+sequence.step;if(this._stagingPrompt===key)return;
   this._stagingPrompt=key;sequence.focus=step.focus||'hero';this.emit(step.type==='say'?'stagingDialogue':'startingDifficulty',{lines:step.lines});return;
  }
  this.advanceStaging();
 }
};
