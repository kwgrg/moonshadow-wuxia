import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {restoreSkirmish} from '../public/skirmish-runtime.mjs';

// These synthetic combat fixtures exercise authored web failure/save boundaries.
// They do not establish original-game balance, movement, or failure presentation.
const clone=value=>JSON.parse(JSON.stringify(value));
const island={id:'fixture_island',map:'fixture_village',type:'battle',title:'关键同伴战斗检查',
 skirmish:{heroStart:{x:420,y:800},criticalAllyIds:['island-mei'],
  enemies:Array.from({length:36},(_,i)=>({id:i===35?'island-bandit-chief':'island-bandit-'+String(i+1).padStart(2,'0'),
   name:i===35?'强盗头目':'强盗',boss:i===35,hp:i===35?1050:155,tier:i===35?12:8,
   npcCell:6,sprite:3,role:'sword',x:940+(i%6)*80,y:420+Math.floor(i/6)*80})),
  allies:[{id:'island-mei',name:'月眉儿',boss:true,hp:4400,npcCell:null,sprite:2,role:'sword',tier:12,x:530,y:780}]}};
const snapshot=game=>clone({...game.s,questId:game.q.id});
function fixture(quest=clone(island),start=true){
 const game=new GameEngine(freshState());
 const scene={bounds:[120,180,1460,950],spawn:{x:420,y:800},obstacles:[],portals:{}};
 Object.defineProperties(game,{q:{value:quest},scene:{value:scene},region:{value:{name:'检查战场',obstacles:[]}}});
 game.s.map=quest.map;game.s.phase='talk';Object.assign(game.s.hero,scene.spawn);
 if(start)assert.equal(game.startSkirmish(),true);
 return game;
}
function reload(raw,quest=clone(island)){
 const game=fixture(quest,false);
 game.s.hero=clone(raw.hero);game.s.hero.hp=Math.max(1,game.s.hero.hp);
 game.s.phase=raw.phase;game.s.map=raw.map;
 restoreSkirmish(raw,quest,game.s);game.paused=!!game.s.skirmish?.failed;game.repairSkirmishPositions();
 return game;
}
const kill=(game,enemy)=>{enemy.hp=0;assert.equal(game.markSkirmishDefeat(enemy),true);};
const economy=game=>({coins:game.s.coins,kills:game.s.kills,exp:game.s.hero.exp,potions:game.s.potions,elixirs:game.s.elixirs});

const deployed=fixture();
assert.equal(deployed.s.enemies.length,36);assert.equal(deployed.s.enemies.filter(e=>e.boss).length,1);
assert.equal(deployed.s.allies.length,1);assert.equal(deployed.s.allies[0].id,'island-mei');
assert.equal(deployed.s.allies[0].npcCell,null,'explicit null selects the independently drawn character atlas');
assert.equal(deployed.s.allies[0].sprite,2);assert.equal(deployed.s.allies[0].hp,4400);
const units=[...deployed.s.enemies,...deployed.s.allies];
for(const unit of units){
 assert.equal(deployed.passable(unit.x,unit.y),true);
 assert.ok(deployed.findPath(unit.x,unit.y).length,'each authored start must be reachable');
 for(const other of units)if(other!==unit)assert.ok(distance(unit,other)>=40,'deployment points must be independent');
}
const configured=clone(island);Object.assign(configured.skirmish.enemies[0],{hp:70,maxHp:110,role:'archer',tier:4,npcCell:1,sprite:0});
const custom=fixture(configured).s.enemies[0];
assert.deepEqual({hp:custom.hp,maxHp:custom.maxHp,role:custom.role,tier:custom.tier,npcCell:custom.npcCell,sprite:custom.sprite},
 {hp:70,maxHp:110,role:'archer',tier:4,npcCell:1,sprite:0});
