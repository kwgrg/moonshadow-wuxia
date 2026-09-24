import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

// Exercise player-facing methods and tick movement. Fixtures are only used for
// save restoration and hostile attempts at bypassing a locked passage.
const copy=value=>JSON.parse(JSON.stringify(value));
const history=new WeakMap();
const checks=[];
function instrument(g,{difficulty='normal',holdDialogue=false,holdDifficulty=false}={}){
 const log=[];history.set(g,log);
 g.onEvent=(type,data)=>{
  log.push({type,quest:g.q.id,map:g.s.map,step:g.s.sequence?.step,pose:g.s.sequence?.heroPose,lines:copy(data.lines||[])});
  if(type==='stagingDialogue'&&!holdDialogue)g.advanceStaging();
  if(type==='startingDifficulty'&&!holdDifficulty)assert.equal(g.chooseStartingDifficulty(difficulty),true);
  if(type==='defeat')assert.fail(`Unexpected defeat during route exercise: ${g.q.id}`);
 };
 return g;
}
function ticksUntil(g,predicate,label,limit=16000){
 for(let tick=0;tick<limit;tick++){
  if(predicate())return;
  const map=g.s.map;const allowed=new Set(g.exits().filter(e=>!e.locked).map(e=>e.to));
  g.tick(.05);
  if(g.s.map!==map)assert.ok(allowed.has(g.s.map),`${label}: ${map} -> ${g.s.map} skipped adjacency`);
 }
 assert.fail(`${label}: timed out at ${g.q.id}/${g.s.map}/${g.s.phase}`);
}
function travelTo(g,map){
 if(g.s.map===map)return;
 assert.equal(g.travel(map),true,`${g.q.id}: cannot plan route ${g.s.map} -> ${map}`);
 ticksUntil(g,()=>g.s.map===map,`walk to ${map}`);
}
function activate(g,marker){
 assert.ok(marker,`${g.q.id}: missing marker`);const id=g.q.id;
 g.interact(marker);
 ticksUntil(g,()=>!g.autoInteract||g.q.id!==id,`approach ${marker.id}`);
}
function fight(g,{stopAfterFirst=false}={}){
 const initial=g.s.enemies.filter(e=>e.hp>0).length;
 for(let tick=0;tick<9000&&g.s.phase==='battle';tick++){
  if(!g.encounter.scriptedLoss){
   const opponent=g.s.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,g.s.hero)-distance(b,g.s.hero))[0];
   g.attackTarget=opponent;
   if(opponent&&distance(g.s.hero,opponent)<225)g.cast(1);
   if(g.s.hero.hp<g.s.hero.maxHp*.55){g.cast(3);g.potion();}
   if(g.s.hero.mp<25)g.elixir();
  }else g.attackTarget=null;
  g.tick(.05);
  assert.equal(g.paused,false,`${g.q.id}: battle ended in an unexpected defeat`);
  if(stopAfterFirst&&g.s.enemies.filter(e=>e.hp>0).length<initial)return;
 }
 if(!stopAfterFirst)assert.notEqual(g.s.phase,'battle',`${g.q.id}: battle stalled`);
}
function finishCurrent(g){
 const id=g.q.id;travelTo(g,g.q.map);
 if(g.s.phase==='talk')g.beginObjective();
 if(g.s.phase==='staging')ticksUntil(g,()=>g.s.phase!=='staging',`staging ${id}`);
 for(let pass=0;pass<35&&g.q.id===id;pass++){
  if(g.s.phase==='training'){
   const opponent=g.markers.find(m=>m.kind==='master')||g.markers.find(m=>m.kind==='training'&&!m.defeated);
   activate(g,opponent);
  }
  if(g.s.phase==='battle')fight(g);
  if(g.s.phase==='choice')g.choose(0);
  if(['search','return','escape'].includes(g.s.phase))activate(g,g.markers.find(m=>m.main));
  if(g.s.phase==='after')g.completeQuest();
 }
 assert.notEqual(g.q.id,id,`${id}: quest failed to finish through public actions`);
}

