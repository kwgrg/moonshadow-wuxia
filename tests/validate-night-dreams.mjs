import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {getScene,getDreamScene} from '../public/world.mjs';
import {routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import * as campaign from '../public/campaign.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
const index=id=>QUESTS.findIndex(q=>q.id===id);
const snapshot=g=>clone({...g.s,questId:g.q.id});
const resources=g=>clone({inventory:g.s.inventory,coins:g.s.coins,exp:g.s.hero.exp,potions:g.s.potions,elixirs:g.s.elixirs,kills:g.s.kills,hp:g.s.hero.hp,mp:g.s.hero.mp});
const FOOTPOINTS={
 r_zhen_chamber:[[750,820],[930,520],[850,650],[875,610],[1000,500],[750,780]],
 r_evil_chamber:[[760,665],[850,650],[725,720],[1030,670],[1150,635]],
 weddingDream:[[780,650],[870,630],[1180,530],[970,600],[900,730]],
 lakeDream:[[730,790],[840,690],[940,650],[900,550]]
};
let geometryPaths=0;
for(const [id,xy] of Object.entries(FOOTPOINTS)){
 const scene=getDreamScene(id)||getScene(id,MAPS[id]),g=new GameEngine(freshState());Object.defineProperty(g,'scene',{get:()=>scene});
 const points=[...xy.map(([x,y])=>({x,y})),scene.spawn,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit])];
 for(const p of points)assert.ok(g.passable(p.x,p.y),id+' authored point is on visible floor '+JSON.stringify(p));
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;Object.assign(g.s.hero,a);const path=g.findPath(b.x,b.y);assert.ok(path.length,id+' connected staging floor');let previous=a;for(const next of path){const n=Math.max(1,Math.ceil(Math.hypot(next.x-previous.x,next.y-previous.y)/5));for(let step=0;step<=n;step++)assert.ok(g.passable(previous.x+(next.x-previous.x)*step/n,previous.y+(next.y-previous.y)*step/n),id+' path never crosses painted furniture or water');previous=next;}assert.ok(distance(previous,b)<35,id+' path reaches requested footpoint');geometryPaths++;}
}
for(const key of ['weddingDream','lakeDream']){
 const scene=getDreamScene(key);assert.ok(scene.cinematicName);assert.deepEqual(scene.portals,{});assert.deepEqual(scene.points,[]);assert.deepEqual(scene.props,[]);
 assert.ok(!MAPS[key]&&!MAPS[scene.id]&&!MAPS[scene.art],'dreams are not world destinations');assert.deepEqual(routeNeighbors(scene.id,QUESTS),[]);
 const again=getDreamScene(key);scene.obstacles.push([1,2,3,4]);assert.notDeepEqual(scene.obstacles,again.obstacles,'one sequence cannot mutate another dream layout');
}
for(const key of [undefined,null,'m71','constructor','toString','not-a-dream'])assert.equal(getDreamScene(key),null,'unknown scene key cannot select a real-world map');
const room=getScene('r_zhen_chamber',MAPS.r_zhen_chamber),floor=new GameEngine(freshState());Object.defineProperty(floor,'scene',{get:()=>room});
for(const [x,y] of [[750,280],[320,340],[1280,480],[1110,345]])assert.equal(floor.passable(x,y),false,'painted furniture remains solid');
const lake=getDreamScene('lakeDream'),lakeFloor=new GameEngine(freshState());Object.defineProperty(lakeFloor,'scene',{get:()=>lake});assert.equal(lakeFloor.passable(900,480),false,'the shore does not become walkable water');assert.equal(lakeFloor.passable(900,550),true,'the final lake stance stays on dry ground');

