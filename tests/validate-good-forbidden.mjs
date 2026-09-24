import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import * as campaign from '../public/campaign.mjs';

// Independent authored contracts. Direct HP mutations below are boundary-test
// fixtures, not claims of manual combat, original balance or browser fidelity.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert(n>=0,id+' is registered');return n;};
const newIds=['g13_hut','g13_entry','g13_reunion','g13_captured','g13_ferry'];
const milestones=['goodForbiddenHutChecked','goodForbiddenEntryCleared','goodForbiddenReunited','goodForbiddenAmbushResolved','goodForbiddenCaptured','goodForbiddenReturnReady'];
const save=g=>copy({...g.s,questId:g.q.id}),reload=g=>new GameEngine(restoreState(save(g)));
const budget=g=>copy({coins:g.s.coins,kills:g.s.kills,level:g.s.hero.level,exp:g.s.hero.exp,maxHp:g.s.hero.maxHp,maxMp:g.s.hero.maxMp,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,skills:g.s.skills,equipment:g.s.equipment,affection:g.s.affection,moral:g.s.flags.moral,evil:g.s.flags.evil});
const noDeathFlags=g=>{for(const key of ['goodQiangweiDead','goodZhenDead','goodMeiDead','evilQiangweiDead','evilQiangweiDecision','cultPath'])assert.ok(!g.s.flags[key],'capture must not invent '+key);};
function create(id,flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.flags={...s.flags,route:'good',...flags};s.visited=[s.map];s.coins=307;s.hero.exp=19;s.inventory={silver_grass:2};s.potions=7;s.elixirs=5;
 Object.assign(s.hero,{level:30,maxHp:2600,hp:2200,maxMp:600,mp:510});const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
let stageReloads=0,travelReloads=0,legacyCases=0;const walkPaths=[];
function stage(engine){
 let g=engine;const id=g.q.id,baseline=budget(g),vitals={hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina},seen=new Set();g.beginObjective();assert.equal(g.s.phase,'staging',id+' starts its authored scene');
 for(let ticks=0;ticks<18000&&g.s.sequence;ticks++){
  assert.equal(g.q.id,id);assert.deepEqual(budget(g),baseline,'staging cannot prepay resources');assert.deepEqual({hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina},vitals,'staging cannot silently heal or drain the hero');noDeathFlags(g);
  for(const actor of g.stagingActors())if(!actor.hidden)assert(g.passable(actor.x,actor.y),id+' actor foot is walkable: '+actor.name);if(id==='g13_captured')for(const actor of g.s.sequence.actors.filter(a=>['good-zhen','good-mei','good-rose'].includes(a.id))){assert.equal(actor.pose,'stand','the captives remain living people');assert.equal(actor.bound,true);assert.equal(actor.interactive,false);}
  const sequence=g.s.sequence;if(!seen.has(sequence.step)){
   seen.add(sequence.step);const before=copy(sequence);g=reload(g);stageReloads++;
   assert.equal(g.s.sequence?.step,before.step);assert.deepEqual(g.s.sequence.cues,before.cues);assert.equal(g.s.sequence.sceneKey,before.sceneKey);
   for(const actor of before.actors){const after=g.s.sequence.actors.find(a=>a.id===actor.id);assert(after);assert.equal(!!after.bound,!!actor.bound,'captivity presentation survives reload');for(const key of ['x','y','pose','hidden'])assert.equal(after[key]??(key==='hidden'?false:undefined),actor[key]??(key==='hidden'?false:undefined));}
   g.completeQuest();assert.equal(g.q.id,id,'required staged action cannot be skipped');assert.equal(g.travel('r_mainland_dock'),false);
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' releases');assert.equal(g.s.flags['staged_'+id],true);return g;
}
function walk(engine,to){
 let g=engine;const trace=[g.s.map],baseline=budget(g),reloaded=new Set(),initialNeighbors=g.exits().filter(e=>!e.locked).map(e=>e.to);assert(g.travel(to),'route to '+to);if(g.s.map!==trace[0]){assert(initialNeighbors.includes(g.s.map),'immediate boat crossing is also an actual adjacent exit');trace.push(g.s.map);}
 for(let i=0;i<22000&&g.s.map!==to;i++){
  const from=g.s.map,before=copy(g.s.hero),neighbors=g.exits().filter(e=>!e.locked).map(e=>e.to);g.tick(.05);
  if(g.s.map!==from){assert(neighbors.includes(g.s.map),'physical adjacent crossing');trace.push(g.s.map);}else assert(g.clearSegment(before,g.s.hero),'travel does not cross scenery');
  if(g.s.map!==to&&!reloaded.has(g.s.map)&&i>15){const prior=save(g);g=reload(g);assert.equal(g.s.map,prior.map);assert.equal(g.s.hero.x,prior.hero.x);assert.equal(g.s.hero.y,prior.hero.y);assert.equal(g.q.id,prior.questId);reloaded.add(g.s.map);travelReloads++;}
  assert.deepEqual(budget(g),baseline);
 }
 assert.equal(g.s.map,to);walkPaths.push(trace);return g;
}
function kill(g,enemy){enemy.hp=0;g.markSkirmishDefeat(enemy,true);}
function clear(g){for(const enemy of g.s.enemies)kill(g,enemy);g.checkSkirmishOutcome();}
function blocked(id,flags={}){const g=create(id,flags),before=save(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.sequence,null);assert.notEqual(g.s.phase,'battle');assert.deepEqual(budget(g),budget({s:before}));}

assert.equal(freshState().campaignRevision,15);
// Immutable expected identities captured from clean 2771f1a before any insertion.
const revisionTwelve=[["a01",1],["a02",1],["a03",1],["a04",1],["a05",1],["a06",1],["a07",1],["a08",1],["a09",1],["a10",2],["a11",2],["a12",2],["a13",2],["a14",2],["a15",2],["a16",2],["a17",2],["a18",2],["a19",3],["a20",3],["a21",3],["a22",3],["a23",3],["a24",3],["a25",3],["a26",3],["a27",3],["a28",4],["a29",4],["a30",4],["a31",4],["a32",4],["a33",4],["a34",4],["a35",4],["a36",4],["a37",5],["a38",5],["a39",5],["a40",5],["a41",5],["a42",5],["a43",5],["a44",5],["a45",5],["a46",6],["a47",6],["a48",6],["a49",6],["a50",6],["a51",6],["a52",6],["a53",6],["a54",6],["a55",7],["a56",7],["a57",7],["a58",7],["a59",7],["a60",7],["a61",7],["a62",7],["a63_trial",7],["a63_zi",8],["a63",8],["a64",8],["a65",8],["a66",8],["a67",8],["a68",8],["b01",8],["b02",8],["b02_ambush",9],["b03",9],["b04",9],["b05",9],["b06",9],["b07",9],["g01",9],["g02",9],["g03",9],["g03_return",10],["g03_invitation",10],["g04",10],["g05",10],["g06",10],["g06_confide",10],["g06_inquire",10],["g06_request",10],["g06_return",10],["g06_introduce",11],["g06_rest",11],["g07",10],["g07_dawn",11],["g07_visit",11],["g07_zhen",11],["g07_apology",11],["g07_mainland",11],["g07_island",11],["g07_settle",12],["g08",10],["g08_deliver",10],["g09",10],["g10",11],["g11",11],["g12",11],["g13",11],["g14_dock_report",12],["g14_manor_battle",13],["g14",11],["g14_hanbo",13],["g14_resolve",13],["g15",11],["gCult_wudang",11],["gCult_appointment",11],["gCult_qiangwei",11],["gCult_zixuan",12],["gCult_farewell",12],["gCult_epilogue",12],["g16",12],["g17",12],["g18",12],["gTower1",12],["gTower2",12],["gTower3",12],["gTower4",13],["gTower5",13],["gTower6",13],["gTower7",13],["gTower8",13],["g19",13],["g20",13],["g21",13],["g22",13],["g23",14],["g24",14],["gBad1",14],["gBad2",14],["e01",14],["e02",14],["e03_masked_duel",14],["e03",14],["e04",14],["e04_departure",16],["e04_dream",16],["e04_homecoming",17],["e04_quarrel",17],["e04_wait",17],["e04_report",17],["e05",15],["e06",15],["e06_kill",15],["e06_refuse",15],["e06_aftermath",15],["e06_night",15],["e06_night_visit",15],["e06_escort",15],["e06_ferry",15],["e06_landing",16],["e06_first_interlude",17],["e06_rest",16],["e07_village",16],["e07_approach",16],["e07_entry",16],["e07_first",16],["e07_second",16],["e07_gate",16],["e07",16],["e08_interlude",17],["e08_island_battle",17],["e08_departure",17],["e08",17],["e08_refuse",17],["e08_kill",17],["e09_report",17],["e09_first_wake",17],["e09",17],["e09_part",18],["e09_sleepless",18],["e09_second_meeting",18],["e09_room_talk",18],["e09_morning",18],["e10_teaching",18],["e10",18],["e11",18],["e12",18],["eTower1",19],["eSwitch1",19],["eTower2",19],["eSwitch2",19],["eTower3",19],["eSwitch3",19],["eTower4",19],["eSwitch4",19],["eTower5",19],["eSwitch5",20],["eTower6",20],["eSwitch6",20],["eTower7",20],["eSwitch7",20],["eTower8",20],["eSwitch8",20],["e13",20],["e14",20]];
assert.equal(revisionTwelve.length,204);assert.deepEqual(campaign.REVISION_TWELVE_QUEST_IDS,revisionTwelve.map(([id])=>id));
for(const [id,tier] of revisionTwelve)assert.equal(QUESTS[index(id)].encounterTier??Math.max(1,Math.floor(index(id)/9)+1),tier,id+' retains prior effective encounter tier');
const entry=QUESTS[index('g13_entry')],ambush=QUESTS[index('g13')];
assert.equal(entry.skirmish.enemies.length,36);assert.equal(entry.skirmish.enemies.filter(e=>e.name==='无忧教男弟子').length,22);assert.equal(entry.skirmish.enemies.filter(e=>e.name==='无忧教女弟子').length,14);assert.deepEqual(entry.skirmish.criticalAllyIds,['good-rose']);
assert.equal(ambush.skirmish.enemies.length,53);assert.equal(ambush.skirmish.enemies.filter(e=>e.name==='无忧教男弟子').length,50);assert.equal(ambush.skirmish.enemies.filter(e=>e.name==='无忧教女弟子').length,2);assert.equal(ambush.skirmish.enemies.filter(e=>e.boss).length,1);
assert.deepEqual(ambush.skirmish.storyOutcome,{kind:'capture',allyIds:['good-zhen','good-mei','good-rose'],heroDefeat:'retry'});
for(const q of [entry,ambush]){const ids=[...q.skirmish.enemies,...q.skirmish.allies].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);assert.equal(q.xp,0);assert.equal(q.money,0);assert.equal(q.suppressBattleSupplies,true);}
for(const id of ['g13_hut','g13_entry','g13_reunion','g13','g13_captured','g13_ferry','g14_dock_report'])blocked(id);
blocked('g13_hut',{goodTestimonyHeard:true,route:'evil'});const unopened=create('g13_hut',{goodTestimonyHeard:true});assert.equal(unopened.travel('m60'),false,'no direct route to forbidden combat before checking the hut');blocked('g13',{goodForbiddenEntryCleared:true});blocked('g14_dock_report',{goodForbiddenCaptured:true});blocked('g14_dock_report',{goodForbiddenReturnReady:true});

let game=create('g12'),testimonyBudget=budget(game);game=stage(game);assert.equal(game.q.id,'g13_hut');assert.equal(game.s.flags.goodTestimonyHeard,true);assert.equal(game.s.flags.companion,'蔷薇');assert.equal(game.s.coins,testimonyBudget.coins+15);assert.equal(game.s.hero.exp,testimonyBudget.exp+65);
const testimonyReplay=reload(game);testimonyReplay.s.quest=index('g12');testimonyReplay.s.map=testimonyReplay.q.map;testimonyReplay.s.phase='talk';const testimonyPaid=budget(testimonyReplay);testimonyReplay.completeQuest();assert.deepEqual(budget(testimonyReplay),testimonyPaid);
game=walk(game,'r_good_seaside_hut');const chapterBudget=budget(game);game=stage(game);assert.equal(game.q.id,'g13_entry');assert.equal(game.s.flags.goodForbiddenHutChecked,true);assert.deepEqual(budget(game),chapterBudget);
game=walk(game,'m60');game=stage(game);assert.equal(game.s.phase,'battle');assert.equal(game.s.enemies.length,36);assert.equal(game.s.allies.length,1);assert.equal(game.s.allies[0].id,'good-rose');
for(const unit of [...game.s.enemies,...game.s.allies]){assert(game.passable(unit.x,unit.y));assert(game.findPath(unit.x,unit.y).length);}
const entryStart=save(game),idle=reload(game);for(let i=0;i<40;i++)idle.tick(.05);assert(idle.s.hero.hp>0&&idle.s.allies[0].hp>0,'first battle grants time to read and act');
// One actual cast enters the production no-per-enemy-reward branch.
const first=game.s.enemies[0];Object.assign(first,{x:game.s.hero.x+70,y:game.s.hero.y,hp:1});assert(game.cast(0));assert.equal(first.hp,0);assert.deepEqual(budget(game),chapterBudget);
for(const enemy of game.s.enemies.slice(1,10))kill(game,enemy);game.s.enemies[10].hp=71;game.s.allies[0].hp=1307;game=reload(game);assert.equal(game.s.skirmish.defeatedIds.length,10);assert.equal(game.s.enemies[10].hp,71);assert.equal(game.s.allies[0].hp,1307);
for(const enemy of game.s.enemies.slice(10,-1))kill(game,enemy);game.checkSkirmishOutcome();assert.equal(game.s.phase,'battle');game.completeQuest();assert.equal(game.q.id,'g13_entry');assert.equal(game.travel('r_good_forbidden_chamber'),false,'one enemy still seals the entrance');
for(const reason of ['hero','rose','simultaneous']){
 let failed=new GameEngine(restoreState(entryStart));if(reason==='simultaneous')for(const enemy of failed.s.enemies)kill(failed,enemy);if(reason==='hero')failed.s.hero.hp=0;else failed.s.allies[0].hp=0;failed.checkSkirmishOutcome();
 assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);assert.equal(failed.s.flags.goodForbiddenEntryCleared,undefined);failed=reload(failed);assert(failed.paused);const prior=budget(failed);assert.equal(failed.potion(),false);assert.equal(failed.elixir(),false);assert.equal(failed.cast(0),false);failed.completeQuest();assert.equal(failed.q.id,'g13_entry');failed.retry();assert.equal(failed.s.skirmish.failed,false);assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,36);assert(failed.s.allies[0].hp>0);assert.deepEqual(budget(failed),prior);
}
kill(game,game.s.enemies.at(-1));game.checkSkirmishOutcome();assert.equal(game.s.phase,'after');game.completeQuest();assert.equal(game.q.id,'g13_reunion');assert.equal(game.s.flags.goodForbiddenEntryCleared,true);assert.equal(game.travel('m40'),false,'entry victory opens inward progression, not an escape around reunion');assert.deepEqual(budget(game),chapterBudget);
game=walk(game,'r_good_forbidden_chamber');game=stage(game);assert.equal(game.q.id,'g13');assert.equal(game.s.flags.goodForbiddenReunited,true);assert.deepEqual([...game.partyNames].sort(),['纳兰真','月眉儿','蔷薇'].sort());assert.equal(new Set(game.companions.map(actor=>actor.name)).size,3);assert.deepEqual(budget(game),chapterBudget);game=walk(game,'m60');assert.equal(game.travel('m40'),false,'reunited companions must face the outer ambush before departure');game.beginObjective();assert.equal(game.s.phase,'battle');assert.equal(game.s.enemies.length,53);assert.equal(game.s.allies.length,3);const ambushStart=save(game);
for(const unit of [...game.s.enemies,...game.s.allies]){assert(game.passable(unit.x,unit.y));assert(game.findPath(unit.x,unit.y).length);}
const partialAmbush=new GameEngine(restoreState(ambushStart));for(const enemy of partialAmbush.s.enemies.slice(0,8))kill(partialAmbush,enemy);partialAmbush.s.enemies[8].hp=91;partialAmbush.s.allies.forEach((ally,i)=>ally.hp=1200+i*101);const partialReload=reload(partialAmbush);assert.equal(partialReload.s.skirmish.defeatedIds.length,8);assert.equal(partialReload.s.enemies[8].hp,91);assert.deepEqual(partialReload.s.allies.map(a=>a.hp),[1200,1301,1402]);assert.equal(partialReload.s.phase,'battle');assert.notEqual(partialReload.s.skirmish.storyResolved,'capture');assert.deepEqual(budget(partialReload),chapterBudget);
const outcomes=[];
for(const reason of ['good-zhen','good-mei','good-rose','all-clear']){
 let captured=new GameEngine(restoreState(ambushStart));const events=[];captured.onEvent=type=>events.push(type);if(reason==='all-clear')clear(captured);else{captured.s.allies.find(a=>a.id===reason).hp=0;captured.checkSkirmishOutcome();}
 assert.equal(events.filter(type=>type==='storyBattleOutcome').length,1);assert.equal(events.includes('victory'),false,'capture is not a victory announcement');assert.equal(captured.s.phase,'after');assert.equal(captured.s.skirmish.failed,false);assert.equal(captured.s.skirmish.finished,true);assert.equal(captured.s.skirmish.storyResolved,'capture');assert.deepEqual(budget(captured),chapterBudget);noDeathFlags(captured);
 if(reason!=='all-clear')assert(captured.s.enemies.some(e=>e.hp>0),'a fallen companion may end the encounter before full clear');
 captured=reload(captured);assert.equal(captured.s.skirmish.storyResolved,'capture');assert.equal(captured.s.phase,'after');assert.equal(captured.paused,false);const capturedSave=save(captured);captured.checkSkirmishOutcome();assert.deepEqual(save(captured),capturedSave,'repeated outcome checks do not mutate the settled result');captured.completeQuest();assert.equal(captured.q.id,'g13_captured');assert.equal(captured.s.flags.goodForbiddenAmbushResolved,true);assert.deepEqual(budget(captured),chapterBudget);noDeathFlags(captured);outcomes.push(reason);
 if(reason==='all-clear')game=captured;
}
// Production AI can knock a companion down without setting a death or a normal
// failure; it must call the same story outcome exactly once.
let live=new GameEngine(restoreState(ambushStart));for(const unit of [...live.s.enemies,...live.s.allies])Object.assign(unit,{attackTimer:99,skillTimer:99});const liveAlly=live.s.allies[0];liveAlly.hp=1;Object.assign(live.s.enemies[0],{x:liveAlly.x+10,y:liveAlly.y,attackTimer:0});live.tickSkirmish(.05);assert.equal(liveAlly.hp,0);assert.equal(live.s.skirmish.storyResolved,'capture');assert.equal(live.s.skirmish.failed,false);noDeathFlags(live);
for(const mode of ['hero','hero-and-companion','hero-and-all-clear']){
 let failed=new GameEngine(restoreState(ambushStart));failed.s.hero.hp=0;if(mode==='hero-and-companion')failed.s.allies[0].hp=0;if(mode==='hero-and-all-clear')for(const enemy of failed.s.enemies)kill(failed,enemy);failed.checkSkirmishOutcome();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);assert.notEqual(failed.s.skirmish.storyResolved,'capture');failed=reload(failed);assert.equal(failed.s.hero.hp,0);assert(failed.paused);failed.retry();assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,53);assert.equal(failed.s.allies.filter(e=>e.hp>0).length,3);assert.deepEqual(budget(failed),chapterBudget);
}
// Unknown, duplicate and invalid roster members are not evidence of capture.
let captureExample=new GameEngine(restoreState(ambushStart));captureExample.s.allies[0].hp=0;captureExample.checkSkirmishOutcome();const validCapture=save(captureExample);
for(const mutate of [r=>{r.allies.shift();},r=>{r.allies.push(copy(r.allies[0]));},r=>{r.allies[0].hp='0';},r=>{r.enemies.shift();},r=>{r.enemies.push(copy(r.enemies[0]));},r=>{r.enemies[0].hp='0';},r=>{r.enemies=[];r.allies=[];delete r.skirmish.clearedRoster;delete r.skirmish.storyRoster;}]){
 const raw=copy(validCapture);mutate(raw);const uncertain=new GameEngine(restoreState(raw));assert.notEqual(uncertain.s.skirmish?.storyResolved,'capture','damaged roster cannot prove capture');assert.notEqual(uncertain.s.skirmish?.finished,true);assert.equal(uncertain.s.flags.goodForbiddenAmbushResolved,undefined);uncertain.completeQuest();assert.equal(uncertain.q.id,'g13');noDeathFlags(uncertain);
}
const hiddenRoster=copy(validCapture);hiddenRoster.enemies=[];hiddenRoster.allies=[];const recoveredCapture=new GameEngine(restoreState(hiddenRoster));assert.equal(recoveredCapture.s.skirmish.storyResolved,'capture');assert.equal(recoveredCapture.s.enemies.length,53);assert.equal(recoveredCapture.s.allies.length,3);assert.equal(recoveredCapture.s.allies[0].hp,0);
const fabricated=copy(ambushStart);Object.assign(fabricated.skirmish,{finished:true,storyResolved:'capture'});const unearned=new GameEngine(restoreState(fabricated));assert.equal(unearned.s.skirmish.finished,false);assert.notEqual(unearned.s.skirmish.storyResolved,'capture');
const foreign=copy(validCapture);foreign.skirmish.questId='g13_entry';const rejected=new GameEngine(restoreState(foreign));assert.equal(rejected.s.skirmish,null);assert.notEqual(rejected.s.phase,'after');

