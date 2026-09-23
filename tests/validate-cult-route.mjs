import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';
import {getScene} from '../public/world.mjs';
import {REVISION_THREE_QUEST_IDS,REVISION_TWO_QUEST_IDS,LEGACY_QUEST_IDS} from '../public/campaign.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

// This checks independently authored route mechanics and resource invariants.
// It does not establish original-game map or animation fidelity.
const CULT=['gCult_wudang','gCult_appointment','gCult_qiangwei','gCult_zixuan','gCult_farewell','gCult_epilogue'];
const index=id=>QUESTS.findIndex(q=>q.id===id);
const clone=value=>JSON.parse(JSON.stringify(value));
const snapshot=game=>clone({...game.s,questId:game.q.id});
function create(id,flags={}){
 const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id+' must exist');s.map=QUESTS[s.quest].map;s.flags={...s.flags,route:'good',...flags};
 const game=new GameEngine(s);Object.assign(game.s.hero,game.scene.spawn);return game;
}
function matches(when,flags){return !when||(!when.route||when.route===flags.route)&&(!when.flag||!!flags[when.flag])&&(!when.not||!flags[when.not])&&!(when.notAll||[]).some(key=>flags[key]);}
function walkTo(game,map){
 if(game.s.map===map)return;
 assert.equal(game.travel(map),true,'a route to '+map+' must be available');
 for(let tick=0;tick<18000&&game.s.map!==map;tick++){
  const from=game.s.map,allowed=new Set(game.exits().filter(e=>!e.locked).map(e=>e.to));game.tick(.05);
  if(game.s.map!==from)assert.ok(allowed.has(game.s.map),'walking must only cross adjacent maps');
 }
 assert.equal(game.s.map,map,'walking must reach '+map);
}

const checkpoints={
 m61:[[845,445],[845,560],[1100,620]],
 r_cult_dungeon:[[650,610],[1020,570],[845,445],[575,655],[940,620],[830,750],[650,455],[1020,445]],
 r_cult_chamber:[[650,540],[850,525],[965,625],[1350,610],[1050,600],[845,525],[690,455]]
};
let pathChecks=0;
for(const [map,coordinates] of Object.entries(checkpoints)){
 const game=create('g15',{cultPath:true});game.s.map=map;const scene=game.scene;
 const points=[scene.spawn,...coordinates.map(([x,y])=>({x,y})),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit])];
 assert.ok(Object.keys(scene.portals).length,map+' needs real neighboring portals');
 for(const point of points)assert.equal(game.passable(point.x,point.y),true,map+' staged point/portal must be walkable');
 for(const start of points)for(const target of points){
  if(distance(start,target)<1)continue;Object.assign(game.s.hero,start);const path=game.findPath(target.x,target.y);
  assert.ok(path.length,map+' point pair must have a path');assert.ok(distance(path.at(-1),target)<35,map+' path must actually reach the target');
  let previous=start;
  for(const next of path){const steps=Math.max(1,Math.ceil(distance(previous,next)/6));for(let t=0;t<=steps;t++)assert.equal(game.passable(previous.x+(next.x-previous.x)*t/steps,previous.y+(next.y-previous.y)*t/steps),true,map+' path cannot cross a solid partition');previous=next;}
  pathChecks++;
 }
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,'arrival must not immediately retrigger its exit');
}
assert.equal(getScene('m61',MAPS.m61).kind,'hall');assert.equal(getScene('m61',MAPS.m61).art,'hall');
assert.equal(getScene('r_cult_dungeon',MAPS.r_cult_dungeon).kind,'cave');
assert.equal(getScene('r_cult_chamber',MAPS.r_cult_chamber).art,'bedroom');
// The generated dungeon has its own collision mask: the visible wall blocks its
// full footprint while the former right/south phantom obstruction is removed.
const wall=create('g15',{cultPath:true});wall.s.map='r_cult_dungeon';assert.equal(wall.scene.maskArt,'cult-dungeon');
for(const y of [430,500,580])assert.equal(wall.passable(794,y),false,'visible wall footprint blocks walking');
for(const [x,y] of [[745,500],[850,500],[850,650],[794,390],[794,625]])assert.equal(wall.passable(x,y),true,'floor beside or beyond the wall remains open');
for(const [a,b] of [[{x:745,y:500},{x:850,y:500}],[{x:745,y:390},{x:850,y:390}],[{x:745,y:625},{x:850,y:625}]]){
 Object.assign(wall.s.hero,a);const route=wall.findPath(b.x,b.y);assert.ok(route.length,'either side can be reached around the visible wall');let previous=a;
 for(const next of route){const n=Math.ceil(distance(previous,next)/5);for(let step=0;step<=n;step++)assert.equal(wall.passable(previous.x+(next.x-previous.x)*step/n,previous.y+(next.y-previous.y)*step/n),true,'wall bypass never crosses its footprint');previous=next;}
}


