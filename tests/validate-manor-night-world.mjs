import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {getScene} from '../public/world.mjs';
import {exitsFor,routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
const ids=['e09_report','e09_first_wake','e09','e09_part','e09_sleepless','e09_second_meeting','e09_room_talk','e09_morning'];
const index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,id+' is integrated');return i;};
const manor=new Set(['m49','m50','r_beimo_hero_room','r_beimo_mei_room']);
const previous={route:'evil',evilZixuanDead:true,evilTowerInterludeComplete:true,evilIslandCleared:true,evilIslandFarewell:true};
const reported={...previous,evilManorReported:true,evilManorNightStarted:true};
const woke={...reported,evilManorFirstWoke:true};
const escorted={...woke,evilManorDecision:true,evilMeiEscorted:true,evilMeiAlone:false};
const alone={...woke,evilManorDecision:true,evilMeiEscorted:false,evilMeiAlone:true};
const reunited={...alone,evilMeiParted:true,evilManorRestless:true,evilMeiSecondMet:true};
const state=(id,flags=previous)=>({quest:index(id),questId:id,flags:{...flags},done:QUESTS.map(q=>q.id),visited:Object.keys(MAPS)});
const create=(id,map,flags=previous)=>{const s=freshState();s.quest=index(id);s.map=map;s.phase='travel';s.flags={...s.flags,...flags};s.done=QUESTS.slice(0,index(id)).filter(q=>!q.when||q.when.route!=='good').map(q=>q.id);s.claimedRewards=[...s.done];const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;};
let footpoints=0,paths=0;
for(const map of manor){
 const g=create('e09_report',map),scene=g.scene;
 const stages=ids.map(id=>STAGED_QUESTS[id]).filter(s=>s?.map===map);
 const raw=[scene.spawn,scene.objective,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...stages.flatMap(stage=>[...(stage.actors||[]),...(stage.finalActors||[]),...(stage.steps||[]).filter(step=>step.type==='move')])];
 const points=[...new Map(raw.map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
 for(const p of points){assert.equal(g.passable(p.x,p.y),true,map+' authored footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;Object.assign(g.s.hero,a);const route=g.findPath(b.x,b.y);assert.ok(route.length,map+' connected route');assert.ok(distance(route.at(-1),b)<35);let prior=a;for(const next of route){const n=Math.max(1,Math.ceil(distance(prior,next)/5));for(let i=0;i<=n;i++)assert.equal(g.passable(prior.x+(next.x-prior.x)*i/n,prior.y+(next.y-prior.y)*i/n),true,map+' no collision corner cutting '+JSON.stringify({a,b,prior,next,i,n}));prior=next;}paths++;}
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.exit,portal.entry)>=90,map+' deliberate return distance');
 if(map!=='m49'){assert.deepEqual(scene.props,[]);assert.equal(scene.drawRoads,false);assert.ok(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)));}
}
assert.equal(new Set(['m50','r_beimo_hero_room','r_beimo_mei_room'].map(id=>getScene(id,MAPS[id]).art)).size,3,'garden and two bedrooms are separate authored images');
for(const map of ['r_beimo_hero_room','r_beimo_mei_room'])assert.deepEqual(routeNeighbors(map,QUESTS),['m50'],'bedroom has a real garden doorway, no inferred room-to-room teleport');
for(const [id,map] of [['e09_first_wake','r_beimo_hero_room'],['e09_sleepless','r_beimo_hero_room'],['e09_room_talk','r_beimo_mei_room']]){const end=STAGED_QUESTS[id].steps.filter(s=>s.type==='move'&&s.actor==='hero').at(-1);assert.ok(distance(end,getScene(map,MAPS[map]).portals.m50.exit)>135,id+' release still leaves a real doorway approach');}
assert.equal(create('e09_first_wake','r_beimo_hero_room',reported).passable(390,320),false,'painted hero bed blocks standing');
assert.equal(create('e09_room_talk','r_beimo_mei_room',escorted).passable(350,350),false,'painted tea table blocks standing');
assert.equal(create('e09_room_talk','r_beimo_mei_room',escorted).passable(1180,300),false,'painted Mei bed blocks standing');