const collision=clone(island);Object.assign(collision.skirmish.allies[0],collision.skirmish.heroStart);
assert.throws(()=>fixture(collision),/站位重叠或不可达/);
const unreachable=fixture(clone(island),false);unreachable.clearSegment=()=>false;unreachable.findPath=()=>[];
assert.throws(()=>unreachable.startSkirmish(),/站位重叠或不可达/);assert.equal(unreachable.s.skirmish,null,'invalid deployment must not half-start a battle');
const scenePositions=clone(island),positioned=scenePositions.skirmish.enemies[0];delete positioned.x;delete positioned.y;
const positionedGame=fixture(scenePositions,false);positionedGame.scene.skirmish={positions:{[positioned.id]:{x:950,y:410}}};positionedGame.startSkirmish();
assert.equal(positionedGame.s.enemies[0].x,950,'scene declarations may supply independent deployment coordinates');

const ledger=fixture(),budget=economy(ledger),first=ledger.s.enemies[0];
assert.equal(ledger.markSkirmishDefeat(first),false,'living members cannot count as defeats');
assert.equal(ledger.markSkirmishDefeat(null),false);
assert.equal(ledger.markSkirmishDefeat({...first,hp:0}),false,'a cloned ID is not the live combatant');
const outsider={...first,id:'cult-wudang-enemy-01',hp:0};ledger.s.enemies.push(outsider);
assert.equal(ledger.markSkirmishDefeat(outsider),false,'foreign roster IDs must be rejected even inside the array');ledger.s.enemies.pop();
first.hp=1;Object.assign(ledger.s.hero,{x:first.x,y:first.y+10});assert.equal(ledger.cast(0),true);assert.equal(first.hp,0);
assert.equal(ledger.markSkirmishDefeat(first),false,'defeat accounting must be idempotent');
assert.deepEqual(economy(ledger),budget,'real player kills do not grant per-enemy rewards');
ledger.s.enemies[1].hp=84;ledger.s.allies[0].hp=2910;
const partial=snapshot(ledger),preserved=reload(partial);
assert.equal(preserved.s.enemies[1].hp,84);assert.equal(preserved.s.allies[0].hp,2910);
assert.deepEqual(preserved.s.skirmish.defeatedIds,[first.id]);assert.equal(preserved.s.skirmish.finished,false);

const forged=fixture();forged.s.skirmish.defeatedIds=forged.s.enemies.map(e=>e.id);forged.checkSkirmishOutcome();
assert.equal(forged.s.skirmish.finished,false,'a kill ledger alone cannot clear living enemies');
const forgedSave=snapshot(forged);forgedSave.skirmish.finished=true;
assert.equal(reload(forgedSave).s.skirmish.finished,false,'a finished flag alone cannot clear living enemies');
const allDead=snapshot(deployed);for(const enemy of allDead.enemies)enemy.hp=0;
allDead.skirmish.defeatedIds=allDead.enemies.map(e=>e.id);allDead.skirmish.finished=true;allDead.phase='after';
assert.equal(reload(allDead).s.skirmish.finished,true,'a complete valid roster still resumes after the battle');
for(const mode of ['missing','duplicate','invalid-hp']){
 const malformed=clone(allDead),id=malformed.enemies[0].id;
 if(mode==='missing')malformed.enemies.shift();
 if(mode==='duplicate')malformed.enemies.push(clone(malformed.enemies[0]));
 if(mode==='invalid-hp')malformed.enemies[0].hp='0';
 const recovered=reload(malformed);
 assert.equal(recovered.s.skirmish.finished,false,mode+' cannot fake all-clear');
 assert.ok(recovered.s.enemies.find(e=>e.id===id).hp>0,mode+' enemy is unknown, not confirmed dead');
 assert.ok(!recovered.s.skirmish.defeatedIds.includes(id));
 assert.equal(recovered.s.enemies.length,36);assert.equal(recovered.s.phase,'battle');
}
const absent=clone(allDead);absent.enemies=[];absent.allies=[];
const emptyReload=reload(absent);assert.equal(emptyReload.s.enemies.filter(e=>e.hp>0).length,36);
assert.equal(emptyReload.s.skirmish.failed,true);assert.equal(emptyReload.s.skirmish.failedReason,'incomplete-roster');
assert.equal(emptyReload.s.skirmish.finished,false);
assert.equal(new Set(emptyReload.s.enemies.map(e=>e.x+','+e.y)).size,36,'repairing missing positions must not stack the replacement army');
for(const enemy of emptyReload.s.enemies)assert.equal(emptyReload.passable(enemy.x,enemy.y),true);
const unknown=clone(partial);unknown.enemies=[null,{id:'foreign',hp:0},...unknown.enemies];unknown.skirmish.defeatedIds=[null,'foreign',first.id,first.id];
assert.deepEqual(reload(unknown).s.skirmish.defeatedIds,[first.id]);
const foreign=clone(allDead);foreign.skirmish.questId='gCult_wudang';
const separated=reload(foreign);assert.equal(separated.s.skirmish,null);assert.equal(separated.s.phase,'talk','a different quest cannot restore an after-battle phase');

