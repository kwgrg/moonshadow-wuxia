import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,SIDE_QUESTS,distance} from '../public/runtime.mjs';
import {getScene} from '../public/world.mjs';
import {exitsFor,routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
const rooms=['r_leaf_zhen_room','r_leaf_mei_room','r_leaf_rose_room','r_leaf_hero_room'];
const ids=['g06','g06_confide','g06_inquire','g06_request','g06_return','g06_introduce','g06_rest','g07','g07_dawn','g07_visit','g07_zhen','g07_apology','g07_mainland','g07_island','g07_settle'];
const index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,id+' is integrated');return i;};
const priorFlags=id=>{const flags={route:'good',valleyCareRefused:true,valleyCareConsidered:false};for(const qid of ids){if(qid===id)break;const q=QUESTS[index(qid)];Object.assign(flags,q.rewards?.flags||{});if(qid==='g06')Object.assign(flags,q.choice.options[0].effects.flags);}return flags;};
const state=(id,flags)=>({quest:index(id),questId:id,flags:{route:'good',...flags},done:QUESTS.map(q=>q.id),visited:Object.keys(MAPS)});
const create=(id,map,flags=priorFlags(id))=>{const s=freshState();s.quest=index(id);s.map=map;s.phase='travel';s.flags={...s.flags,...flags};s.done=QUESTS.slice(0,index(id)).filter(q=>!q.when||q.when.route!=='evil').map(q=>q.id);s.claimedRewards=[...s.done];const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;};
const ancillary={r_mainland_dock:[[690,570],[815,495],[900,620],[700,455],[900,555]],m40:[[990,700],[900,650],[1030,610],[850,600],[760,570],[930,560]],m33:[[665,625],[600,540],[760,550],[720,610],[795,625]]};
let footpoints=0,paths=0;
for(const map of ['m51',...rooms,...Object.keys(ancillary)]){
 const g=create('g06',map,{route:'good'}),scene=g.scene;
 const stages=ids.map(id=>STAGED_QUESTS[id]).filter(stage=>stage?.map===map);
 const raw=[scene.spawn,scene.objective,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...stages.flatMap(stage=>[...(stage.actors||[]),...(stage.finalActors||[]),...(stage.steps||[]).filter(step=>step.type==='move')]),...(ancillary[map]||[]).map(([x,y])=>({x,y}))];
 const points=[...new Map(raw.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
 for(const p of points){assert.equal(g.passable(p.x,p.y),true,map+' footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;Object.assign(g.s.hero,a);const route=g.findPath(b.x,b.y);assert.ok(route.length,map+' connected route '+JSON.stringify({a,b}));assert.ok(distance(route.at(-1),b)<35);let prior=a;for(const next of route){const n=Math.max(1,Math.ceil(distance(prior,next)/5));for(let i=0;i<=n;i++)assert.equal(g.passable(prior.x+(next.x-prior.x)*i/n,prior.y+(next.y-prior.y)*i/n),true,map+' no corner cutting '+JSON.stringify({prior,next}));prior=next;}paths++;}
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.exit,portal.entry)>=90,map+' return requires a doorway approach');
 assert.ok(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)),map+' uses existing original art');
 if(map==='m51'||rooms.includes(map)){assert.deepEqual(scene.props,[]);assert.equal(scene.drawRoads,false);}
}
assert.equal(getScene('m51',MAPS.m51).art,'leaf-courtyard');
assert.equal(getScene('r_leaf_mei_room',MAPS.r_leaf_mei_room).art,'leaf-infirmary');
assert.equal(getScene('r_leaf_rose_room',MAPS.r_leaf_rose_room).art,'leaf-rose-room','day inquiry must not use the old painted moon window');
assert.equal(new Set(rooms.map(map=>getScene(map,MAPS[map]).art)).size,4,'all four physical rooms have distinct existing art');
for(const room of rooms)assert.deepEqual(routeNeighbors(room,QUESTS),['m51'],'rooms connect through the courtyard, never an inferred direct trip');
const started={route:'good',valleyCareStarted:true,valleyCareRefused:true,valleyCareConsidered:false};
for(const room of rooms){
 assert.deepEqual(shortestRoute('m51',room,state('g06',{route:'good'}),QUESTS),[],'before the answer the new room is not open');
 assert.deepEqual(shortestRoute(room,'m51',state('g06',{route:'good'}),QUESTS),[room,'m51'],'outward room door cannot strand a save');
 assert.deepEqual(shortestRoute('m51',room,state('g06_confide',started),QUESTS),['m51',room]);
}
for(const id of ids.slice(1,12))for(const map of ['m51',...rooms])for(const outside of ['m49','m23','m32','m40','m61'])assert.deepEqual(shortestRoute(map,outside,state(id,priorFlags(id)),QUESTS),[],id+' stays in the care loop despite excessive visit history');
assert.deepEqual(shortestRoute('r_leaf_rose_room','m52',state('g06_request',priorFlags('g06_request')),QUESTS),['r_leaf_rose_room','m51','m52']);
assert.deepEqual(shortestRoute('m52','r_leaf_zhen_room',state('g06_return',priorFlags('g06_return')),QUESTS),['m52','m51','r_leaf_zhen_room']);
const returning=priorFlags('g07_mainland'),boarded=priorFlags('g07_island'),landed=priorFlags('g07_settle'),settled=priorFlags('g08');
assert.deepEqual(shortestRoute('r_leaf_mei_room','r_mainland_dock',state('g07_mainland',returning),QUESTS),['r_leaf_mei_room','m51','m49','m41','r_mainland_dock']);
assert.deepEqual(shortestRoute('r_mainland_dock','m40',state('g07_mainland',returning),QUESTS),[],'cannot depart before the boarding conversation');
assert.deepEqual(shortestRoute('m40','m33',state('g07_island',boarded),QUESTS),[],'must land with both companions first');
assert.deepEqual(shortestRoute('r_mainland_dock','m33',state('g07_settle',landed),QUESTS),['r_mainland_dock','m40','m34','m33']);
for(const from of ['m51','m49','m41','r_mainland_dock','m40','m34','m33'])assert.deepEqual(shortestRoute(from,'m32',state('g07_settle',landed),QUESTS),[],'settle the patient before gathering herbs');
assert.deepEqual(shortestRoute('m33','m32',state('g08',settled),QUESTS),['m33','m32']);
assert.ok(!routeEdges(state('g08',settled),QUESTS).some(e=>[e.from,e.to].includes('m51')&&[e.from,e.to].includes('m32')),'new itinerary has no valley-to-island overland shortcut');
for(const [from,to,label] of [['r_mainland_dock','m40','乘船返回忘忧岛渡口'],['m40','r_mainland_dock','乘船前往中原码头']]){const exit=exitsFor(from,state('g07_settle',landed),QUESTS).find(e=>e.to===to);assert.equal(exit.transport,'boat');assert.equal(exit.travelLabel,label);}
for(const room of rooms)assert.deepEqual(shortestRoute('m51',room,state('g08',{route:'good',valleyLegacyCare:true}),QUESTS),['m51',room],'explicit legacy care permits revisiting without inventing new scenes');
for(const room of rooms)assert.deepEqual(shortestRoute('m51',room,state('g07',{route:'good',valleyLegacyCarePrelude:true}),QUESTS),['m51',room],'legacy prelude can reach night gratitude without claiming the whole return');
assert.deepEqual(shortestRoute('m51','m49',state('g07',{route:'good',valleyLegacyCarePrelude:true}),QUESTS),[],'legacy prelude does not bypass the remaining care loop');
assert.deepEqual(shortestRoute('m50','m51',{quest:index('b04'),flags:{}},QUESTS),['m50','m51'],'earlier valley visit remains possible');
for(const id of ['b04','e10']){const s={quest:index(id),flags:{route:id==='e10'?'evil':null,valleyCareStarted:true,valleyCareNight:true}};assert.ok(!routeEdges(s,QUESTS).some(e=>rooms.includes(e.from)||rooms.includes(e.to)),'earlier and opposite route cannot gain care-room itinerary');}