// Auto opening: no manual grave interaction. Input cannot override a cutscene.
const opening=instrument(new GameEngine(),{holdDialogue:true,holdDifficulty:true});
assert.equal(opening.q.id,'a01');opening.tick(.05);
assert.equal(opening.s.phase,'staging');
assert.deepEqual({x:opening.s.hero.x,y:opening.s.hero.y},{x:STAGED_QUESTS.a01.heroStart.x,y:STAGED_QUESTS.a01.heroStart.y});
ticksUntil(opening,()=>history.get(opening).some(e=>e.type==='stagingDialogue'),'opening kneel');
assert.equal(opening.s.sequence.heroPose,'kneel');
const lockedPosition={x:opening.s.hero.x,y:opening.s.hero.y},lockedCoins=opening.s.coins;
assert.equal(opening.moveTo(1000,600),false,'staging must reject manual movement');
assert.equal(opening.cast(0),false);assert.equal(opening.cast(1),false);assert.equal(opening.dash(),false);
assert.equal(opening.travel('r_lingjue'),false);assert.equal(opening.enterMap('r_lingjue'),false);
assert.equal(opening.interact(),false);opening.keys.add('ArrowRight');opening.keys.add('j');
for(let tick=0;tick<10;tick++)opening.tick(.05);opening.keys.clear();
assert.deepEqual({x:opening.s.hero.x,y:opening.s.hero.y},lockedPosition);
opening.completeQuest();assert.equal(opening.q.id,'a01');assert.equal(opening.s.coins,lockedCoins);

// Resume in a pose/dialogue and then in a move: the hero must not teleport back.
const savedKneel=copy(opening.s),restoredKneel=instrument(new GameEngine(restoreState(savedKneel)),{holdDifficulty:true});
assert.equal(restoredKneel.s.sequence.heroPose,'kneel');
ticksUntil(restoredKneel,()=>STAGED_QUESTS.a01.steps[restoredKneel.s.sequence?.step]?.type==='move','resume until walk');
for(let tick=0;tick<12;tick++)restoredKneel.tick(.05);
const savedWalk=copy(restoredKneel.s);assert.notEqual(savedWalk.hero.x,STAGED_QUESTS.a01.heroStart.x);
const restoredWalk=instrument(new GameEngine(restoreState(savedWalk)),{holdDifficulty:true});
assert.equal(restoredWalk.s.hero.x,savedWalk.hero.x);assert.equal(restoredWalk.s.sequence.step,savedWalk.sequence.step);
ticksUntil(restoredWalk,()=>history.get(restoredWalk).some(e=>e.type==='startingDifficulty'),'difficulty after standing and walking');
assert.equal(restoredWalk.s.sequence.heroPose,'stand');
assert.ok(distance(restoredWalk.s.hero,{x:655,y:560})<12);
assert.equal(restoredWalk.s.hero.level,1);assert.equal(restoredWalk.chooseStartingDifficulty('story'),true);
assert.equal(restoredWalk.s.hero.level,3);const afterDifficulty=copy(restoredWalk.s);
const afterChoice=instrument(new GameEngine(restoreState(afterDifficulty)));
ticksUntil(afterChoice,()=>afterChoice.q.id==='a02','release opening once');
const once={level:afterChoice.s.hero.level,maxHp:afterChoice.s.hero.maxHp,coins:afterChoice.s.coins,exp:afterChoice.s.hero.exp};
assert.equal(afterChoice.s.done.filter(id=>id==='a01').length,1);
assert.equal(afterChoice.s.claimedRewards.filter(id=>id==='a01').length,1);
assert.equal(afterChoice.chooseStartingDifficulty('story'),false);assert.equal(afterChoice.startStaging(),false);
for(let tick=0;tick<30;tick++)afterChoice.tick(.05);
assert.deepEqual({level:afterChoice.s.hero.level,maxHp:afterChoice.s.hero.maxHp,coins:afterChoice.s.coins,exp:afterChoice.s.hero.exp},once);
// A saved selection awaiting release must not be able to grant its level bonus twice.
const replayChoice=copy(afterDifficulty);replayChoice.sequence.step=STAGED_QUESTS.a01.steps.findIndex(s=>s.type==='difficulty');
const replay=instrument(new GameEngine(restoreState(replayChoice)),{holdDifficulty:true});
assert.equal(replay.chooseStartingDifficulty('story'),true);assert.equal(replay.s.hero.level,3);assert.equal(replay.s.hero.maxHp,once.maxHp);
checks.push('自动祭父、姿势/行走与演员续存、难度奖励仅一次、演出输入锁定');

