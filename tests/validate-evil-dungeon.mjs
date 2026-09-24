import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';
import {getScene} from '../public/world.mjs';
import * as campaign from '../public/campaign.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

// Independent web staging and state invariants, not a claim of original-map fidelity.
const index=id=>QUESTS.findIndex(q=>q.id===id);
const clone=value=>JSON.parse(JSON.stringify(value));
const snapshot=game=>clone({...game.s,questId:game.q.id});
function create(id='e06',flags={}){
 const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id+' must exist');s.map=QUESTS[s.quest].map;s.flags={...s.flags,route:'evil',...flags};
 const game=new GameEngine(s);Object.assign(game.s.hero,game.scene.spawn);return game;
}
function walkTo(game,map){
 if(game.s.map===map)return [];
 const visited=[game.s.map];assert.equal(game.travel(map),true,'a route to '+map+' must be available');
 for(let tick=0;tick<18000&&game.s.map!==map;tick++){
  const from=game.s.map,allowed=new Set(game.exits().filter(e=>!e.locked).map(e=>e.to));game.tick(.05);
  if(game.s.map!==from){assert.ok(allowed.has(game.s.map),'walking crosses only an adjacent portal');visited.push(game.s.map);}
 }
 assert.equal(game.s.map,map,'walking reaches '+map);return visited;
}

const checkpoints={
 m71:[[845,445],[720,500],[845,560],[1100,620]],
 r_evil_dungeon:[[845,445],[720,500],[650,610],[585,700],[575,655],[590,700],[744,552],[675,615],[830,790]],
 r_evil_chamber:[[760,665],[850,700],[1000,620],[1150,635]],
 r_zhen_chamber:[[930,520],[850,650],[875,610],[1000,500],[750,780]],
 r_evil_yitian:[[1020,620]],
 r_evil_ferry:[[1040,705],[950,725]],
 m40:[],
 m34:[]
};
let pathChecks=0;
for(const [map,coordinates] of Object.entries(checkpoints)){
 const game=create();game.s.map=map;const scene=game.scene;
 const points=[scene.spawn,...coordinates.map(([x,y])=>({x,y})),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit])];
 // Projected dream scenes have different floor masks. Their authored geometry
 // and branch-aware recovery are covered by validate-night-dreams.mjs; this
 // sampling keeps the real bedroom, private night room and all other stages.
 for(const definition of Object.values(STAGED_QUESTS).filter(d=>d.map===map&&!d.sceneKeys?.length)){
  points.push(...(definition.actors||[]),...['heroStart','startPoint'].flatMap(key=>definition[key]?[definition[key]]:[]),...definition.steps.filter(step=>step.type==='move').map(({x,y})=>({x,y})));
 }
 assert.ok(Object.keys(scene.portals).length,map+' needs real neighboring portals');
 for(const point of points)assert.equal(game.passable(point.x,point.y),true,map+' stage/portal point is walkable '+JSON.stringify(point));
 for(const start of points)for(const target of points){
  if(distance(start,target)<1)continue;Object.assign(game.s.hero,start);const path=game.findPath(target.x,target.y);
  assert.ok(path.length,map+' point pair is connected');assert.ok(distance(path.at(-1),target)<35,map+' path reaches its target');let previous=start;
  for(const next of path){const n=Math.max(1,Math.ceil(distance(previous,next)/5));for(let step=0;step<=n;step++)assert.equal(game.passable(previous.x+(next.x-previous.x)*step/n,previous.y+(next.y-previous.y)*step/n),true,map+' path never crosses a solid footprint');previous=next;}
  pathChecks++;
 }
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,'arriving requires a walk before returning');
}
const dungeon=create();dungeon.s.map='r_evil_dungeon';
assert.equal(dungeon.scene.art,'cult-dungeon');assert.equal(dungeon.scene.maskArt,'cult-dungeon');assert.ok(!dungeon.scene.cells.zixuan,'evil scene has no second named victim');
for(const y of [430,500,580])assert.equal(dungeon.passable(794,y),false,'wall face remains solid');
for(const [x,y] of [[744,552],[794,390],[794,625],[850,650]])assert.equal(dungeon.passable(x,y),true,'impact approach and wall bypass remain walkable');
assert.equal(dungeon.scene.props.length,0,'generated masonry is not overlaid with generic flat gates');
assert.equal(getScene('r_evil_chamber',MAPS.r_evil_chamber).art,'bedroom');
assert.ok(!routeNeighbors('m71',QUESTS).includes('m57'),'no historical tower-to-forbidden-room shortcut');
for(const route of ['good','evil'])for(const cultPath of [false,true])for(const forsake of [false,true]){
 const edges=routeEdges({quest:QUESTS.length,flags:{route,cultPath,forsake,evilQiangweiKill:true,evilQiangweiDecision:true}},QUESTS);
 const newEdges=edges.filter(edge=>[edge.from,edge.to].some(id=>id.startsWith('r_evil_')));
 assert.equal(newEdges.length>0,route==='evil','new locations belong only to the evil route');
 for(const edge of newEdges){assert.ok(getScene(edge.from,MAPS[edge.from]).portals[edge.to]);assert.ok(getScene(edge.to,MAPS[edge.to]).portals[edge.from]);}
}