// Test every independent boolean combination, including cultPath=true while
// forsake=false, which all-false/all-true portal enumeration used to omit.
for(const route of ['good','evil'])for(const cultPath of [false,true])for(const forsake of [false,true]){
 const flags={route,cultPath,forsake},state={quest:QUESTS.length,flags};
 const edges=routeEdges(state,QUESTS);
 for(const edge of edges){
  assert.ok(routeNeighbors(edge.from,QUESTS).includes(edge.to),'every playable edge must have an authored or generated portal');
  assert.ok(getScene(edge.from,MAPS[edge.from]).portals[edge.to]);assert.ok(getScene(edge.to,MAPS[edge.to]).portals[edge.from]);
 }
 const cultEdges=edges.filter(edge=>[edge.from,edge.to].some(id=>id.startsWith('r_cult_')));
 assert.equal(cultEdges.length>0,route==='good'&&cultPath,'new rooms are isolated from ordinary good and evil routes');
 const eligible=QUESTS.filter(q=>matches(q.when,flags));
 for(const id of CULT)assert.equal(eligible.some(q=>q.id===id),route==='good'&&cultPath);
 if(route==='good'&&cultPath)assert.ok(!eligible.some(q=>/^g(?:16|17|18|19|2[0-4]|Tower|Bad)/.test(q.id)),'accepted route must not reenter good rescue or forsake quests');
}
// A notAll predicate requires every named flag to be false; it is not a NAND.
const fixture=[{id:'prior',map:'m1'},{id:'plain',map:'m2',when:{notAll:['cultPath','forsake']}},{id:'cult',map:'r_cult_dungeon',when:{flag:'cultPath',not:'forsake'}}];
assert.ok(!routeEdges({quest:3,flags:{cultPath:true,forsake:false}},fixture).some(e=>e.to==='m2'&&e.inferred));
assert.ok(routeNeighbors('m1',fixture).includes('r_cult_dungeon'),'mixed flag state must contribute a possible portal');

// Any accepted answer among the three offers enters the same unfinished chain.
for(let prior=0;prior<3;prior++){
 const game=create('g15');game.s.phase='choice';game.s.flags.refusal_g15=prior;game.s.flags.moral=0;
 assert.equal(game.choose(0),true);assert.equal(game.q.id,CULT[0]);assert.equal(game.s.flags.cultPath,true);assert.equal(game.s.completed,false);assert.equal(game.s.ending,null);assert.equal(game.s.flags.route,'good');assert.equal(game.s.flags.moral,0);
}
const rejected=create('g15');rejected.s.phase='choice';
for(let n=1;n<=3;n++){
 assert.equal(rejected.choose(1),true);assert.equal(rejected.s.flags.refusal_g15,n,'every refusal commits its own count');
 if(n<3){assert.equal(rejected.q.id,'g15');assert.equal(rejected.s.flags.moral,0);}
}
assert.equal(rejected.q.id,'g16');assert.ok(!rejected.s.flags.cultPath);assert.equal(rejected.s.flags.moral,2);assert.equal(rejected.s.failure,null);assert.equal(rejected.s.completed,false);

const game=create('g15');game.s.phase='choice';game.s.done=QUESTS.slice(0,index('g15')).filter(q=>matches(q.when,game.s.flags)).map(q=>q.id);game.s.claimedRewards=[...game.s.done];
assert.equal(game.choose(0),true);const itinerary=[game.q.id];
walkTo(game,game.q.map);game.beginObjective();assert.equal(game.s.phase,'battle');
assert.equal(game.s.enemies.length,39);assert.equal(game.s.allies.length,27);
assert.deepEqual({x:game.s.hero.x,y:game.s.hero.y},{x:580,y:810},'player starts behind the friendly deployment');
assert.ok(Math.min(...game.s.enemies.map(enemy=>distance(game.s.hero,enemy)))>=400,'no enemy starts in immediate striking distance');
const opening=new GameEngine(restoreState(snapshot(game)));for(let tick=0;tick<40;tick++)opening.tick(.05);
assert.ok(opening.s.hero.hp>0,'a two-second no-input window must allow the player to understand the encounter');assert.equal(opening.s.skirmish.failed,false);