// The main route starts from a fresh normal game and never assigns s.map.
let g=instrument(new GameEngine());
ticksUntil(g,()=>g.q.id==='a02','normal opening');
assert.equal(g.s.hero.level,1);assert.equal(g.s.flags.startingDifficulty,'normal');
assert.equal(g.enterMap('m2'),false,'nonadjacent direct entry must fail');
assert.equal(g.enterMap('r_lingjue'),false,'adjacent entry from afar must fail');
assert.equal(g.travel('m5'),false,'future routes cannot be opened from map selection');
const beforeJourney=g.s.map,positionBeforeJourney={x:g.s.hero.x,y:g.s.hero.y};
assert.equal(g.travel('m2'),true);assert.equal(g.s.map,beforeJourney,'travel must first walk to an exit');
assert.deepEqual({x:g.s.hero.x,y:g.s.hero.y},positionBeforeJourney);
ticksUntil(g,()=>g.s.map==='m2','walk through the connecting mountain road');
assert.ok(g.s.visited.includes('r_lingjue'));
assert.equal(g.q.id,'a02');assert.equal(g.stagingActors().length,3);
const innHistoryStart=history.get(g).length;
ticksUntil(g,()=>history.get(g).slice(innHistoryStart).some(e=>e.type==='stagingDialogue'&&e.lines.some(l=>l[0].includes('酒客'))),'hear the two guests');
assert.equal(g.q.id,'a02','hearing the guests must precede deciding the next objective');
assert.equal(g.s.done.includes('a02'),false);
const savedInn=copy(g.s),resumedInn=instrument(new GameEngine(restoreState(savedInn)));
assert.equal(resumedInn.s.sequence.step,savedInn.sequence.step);
for(const actor of savedInn.sequence.actors){
 const restored=resumedInn.stagingActor(actor.id);
 assert.deepEqual({x:restored.x,y:restored.y,direction:restored.direction},{x:actor.x,y:actor.y,direction:actor.direction});
}
ticksUntil(resumedInn,()=>resumedInn.q.id==='a03','resume inn after overhearing');
assert.equal(history.get(resumedInn).filter(e=>e.type==='stagingDialogue').flatMap(e=>e.lines).some(l=>l[0].includes('酒客')),false,'already heard gossip must not restart after loading');
ticksUntil(g,()=>g.q.id==='a03','complete inn staging');
const innSay=history.get(g).filter(e=>e.quest==='a02'&&e.type==='stagingDialogue');
assert.ok(innSay[0].lines.some(l=>l[0]==='酒肆老板'));assert.ok(innSay[1].lines.some(l=>l[0].includes('酒客')));
assert.ok(innSay.at(-1).lines.every(l=>l[0]==='杨影枫'));

const questBeforeReturn=g.q.id,rewardsBeforeReturn=copy(g.s.claimedRewards),coinBeforeReturn=g.s.coins;
travelTo(g,'m1');travelTo(g,'m3');
assert.equal(g.q.id,questBeforeReturn);assert.deepEqual(g.s.claimedRewards,rewardsBeforeReturn);assert.equal(g.s.coins,coinBeforeReturn);
assert.equal(g.s.phase,'talk');assert.equal(g.s.flags.staged_a02,true);
assert.ok(g.exits().find(e=>e.to==='m4').locked);
assert.equal(g.travel('m4'),false);
// Hostile fixture: even standing on the locked threshold or marking it visited cannot enter.
const bypass=instrument(new GameEngine(copy(g.s)));
Object.assign(bypass.s.hero,bypass.scene.portals.m4.exit);bypass.s.visited.push('m4');
assert.equal(bypass.enterMap('m4'),false);assert.equal(bypass.travel('m4'),false);
for(let tick=0;tick<30;tick++)bypass.tick(.05);assert.equal(bypass.s.map,'m3');
assert.equal(g.moveTo(STAGED_QUESTS.a03.trigger.x,STAGED_QUESTS.a03.trigger.y),true);
ticksUntil(g,()=>g.s.phase==='battle','read the inscription then meet the guards');
const poolSay=history.get(g).filter(e=>e.quest==='a03'&&e.type==='stagingDialogue');
assert.equal(poolSay.length,2);assert.ok(poolSay[0].lines.every(l=>l[0]==='杨影枫'));assert.ok(poolSay[1].lines.some(l=>l[0].includes('守山道士')));
assert.equal(g.s.enemies.length,2);
for(const [index,actor] of STAGED_QUESTS.a03.actors.entries()){
 assert.equal(g.s.enemies[index].name,actor.name);assert.ok(distance(g.s.enemies[index],actor)<1,'guards must fight from their visible staging positions');
}
assert.equal(g.travel('m4'),false);fight(g,{stopAfterFirst:true});
assert.ok(g.s.enemies.filter(e=>e.hp>0).length>=1,'first-guard check must precede the second defeat');
assert.equal(g.s.phase,'battle');assert.equal(g.travel('m4'),false);assert.ok(g.exits().find(e=>e.to==='m4').locked);
fight(g);assert.equal(g.s.phase,'after');assert.equal(g.s.enemies.filter(e=>e.hp>0).length,0);
// A player can leave after combat before reading the closing dialogue. Saving
// away from the objective must preserve the victory, not respawn both guards.
const victoryCoins=g.s.coins,victoryExp=g.s.hero.exp;
travelTo(g,'m2');assert.equal(g.q.id,'a03');
g=instrument(new GameEngine(restoreState(copy(g.s))));
travelTo(g,'m3');assert.equal(g.s.phase,'after','return from an away-map save must retain the won battle');
for(let tick=0;tick<25;tick++)g.tick(.05);
assert.equal(g.s.enemies.length,0);assert.equal(g.s.sequence,null);
assert.equal(history.get(g).some(e=>e.type==='battle'),false);
assert.equal(g.s.coins,victoryCoins);assert.equal(g.s.hero.exp,victoryExp);
g.completeQuest();assert.equal(g.q.id,'a04');assert.equal(g.exits().find(e=>e.to==='m4').locked,false);
travelTo(g,'m4');finishCurrent(g);assert.equal(g.q.id,'a05');travelTo(g,'m5');
assert.ok(g.s.visited.includes('r_wudang'),'the ascent must pass through its connecting road');
checks.push('酒肆三人演出、洗剑池读碑与守卫站位、两敌清场才通行、邻接步行与离图读档不重战');

