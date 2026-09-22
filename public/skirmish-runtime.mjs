// Independent two-faction battle simulation. Names/counts come from the
// reference audit; positions, health, timing, targeting and damage are authored.
const range=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const finite=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
const baseUnit=(entry,side,index)=>({id:entry.id,name:entry.name,boss:!!entry.boss,ally:side==='ally',skirmish:true,npcCell:side==='ally'?(entry.boss?3:6):(entry.boss?2:5),sprite:side==='ally'?3:0,role:'sword',tier:12,direction:side==='ally'?1:-1,hp:entry.boss?(side==='ally'?2600:1800):(side==='ally'?500:460),maxHp:entry.boss?(side==='ally'?2600:1800):(side==='ally'?500:460),attackTimer:.6+(index%5)*.12,skillTimer:2+(index%6)*.3,telegraph:0,telegraphZone:null,flash:0,slow:0});
export function restoreSkirmish(raw,quest,state){
 if(!quest.skirmish||raw.skirmish?.questId!==quest.id)return;
 if(state.map!==quest.map&&raw.skirmish.finished!==true)return;
 const roster=quest.skirmish.enemies;
 const defeatedIds=[...new Set((Array.isArray(raw.skirmish.defeatedIds)?raw.skirmish.defeatedIds:[]).filter(id=>roster.some(e=>e.id===id)))];
 function units(entries,side,saved){return entries.map((entry,index)=>{
  const base=baseUnit(entry,side,index),unit=Array.isArray(saved)?saved.find(u=>u?.id===entry.id):null;
  const hp=side==='enemy'&&defeatedIds.includes(entry.id)?0:finite(unit?.hp,0,base.maxHp,base.maxHp);
  if(side==='enemy'&&hp===0&&!defeatedIds.includes(entry.id))defeatedIds.push(entry.id);
  const savedZone=unit?.telegraphZone,telegraph=savedZone?.kind==='circle'?finite(unit?.telegraph,0,1.2,0):0;
  const telegraphZone=telegraph>0?{kind:'circle',x:finite(savedZone.x,120,1460,unit.x),y:finite(savedZone.y,300,950,unit.y),radius:115}:null;
  return {...base,telegraph,telegraphZone,x:finite(unit?.x,120,1460,side==='ally'?400:1150),y:finite(unit?.y,300,950,650),hp,direction:unit?.direction===-1?-1:1,attackTimer:finite(unit?.attackTimer,0,3,1),skillTimer:finite(unit?.skillTimer,0,7,3)};
 });}
 state.enemies=units(roster,'enemy',raw.enemies);state.allies=units(quest.skirmish.allies,'ally',raw.allies);
 const failed=raw.skirmish.failed===true||raw.hero?.hp<=0,finished=!failed&&defeatedIds.length===roster.length;
 state.skirmish={questId:quest.id,defeatedIds,finished,failed};
 state.phase=state.map!==quest.map?'travel':finished?'after':'battle';if(state.skirmish.failed)state.hero.hp=0;
}
export const skirmishMethods={
 startSkirmish(){
  if(!this.q.skirmish||this.s.failure)return false;
  this.s.skirmish={questId:this.q.id,defeatedIds:[],finished:false,failed:false};this.s.phase='battle';this.s.enemies=[];this.s.allies=[];this.s.destination=null;
  this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;
  const start=this.q.skirmish.heroStart||{x:580,y:810};Object.assign(this.s.hero,this.nearestOpen(start.x,start.y),{direction:1});
  const slots=[];for(let y=390;y<=930;y+=60)for(let x=220;x<=1410;x+=70)if(this.passable(x,y)&&range(this.s.hero,{x,y})>75)slots.push({x,y});
  const take=side=>{slots.sort((a,b)=>side==='ally'?a.x-b.x||b.y-a.y:b.x-a.x||a.y-b.y);const point=slots.shift();if(!point)throw new Error('武当战场没有足够的独立站位');return point;};
  this.s.enemies=this.q.skirmish.enemies.map((entry,index)=>({...baseUnit(entry,'enemy',index),...take('enemy')}));
  this.s.allies=this.q.skirmish.allies.map((entry,index)=>({...baseUnit(entry,'ally',index),...take('ally')}));
  this._skirmishSave=0;this.emit('battle');return true;
 },
 markSkirmishDefeat(enemy,byHero=false){
  if(!this.s.skirmish||enemy.hp>0||this.s.skirmish.defeatedIds.includes(enemy.id))return false;
  this.s.skirmish.defeatedIds.push(enemy.id);this.addEffect('spark',enemy.x,enemy.y-40,40,'#c5b895',.5);
  this.emit('skirmishProgress');return true;
 },
 checkSkirmishOutcome(){
  const battle=this.s.skirmish;if(!battle||battle.finished||battle.failed)return;
  if(this.s.hero.hp<=0){battle.failed=true;this.paused=true;this.target=null;this.attackTarget=null;this.emit('skirmishProgress');this.emit('defeat');return;}
  if(battle.defeatedIds.length===this.q.skirmish.enemies.length){battle.finished=true;this.s.phase='after';this.attackTarget=null;this.target=null;this.waypoints=[];this.emit('victory');}
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
  for(const unit of allies)act(unit,enemyList);
  this.checkSkirmishOutcome();this._skirmishSave=(this._skirmishSave||0)+dt;
  if(this._skirmishSave>=3&&this.s.phase==='battle'){this._skirmishSave=0;this.emit('skirmishProgress');}
 }
};
