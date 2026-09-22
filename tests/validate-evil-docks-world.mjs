import assert from 'node:assert/strict';
import {GameEngine, freshState, QUESTS, MAPS, distance} from '../public/runtime.mjs';
import {getScene, getDreamScene, getStagingScene} from '../public/world.mjs';
import {routeEdges, routeNeighbors, shortestRoute, exitsFor} from '../public/routes.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

const index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,'integrated quest '+id);return i;};
const make=id=>{const s=freshState();s.map=id;s.flags.route='evil';const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;};
const authored={
 r_island_village:[[400,620],[520,600],[350,470],[420,485],[450,540],[545,520],[350,560],[230,580]],
 m40:[[650,600],[750,560],[850,570],[900,650],[780,690],[990,700],[1030,610],[1175,700],[1095,680]],
 r_mainland_dock:[[700,455],[815,495],[700,865],[820,730],[900,620],[835,525],[690,570],[825,650],[800,675],[760,700]]
};
let paths=0,footpoints=0;
function validatePaths(g,points,label){
 const unique=[...new Map(points.map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
 for(const p of unique){assert.equal(g.passable(p.x,p.y),true,label+' walkable footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of unique)for(const b of unique){if(distance(a,b)<1)continue;Object.assign(g.s.hero,a);const path=g.findPath(b.x,b.y);assert.ok(path.length,label+' connected floor');assert.ok(distance(path.at(-1),b)<35);let previous=a;for(const next of path){const n=Math.max(1,Math.ceil(distance(previous,next)/5));for(let step=0;step<=n;step++)assert.equal(g.passable(previous.x+(next.x-previous.x)*step/n,previous.y+(next.y-previous.y)*step/n),true,label+' path remains on painted floor '+JSON.stringify({a,b,previous,next,step,n}));previous=next;}paths++;}
}
for(const [id,coords] of Object.entries(authored)){
 const g=make(id),scene=g.scene;assert.equal(scene.props.length,0,'painting has no duplicate flat props');assert.equal(scene.drawRoads,false);
 const stages=Object.values(STAGED_QUESTS).filter(stage=>stage.map===id);
 const stagedPoints=stages.flatMap(stage=>[...(stage.actors||[]),...(stage.steps||[]).filter(step=>step.type==='move').map(({x,y})=>({x,y}))]);
 validatePaths(g,[scene.spawn,scene.objective,...scene.points,...coords.map(([x,y])=>({x,y})),...Object.values(scene.skirmish?.positions||{}),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...stagedPoints],id);
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,'return passage requires walking away from arrival');
}
const village=getScene('r_island_village',MAPS.r_island_village),dock=getScene('r_mainland_dock',MAPS.r_mainland_dock),roster=QUESTS[index('e08_island_battle')].skirmish;
assert.equal(village.art,'island-village');assert.equal(dock.art,'mainland-dock');assert.notDeepEqual(village.obstacles,dock.obstacles,'distinct paintings have distinct geometry');
const enemyPositions=roster.enemies.map(enemy=>{const p=village.skirmish.positions[enemy.id];assert.ok(p,'authored placement for '+enemy.id);return p;});
assert.equal(enemyPositions.length,36);assert.equal(new Set(enemyPositions.map(p=>p.x+','+p.y)).size,36);
for(const p of enemyPositions)assert.ok(distance(p,village.skirmish.heroStart)>=400,'player can see the army before entering contact');
for(let i=0;i<enemyPositions.length;i++)for(let j=i+1;j<enemyPositions.length;j++)assert.ok(distance(enemyPositions[i],enemyPositions[j])>=55,'individual enemy feet are initially distinguishable');
assert.ok(village.skirmish.positions['island-mei']);assert.equal(roster.allies[0].id,'island-mei');
// Village fences and quay water are actual visible ground boundaries.
assert.equal(make('r_island_village').passable(430,850),false,'vegetable enclosure is not combat ground');
assert.equal(make('r_mainland_dock').passable(1000,310),false,'river is not walkable');
assert.equal(make('r_mainland_dock').passable(700,335),true,'painted wooden jetty supports the voyage exit');
assert.equal(make('r_mainland_dock').passable(710,920),true,'southern stairs support the inland exit');

const tower=getStagingScene('towerInterlude');assert.ok(tower);assert.equal(tower.hidePlayer,true);assert.equal(tower.art,'hall');
assert.equal(getDreamScene('towerInterlude'),null,'cutaway is not mislabeled as a dream');assert.equal(MAPS.towerInterlude,undefined);
for(const scene of [tower,getStagingScene('weddingDream'),getStagingScene('lakeDream')]){assert.deepEqual(scene.portals,{});assert.deepEqual(scene.points,[]);assert.deepEqual(scene.props,[]);}
assert.equal(getStagingScene('unknown'),null);assert.equal(routeNeighbors('towerInterlude',QUESTS).length,0);
const towerEngine=make('m71');Object.defineProperty(towerEngine,'scene',{get:()=>tower});validatePaths(towerEngine,[[620,650],[780,620],[950,480],[930,520],[760,650]].map(([x,y])=>({x,y})),'tower cutaway');
tower.obstacles[0][0]=-999;assert.notEqual(getStagingScene('towerInterlude').obstacles[0][0],-999,'cutaway scenes do not leak mutable collision state');

const trailFlags=Object.fromEntries(['evilZhenMissing','evilTrailVillage','evilTrailApproach','evilTrailEntry','evilTrailFirst','evilTrailSecond','evilGateOpened'].map(key=>[key,true]));
const state=(id,flags={})=>({quest:index(id),questId:id,flags:{route:'evil',...trailFlags,evilRecruitAccepted:true,...flags},done:QUESTS.map(q=>q.id),visited:Object.keys(MAPS)});
// Deliberately excessive historical visits/done entries never substitute for
// the current earned island flags. This is a map gate test, not a replay score.
const returning=state('e08_interlude');
assert.deepEqual(shortestRoute('m57','r_forbidden_path',returning,QUESTS),['m57','r_forbidden_gate','r_forbidden_second','r_forbidden_first','r_forbidden_entry','r_forbidden_path']);
assert.deepEqual(shortestRoute('m57','r_island_village',returning,QUESTS),[]);
const relieved=state('e08_island_battle',{evilTowerInterludeComplete:true});
assert.deepEqual(shortestRoute('r_forbidden_path','r_island_village',relieved,QUESTS),['r_forbidden_path','m31','r_island_village']);
assert.deepEqual(shortestRoute('r_island_village','m40',relieved,QUESTS),[]);
const cleared=state('e08_departure',{evilTowerInterludeComplete:true,evilIslandCleared:true});
assert.deepEqual(shortestRoute('r_island_village','m40',cleared,QUESTS),['r_island_village','m40']);
assert.deepEqual(shortestRoute('m40','r_mainland_dock',cleared,QUESTS),[]);
const sailed=state('e08',{evilTowerInterludeComplete:true,evilIslandCleared:true,evilIslandFarewell:true});
assert.deepEqual(shortestRoute('m40','r_mainland_dock',sailed,QUESTS),['m40','r_mainland_dock']);
for(const flags of [{},{evilZixuanDecision:true,evilZixuanRefuse:true},{evilZixuanDecision:true,evilZixuanKill:true}])assert.deepEqual(shortestRoute('r_mainland_dock','m49',{...sailed,flags:{...sailed.flags,...flags}},QUESTS),[],'a decision without the fixed outcome cannot leave for the manor');
for(const from of ['m31','m40','m57'])for(const to of ['m34','m39','r_evil_ferry','m56','m58','m49'])assert.deepEqual(shortestRoute(from,to,sailed,QUESTS),[],'historical island bypass '+from+' -> '+to);
const completed=state('e09',{...sailed.flags,evilZixuanDead:true});assert.deepEqual(shortestRoute('r_mainland_dock','m49',completed,QUESTS),['r_mainland_dock','m41','m49']);
assert.ok(shortestRoute('m40','r_evil_ferry',completed,QUESTS).length,'later travel returns after the fixed result');
const legacy=state('e08',{evilLegacyIslandPassage:true});assert.deepEqual(shortestRoute('m40','r_mainland_dock',legacy,QUESTS),['m40','r_mainland_dock']);assert.deepEqual(shortestRoute('r_mainland_dock','m41',legacy,QUESTS),[]);
assert.deepEqual(shortestRoute('r_mainland_dock','m41',state('e09',{evilLegacyZixuanOutcome:true}),QUESTS),['r_mainland_dock','m41']);
assert.ok(shortestRoute('m40','m41',{quest:QUESTS.length,flags:{route:'good'}},QUESTS).length,'good route historical travel is preserved');
const out=exitsFor('m40',sailed,QUESTS).find(exit=>exit.to==='r_mainland_dock'),back=exitsFor('r_mainland_dock',sailed,QUESTS).find(exit=>exit.to==='m40');assert.equal(out.transport,'boat');assert.equal(out.travelLabel,'乘船前往中原码头');assert.equal(back.travelLabel,'乘船返回忘忧岛渡口');
for(const id of ['r_island_village','r_mainland_dock'])assert.ok(!routeEdges({quest:QUESTS.length,flags:{route:'good'}},QUESTS).some(edge=>edge.from===id||edge.to===id),'evil island scenes do not leak into the good itinerary');
// Walk the real engine across each adjacent scene after its prerequisite has
// been earned; this catches valid graph edges with disconnected portal feet.
function walkLeg(from,to,id,flags,expected){
 const raw=freshState();raw.quest=index(id);raw.map=from;raw.phase='travel';raw.flags={...raw.flags,...trailFlags,route:'evil',evilRecruitAccepted:true,...flags};raw.done=QUESTS.slice(0,index(id)).map(q=>q.id);raw.claimedRewards=[...raw.done];
 const g=new GameEngine(raw);Object.assign(g.s.hero,g.scene.spawn);const seen=[from],initialNeighbors=g.exits().filter(exit=>!exit.locked).map(exit=>exit.to);assert.equal(g.travel(to),true,'set adjacent walking itinerary '+from+' -> '+to);if(g.s.map!==from){assert.ok(initialNeighbors.includes(g.s.map),'synchronous crossing still uses one adjacent portal');seen.push(g.s.map);}
 for(let n=0;n<18000&&g.s.map!==to;n++){const before=g.s.map,allowed=g.exits().filter(exit=>!exit.locked).map(exit=>exit.to);g.tick(.05);if(g.s.map!==before){assert.ok(allowed.includes(g.s.map),'each crossing is one unlocked neighboring map');seen.push(g.s.map);}}
 assert.equal(g.s.map,to,'walking reaches '+to);assert.deepEqual(seen,expected);return seen.length-1;
}
let crossings=0;
crossings+=walkLeg('m57','r_forbidden_path','e08_interlude',{},['m57','r_forbidden_gate','r_forbidden_second','r_forbidden_first','r_forbidden_entry','r_forbidden_path']);
crossings+=walkLeg('r_forbidden_path','r_island_village','e08_island_battle',{evilTowerInterludeComplete:true},['r_forbidden_path','m31','r_island_village']);
crossings+=walkLeg('r_island_village','m40','e08_departure',{evilTowerInterludeComplete:true,evilIslandCleared:true},['r_island_village','m40']);
crossings+=walkLeg('m40','r_mainland_dock','e08',{evilTowerInterludeComplete:true,evilIslandCleared:true,evilIslandFarewell:true},['m40','r_mainland_dock']);
crossings+=walkLeg('r_mainland_dock','m49','e09',{evilTowerInterludeComplete:true,evilIslandCleared:true,evilIslandFarewell:true,evilZixuanDead:true},['r_mainland_dock','m41','m49']);

// Cached neighbours are defensive copies and invalidate after a quest shape edit.
const table=[{id:'x',map:'x'},{id:'y',map:'y',when:{flag:'one'}},{id:'z',map:'z',when:{not:'one'}}];
const neighbors=routeNeighbors('x',table);neighbors.push('corrupt');assert.ok(!routeNeighbors('x',table).includes('corrupt'));table.push({id:'w',map:'w'});assert.ok(routeNeighbors('w',table).length);
console.log(JSON.stringify({status:'PASS',footpoints,geometryPaths:paths,enemyPlacements:enemyPositions.length,actualCrossings:crossings,routeWindow:'earned flags, both decisions, legacy and good-route isolation'}));
