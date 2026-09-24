import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {routeEdges,shortestRoute,routeNeighbors} from '../public/routes.mjs';
import {getScene} from '../public/world.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import * as campaign from '../public/campaign.mjs';
const IDS=['e07_village','e07_approach','e07_entry','e07_first','e07_second','e07_gate','e07'];
const FLAGS=['evilZhenMissing','evilTrailVillage','evilTrailApproach','evilTrailEntry','evilTrailFirst','evilTrailSecond','evilGateOpened'];
const index=id=>QUESTS.findIndex(q=>q.id===id),clone=value=>JSON.parse(JSON.stringify(value));
const snapshot=g=>clone({...g.s,questId:g.q.id});
function create(id=IDS[0],flags={}){const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id);s.map=QUESTS[s.quest].map;s.flags={...s.flags,route:'evil',...flags};s.inventory={wood_box:1};const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;}
const earned=n=>Object.fromEntries(FLAGS.slice(0,n).map(key=>[key,true]));
const resources=g=>clone({inventory:g.s.inventory,coins:g.s.coins,exp:g.s.hero.exp,potions:g.s.potions,elixirs:g.s.elixirs,kills:g.s.kills});
function walk(g,map){if(g.s.map===map)return [map];const visited=[g.s.map];assert.equal(g.travel(map),true,'reachable destination '+map);for(let n=0;n<24000&&g.s.map!==map;n++){const from=g.s.map,neighbors=g.exits().filter(e=>!e.locked).map(e=>e.to);g.tick(.05);if(g.s.map!==from){assert.ok(neighbors.includes(g.s.map),'one adjacent crossing at a time');visited.push(g.s.map);}}assert.equal(g.s.map,map);return visited;}
let geometryPaths=0;
for(const id of IDS){const g=create(id,earned(7)),scene=g.scene,definition=STAGED_QUESTS[id];const points=[scene.spawn,scene.objective,...(scene.pursuitPath||[]),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...(definition?.actors||[]),...(definition?.steps||[]).filter(step=>step.type==='move').map(({x,y})=>({x,y}))];
 for(const p of points)assert.equal(g.passable(p.x,p.y),true,id+' authored footpoint walkable '+JSON.stringify(p));
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;Object.assign(g.s.hero,a);const path=g.findPath(b.x,b.y);assert.ok(path.length,id+' connected floor');assert.ok(distance(path.at(-1),b)<35);let previous=a;for(const next of path){const n=Math.max(1,Math.ceil(distance(previous,next)/5));for(let step=0;step<=n;step++)assert.equal(g.passable(previous.x+(next.x-previous.x)*step/n,previous.y+(next.y-previous.y)*step/n),true,id+' path stays on painted floor');previous=next;}geometryPaths++;}
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,'portals require a deliberate return walk');
}
// Arrival must show the pursued figure ahead, never on top of the player.
const pursuitSources={e07_village:'m34',e07_approach:'m31',e07_entry:'r_forbidden_path',e07_first:'r_forbidden_entry',e07_second:'r_forbidden_first'};
for(const [id,from] of Object.entries(pursuitSources)){
 const g=create(id,earned(7)),entry=g.scene.portals[from].entry,[first,next]=g.scene.pursuitPath;
 const separation=Math.hypot(first.x-entry.x,first.y-entry.y);
 assert.ok(separation>=140&&separation<=190,id+' visible initial separation at actual arrival portal');
 const forward={x:next.x-entry.x,y:next.y-entry.y},offset={x:first.x-entry.x,y:first.y-entry.y};
 assert.ok((forward.x*offset.x+forward.y*offset.y)/(Math.hypot(forward.x,forward.y)*separation)>.85,id+' figure starts ahead toward its next checkpoint');
 for(let n=0;n<=Math.ceil(separation/5);n++){const t=n/Math.ceil(separation/5);assert.equal(g.passable(entry.x+offset.x*t,entry.y+offset.y*t),true,id+' initial visible gap is clear floor');}
 Object.assign(g.s.hero,entry);const preview=g.pursuitMarker();assert.equal(preview.x,first.x);assert.equal(preview.y,first.y);
 g.beginObjective();assert.equal(g.s.phase,'pursuit');assert.equal(g.s.pursuit.actor.x,first.x);assert.equal(g.s.pursuit.actor.y,first.y);assert.ok(distance(g.s.hero,g.s.pursuit.actor)>=140,id+' starting the objective preserves visible separation');
}
const layerArts=['r_forbidden_first','r_forbidden_second','r_forbidden_gate','m57'].map(id=>getScene(id,MAPS[id]).art);assert.equal(new Set(layerArts).size,4,'inner locations use distinct paintings rather than relabeled copies');
assert.ok(!routeNeighbors('m34',QUESTS).includes('m57'),'old beach-to-chamber shortcut removed');
for(let count=0;count<7;count++){const s={quest:index('e07'),flags:{route:'evil',...earned(count)},visited:Object.keys(MAPS),done:['e08','a49','g09','g10']};assert.deepEqual(shortestRoute('m34','m57',s,QUESTS),[],'history and numeric position cannot substitute for current trail flags');}
assert.deepEqual(shortestRoute('m56','m57',{quest:index('g10'),flags:{route:'good'}},QUESTS),['m56','m57'],'ordinary good-route access survives');
for(const route of ['good','evil']){const edges=routeEdges({quest:QUESTS.length,flags:{route,...earned(7)}},QUESTS);assert.equal(edges.some(e=>[e.from,e.to].some(id=>id.startsWith('r_forbidden_'))),route==='evil');if(route==='evil')assert.ok(!edges.some(e=>[e.from,e.to].sort().join('|')===['m57','m41'].sort().join('|')),'chamber cannot directly teleport to mainland');}