assert.equal(new Set([...game.s.enemies,...game.s.allies].map(unit=>unit.id)).size,66,'all same-named units need stable distinct IDs');
for(const unit of [...game.s.enemies,...game.s.allies])assert.equal(game.passable(unit.x,unit.y),true,'every combatant begins on reachable ground');
const budget={coins:game.s.coins,exp:game.s.hero.exp,kills:game.s.kills};
// Exercise a hero kill through the real attack path and two ally-side deaths
// through the same accounting entry point used by tickSkirmish.
const first=game.s.enemies[0];first.hp=1;Object.assign(game.s.hero,{x:first.x,y:first.y+10});game.cast(0);assert.equal(first.hp,0);
for(const enemy of game.s.enemies.slice(1,3)){enemy.hp=0;assert.equal(game.markSkirmishDefeat(enemy),true);assert.equal(game.markSkirmishDefeat(enemy),false,'the same defeated unit is recorded once');}
assert.equal(game.s.skirmish.defeatedIds.length,3);assert.deepEqual({coins:game.s.coins,exp:game.s.hero.exp,kills:game.s.kills},budget,'individual skirmish deaths cannot farm progression rewards');
game.s.enemies[4].hp-=19;game.s.allies[1].hp-=23;
const partial=snapshot(game),loaded=new GameEngine(restoreState(partial));
assert.equal(loaded.s.phase,'battle');assert.deepEqual(loaded.s.skirmish.defeatedIds,partial.skirmish.defeatedIds);
assert.equal(loaded.s.cooldowns[0],partial.cooldowns[0],'a saved player attack cooldown must not reset during a persistent battle');
const malformed=clone(partial);malformed.skirmish.defeatedIds={bad:'shape'};malformed.enemies=[null,...malformed.enemies];malformed.allies=[null,...malformed.allies];
const sanitized=restoreState(malformed);assert.equal(sanitized.skirmish.finished,false);assert.equal(sanitized.skirmish.defeatedIds.length,3,'valid zero-HP units rebuild their records even when the saved ledger shape is invalid');assert.equal(sanitized.enemies.length,39);assert.equal(sanitized.allies.length,27);

