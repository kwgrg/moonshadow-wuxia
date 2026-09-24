import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';
import {towerJourneyActive,towerEscortActive,restoreTowerJourney} from '../public/tower-runtime.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const index=id=>QUESTS.findIndex(q=>q.id===id);
const budget=g=>JSON.stringify([g.s.coins,g.s.kills,g.s.hero.exp,g.s.hero.level,g.s.potions,g.s.elixirs,g.s.inventory,g.s.affection,g.s.flags.moral,g.s.flags.evil]);
const saved=g=>clone({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(saved(g)));
function create(id='gTower1',map='m62',extra={}){
 const s=freshState();s.quest=index(id);s.map=map;s.phase='talk';s.flags={...s.flags,route:'good',goodRescueFortCleared:true,...extra};s.visited=[map];
 Object.assign(s.hero,{hp:90000,maxHp:90000,mp:500,maxMp:500,level:30,exp:47});s.coins=809;s.potions=6;s.elixirs=5;s.inventory={sheepskin:0};
 const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);g.ensureTowerEncounter();return g;
}
let crossings=0;
function walk(g,to){
 const from=g.s.map,id=g.q.id,before=budget(g);assert(g.exits().some(e=>e.to===to&&!e.locked),'actual adjacent exit to '+to);assert(g.travel(to));
 // Isolate traversal persistence from incidental hits; attack failure is tested separately.
 for(let t=0;t<30000&&g.s.map===from;t++){for(const e of g.s.enemies){e.attackTimer=1e6;e.skillTimer=1e6;e.telegraph=0;}g.tick(.05);}
 assert.equal(g.s.map,to,'walk crosses actual stair '+from+'→'+to);assert.equal(budget(g),before,'stairs never grant kill/quest resources');crossings++;
 assert(g.q.id===id||/^gTower[2-8]$/.test(g.q.id),'only a current ascending passage can advance');return g;
}
assert.equal(typeof GameEngine.prototype.ensureTowerEncounter,'function','production runtime installs tower methods');assert.equal(freshState().campaignRevision,16);
// No synthetic completion away from a stair, no sheep or guard-kill gate.
let g=create(),before=budget(g);assert.equal(g.s.enemies.length,38);assert.equal(g.enterMap('m63'),false,'far-away direct map entry is rejected');g.completeQuest();assert.equal(g.q.id,'gTower1');assert.equal(g.s.done.includes('gTower1'),false);
const start=saved(g);g=walk(g,'m63');assert.equal(g.q.id,'gTower2');assert.equal(g.s.done.includes('gTower1'),true);assert.equal(g.s.towerFloors.m62.enemies.filter(e=>e.hp>0).length,38);assert.equal(g.s.inventory.sheepskin,0);
g=walk(g,'m62');assert.equal(g.q.id,'gTower2');assert.equal(g.s.enemies.length,38);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,38);
// Production defeat bookkeeping gives no per-enemy growth. The survivor keeps HP.
const victim=g.s.enemies[0];victim.hp=0;assert(g.markSkirmishDefeat(victim,true));g.s.enemies[1].hp=73;g.saveTowerFloor();assert.equal(budget(g),before);
g=reload(g);assert.equal(g.s.enemies[0].hp,0);assert.equal(g.s.enemies[1].hp,73);assert(g.s.skirmish.defeatedIds.includes(victim.id));
g=walk(g,'m63');g=walk(g,'m62');assert.equal(g.s.enemies[0].hp,0);assert.equal(g.s.enemies[1].hp,73);assert.equal(budget(g),before);
// A saved bank and the current snapshot must never turn an unrecorded unit into a kill.
for(const damage of ['enemy','duplicate','bank']){
 const raw=saved(g);if(damage==='enemy')raw.towerFloors.m62.enemies.pop();if(damage==='duplicate')raw.towerFloors.m62.enemies[1].id=raw.towerFloors.m62.enemies[0].id;if(damage==='bank')delete raw.towerFloors.m62;
 const failed=new GameEngine(restoreState(raw));failed.ensureTowerEncounter();assert.equal(failed.s.skirmish.failed,true,damage);assert.equal(failed.travel('m63'),false);assert.equal(failed.q.id,'gTower2');const resources=budget(failed);assert(failed.retryTower());assert.equal(failed.s.enemies.filter(e=>e.hp>0).length,38);assert.equal(budget(failed),resources);
}
// Raw hero death beats the ordinary restore clamp even before a failure event.
{
 const raw=clone(start);raw.hero.hp=0;raw.skirmish.failed=false;raw.towerFloors.m62.skirmish.failed=false;
 const failed=new GameEngine(restoreState(raw));failed.ensureTowerEncounter();assert.equal(failed.s.hero.hp,0);assert.equal(failed.s.skirmish.failedReason,'hero');assert(failed.paused);assert.equal(failed.travel('m63'),false);assert(failed.retryTower());assert(failed.s.hero.hp>0);assert.equal(failed.s.enemies.length,38);
}
// Changing from the former ascent bank to an escort must attach Rose even when
// restore already installed that same encounter as the current skirmish.
{
 const raw=clone(start);raw.quest=index('g19_return');raw.questId='g19_return';raw.flags.goodTowerRoseFreed=true;raw.flags.goodTowerDepartureReady=true;raw.flags.companion='蔷薇';raw.towerEscort={hp:713,maxHp:1200};
 let escort=new GameEngine(restoreState(raw));escort.ensureTowerEncounter();assert(towerEscortActive(escort.s));assert.equal(escort.s.allies.filter(a=>a.id==='tower-rose').length,1);assert.equal(escort.s.allies[0].hp,713);
 // Same-floor ensure cannot undo an unsaved hit.
 escort.s.allies[0].hp=607;escort.ensureTowerEncounter();assert.equal(escort.s.allies[0].hp,607);escort.saveTowerFloor();escort=reload(escort);assert.equal(escort.s.allies[0].hp,607);
 escort=walk(escort,'m63');assert.equal(escort.s.allies[0].hp,607);escort.s.allies[0].hp=521;escort.saveTowerFloor();escort=walk(escort,'m62');assert.equal(escort.s.allies[0].hp,521,'old lower bank cannot heal the journey companion');
 const resources=budget(escort);escort.s.allies[0].hp=0;escort.checkSkirmishOutcome();assert.equal(escort.s.skirmish.failedReason,'tower-rose');escort.saveTowerFloor();escort=reload(escort);assert.equal(escort.s.allies[0].hp,0);assert(escort.paused);assert.equal(escort.travel('m63'),false);assert(escort.retryTower());assert.equal(escort.s.allies[0].hp,1200);assert.equal(budget(escort),resources);
}
// A fresh floor shares existing escort vitality; an already cleared floor does
// not turn a dead companion into a successful result on restore.
{
 let escort=create('g19_return','m62',{goodTowerRoseFreed:true,goodTowerDepartureReady:true,companion:'蔷薇'});escort.s.allies[0].hp=317;escort.saveTowerFloor();escort=walk(escort,'m63');assert.equal(escort.s.allies[0].hp,317);
 const raw=saved(escort);raw.towerEscort.hp=0;const failed=new GameEngine(restoreState(raw));failed.ensureTowerEncounter();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.allies[0].hp,0);
}
for(const flags of [{route:'evil'},{cultPath:true}]){const s=freshState();s.quest=index('gTower1');s.map='m62';s.flags={...s.flags,route:'good',...flags};assert.equal(towerJourneyActive(s),false);restoreTowerJourney({towerFloors:{m62:start.towerFloors.m62}},s);assert.deepEqual(s.towerFloors,{});}
// Completing a floor's army only changes combat state, never the passage itself.
{
 const cleared=create();const resources=budget(cleared);for(const e of cleared.s.enemies){e.hp=0;cleared.markSkirmishDefeat(e,true);}cleared.checkSkirmishOutcome();
 assert.equal(cleared.s.skirmish.finished,true);assert.equal(cleared.q.id,'gTower1');cleared.completeQuest();assert.equal(cleared.q.id,'gTower1');assert.equal(budget(cleared),resources);
}
// The real attack path also keeps the no-per-kill economic contract.
{
 const struck=create();const resources=budget(struck),enemy=struck.s.enemies[0];Object.assign(enemy,{x:struck.s.hero.x+65,y:struck.s.hero.y,hp:1});assert(struck.cast(0));assert.equal(enemy.hp,0);assert.equal(budget(struck),resources);
}
function finishStage(g){
 g.beginObjective();assert.equal(g.s.phase,'staging');g.onEvent=type=>{if(type==='stagingDialogue')g.advanceStaging();};
 for(let t=0;t<12000&&g.s.sequence;t++)g.tick(.05);assert.equal(g.s.sequence,null);g.onEvent=()=>{};return g;
}
// Ascend all seven actual stairs with every guard alive, meet Rose in the
// non-combat eighth floor, then walk every return stair with her following.
{
 let full=create();for(let n=2;n<=8;n++){full=walk(full,'m'+(61+n));assert.equal(full.q.id,'gTower'+n);full=reload(full);}
 assert.equal(full.s.map,'m69');assert.equal(full.s.skirmish,null);assert.equal(full.s.enemies.length,0);assert.equal(full.s.inventory.sheepskin,0);
 full=finishStage(full);assert.equal(full.q.id,'g19');full=finishStage(full);assert.equal(full.s.phase,'choice');assert(full.choose(0));assert.equal(full.q.id,'g19_departure');full=finishStage(full);assert.equal(full.q.id,'g19_return');assert.equal(full.s.flags.goodTowerDepartureReady,true);
 for(let n=7;n>=1;n--){full=walk(full,'m'+(61+n));full=reload(full);assert.equal(full.s.enemies.length,[38,29,37,41,34,30,43][n-1]);assert(full.s.enemies.every(e=>e.hp>0));assert.equal(full.s.allies.filter(a=>a.id==='tower-rose').length,1);assert.equal(full.s.allies[0].hp,1200);}
}
// Authored safe-floor rest: V heals only a living escort after an authenticated
// clear, keeps a continuous HP ledger, and emits sparse persistence checkpoints.
function clearedEscort(){
 const g=create('g19_return','m62',{goodTowerRoseFreed:true,goodTowerDepartureReady:true,companion:'蔷薇'});
 g.s.allies[0].hp=240;for(const e of g.s.enemies){e.hp=0;g.markSkirmishDefeat(e,true);}g.checkSkirmishOutcome();g.saveTowerFloor();return g;
}
{
 let resting=clearedEscort();const resources=budget(resting);let checkpoints=0;resting.onEvent=type=>{if(type==='skirmishProgress')checkpoints++;};
 assert(resting.canRestTowerEscort());resting.s.destination='m63';resting.autoInteract='pending-exit';resting.attackTarget=resting.s.enemies[0];resting.meditate();assert(resting.meditating);assert.equal(resting.s.destination,null,'V cancels pending auto-travel');assert.equal(resting.autoInteract,null);assert.equal(resting.attackTarget,null);
 for(let i=0;i<20;i++)resting.tick(.05);assert.equal(resting.s.allies[0].hp,330);assert.equal(checkpoints,0,'no per-frame save');
 for(let i=0;i<20;i++)resting.tick(.05);assert.equal(resting.s.allies[0].hp,420);assert.equal(checkpoints,1,'a two-second healing checkpoint');assert.equal(resting.s.towerEscort.hp,420);assert.equal(resting.s.towerFloors.m62.allies[0].hp,420);assert.equal(resting.s.skirmish.clearedRoster.allies[0].hp,420);
 resting=reload(resting);assert.equal(resting.s.allies[0].hp,420);resting.tick(.05);assert.equal(resting.s.allies[0].hp,420,'reload does not start meditation');
 resting.onEvent=type=>{if(type==='skirmishProgress')checkpoints++;};resting.s.allies[0].hp=1198;resting.saveTowerFloor();resting.meditate();resting.tick(.05);assert.equal(resting.s.allies[0].hp,1200);assert.equal(checkpoints,2,'full recovery saves promptly');for(let i=0;i<60;i++)resting.tick(.05);assert.equal(checkpoints,2,'full HP cannot flood persistence events');assert.equal(budget(resting),resources);
 resting=walk(resting,'m63');assert.equal(resting.s.allies[0].hp,1200);assert.equal(resting.canRestTowerEscort(),false);resting.meditate();assert.equal(resting.meditating,false,'ordinary V remains unavailable in combat');
}
const restNegatives={
 active:g=>{g.s.skirmish.finished=false;g.s.phase='battle';},
 liveEnemy:g=>{g.s.enemies[0].hp=1;},failed:g=>{g.s.skirmish.failed=true;},heroDown:g=>{g.s.hero.hp=0;},roseDown:g=>{g.s.allies[0].hp=0;},
 missingEnemy:g=>{g.s.enemies.pop();},duplicateEnemy:g=>{g.s.enemies[1].id=g.s.enemies[0].id;},missingDefeat:g=>{g.s.skirmish.defeatedIds.pop();},
 missingSnapshot:g=>{delete g.s.skirmish.clearedRoster;},liveSnapshot:g=>{g.s.skirmish.clearedRoster.enemies[0].hp=1;},wrongBattle:g=>{g.s.skirmish.questId='tower-floor-2';},
 paused:g=>{g.paused=true;},inactive:g=>{g.active=false;},scene:g=>{g.s.sequence={questId:'g19_return'};},noMeditation:g=>{g.meditating=false;},
};
for(const [name,mutate] of Object.entries(restNegatives)){
 const denied=clearedEscort();denied.meditating=true;mutate(denied);const hp=denied.s.allies[0].hp;for(let i=0;i<60;i++)denied.tickTowerEscort(.05);assert.equal(denied.s.allies[0].hp,hp,'no healing: '+name);
}
// Constructor input may be an old early-game spawn or any legal guard slot.
// Safe candidate filtering lets the allocator fill vacancies without moving the
// player; the same filtering must never reshuffle an existing live army.
let spawnCases=0;
for(let floor=1;floor<=7;floor++){
 const probe=create('gTower'+floor,'m'+(61+floor)),slots=probe.scene.tower.guardPositions;
 for(const point of [null,slots[0],slots[15],slots.at(-1)]){
  const s=freshState();s.quest=index('gTower'+floor);s.map='m'+(61+floor);s.flags={...s.flags,route:'good',goodRescueFortCleared:true};if(point)Object.assign(s.hero,point);
  const expected=probe.nearestOpen(s.hero.x,s.hero.y);const placed=new GameEngine(s);assert.equal(placed.s.hero.x,expected.x);assert.equal(placed.s.hero.y,expected.y);
  const actors=[placed.s.hero,...placed.s.enemies];for(let a=0;a<actors.length;a++)for(let b=a+1;b<actors.length;b++)assert(Math.hypot(actors[a].x-actors[b].x,(actors[a].y-actors[b].y)*1.3)>=40-1e-8,'deployment overlap');
  const army=clone(placed.s.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp})));Object.assign(placed.s.hero,{x:placed.s.enemies[0].x,y:placed.s.enemies[0].y});placed.ensureTowerEncounter();assert.deepEqual(placed.s.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp})),army,'live army is not redeployed');spawnCases++;
 }
}
// Reloading an ordinary-looking passage must still retain tower combat cooldowns.
{const g=create();assert.equal(g.cast(1),true);const cooldown=g.s.cooldowns[1];assert.ok(cooldown>0);const r=reload(g);assert.equal(r.s.cooldowns[1],cooldown);assert.equal(r.cast(1),false);}
console.log(`Tower runtime PASS: ${crossings} actual adjacent stair walks, survivor banks, raw death, invalid rosters, shared escort HP/retry, safe-floor rest, ${spawnCases} spawn placements and route isolation.`);