// Being on the map, waiting, or invoking completion cannot finish a pursuit.
for(const id of IDS.slice(0,5)){const q=QUESTS[index(id)],g=create(id,Object.fromEntries(q.requiredFlags.map(key=>[key,true]))),before=resources(g);g.completeQuest();assert.equal(g.q.id,id);g.beginObjective();assert.equal(g.s.phase,'pursuit');Object.assign(g.s.hero,g.nearestOpen(g.scene.bounds[0]+30,g.scene.bounds[3]-40));g.target=null;g.waypoints=[];for(let n=0;n<800;n++)g.tick(.05);assert.equal(g.q.id,id,'idle player cannot complete the trail');assert.equal(g.s.pursuit.finished,false);g.completeQuest();assert.equal(g.q.id,id);assert.deepEqual(resources(g),before);}
let pursuitRestores=0;
let game=create(IDS[0],earned(1));game.s.map='m34';game.s.phase='travel';game.s.done=['e06_rest'];game.s.claimedRewards=['e06_rest'];const startResources=resources(game),itinerary=[];
for(const id of IDS.slice(0,5)){
 assert.equal(game.q.id,id);itinerary.push(...walk(game,game.q.map));game.beginObjective();assert.equal(game.s.phase,'pursuit');assert.equal(game.companion,null,'true missing Zhen is not a follower');
 const before=snapshot(game);game.followPursuit();game.keys.add('ArrowLeft');game.tick(.05);game.keys.clear();assert.equal(game._pursuitFollow,false,'keyboard breaks auto-follow');
 let lastPoint=-1,midRestored=false;game.followPursuit();
 for(let tick=0;tick<10000&&game.q.id===id;tick++){
  const p=game.s.pursuit;
  if(p&&(p.point!==lastPoint||(!midRestored&&distance(p.actor,game.scene.pursuitPath[p.point])>40))){const raw=snapshot(game),restored=new GameEngine(restoreState(raw));assert.equal(restored.s.pursuit.point,p.point);assert.equal(restored.s.pursuit.actor.x,p.actor.x);assert.equal(restored.s.pursuit.actor.y,p.actor.y);assert.equal(restored.s.pursuit.finished,false);game=restored;game.followPursuit();pursuitRestores++;if(p.point===lastPoint)midRestored=true;lastPoint=p.point;}
  game.tick(.05);
 }
 assert.notEqual(game.q.id,id,'following the visible actor reaches the real end');assert.equal(game.s.done.filter(done=>done===id).length,1);assert.deepEqual(resources(game),startResources,'pursuit awards no items or combat drops');
 const rewardFlag=Object.keys(QUESTS[index(id)].rewards.flags)[0];assert.equal(game.s.flags[rewardFlag],true);
}
assert.equal(game.q.id,'e07_gate');
// Missing prerequisites block the runner and restoration, even with forged progress.
for(const id of IDS){const q=QUESTS[index(id)];for(const missing of q.requiredFlags||[]){const flags=Object.fromEntries(q.requiredFlags.map(key=>[key,key!==missing])),g=create(id,flags),before=resources(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,id);assert.deepEqual(resources(g),before);if(q.pursuit){assert.equal(g.startPursuit(),false);const raw=snapshot(g);raw.phase='pursuit';raw.pursuit={questId:id,point:2,actor:{x:800,y:600},finished:true};assert.equal(restoreState(raw).pursuit,null);}}}
// Genuine partial following remains saved if the player goes back through a portal.
let back=create('e07_first',earned(4));back.beginObjective();back.followPursuit();for(let n=0;n<25;n++)back.tick(.05);back._pursuitFollow=false;walk(back,'r_forbidden_entry');const progress=clone(back.s.pursuit);back=new GameEngine(restoreState(snapshot(back)));assert.equal(back.s.pursuit.point,progress.point);assert.equal(back.s.pursuit.actor.x,progress.actor.x);walk(back,'r_forbidden_first');assert.equal(back.s.phase,'pursuit');assert.equal(back.s.pursuit.point,progress.point);assert.equal(back.s.pursuit.actor.x,progress.actor.x);
const malformed=create('e07_first',earned(4));for(const bad of [null,{questId:'e07_first',point:-1},{questId:'e07_first',point:99},{questId:'e07_first',point:0,actor:null,finished:true}]){const raw=snapshot(malformed);raw.pursuit=bad;const restored=restoreState(raw);assert.ok(!restored.pursuit?.finished,'invalid saves cannot assert completion');}