// Drive a normal enemy attack through the production AI, with the hero alive.
const fallen=fixture(),heroBefore=fallen.s.hero.hp;
for(const unit of [...fallen.s.enemies,...fallen.s.allies])Object.assign(unit,{attackTimer:99,skillTimer:99});
const mei=fallen.s.allies[0];mei.hp=1;Object.assign(fallen.s.enemies[0],{x:mei.x+10,y:mei.y,attackTimer:0});
let defeats=0;fallen.onEvent=type=>{if(type==='defeat')defeats++;};fallen.tickSkirmish(.05);
assert.equal(mei.hp,0);assert.equal(fallen.s.hero.hp,heroBefore);
assert.equal(fallen.s.skirmish.failed,true);assert.equal(fallen.s.skirmish.failedReason,'island-mei');assert.equal(fallen.paused,true);
assert.equal(fallen.startSkirmish(),false,'directly starting cannot erase persistent failure');
assert.equal(fallen.potion(),false);assert.equal(fallen.elixir(),false);assert.equal(fallen.cast(0),false);
fallen.checkSkirmishOutcome();fallen.tickSkirmish(.05);assert.equal(defeats,1,'failed battles emit one defeat event');
const deadSave=snapshot(fallen),stillDead=reload(deadSave);
assert.equal(stillDead.s.allies[0].hp,0);assert.equal(stillDead.s.hero.hp,heroBefore);assert.equal(stillDead.paused,true);
assert.equal(stillDead.s.skirmish.failedReason,'island-mei');
const unflagged=clone(deadSave);unflagged.skirmish.failed=false;assert.equal(reload(unflagged).s.skirmish.failed,true,'fallen companion HP is authoritative even if failed is missing');
const reanimated=clone(deadSave);reanimated.allies[0].hp=4400;
assert.equal(reload(reanimated).s.allies[0].hp,0,'a persisted companion failure cannot resurrect through a contradictory HP field');
const incomplete=clone(partial);incomplete.allies=[];
let uncertain=reload(incomplete);for(let i=0;i<3;i++)uncertain=reload(snapshot(uncertain));
assert.equal(uncertain.s.skirmish.failedReason,'incomplete-roster','repeated loads retain uncertainty rather than inventing a known death');
assert.equal(uncertain.s.hero.hp,partial.hero.hp);assert.equal(uncertain.s.skirmish.finished,false);
const duplicateAlly=clone(partial);duplicateAlly.allies.push(clone(duplicateAlly.allies[0]));
assert.equal(reload(duplicateAlly).s.skirmish.failedReason,'incomplete-roster');

// The rule supports any declared critical ally, not a hard-coded character ID.
const twoCritical=clone(island);twoCritical.skirmish.allies.push({id:'fixture-critical',name:'检查同伴',hp:600,x:640,y:780});twoCritical.skirmish.criticalAllyIds.push('fixture-critical');
const secondCritical=fixture(twoCritical);secondCritical.s.allies[1].hp=0;secondCritical.checkSkirmishOutcome();
assert.equal(secondCritical.s.allies[0].hp,4400);assert.equal(secondCritical.s.skirmish.failedReason,'fixture-critical');

