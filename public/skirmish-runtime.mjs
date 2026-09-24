// Independent two-faction battle simulation. Names/counts come from the
// reference audit; positions, health, timing, targeting and damage are authored.
const range=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const finite=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
const hasPoint=point=>Number.isFinite(point?.x)&&Number.isFinite(point?.y);
const criticalIds=quest=>[...new Set((quest.skirmish?.criticalAllyIds||[]).filter(id=>quest.skirmish.allies.some(entry=>entry.id===id)))];
function captureRule(quest){return quest.skirmish?.storyOutcome?.kind==='capture'?quest.skirmish.storyOutcome:null;}
function completeRoster(quest,roster){
 return ['enemies','allies'].every(side=>{
  const entries=quest.skirmish[side],units=roster?.[side];
  return Array.isArray(units)&&units.length===entries.length&&new Set(units.map(unit=>unit?.id)).size===entries.length&&entries.every(entry=>units.some(unit=>unit?.id===entry.id&&Number.isFinite(unit.hp)&&unit.hp>=0&&hasPoint(unit)));
 });
}
function captureReason(quest,roster){
 const rule=captureRule(quest);if(!rule||!completeRoster(quest,roster))return null;
 const down=rule.allyIds.find(id=>roster.allies.some(unit=>unit.id===id&&unit.hp===0));
 return down?'ally:'+down:roster.enemies.every(unit=>unit.hp===0)?'army-cleared':null;
}
function validStoryRoster(quest,battle){
 const saved=battle.storyRoster;
 return battle.finished===true&&battle.failed!==true&&battle.storyResolved==='capture'&&captureReason(quest,saved)?saved:null;
}
function resolveCapture(quest,state,battle){
 const reason=captureReason(quest,state);if(!reason)return false;
 battle.finished=true;battle.storyResolved='capture';battle.outcomeReason=reason;battle.storyRoster=completedRoster(state);return true;
}
function baseUnit(entry,side,index){
 const ally=side==='ally',fallbackHp=entry.boss?(ally?2600:1800):(ally?500:460);
 const maxHp=finite(entry.maxHp,1,100000,finite(entry.hp,1,100000,fallbackHp));
 const defaultCell=ally?(entry.boss?3:6):(entry.boss?2:5);
 return {id:entry.id,name:entry.name,boss:!!entry.boss,ally,skirmish:true,
  npcCell:entry.npcCell===null?null:Number.isInteger(entry.npcCell)&&entry.npcCell>=0?entry.npcCell:defaultCell,
  sprite:Number.isInteger(entry.sprite)&&entry.sprite>=0?entry.sprite:ally?3:0,
  role:typeof entry.role==='string'&&entry.role?entry.role:'sword',tier:finite(entry.tier,1,99,12),
  direction:ally?1:-1,hp:finite(entry.hp,0,maxHp,maxHp),maxHp,
  attackTimer:.6+(index%5)*.12,skillTimer:2+(index%6)*.3,telegraph:0,telegraphZone:null,flash:0,slow:0};
}
function declaredRoster(quest){
 const rule=quest.skirmish;
 if(!rule||!Array.isArray(rule.enemies)||!rule.enemies.length||!Array.isArray(rule.allies))throw new Error('当前战场的阵容配置不完整');
 const entries=[...rule.enemies,...rule.allies],ids=entries.map(entry=>entry?.id);
 if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)throw new Error('当前战场的单位身份必须独立且有效');
 if(rule.criticalAllyIds&&(!Array.isArray(rule.criticalAllyIds)||rule.criticalAllyIds.some(id=>!rule.allies.some(entry=>entry.id===id))))throw new Error('当前战场的关键同伴不在友方阵容中');
 const capture=captureRule(quest);
 if(capture&&(!Array.isArray(capture.allyIds)||!capture.allyIds.length||new Set(capture.allyIds).size!==capture.allyIds.length||capture.allyIds.some(id=>!rule.allies.some(entry=>entry.id===id))||capture.heroDefeat!=='retry'))throw new Error('当前战场的剧情结果配置无效');
 return [...rule.enemies.map((entry,index)=>({entry,index,side:'enemy'})),...rule.allies.map((entry,index)=>({entry,index,side:'ally'}))];
}
function explicitPosition(engine,entry){
 if(Object.hasOwn(entry,'x')||Object.hasOwn(entry,'y'))return {x:entry.x,y:entry.y};
 return engine.battleQuest.skirmish.positions?.[entry.id]??engine.scene.skirmish?.positions?.[entry.id];
}
function placementAllocator(engine,reserved=[]){
 const hero=engine.s.hero,occupied=[hero,...reserved],slots=[];
 const reachable=point=>{
  if(!hasPoint(point)||!engine.passable(point.x,point.y))return false;
  if(range(hero,point)<1||engine.clearSegment(hero,point))return true;
  const path=engine.findPath(point.x,point.y);return !!path.length&&range(path.at(-1),point)<35;
 };
 const claim=point=>{
  if(!reachable(point)||occupied.some(other=>range(point,other)<40))return false;
  const result={x:point.x,y:point.y};occupied.push(result);return result;
 };
 // Preserve the existing cult deployment order when no authored positions are supplied.
 for(let y=390;y<=930;y+=60)for(let x=220;x<=1410;x+=70)if(engine.passable(x,y)&&range(hero,{x,y})>75)slots.push({x,y});
 return {claim,take(side){
  slots.sort((a,b)=>side==='ally'?a.x-b.x||b.y-a.y:b.x-a.x||a.y-b.y);
  while(slots.length){const result=claim(slots.shift());if(result)return result;}
  throw new Error('当前战场没有足够的独立可达站位');
 }};
}
function savedUnits(entries,saved){
 const accepted=new Map(),duplicates=new Set(),ids=new Set(entries.map(entry=>entry.id));
 for(const unit of Array.isArray(saved)?saved:[]){
  if(!unit||!ids.has(unit.id))continue;
  if(accepted.has(unit.id)){duplicates.add(unit.id);continue;}
  accepted.set(unit.id,unit);
 }
 for(const id of duplicates)accepted.delete(id);
 return accepted;
}
function rosterCleared(quest,state){
 const roster=quest.skirmish.enemies,units=state.enemies,defeated=new Set(state.skirmish.defeatedIds);
 return roster.length>0&&units.length===roster.length&&new Set(units.map(unit=>unit.id)).size===roster.length&&roster.every(entry=>defeated.has(entry.id)&&units.some(unit=>unit.id===entry.id&&unit.hp===0));
}
const completedRoster=state=>({enemies:state.enemies.map(unit=>({...unit,telegraph:0,telegraphZone:null})),allies:state.allies.map(unit=>({...unit,telegraph:0,telegraphZone:null}))});
function validClearedRoster(quest,battle){
 const saved=battle.clearedRoster;
 if(battle.finished!==true||battle.failed===true||!saved)return null;
 for(const side of ['enemies','allies']){
  const entries=quest.skirmish[side],units=saved[side];
  if(!Array.isArray(units)||units.length!==entries.length||new Set(units.map(unit=>unit?.id)).size!==entries.length)return null;
  if(!entries.every(entry=>units.some(unit=>unit?.id===entry.id&&Number.isFinite(unit.hp)&&hasPoint(unit)&&(side!=='enemies'||unit.hp===0))))return null;
 }
 if(criticalIds(quest).some(id=>!saved.allies.some(unit=>unit.id===id&&unit.hp>0)))return null;
 return saved;
}
function legacyCultClear(raw,quest,state){
 if(quest.id!=='gCult_wudang'||raw.skirmish.finished!==true||raw.skirmish.failed===true||!(raw.hero?.hp>0))return false;
 const previousVersion=Number.isInteger(raw.campaignRevision)&&raw.campaignRevision>=1&&raw.campaignRevision<=7;
 if(!(raw.skirmish.legacyCleared===true||(previousVersion&&state.map!==quest.map)))return false;
 if(raw.objectiveProgress?.questId!==quest.id||raw.objectiveProgress.phase!=='after'||raw.flags?.cultPath!==true)return false;
 if(!Array.isArray(raw.enemies)||raw.enemies.length!==0)return false;
 const ids=raw.skirmish.defeatedIds,roster=quest.skirmish.enemies;
 return Array.isArray(ids)&&ids.length===roster.length&&new Set(ids).size===roster.length&&roster.every(entry=>ids.includes(entry.id));
}
export function restoreSkirmish(raw,quest,state){
 if(!quest.skirmish)return;
 state.skirmish=null;state.enemies=[];state.allies=[];
 declaredRoster(quest);
 if(raw.skirmish?.questId!==quest.id){
  if(quest.rescueMission){state.sequence=null;delete state.flags['staged_'+quest.id];if(state.map===quest.map)state.phase='talk';}
  if(!state.sequence&&state.map===quest.map&&['battle','after'].includes(state.phase))state.phase='talk';
  return;
 }
 const rule=quest.skirmish,cleared=validStoryRoster(quest,raw.skirmish)||validClearedRoster(quest,raw.skirmish);
 // Map transitions remove visible combatants. Only a validated complete outcome
 // snapshot may supply that omitted roster; a result label is never sufficient.
 const enemySource=Array.isArray(raw.enemies)&&raw.enemies.length===0&&cleared?cleared.enemies:raw.enemies;
 const allySource=Array.isArray(raw.allies)&&raw.allies.length===0&&cleared?cleared.allies:raw.allies;
 const enemyRecords=savedUnits(rule.enemies,enemySource),allyRecords=savedUnits(rule.allies,allySource),critical=criticalIds(quest);
 const missingCritical=critical.some(id=>!Number.isFinite(allyRecords.get(id)?.hp));
 const incompleteStory=!!(captureRule(quest)||quest.rescueMission)&&!completeRoster(quest,{enemies:enemySource,allies:allySource});
 function units(entries,side,records){return entries.map((entry,index)=>{
  const base=baseUnit(entry,side,index),unit=records.get(entry.id),validHp=Number.isFinite(unit?.hp);
  // An absent enemy is unknown, never evidence of a kill. An absent critical
  // companion instead invalidates continuation and requires an explicit retry.
  const hp=validHp?finite(unit.hp,0,base.maxHp,base.maxHp):side==='ally'&&critical.includes(entry.id)?0:base.maxHp;
  const point=hasPoint(unit)?{x:finite(unit.x,0,1600,0),y:finite(unit.y,0,1100,0)}:hasPoint(entry)?{x:entry.x,y:entry.y}:{x:null,y:null};
  const savedZone=unit?.telegraphZone,telegraph=savedZone?.kind==='circle'&&hasPoint(savedZone)?finite(unit?.telegraph,0,1.2,0):0;
  return {...base,...point,hp,_needsPlacement:!hasPoint(unit),
   telegraph,telegraphZone:telegraph>0?{kind:'circle',x:finite(savedZone.x,0,1600,0),y:finite(savedZone.y,0,1100,0),radius:115}:null,
   direction:unit?.direction===-1?-1:base.direction,attackTimer:finite(unit?.attackTimer,0,3,1),skillTimer:finite(unit?.skillTimer,0,7,3)};
 });}
 const enemies=units(rule.enemies,'enemy',enemyRecords),allies=units(rule.allies,'ally',allyRecords);
 if(legacyCultClear(raw,quest,state)){
  // Old cult saves deliberately discarded the cleared army after leaving its
  // map. Preserve their corroborated history without inventing a new fight or
  // manufacturing a current-format victory snapshot. Never applies to island.
  state.enemies=[];state.allies=allies.filter(unit=>Number.isFinite(allyRecords.get(unit.id)?.hp));
  state.skirmish={questId:quest.id,defeatedIds:[...raw.skirmish.defeatedIds],finished:true,failed:false,failedReason:null,legacyCleared:true};
  state.phase=state.map===quest.map?'after':'travel';return;
 }
 const deadIds=new Set(enemies.filter(unit=>unit.hp===0).map(unit=>unit.id));
 const defeatedIds=[...new Set([...(Array.isArray(raw.skirmish.defeatedIds)?raw.skirmish.defeatedIds:[]).filter(id=>deadIds.has(id)),...deadIds])];
 const deadCritical=critical.find(id=>Number.isFinite(allyRecords.get(id)?.hp)&&allyRecords.get(id).hp<=0);
 const previousReason=raw.skirmish.failedReason;
 const persistedReason=raw.skirmish.failed===true&&(previousReason==='hero'||critical.includes(previousReason)||previousReason==='incomplete-roster')?previousReason:null;
 let failedReason=raw.hero?.hp<=0?'hero':persistedReason||deadCritical||(missingCritical||incompleteStory?'incomplete-roster':null);
 if(!failedReason&&raw.skirmish.failed===true)failedReason=critical.length?'battle':'hero';
 if(critical.includes(failedReason))allies.find(unit=>unit.id===failedReason).hp=0;
 const battle={questId:quest.id,defeatedIds,finished:false,failed:!!failedReason,failedReason};
 if(!battle.failed){
  if(captureRule(quest))resolveCapture(quest,{enemies,allies},battle);
  else{battle.finished=rosterCleared(quest,{enemies,skirmish:battle});if(battle.finished)battle.clearedRoster=completedRoster({enemies,allies});}
 }
 if(state.map!==quest.map&&!battle.finished)return;
 state.enemies=enemies;state.allies=allies;state.skirmish=battle;
 state.phase=state.map!==quest.map?'travel':battle.finished?'after':'battle';
 if(quest.rescueMission&&state.sequence){if(battle.failed)state.sequence=null;else state.phase='staging';}
 if(failedReason==='hero')state.hero.hp=0;
}
export const skirmishMethods={
 startSkirmish(){
  if(!this.battleQuest.skirmish||this.s.failure||this.s.skirmish?.failed)return false;
  const roster=declaredRoster(this.battleQuest),originalHero=this.s.hero;
  const start=this.battleQuest.skirmish.heroStart||this.scene.skirmish?.heroStart||{x:580,y:810};
  const hero={...originalHero,...this.nearestOpen(start.x,start.y),direction:1},positions=new Map();
  this.s.hero=hero;
  try{
   const allocator=placementAllocator(this);
   for(const {entry} of roster){const point=explicitPosition(this,entry);if(point!=null){
    const chosen=allocator.claim(point);if(!chosen)throw new Error('当前战场的单位 '+entry.id+' 站位重叠或不可达');positions.set(entry.id,chosen);
   }}
   for(const {entry,side} of roster)if(!positions.has(entry.id))positions.set(entry.id,allocator.take(side));
  }finally{this.s.hero=originalHero;}
  Object.assign(originalHero,hero);
  this.s.skirmish={questId:this.battleQuest.id,defeatedIds:[],finished:false,failed:false,failedReason:null};this.s.phase='battle';this.s.destination=null;
  this.s.enemies=roster.filter(unit=>unit.side==='enemy').map(({entry,side,index})=>({...baseUnit(entry,side,index),...positions.get(entry.id)}));
  this.s.allies=roster.filter(unit=>unit.side==='ally').map(({entry,side,index})=>({...baseUnit(entry,side,index),...positions.get(entry.id)}));
  this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;
  this._skirmishSave=0;this.emit('battle');return true;
 },
 repairSkirmishPositions(){
  if(this.s.skirmish?.questId!==this.battleQuest.id||this.s.map!==this.battleQuest.map)return;
  const units=[...this.s.enemies,...this.s.allies],repair=units.filter(unit=>unit._needsPlacement||!hasPoint(unit)||!this.passable(unit.x,unit.y));
  if(repair.length){
   const allocator=placementAllocator(this,units.filter(unit=>!repair.includes(unit))),roster=declaredRoster(this.battleQuest);
   for(const unit of repair){const {entry,side}=roster.find(candidate=>candidate.entry.id===unit.id),preferred=explicitPosition(this,entry);
    Object.assign(unit,(preferred&&allocator.claim(preferred))||allocator.take(side));
   }
  }
  for(const unit of units)delete unit._needsPlacement;
 },
 markSkirmishDefeat(enemy,byHero=false){
  const battle=this.s.skirmish;
  if(!battle||battle.questId!==this.battleQuest.id||battle.finished||battle.failed||this.s.phase!=='battle'||!enemy||enemy.hp!==0||!this.s.enemies.includes(enemy)||!this.battleQuest.skirmish.enemies.some(entry=>entry.id===enemy.id)||battle.defeatedIds.includes(enemy.id))return false;
  battle.defeatedIds.push(enemy.id);this.addEffect('spark',enemy.x,enemy.y-40,40,'#c5b895',.5);
  this.emit('skirmishProgress');return true;
 },
 checkSkirmishOutcome(){
  const battle=this.s.skirmish;if(!battle||battle.questId!==this.battleQuest.id||battle.finished||battle.failed)return;
  const critical=criticalIds(this.battleQuest),down=critical.find(id=>this.s.allies.some(unit=>unit.id===id&&unit.hp<=0));
  const missing=critical.some(id=>this.s.allies.filter(unit=>unit.id===id&&Number.isFinite(unit.hp)).length!==1);
  const failedReason=this.s.hero.hp<=0?'hero':down||(missing||(captureRule(this.battleQuest)&&!completeRoster(this.battleQuest,this.s))?'incomplete-roster':null);
  if(failedReason){battle.failed=true;battle.failedReason=failedReason;this.paused=true;this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.keys?.clear();this.emit('skirmishProgress');this.emit('defeat');return;}
  if(captureRule(this.battleQuest)){
   if(resolveCapture(this.battleQuest,this.s,battle)){this.s.phase='after';this.attackTarget=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.keys?.clear();this.emit('storyBattleOutcome',{kind:'capture',reason:battle.outcomeReason});}
   return;
  }
  if(rosterCleared(this.battleQuest,this.s)){battle.finished=true;battle.clearedRoster=completedRoster(this.s);this.s.phase='after';this.attackTarget=null;this.target=null;this.waypoints=[];this.emit('victory');}
 },
 moveCombatant(unit,target,dt){
  if(range(unit,target)<86)return;
  unit.pathRefresh=(unit.pathRefresh||0)-dt;
  if(!this.clearSegment(unit,target)){
   if(unit.pathRefresh<=0){const hero=this.s.hero;this.s.hero=unit;unit.path=this.findPath(target.x,target.y);this.s.hero=hero;unit.pathRefresh=.8;}
   const next=unit.path?.[0];if(next){if(range(unit,next)<10)unit.path.shift();else target=next;}
  }
  const angle=Math.atan2(target.y-unit.y,target.x-unit.x),stride=(unit.boss?93:80)*(unit.slow>0?.45:1)*dt;
  for(const offset of [0,.65,-.65,1.15,-1.15]){const x=unit.x+Math.cos(angle+offset)*stride,y=unit.y+Math.sin(angle+offset)*stride*.73;if(this.passable(x,y)){unit.x=x;unit.y=y;break;}}
 },
 tickSkirmish(dt){
  if(this.s.phase!=='battle'||!this.s.skirmish||this.s.skirmish.failed)return;
  const hero=this.s.hero,enemyList=this.s.enemies,allies=this.s.allies;
  const hit=(attacker,target,power)=>{
   if(target===hero){if(this.dashTime<=0)this.hurt(attacker,power);}
   else{const damage=Math.round((attacker.boss?62:24)*power);target.hp=Math.max(0,target.hp-damage);target.flash=.18;if(target.hp===0&&!target.ally)this.markSkirmishDefeat(target);}
  };
  const act=(unit,targets)=>{
   if(unit.hp<=0)return;unit.flash=Math.max(0,unit.flash-dt);unit.slow=Math.max(0,unit.slow-dt);
   const target=targets.filter(t=>t.hp>0).sort((a,b)=>range(unit,a)-range(unit,b))[0];if(!target)return;unit.direction=target.x>=unit.x?1:-1;
   if(unit.telegraph>0){unit.telegraph-=dt;if(unit.telegraph<=0){const zone=unit.telegraphZone;for(const victim of targets)if(victim.hp>0&&this.inThreat(victim,zone))hit(unit,victim,1.7);this.addEffect('slash',zone.x,zone.y-30,zone.radius,unit.ally?'#a9d7c2':'#e38b7f',.5);unit.telegraphZone=null;}return;}
   unit.skillTimer-=dt;
   if(unit.boss&&unit.skillTimer<=0&&range(unit,target)<230){unit.skillTimer=6;unit.telegraph=1.2;unit.telegraphZone={kind:'circle',x:target.x,y:target.y,radius:115};if(!unit.ally&&range(hero,target)<180)this.emit('warning',{name:unit.name});return;}
   this.moveCombatant(unit,target,dt);unit.attackTimer-=dt;
   if(unit.attackTimer<=0&&range(unit,target)<115){unit.attackTimer=unit.boss?1.15:1.6;hit(unit,target,1);this.addEffect('slash',unit.x,unit.y-30,35,unit.ally?'#92c8b7':'#db9085',.25);}
  };
  for(const unit of enemyList)act(unit,[hero,...allies]);
  for(const unit of allies)if(unit.role!=='escort')act(unit,enemyList);
  this.checkSkirmishOutcome();this._skirmishSave=(this._skirmishSave||0)+dt;
  if(this._skirmishSave>=3&&this.s.phase==='battle'){this._skirmishSave=0;this.emit('skirmishProgress');}
 }
};