function assertRevealedIdentity(g){
 const presentation=g.stagingPresentation();assert.ok(presentation,'revealed chamber keeps its final presentation');
 assert.deepEqual(presentation.actors.filter(actor=>!actor.hidden).map(actor=>actor.name),['月眉儿'],'only the revealed identity survives the final scene');
 assert.equal(presentation.cues.identity,'revealed');assert.equal(presentation.cues.letterRead,true);
 assert.ok(!g.markers.some(marker=>['纳兰真','真儿的身影'].includes(marker.name)),'reloading after revelation cannot restore the disguise');
 assert.ok(!g.companion||!['纳兰真','真儿的身影'].includes(g.companion.name),'the discarded disguise cannot respawn as a follower');
 if(!['battle','after'].includes(g.s.phase))assert.equal(g.markers.filter(marker=>marker.name==='月眉儿').length,1,'revealed identity renders once after reload');
 assert.equal(g.canStartStaging(),false,'completed revelation is not replayed');
}
// Corrupt completion snapshots must recover a playable trail rather than award it.
for(const actor of [null,{x:NaN,y:500},{x:800,y:800}]){const g=create('e07_second',earned(5)),raw=snapshot(g);raw.phase='pursuit';raw.pursuit={questId:g.q.id,point:2,actor,finished:true};assert.equal(restoreState(raw).pursuit.finished,false);}
const orphan=create('e07_first',earned(4));orphan.s.map='r_forbidden_entry';orphan.s.phase='travel';orphan.s.objectiveProgress={questId:'e07_first',phase:'pursuit',collectedIds:[]};const recovered=new GameEngine(restoreState(snapshot(orphan)));assert.equal(recovered.s.objectiveProgress.phase,'talk');walk(recovered,'r_forbidden_first');recovered.beginObjective();assert.equal(recovered.s.phase,'pursuit');

let restoredSteps=0;
function stage(g,id){let active=g,last=-1;active.beginObjective();assert.equal(active.s.phase,'staging');for(let n=0;n<14000&&active.s.phase==='staging';n++){
 if(active.s.sequence.step!==last){const raw=snapshot(active),restored=new GameEngine(restoreState(raw));assert.equal(restored.s.sequence.step,raw.sequence.step);assert.deepEqual(restored.s.sequence.cues,raw.sequence.cues);for(const a of raw.sequence.actors){const b=restored.s.sequence.actors.find(b=>b.id===a.id);assert.equal(b.x,a.x);assert.equal(b.y,a.y,'high doorway positions survive reload');assert.equal(b.hidden,!!a.hidden);}active=restored;last=active.s.sequence.step;restoredSteps++;}
 if(id==='e07_gate'){assert.equal(active.passable(800,245),!!active.s.sequence.cues.gateOpen,'door collision follows live open cue');assert.equal(active.s.flags.evilGateOpened,undefined,'open flag is committed only when complete');}
 const current=active;active.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};active.tick(.05);
 }
 assert.notEqual(active.s.phase,'staging',id+' releases control');return active;}