// Continue actual objectives up to the three branch entrances. Side destinations
// are reached through travel/tick only; their graph existence alone is insufficient.
const visitedSides=new Set();let iterations=0;
while(!visitedSides.has('m73')&&iterations++<45){
 if(g.q.id==='a07'){travelTo(g,g.q.map);const q=g.q.id;travelTo(g,'m75');visitedSides.add(g.s.map);travelTo(g,g.q.map);assert.equal(g.q.id,q);}
 if(g.q.id==='a11'){travelTo(g,g.q.map);const q=g.q.id;travelTo(g,'m72');visitedSides.add(g.s.map);travelTo(g,'m74');visitedSides.add(g.s.map);travelTo(g,g.q.map);assert.equal(g.q.id,q);}
 if(g.q.id==='a22'){travelTo(g,g.q.map);const q=g.q.id;travelTo(g,'m73');visitedSides.add(g.s.map);travelTo(g,g.q.map);assert.equal(g.q.id,q);break;}
 finishCurrent(g);
}
assert.deepEqual([...visitedSides].sort(),['m72','m73','m74','m75']);
checks.push('主线实际推进至 a22，四个支线地点均步行抵达并返程');
console.log(JSON.stringify({result:'PASS',checks,stagedQuests:Object.keys(STAGED_QUESTS).length,completedOpeningQuests:g.s.done.length,visitedMaps:g.s.visited.length,sideMaps:[...visitedSides].sort(),note:'验证运行时行为，不代表原版场景或动画匹配率。'},null,2));

// A late-story hub has many exits. Following a chosen route must not enter a
// different portal that happens to lie along the walking path.
{const hub=new GameEngine();hub.s.quest=QUESTS.findIndex(q=>q.id==='g23');hub.s.map='m49';hub.s.phase='travel';hub.s.flags.route='good';hub.s.flags.goodMedicineFarewellReady=true;Object.assign(hub.s.hero,hub.scene.spawn);const crossed=[];hub.onEvent=type=>{if(type==='chapter')crossed.push(hub.s.map);};assert.equal(hub.travel('m17'),true);for(let i=0;i<2000&&hub.s.map!=='m17';i++)hub.tick(.05);assert.equal(hub.s.map,'m17');assert.deepEqual(crossed,['m41','r_good_hanbo_road','m17'],'navigation follows the current medicine route and ignores unrelated exits');}
{const yard=new GameEngine();yard.s.quest=QUESTS.findIndex(q=>q.id==='a05');yard.s.map='m5';const exit=yard.scene.portals.r_wudang.exit;for(const npc of yard.scene.trainingPositions)assert.ok(Math.hypot(npc.x-exit.x,npc.y-exit.y)>150,'courtyard exit must stay away from waiting disciples');}
