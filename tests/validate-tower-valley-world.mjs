import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameEngine, QUESTS, MAPS, distance } from '../public/runtime.mjs';
import { getScene } from '../public/world.mjs';
import { routeEdges, routeNeighbors, shortestRoute, exitsFor } from '../public/routes.mjs';
import { GOOD_TOWER_VALLEY_STAGING as stages } from '../public/good-tower-valley-staging.mjs';

// Geometry/route checks are isolated fixtures, not an end-to-end story playthrough.
const towerIds=Array.from({length:8},(_,i)=>'m'+(62+i));
const valleyIds=['m51','r_leaf_memorial','r_leaf_hero_room','r_leaf_rose_room'];
const index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,id+' registered');return i;};
const state=(id,flags={},extra={})=>({quest:index(id),questId:id,phase:'travel',flags:{route:'good',...flags},done:[],visited:[],...extra});
const geometry=id=>getScene(id,MAPS[id],id==='m51'?'towerAftermath':null);
let footpoints=0,pathChecks=0,routeChecks=0;
for(const id of [...towerIds,...valleyIds]){
 const scene=geometry(id),game=new GameEngine();Object.defineProperty(game,'scene',{get:()=>scene});
 assert.ok(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)),id+' original image exists');
 const local=Object.values(stages).filter(stage=>stage.map===id);
 const raw=[scene.spawn,scene.objective,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...(scene.tower?.guardPositions||[]),...Object.values(scene.sidePositions||{}),...local.flatMap(stage=>[stage.startPoint,...stage.actors,...stage.finalActors,...stage.steps.filter(step=>step.type==='move')])];
 const points=[...new Map(raw.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
 for(const p of points){assert.equal(game.passable(p.x,p.y),true,id+' footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){
  if(distance(a,b)<1)continue;const path=game.findPath(b.x,b.y,a);assert.ok(path.length,id+' route '+JSON.stringify({a,b}));assert.ok(distance(path.at(-1),b)<35);
  let previous=a;for(const next of path){assert.equal(game.clearSegment(previous,next),true,id+' no solid corner cutting');const steps=Math.max(1,Math.ceil(distance(previous,next)/5));for(let i=0;i<=steps;i++)assert.equal(game.passable(previous.x+(next.x-previous.x)*i/steps,previous.y+(next.y-previous.y)*i/steps),true,id+' sampled floor');previous=next;}pathChecks++;
 }
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.exit,portal.entry)>=90,id+' arrival does not immediately re-exit');
 if(scene.tower){
  assert.equal(MAPS[id].shop,false,id+' no generic shop in occupied tower');assert.deepEqual(scene.props,[]);assert.equal(scene.drawRoads,false);
  assert.equal(scene.tower.guardPositions.length,id==='m69'?0:43,'safe formation slots cover the largest lower-floor force only');
  const down=scene.portals[id==='m62'?'r_good_desert':'m'+(Number(id.slice(1))-1)];assert.deepEqual(down,scene.tower.down,id+' down stair not silently projected');
  if(id!=='m69')assert.deepEqual(scene.portals['m'+(Number(id.slice(1))+1)],scene.tower.up,id+' up stair not silently projected');
 }
}
assert.equal(new Set(towerIds.map(id=>geometry(id).art)).size,3,'lower, middle and prison have separately made art');
assert.equal(getScene('m51',MAPS.m51).art,'leaf-courtyard','earlier care courtyard remains intact');
assert.equal(geometry('m51').art,'leaf-ruined-courtyard');
assert.deepEqual(Object.keys(geometry('m51').portals).sort(),['m49','r_leaf_hero_room','r_leaf_memorial','r_leaf_rose_room'].sort(),'only visible late courtyard doors become portals');
assert.deepEqual(geometry('m51').portals.r_leaf_memorial.exit,{x:210,y:490});
for(const [id,x,y] of [['m62',380,795],['m64',420,850],['m69',185,420],['m64',1050,900],['m51',850,260],['r_leaf_memorial',400,825]]){
 const game=new GameEngine();Object.defineProperty(game,'scene',{get:()=>geometry(id)});assert.equal(game.passable(x,y),false,id+' painted railing/roof/rock is solid');
}
const memorial=geometry('r_leaf_memorial');assert.equal(memorial.props.length,2);
for(const grave of memorial.props){assert.ok(grave.requireFlag);assert.equal(grave.requireCue.value,'buried');assert.equal(memorial.obstacles.some(r=>JSON.stringify(r)===JSON.stringify(grave.footprint)),false,'unbuilt grave has no invisible collider');}
const occupiedMemorial={...memorial,obstacles:[...memorial.obstacles,...memorial.props.map(p=>p.footprint)]};
const graveGame=new GameEngine();Object.defineProperty(graveGame,'scene',{get:()=>occupiedMemorial});
for(const grave of memorial.props)assert.equal(graveGame.passable(grave.x,grave.y),false,'shown grave has a solid base');
for(const a of [memorial.spawn,{x:760,y:650},{x:895,y:625}])for(const b of [memorial.exit,{x:580,y:555},{x:1110,y:610}])assert.ok(graveGame.findPath(b.x,b.y,a).length,'burial cannot block its own stage or return path');