walk(game,'r_forbidden_gate');assert.equal(game.passable(800,245),false);assert.equal(game.enterMap('m57'),false);assert.equal(game.travel('m57'),false);game=stage(game,'e07_gate');assert.equal(game.q.id,'e07');assert.equal(game.s.flags.evilGateOpened,true);assert.deepEqual(resources(game),startResources,'jades used by the actor do not fabricate player inventory');
assert.deepEqual(walk(game,'m57'),['r_forbidden_gate','m57']);game=stage(game,'e07');assert.equal(game.s.phase,'battle','revelation must lead to a playable duel');assert.equal(game.s.enemies.length,1);assert.equal(game.s.enemies[0].name,'月眉儿');assert.ok(!game.markers.some(m=>m.name==='真儿的身影'),'the discarded disguise never remains as a double');assert.deepEqual(game.s.inventory,startResources.inventory);
assertRevealedIdentity(game);game=new GameEngine(restoreState(snapshot(game)));assert.equal(game.s.phase,'battle','ordinary duel reload retains its live encounter');assertRevealedIdentity(game);assert.ok(game.s.flags.staged_e07,'new saves preserve completed revelation');game.beginObjective();assert.equal(game.s.phase,'battle');assert.equal(game.s.enemies[0].name,'月眉儿');assertRevealedIdentity(game);
const enemy=game.s.enemies[0];game.s.hero.hp=1;Object.assign(enemy,{x:game.s.hero.x,y:game.s.hero.y,attackTimer:0,skillTimer:99,telegraph:0,telegraphZone:null});for(let n=0;n<40&&game.s.phase==='battle';n++)game.tick(.05);assert.equal(game.s.phase,'choice');assert.equal(game.choose(1),true);assert.equal(game.refusalCount(),1);const reply=resources(game);game=new GameEngine(restoreState(snapshot(game)));assert.equal(game.s.phase,'choice');assert.equal(game.choose(1),true);assert.equal(game.s.phase,'failed');assert.equal(game.s.hero.hp,0);game=new GameEngine(restoreState(snapshot(game)));assert.equal(game.s.phase,'failed');assert.equal(game.retry(),false);assert.equal(game.potion(),false);assert.equal(game.travel('m31'),false);assert.equal(game.retryRefusal(),true);assert.equal(game.choose(0),true);assert.equal(game.q.id,'e08_interlude');assert.equal(game.s.inventory.jade_half||0,0);assert.equal(game.s.inventory.mother_letter||0,0);assert.equal(game.s.flags.companion,'月眉儿');
const returnRoute=game.routeTo('r_forbidden_path');for(const map of ['r_forbidden_gate','r_forbidden_second','r_forbidden_first','r_forbidden_entry','r_forbidden_path'])assert.ok(returnRoute.includes(map),'return leaves through traversed forbidden route '+map);assert.equal(game.s.flags.evilRecruitAccepted,true);assert.ok(!game.s.flags.evilIslandCleared);assert.deepEqual(game.routeTo('m40'),[],'acceptance cannot bypass the new island battle and farewell');

let migratedIndices=0;
for(const [revision,ids] of [[1,campaign.LEGACY_QUEST_IDS],[2,campaign.REVISION_TWO_QUEST_IDS],[3,campaign.REVISION_THREE_QUEST_IDS],[4,campaign.REVISION_FOUR_QUEST_IDS],[5,campaign.REVISION_FIVE_QUEST_IDS]])for(const phase of ['talk','choice','failed']){
 const original=create('e07',{evilZhenMissing:true});original.s.phase=phase;original.s.flags.refusal_e07=phase==='failed'?2:1;if(phase==='failed'){original.s.failure={kind:'refusal',questId:'e07',hpBefore:75};original.s.hero.hp=0;}const raw=snapshot(original);delete raw.questId;raw.quest=ids.indexOf('e07');raw.campaignRevision=revision;const restored=new GameEngine(restoreState(raw));assert.equal(restored.q.id,'e07');assert.equal(restored.s.flags.evilLegacyReveal,true);assert.equal(restored.s.flags.evilGateOpened,true);assert.ok(!restored.s.flags.staged_e07);assert.deepEqual(restored.s.inventory,raw.inventory);assert.equal(restored.refusalCount(),original.refusalCount());assertRevealedIdentity(restored);if(phase==='failed'){assert.equal(restored.s.phase,'failed');assert.equal(restored.s.hero.hp,0);}if(phase==='choice'){assert.equal(restored.s.phase,'talk','old choice without a roster must replay the unproven duel');restored.beginObjective();assert.equal(restored.s.phase,'battle');restored.s.hero.hp=1;restored.hurt(restored.s.enemies[0],1);restored.tick(.01);assert.equal(restored.s.phase,'choice');assert.equal(restored.choose(0),true);assert.equal(restored.q.id,'e08_interlude','old completed duel may accept without replaying its reveal, then play the uncompleted return');assert.equal(restored.s.flags.evilRecruitAccepted,true);assert.ok(!restored.s.flags.evilLegacyIslandPassage);}migratedIndices++;
}
const naked=create('e07'),current=restoreState(snapshot(naked));assert.ok(!current.flags.evilLegacyReveal);assert.ok(!current.flags.evilGateOpened,'new saves receive no legacy shortcut');
console.log(JSON.stringify({result:'PASS',geometryPaths,pursuitRestores,restoredSteps,migratedIndices,checks:'player-driven pursuit, earned gates, no history bypass, partial pursuit restore and backtrack, jade-door transaction, reveal then forced-loss duel, fatal reply and legacy/current saves'}));
