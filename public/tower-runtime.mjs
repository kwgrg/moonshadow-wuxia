// Independent traversal combat. Stair access never depends on killing guards.
// Persisting each floor's survivors is an authored adaptation, not a verified
// claim about the original engine's SaveNpc / LoadNpc behaviour.
import {QUESTS} from './campaign.mjs';
import {GOOD_TOWER_ENCOUNTERS} from './good-tower-valley-revisions.mjs';
import {restoreSkirmish} from './skirmish-runtime.mjs';
const range=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const clone=x=>JSON.parse(JSON.stringify(x));
const ROSE='tower-rose';
const roseEntry={id:ROSE,name:'蔷薇',role:'escort',npcCell:7,sprite:1,hp:1200,maxHp:1200,tier:1};
export function towerJourneyActive(state){
 if(state.completed||state.flags.route!=='good'||state.flags.cultPath)return false;
 const index=state.quest,first=QUESTS.findIndex(q=>q.id==='gTower1'),last=QUESTS.findIndex(q=>q.id==='g19_return');
 return index>=first&&index<=last;
}
export const towerEscortActive=state=>towerJourneyActive(state)&&!!(state.flags.goodTowerRoseFreed||state.flags.goodTowerLegacyRoseFreed)&&!state.flags.goodTowerHomecoming;
export function towerEncounter(state,map=state.map,escort=towerEscortActive(state)){
 const q=GOOD_TOWER_ENCOUNTERS[map];if(!q||!towerJourneyActive(state))return null;
 return {...q,towerAmbient:true,skirmish:{...q.skirmish,allies:escort?[{...roseEntry}]:[],criticalAllyIds:escort?[ROSE]:[]}};
}
function hasRoster(raw,q){
 return ['enemies','allies'].every(side=>Array.isArray(raw?.[side])&&raw[side].length===q.skirmish[side].length&&new Set(raw[side].map(u=>u?.id)).size===raw[side].length&&q.skirmish[side].every(entry=>raw[side].some(u=>u.id===entry.id&&Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=(entry.maxHp||entry.hp)&&Number.isFinite(u.x)&&Number.isFinite(u.y))));
}
function validatedTowerClear(state,q){
 const battle=state.skirmish,ids=battle?.defeatedIds;
 if(!battle||battle.questId!==q.id||battle.finished!==true||battle.failed||state.phase!=='after')return false;
 if(!hasRoster(state,q)||!hasRoster(battle.clearedRoster,q))return false;
 if(!Array.isArray(ids)||ids.length!==q.skirmish.enemies.length||new Set(ids).size!==ids.length||!q.skirmish.enemies.every(e=>ids.includes(e.id)))return false;
 return state.enemies.every(e=>e.hp===0)&&battle.clearedRoster.enemies.every(e=>e.hp===0);
}
export function restoreTowerJourney(raw,state){
 state.towerFloors={};state.towerEscort=null;
 if(!towerJourneyActive(state))return;
 if(GOOD_TOWER_ENCOUNTERS[state.map]&&Number.isFinite(raw.hero?.hp)&&raw.hero.hp<=0)state.hero.hp=0;
 if(towerEscortActive(state))state.towerEscort={hp:Number.isFinite(raw.towerEscort?.hp)?Math.max(0,Math.min(1200,raw.towerEscort.hp)):1200,maxHp:1200};
 for(const map of Object.keys(GOOD_TOWER_ENCOUNTERS)){
  const saved=raw.towerFloors?.[map];if(!saved)continue;
  const q=towerEncounter(state,map,!!saved.escort),shadow={...state,map,hero:{...state.hero,hp:map===state.map&&(raw.hero?.hp<=0)?0:Math.max(1,state.hero.hp)},sequence:null};
  if(!hasRoster(saved,q)||saved.skirmish?.questId!==q.id){
   // Missing units cannot establish kills. Explicit retry is required on return.
   state.towerFloors[map]={invalid:true,escort:!!saved.escort};continue;
  }
  restoreSkirmish({...saved,hero:shadow.hero},q,shadow);
  state.towerFloors[map]={escort:!!saved.escort,skirmish:shadow.skirmish,enemies:shadow.enemies,allies:shadow.allies};
 }
 const current=state.towerFloors[state.map];
 if(current&&!current.invalid){
  state.skirmish=current.skirmish;state.enemies=current.enemies;state.allies=current.allies;
  const rose=state.allies.find(u=>u.id===ROSE);
  if(towerEscortActive(state)&&rose&&Number.isFinite(state.towerEscort?.hp))rose.hp=Math.min(rose.hp,state.towerEscort.hp);
  state.phase=current.skirmish.finished?'after':'battle';
  if(current.skirmish.failedReason==='hero')state.hero.hp=0;
 }
 // A current R15 floor cannot erase its army by dropping the bank alone.
 if(!current&&raw.campaignRevision>=15&&GOOD_TOWER_ENCOUNTERS[state.map]&&raw.skirmish?.questId?.startsWith('tower-floor-'))state.towerFloors[state.map]={invalid:true};
}
export const towerMethods={
 towerEncounter(){return towerEncounter(this.s);},
 towerCanTravel(){return !!this.towerEncounter()&&!this.s.skirmish?.failed&&this.s.hero.hp>0&&!this.s.sequence;},
 saveTowerFloor(){
  const q=this.towerEncounter();if(!q||this.s.skirmish?.questId!==q.id)return;
  this.s.towerFloors??={};this.s.towerFloors[this.s.map]={escort:this.s.allies.some(u=>u.id===ROSE),skirmish:this.s.skirmish,enemies:this.s.enemies,allies:this.s.allies};
  const rose=this.s.allies.find(u=>u.id===ROSE);if(rose)this.s.towerEscort={hp:rose.hp,maxHp:rose.maxHp};
 },
 ensureTowerEncounter(){
  const q=this.towerEncounter();if(!q||this.s.sequence||this.s.completed)return false;
  this.s.towerFloors??={};
  let saved=this.s.towerFloors[this.s.map];
  const alreadyCurrent=this.s.skirmish?.questId===q.id&&!saved?.invalid;
  if(saved?.invalid){
   this.s.skirmish={questId:q.id,failed:true,failedReason:'incomplete-roster',finished:false,defeatedIds:[]};this.s.enemies=[];this.s.allies=[];this.s.phase='battle';this.paused=true;this.emit('defeat');return false;
  }
  if(!alreadyCurrent){
   if(saved){this.s.skirmish=saved.skirmish;this.s.enemies=saved.enemies;this.s.allies=saved.allies;}
   else {this.s.skirmish=null;this.startSkirmish();}
  }
  if(!this.s.skirmish)return false;
  let attached=false;
  if(towerEscortActive(this.s)&&!this.s.allies.some(u=>u.id===ROSE)){
   attached=true;
   const point=this.nearestOpen(this.s.hero.x-35,this.s.hero.y+30),hp=this.s.towerEscort?.hp??1200;
   this.s.allies.push({...roseEntry,...point,hp,ally:true,skirmish:true,boss:false,direction:1,attackTimer:0,skillTimer:0,telegraph:0,flash:0});
   if(this.s.skirmish.finished)this.s.skirmish.clearedRoster={enemies:clone(this.s.enemies),allies:clone(this.s.allies)};
  }
  // Escort vitality belongs to the journey, not an old floor snapshot.
  // Do not heal her by revisiting an upstairs bank or spawning a fresh floor.
  const escort=this.s.allies.find(u=>u.id===ROSE);
  if((!alreadyCurrent||attached)&&towerEscortActive(this.s)&&escort&&Number.isFinite(this.s.towerEscort?.hp))escort.hp=Math.max(0,Math.min(escort.maxHp,this.s.towerEscort.hp));
  if((!alreadyCurrent||attached)&&escort&&this.s.skirmish.finished)this.s.skirmish.clearedRoster={enemies:clone(this.s.enemies),allies:clone(this.s.allies)};
  const reason=this.s.hero.hp<=0?'hero':towerEscortActive(this.s)&&escort?.hp<=0?ROSE:null;
  if(reason&&!this.s.skirmish.failed){this.s.skirmish.failed=true;this.s.skirmish.failedReason=reason;this.s.skirmish.finished=false;this.emit('defeat');}
  this.s.phase=this.s.skirmish.finished?'after':'battle';
  if(this.s.skirmish.failed){this.paused=true;}
  this.saveTowerFloor();if(!alreadyCurrent||attached)this.repairSkirmishPositions();
  const rose=this.s.allies.find(u=>u.id===ROSE);if(rose){this._partyPositions??={};this._partyPositions['蔷薇']={x:rose.x,y:rose.y};}
  return true;
 },
 towerDescriptor(){
  const q=this.towerEncounter();if(!q)return this.q;
  const hero=this.s.hero,sameArmy=this.s.skirmish?.questId===q.id;
  const key=q.map+'|'+hero.x+'|'+hero.y;
  let cache=this._towerPositionsCache;
  if(!cache||cache.map!==q.map||(!sameArmy&&cache.key!==key)){
   const slots=this.scene.tower?.guardPositions||[],positions={},occupied=[hero];
   for(const [index,enemy] of q.skirmish.enemies.entries()){
    const point=slots[index];
    if(!point||!this.passable(point.x,point.y)||occupied.some(other=>range(other,point)<40))continue;
    const path=this.clearSegment(hero,point)?null:this.findPath(point.x,point.y);
    if(path&&(!path.length||range(path.at(-1),point)>=35))continue;
    positions[enemy.id]={x:point.x,y:point.y};occupied.push(point);
   }
   cache=this._towerPositionsCache={map:q.map,key,positions};
  }
  // Unsafe authored candidates fall back to the existing placement allocator.
  // This only describes fresh/repair deployment; it never relocates a live army.
  return {...q,skirmish:{...q.skirmish,positions:cache.positions,heroStart:{x:hero.x,y:hero.y}}};
 },
 towerExitReady(id){
  if(!this.towerEncounter())return true;
  if(!this.towerCanTravel())return false;
  const exit=this.exits().find(e=>e.to===id&&!e.locked),portal=this.scene.portals?.[id];
  if(!exit||!portal||range(this.s.hero,portal.exit)>135)return false;
  const rose=this.s.allies.find(u=>u.id===ROSE);
  if(towerEscortActive(this.s)&&(!rose||rose.hp<=0||range(rose,this.s.hero)>200)){this.emit('toast',{text:'等蔷薇跟上，再一同走下楼梯。'});return false;}
  this.saveTowerFloor();
  if(this.q.towerPassage&&this.s.map===this.q.map&&id===this.q.towerPassage.toMap){
   const qid=this.q.id;this._towerExitCommit=qid;
   try{this.completeQuest();if(this.q.id===qid)return false;}finally{this._towerExitCommit=null;}
  }
  return true;
 },
 trackTower(){
  if(!this.towerEncounter())return false;
  this.ensureTowerEncounter();const target=this.q.towerPassage&&this.s.map===this.q.map?this.q.towerPassage.toMap:this.q.map;
  return this.travel(target);
 },
 canRestTowerEscort(){
  const q=this.towerEncounter();
  return !!q&&towerEscortActive(this.s)&&!this.paused&&this.active&&!this.s.failure&&!this.s.sequence&&this.s.hero.hp>0&&validatedTowerClear(this.s,q)&&this.s.allies.some(a=>a.id===ROSE&&a.hp>0);
 },
 tickTowerEscort(dt=0){
  if(!this.towerEncounter())return;
  const rose=this.s.allies.find(u=>u.id===ROSE),point=this._partyPositions?.['蔷薇'];
  if(rose?.hp>0&&point){rose.direction=point.x>=rose.x?1:-1;rose.x=point.x;rose.y=point.y;}
  // Authored accessibility/balance adaptation: a cleared, validated floor is a
  // safe rest stop. This never revives a fallen ally or works during combat.
  let saveRest=false;
  if(this.meditating&&this.canRestTowerEscort()&&rose.hp<rose.maxHp&&Number.isFinite(dt)&&dt>0){
   const elapsed=Math.min(.05,dt);rose.hp=Math.min(rose.maxHp,rose.hp+90*elapsed);
   const snapshot=this.s.skirmish.clearedRoster.allies.find(a=>a.id===ROSE);
   snapshot.hp=rose.hp;this._towerRestSave=(this._towerRestSave||0)+elapsed;
   if(this._towerRestSave>=2||rose.hp===rose.maxHp){saveRest=true;this._towerRestSave=0;}
  }else this._towerRestSave=0;
  this.saveTowerFloor();if(saveRest)this.emit('skirmishProgress');
 },
 retryTower(){
  if(!this.towerEncounter()||!this.s.skirmish?.failed)return false;
  delete this.s.towerFloors[this.s.map];this.s.skirmish=null;this.s.enemies=[];this.s.allies=[];
  this.s.hero.hp=this.s.hero.maxHp;this.s.hero.mp=this.s.hero.maxMp;this.s.hero.stamina=100;this.s.cooldowns.fill(0);
  Object.assign(this.s.hero,this.nearestOpen(this.scene.spawn.x,this.scene.spawn.y));this.s.towerEscort=towerEscortActive(this.s)?{hp:1200,maxHp:1200}:null;
  this.paused=false;this.resetParty();this.ensureTowerEncounter();this.emit('battle');return true;
 },
};
