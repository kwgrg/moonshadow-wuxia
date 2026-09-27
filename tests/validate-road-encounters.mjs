import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GameEngine,freshState,restoreState,QUESTS,SKILLS} from '../public/runtime.mjs';
import {REVISION_EIGHTEEN_QUEST_IDS} from '../public/campaign.mjs';
import {ROAD_ENCOUNTERS,roadClaimKey} from '../public/road-encounters.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const snap=g=>{g.saveRoadEncounter();return clone({...g.s,questId:g.q.id});};
const load=g=>new GameEngine(restoreState(snap(g)));
const purse=g=>({coins:g.s.coins,exp:g.s.hero.exp,kills:g.s.kills,level:g.s.hero.level});
function game(id,map,extra={}){const s=freshState();s.quest=QUESTS.findIndex(q=>q.id===id);s.map=map;s.phase=map===QUESTS[s.quest].map?'talk':'travel';Object.assign(s.flags,{route:'good',goodMedicineFarewellReady:true,goodMedicineHutComplete:id==='g23_reunion'},extra);s.hero.level=1;s.hero.exp=0;s.hero.maxHp=1000;s.hero.hp=1000;return new GameEngine(s);}
function kill(g,index=0){for(const e of g.s.enemies)Object.assign(e,{x:1300,y:850});const e=g.s.enemies[index];Object.assign(g.s.hero,g.nearestOpen(750,730));Object.assign(e,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;assert.equal(g.cast(0),true);assert.equal(e.hp,0);return e;}
function portal(g,to){const p=g.scene.portals[to];assert(p,'real portal '+g.s.map+' > '+to);Object.assign(g.s.hero,p.exit);assert.equal(g.enterMap(to),true,'open road '+g.s.map+' > '+to);}
let persistence=0,failures=0,scope=0,travel=0,ui=0;
for(const [map,d] of Object.entries(ROAD_ENCOUNTERS)){
 let g=game(d.quests[0],map);assert.equal(g.s.campaignRevision,19);assert.equal(g.s.phase,'travel');assert.equal(g.s.enemies.length,d.enemies.length);assert.equal(g.s.allies.length,0);assert.equal(g.s.combatProgress,null);assert.equal(g.s.skirmish,null);assert.deepEqual(g.s.done,[]);
 const e=kill(g),key=roadClaimKey(map,e.id);assert.deepEqual(purse(g),{coins:150+e.reward.coins,exp:e.reward.xp,kills:1,level:1});assert(g.s.roadClaims.includes(key));assert.equal(g.s.phase,'travel');assert.deepEqual(g.s.done,[]);assert.deepEqual(g.s.claimedRewards,[]);
 const live=g.s.enemies[1];Object.assign(live,{hp:71,attackTimer:.61,skillTimer:.92,telegraph:.8,telegraphZone:{kind:'circle',x:730,y:680,radius:80},aggro:true});g.s.cooldowns[0]=.27;g.s.hero.hp=443;
 const paid=purse(g);g=load(g);assert.equal(g.s.hero.hp,443);assert.equal(g.s.enemies[0].hp,0);assert.equal(g.s.enemies[1].hp,71);assert.equal(g.s.enemies[1].attackTimer,.61);assert.equal(g.s.enemies[1].skillTimer,.92);assert.equal(g.s.enemies[1].telegraph,.8);assert.equal(g.s.cooldowns[0],.27);assert.equal(g.s.enemies,g.roadBattle().roster);assert.deepEqual(purse(g),paid);assert.equal(g.s.phase,'travel');persistence++;
 g.s.hero.hp=1;g.hurt(g.s.enemies[1],1);g.tick(.01);assert.equal(g.roadFailed(),true);assert.equal(g.paused,true);assert.equal(g.s.hero.hp,0);assert.equal(g.s.phase,'travel');const before=snap(g);assert.equal(g.cast(0),false);assert.equal(g.potion(),false);assert.equal(g.elixir(),false);assert.equal(g.travelBlocked(),true);g.completeQuest();assert.equal(g.q.id,d.quests[0]);g=load(g);assert.equal(g.roadFailed(),true);assert.equal(g.s.hero.hp,0);assert.deepEqual(purse(g),paid);assert.equal(g.retry(),true);assert.equal(g.s.phase,'travel');assert.equal(g.roadFailed(),false);assert.equal(g.roadBattle().attempt,2);kill(g);assert.deepEqual(purse(g),paid,'paid actor cannot pay again after retry');kill(g,1);assert.equal(g.s.coins,paid.coins+d.enemies[1].reward.coins);assert.equal(g.s.kills,2);failures++;
 // Loading a save between actual lethal damage and failure tick still fails.
 g=game(d.quests[0],map);g.s.hero.hp=0;g=load(g);assert.equal(g.roadFailed(),true);assert.equal(g.s.hero.hp,0);failures++;
 // Erased, partial, duplicated and negative/string-HP banks never become cleared roads.
 for(const corrupt of [raw=>delete raw.roadEncounters[map],raw=>raw.roadEncounters[map].roster.pop(),raw=>raw.roadEncounters[map].roster[1].id=raw.roadEncounters[map].roster[0].id,raw=>raw.roadEncounters[map].roster[0].hp=-1,raw=>raw.roadEncounters[map].roster[0].hp='0',raw=>raw.roadEncounters[map].roster[1].telegraphZone=null]){
  let a=game(d.quests[0],map);kill(a);a.s.visited.push(map);Object.assign(a.s.enemies[1],{telegraph:.5,telegraphZone:{kind:'circle',x:730,y:680,radius:80}});const raw=snap(a),wallet=purse(a);corrupt(raw);a=new GameEngine(restoreState(raw));assert.equal(a.roadFailed(),true);assert.equal(a.roadBattle().failedReason,'incomplete-roster');assert.deepEqual(a.s.done,[]);assert.deepEqual(purse(a),wallet);assert.equal(a.retry(),true);kill(a);kill(a,1);assert.deepEqual(purse(a),wallet,'damaged evidence cannot reopen historical reward receipts');failures++;
 }
 // A live damage to the roster also requires an explicit retry.
 g=game(d.quests[0],map);g.s.enemies.pop();g.tick(.01);assert.equal(g.roadFailed(),true);assert.equal(g.roadBattle().rewardBlocked,true);failures++;
 // All-clear remains travel, with no quest, consumable or completion award.
 g=game(d.quests[0],map);const qid=g.q.id,stock=[g.s.potions,g.s.elixirs];for(let i=0;i<d.enemies.length;i++)kill(g,i);assert.equal(g.q.id,qid);assert.equal(g.s.phase,'travel');assert.deepEqual([g.s.potions,g.s.elixirs],stock);assert.deepEqual(g.s.done,[]);const balance=purse(g);g=load(g);assert(g.s.enemies.every(e=>e.hp===0));assert.deepEqual(purse(g),balance);assert.equal(g.roadFailed(),false);persistence++;
}
// The receipt ledger owns rewards across retries. A missing or malformed
// ledger cannot be rebuilt from a valid respawned roster; preserve its combat
// state, conservatively stop rewards, and keep the road playable.
for(const [map,d] of Object.entries(ROAD_ENCOUNTERS)){
 for(const mutate of [raw=>delete raw.roadClaims,raw=>raw.roadClaims=null,raw=>raw.roadClaims={},raw=>raw.roadClaims=['unknown-road|actor'],raw=>raw.roadClaims=[42],raw=>raw.roadClaims.push('unknown'),raw=>raw.roadClaims.push(raw.roadClaims[0])]){
  let g=game(d.quests[0],map);kill(g);const wallet=purse(g);g.s.hero.hp=0;g.tick(.01);assert.equal(g.retry(),true);Object.assign(g.s.enemies[0],{hp:37,attackTimer:.73,skillTimer:1.12});g.s.hero.hp=347;g.s.cooldowns[0]=.21;const raw=snap(g),bankBefore=clone(raw.roadEncounters[map]);mutate(raw);g=new GameEngine(restoreState(raw));
  assert.deepEqual(g.roadBattle(),{...bankBefore,rewardBlocked:true},'ledger damage must preserve roster, failure and attempt');assert.equal(g.s.hero.hp,347);assert.equal(g.s.cooldowns[0],.21);assert.equal(g.roadFailed(),false);assert.equal(g.roadBattle().attempt,2);kill(g);kill(g,1);assert.deepEqual(purse(g),wallet,'a paid respawn and a previously unpaid actor cannot pay from an uncertain ledger');g=load(g);assert.equal(g.roadBattle().rewardBlocked,true);assert.deepEqual(purse(g),wallet);failures++;
 }
 // A failed checkpoint remains failed with its exact wounds and attempt.
 let g=game(d.quests[0],map);kill(g);for(const e of g.s.enemies)Object.assign(e,g.nearestOpen(e.x,e.y));g.s.enemies[1].hp=49;g.s.hero.hp=0;g.tick(.01);const raw=snap(g),bankBefore=clone(raw.roadEncounters[map]),wallet=purse(g);delete raw.roadClaims;g=new GameEngine(restoreState(raw));assert.deepEqual(g.roadBattle(),{...bankBefore,rewardBlocked:true});assert.equal(g.roadFailed(),true);assert.equal(g.s.hero.hp,0);assert.equal(g.retry(),true);kill(g);assert.deepEqual(purse(g),wallet);failures++;
 // Empty is a legitimate ledger before the first kill, even after a retry.
 g=game(d.quests[0],map);g.s.hero.hp=0;g.tick(.01);g.retry();g=load(g);assert.equal(g.roadBattle().rewardBlocked,false);const before=g.s.coins;kill(g);assert.equal(g.s.coins,before+d.enemies[0].reward.coins);persistence++;
}
for(const revision of [16,17,18]){
 const g=game('g21','m23',{goodRoseNightComplete:true}),raw=snap(g);raw.campaignRevision=revision;delete raw.roadEncounters;delete raw.roadClaims;const r=new GameEngine(restoreState(raw));assert.equal(r.s.map,'m23');assert.equal(r.q.id,'g21');assert.deepEqual(r.s.roadEncounters,{});assert.equal(r.roadFailed(),false);assert.deepEqual(purse(r),purse(g));portal(r,'r_good_medicine_edge');assert.equal(r.roadBattle().rewardBlocked,false);const coins=r.s.coins;kill(r);assert.equal(r.s.coins,coins+ROAD_ENCOUNTERS.r_good_medicine_edge.enemies[0].reward.coins);scope++;
}
// Actual physical exits work with every enemy alive and retain wounded banks.
{
 let g=game('g23','r_good_manor_outer');g.s.enemies[0].hp=41;const map=g.s.map;portal(g,'r_good_huian_pass');assert.equal(g.s.enemies.length,25);assert.equal(g.s.roadEncounters[map].roster[0].hp,41);g.s.enemies[0].hp=63;portal(g,'m41');assert.equal(g.s.enemies.length,0);assert.equal(g.roadEncounter(),null);assert.equal(g.s.phase,'travel');assert.deepEqual(g.s.done,[]);
 g.s.quest=QUESTS.findIndex(q=>q.id==='g23_reunion');g.s.flags.goodMedicineHutComplete=true;g=load(g);portal(g,'r_good_huian_pass');assert.equal(g.s.enemies[0].hp,63);portal(g,'r_good_manor_outer');assert.equal(g.s.enemies[0].hp,41);portal(g,'m49');assert.equal(g.s.enemies.length,0);assert.equal(g.s.phase,'talk');assert.equal(g.q.id,'g23_reunion');travel++;
}
{
 let g=game('g21','r_good_medicine_edge',{companions:['蔷薇'],companion:'蔷薇',goodRoseNightComplete:true});g.s.enemies[0].hp=25;portal(g,'m23');assert.equal(g.s.enemies.length,0);assert.deepEqual(g.partyNames,['蔷薇']);assert.equal(g.s.allies.length,0);portal(g,'r_good_medicine_edge');assert.equal(g.s.enemies[0].hp,25);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,30);travel++;
}
// Failures on one road do not reset any other bank. Changing chapter does not
// produce enemies in the clinic, an unrelated map or another story branch.
for(const id of ['g21','g23','g23_reunion','g24','gBad1','e14','a23'])for(const map of ['m23','m49','m17','r_good_manor_outer','r_good_huian_pass','r_good_medicine_edge']){
 const g=game(id,map,{route:id.startsWith('e')?'evil':'good',forsake:id.startsWith('gBad')});const expected=ROAD_ENCOUNTERS[map]?.quests.includes(id)&&!g.s.flags.forsake&&g.s.flags.route==='good';assert.equal(!!g.roadEncounter(),!!expected);assert.equal(g.s.enemies.length,expected?ROAD_ENCOUNTERS[map].enemies.length:0);scope++;
}
for(const flag of ['forsake','cultPath']){const g=game('g23','r_good_manor_outer',{[flag]:true});assert.equal(g.roadEncounter(),null);assert.equal(g.s.enemies.length,0);scope++;}
// Old numeric R18 saves preserve their exact quest/map, coordinates and resources.
for(const id of ['g21','g23','g23_reunion','g24','e14']){
 const base=game(id,QUESTS.find(q=>q.id===id).map,{route:id.startsWith('e')?'evil':'good'}),raw=snap(base);raw.campaignRevision=18;raw.quest=REVISION_EIGHTEEN_QUEST_IDS.indexOf(id);delete raw.questId;delete raw.roadEncounters;delete raw.roadClaims;const r=restoreState(raw);assert.equal(QUESTS[r.quest].id,id);assert.equal(r.map,raw.map);assert.equal(r.hero.x,raw.hero.x);assert.equal(r.hero.y,raw.hero.y);assert.equal(r.coins,raw.coins);assert.equal(r.campaignRevision,19);assert.deepEqual(r.roadEncounters,{});scope++;
}
// Real AI acquires the nearby hero, damages only the hero, and disengages at
// its home leash. No task flag or noncombat companion HP is introduced.
for(const [map,d] of Object.entries(ROAD_ENCOUNTERS)){
 const g=game(d.quests[0],map,{companions:['蔷薇'],companion:'蔷薇'}),e=g.s.enemies[0],home=g.roadHome(e);Object.assign(g.s.hero,g.nearestOpen(home.x,home.y));e.attackTimer=0;e.skillTimer=5;const hp=g.s.hero.hp;g.tick(.01);assert(g.s.hero.hp<hp);assert(e.aggro);assert.equal(g.s.allies.length,0);assert.deepEqual(g.partyNames,['蔷薇']);assert.deepEqual(g.s.done,[]);const far=[[300,850],[1300,450],[1300,850],[400,450]].map(([x,y])=>g.nearestOpen(x,y)).find(p=>Math.hypot(p.x-home.x,(p.y-home.y)*1.3)>e.leashRadius);assert(far);Object.assign(g.s.hero,far);g.tick(.01);assert.equal(e.aggro,false);assert.equal(e.telegraphZone,null);persistence++;
}
{
 let g=game('g23','r_good_manor_outer');g.s.enemies[0].hp=51;portal(g,'r_good_huian_pass');kill(g);g.s.hero.hp=0;g.tick(.01);const paid=purse(g);g=load(g);assert.equal(g.s.roadEncounters.r_good_manor_outer.roster[0].hp,51);assert.equal(g.retry(),true);assert.equal(g.s.roadEncounters.r_good_manor_outer.roster[0].hp,51);assert.deepEqual(purse(g),paid);failures++;
}
// The g20 overnight quest naturally changes map and must create the road bank
// before its chapter event is saved or its new background has loaded.
{
 const g=game('g20_stay',QUESTS.find(q=>q.id==='g20_stay').map,{goodRoseStayed:true});
 let chapterSave=null;g.onEvent=type=>{if(type==='chapter')chapterSave=clone({...g.s,questId:g.q.id});};assert.equal(g.startStaging(),true);for(let n=0;n<12000&&g.s.sequence;n++){if(g.stagingDefinition().steps[g.s.sequence.step]?.type==='say')g.advanceStaging();else g.tick(.05);}assert.equal(g.s.sequence,null);assert.equal(g.s.flags.staged_g20_stay,true);assert.equal(g.q.id,'g21');assert.equal(g.s.map,'r_good_medicine_edge');assert(chapterSave?.roadEncounters.r_good_medicine_edge);const r=new GameEngine(restoreState(chapterSave));assert.equal(r.roadFailed(),false);assert.equal(r.s.enemies.length,30);assert.equal(r.s.phase,'travel');travel++;
}
for(let i=0;i<REVISION_EIGHTEEN_QUEST_IDS.length;i++){
 const id=REVISION_EIGHTEEN_QUEST_IDS[i],q=QUESTS.find(q=>q.id===id),s=freshState();s.quest=i;s.campaignRevision=18;s.map=q.map;s.flags.route=q.when?.route||'good';if(id==='e10')s.skills[8]=0;if(id==='e13')s.flags.switch8=true;if(id==='e14_father')continue;
 const r=restoreState(s);assert.equal(QUESTS[r.quest].id,id,'numeric R18 identity '+id);scope++;
}
// The father checkpoint additionally requires a genuine archived dream result;
// a naked numeric identity is correctly rewound by the R18 protection.
{
 const g=game('e14_dream','r_evil_final_room',{route:'evil',evilFinalOutcome:'alone',evilFinalModel:'web-v1',evilFinalCruel:true,evilFinalSleep:true});assert.equal(g.startStaging(),true);for(let n=0;n<12000&&g.s.sequence;n++){if(g.stagingDefinition().steps[g.s.sequence.step]?.type==='say')g.advanceStaging();else g.tick(.05);}assert.equal(g.s.phase,'battle');for(const e of g.s.enemies){e.hp=0;g.claimCombatDefeat(e);}assert.equal(g.finishCombatProgress('victory'),true);assert.equal(g.settleDreamCombat(),true);assert.equal(g.q.id,'e14_father');const raw=snap(g);raw.campaignRevision=18;raw.quest=REVISION_EIGHTEEN_QUEST_IDS.indexOf('e14_father');delete raw.questId;const restored=restoreState(raw);assert.equal(QUESTS[restored.quest].id,'e14_father');assert.equal(restored.dreamCombatOutcomes.e14_dream.outcome,'victory');scope++;
}
// UI entrypoints use the same bank/failed guard as initial launch. Extraction
// executes the actual product functions; no browser/rendering claim is made.
const source=fs.readFileSync(new URL('../public/journey.js',import.meta.url),'utf8');
const functionSource=name=>{const start=source.indexOf('function '+name+'(');assert(start>=0);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?source.length:end).split('\n')[0];};
{
 const g=game('g23','r_good_manor_outer');g.s.hero.hp=0;g.tick(.01);const saved=snap(g);let writes=0,shown=0;const ctx={engine:g,restoreState,resetRuntime(){g.paused=false;},closePanel(){g.paused=false;},save(){writes++;},sceneIntro(){shown++;},toast(){}};vm.createContext(ctx);vm.runInContext(functionSource('loadState'),ctx);ctx.loadState(saved);assert.equal(g.roadFailed(),true);assert.equal(g.paused,true);assert.equal(g.s.hero.hp,0);assert.equal(writes,1);assert.equal(shown,1);ui++;
 const c={engine:g,showDefeat(){shown++;},loadStagingScene(){},toast(){}};vm.createContext(c);vm.runInContext(functionSource('track'),c);c.track();assert.equal(shown,2);ui++;
}
console.log(JSON.stringify({result:'PASS',persistence,failures,travel,scope,ui,note:'Actual engine actions and restore, not original-engine equivalence or a browser playthrough.'}));