function walk(from,to,id,flags,expected){const g=create(id,from,flags),visited=[from];assert.equal(g.travel(to),true,id+' begins travel');if(g.s.map!==from)visited.push(g.s.map);for(let n=0;n<20000&&g.s.map!==to;n++){const before=g.s.map,allowed=g.exits().filter(e=>!e.locked).map(e=>e.to);g.tick(.05);if(g.s.map!==before){assert.ok(allowed.includes(g.s.map),'cross one adjacent edge');visited.push(g.s.map);}}assert.equal(g.s.map,to);assert.deepEqual(visited,expected);return visited.length-1;}
let crossings=0;
for(const [from,to,id,expected] of [
 ['m51','r_leaf_zhen_room','g06_confide',['m51','r_leaf_zhen_room']],
 ['r_leaf_zhen_room','r_leaf_rose_room','g06_inquire',['r_leaf_zhen_room','m51','r_leaf_rose_room']],
 ['r_leaf_zhen_room','r_leaf_hero_room','g06_rest',['r_leaf_zhen_room','m51','r_leaf_hero_room']],
 ['r_leaf_hero_room','r_leaf_rose_room','g07',['r_leaf_hero_room','m51','r_leaf_rose_room']],
 ['r_leaf_rose_room','r_leaf_hero_room','g07_dawn',['r_leaf_rose_room','m51','r_leaf_hero_room']],
 ['r_leaf_hero_room','r_leaf_mei_room','g07_visit',['r_leaf_hero_room','m51','r_leaf_mei_room']],
 ['r_leaf_mei_room','r_leaf_zhen_room','g07_zhen',['r_leaf_mei_room','m51','r_leaf_zhen_room']],
 ['r_leaf_zhen_room','r_leaf_mei_room','g07_apology',['r_leaf_zhen_room','m51','r_leaf_mei_room']],
 ['r_leaf_mei_room','r_mainland_dock','g07_mainland',['r_leaf_mei_room','m51','m49','m41','r_mainland_dock']],
 ['r_mainland_dock','m40','g07_island',['r_mainland_dock','m40']],
 ['m40','m33','g07_settle',['m40','m34','m33']]])crossings+=walk(from,to,id,priorFlags(id),expected);