assert.equal(loaded.s.enemies.filter(unit=>unit.hp>0).length,36);assert.equal(loaded.s.allies.length,27);
for(const side of ['enemies','allies'])for(const unit of loaded.s[side]){
 const before=partial[side].find(old=>old.id===unit.id);assert.equal(unit.hp,before.hp,'combatant HP survives reload');assert.equal(unit.x,before.x);assert.equal(unit.y,before.y);
}
const oldQuest=loaded.q.id;loaded.completeQuest();assert.equal(loaded.q.id,oldQuest,'three of thirty-nine defeats cannot clear the battle');
const exit=loaded.exits().find(edge=>!edge.locked);assert.ok(exit);assert.equal(loaded.travel(exit.to),false,'combat must block travel');
// Reloading during a boss wind-up must preserve the impending strike and the
// player's cooldown, rather than providing a free cancel/recast window.
const warning=create('gCult_wudang',{cultPath:true});warning.beginObjective();warning.s.hero.maxHp=10000;warning.s.hero.hp=10000;
for(const unit of [...warning.s.enemies,...warning.s.allies])Object.assign(unit,{attackTimer:99,skillTimer:99});
const warningBoss=warning.s.enemies[0];Object.assign(warning.s.hero,{x:1000,y:650});Object.assign(warningBoss,{x:1000,y:650,skillTimer:0});warning.tickSkirmish(.05);assert.ok(warningBoss.telegraph>0);
assert.equal(warning.cast(1),true);const warned=snapshot(warning),resumedWarning=new GameEngine(restoreState(warned)),resumedBoss=resumedWarning.s.enemies.find(unit=>unit.id===warningBoss.id);
assert.equal(resumedBoss.telegraph,warningBoss.telegraph);assert.deepEqual(resumedBoss.telegraphZone,warningBoss.telegraphZone);assert.equal(resumedBoss.skillTimer,warningBoss.skillTimer);
assert.equal(resumedWarning.s.cooldowns[1],warned.cooldowns[1]);const manaBefore=resumedWarning.s.hero.mp;assert.equal(resumedWarning.cast(1),false);assert.equal(resumedWarning.s.hero.mp,manaBefore);
const hpBeforeStrike=resumedWarning.s.hero.hp;for(let tick=0;tick<26;tick++)resumedWarning.tickSkirmish(.05);
assert.ok(resumedBoss.telegraph<=0);assert.equal(resumedBoss.telegraphZone,null);assert.ok(resumedWarning.s.hero.hp<hpBeforeStrike,'the restored warning must resolve into its actual attack');
// Let real faction AI exchange attacks without the hero dealing any damage.
const ai=new GameEngine(restoreState(partial));ai.s.hero.hp=10000;ai.s.hero.maxHp=10000;
const enemyHp=ai.s.enemies.reduce((sum,unit)=>sum+unit.hp,0),allyHp=ai.s.allies.reduce((sum,unit)=>sum+unit.hp,0);
for(let tick=0;tick<500&&ai.s.phase==='battle';tick++)ai.tick(.05);
assert.ok(ai.s.enemies.reduce((sum,unit)=>sum+unit.hp,0)<enemyHp,'allies must actually attack enemies');
assert.ok(ai.s.allies.reduce((sum,unit)=>sum+unit.hp,0)<allyHp,'enemies must be able to attack allied combatants');
assert.deepEqual({coins:ai.s.coins,exp:ai.s.hero.exp,kills:ai.s.kills},budget);
// Death is persistent; retry resets the whole encounter rather than preserving
// a nearly cleared roster for another reward-producing continuation.
loaded.s.hero.hp=0;loaded.checkSkirmishOutcome();assert.equal(loaded.s.skirmish.failed,true);assert.equal(loaded.paused,true);
const dead=new GameEngine(restoreState(snapshot(loaded)));assert.equal(dead.s.hero.hp,0);assert.equal(dead.paused,true);assert.equal(dead.s.skirmish.failed,true);
dead.retry();assert.equal(dead.s.phase,'battle');assert.equal(dead.s.skirmish.failed,false);assert.equal(dead.s.skirmish.defeatedIds.length,0);assert.equal(dead.s.enemies.filter(unit=>unit.hp>0).length,39);assert.equal(dead.s.allies.filter(unit=>unit.hp>0).length,27);assert.deepEqual({coins:dead.s.coins,exp:dead.s.hero.exp,kills:dead.s.kills},budget);
// A final enemy and the hero can die in the same faction tick. Live play gives
// defeat priority; reload must not reinterpret the 39 recorded deaths as a win.
const simultaneous=create('gCult_wudang',{cultPath:true});simultaneous.beginObjective();
for(const enemy of simultaneous.s.enemies.slice(0,-1)){enemy.hp=0;simultaneous.markSkirmishDefeat(enemy);}
const lastEnemy=simultaneous.s.enemies.at(-1);Object.assign(simultaneous.s.hero,{x:800,y:650,hp:1});Object.assign(lastEnemy,{x:800,y:650,hp:1,attackTimer:0,skillTimer:99});
for(const ally of simultaneous.s.allies)Object.assign(ally,{x:810,y:650,attackTimer:99,skillTimer:99});simultaneous.s.allies[0].attackTimer=0;
simultaneous.tickSkirmish(.05);assert.equal(simultaneous.s.hero.hp,0);assert.equal(simultaneous.s.skirmish.defeatedIds.length,39);assert.equal(simultaneous.s.skirmish.failed,true);assert.equal(simultaneous.s.skirmish.finished,false);
const simultaneousReload=new GameEngine(restoreState(snapshot(simultaneous)));assert.equal(simultaneousReload.s.hero.hp,0);assert.equal(simultaneousReload.paused,true);assert.equal(simultaneousReload.s.skirmish.failed,true);assert.equal(simultaneousReload.s.skirmish.finished,false);assert.equal(simultaneousReload.s.phase,'battle');
simultaneousReload.completeQuest();assert.equal(simultaneousReload.q.id,'gCult_wudang');assert.equal(simultaneousReload.potion(),false);simultaneousReload.retry();assert.equal(simultaneousReload.s.skirmish.defeatedIds.length,0);assert.equal(simultaneousReload.s.enemies.filter(unit=>unit.hp>0).length,39);
// Set up the last-clear boundary without making this regression a balance test.
for(const enemy of game.s.enemies){if(enemy.hp>0){enemy.hp=0;game.markSkirmishDefeat(enemy);}}
game.checkSkirmishOutcome();assert.equal(game.s.skirmish.finished,true);assert.equal(game.s.phase,'after');
const leader=game.s.allies.find(ally=>ally.name===game.q.npc),main=game.markers.find(marker=>marker.main);
assert.equal(main.x,leader.x);assert.equal(main.y,leader.y);assert.equal(main.npcCell,leader.npcCell,'post-battle dialogue uses the existing allied leader');