// A synthetic additional noncritical ally lets the production faction tick
// kill the last enemy after its attack downs Mei within that exact same tick.
const sameTickQuest=clone(island);sameTickQuest.skirmish.allies.push({id:'fixture-counter',name:'检查援手',hp:600,x:640,y:780});
const sameTick=fixture(sameTickQuest);for(const enemy of sameTick.s.enemies.slice(0,-1))kill(sameTick,enemy);
const finalAttacker=sameTick.s.enemies.at(-1),criticalAlly=sameTick.s.allies[0];criticalAlly.hp=1;
Object.assign(finalAttacker,{x:540,y:780,hp:1,attackTimer:0,skillTimer:99});
Object.assign(sameTick.s.allies[1],{attackTimer:0,skillTimer:99});sameTick.tickSkirmish(.05);
assert.equal(criticalAlly.hp,0);assert.equal(finalAttacker.hp,0);assert.equal(sameTick.s.skirmish.defeatedIds.length,36);
assert.equal(sameTick.s.skirmish.failed,true);assert.equal(sameTick.s.skirmish.finished,false,'same-tick full clear cannot override a critical casualty');

// Exact same-update outcome boundary: all enemies have fallen, and so has Mei.
const simultaneous=fixture();for(const enemy of simultaneous.s.enemies)kill(simultaneous,enemy);
simultaneous.s.allies[0].hp=0;simultaneous.checkSkirmishOutcome();
assert.equal(simultaneous.s.skirmish.failed,true);assert.equal(simultaneous.s.skirmish.finished,false);assert.equal(simultaneous.s.phase,'battle');
const simultaneousReload=reload(snapshot(simultaneous));assert.equal(simultaneousReload.s.skirmish.failed,true);assert.equal(simultaneousReload.s.skirmish.finished,false);
const beforeRetry=economy(stillDead);stillDead.retry();
assert.equal(stillDead.s.skirmish.failed,false);assert.equal(stillDead.s.skirmish.defeatedIds.length,0);
assert.equal(stillDead.s.enemies.filter(e=>e.hp>0).length,36);assert.equal(stillDead.s.allies[0].hp,4400);
assert.equal(stillDead.s.hero.hp,stillDead.s.hero.maxHp);assert.equal(stillDead.s.hero.mp,stillDead.s.hero.maxMp);
assert.deepEqual(economy(stillDead),beforeRetry,'explicit full retry restores the roster without a resource payout');
assert.equal(stillDead.paused,false);
const heroDeath=fixture();heroDeath.s.hero.hp=0;heroDeath.checkSkirmishOutcome();
assert.equal(reload(snapshot(heroDeath)).s.hero.hp,0);assert.equal(heroDeath.s.skirmish.failedReason,'hero');