for(let i=0;i<7;i++){
 const current='gTower'+(i+1),here='m'+(62+i),up='m'+(63+i),s=state(current,{}, {phase:'battle'});
 assert.deepEqual(shortestRoute(here,up,s,QUESTS),[here,up],'zero kills/items still permit next floor');
 assert.deepEqual(shortestRoute(up,here,s,QUESTS),[up,here],'remaining guards do not close descent');routeChecks+=2;
}
const returnRoute=['m69','m68','m67','m66','m65','m64','m63','m62','r_good_desert','m54','r_good_feilong_approach','r_good_dunhuang_passage','r_good_dunhuang_approach','m49','m51'];
assert.deepEqual(shortestRoute('m69','m51',state('g19_return',{goodTowerRoseFreed:true,goodTowerDepartureReady:true}),QUESTS),returnRoute,'escort really returns through every tower floor and ground connection');routeChecks++;
assert.deepEqual(shortestRoute('m69','m68',state('g19_departure',{goodTowerRoseFreed:true}),QUESTS),[],'committed choice alone does not skip departure choreography');
assert.deepEqual(shortestRoute('m69','m68',state('g19',{}),QUESTS),['m69','m68'],'not-yet-rescued player may return');
assert.deepEqual(shortestRoute('m69','m51',state('g19_return',{goodTowerLegacyDeparture:true}),QUESTS),returnRoute,'old departure may return without fabricated kills');
for(const id of ['g19_burial','g20','g20_return1','g20_call2','g20_return2','g20_call3','g20_return3','g20_call4','g20_cry','g20_lastwords','g20_founddead','g20_rose_burial']){
 const s=state(id,{goodTowerHomecoming:true,goodTowerMengBuried:true},{done:QUESTS.map(q=>q.id),visited:Object.keys(MAPS)});
 for(const map of valleyIds)for(const outside of ['m49','m23','m52','m16','m69']){assert.deepEqual(shortestRoute(map,outside,s,QUESTS),[],id+' cannot leave before night outcome');routeChecks++;}
 for(const map of valleyIds)assert.ok(shortestRoute(map,'m51',s,QUESTS).length,'sealed valley still allows room/memorial return');
}
for(const [id,flags] of [['g21',{goodRoseNightComplete:true}],['gBad1',{goodRoseBuried:true,forsake:true}],['gBad1',{goodTowerValleyLegacy:true,forsake:true}]]){
 const s=state(id,{goodTowerHomecoming:true,...flags});for(const from of valleyIds){assert.ok(shortestRoute(from,'m49',s,QUESTS).length,'resolved/legacy chapter can leave the valley');routeChecks++;}
}
for(const oldRoom of ['r_leaf_zhen_room','r_leaf_mei_room'])assert.deepEqual(shortestRoute(oldRoom,'m51',state('g20',{goodTowerHomecoming:true,valleyLegacyCare:true}),QUESTS),[oldRoom,'m51'],'historical side-room cursor is not stranded');
const evil=state('eTower1',{route:'evil',goodTowerHomecoming:true,goodTowerRoseFreed:true});
assert.ok(!routeEdges(evil,QUESTS).some(e=>e.design?.startsWith('authored-good-tower')||e.design==='authored-good-valley-night'),'opposite-route flags cannot enable good tower/valley edges');

// Every concrete branch route must have physical endpoints. These mixed states
// cover both legacy cult selection and the invitation's non-uniform flags.
const samples=[{}, {cultPath:true}, {goodRoseRefusal1:true}, {goodRoseRefusal1:true,goodRoseCall1Ready:true,goodRoseRefusal2:true}, {goodRoseRefusal4:true,goodRoseLastVisit:true,forsake:true}, {goodRoseRefusal4:true,goodRoseAloneMorning:true,goodRoseDead:true,forsake:true}, {goodRoseStayed:true}, {evilQiangweiKill:true,evilZixuanRefuse:true,evilMeiAlone:true}, {evilQiangweiRefuse:true,evilZixuanKill:true}];
for(const route of ['good','evil'])for(const flags of samples){const s={quest:QUESTS.length,flags:{route,...flags}};for(const edge of routeEdges(s,QUESTS)){assert.ok(routeNeighbors(edge.from,QUESTS).includes(edge.to),'candidate includes actual mixed-flag route '+edge.from+' '+edge.to);assert.ok(routeNeighbors(edge.to,QUESTS).includes(edge.from));}}
// A deliberately mixed optional branch requires negating the intervening flag;
// checking only all-false/all-true states would omit A->C.
const miniature=[{id:'a',map:'A',when:{flag:'a'}},{id:'b',map:'B',when:{flag:'b'}},{id:'c',map:'C',when:{flag:'c'}}];
assert.ok(routeNeighbors('A',miniature).includes('C'),'structural adjacency handles a=true,b=false,c=true');
const exclusive=[{id:'a',map:'A',when:{flag:'a'}},{id:'c',map:'C',when:{not:'a'}}];
assert.ok(!routeNeighbors('A',exclusive).includes('C'),'mutually exclusive quest endpoints do not invent a portal');
console.log(JSON.stringify({ok:true,footpoints,pathChecks,routeChecks,artGroups:3,scope:'tower and late-valley geometry/topology; not original-art similarity or natural playthrough'}));