const cleared=new GameEngine(restoreState(snapshot(game)));assert.equal(cleared.s.phase,'after');assert.equal(cleared.s.skirmish.defeatedIds.length,39);
// A player may look around after the battle before speaking to the quest NPC.
// Returning from a saved adjacent map must not respawn the cleared army.
walkTo(cleared,'m61');assert.equal(cleared.s.skirmish.finished,true);
const away=new GameEngine(restoreState(snapshot(cleared)));assert.equal(away.s.map,'m61');assert.equal(away.s.skirmish.finished,true);
walkTo(away,'m5');assert.equal(away.s.phase,'after');assert.equal(away.s.skirmish.defeatedIds.length,39);assert.equal(away.s.enemies.filter(e=>e.hp>0).length,0);
away.completeQuest();assert.equal(away.q.id,'gCult_appointment');assert.equal(away.s.flags.cultWudangCleared,true);

game.completeQuest();assert.equal(game.q.id,'gCult_appointment');assert.equal(game.s.flags.cultWudangCleared,true);assert.equal(game.s.allies.length,0);assert.equal(game.s.skirmish,null);
const wonReward={potions:game.s.potions,elixirs:game.s.elixirs,coins:game.s.coins,exp:game.s.hero.exp};
const replay=new GameEngine(restoreState(snapshot(game)));replay.s.quest=index('gCult_wudang');replay.s.map='m5';replay.s.phase='after';replay.s.skirmish={questId:'gCult_wudang',defeatedIds:QUESTS[index('gCult_wudang')].skirmish.enemies.map(e=>e.id),finished:true,failed:false};replay.completeQuest();
assert.deepEqual({potions:replay.s.potions,elixirs:replay.s.elixirs,coins:replay.s.coins,exp:replay.s.hero.exp},wonReward,'a completed battle cannot pay twice');

// The scene itself cannot grant a missing predecessor flag or start early.
for(const id of CULT.slice(1)){
 const blocked=create(id,{cultPath:true});assert.ok(blocked.q.requiredFlags?.length,id+' needs a predecessor gate');
 assert.equal(blocked.startStaging(),false,id+' cannot start before its required event');blocked.beginObjective();blocked.completeQuest();
 assert.equal(blocked.q.id,id);assert.equal(blocked.s.sequence,null);assert.equal(blocked.s.completed,false);assert.ok(!blocked.s.done.includes(id));
 const premature=snapshot(blocked);premature.phase='staging';premature.sequence={questId:id,step:3,elapsed:0,cues:{},actors:[]};
 const denied=restoreState(premature);assert.equal(denied.sequence,null,'loading cannot bypass the same predecessor flag required by normal staging');assert.equal(denied.phase,'talk');assert.ok(!denied.flags['staged_'+id]);

}
let restoredSteps=0;
for(const id of CULT.slice(1)){
 assert.equal(game.q.id,id);itinerary.push(id);walkTo(game,game.q.map);
 const definition=STAGED_QUESTS[id];assert.ok(definition,id+' needs actual staging');
 // Starting a dialogue directly cannot replace any of the staged events.
 game.completeQuest();assert.equal(game.q.id,id);assert.equal(game.s.completed,false);
 game.onEvent=type=>{if(type==='stagingDialogue')game.advanceStaging();};
 assert.equal(game.startStaging(),true,id+' starts only with the previous step completed');
 const seen=new Set();
 for(let tick=0;tick<15000&&game.q.id===id&&!game.s.completed;tick++){
  if(game.s.sequence&&!seen.has(game.s.sequence.step)){
   seen.add(game.s.sequence.step);const raw=snapshot(game),restored=restoreState(raw);restoredSteps++;
   assert.equal(restored.sequence.step,raw.sequence.step);assert.deepEqual(restored.sequence.cues,raw.sequence.cues);
   for(const actor of raw.sequence.actors){const other=restored.sequence.actors.find(a=>a.id===actor.id);assert.equal(other.pose||'stand',actor.pose||'stand');assert.equal(!!other.hidden,!!actor.hidden);assert.equal(other.direction,actor.direction);}
   // Continue the live path from each restored state: this catches stale movement
   // caches, lost hidden actors and unreachable intermediate positions.
   game.s=restored;game._stagingMove=null;game._stagingPrompt=null;
   assert.equal(game.travel(Object.keys(game.scene.portals)[0]),false);
  }
  game.tick(.05);
 }
 if(id!=='gCult_epilogue'){assert.notEqual(game.q.id,id,id+' must release into the next stage');assert.equal(game.s.completed,false);}
 else assert.equal(game.s.completed,true);
}
assert.deepEqual(itinerary,CULT);assert.equal(game.s.ending,'cult');
// Completed free roaming still uses real adjacent exits; it must not reopen the
// ending on every attempt to leave the room. Dead actors remain visible only.
walkTo(game,'r_cult_dungeon');assert.equal(game.s.ending,'cult');assert.equal(game.s.completed,true);
const bodies=game.markers.filter(marker=>marker.pose==='fallen');assert.equal(bodies.length,2);
let interactionEvents=0;game.onEvent=type=>{if(type==='interact'||type==='ending')interactionEvents++;};
for(const body of bodies){assert.equal(body.interactive,false);Object.assign(game.s.hero,{x:body.x,y:body.y});assert.equal(game.interact(body),false);}
assert.equal(interactionEvents,0);assert.ok(!game.markers.some(marker=>marker.name==='纳兰潜凛'));
walkTo(game,'r_cult_chamber');assert.equal(game.s.completed,true);assert.equal(game.s.sequence,null);