function create(branch='kill',id='e06_night'){
 const state=freshState();state.quest=index(id);assert.ok(state.quest>=0,id);state.map=QUESTS[state.quest].map;state.phase='talk';state.flags={...state.flags,route:'evil',evilQiangweiDecision:true,evilQiangweiDead:true,evilFamilyHeard:true,...(branch==='kill'?{evilQiangweiKill:true}:{evilQiangweiRefuse:true})};state.choices.e06=branch==='kill'?1:0;state.done=['e05','e06',branch==='kill'?'e06_kill':'e06_refuse','e06_aftermath'];state.claimedRewards=[...state.done];state.visited=['m71','r_evil_dungeon','r_evil_chamber'];state.inventory={wood_box:1};const game=new GameEngine(state);Object.assign(game.s.hero,game.scene.spawn);return game;
}
function walk(game,map){const crossed=[game.s.map];if(game.s.map===map)return crossed;assert.equal(game.travel(map),true,'reachable real room '+map);for(let n=0;n<16000&&game.s.map!==map;n++){const old=game.s.map,adjacent=game.exits().filter(exit=>!exit.locked).map(exit=>exit.to);game.tick(.05);if(game.s.map!==old){assert.ok(adjacent.includes(game.s.map),'only one actual adjacent portal crossed');crossed.push(game.s.map);}}assert.equal(game.s.map,map);return crossed;}
assert.equal(QUESTS[index('e06_night_visit')].map,'r_zhen_chamber');assert.equal(QUESTS[index('e06_escort')].map,'m71');
for(const route of ['good','evil']){const state={quest:QUESTS.length,flags:{route,evilQiangweiKill:true}};const edges=routeEdges(state,QUESTS);assert.equal(edges.some(edge=>[edge.from,edge.to].includes('r_zhen_chamber')),route==='evil','night room never joins the opposite branch');assert.ok(!edges.some(edge=>[edge.from,edge.to].sort().join('|')===['r_evil_chamber','r_zhen_chamber'].sort().join('|')),'separate rooms cannot bypass the hall');}
assert.deepEqual(shortestRoute('r_evil_chamber','r_zhen_chamber',{quest:index('e06_night_visit'),flags:{route:'evil',evilQiangweiKill:true},done:['e06_night','e06_aftermath']},QUESTS),['r_evil_chamber','m71','r_zhen_chamber']);
let restoredSteps=0,dreamRestores=0,midMoveRestores=0,invalidScenes=0;const dreamSnapshots=[];
function playScene(game,{expectedDream=null}={}){
 const id=game.q.id,baseline=resources(game),visited=clone(game.s.visited),realMap=game.s.map,seenScenes=new Set(),seenActors=new Set(),midMoves=new Set();let current=game,lastStep=-1,moveStart=null;
 current.completeQuest();assert.equal(current.q.id,id,'manual completion cannot skip a required staged event');current.beginObjective();assert.equal(current.s.phase,'staging');
 for(let tick=0;tick<18000&&current.s.phase==='staging';tick++){
  const sequence=current.s.sequence,sceneKey=sequence.sceneKey||null;
  assert.equal(current.s.map,realMap,'dream projection never changes the real map');assert.deepEqual(current.s.visited,visited,'scene transitions never record dream visits');assert.deepEqual(resources(current),baseline,'dream threats and conversations grant no drops or damage');
  if(sceneKey){seenScenes.add(sceneKey);assert.equal(sceneKey,expectedDream,'only the committed outcome dream can appear');assert.equal(current.scene.art,getDreamScene(sceneKey).art);assert.equal(current.scene.cinematicName,getDreamScene(sceneKey).cinematicName);assert.deepEqual(current.scene.portals,{});}
  else assert.equal(current.scene.art,getScene(realMap,MAPS[realMap]).art,'waking uses the real room backdrop');
  assert.ok(current.passable(current.s.hero.x,current.s.hero.y),'hero always stands on the active scene floor');
  for(const actor of current.stagingActors()){seenActors.add(actor.name);assert.ok(current.passable(actor.x,actor.y),actor.name+' stands on active scene floor');if(id==='e06_night')assert.ok(!['纳兰真','真儿的身影'].includes(actor.name),'night visitor cannot appear inside the dream');if(!sceneKey&&id==='e06_night')assert.ok(!['蔷薇','孟知秋'].includes(actor.name),'dream actors cannot leak into the real room');}
  if(id==='e06_night'){assert.ok(!current.s.flags.evilNightPassed);assert.ok(!current.s.flags.evilEscortStarted);assert.equal(current.companion,null);}
  const activeStep=STAGED_QUESTS[id].steps[sequence.step],movingActor=activeStep.type==='move'?(activeStep.actor==='hero'?current.s.hero:sequence.actors.find(actor=>actor.id===activeStep.actor)):null;
  const newStep=sequence.step!==lastStep;if(newStep)moveStart=movingActor?{x:movingActor.x,y:movingActor.y}:null;const midMove=!newStep&&movingActor&&moveStart&&!midMoves.has(sequence.step)&&distance(movingActor,moveStart)>25&&distance(movingActor,activeStep)>15;
  if(newStep||midMove){
   if(midMove){midMoves.add(sequence.step);midMoveRestores++;}
   const raw=snapshot(current),restored=new GameEngine(restoreState(raw));assert.equal(restored.s.sequence.step,sequence.step,'reload keeps the exact staging step');assert.equal(restored.s.sequence.sceneKey||null,sceneKey);assert.deepEqual(restored.s.sequence.cues,sequence.cues);assert.equal(restored.s.hero.x,raw.hero.x,'reload keeps hero x in the current scene');assert.equal(restored.s.hero.y,raw.hero.y,'reload keeps hero y in the current scene');
   for(const actor of sequence.actors){const saved=restored.s.sequence.actors.find(a=>a.id===actor.id);assert.equal(saved.x,actor.x);assert.equal(saved.y,actor.y);assert.equal(!!saved.hidden,!!actor.hidden);}
   if(sceneKey){dreamRestores++;if(!dreamSnapshots.some(saved=>(saved.sequence.sceneKey===sceneKey)))dreamSnapshots.push(raw);}
   current=restored;restoredSteps++;lastStep=sequence.step;
   for(const destination of ['m71','r_zhen_chamber','weddingDream','lakeDream'])assert.equal(current.travel(destination),false,'active staging rejects every world/dream travel request');current.completeQuest();assert.equal(current.q.id,id,'active scene cannot be skipped from its panel');
  }
  const active=current;current.onEvent=type=>{if(type==='stagingDialogue')active.advanceStaging();};current.tick(.05);
 }
 assert.notEqual(current.s.phase,'staging',id+' releases');assert.equal(current.s.sequence,null);assert.equal(current.s.map,realMap);assert.deepEqual(resources(current),baseline);assert.deepEqual(current.s.visited,visited);
 if(id==='e06_night'){assert.deepEqual([...seenScenes],expectedDream?[expectedDream]:[]);if(expectedDream){assert.ok(seenActors.has('蔷薇'));assert.equal(seenActors.has('孟知秋'),expectedDream==='weddingDream');}assert.equal(current.q.id,'e06_night_visit');assert.equal(current.s.flags.evilDreamEnded,true);assert.ok(!current.s.flags.evilNightPassed);assert.ok(distance(current.s.hero,{x:1150,y:635})<15,'waking ends near the real room door');assert.equal(current.stagingActors().some(actor=>['蔷薇','孟知秋'].includes(actor.name)),false);}
 return current;
}
for(const branch of ['kill','refuse']){
 let game=create(branch),initial=resources(game);game=playScene(game,{expectedDream:branch==='kill'?'weddingDream':'lakeDream'});
 const wrongRoom=new GameEngine(restoreState(snapshot(game)));wrongRoom.beginObjective();wrongRoom.completeQuest();assert.equal(wrongRoom.q.id,'e06_night_visit');assert.ok(!wrongRoom.s.flags.evilNightPassed,'room conversation cannot happen from the hero bedroom');
 assert.deepEqual(walk(game,'r_zhen_chamber'),['r_evil_chamber','m71','r_zhen_chamber']);game=playScene(game);assert.equal(game.q.id,'e06_escort');assert.equal(game.s.flags.evilNightPassed,true);assert.ok(!game.s.flags.evilEscortStarted);assert.deepEqual(walk(game,'m71'),['r_zhen_chamber','m71'],'the next-day departure requires a return to the hall');assert.deepEqual(resources(game),initial);
 const replay=new GameEngine(restoreState(snapshot(game)));replay.s.quest=index('e06_night');replay.s.map='r_evil_chamber';replay.s.phase='talk';replay.beginObjective();replay.completeQuest();assert.equal(replay.s.sequence,null,'finished dream never replays');assert.deepEqual(resources(replay),initial);assert.equal(replay.s.done.filter(id=>id==='e06_night').length,1);
}
for(const raw of dreamSnapshots){
 for(const sceneKey of ['m71','missingDream',raw.sequence.sceneKey==='weddingDream'?'lakeDream':'weddingDream']){const corrupt=clone(raw);corrupt.sequence.sceneKey=sceneKey;const game=new GameEngine(restoreState(corrupt));assert.equal(game.s.sequence,null,'invalid or other-branch scene is rejected on reload');assert.equal(game.s.map,'r_evil_chamber');assert.equal(game.scene.art,'bedroom');assert.ok(game.passable(game.s.hero.x,game.s.hero.y));assert.deepEqual(resources(game),resources(new GameEngine(restoreState(raw))),'scene repair preserves real resources');game.beginObjective();assert.equal(game.s.phase,'staging','invalid projection can retry at the real bed');assert.equal(game.s.sequence.sceneKey||null,null);invalidScenes++;}
 const fakeMap=clone(raw);fakeMap.map=raw.sequence.sceneKey;assert.throws(()=>restoreState(fakeMap),'dream keys can never be restored as real maps');
 const wrongRoute=clone(raw);wrongRoute.flags.route='good';const rejected=new GameEngine(restoreState(wrongRoute)),before=resources(rejected);assert.equal(rejected.s.sequence,null,'saved projection must obey the same route guard as a fresh start');assert.equal(rejected.s.phase,'talk');rejected.beginObjective();for(let n=0;n<20;n++)rejected.tick(.05);assert.equal(rejected.s.sequence,null);assert.ok(!rejected.s.flags.staged_e06_night);assert.deepEqual(resources(rejected),before);

}
for(const id of ['e06_night','e06_night_visit'])for(const both of [false,true]){const game=create('kill',id);game.s.flags.evilDreamEnded=true;game.s.flags.evilQiangweiKill=both;game.s.flags.evilQiangweiRefuse=both;const initial=resources(game);game.beginObjective();game.completeQuest();assert.equal(game.s.sequence,null,'new saves require exactly one committed result');assert.equal(game.q.id,id);assert.deepEqual(resources(game),initial);}

