import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import * as campaign from '../public/campaign.mjs';

// Authored web contracts, not an original-engine or browser playthrough.
// HP edits below construct boundary states; production actions handle outcomes.
const revisionThirteen=[["a01",1],["a02",1],["a03",1],["a04",1],["a05",1],["a06",1],["a07",1],["a08",1],["a09",1],["a10",2],["a11",2],["a12",2],["a13",2],["a14",2],["a15",2],["a16",2],["a17",2],["a18",2],["a19",3],["a20",3],["a21",3],["a22",3],["a23",3],["a24",3],["a25",3],["a26",3],["a27",3],["a28",4],["a29",4],["a30",4],["a31",4],["a32",4],["a33",4],["a34",4],["a35",4],["a36",4],["a37",5],["a38",5],["a39",5],["a40",5],["a41",5],["a42",5],["a43",5],["a44",5],["a45",5],["a46",6],["a47",6],["a48",6],["a49",6],["a50",6],["a51",6],["a52",6],["a53",6],["a54",6],["a55",7],["a56",7],["a57",7],["a58",7],["a59",7],["a60",7],["a61",7],["a62",7],["a63_trial",7],["a63_zi",8],["a63",8],["a64",8],["a65",8],["a66",8],["a67",8],["a68",8],["b01",8],["b02",8],["b02_ambush",9],["b03",9],["b04",9],["b05",9],["b06",9],["b07",9],["g01",9],["g02",9],["g03",9],["g03_return",10],["g03_invitation",10],["g04",10],["g05",10],["g06",10],["g06_confide",10],["g06_inquire",10],["g06_request",10],["g06_return",10],["g06_introduce",11],["g06_rest",11],["g07",10],["g07_dawn",11],["g07_visit",11],["g07_zhen",11],["g07_apology",11],["g07_mainland",11],["g07_island",11],["g07_settle",12],["g08",10],["g08_deliver",10],["g09",10],["g10",11],["g11",11],["g12",11],["g13_hut",12],["g13_entry",12],["g13_reunion",13],["g13",11],["g13_captured",13],["g13_ferry",13],["g14_dock_report",12],["g14_manor_battle",13],["g14",11],["g14_hanbo",13],["g14_resolve",13],["g15",11],["gCult_wudang",11],["gCult_appointment",11],["gCult_qiangwei",11],["gCult_zixuan",12],["gCult_farewell",12],["gCult_epilogue",12],["g16",12],["g17",12],["g18",12],["gTower1",12],["gTower2",12],["gTower3",12],["gTower4",13],["gTower5",13],["gTower6",13],["gTower7",13],["gTower8",13],["g19",13],["g20",13],["g21",13],["g22",13],["g23",14],["g24",14],["gBad1",14],["gBad2",14],["e01",14],["e02",14],["e03_masked_duel",14],["e03",14],["e04",14],["e04_departure",16],["e04_dream",16],["e04_homecoming",17],["e04_quarrel",17],["e04_wait",17],["e04_report",17],["e05",15],["e06",15],["e06_kill",15],["e06_refuse",15],["e06_aftermath",15],["e06_night",15],["e06_night_visit",15],["e06_escort",15],["e06_ferry",15],["e06_landing",16],["e06_first_interlude",17],["e06_rest",16],["e07_village",16],["e07_approach",16],["e07_entry",16],["e07_first",16],["e07_second",16],["e07_gate",16],["e07",16],["e08_interlude",17],["e08_island_battle",17],["e08_departure",17],["e08",17],["e08_refuse",17],["e08_kill",17],["e09_report",17],["e09_first_wake",17],["e09",17],["e09_part",18],["e09_sleepless",18],["e09_second_meeting",18],["e09_room_talk",18],["e09_morning",18],["e10_teaching",18],["e10",18],["e11",18],["e12",18],["eTower1",19],["eSwitch1",19],["eTower2",19],["eSwitch2",19],["eTower3",19],["eSwitch3",19],["eTower4",19],["eSwitch4",19],["eTower5",19],["eSwitch5",20],["eTower6",20],["eSwitch6",20],["eTower7",20],["eSwitch7",20],["eTower8",20],["eSwitch8",20],["e13",20],["e14",20]];
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert(n>=0,id+' is registered');return n;};
const save=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(save(g)));
const budget=g=>copy({coins:g.s.coins,kills:g.s.kills,level:g.s.hero.level,exp:g.s.hero.exp,maxHp:g.s.hero.maxHp,maxMp:g.s.hero.maxMp,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,skills:g.s.skills,equipment:g.s.equipment,affection:g.s.affection,moral:g.s.flags.moral,evil:g.s.flags.evil});
const newIds=['g15_escape','g16_homecoming','g17_departure','g17_manor'];
const milestones=['goodRescueRefused','goodRescueHallCleared','goodRescueZiFreed','goodRescueZiSettled','goodRescueMeiBattleWon','goodRescueMeiDeparted','goodRescueManorCleared','goodRescueFortCleared'];
let stageReloads=0,travelReloads=0,legacyCases=0;const walkPaths=[];
function create(id,flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.flags={...s.flags,route:'good',...flags};s.visited=[s.map];s.coins=407;s.hero.exp=23;s.inventory={silver_grass:2};s.potions=7;s.elixirs=5;
 Object.assign(s.hero,{level:30,maxHp:10000,hp:9200,maxMp:600,mp:510});const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
function kill(g,enemy){enemy.hp=0;g.markSkirmishDefeat(enemy,true);}
function clear(g){for(const enemy of g.s.enemies)kill(g,enemy);g.checkSkirmishOutcome();}
function stage(engine,{start=true}={}){
 let g=engine;const id=g.q.id,baseline=budget(g),vitals={hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina},seen=new Set();
 if(start)g.beginObjective();assert.equal(g.s.phase,'staging',id+' starts its authored scene');
 for(let ticks=0;ticks<18000&&g.s.sequence;ticks++){
  assert.equal(g.q.id,id);assert.deepEqual(budget(g),baseline,'staging cannot prepay resources');assert.deepEqual({hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina},vitals,'staging does not heal or drain the hero');
  for(const actor of g.stagingActors())if(!actor.hidden)assert(g.passable(actor.x,actor.y),id+' actor foot is walkable: '+actor.name);
  const sequence=g.s.sequence;if(!seen.has(sequence.step)){
   seen.add(sequence.step);const before=save(g);g=reload(g);stageReloads++;
   assert.equal(g.s.phase,'staging');assert.equal(g.s.sequence?.step,before.sequence.step);assert.deepEqual(g.s.sequence.cues,before.sequence.cues);
   assert.deepEqual(g.s.enemies.map(e=>[e.id,e.hp]),before.enemies.map(e=>[e.id,e.hp]),'cinematic refresh preserves remaining combatants');
   for(const actor of before.sequence.actors){const restored=g.s.sequence.actors.find(a=>a.id===actor.id);assert(restored);for(const key of ['x','y','pose','hidden'])assert.equal(restored[key]??(key==='hidden'?false:undefined),actor[key]??(key==='hidden'?false:undefined));}
   g.completeQuest();assert.equal(g.q.id,id,'an unfinished scene cannot settle its quest');
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' releases');assert.equal(g.s.flags['staged_'+id],true);return g;
}
function walk(engine,to){
 let g=engine;const trace=[g.s.map],baseline=budget(g),startId=g.q.id,alreadyPaid=g.s.claimedRewards.includes(g.q.id),reloaded=new Set(),neighbors=g.exits().filter(e=>!e.locked).map(e=>e.to);const expected=()=>{if(startId==='g16'&&g.q.id!==startId){assert.equal(g.q.id,'g16_homecoming');assert.equal(g.s.map,'m61','the award accompanies the actual stair crossing');return alreadyPaid?baseline:{...baseline,coins:baseline.coins+15,exp:baseline.exp+65};}return baseline;};assert(g.travel(to),'route to '+to);
 if(g.s.map!==trace[0]){assert(neighbors.includes(g.s.map),'immediate travel is adjacent');trace.push(g.s.map);}
 for(let ticks=0;ticks<22000&&g.s.map!==to;ticks++){
  const from=g.s.map,before=copy(g.s.hero),available=g.exits().filter(e=>!e.locked).map(e=>e.to);g.tick(.05);
  if(g.s.map!==from){assert(available.includes(g.s.map),'physical adjacent crossing');trace.push(g.s.map);}else assert(g.clearSegment(before,g.s.hero),'movement does not cross blocked scenery');
  if(g.s.map!==to&&!reloaded.has(g.s.map)&&ticks>15){const prior=save(g);g=reload(g);assert.equal(g.s.map,prior.map);assert.equal(g.s.hero.x,prior.hero.x);assert.equal(g.s.hero.y,prior.hero.y);assert.equal(g.q.id,prior.questId);assert.deepEqual(g.s.enemies.map(e=>[e.id,e.hp]),prior.enemies.map(e=>[e.id,e.hp]));reloaded.add(g.s.map);travelReloads++;}
  assert.deepEqual(budget(g),expected());
 }
 assert.equal(g.s.map,to);assert.deepEqual(budget(g),expected());walkPaths.push(trace);return g;
}

// Frozen from commit 228a84a before revision14 registration; never derive the
// expected legacy tiers or IDs from the modified campaign at test run time.
assert.equal(revisionThirteen.length,209);
assert.equal(freshState().campaignRevision,16);
assert.deepEqual(campaign.REVISION_THIRTEEN_QUEST_IDS,revisionThirteen.map(([id])=>id));
for(const [id,tier] of revisionThirteen)assert.equal(QUESTS[index(id)].encounterTier??Math.max(1,Math.floor(index(id)/9)+1),tier,id+' retains revision13 effective encounter tier');
// Recruitment remains a three-answer transaction; only the terminal refusal
// admits the independently staged escape. Acceptance never enters this chapter.
for(const refused of [0,1,2]){
 const accepted=create('g15',{valleyRescueResolved:true});accepted.beginObjective();assert.equal(accepted.s.phase,'choice');
 for(let n=0;n<refused;n++)accepted.choose(1);
 assert(accepted.choose(0));assert.equal(accepted.q.id,'gCult_wudang');assert.equal(accepted.s.flags.goodRescueRefused,undefined);
}
let game=create('g15',{valleyRescueResolved:true}),chapterBudget=budget(game);game.beginObjective();
for(let n=1;n<=3;n++){
 assert(game.choose(1));game=reload(game);assert.equal(game.s.flags.refusal_g15,n);
 if(n<3){assert.equal(game.q.id,'g15');assert.equal(game.s.flags.goodRescueRefused,undefined);}
}
assert.equal(game.q.id,'g15_escape');assert.equal(game.s.flags.goodRescueRefused,true);assert.equal(game.s.flags.cultPath,undefined);
// Refusal awards the existing moral effect once; all rescue stages are otherwise
// audited separately against their authored reward contract when registered.
assert.equal(game.s.flags.moral,chapterBudget.moral+2);chapterBudget=budget(game);

const hall=QUESTS[index('g15_escape')],dungeon=QUESTS[index('g16')];
assert.equal(hall.map,'m61');assert.equal(hall.skirmish.enemies.length,44);assert.equal(hall.skirmish.enemies.filter(e=>e.name==='无忧教男弟子').length,43);
assert.equal(hall.skirmish.enemies.filter(e=>e.boss).length,0);assert.deepEqual(hall.skirmish.allies,[]);
assert.equal(dungeon.map,'r_good_dungeon');assert.equal(dungeon.skirmish.enemies.length,28);assert(dungeon.skirmish.enemies.every(e=>e.name==='无忧教男弟子'));
assert.deepEqual(dungeon.skirmish.allies,[]);assert.deepEqual(dungeon.rescueMission,{actorId:'rescue-zi',companion:'紫轩',exitMap:'m61'});
for(const q of [hall,dungeon]){const ids=q.skirmish.enemies.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);assert.equal(q.xp??65,q.id==='g16'?65:0);assert.equal(q.money??15,q.id==='g16'?15:0);assert.equal(q.suppressBattleSupplies,true);}
for(const [id,flags] of [['g15_escape',{}],['g16',{}],['g16_homecoming',{}],['g15_escape',{goodRescueRefused:true,route:'evil'}]]){
 const blocked=create(id,flags),before=save(blocked);blocked.beginObjective();blocked.completeQuest();assert.equal(blocked.q.id,id);assert.notEqual(blocked.s.phase,'battle');assert.equal(blocked.s.sequence,null);assert.deepEqual(budget(blocked),budget({s:before}));
}
function startFight(engine){let g=engine;g.beginObjective();if(g.s.sequence)g=stage(g,{start:false});assert.equal(g.s.phase,'battle');return g;}
game=startFight(game);assert.equal(game.s.enemies.length,44);assert.equal(game.s.allies.length,0);const hallStart=save(game);
assert.equal(game.travel('r_good_dungeon'),false,'the cellar waits for all forty-four guards');
for(const unit of game.s.enemies){assert(game.passable(unit.x,unit.y));assert(game.findPath(unit.x,unit.y).length);}
const first=game.s.enemies[0];Object.assign(first,{x:game.s.hero.x+65,y:game.s.hero.y,hp:1});assert(game.cast(0));assert.equal(first.hp,0);assert.deepEqual(budget(game),chapterBudget);
for(const enemy of game.s.enemies.slice(1,9))kill(game,enemy);game.s.enemies[9].hp=73;game=reload(game);assert.equal(game.s.skirmish.defeatedIds.length,9);assert.equal(game.s.enemies[9].hp,73);
for(const enemy of game.s.enemies.slice(9,-1))kill(game,enemy);game.checkSkirmishOutcome();assert.equal(game.s.phase,'battle');game.completeQuest();assert.equal(game.q.id,'g15_escape');assert.equal(game.s.flags.goodRescueHallCleared,undefined);
for(const simultaneous of [false,true]){
 let failed=new GameEngine(restoreState(hallStart));if(simultaneous)for(const enemy of failed.s.enemies)kill(failed,enemy);failed.s.hero.hp=0;failed.checkSkirmishOutcome();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);failed=reload(failed);assert(failed.paused);const before=budget(failed);assert.equal(failed.potion(),false);failed.completeQuest();assert.equal(failed.q.id,'g15_escape');failed.retry();assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,44);assert.deepEqual(budget(failed),before);
}
kill(game,game.s.enemies.at(-1));game.checkSkirmishOutcome();assert.equal(game.s.phase,'after');game.completeQuest();assert.equal(game.q.id,'g16');assert.equal(game.s.flags.goodRescueHallCleared,true);assert.deepEqual(budget(game),chapterBudget);
game=walk(game,'r_good_dungeon');game=startFight(game);assert.equal(game.s.enemies.length,28);const dungeonStart=save(game);assert.equal(game.startStaging(),false,'distant interaction cannot release the captive');assert.equal(game.s.sequence,null);
assert.equal(game.s.flags.goodRescueZiFreed,undefined);assert.equal(game.s.flags.staged_g16,undefined);game.completeQuest();assert.equal(game.q.id,'g16');assert.equal(game.travel('m61'),false,'unrescued purple-clad captive cannot be left behind');
function freeZi(engine){
 let g=engine;assert(g.stagingActors().some(a=>a.id==='rescue-zi'&&a.name==='紫轩'),'the captive is present in the room');const captive=g.markers.find(m=>m.kind==='rescue');assert(captive&&captive.main,'the captive has an actual rescue interaction marker');
 assert(g.approach(captive));for(let ticks=0;ticks<10000&&distance(g.s.hero,captive)>=135;ticks++)g.tick(.05);
 assert(distance(g.s.hero,captive)<135);g.target=null;g.waypoints=[];assert(g.interact(captive),'rescue uses the nearby actor interaction');assert.equal(g.s.phase,'staging');
 return stage(g,{start:false});
}
const rescueResults=[];
for(const mode of ['clear-first','rescue-with-survivors']){
 let rescued=new GameEngine(restoreState(dungeonStart));const startBudget=budget(rescued);
 if(mode==='clear-first')clear(rescued);else{for(const enemy of rescued.s.enemies.slice(0,5))kill(rescued,enemy);rescued.s.enemies[5].hp=81;rescued.checkSkirmishOutcome();}
 const beforeRescue=save(rescued);rescued=reload(rescued);assert.deepEqual(rescued.s.enemies.map(e=>[e.id,e.hp]),beforeRescue.enemies.map(e=>[e.id,e.hp]));
 rescued.completeQuest();assert.equal(rescued.q.id,'g16','clearing the cellar cannot rescue her by itself');assert.equal(rescued.s.flags.goodRescueZiFreed,undefined);assert.equal(rescued.travel('m61'),false);
 const survivors=rescued.s.enemies.filter(e=>e.hp>0).length;assert.equal(survivors,mode==='clear-first'?0:23);
 rescued=freeZi(rescued);assert.equal(rescued.q.id,'g16');assert.equal(rescued.s.flags.staged_g16,true);assert.equal(rescued.s.flags.goodRescueZiFreed,undefined);assert.deepEqual(rescued.partyNames,['紫轩']);assert.equal(rescued.companions.filter(a=>a.name==='紫轩').length,1,'freed Zi is displayed once');
 assert.equal(rescued.s.enemies.filter(e=>e.hp>0).length,survivors,'release does not delete or defeat surviving enemies');assert.deepEqual(budget(rescued),startBudget);
 if(survivors){assert.equal(rescued.s.phase,'battle');assert.equal(rescued.s.enemies[5].hp,81);}
 const released=save(rescued);rescued=reload(rescued);assert.equal(rescued.s.flags.staged_g16,true);assert.deepEqual(rescued.partyNames,['紫轩']);assert.deepEqual(rescued.s.enemies.map(e=>[e.id,e.hp]),released.enemies.map(e=>[e.id,e.hp]));
 rescued.completeQuest();assert.equal(rescued.q.id,'g16','only the real stair crossing settles rescue');assert.equal(rescued.s.flags.goodRescueZiFreed,undefined);assert.equal(rescued.finishRescueAtExit('m61'),false,'rescue cannot settle while far from the stair');assert.deepEqual(rescued.exits().filter(e=>!e.locked).map(e=>e.to),['m61']);
 if(survivors){
  for(const corrupt of [raw=>raw.enemies.pop(),raw=>raw.enemies.push(copy(raw.enemies[0])),raw=>raw.enemies[0].hp='0',raw=>{raw.enemies=[];raw.allies=[];},raw=>{raw.skirmish.questId='g15_escape';}]){
   const bad=copy(released);corrupt(bad);const damaged=new GameEngine(restoreState(bad));assert.equal(damaged.rescueReady(),false);assert.equal(damaged.travel('m61'),false);damaged.completeQuest();assert.equal(damaged.q.id,'g16');assert.equal(damaged.s.flags.goodRescueZiFreed,undefined);assert.deepEqual(budget(damaged),startBudget);
  }
  // One live production AI strike after the scene proves enemies resume. The
  // test does not manufacture a victory or clear the remaining army to escape.
  const attacked=reload(rescued),enemy=attacked.s.enemies.find(e=>e.hp>0);for(const e of attacked.s.enemies)Object.assign(e,{attackTimer:99,skillTimer:99});Object.assign(enemy,{x:attacked.s.hero.x+10,y:attacked.s.hero.y,attackTimer:0});const hp=attacked.s.hero.hp;attacked.tickSkirmish(.05);assert(attacked.s.hero.hp<hp,'living opponents continue to attack after release');assert.equal(attacked.q.id,'g16');
  let failed=reload(rescued);failed.s.hero.hp=0;failed.checkSkirmishOutcome();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.flags.staged_g16,true);assert.equal(failed.s.flags.goodRescueZiFreed,undefined);failed=reload(failed);assert(failed.paused);assert.equal(failed.s.flags.staged_g16,true);assert.equal(failed.s.hero.hp,0);assert.equal(failed.travel('m61'),false);assert.equal(failed.potion(),false);failed.completeQuest();assert.equal(failed.q.id,'g16');
  const failedBudget=budget(failed);failed.retry();assert.equal(failed.s.phase,'battle');assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,28);assert.equal(failed.s.sequence,null);assert.ok(!failed.s.flags.staged_g16);assert.ok(!failed.s.flags.goodRescueZiFreed);assert.equal(failed.partyNames.includes('紫轩'),false);assert.deepEqual(budget(failed),failedBudget);assert.equal(failed.travel('m61'),false,'retry requires saving her again');
  const retried=reload(failed);assert.equal(retried.s.enemies.filter(e=>e.hp>0).length,28);assert.equal(retried.s.flags.goodRescueZiFreed,undefined);
 }
 rescued=walk(rescued,'m61');assert.equal(rescued.q.id,'g16_homecoming');assert.equal(rescued.s.flags.goodRescueZiFreed,true);assert.equal(rescued.s.flags.companion,'紫轩');assert.equal(rescued.s.enemies.length,0,'the hall is empty on the return journey');assert.equal(rescued.s.claimedRewards.filter(id=>id==='g16').length,1);const afterRescueBudget={...startBudget,coins:startBudget.coins+15,exp:startBudget.exp+65};assert.deepEqual(budget(rescued),afterRescueBudget);
 const inside=save(rescued);rescued=reload(rescued);assert.equal(rescued.q.id,'g16_homecoming');assert.deepEqual(rescued.partyNames,['紫轩']);assert.deepEqual(rescued.s.done,inside.done);
 rescued=walk(rescued,'r_good_hanbo_hut');const itinerary=walkPaths.at(-1);assert.deepEqual(itinerary,['m61','r_good_yitian','r_hanbo_return','r_good_hanbo_hut']);assert.deepEqual(rescued.partyNames,['紫轩']);assert.equal(rescued.s.flags.goodRescueZiSettled,undefined);rescued=stage(rescued);assert.equal(rescued.s.flags.goodRescueZiSettled,true);assert.equal(rescued.s.flags.companion,null);assert.equal(rescued.partyNames.includes('紫轩'),false);assert.deepEqual(budget(rescued),afterRescueBudget);rescueResults.push(mode);if(mode==='rescue-with-survivors')game=rescued;
}
// Later encounters are separate from the earlier manor-defense chapter. Mei is
// a critical combat ally here, then leaves on her own after the survivor scene.
assert.equal(game.q.id,'g17');assert.equal(game.s.flags.goodRescueZiSettled,true);game=walk(game,'m41');assert.deepEqual(walkPaths.at(-1),['r_good_hanbo_hut','r_hanbo_return','r_good_hanbo_road','m41']);const meiBudget=budget(game);game=startFight(game);
const meiQuest=QUESTS[index('g17')];assert.equal(meiQuest.skirmish.enemies.length,27);assert.equal(meiQuest.skirmish.enemies.filter(e=>e.name==='无忧教女弟子').length,25);assert.deepEqual(meiQuest.skirmish.criticalAllyIds,['rescue-mei']);assert.equal(game.s.allies.length,1);assert.equal(game.s.allies[0].id,'rescue-mei');assert.equal(meiQuest.skirmish.storyOutcome,undefined);
const meiStart=save(game);for(const unit of [...game.s.enemies,...game.s.allies]){assert(game.passable(unit.x,unit.y));assert(game.findPath(unit.x,unit.y).length);}
const opening=reload(game);for(let n=0;n<40;n++)opening.tick(.05);assert(opening.s.hero.hp>0&&opening.s.allies[0].hp>0,'the opening allows time to read and act');
for(const mode of ['hero','mei','both-and-all-clear']){
 let failed=new GameEngine(restoreState(meiStart));if(mode==='hero')failed.s.hero.hp=0;else failed.s.allies[0].hp=0;if(mode==='both-and-all-clear'){failed.s.hero.hp=0;for(const e of failed.s.enemies)kill(failed,e);}failed.checkSkirmishOutcome();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);assert.equal(failed.s.skirmish.storyResolved,undefined);assert.equal(failed.s.flags.goodRescueMeiBattleWon,undefined);failed=reload(failed);assert(failed.paused);assert.equal(failed.travel('m49'),false);const before=budget(failed);assert.equal(failed.potion(),false);failed.completeQuest();assert.equal(failed.q.id,'g17');failed.retry();assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,27);assert(failed.s.allies[0].hp>0);assert.deepEqual(budget(failed),before);
}
for(const corrupt of [raw=>raw.allies=[],raw=>raw.allies.push(copy(raw.allies[0])),raw=>raw.allies[0].hp='0']){
 const raw=copy(meiStart);corrupt(raw);const failed=new GameEngine(restoreState(raw));assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);failed.completeQuest();assert.equal(failed.q.id,'g17');
}
for(const e of game.s.enemies.slice(0,7))kill(game,e);game.s.enemies[7].hp=92;game.s.allies[0].hp=701;game=reload(game);assert.equal(game.s.skirmish.defeatedIds.length,7);assert.equal(game.s.enemies[7].hp,92);assert.equal(game.s.allies[0].hp,701);for(const e of game.s.enemies.slice(7,-1))kill(game,e);game.checkSkirmishOutcome();game.completeQuest();assert.equal(game.q.id,'g17');assert.equal(game.s.flags.goodRescueMeiBattleWon,undefined);kill(game,game.s.enemies.at(-1));game.checkSkirmishOutcome();assert.equal(game.s.phase,'after');game.completeQuest();assert.equal(game.q.id,'g17_departure');assert.equal(game.s.flags.goodRescueMeiBattleWon,true);const meiAfter={...meiBudget,coins:meiBudget.coins+15,exp:meiBudget.exp+65};assert.deepEqual(budget(game),meiAfter);
assert.equal(game.partyNames.includes('月眉儿'),false,'rescued Mei does not become an escort');game=stage(game);assert.equal(game.s.flags.goodRescueMeiDeparted,true);assert.equal(game.s.flags.companion,null);assert.equal(game.partyNames.includes('月眉儿'),false);assert.equal(game.q.id,'g17_manor');assert.deepEqual(budget(game),meiAfter);
for(const [id,flags] of [['g17',{manorInvadersCleared:true}],['g17_manor',{manorInvadersCleared:true}],['g18',{manorInvadersCleared:true,goodRescueMeiDeparted:true}]]){
 const blocked=create(id,flags),before=budget(blocked);blocked.beginObjective();blocked.completeQuest();assert.equal(blocked.q.id,id);assert.notEqual(blocked.s.phase,'battle');assert.equal(blocked.s.sequence,null);assert.deepEqual(budget(blocked),before);
}
for(const [id,map,men,killers,flag,next] of [['g17_manor','m49',48,7,'goodRescueManorCleared','g18'],['g18','m54',50,6,'goodRescueFortCleared','gTower1']]){
 assert.equal(game.q.id,id);game=walk(game,map);if(id==='g17_manor')assert.deepEqual(walkPaths.at(-1),['m41','m49'],'returning to the manor does not traverse the private hut');if(id==='g18')assert.deepEqual(walkPaths.at(-1),['m49','r_good_dunhuang_approach','r_good_dunhuang_passage','r_good_feilong_approach','m54']);const before=budget(game);game=startFight(game);const q=game.q;assert.equal(q.skirmish.enemies.length,56);assert.equal(q.skirmish.enemies.filter(e=>e.name==='无忧教男弟子').length,men);assert.equal(q.skirmish.enemies.filter(e=>e.name==='霹雳堂杀手').length,killers);assert.equal(q.skirmish.enemies.filter(e=>e.name==='辛楚').length,id==='g17_manor'?1:0);assert.deepEqual(q.skirmish.allies,[]);assert.equal(q.suppressBattleSupplies,true);
 for(const unit of game.s.enemies){assert(game.passable(unit.x,unit.y));assert(game.findPath(unit.x,unit.y).length);}
 const battleStart=save(game),first=game.s.enemies[0];Object.assign(first,{hp:1,x:game.s.hero.x+65,y:game.s.hero.y});game.cast(0);assert.equal(first.hp,0);assert.deepEqual(budget(game),before);game=reload(game);assert.equal(game.s.enemies[0].hp,0);assert.equal(game.s.skirmish.defeatedIds.length,1);
 const failed=new GameEngine(restoreState(battleStart));failed.s.hero.hp=0;failed.checkSkirmishOutcome();assert(failed.s.skirmish.failed);failed.retry();assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,56);assert.deepEqual(budget(failed),before);
 for(const enemy of game.s.enemies.slice(1,-1))kill(game,enemy);game.checkSkirmishOutcome();game.completeQuest();assert.equal(game.q.id,id);assert.equal(game.s.flags[flag],undefined);kill(game,game.s.enemies.at(-1));game.checkSkirmishOutcome();assert.equal(game.s.phase,'after');game.completeQuest();assert.equal(game.q.id,next);assert.equal(game.s.flags[flag],true);
 const paid=id==='g18'?{...before,coins:before.coins+15,exp:before.exp+65}:before;assert.deepEqual(budget(game),paid);
}
assert.equal(game.q.id,'gTower1');assert.equal(game.s.flags.goodRescueFortCleared,true);game=walk(game,'m62');assert.deepEqual(walkPaths.at(-1),['m54','r_good_desert','m62']);
// Saved answers, progress and rewards are historical evidence. Migration may
// grant named legacy passage, but cannot invent any newly played scene or pay it.
const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS,campaign.REVISION_NINE_QUEST_IDS,campaign.REVISION_TEN_QUEST_IDS,campaign.REVISION_ELEVEN_QUEST_IDS,campaign.REVISION_TWELVE_QUEST_IDS,revisionThirteen.map(([id])=>id)];
function historical(revision,id,{numeric=false,done=false,claimed=false,phase='talk',route='good',cultPath=false}={}){
 const raw=save(create(id,{route,cultPath,valleyRescueResolved:true}));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf(id);if(numeric)delete raw.questId;
 raw.map=id==='g16'?'m61':QUESTS[index(id)].map;raw.phase=phase;raw.flags.companion='紫轩';raw.coins=643;raw.hero.exp=71;raw.hero.hp=1783;raw.hero.mp=287;raw.hero.stamina=63;raw.hero.x=701;raw.hero.y=743;raw.choices.g23=1;raw.flags.firstWoman='mei';raw.flags.refusals=2;
 if(done)raw.done=[id];if(claimed)raw.claimedRewards=[id];return raw;
}
function checkHistorical(raw,expected,legacyFlag){
 const loaded=new GameEngine(restoreState(copy(raw)));assert.equal(loaded.q.id,expected);assert.deepEqual(budget(loaded),budget({s:raw}));assert.equal(loaded.s.hero.hp,raw.hero.hp);assert.equal(loaded.s.hero.mp,raw.hero.mp);assert.equal(loaded.s.hero.stamina,raw.hero.stamina);
 assert.deepEqual(loaded.s.choices,raw.choices);assert.equal(loaded.s.flags.refusals,raw.flags.refusals);assert.equal(loaded.s.flags.firstWoman,raw.flags.firstWoman);assert.deepEqual(loaded.s.done,raw.done);assert.deepEqual(loaded.s.claimedRewards,[...new Set([...raw.done,...raw.claimedRewards])]);
 if(legacyFlag)assert.equal(loaded.s.flags[legacyFlag],true);
 for(const id of newIds){assert.equal(loaded.s.done.includes(id),false);assert.equal(loaded.s.claimedRewards.includes(id),false);assert.ok(!loaded.s.flags['staged_'+id]);}
 for(const flag of milestones)assert.equal(loaded.s.flags[flag],undefined,'migration does not manufacture earned '+flag);
 legacyCases++;return loaded;
}
for(let revision=1;revision<=13;revision++)for(const numeric of [false,true]){
 for(const phase of ['talk','battle','after'])for(const claimed of [false,true])checkHistorical(historical(revision,'g16',{numeric,phase,claimed}),'g15_escape','goodRescueLegacyRefused');
 checkHistorical(historical(revision,'g16',{numeric,done:true}),'g17','goodRescueLegacyZiSettled');
 checkHistorical(historical(revision,'g17',{numeric}),'g17','goodRescueLegacyZiSettled');
 checkHistorical(historical(revision,'g17',{numeric,done:true}),'g17_manor','goodRescueLegacyMeiDeparted');
 checkHistorical(historical(revision,'g18',{numeric,phase:'battle'}),'g17_manor','goodRescueLegacyMeiDeparted');
 checkHistorical(historical(revision,'g18',{numeric,done:true}),'gTower1','goodRescueLegacy');
 checkHistorical(historical(revision,'gTower1',{numeric}),'gTower1','goodRescueLegacy');
 checkHistorical(historical(revision,'g24',{numeric}),'g24','goodRescueLegacy');
 const terminal=historical(revision,'g15',{numeric,claimed:true,phase:'choice'});terminal.choices.g15=1;terminal.flags.refusal_g15=3;terminal.flags.moral=12;checkHistorical(terminal,'g15_escape','goodRescueLegacyRefused');
 for(const route of ['evil','cult']){
  const raw=historical(revision,'g16',{numeric,route:route==='evil'?'evil':'good',cultPath:route==='cult'}),loaded=new GameEngine(restoreState(raw));assert.equal(loaded.q.id,'g16');for(const flag of ['goodRescueLegacy','goodRescueLegacyRefused','goodRescueLegacyZiSettled','goodRescueLegacyMeiDeparted'])assert.equal(loaded.s.flags[flag],undefined);assert.deepEqual(budget(loaded),budget({s:raw}));legacyCases++;
 }
}
for(const id of ['g16','g17','g18','g24']){
 const current=save(create(id));current.phase='talk';const loaded=new GameEngine(restoreState(current));assert.equal(loaded.q.id,id);for(const flag of ['goodRescueLegacy','goodRescueLegacyRefused','goodRescueLegacyZiSettled','goodRescueLegacyMeiDeparted'])assert.equal(loaded.s.flags[flag],undefined);
}
// Already paid old g16 must still rescue and walk out, without paying its old
// 65/15 again. A saved reward receipt alone is never proof of a new rescue.
let paid=checkHistorical(historical(13,'g16',{numeric:true,claimed:true}),'g15_escape','goodRescueLegacyRefused');const paidBudget=budget(paid);paid=startFight(paid);clear(paid);paid.completeQuest();paid=walk(paid,'r_good_dungeon');paid=startFight(paid);paid=freeZi(paid);assert.equal(paid.s.flags.goodRescueZiFreed,undefined);paid=walk(paid,'m61');assert.equal(paid.s.flags.goodRescueZiFreed,true);assert.equal(paid.s.flags.companion,'紫轩');assert.deepEqual(paid.partyNames,['紫轩']);assert.deepEqual(budget(paid),paidBudget);assert.equal(paid.s.claimedRewards.filter(id=>id==='g16').length,1);
const finalBudget=budget(game);for(const id of [...newIds,'g16','g17','g18']){const repeated=reload(game);repeated.s.quest=index(id);repeated.s.map=repeated.q.map;repeated.s.phase='talk';const before=save(repeated);repeated.completeQuest();assert.deepEqual(budget(repeated),finalBudget);assert.deepEqual(repeated.s.done,before.done);assert.deepEqual(repeated.s.claimedRewards,before.claimedRewards);}
// The pre-staged cult ending used no cultPath field. Its completed acceptance
// must not acquire the opposite historical refusal or reopen the rescue route.
for(const revision of [1,3,13])for(const numeric of [false,true]){
 const raw=historical(revision,'g15',{numeric,done:true,claimed:true});delete raw.flags.cultPath;raw.ending='cult';raw.completed=true;raw.phase='complete';const loaded=new GameEngine(restoreState(raw));assert.equal(loaded.s.ending,'cult');assert.equal(loaded.s.completed,true);assert.equal(loaded.q.id,'g15');assert.equal(loaded.s.flags.goodRescueLegacyRefused,undefined);assert.deepEqual(loaded.s.done,['g15']);assert.deepEqual(loaded.s.claimedRewards,['g15']);assert.deepEqual(budget(loaded),budget({s:raw}));legacyCases++;
}
console.log(JSON.stringify({result:'PASS',hallEnemies:44,optionalDungeonEnemies:28,meiPursuers:27,manorEnemies:56,fortEnemies:56,rescueResults,stageReloads,travelReloads,legacyCases,walkPaths,checks:'independent R13 identity/tier baseline; refusal and branch gates; optional cellar combat; nearby rescue; live remainder after staging; atomic physical exit; retry restarts rescue; escorted settlement; critical Mei defeat; no escort after her departure; separate manor/fort gates; no duplicated task or per-enemy awards; old saves retain evidence without invented scenes'},null,2));