let savedRooms=0;for(const [map,id] of [['r_leaf_zhen_room','g06_confide'],['r_leaf_rose_room','g07'],['r_leaf_hero_room','g07_dawn'],['r_leaf_mei_room','g07_visit']]){const g=create(id,map),point=g.scene.portals.m51.entry;Object.assign(g.s.hero,point);const loaded=new GameEngine(restoreState(JSON.parse(JSON.stringify({...g.s,questId:id}))));assert.equal(loaded.s.map,map);assert.equal(loaded.s.hero.x,point.x);assert.equal(loaded.s.hero.y,point.y);assert.deepEqual(loaded.routeTo('m51'),[map,'m51']);savedRooms++;}
let shopChecks=0;
for(const id of ids.slice(1))for(const map of ['m51',...rooms]){const g=create(id,map);g.s.phase='talk';assert.ok(!g.markers.some(marker=>marker.kind==='shop'),id+' preserves the private care setting');shopChecks++;}
for(const [id,flags] of [['b04',{}],['e10',{route:'evil'}],['g08',settled],['g08',{route:'good',valleyLegacyCare:true}]]){const g=create(id,'m51',flags);g.s.phase='talk';assert.equal(g.markers.some(marker=>marker.kind==='shop'),true,id+' keeps normal courtyard commerce outside the care window');shopChecks++;}
const oldNight=create('g07','m51',{route:'good',valleyLegacyCarePrelude:true});assert.ok(!oldNight.markers.some(marker=>marker.kind==='shop'));shopChecks++;
// The lake is deliberately disconnected for walking. Test the two safe
// surfaces independently, then cross only through the explicit leap API.
const lake=create('g06_request','m52'),scene=lake.scene,jump=scene.jumps?.[0];
assert.equal(scene.art,'tianchi-islet');assert.ok(jump&&jump.id==='tianchi-gap');
const mid=(jump.a.x+jump.b.x)/2;
const definition=STAGED_QUESTS.g06_request;
const islandPoints=[scene.objective,jump.b,...scene.points.filter(p=>p.x>mid),definition.startPoint,...definition.actors,...definition.steps.filter(step=>step.type==='move'),...QUESTS[index('b05')].searchPoints,SIDE_QUESTS.find(q=>q.id==='side7')];
const bankPoints=[scene.spawn,scene.exit,jump.a,...scene.points.filter(p=>p.x<mid),...Object.values(scene.portals).flatMap(p=>[p.exit,p.entry])];
for(const p of bankPoints)assert.ok(p.x<mid,'all normal entrances and exits remain on the western bank');
let lakePaths=0,waterSeparations=0;
for(const land of [bankPoints,islandPoints]){
 for(const p of land){assert.equal(lake.passable(p.x,p.y),true,'lake footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of land)for(const b of land){if(distance(a,b)<1)continue;Object.assign(lake.s.hero,a);const route=lake.findPath(b.x,b.y);assert.ok(route.length,'same platform remains connected');let previous=a;for(const next of route){assert.equal(lake.clearSegment(previous,next),true,'same platform path respects the painted edge');previous=next;}lakePaths++;}
}
for(const a of bankPoints)for(const b of islandPoints){Object.assign(lake.s.hero,a);assert.deepEqual(lake.findPath(b.x,b.y),[],'water cannot be crossed by pathfinding');assert.equal(lake.clearSegment(a,b),false);waterSeparations++;}
for(let x=jump.a.x+95;x<jump.b.x-85;x+=25)assert.equal(lake.passable(x,(jump.a.y+jump.b.y)/2),false,'the painted channel has no walking bridge');
Object.assign(lake.s.hero,scene.spawn);assert.equal(lake.approach(scene.objective),true,'objective navigation can lead to the takeoff point');
const approachEnd=[lake.target,...lake.waypoints].filter(Boolean).at(-1);assert.ok(approachEnd&&distance(approachEnd,jump.a)<35,'navigation stops at the near bank');
assert.equal(lake.startJump(jump.id,'b'),false,'cannot remotely jump from the opposite shore');
Object.assign(lake.s.hero,jump.a);assert.equal(lake.startJump(jump.id,'a'),true);for(let i=0;i<5;i++)lake.tick(.05);assert.ok(lake.renderJump()?.jumpHeight>0);
const midair=new GameEngine(restoreState(JSON.parse(JSON.stringify({...lake.s,questId:'g06_request'}))));assert.ok(distance(midair.s.hero,jump.a)<1,'midair reload resumes from safe departure ground');assert.ok(!midair.jump);assert.equal(midair.passable(midair.s.hero.x,midair.s.hero.y),true);
while(lake.jump)lake.tick(.05);assert.ok(distance(lake.s.hero,jump.b)<1);assert.equal(lake.startJump(jump.id,'b'),true);while(lake.jump)lake.tick(.05);assert.ok(distance(lake.s.hero,jump.a)<1);
console.log(JSON.stringify({status:'PASS',footpoints,paths,crossings,savedRooms,shopChecks,lakePaths,waterSeparations,lakeLeaps:2,rooms:'four physical courtyard doors',return:'two shore legs and a named boat crossing'}));