const CHAIN=['e06','e06_kill','e06_refuse','e06_aftermath','e06_night','e06_night_visit','e06_escort','e06_ferry','e06_landing','e06_first_interlude','e06_rest'];
const MILESTONES=['evilQiangweiDecision','evilQiangweiDead','evilFamilyHeard','evilDreamEnded','evilNightPassed','evilEscortStarted','evilFerryReady','evilIslandArrived','evilFirstTowerInterludeComplete','evilZhenMissing'];
const PURSUIT=['e07_village','e07_approach','e07_entry','e07_first','e07_second','e07_gate'];
assert.equal(freshState().campaignRevision,16);
let restoredSteps=0;
function runScene(game){
 const id=game.q.id;let active=game,lastStep=-1,steps=0;
 active.completeQuest();assert.equal(active.q.id,id,'unstaged event cannot be completed directly');
 active.beginObjective();assert.equal(active.s.phase,'staging',id+' starts staged action');
 while(active.s.phase==='staging'&&steps++<10000){
  if(active.s.sequence.step!==lastStep){
   const before=snapshot(active),resumed=new GameEngine(restoreState(before));
   assert.equal(resumed.q.id,id);assert.equal(resumed.s.sequence.step,before.sequence.step,'reload retains exact scene step');
   assert.equal(resumed.s.sequence.heroPose,before.sequence.heroPose);assert.deepEqual(resumed.s.sequence.cues,before.sequence.cues);assert.equal(resumed.s.sequence.sceneKey??null,before.sequence.sceneKey??null,'reload preserves the active projection instead of testing it against the bedroom');
   for(const actor of before.sequence.actors){const restored=resumed.s.sequence.actors.find(a=>a.id===actor.id);assert.equal(restored.x,actor.x);assert.equal(restored.y,actor.y);assert.equal(restored.pose,actor.pose||'stand');assert.equal(restored.hidden,!!actor.hidden,'shown/hidden actor state survives reload');}
   active=resumed;lastStep=active.s.sequence.step;restoredSteps++;
   const wrong=snapshot(active);wrong.map=active.s.map==='m71'?'m40':'m71';assert.equal(restoreState(wrong).sequence,null,'staging cannot resume in another map');
   const beforeTravel=active.s.map;assert.equal(active.travel('m40'),false);assert.equal(active.enterMap('m40'),false);assert.equal(active.s.map,beforeTravel,'active scene cannot travel out');
   active.completeQuest();assert.equal(active.q.id,id,'active staging cannot be manually completed');
  }
  const current=active;active.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};active.tick(.05);
  if(id==='e06_night'&&active.s.sequence){assert.ok(!active.s.sequence.actors.some(actor=>actor.name==='纳兰真'),'Zhen does not visit the hero inside the bedroom or dream');assert.equal(active.companion,null,'the night dream cannot start tomorrow escort');assert.ok(!active.s.flags.evilNightPassed,'the dream alone cannot finish the subsequent night conversation');}
  if(id==='e06_rest'&&active.s.sequence?.actors.find(actor=>actor.id==='shore-zhen')?.hidden){assert.equal(active.companion,null,'departed scene actor must not respawn as a follower before release');assert.equal(active.stagingActors().filter(actor=>actor.name==='纳兰真').length,0,'hidden Zhen-presenting actor remains offstage until rest releases');}
  if(id==='e06_rest'&&active.s.sequence&&!active.s.sequence.actors.find(actor=>actor.id==='shore-zhen')?.hidden){assert.equal(active.companion,null,'onstage Zhen has no follower duplicate');assert.equal(active.stagingActors().filter(actor=>actor.name==='纳兰真').length,1);}
 }
 assert.ok(steps<10000,id+' staging terminates');assert.equal(active.s.sequence,null);return active;
}
function resources(game){return {coins:game.s.coins,exp:game.s.hero.exp,kills:game.s.kills,inventory:clone(game.s.inventory),potions:game.s.potions,elixirs:game.s.elixirs};}
const outcomes=[];
for(const choice of [0,1]){
 let game=create('e06',{companion:'纳兰真'});game.s.done=['e05'];game.s.claimedRewards=['e05'];
 const initial=resources(game),result=choice===0?'e06_refuse':'e06_kill',other=choice===0?'e06_kill':'e06_refuse';
 assert.equal(game.companion,null,'old true-Zhen follower is suppressed in dungeon');
 game=runScene(game);assert.equal(game.s.phase,'choice');assert.equal(game.s.flags.evilQiangweiDead,undefined,'death is not committed by pressure scene');
 assert.equal(game.choose(choice),true);assert.equal(game.q.id,result);assert.equal(game.s.choices.e06,choice);assert.equal(game.s.flags.evil,choice===0?-3:3);
 game=new GameEngine(restoreState(snapshot(game)));assert.equal(game.q.id,result,'saving immediately after selection cannot switch its consequence');
 assert.equal(game.choose(1-choice),false,'a committed answer cannot be repeated in the consequence');
 game=runScene(game);assert.equal(game.q.id,'e06_aftermath');assert.equal(game.s.flags.evilQiangweiDead,true);assert.ok(!game.s.done.includes(other));
 let dead=game.stagingActors().filter(actor=>actor.name==='蔷薇');assert.equal(dead.length,1);assert.equal(dead[0].pose,'fallen');assert.equal(game.interact(dead[0]),false,'fallen Qiangwei never offers a new conversation');assert.ok(!game.stagingActors().some(actor=>actor.name==='紫轩'));
 if(choice===0){assert.equal(dead[0].x,744);assert.equal(dead[0].fallDirection,-1);}else assert.equal(dead[0].x,650);
 for(const id of ['e06_aftermath','e06_night','e06_night_visit','e06_escort','e06_ferry','e06_landing','e06_first_interlude','e06_rest']){
  if(id==='e06_night_visit'){
   assert.equal(game.s.map,'r_evil_chamber','the hero wakes in his room before looking for Zhen');assert.equal(game.s.flags.evilDreamEnded,true);assert.ok(!game.s.flags.evilNightPassed);assert.ok(!game.s.flags.evilEscortStarted);assert.equal(game.companion,null);
   const bedroom=new GameEngine(restoreState(snapshot(game))),before=resources(bedroom);bedroom.beginObjective();bedroom.completeQuest();assert.equal(bedroom.q.id,id,'night conversation cannot complete from the bedroom');assert.ok(!bedroom.s.flags.evilNightPassed);assert.deepEqual(resources(bedroom),before);
  }
  assert.equal(game.q.id,id);if(['e06_ferry','e06_landing','e06_first_interlude','e06_rest'].includes(id)&&game.s.map!==game.q.map)assert.equal(game.companion?.name,'纳兰真','Zhen-presenting actor follows every escort leg before beach rest');const transitions=walkTo(game,game.q.map);
  if(['e06_ferry','e06_landing','e06_first_interlude'].includes(id)){const zhenMarkers=game.markers.filter(marker=>marker.name==='纳兰真'&&!marker.hidden);assert.equal(zhenMarkers.length+(game.companion?.name==='纳兰真'?1:0),1,'destination renders exactly one Zhen-presenting actor');}
  if(id==='e06_night_visit')assert.deepEqual(transitions,['r_evil_chamber','m71','r_zhen_chamber'],'the hero must walk through the hall to seek Zhen in her own room');
  if(id==='e06_escort')assert.deepEqual(transitions,['r_zhen_chamber','m71'],'the next-day farewell requires walking back to the hall');
  if(id==='e06_ferry')assert.deepEqual(transitions,['m71','r_evil_yitian','r_evil_ferry'],'escort physically walks mountain connector');
  if(id==='e06_landing')assert.deepEqual(transitions,['r_evil_ferry','m40'],'island landing follows boat portal');
  if(id==='e06_first_interlude')assert.deepEqual(transitions,['m40','m34'],'island dock leads to the first tower cutaway');
  if(id==='e06_rest')assert.deepEqual(transitions,[],'wake-up callback stays at the actual beach origin');
  if(['e06_ferry','e06_landing'].includes(id)){
   const wrong=new GameEngine(restoreState(snapshot(game)));wrong.s.map='m71';wrong.s.phase='travel';wrong.beginObjective();wrong.completeQuest();assert.equal(wrong.q.id,id,'talk event cannot complete from a different map');
  }
  if(STAGED_QUESTS[id])game=runScene(game);else game.beginObjective();
  if(id==='e06_night')assert.ok(!game.s.flags.evilNightPassed,'waking does not imply that the separate conversation has happened');
  if(id==='e06_night_visit'){assert.equal(game.s.flags.evilNightPassed,true);assert.ok(!game.s.flags.evilEscortStarted,'agreement and actual next-day departure remain separate');}
  assert.notEqual(game.q.id,id);assert.deepEqual(resources(game),initial,'scene completion grants no battle drops or invented items');
 }
 assert.equal(game.q.id,'e07_village','beach rest starts village pursuit, not the already-revealed chamber duel');assert.equal(game.s.flags.evilZhenMissing,true);assert.equal(game.s.flags.companion,null);assert.equal(game.companion,null);assert.equal(game.s.ending,null);assert.ok(!game.s.flags.evilGateOpened);assert.ok(!game.s.flags.staged_e07);
 assert.ok(!game.s.done.some(id=>id.startsWith('gCult_')));for(const key of MILESTONES)assert.equal(game.s.flags[key],true,key+' records its real completed event');
 const beforeReturn=resources(game);walkTo(game,'r_evil_dungeon');dead=game.stagingActors().filter(actor=>actor.name==='蔷薇');assert.equal(dead.length,1);assert.equal(dead[0].pose,'fallen');assert.equal(game.interact(dead[0]),false);assert.ok(!game.stagingActors().some(actor=>actor.name==='纳兰潜凛'));
 const reloaded=new GameEngine(restoreState(snapshot(game)));assert.equal(reloaded.stagingActors().find(actor=>actor.name==='蔷薇')?.pose,'fallen');
 for(const id of CHAIN.filter(id=>id!==other)){
  const again=new GameEngine(restoreState(snapshot(game)));again.s.quest=index(id);again.s.map=again.q.map;again.s.phase='talk';again.completeQuest();assert.deepEqual(resources(again),beforeReturn,'finished event cannot repay anything');assert.equal(again.s.done.filter(done=>done===id).length,1,'done records remain unique');
 }
 outcomes.push({choice,result,visited:game.s.visited.length});
}
// Every required stage rejects an unearned flag, including a forged saved sequence.
for(const id of CHAIN.filter(id=>QUESTS[index(id)].requiredFlags?.length)){
 const q=QUESTS[index(id)],flags={...Object.fromEntries(q.requiredFlags.map(key=>[key,true])),...(q.exclusiveFlags?{evilQiangweiKill:true,evilQiangweiRefuse:false}:{})};
 if(STAGED_QUESTS[id])assert.equal(create(id,flags).canStartStaging(),true,'the earned control fixture must be valid before removing a prerequisite');
 for(const missing of q.requiredFlags){const game=create(id,{...flags,[missing]:false}),before=resources(game);assert.equal(game.startStaging(),false);game.beginObjective();game.completeQuest();assert.equal(game.q.id,id);assert.deepEqual(resources(game),before);if(STAGED_QUESTS[id]){const forged=snapshot(game);forged.phase='staging';forged.sequence={questId:id,step:STAGED_QUESTS[id].steps.length-1,actors:[],cues:{}};assert.equal(restoreState(forged).sequence,null);}}
}
const ferry=create('e06_landing',{evilFerryReady:true});ferry.s.map='r_evil_ferry';const voyage=ferry.exits().find(exit=>exit.to==='m40');assert.equal(voyage.transport,'boat');assert.match(voyage.travelLabel,/乘船/);