// All four combat outcomes lead through the same physical staged departure.
game=stage(game);assert.equal(game.q.id,'g13_ferry');assert.equal(game.s.flags.goodForbiddenCaptured,true);assert.equal(game.s.flags.companion,null);noDeathFlags(game);assert.deepEqual(budget(game),chapterBudget);
game=walk(game,'m40');assert.equal(game.travel('r_mainland_dock'),false,'the return boat waits for the ferry conversation');game=stage(game);assert.equal(game.q.id,'g14_dock_report');assert.equal(game.s.flags.goodForbiddenReturnReady,true);game=walk(game,'r_mainland_dock');assert(game.requireQuestFlags());assert.deepEqual(budget(game),chapterBudget);noDeathFlags(game);
const finalBudget=budget(game);for(const id of [...newIds,'g13']){const repeated=reload(game);repeated.s.quest=index(id);repeated.s.map=repeated.q.map;repeated.s.phase='talk';repeated.beginObjective();repeated.completeQuest();assert.deepEqual(budget(repeated),finalBudget);assert.equal(repeated.s.claimedRewards.filter(q=>q===id).length,1);}

// Historical snapshots are explicit history, never fabricated new scenes or
// bonus loot. Numeric tables remain independent of the inserted product.
const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS,campaign.REVISION_NINE_QUEST_IDS,campaign.REVISION_TEN_QUEST_IDS,campaign.REVISION_ELEVEN_QUEST_IDS,revisionTwelve.map(([id])=>id)];
function historical(revision,id,{numeric=false,done=false,claimed=false,phase='talk',route='good'}={}){
 const raw=save(create(id));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf(id);assert(raw.quest>=0);if(numeric)delete raw.questId;raw.phase=phase;raw.flags={route,moral:2,evil:3,refusal_g15:2,refusal_e05:1};raw.done=done?[id]:[];raw.claimedRewards=done||claimed?[id]:[];raw.choices={g15:1,e05:1};raw.sequence=null;raw.skirmish=null;raw.enemies=[];raw.allies=[];return raw;
}
function preservedHistory(g,raw){assert.deepEqual(budget(g),budget({s:raw}));for(const key of ['hp','mp','stamina','x','y'])assert.equal(g.s.hero[key],raw.hero[key],'migration preserves hero '+key);assert.equal(g.s.map,raw.map);assert.deepEqual(g.s.done,raw.done);assert.deepEqual(g.s.claimedRewards,raw.claimedRewards);assert.deepEqual(g.s.choices,raw.choices);assert.equal(g.s.flags.refusal_g15,2);for(const id of newIds){assert(!g.s.done.includes(id));assert(!g.s.claimedRewards.includes(id));assert(!g.s.flags['staged_'+id]);}for(const flag of milestones)assert(!g.s.flags[flag]);legacyCases++;}
for(let revision=1;revision<=12;revision++)for(const numeric of [false,true]){
 for(const phase of ['talk','travel','battle','after']){const raw=historical(revision,'g13',{numeric,phase}),g=new GameEngine(restoreState(raw));preservedHistory(g,raw);assert.equal(g.q.id,'g13_hut');assert.equal(g.s.flags.goodForbiddenLegacyTestimony,true);assert(!g.s.flags.goodForbiddenLegacy);assert.equal(g.s.sequence,null);assert.equal(g.s.skirmish,null);}
 for(const id of ['g13','g14','g15']){const raw=historical(revision,id,{numeric,done:true}),g=new GameEngine(restoreState(raw));preservedHistory(g,raw);assert.equal(g.s.flags.goodForbiddenLegacy,true);assert.equal(g.q.id,id==='g13'?'g14_dock_report':id==='g15'?'g15_escape':id==='g14'&&revision<12?'g15':id);}
 for(const done of [false,true]){const raw=historical(revision,'g12',{numeric,done,claimed:true,phase:'after'}),g=new GameEngine(restoreState(raw));preservedHistory(g,raw);assert.equal(g.q.id,done?'g13_hut':'g12');assert.equal(!!g.s.flags.goodForbiddenLegacyTestimony,done);assert(!g.s.flags.goodForbiddenLegacy);assert.equal(g.s.sequence,null);}
}
// A historical reward receipt without done must still replay the testimony,
// but its role assignment cannot be omitted with the already-paid XP/cash.
for(const revision of [1,12])for(const previousCompanion of ['紫轩','纳兰真']){
 const raw=historical(revision,'g12',{claimed:true,phase:'after'});raw.flags.companion=previousCompanion;
 let continued=new GameEngine(restoreState(raw));preservedHistory(continued,raw);const paid=budget(continued);continued=stage(continued);
 assert.equal(continued.q.id,'g13_hut');assert.equal(continued.s.flags.companion,'蔷薇');assert.deepEqual(continued.partyNames,['蔷薇']);assert.deepEqual(budget(continued),paid,'replaying an already-paid testimony changes role assignment without paying again');
 continued=walk(continued,'r_good_seaside_hut');assert.deepEqual([...continued.stagingActors(),...continued.companions].filter(a=>!a.hidden&&['蔷薇','紫轩','纳兰真'].includes(a.name)).map(a=>a.name),['蔷薇']);continued=stage(continued);continued=walk(continued,'m60');continued=stage(continued);clear(continued);continued.completeQuest();continued=walk(continued,'r_good_forbidden_chamber');continued=stage(continued);
 assert.equal(continued.q.id,'g13');assert.deepEqual([...continued.partyNames].sort(),['纳兰真','月眉儿','蔷薇'].sort());assert.equal(continued.companions.length,3);assert(!continued.companions.some(a=>a.name==='紫轩'));assert.deepEqual(budget(continued),paid);
}
for(const id of ['g12','g13']){const raw=historical(12,id,{route:'evil'}),g=new GameEngine(restoreState(raw));assert.equal(g.q.id,id);assert(!g.s.flags.goodForbiddenLegacy);assert(!g.s.flags.goodForbiddenLegacyTestimony);}
const stranded=historical(12,'g13');let rescued=new GameEngine(restoreState(stranded));rescued=walk(rescued,'r_good_seaside_hut');assert.equal(rescued.q.id,'g13_hut');assert(rescued.requireQuestFlags(),'pending legacy ambush has a real backward route to the hut');
const mainland=historical(12,'g13',{phase:'travel'});mainland.map='r_mainland_dock';mainland.objectiveProgress={questId:'g13',phase:'talk',collectedIds:[]};let returned=new GameEngine(restoreState(mainland));returned=walk(returned,'r_good_seaside_hut');assert.equal(returned.q.id,'g13_hut');assert(returned.requireQuestFlags(),'legacy testimony allows the necessary return boat');
const staleParty=create('g13',{goodForbiddenReunited:true,companion:'紫轩'});assert.deepEqual(staleParty.partyNames,['蔷薇','纳兰真','月眉儿']);assert.equal(staleParty.companions.length,3);assert(!staleParty.companions.some(a=>a.name==='紫轩'),'a stale companion cannot add a fourth member to the verified reunion party');
const modern=historical(12,'g13');modern.campaignRevision=13;modern.quest=index('g13');const current=new GameEngine(restoreState(modern));assert.equal(current.q.id,'g13');assert(!current.s.flags.goodForbiddenLegacyTestimony);assert(!current.s.flags.goodForbiddenLegacy);
console.log(JSON.stringify({result:'PASS',entryEnemies:36,ambushEnemies:53,captureOutcomes:outcomes,stageReloads,travelReloads,legacyCases,walkPaths,note:'Authored engine/save/route contracts; no original gameplay or full-fidelity claim.'}));