for(const flag of ['cultWudangCleared','cultAppointed','cultQiangweiDead','cultZixuanDead','cultZhenDeparted','cultMeiDeparted','cultNalanDead','cultEpilogueComplete'])assert.equal(game.s.flags[flag],true,flag+' must be committed by its own event');
for(const id of CULT)assert.equal(game.s.done.filter(done=>done===id).length,1);
assert.equal(Object.hasOwn(game.s.skills,9),false,'time-passage narration must not invent an equipable reward');
assert.deepEqual({potions:game.s.potions,elixirs:game.s.elixirs,coins:game.s.coins,exp:game.s.hero.exp},wonReward,'later authored scenes grant no incidental items, money or experience');

// Historical compressed endings stay completed. A new chain is not fabricated
// into that history, and current in-progress saves remain unfinished.
const legacy=create('g15');legacy.s.phase='complete';legacy.s.completed=true;legacy.s.ending='cult';legacy.s.done=['g15'];legacy.s.claimedRewards=['g15'];
const old=snapshot(legacy);old.campaignRevision=3;const history=restoreState(old);assert.equal(history.completed,true);assert.equal(history.ending,'cult');assert.ok(!history.done.some(id=>CULT.includes(id)));
const current=restoreState(partial);assert.equal(current.completed,false);assert.equal(current.ending,null);assert.equal(QUESTS[current.quest].id,'gCult_wudang');
let migratedIndices=0;
for(const [revision,ids] of [[1,LEGACY_QUEST_IDS],[2,REVISION_TWO_QUEST_IDS],[3,REVISION_THREE_QUEST_IDS]])for(const id of ['g15','g16','e07','e14']){
 const raw=snapshot(create(id));delete raw.questId;raw.campaignRevision=revision;raw.quest=ids.indexOf(id);assert.ok(raw.quest>=0);raw.phase='talk';
 const restored=restoreState(raw);assert.equal(QUESTS[restored.quest].id,id,'legacy index keeps its quest identity');assert.equal(restored.campaignRevision,11);migratedIndices++;
 raw.questId=id;raw.quest=0;assert.equal(QUESTS[restoreState(raw).quest].id,id,'stable questId wins over the numeric slot');
}
const rescue=snapshot(create('g16'));rescue.campaignRevision=3;rescue.done=['g15'];rescue.choices.g15=1;const continued=restoreState(rescue);assert.equal(QUESTS[continued.quest].id,'g16');assert.ok(!continued.flags.cultPath,'old rejected route does not enter accepted events');
console.log(JSON.stringify({result:'PASS',pathChecks,restoredSteps,migratedIndices,checks:'isolated branch, faction AI, persistent roster and defeat, retry, single rewards, all staged transitions, historical saves'}));
