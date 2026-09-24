// Authored persistence for ordinary encounters; skirmish owns its separate protocol.
import {QUESTS,SKILLS} from './campaign.mjs';
import {STAGED_QUESTS} from './staging.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const finite=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
export const isOrdinaryCombat=q=>!!q&&!q.skirmish&&!!(q.training||q.battleBeforeChoice||q.type==='battle'||q.type==='boss');
const entryKey=(wave,index,master)=>index!==undefined||master?'training:'+(master?'master':index):'wave:'+wave;
function descriptor(q,s,key){
 if(!isOrdinaryCombat(q))return null;
 let wave=0,index,master=false,encounter=q;
 if(q.training){
  if(key){const match=/^training:(master|\d+)$/.exec(key);if(!match)return null;master=match[1]==='master';if(!master)index=Number(match[1]);}
  else{master=!!s.training?.master;index=master?undefined:s.training?.active;if(!master&&!Number.isInteger(index))return null;}
  if(!master&&(!Number.isInteger(index)||index<0||index>=q.training.opponents))return null;
  encounter={...q,count:1,type:master?'boss':'battle',boss:master?q.boss:null,enemy:master?q.boss:'武当弟子·'+(q.training.names[index]||String(index+1)),friendly:true,scriptedLoss:master};
 }else{
  if(key){const match=/^wave:(\d+)$/.exec(key);if(!match)return null;wave=Number(match[1]);}else wave=s.wave||0;
  if(!Number.isInteger(wave)||wave<0||wave>=(q.waves?.length||1))return null;
  const w=q.waves?.[wave];if(w)encounter={...q,...w,type:w.boss?'boss':'battle',boss:w.boss||null,scriptedLoss:!!w.scriptedLoss};
 }
 const tier=q.encounterTier??Math.max(1,Math.floor(QUESTS.findIndex(x=>x.id===q.id)/9)+1),count=encounter.count||3;
 return {key:entryKey(wave,index,master),wave,index,master,encounter,tier,count};
}
function declarations(q,s,key){
 const d=descriptor(q,s,key);if(!d)return null;
 const actors=q.training?[]:(STAGED_QUESTS[q.id]?.actors||[]).filter(actor=>actor.enemy);
 const units=Array.from({length:d.count},(_,id)=>{const boss=!!(d.encounter.type==='boss'||d.encounter.boss)&&id===d.count-1;return {id,boss,maxHp:d.encounter.scriptedLoss?8000:(boss?430:120)+d.tier*(boss?125:35),role:boss?'master':d.encounter.friendly?'sword':id%3===1?'ranged':id%3===2?'brute':'sword',sprite:d.encounter.enemySprite??(d.encounter.friendly?0:3),name:actors[id]?.name||(boss?(d.encounter.boss||q.npc||'首领'):(d.encounter.enemy||'敌方武人')),tier:d.tier};});
 return {...d,units};
}
function zone(raw){
 if(raw?.kind==='circle'&&finite(raw.x,0,1600)&&finite(raw.y,0,1100)&&finite(raw.radius,1,600))return {kind:'circle',x:raw.x,y:raw.y,radius:raw.radius};
 if(raw?.kind==='line'&&['x','targetX'].every(k=>finite(raw[k],0,1600))&&['y','targetY'].every(k=>finite(raw[k],0,1100))&&finite(raw.width,1,600))return {kind:'line',x:raw.x,y:raw.y,targetX:raw.targetX,targetY:raw.targetY,width:raw.width};
 return null;
}
function roster(q,s,key,raw){
 const d=declarations(q,s,key);if(!d||!Array.isArray(raw)||raw.length!==d.count||new Set(raw.map(e=>e?.id)).size!==d.count)return null;
 const result=[];
 for(const base of d.units){const e=raw.find(e=>e?.id===base.id);if(!e||e.maxHp!==base.maxHp||!finite(e.hp,0,base.maxHp)||!finite(e.x,0,1600)||!finite(e.y,0,1100))return null;
  const timer=(k,max,fallback=0)=>Number.isFinite(e[k])?Math.max(0,Math.min(max,e[k])):fallback;
  const telegraph=timer('telegraph',10),threat=telegraph>0?zone(e.telegraphZone):null;if(telegraph>0&&!threat)return null;
  result.push({...base,x:e.x,y:e.y,hp:e.hp,attackTimer:timer('attackTimer',60),skillTimer:timer('skillTimer',60),telegraph,telegraphZone:threat,slow:timer('slow',30),flash:timer('flash',2),direction:e.direction===1?1:-1});
 }
 return result;
}
const validIds=(ids,units)=>Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>Number.isInteger(id)&&units.some(e=>e.id===id));
function validEntry(q,s,raw){
 const d=descriptor(q,s,raw?.key),units=roster(q,s,raw?.key,raw?.roster);if(!d||!units||!validIds(raw.defeatedIds,units))return null;
 const dead=units.filter(e=>e.hp===0).map(e=>e.id);if(dead.length!==raw.defeatedIds.length||dead.some(id=>!raw.defeatedIds.includes(id)))return null;
 const outcome=raw.outcome;if(!['active','victory','scripted-loss','failed'].includes(outcome))return null;
 if(outcome==='victory'&&(d.encounter.forcedOutcome==='defeat'||dead.length!==units.length||!finite(raw.heroHpAtOutcome,Number.MIN_VALUE,10000)))return null;
 if(outcome==='scripted-loss'&&(!d.encounter.scriptedLoss||raw.heroHpAtOutcome!==0))return null;
 return {key:d.key,wave:d.wave,trainingIndex:d.index??null,master:d.master,roster:units,defeatedIds:[...raw.defeatedIds],outcome,heroHpAtOutcome:outcome==='active'?null:raw.heroHpAtOutcome??null};
}
function freshProgress(q){return {version:1,questId:q.id,activeKey:null,encounters:{},failed:false,failedReason:null,finished:false,legacyPriorWaves:[],legacyTrainingWins:[]};}
const current=(q,s)=>s.combatProgress?.questId===q.id?s.combatProgress:null;
const active=(q,s)=>{const p=current(q,s);return p?.encounters?.[p.activeKey]||null;};
const resolved=e=>e?.outcome==='victory'||e?.outcome==='scripted-loss';
function hasPrior(q,s,p,d){
 if(q.training)return true;
 return Array.from({length:d.wave},(_,wave)=>wave).every(wave=>p.encounters['wave:'+wave]?resolved(validEntry(q,s,p.encounters['wave:'+wave])):p.legacyPriorWaves?.includes(wave));
}
function complete(q,s){
 if(!isOrdinaryCombat(q))return true;
 const p=current(q,s);if(!p||p.failed)return false;
 if(q.training){const master=validEntry(q,s,p.encounters['training:master']);const wins=new Set(p.legacyTrainingWins||[]);for(let i=0;i<q.training.opponents;i++){const e=validEntry(q,s,p.encounters['training:'+i]);if(e?.outcome==='victory')wins.add(i);}return !!master&&resolved(master)&&wins.size>=q.training.requiredWins;}
 const last=(q.waves?.length||1)-1,e=validEntry(q,s,p.encounters['wave:'+last]);return !!e&&resolved(e)&&hasPrior(q,s,p,descriptor(q,s,e.key));
}
function claimKeys(q){
 if(!isOrdinaryCombat(q))return [];
 const keys=q.training?[...Array.from({length:q.training.opponents},(_,i)=>'training:'+i),'training:master']:Array.from({length:q.waves?.length||1},(_,i)=>'wave:'+i);
 return keys.flatMap(key=>declarations(q,{},key).units.map(e=>q.id+'|'+key+'|enemy:'+e.id));
}
function restoreLedger(raw,s){
 const allowed=new Set(QUESTS.flatMap(claimKeys));s.combatClaims=Array.isArray(raw.combatClaims)?[...new Set(raw.combatClaims.filter(k=>allowed.has(k)))]:[];
 s.combatLegacyNoKillRewards={};for(const q of QUESTS)if(isOrdinaryCombat(q)&&raw.combatLegacyNoKillRewards?.[q.id]===true)s.combatLegacyNoKillRewards[q.id]=true;
}
function repairPhase(q,s,p){
 p.finished=complete(q,s);
 if(s.map!==q.map||s.completed||s.failure)return;
 const e=p.encounters[p.activeKey];
 if(q.training){
  const wins=new Set(p.legacyTrainingWins);for(let i=0;i<q.training.opponents;i++)if(p.encounters['training:'+i]?.outcome==='victory')wins.add(i);
  s.training={questId:q.id,defeated:[...wins].sort((a,b)=>a-b),active:null,master:false,finished:p.finished};
  if(p.finished)s.phase='after';else if(e?.outcome==='active'||p.failed){const d=descriptor(q,s,p.activeKey);s.training.active=d?.index??null;s.training.master=!!d?.master;s.phase='battle';}else s.phase='training';
 }else s.phase=p.failed?'battle':p.finished?(q.battleBeforeChoice?'choice':'after'):'battle';
 if(e?.outcome==='active'||p.failed)s.enemies=e?.roster||[];else s.enemies=[];
}
// Call after other chapter migrations and existing staging/skirmish restoration.
// This routine never awards resources or fabricates task done/claimed records.
export function restoreCombatProgress(raw,q,s){
 restoreLedger(raw,s);s.combatProgress=null;if(!isOrdinaryCombat(q)||s.done.includes(q.id)||s.completed)return;
 const saved=raw.combatProgress,strict=(raw.campaignRevision||1)>=15||(raw.combatVersion===1&&(raw.campaignRevision||1)>=14)||saved?.version===1;
 const checkpoint=raw.objectiveProgress?.questId===q.id?raw.objectiveProgress.phase:null;
 const battleTrace=['battle','after'].includes(checkpoint)||(q.battleBeforeChoice&&checkpoint==='choice')||['battle','after'].includes(raw.phase)||(q.battleBeforeChoice&&raw.phase==='choice')||(Array.isArray(raw.enemies)&&raw.enemies.length>0)||raw.hero?.hp===0||(q.training&&raw.training?.questId===q.id&&Array.isArray(raw.training.defeated)&&raw.training.defeated.length>0);
 if(saved?.version===1&&saved.questId===q.id){
  const p=freshProgress(q);let invalid=false;
  if(!saved.encounters||typeof saved.encounters!=='object'||Array.isArray(saved.encounters))invalid=true;
  else for(const [key,value] of Object.entries(saved.encounters)){const entry=validEntry(q,s,value);if(!entry||entry.key!==key){invalid=true;break;}p.encounters[key]=entry;}
  p.activeKey=typeof saved.activeKey==='string'?saved.activeKey:null;const e=p.encounters[p.activeKey];
  p.legacyPriorWaves=Array.isArray(saved.legacyPriorWaves)?[...new Set(saved.legacyPriorWaves.filter(v=>Number.isInteger(v)&&v>=0&&v<(q.waves?.length||1)))]:[];
  p.legacyTrainingWins=q.training&&Array.isArray(saved.legacyTrainingWins)?[...new Set(saved.legacyTrainingWins.filter(v=>Number.isInteger(v)&&v>=0&&v<q.training.opponents))]:[];
  if(!s.combatLegacyNoKillRewards[q.id]&&(p.legacyPriorWaves.length||p.legacyTrainingWins.length))invalid=true;
  if(e){s.wave=e.wave;if(!hasPrior(q,s,p,descriptor(q,s,e.key)))invalid=true;}else if(battleTrace||saved.failed||Object.keys(p.encounters).length)invalid=true;
  p.failed=saved.failed===true;p.failedReason=p.failed?(saved.failedReason==='hero'?'hero':'incomplete-roster'):null;
  if(!p.failed&&e?.outcome==='failed')invalid=true;
  if(raw.hero?.hp<=0&&e?.outcome!=='scripted-loss'){p.failed=true;p.failedReason='hero';s.hero.hp=0;if(e)e.outcome='failed';}
  if(invalid){p.failed=true;p.failedReason='incomplete-roster';p.finished=false;}
  s.combatProgress=p;repairPhase(q,s,p);
  s.cooldowns=SKILLS.map((skill,id)=>Math.max(0,Math.min(skill?.cooldown||0,Number(raw.cooldowns?.[id])||0)));return;
 }
 if(!battleTrace)return;
 const p=freshProgress(q);s.combatProgress=p;
 if(strict){p.failed=true;p.failedReason='incomplete-roster';if(raw.hero?.hp<=0)s.hero.hp=0;repairPhase(q,s,p);return;}
 // Historic receipts are unknowable. Suppress only this visibly pending old
 // encounter's kill awards; this flag is not a win, kill, or payment receipt.
 s.combatLegacyNoKillRewards[q.id]=true;
 if(q.training){
  const old=raw.training;s.training={questId:q.id,defeated:[],active:old?.questId===q.id&&Number.isInteger(old.active)?old.active:null,master:old?.questId===q.id&&old.master===true,finished:false};
  p.legacyTrainingWins=old?.questId===q.id&&Array.isArray(old.defeated)?[...new Set(old.defeated.filter(v=>Number.isInteger(v)&&v>=0&&v<q.training.opponents))]:raw.wave===1?Array.from({length:q.training.requiredWins},(_,i)=>i):[];
 }else s.wave=Number.isInteger(raw.wave)&&raw.wave>=0&&raw.wave<(q.waves?.length||1)?raw.wave:0;
 const d=descriptor(q,s),units=d&&roster(q,s,d.key,raw.enemies);
 if(units){
  p.activeKey=d.key;p.legacyPriorWaves=q.training?[]:Array.from({length:d.wave},(_,i)=>i);
  const defeatedIds=units.filter(e=>e.hp===0).map(e=>e.id);for(const id of defeatedIds){const key=q.id+'|'+d.key+'|enemy:'+id;if(!s.combatClaims.includes(key))s.combatClaims.push(key);}
  p.encounters[d.key]={key:d.key,wave:d.wave,trainingIndex:d.index??null,master:d.master,roster:units,defeatedIds,outcome:units.every(e=>e.hp===0)&&d.encounter.forcedOutcome!=='defeat'&&raw.hero.hp>0?'victory':'active',heroHpAtOutcome:raw.hero.hp>0?raw.hero.hp:null};
  if(raw.hero.hp<=0){p.failed=true;p.failedReason='hero';s.hero.hp=0;p.encounters[d.key].outcome='failed';}
  repairPhase(q,s,p);s.cooldowns=SKILLS.map((skill,id)=>Math.max(0,Math.min(skill?.cooldown||0,Number(raw.cooldowns?.[id])||0)));return;
 }
 s.wave=0;s.enemies=[];if(q.training){s.training.defeated=[...p.legacyTrainingWins];s.training.active=null;s.training.master=false;}
 if(raw.hero.hp<=0){p.failed=true;p.failedReason='hero';s.hero.hp=0;repairPhase(q,s,p);}else{s.phase=s.map===q.map?(q.training?'training':'talk'):'travel';if(s.objectiveProgress?.questId===q.id)s.objectiveProgress.phase=q.training?'training':'talk';}
}
export const combatMethods={
 resumeCombatEncounter(){
  if(!isOrdinaryCombat(this.q))return false;const p=current(this.q,this.s);if(!p)return false;
  if(p.failed){this.paused=true;return true;}if(p.finished){if(!complete(this.q,this.s)){this.failCombatProgress('incomplete-roster');return true;}repairPhase(this.q,this.s,p);return true;}const d=descriptor(this.q,this.s),e=d&&p.encounters[d.key];if(!e)return false;
  if(!validEntry(this.q,this.s,e)){this.failCombatProgress('incomplete-roster');return true;}
  this.s.enemies=e.roster;repairPhase(this.q,this.s,p);return true;
 },
 recordCombatStart(){
  if(!isOrdinaryCombat(this.q))return false;const d=descriptor(this.q,this.s),units=d&&roster(this.q,this.s,d.key,this.s.enemies);if(!units)return false;
  let p=current(this.q,this.s);if(!p)this.s.combatProgress=p=freshProgress(this.q);
  if(p.failed||p.encounters[d.key]||!hasPrior(this.q,this.s,p,d))return false;
  p.activeKey=d.key;p.finished=false;this.s.enemies=units;p.encounters[d.key]={key:d.key,wave:d.wave,trainingIndex:d.index??null,master:d.master,roster:units,defeatedIds:[],outcome:'active',heroHpAtOutcome:null};return true;
 },
 claimCombatDefeat(enemy){
  if(!isOrdinaryCombat(this.q))return null;const p=current(this.q,this.s),e=active(this.q,this.s),d=e&&descriptor(this.q,this.s,e.key);
  if(!p||p.failed||!e||e.outcome!=='active'||this.s.hero.hp<=0||!d||!e.roster.includes(enemy)||enemy.hp!==0||e.defeatedIds.includes(enemy.id))return null;
  if(!roster(this.q,this.s,e.key,e.roster)){this.failCombatProgress('incomplete-roster');return null;}
  e.defeatedIds.push(enemy.id);const key=this.q.id+'|'+e.key+'|enemy:'+enemy.id;this.s.combatClaims??=[];
  if(this.s.combatClaims.includes(key)||this.s.combatLegacyNoKillRewards?.[this.q.id])return null;
  this.s.combatClaims.push(key);const base=declarations(this.q,this.s,e.key).units.find(u=>u.id===enemy.id);return {coins:d.encounter.friendly?0:base.boss?80:15,xp:base.boss?100:25,kills:d.encounter.friendly?0:1};
 },
 finishCombatProgress(outcome){
  if(!isOrdinaryCombat(this.q))return false;const p=current(this.q,this.s),e=active(this.q,this.s),d=e&&descriptor(this.q,this.s,e.key);if(!p||p.failed||!e||!d)return false;
  if(outcome==='victory'&&this.s.hero.hp<=0){this.failCombatProgress('hero');return false;}
  if(e.outcome!=='active')return e.outcome===outcome&&!!validEntry(this.q,this.s,e);
  if(!validEntry(this.q,this.s,e)){this.failCombatProgress('incomplete-roster');return false;}
  if(outcome==='victory'){if(this.s.hero.hp<=0){this.failCombatProgress('hero');return false;}if(d.encounter.forcedOutcome==='defeat'||e.roster.some(u=>u.hp>0))return false;}
  else if(outcome==='scripted-loss'){if(!d.encounter.scriptedLoss||this.s.hero.hp>0)return false;}else return false;
  e.outcome=outcome;e.heroHpAtOutcome=this.s.hero.hp;p.finished=complete(this.q,this.s);return true;
 },
 failCombatProgress(reason='hero'){
  if(!isOrdinaryCombat(this.q))return false;let p=current(this.q,this.s);if(!p)this.s.combatProgress=p=freshProgress(this.q);p.failed=true;p.failedReason=reason==='hero'?'hero':'incomplete-roster';p.finished=false;const e=active(this.q,this.s);if(e){e.outcome='failed';e.heroHpAtOutcome=this.s.hero.hp;}this.paused=true;this.target=null;this.waypoints=[];this.attackTarget=null;return true;
 },
 canCompleteCombat(){return complete(this.q,this.s);},
 resetCombatAttempt(){
  if(!isOrdinaryCombat(this.q))return false;const old=current(this.q,this.s),p=freshProgress(this.q);
  if(this.q.training&&old){p.legacyTrainingWins=[...(old.legacyTrainingWins||[])];for(const [key,e] of Object.entries(old.encounters))if(key!=='training:master'&&e.outcome==='victory')p.encounters[key]=e;}
  this.s.combatProgress=p;if(!this.q.training)this.s.wave=0;return true;
 }
};
