import {QUESTS,SKILLS} from './campaign.mjs';
import {ROAD_ENCOUNTERS,roadEncounter,roadClaimKey} from './road-encounters.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const keys=new Set(Object.values(ROAD_ENCOUNTERS).flatMap(d=>d.enemies.map(e=>roadClaimKey(d.id,e.id))));
const invalidEntry=id=>({version:1,id,attempt:1,failed:true,failedReason:'incomplete-roster',rewardBlocked:true,roster:[]});
function roster(d,raw){
 if(!Array.isArray(raw)||raw.length!==d.enemies.length||new Set(raw.map(e=>e?.id)).size!==raw.length)return null;
 const result=[];
 for(const base of d.enemies){const e=raw.find(e=>e?.id===base.id);
  if(!e||e.maxHp!==base.maxHp||!finite(e.hp,0,base.maxHp)||!finite(e.x,0,1600)||!finite(e.y,0,1100))return null;
  for(const key of ['attackTimer','skillTimer','telegraph','slow','flash'])if(!finite(e[key],0,60))return null;
  const z=e.telegraphZone;if(e.telegraph>0&&(!z||z.kind!=='circle'||!finite(z.x,0,1600)||!finite(z.y,0,1100)||!finite(z.radius,1,200)))return null;
  result.push({...base,x:e.x,y:e.y,hp:e.hp,attackTimer:e.attackTimer,skillTimer:e.skillTimer,telegraph:e.telegraph,telegraphZone:e.telegraph>0?{kind:'circle',x:z.x,y:z.y,radius:z.radius}:null,slow:e.slow,flash:e.flash,direction:e.direction===1?1:-1,aggro:e.aggro===true});
 }
 return result;
}
function entry(d,raw){
 const units=roster(d,raw?.roster);
 if(raw?.version!==1||raw.id!==d.id||!units||!Number.isInteger(raw.attempt)||raw.attempt<1||typeof raw.failed!=='boolean')return null;
 return {version:1,id:d.id,attempt:Math.min(raw.attempt,999999),roster:units,failed:raw.failed,failedReason:raw.failed?(raw.failedReason==='hero'?'hero':'incomplete-roster'):null,rewardBlocked:raw.rewardBlocked===true};
}
export function restoreRoadEncounters(raw,state){
 // A bank can contain respawned actors after retry. Its current deaths alone
 // cannot reconstruct payments from earlier attempts when the ledger is lost.
 const ledgerValid=Array.isArray(raw.roadClaims)&&raw.roadClaims.every(k=>keys.has(k))&&new Set(raw.roadClaims).size===raw.roadClaims.length;
 state.roadEncounters={};state.roadClaims=[...new Set((Array.isArray(raw.roadClaims)?raw.roadClaims:[]).filter(k=>keys.has(k)))];
 const active=roadEncounter(state,QUESTS[state.quest]?.id);
 for(const d of Object.values(ROAD_ENCOUNTERS)){
  const saved=raw.roadEncounters?.[d.id],trace=(raw.campaignRevision>=19&&raw.visited?.includes(d.id))||(active?.id===d.id&&raw.enemies?.some(e=>e?.road));
  if(saved||trace){const bank=entry(d,saved)||invalidEntry(d.id);if(saved&&!ledgerValid)bank.rewardBlocked=true;state.roadEncounters[d.id]=bank;
   for(const e of bank.roster)if(e.hp===0&&!state.roadClaims.includes(roadClaimKey(d.id,e.id)))state.roadClaims.push(roadClaimKey(d.id,e.id));
  }
 }
 if(!active){if(state.enemies?.some(e=>e.road))state.enemies=[];return;}
 let bank=state.roadEncounters[active.id];
 if(raw.hero.hp<=0){bank??=(state.roadEncounters[active.id]=invalidEntry(active.id));bank.failed=true;bank.failedReason=bank.roster.length?'hero':'incomplete-roster';state.hero.hp=0;}
 if(bank){state.enemies=bank.roster;if(bank.failedReason==='hero')state.hero.hp=0;}
 state.cooldowns=SKILLS.map((skill,id)=>Math.max(0,Math.min(skill?.cooldown||0,Number(raw.cooldowns?.[id])||0)));
}
export const roadMethods={
 roadEncounter(){return roadEncounter(this.s,this.q.id);},
 roadBattle(){const d=this.roadEncounter();return d?this.s.roadEncounters?.[d.id]||null:null;},
 roadFailed(){return this.roadBattle()?.failed===true;},
 roadThreatened(){return !!this.roadEncounter()&&this.s.enemies.some(e=>e.hp>0&&(e.aggro||distance(e,this.s.hero)<e.aggroRadius));},
 roadHome(e){return this.scene.ambient?.positions?.[e.id]||this.scene.objective;},
 freshRoadRoster(d){return d.enemies.map((base,i)=>({...base,...this.nearestOpen(this.scene.ambient?.positions?.[base.id]?.x??(550+i%6*100),this.scene.ambient?.positions?.[base.id]?.y??(510+Math.floor(i/6)*65)),hp:base.maxHp,attackTimer:1.4+i%4*.25,skillTimer:3+i%5*.3,telegraph:0,telegraphZone:null,slow:0,flash:0,direction:-1,aggro:false}));},
 ensureRoadEncounter(){
  const d=this.roadEncounter();
  if(!d){if(this.s.enemies.some(e=>e.road))this.s.enemies=[];this._roadBinding=null;return false;}
  this.s.roadEncounters??={};this.s.roadClaims??=[];
  let bank=this.s.roadEncounters[d.id];
  if(!bank)bank=this.s.roadEncounters[d.id]={version:1,id:d.id,attempt:1,failed:false,failedReason:null,rewardBlocked:false,roster:this.freshRoadRoster(d)};
  if(this._roadBinding?.state!==this.s||this._roadBinding?.bank!==bank){
   for(const e of bank.roster)if(!this.passable(e.x,e.y))Object.assign(e,this.nearestOpen(e.x,e.y));
   this.s.enemies=bank.roster;this._roadBinding={state:this.s,bank};
  }
  if(this.s.hero.hp<=0&&!bank.failed)this.failRoadEncounter('hero');
  if(bank.failed)this.paused=true;
  return true;
 },
 saveRoadEncounter(){
  const d=this.roadEncounter(),bank=this.roadBattle();if(!d||!bank)return;
  // A damaged live list is not an empty/cleared road. Pause for an explicit retry.
  const valid=roster(d,this.s.enemies);if(!valid){bank.failed=true;bank.failedReason='incomplete-roster';bank.rewardBlocked=true;this.paused=true;return;}
  bank.roster=this.s.enemies;
 },
 failRoadEncounter(reason='hero'){
  const bank=this.roadBattle();if(!bank||bank.failed)return false;
  bank.failed=true;bank.failedReason=reason;if(reason==='incomplete-roster')bank.rewardBlocked=true;
  this.paused=true;this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;this.s.destination=null;this.meditating=false;this.keys.clear();this.emit('defeat');return true;
 },
 claimRoadDefeat(enemy){
  const d=this.roadEncounter(),bank=this.roadBattle(),base=d?.enemies.find(e=>e.id===enemy.id);
  if(!base||!bank||bank.failed||!bank.roster.includes(enemy)||enemy.hp!==0)return null;
  const key=roadClaimKey(d.id,enemy.id);if(this.s.roadClaims.includes(key))return null;
  this.s.roadClaims.push(key);return bank.rewardBlocked?null:{...base.reward};
 },
 retryRoadEncounter(){
  const d=this.roadEncounter(),bank=this.roadBattle();if(!d||!bank?.failed)return false;
  // Only the current road resets. Other roads and every payment receipt survive.
  Object.assign(bank,{attempt:bank.attempt+1,failed:false,failedReason:null,roster:this.freshRoadRoster(d)});
  this.s.enemies=bank.roster;this._roadBinding={state:this.s,bank};
  Object.assign(this.s.hero,this.nearestOpen(this.scene.ambient?.heroStart?.x??this.scene.spawn.x,this.scene.ambient?.heroStart?.y??this.scene.spawn.y),{hp:this.s.hero.maxHp,mp:this.s.hero.maxMp,stamina:100});
  this.s.cooldowns=SKILLS.map(()=>0);this.s.destination=null;this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;this.meditating=false;this.keys.clear();this.effects=[];this.paused=false;this.emit('roadProgress');return true;
 },
 tickRoadEncounter(dt){
  const d=this.roadEncounter(),bank=this.roadBattle(),h=this.s.hero;if(!d||!bank||bank.failed)return;
  if(!roster(d,this.s.enemies)){this.failRoadEncounter('incomplete-roster');return;}
  if(h.hp<=0){this.failRoadEncounter('hero');return;}
  for(const e of this.s.enemies){
   if(e.hp<=0)continue;
   e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);const home=this.roadHome(e),range=distance(h,e);
   if(distance(h,home)>e.leashRadius){e.aggro=false;e.telegraph=0;e.telegraphZone=null;}
   else if(range<e.aggroRadius)e.aggro=true;
   if(!e.aggro){
    const gap=distance(e,home);if(gap>8){const a=Math.atan2(home.y-e.y,home.x-e.x),x=e.x+Math.cos(a)*e.speed*dt,y=e.y+Math.sin(a)*e.speed*.72*dt;if(this.passable(x,y)){e.x=x;e.y=y;}}
    continue;
   }
   this.meditating=false;e.direction=h.x>=e.x?1:-1;
   if(e.telegraph>0){e.telegraph=Math.max(0,e.telegraph-dt);if(e.telegraph===0){const z=e.telegraphZone;if(z){this.addEffect('enemy',z.x,z.y,z.radius,'#ee7464',.5);if(this.inThreat(h,z)&&this.dashTime<=0)this.hurt(e,1.35);}e.telegraphZone=null;}continue;}
   e.skillTimer=Math.max(0,e.skillTimer-dt);
   if(e.skillTimer===0&&range<185){e.telegraph=1.1;e.skillTimer=5.5;e.telegraphZone={kind:'circle',x:h.x,y:h.y,radius:e.kind==='eagle'?65:80};continue;}
   if(range>100){const a=Math.atan2(h.y-e.y,h.x-e.x),speed=e.speed*(e.slow>0?.4:1);for(const offset of [0,.65,-.65,1.15,-1.15]){const x=e.x+Math.cos(a+offset)*speed*dt,y=e.y+Math.sin(a+offset)*speed*.72*dt;if(this.passable(x,y)){e.x=x;e.y=y;break;}}}
   e.attackTimer=Math.max(0,e.attackTimer-dt);if(e.attackTimer===0&&range<125){e.attackTimer=2.1;if(this.dashTime<=0)this.hurt(e,1);}
   if(h.hp<=0)break;
  }
  if(h.hp<=0){this.failRoadEncounter('hero');return;}
  this._roadSaveTime=(this._roadSaveTime||0)+dt;if(this._roadSaveTime>=2){this._roadSaveTime=0;this.emit('roadProgress');}
 }
};
