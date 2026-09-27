import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {getScene,SCENE_ART_KEYS} from '../public/world.mjs';
import {shortestRoute,exitsFor,routeNeighbors} from '../public/routes.mjs';
import {ROAD_ENCOUNTERS} from '../public/road-encounters.mjs';

// Authored topology and collision checks, never native layout or difficulty proof.
const outer='r_good_manor_outer',pass='r_good_huian_pass',edge='r_good_medicine_edge';
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert(n>=0,id);return n;};
const flags={route:'good',goodTowerHomecoming:true,goodRoseNightComplete:true,goodMedicineCured:true,goodMedicineMorningReady:true,goodMedicineFarewellReady:true};
const state=(id,map,extra={})=>({...freshState(),quest:index(id),questId:id,map,phase:'travel',flags:{...flags,...extra}});
const sceneFor=id=>getScene(id,MAPS[id],'medicineCare');
const budget=g=>JSON.stringify([g.s.coins,g.s.kills,g.s.hero.exp,g.s.hero.level,g.s.potions,g.s.elixirs,g.s.inventory,g.s.affection,g.s.done,g.s.claimed]);
let footpoints=0,paths=0,gates=0,walks=0,observations=0,liveCrossings=0;
const definitions=[[outer,'beimo-ridge-road','medicine-outer',12,['m49',pass]],[pass,'huian-pine-road','medicine-pass',25,[outer,'m41']],[edge,'yaowang-outer-valley','medicine-eagle',30,['m23']]];
for(const [id,art,prefix,count,neighbors]of definitions){
 const scene=sceneFor(id),g=new GameEngine();Object.defineProperty(g,'scene',{get:()=>scene});
 assert.equal(scene.art,art);assert(SCENE_ART_KEYS.includes(art));assert(fs.existsSync(new URL('../public/assets/'+art+'.png',import.meta.url)),art+' independently authored image');
 assert.deepEqual(Object.keys(scene.portals).sort(),neighbors.sort());assert.deepEqual(routeNeighbors(id,QUESTS).sort(),neighbors.sort());
 assert.equal(scene.ambient.id,id);assert.equal(Object.keys(scene.ambient.positions).length,count);
 assert.deepEqual(Object.keys(scene.ambient.positions),Array.from({length:count},(_,n)=>prefix+'-'+String(n+1).padStart(2,'0')));
 assert.equal(scene.points.length,2);assert(scene.points.every(p=>p.kind==='inspect'&&!p.reward));assert.deepEqual(scene.props,[]);
 const anchors=[scene.spawn,scene.objective,scene.ambient.heroStart,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.exit,p.entry])];
 for(const p of [...anchors,...Object.values(scene.ambient.positions)]){assert(g.passable(p.x,p.y),id+' reachable footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of anchors)for(const b of [...anchors,...Object.values(scene.ambient.positions)]){
  if(distance(a,b)<1)continue;const way=g.findPath(b.x,b.y,a);assert(way.length,id+' connected route '+JSON.stringify({a,b}));assert(distance(way.at(-1),b)<35);
  let prior=a;for(const next of way){assert(g.clearSegment(prior,next),id+' no corner cutting');const n=Math.max(1,Math.ceil(distance(prior,next)/8));for(let i=0;i<=n;i++)assert(g.passable(prior.x+(next.x-prior.x)*i/n,prior.y+(next.y-prior.y)*i/n));prior=next;}paths++;
 }
 for(const p of Object.values(scene.portals))assert(distance(p.entry,p.exit)>=90,id+' arrival does not retrigger exit');
 for(const safe of [scene.spawn,scene.ambient.heroStart,...Object.values(scene.portals).map(p=>p.entry)])for(const enemy of ROAD_ENCOUNTERS[id].enemies)assert(distance(safe,scene.ambient.positions[enemy.id])>enemy.aggroRadius+15,id+' safe arrival outside fresh enemy awareness');
}
for(const [id,x,y]of [[outer,800,820],[outer,1160,700],[pass,700,150],[pass,1250,860],[edge,180,240],[edge,800,960]]){
 const g=new GameEngine();Object.defineProperty(g,'scene',{get:()=>sceneFor(id)});assert(!g.passable(x,y),id+' cliff/water/rock is not walkable');gates++;
}
const route=(from,to,id,extra={},rest={})=>{gates++;return shortestRoute(from,to,{...state(id,from,extra),...rest},QUESTS);};
assert.deepEqual(route('m49','m17','g23'),['m49',outer,pass,'m41','r_good_hanbo_road','m17']);
assert.deepEqual(route('r_good_hanbo_road','m49','g23_reunion',{goodMedicineHutComplete:true}),['r_good_hanbo_road','m41',pass,outer,'m49']);
for(const id of ['g23','g23_pickup','g23_farewell'])assert.deepEqual(route(outer,'m49',id),[],'2034 cannot reenter manor');
assert.deepEqual(route(outer,'m49','g23_reunion',{goodMedicineHutComplete:true}),[outer,'m49']);
for(const id of ['g23','g23_reunion'])for(const map of [outer,pass,'m41'])for(const to of ['r_mainland_dock','m59','m51','m18'])assert.deepEqual(route(map,to,id,{goodMedicineHutComplete:id==='g23_reunion'}),[],id+' bounded itinerary has no dock or old shortcut');
assert.deepEqual(route('m41','m49','g23'),[],'townward exit cannot bypass manor return gate');
assert.deepEqual(route('r_good_hanbo_road','m17','g23_reunion',{goodMedicineHutComplete:true}),[],'2040 cannot turn back into valley');
assert.deepEqual(route('m17','m16','g23'),[],'first interaction still required');
for(const [id,first]of [['g23_pickup','goodFirstZi'],['g23_farewell','goodFirstMei']]){
 assert.deepEqual(route('m17','m16',id,{goodMedicineFirstTalk:true,[first]:true}),['m17','m16']);
 assert.deepEqual(route('m16','m49',id,{goodMedicineFirstTalk:true,[first]:true}),[],'must speak inside hut before return transfer');
}
for(const [a,b]of [[edge,'m23'],['m23',edge]])assert.deepEqual(route(a,b,'g21',{goodMedicineCured:false}),[a,b],'eagles cannot gate diagnosis or its approach');
for(const to of ['m51','m49','m41'])assert.deepEqual(route(edge,to,'g21'),[],'consultation return is an explicit event transfer');
for(const id of ['g05','a34','a39','gBad1','gBad2','e14'])for(const map of ['m49','m41','m23'])for(const to of [outer,pass,edge])assert.deepEqual(route(map,to,id,{route:id==='e14'?'evil':'good',forsake:id.startsWith('gBad')}),[],id+' cannot acquire new late-good roads');
for(const extra of [{cultPath:true},{forsake:true},{route:'evil'}])for(const to of [outer,pass,edge])assert.deepEqual(route('m49',to,'g23',extra),[],'route flag isolation');
// Combat counters cannot invent a route gate; same exits with every unit alive.
for(const [map,to,id]of [[outer,pass,'g23'],[pass,'m41','g23'],[pass,outer,'g23_reunion'],[edge,'m23','g21']]){
 const extra={goodMedicineHutComplete:id==='g23_reunion'},army=Object.entries(sceneFor(map).ambient.positions).map(([id,p])=>({id,...p,hp:100,maxHp:100}));
 const alive=route(map,to,id,extra,{enemies:army,kills:0,phase:'battle'}),dead=route(map,to,id,extra,{enemies:army.map(e=>({...e,hp:0})),kills:army.length,phase:'after'});
 assert.deepEqual(alive,[map,to]);assert.deepEqual(alive,dead);
}
// Old clinic saves retain their actual position and can still find the doctor.
{
 const raw=state('g21','m23',{goodMedicineCured:false});Object.assign(raw.hero,{x:850,y:680});raw.campaignRevision=18;
 const g=new GameEngine(restoreState(JSON.parse(JSON.stringify(raw))));assert.equal(g.s.map,'m23');assert.equal(g.q.id,'g21');assert.equal(g.scene.art,'medicine-courtyard');assert(g.findPath(850,680).length||distance(g.s.hero,{x:850,y:680})<10);gates++;
}
for(const map of ['m1','m16','m51','m66','r_mainland_dock']){
 if(map==='m16')continue;
 const normal=getScene(map,MAPS[map]),other=sceneFor(map);assert.equal(other.variant,normal.variant);assert.deepEqual(other.portals,normal.portals);gates++;
}
// Actual production walking keeps the plot cursor and economic ledger stable.
// Delay enemy attacks here to isolate route geometry. Browser play covers danger.
function create(id,map,extra={}){const g=new GameEngine(state(id,map,extra));Object.assign(g.s.hero,g.scene.ambient?.heroStart||g.scene.spawn);return g;}
function walk(g,to){
 const from=g.s.map,before=budget(g),id=g.q.id;assert(g.exits().some(e=>e.to===to&&!e.locked));assert(g.travel(to));
 for(let n=0;n<15000&&g.s.map===from;n++){for(const e of g.s.enemies){e.attackTimer=59;e.skillTimer=59;e.telegraph=0;}g.tick(.05);}
 assert.equal(g.s.map,to,from+' actual walking to '+to);assert.equal(g.q.id,id);assert.equal(budget(g),before);walks++;
}
let g=create('g23','m49');for(const to of [outer,pass,'m41','r_good_hanbo_road','m17'])walk(g,to);
g=create('g23_reunion','r_good_hanbo_road',{goodMedicineFirstTalk:true,goodFirstZi:true,goodMedicineHutComplete:true});for(const to of ['m41',pass,outer,'m49'])walk(g,to);
g=create('g21',edge,{goodMedicineCured:false});walk(g,'m23');walk(g,edge);walk(g,'m23');
// Keep real enemy awareness, movement and attacks for one crossing. Increased
// health separates traversability from balance; it is not a default-level win.
{
 const g=create('g23',outer),before=budget(g);Object.assign(g.s.hero,{hp:20000,maxHp:20000});g.ensureRoadEncounter();let noticed=false;
 for(const [x,y]of [[1190,335],[1040,430],[890,520],[720,570],[545,610],[400,650]]){
  assert(g.moveTo(x,y));for(let n=0;n<2500&&(g.target||g.waypoints.length);n++){g.tick(.05);noticed||=g.s.enemies.some(e=>e.aggro);}
  assert(distance(g.s.hero,{x,y})<35,'actual exposed route waypoint');assert.equal(g.s.map,outer);
 }
 assert(g.travel(pass));for(let n=0;n<5000&&g.s.map===outer;n++){g.tick(.05);noticed||=g.s.enemies.some(e=>e.aggro);}
 assert.equal(g.s.map,pass);assert(noticed,'real enemies detected the moving player');assert.equal(g.s.roadEncounters[outer].roster.filter(e=>e.hp>0).length,12);assert.equal(g.q.id,'g23');assert.equal(budget(g),before);liveCrossings++;
}
for(const [map]of definitions){
 const id=map===edge?'g21':'g23',g=create(id,map,{goodMedicineCured:map!==edge});
 for(const p of g.scene.points){const before=budget(g);Object.assign(g.s.hero,{x:p.x,y:p.y});g.interact(p);assert.equal(budget(g),before);assert.equal(g.q.id,id);observations++;}
}
console.log(JSON.stringify({ok:true,scope:'R19 authored optional-road geometry and physical gates',footpoints,paths,gates,walks,observations,liveCrossings}));