// The neutral legacy exception permits no known outcome, never two conflicting
// outcomes. Check both a direct start and a previously valid saved sequence.
for(const id of ['e06_night','e06_night_visit']){
 const original=create('kill',id);original.s.flags.evilDreamEnded=true;original.beginObjective();assert.equal(original.s.phase,'staging');const raw=snapshot(original);raw.flags.evilQiangweiKill=true;raw.flags.evilQiangweiRefuse=true;raw.flags.evilLegacyDreamUnknown=true;
 const restored=new GameEngine(restoreState(raw)),initial=resources(restored);assert.equal(restored.s.sequence,null,'legacy flag cannot authorize a conflicting saved branch');assert.equal(restored.s.phase,'talk');restored.beginObjective();restored.completeQuest();assert.equal(restored.q.id,id);assert.equal(restored.s.sequence,null);assert.ok(!restored.s.flags['staged_'+id]);assert.deepEqual(resources(restored),initial);
}

let legacyCases=0;
assert.equal(freshState().campaignRevision,13);assert.ok(campaign.REVISION_SIX_QUEST_IDS.includes('e06_night_visit'));
for(const choice of [0,1,null])for(const numeric of [false,true]){
 const old=create(),raw=snapshot(old);raw.campaignRevision=6;delete raw.flags.evilQiangweiKill;delete raw.flags.evilQiangweiRefuse;if(choice===null)delete raw.choices.e06;else raw.choices.e06=choice;raw.phase='staging';raw.sequence={questId:'e06_night',step:4,elapsed:1,actors:[],cues:{evilNight:'dark'}};if(numeric){delete raw.questId;raw.quest=campaign.REVISION_SIX_QUEST_IDS.indexOf('e06_night');}
 const game=new GameEngine(restoreState(raw));assert.equal(game.q.id,'e06_night');assert.equal(game.s.sequence,null,'old compressed dream restarts the expanded sequence');assert.equal(game.s.phase,'talk');assert.deepEqual(resources(game),resources(old));assert.ok(!game.s.flags.staged_e06_night);assert.ok(!game.s.done.includes('e06_night'));
 if(choice===null){assert.equal(game.s.flags.evilLegacyDreamUnknown,true);assert.ok(!game.s.flags.evilQiangweiKill&&!game.s.flags.evilQiangweiRefuse);if(!numeric){let neutral=playScene(game);assert.deepEqual(walk(neutral,'r_zhen_chamber'),['r_evil_chamber','m71','r_zhen_chamber']);neutral=playScene(neutral);assert.equal(neutral.q.id,'e06_escort');assert.ok(!neutral.s.flags.evilQiangweiKill&&!neutral.s.flags.evilQiangweiRefuse,'unknown legacy state does not invent a past decision');}}
 else{assert.equal(!!game.s.flags.evilQiangweiKill,choice===1);assert.equal(!!game.s.flags.evilQiangweiRefuse,choice===0);assert.ok(!game.s.flags.evilLegacyDreamUnknown);}
 legacyCases++;
}
for(const phase of ['talk','staging'])for(const numeric of [false,true]){
 const original=create('refuse','e06_night_visit');original.s.flags.evilDreamEnded=true;original.s.map='m71';original.s.done.push('e06_night');original.s.claimedRewards.push('e06_night');const raw=snapshot(original);raw.campaignRevision=6;raw.phase=phase;raw.flags.staged_e06_night_visit=true;raw.sequence={questId:'e06_night_visit',step:4,elapsed:1,actors:[{id:'zhen',name:'纳兰真',x:965,y:585}],cues:{}};if(numeric){delete raw.questId;raw.quest=campaign.REVISION_SIX_QUEST_IDS.indexOf('e06_night_visit');}
 const restored=new GameEngine(restoreState(raw));assert.equal(restored.q.id,'e06_night_visit');assert.equal(restored.s.map,'m71','migration preserves actual real location');assert.equal(restored.s.phase,'travel');assert.equal(restored.s.sequence,null);assert.ok(!restored.s.flags.staged_e06_night_visit);assert.ok(!restored.s.flags.evilNightPassed);assert.deepEqual(resources(restored),resources(original));assert.deepEqual(restored.routeTo('r_zhen_chamber'),['m71','r_zhen_chamber']);legacyCases++;
}
const historical=create('kill','e06_escort');historical.s.flags.evilDreamEnded=true;historical.s.flags.evilNightPassed=true;historical.s.done.push('e06_night','e06_night_visit');historical.s.claimedRewards.push('e06_night','e06_night_visit');const historicalRaw=snapshot(historical);historicalRaw.campaignRevision=6;const retained=new GameEngine(restoreState(historicalRaw));assert.equal(retained.q.id,'e06_escort');assert.equal(retained.s.flags.evilNightPassed,true);assert.deepEqual(resources(retained),resources(historical));assert.deepEqual(retained.s.done,historical.s.done,'already completed visit remains completed without a new reward or replay');legacyCases++;
console.log(JSON.stringify({result:'PASS',geometryPaths,restoredSteps,dreamRestores,midMoveRestores,invalidScenes,legacyCases,checks:'two exclusive dreams, independent projections, exact scene/actor reload, no dream-world leakage, room separation and return walk, illegal scene retry, neutral unknown legacy and historical dream migration to revision thirteen'}));