// A report arrival stays reachable, while all departures from the manor are
// closed during the night. Deliberately excessive history cannot unlock them.
assert.deepEqual(shortestRoute('r_mainland_dock','m49',state('e09_report'),QUESTS),['r_mainland_dock','m41','m49']);
assert.deepEqual(shortestRoute('m49','r_beimo_hero_room',state('e09_report'),QUESTS),[]);
assert.deepEqual(shortestRoute('m49','r_beimo_hero_room',state('e09_first_wake',reported),QUESTS),['m49','m50','r_beimo_hero_room']);
for(const id of ids.slice(1)){
 const s=state(id,reported);
 for(const map of manor){
  for(const exit of exitsFor(map,s,QUESTS))if(!manor.has(exit.to))assert.equal(exit.locked,true,id+' closes old outward edge '+map+' -> '+exit.to);
  for(const outside of ['m41','m16','m51','m71','m48','m13','m62'])assert.deepEqual(shortestRoute(map,outside,s,QUESTS),[],id+' cannot leave through remembered maps');
 }
 assert.deepEqual(shortestRoute('m41','m49',s,QUESTS),['m41','m49'],'outside arrivals remain possible');
 assert.equal(exitsFor('m41',s,QUESTS).find(e=>e.to==='m49').locked,false,'incoming view does not inherit outgoing lock');
 assert.equal(exitsFor('m49',s,QUESTS).find(e=>e.to==='m41').locked,true,'outgoing view enforces night boundary');
}
assert.deepEqual(shortestRoute('m50','r_beimo_mei_room',state('e09_room_talk',escorted),QUESTS),['m50','r_beimo_mei_room']);
for(const flags of [woke,alone,{...alone,evilMeiParted:true},{...alone,evilMeiParted:true,evilManorRestless:true},{...reunited,evilMeiEscorted:true}])assert.deepEqual(shortestRoute('m50','r_beimo_mei_room',state('e09_room_talk',flags),QUESTS),[],'missing or mixed branch progress cannot open Mei door');
assert.deepEqual(shortestRoute('m50','r_beimo_mei_room',state('e09_room_talk',reunited),QUESTS),['m50','r_beimo_mei_room']);
for(const flags of [escorted,reunited]){
 const completed={...flags,evilManorRoomTalk:true,evilManorNightComplete:true};
 assert.deepEqual(shortestRoute('m50','m51',state('e10_teaching',completed),QUESTS),['m50','m49','m51'],'morning departure uses the front manor gate');
 assert.deepEqual(shortestRoute('m50','m51',state('e10',completed),QUESTS),['m50','m51'],'later revisits recover the old connection');
}
assert.deepEqual(shortestRoute('m50','m51',state('e10_teaching',{...previous,evilLegacyManorNight:true}),QUESTS),['m50','m49','m51'],'explicit legacy completion can leave by the front gate');
assert.deepEqual(shortestRoute('m50','m41',state('e09',{...previous,evilLegacyManorPrelude:true}),QUESTS),[],'legacy garden prelude is not night completion');
for(const id of ['b03','g06']){const s={quest:index(id),flags:{route:id.startsWith('g')?'good':null}};assert.deepEqual(shortestRoute('m50','m51',s,QUESTS),id==='b03'?[]:['m50','m51']);assert.ok(!routeEdges(s,QUESTS).some(e=>e.from.startsWith('r_beimo_')||e.to.startsWith('r_beimo_')),'new evil bedrooms stay outside early/good itinerary');}
assert.deepEqual(shortestRoute('m50','m51',{quest:index('b04'),flags:{}},QUESTS),['m50','m51'],'early garden-to-valley travel remains available');