// Existing cult content retains its roster and noncritical ally semantics.
const cultState=freshState();cultState.quest=QUESTS.findIndex(q=>q.id==='gCult_wudang');cultState.map=QUESTS[cultState.quest].map;cultState.flags.cultPath=true;
const cult=new GameEngine(cultState);cult.startSkirmish();
assert.equal(cult.s.enemies.length,39);assert.equal(cult.s.allies.length,27);
assert.equal(cult.s.enemies[0].hp,1800);assert.equal(cult.s.enemies[2].hp,460);
assert.equal(cult.s.allies[0].hp,2600);assert.equal(cult.s.allies[1].hp,500);
assert.equal(cult.s.allies[0].npcCell,3);assert.equal(cult.s.enemies[0].npcCell,2);
cult.s.allies[0].hp=0;cult.checkSkirmishOutcome();assert.equal(cult.s.skirmish.failed,false,'ordinary cult allies are not newly made critical');
const cultReload=new GameEngine(restoreState(snapshot(cult)));assert.equal(cultReload.s.allies[0].hp,0);assert.equal(cultReload.s.skirmish.failed,false);
cult.s.hero.hp=0;cult.checkSkirmishOutcome();const cultDead=new GameEngine(restoreState(snapshot(cult)));
assert.equal(cultDead.s.hero.hp,0);assert.equal(cultDead.s.skirmish.failed,true);cultDead.retry();
assert.equal(cultDead.s.skirmish.failed,false);assert.equal(cultDead.s.enemies.length,39);assert.equal(cultDead.s.allies.filter(e=>e.hp>0).length,27);
// Historical cult saves discarded visible enemies on map changes before the
// full-roster victory snapshot existed. Require independent after-state proof.
const historical=snapshot(cult);historical.campaignRevision=7;historical.map='m61';historical.phase='travel';historical.hero.hp=100;
historical.enemies=[];historical.skirmish={questId:cult.q.id,finished:true,failed:false,defeatedIds:cult.q.skirmish.enemies.map(e=>e.id)};
historical.objectiveProgress={questId:cult.q.id,phase:'after',collectedIds:[]};
const history=new GameEngine(restoreState(historical));assert.equal(history.s.skirmish.legacyCleared,true);assert.equal(history.s.skirmish.finished,true);
assert.equal(history.s.enemies.length,0,'legacy history does not manufacture a new army or its deaths');assert.equal(history.s.skirmish.clearedRoster,undefined);
const carried=snapshot(history);carried.campaignRevision=8;carried.map=cult.q.map;carried.phase='after';
const continuedHistory=new GameEngine(restoreState(carried));assert.equal(continuedHistory.s.skirmish.legacyCleared,true);assert.equal(continuedHistory.s.phase,'after');
for(const mutation of [
 raw=>{raw.campaignRevision=8;},raw=>{raw.skirmish.finished=false;},raw=>{raw.skirmish.failed=true;},raw=>{raw.hero.hp=0;},
 raw=>{raw.objectiveProgress=null;},raw=>{raw.objectiveProgress.questId='unrelated';},raw=>{raw.objectiveProgress.phase='talk';},
 raw=>{raw.skirmish.defeatedIds.pop();},raw=>{raw.skirmish.defeatedIds[0]='foreign';},raw=>{raw.skirmish.defeatedIds[0]=raw.skirmish.defeatedIds[1];},
 raw=>{raw.flags.cultPath=false;},
]){
 const unsupported=clone(historical);mutation(unsupported);const state=restoreState(unsupported);
 assert.ok(!state.skirmish?.finished,'unproven old after-state must not become an automatic clear');
}
const fakeIsland=clone(absent);fakeIsland.campaignRevision=7;fakeIsland.skirmish.legacyCleared=true;
fakeIsland.objectiveProgress={questId:island.id,phase:'after'};fakeIsland.flags.cultPath=true;
assert.equal(reload(fakeIsland).s.skirmish.finished,false,'cult history compatibility never accepts an empty island roster');
// Also verify the integrated island roster and authored scene, rather than
// relying solely on the synthetic open-ground fixture used for boundary cases.
const actualState=freshState();actualState.quest=QUESTS.findIndex(q=>q.id==='e08_island_battle');assert.ok(actualState.quest>=0);
actualState.map=QUESTS[actualState.quest].map;actualState.flags={...actualState.flags,route:'evil',evilRecruitAccepted:true,evilTowerInterludeComplete:true,companion:'月眉儿'};
const actual=new GameEngine(actualState);assert.equal(actual.startSkirmish(),true);
assert.equal(actual.s.enemies.length,36);assert.equal(actual.s.enemies.filter(unit=>unit.name==='强盗').length,35);
assert.equal(actual.s.enemies.filter(unit=>unit.name==='强盗头目').length,1);assert.equal(actual.s.allies.length,1);
assert.equal(actual.s.allies[0].id,'island-mei');assert.equal(actual.s.allies[0].npcCell,null);assert.equal(actual.companion,null,'the combat ally replaces the decorative follower');
for(const unit of [...actual.s.enemies,...actual.s.allies]){
 assert.equal(actual.passable(unit.x,unit.y),true);const path=actual.findPath(unit.x,unit.y);
 assert.ok(path.length&&distance(path.at(-1),unit)<35,'integrated deployment points must be reachable');
}
for(let i=0;i<40;i++)actual.tick(.05);
assert.ok(actual.s.hero.hp>0&&actual.s.allies[0].hp>0,'the opening must allow at least two seconds to read the battle');
assert.equal(actual.s.skirmish.failed,false);
console.log(JSON.stringify({result:'PASS',checks:'authored 36-enemy deployment, unique critical ally, live defeat, same-update precedence, persistent failure, full retry, strict defeat ledger, corrupt and foreign saves, cult compatibility'}));