let migrated=0;
assert.equal(campaign.REVISION_FIVE_QUEST_IDS.length,161,'revision-five numeric identities remain frozen before pursuit insertion');
for(const [revision,ids] of [[1,campaign.LEGACY_QUEST_IDS],[2,campaign.REVISION_TWO_QUEST_IDS],[3,campaign.REVISION_THREE_QUEST_IDS],[4,campaign.REVISION_FOUR_QUEST_IDS],[5,campaign.REVISION_FIVE_QUEST_IDS]]){
 for(const id of ['e05','e06','e07','e08']){
  const game=create(id),raw=snapshot(game);delete raw.questId;raw.campaignRevision=revision;raw.quest=ids.indexOf(id);assert.ok(raw.quest>=0);if(id==='e06'&&revision<5){raw.map='m71';raw.phase='choice';}if(revision===5&&['e07','e08'].includes(id))raw.flags.evilZhenMissing=true;if(id==='e08'){raw.map='m41';Object.assign(raw.hero,{x:1040,y:725});raw.phase='talk';}
  const restored=new GameEngine(restoreState(raw));assert.equal(restored.q.id,id==='e05'?'e04_homecoming':id,'old numeric index resolves to original identity or explicit pending return-message migration');
  assert.equal(restored.s.campaignRevision,16);
  if(id==='e06'){if(revision<5)assert.equal(restored.s.phase,'travel');assert.ok(!restored.s.flags.evilQiangweiDead);assert.ok(!restored.s.flags.evilLegacyJourney);}
  if(['e07','e08'].includes(id)){if(revision<5)assert.equal(restored.s.flags.evilLegacyJourney,true);assert.equal(restored.s.flags.evilZhenMissing,true);assert.equal(restored.s.flags.evilLegacyReveal,true);assert.equal(restored.s.flags.evilGateOpened,true);assert.deepEqual(restored.s.inventory,raw.inventory);assert.equal(restored.s.coins,raw.coins);assert.equal(restored.s.hero.exp,raw.hero.exp);assert.ok(!restored.s.done.includes('e06_rest'),'legacy summary is not mislabeled newly played staging');for(const added of [...PURSUIT,'e06_night_visit']){assert.ok(!restored.s.done.includes(added),'migration does not fabricate a played event');assert.ok(!restored.s.claimedRewards.includes(added),'migration does not fabricate a reward claim');assert.ok(!restored.s.flags['staged_'+added],'migration does not fabricate staging completion');}assert.ok(!restored.s.flags.staged_e07,'old reveal is represented by its explicit legacy flag');}
  if(id==='e08'){
   assert.equal(restored.s.map,'r_mainland_dock','old waiting docks saves enter the new real dock at a safe point');
   assert.equal(restored.s.flags.evilLegacyDockMap,'m41');assert.equal(restored.s.flags.evilLegacyDockX,1040);assert.equal(restored.s.flags.evilLegacyDockY,725);
   assert.equal(restored.s.hero.x,getScene('r_mainland_dock',MAPS.r_mainland_dock).spawn.x);assert.equal(restored.s.hero.y,getScene('r_mainland_dock',MAPS.r_mainland_dock).spawn.y);
   assert.equal(restored.s.flags.evilLegacyIslandPassage,true);assert.ok(!restored.s.flags.evilLegacyDocksPrelude,'old pre-dialogue saves still owe the new dock introduction');assert.ok(!restored.s.flags.evilLegacyZixuanOutcome);
   for(const added of ['e08_interlude','e08_island_battle','e08_departure','e08_refuse','e08_kill']){assert.ok(!restored.s.done.includes(added));assert.ok(!restored.s.claimedRewards.includes(added));assert.ok(!restored.s.flags['staged_'+added],'historical passage never fabricates newly played docks staging');}
  }
  const stable={...raw,quest:0,questId:id};assert.equal(QUESTS[restoreState(stable).quest].id,id==='e05'?'e04_homecoming':id,'stable ID overrides stale numeric index before the explicit return-message migration');migrated++;
 }
 const failed=create('e07'),raw=snapshot(failed);raw.campaignRevision=revision;raw.done=['e06'];raw.phase='failed';raw.hero.hp=0;raw.flags.refusal_e07=2;raw.failure={kind:'refusal',questId:'e07',hpBefore:75};const restored=new GameEngine(restoreState(raw));assert.equal(restored.q.id,'e07');assert.equal(restored.s.phase,'failed');assert.equal(restored.s.hero.hp,0);assert.equal(restored.refusalCount(),2,'migration preserves fatal reply rather than replaying new scenes');
}
const fresh=create('e07'),freshRestored=restoreState(snapshot(fresh));assert.ok(!freshRestored.flags.evilLegacyJourney);assert.ok(!freshRestored.flags.evilZhenMissing,'new revision does not grant free escort progress');assert.ok(!freshRestored.flags.evilGateOpened);assert.ok(!freshRestored.flags.evilLegacyReveal,'new revision cannot claim old revealed history');
const good=create('e07',{route:'good'}),goodRaw=snapshot(good);goodRaw.campaignRevision=4;goodRaw.done=['e06'];assert.ok(!restoreState(goodRaw).flags.evilZhenMissing,'old wrong-route flag mixtures do not migrate evil progress');
console.log(JSON.stringify({result:'PASS',pathChecks,restoredSteps,migratedIndices:migrated,outcomes,checks:'two consequence actions, persistent fallen actors, exclusive dream progression, private night room and next-day return walk, true boat travel, no invented rewards, required flags, branch isolation and legacy restoration to revision sixteen'}));