function walk(from,to,id,flags,expected){const g=create(id,from,flags),visited=[from];const neighbors=g.exits().filter(e=>!e.locked).map(e=>e.to);assert.equal(g.travel(to),true,id+' begins its real trip');if(g.s.map!==from){assert.ok(neighbors.includes(g.s.map));visited.push(g.s.map);}for(let n=0;n<20000&&g.s.map!==to;n++){const before=g.s.map,allowed=g.exits().filter(e=>!e.locked).map(e=>e.to);g.tick(.05);if(g.s.map!==before){assert.ok(allowed.includes(g.s.map));visited.push(g.s.map);}}assert.equal(g.s.map,to,id+' reaches destination');assert.deepEqual(visited,expected);return visited.length-1;}
let crossings=0;
crossings+=walk('m49','r_beimo_hero_room','e09_first_wake',reported,['m49','m50','r_beimo_hero_room']);
crossings+=walk('r_beimo_hero_room','m50','e09',woke,['r_beimo_hero_room','m50']);
crossings+=walk('m50','r_beimo_mei_room','e09_room_talk',escorted,['m50','r_beimo_mei_room']);
crossings+=walk('m50','r_beimo_hero_room','e09_sleepless',{...alone,evilMeiParted:true},['m50','r_beimo_hero_room']);
crossings+=walk('r_beimo_hero_room','m50','e09_second_meeting',{...alone,evilMeiParted:true,evilManorRestless:true},['r_beimo_hero_room','m50']);
crossings+=walk('m50','r_beimo_mei_room','e09_room_talk',reunited,['m50','r_beimo_mei_room']);
crossings+=walk('r_beimo_mei_room','m50','e09_morning',{...reunited,evilManorRoomTalk:true},['r_beimo_mei_room','m50']);
crossings+=walk('m50','m51','e10_teaching',{...reunited,evilManorRoomTalk:true,evilManorNightComplete:true},['m50','m49','m51']);
// Saving inside a room retains its actual door relation and night boundary.
let restoredDoors=0;for(const [id,map,flags]of [['e09_first_wake','r_beimo_hero_room',reported],['e09_room_talk','r_beimo_mei_room',reunited]]){const g=create(id,map,flags),entry=g.scene.portals.m50.entry;Object.assign(g.s.hero,entry);const reloaded=new GameEngine(restoreState(JSON.parse(JSON.stringify({...g.s,questId:id}))));assert.equal(reloaded.s.map,map);assert.equal(reloaded.s.hero.x,entry.x);assert.equal(reloaded.s.hero.y,entry.y);assert.equal(reloaded.passable(entry.x,entry.y),true);assert.deepEqual(reloaded.routeTo('m41'),[]);assert.deepEqual(reloaded.routeTo('m50'),[map,'m50']);restoredDoors++;}
// Browser regression: the common merchant must not stand beside a private
// garden conversation, including the choice screen and the morning departure.
let shopChecks=0;
for(const id of [...ids.slice(1),'e10_teaching'])for(const map of manor)for(const phase of ['travel','talk','choice','after']){
 const flags=id==='e10_teaching'?{...reunited,evilManorRoomTalk:true,evilManorNightComplete:true}:reunited;
 const g=create(id,map,flags);g.s.phase=phase;
 assert.ok(!g.markers.some(marker=>marker.kind==='shop'),id+' '+map+' '+phase+' keeps private manor scenes free of generic merchants');shopChecks++;
}
for(const [id,flags] of [['b03',{}],['e09_report',previous],['e10',{...reunited,evilManorNightComplete:true}],['g06',{route:'good',evilManorNightStarted:true}]])for(const map of manor){
 const g=create(id,map,flags);g.s.phase='talk';
 assert.equal(g.markers.some(marker=>marker.kind==='shop'),!!MAPS[map].shop,id+' '+map+' preserves its normal shop availability outside the private window');shopChecks++;
}
const outsideManor=create('e09','m41',reunited);outsideManor.s.phase='talk';assert.equal(outsideManor.markers.some(marker=>marker.kind==='shop'),!!MAPS.m41.shop,'private manor staging does not hide shops elsewhere');shopChecks++;

// The shared garden still supports its earlier battle on the new daytime floor.
const early=create('b02_ambush','m50',{});early.s.flags={};early.beginObjective();assert.equal(early.s.phase,'battle');for(const enemy of early.s.enemies)assert.equal(early.passable(enemy.x,enemy.y),true,'early ambush placement survives garden replacement');
assert.equal(getScene('m50',MAPS.m50).art,'beimo-garden-day','daytime garden uses actual daylight art');
console.log(JSON.stringify({status:'PASS',footpoints,paths,actualCrossings:crossings,restoredDoors,shopChecks,nightBoundary:'outbound only',branches:'escort and second meeting',earlyGardenBattle:true}));
