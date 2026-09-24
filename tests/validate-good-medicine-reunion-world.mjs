import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {getScene,getStagingScene,getDreamScene} from '../public/world.mjs';
import {GOOD_MEDICINE_REUNION_STAGING as staging} from '../public/good-medicine-reunion-staging.mjs';
import {shortestRoute,exitsFor} from '../public/routes.mjs';

// Isolated geometry/routes, not an original-game similarity or natural-play claim.
const variant='medicineCare',index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,id+' registered');return i;};
const state=(id,flags={},extra={})=>({quest:index(id),phase:'travel',flags:{route:'good',valleyLegacyCare:true,goodTowerHomecoming:true,goodRoseNightComplete:true,...flags},done:[],visited:[],...extra});
const sceneFor=id=>getScene(id,MAPS[id],variant);
const authored={
 m23:[[850,680],[930,570],[1090,485],[790,810],[790,930],[180,510],[300,590]],
 m49:[[760,700],[900,580],[850,780],[1020,595],[1175,730],[1260,820]],
 m50:[[555,565],[535,430],[1060,440],[760,650],[910,590],[805,645],[1020,480]],
 r_good_manor_infirmary:[[820,810],[850,720],[1080,575],[840,620],[990,735],[820,935]],
 r_good_manor_zhen_room:[[750,820],[850,650],[930,520],[875,610],[1000,500],[750,780],[750,925]],
 m16:[[760,810],[760,700],[930,575],[1080,660],[620,535],[760,875]],
 m17:[[920,520],[1100,610],[790,780],[800,810],[1130,505],[1030,675]],
 m70:[[585,800],[760,700],[1060,530]],
 m34:[[945,735],[1055,720],[980,610]],
 r_good_hanbo_road:[[800,800],[1165,470]],
 m41:[[490,700]],
};
let footpoints=0,paths=0,routeChecks=0;
for(const [id,xy] of Object.entries(authored)){
 const scene=sceneFor(id),g=new GameEngine();Object.defineProperty(g,'scene',{get:()=>scene});
 const raw=[scene.spawn,scene.objective,...scene.points,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...xy.map(([x,y])=>({x,y}))];
 const points=[...new Map(raw.map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
 assert.ok(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)),id+' uses available original artwork');
 for(const p of points){assert.ok(g.passable(p.x,p.y),id+' safe point '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;const path=g.findPath(b.x,b.y,a);assert.ok(path.length,id+' path '+JSON.stringify({a,b}));assert.ok(distance(path.at(-1),b)<35);let previous=a;for(const p of path){assert.ok(g.clearSegment(previous,p),id+' no obstacle cut');const steps=Math.max(1,Math.ceil(distance(previous,p)/5));for(let j=0;j<=steps;j++)assert.ok(g.passable(previous.x+(p.x-previous.x)*j/steps,previous.y+(p.y-previous.y)*j/steps),id+' sampled path');previous=p;}paths++;}
 for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,id+' no immediate exit on arrival');
 assert.deepEqual(scene.props,[],id+' complete painting has no duplicate flat props');
}
assert.equal(sceneFor('m23').art,'medicine-courtyard');assert.equal(getScene('m23',MAPS.m23).art,'forest-original','earlier medicine chapters keep their known footpoints');
assert.equal(sceneFor('r_good_manor_infirmary').art,'leaf-infirmary');assert.equal(sceneFor('r_good_manor_zhen_room').art,'zhen-chamber');
assert.deepEqual(Object.keys(sceneFor('m50').portals).sort(),['m49','r_good_manor_infirmary','r_good_manor_zhen_room'].sort(),'one destination per painted room door');
assert.deepEqual(Object.keys(sceneFor('m16').portals),['m17']);assert.deepEqual(Object.keys(sceneFor('m70').portals),['m49']);
for(const [id,x,y]of [['m23',1130,230],['m23',400,900],['r_good_manor_infirmary',1100,400],['r_good_manor_zhen_room',800,285]]){const g=new GameEngine();Object.defineProperty(g,'scene',{get:()=>sceneFor(id)});assert.equal(g.passable(x,y),false,id+' painted garden/bed remains solid');}
const meeting=sceneFor('m17').meetingPositions;assert.ok(distance(meeting['good-meeting-zi'],meeting['good-meeting-mei'])>190,'independent NPCs do not overlap');
for(const [key,id] of [['goodMedicineInfirmary','r_good_manor_infirmary'],['goodMedicineZhenRoom','r_good_manor_zhen_room'],['goodMedicineGarden','m50'],['goodMedicineHeroRoom','r_beimo_hero_room']]){
 const scene=getStagingScene(key);assert.equal(scene.art,getScene(id,MAPS[id],variant).art);assert.deepEqual(scene.portals,{});assert.deepEqual(scene.points,[]);assert.deepEqual(scene.props,[]);assert.equal(MAPS[key],undefined);assert.equal(getDreamScene(key),null,'real-place cutaways are not dreams');const original=getStagingScene(key);scene.spawn.x=-1;scene.obstacles[0][0]=-1;assert.deepEqual(getStagingScene(key),original,'camera scenes cannot mutate shared world masks');
}
const path=(from,to,id,flags={})=>{routeChecks++;return shortestRoute(from,to,state(id,flags),QUESTS);};
assert.deepEqual(path('m49','r_good_manor_infirmary','g21_visit',{goodMedicineCured:true}),['m49','m50','r_good_manor_infirmary']);
assert.deepEqual(path('r_good_manor_infirmary','r_good_manor_zhen_room','g22',{goodMedicineCured:true,goodMedicineVisited:true}),['r_good_manor_infirmary','m50','r_good_manor_zhen_room']);
for(const id of ['g21_return','g21_visit','g22','g22_dawn'])for(const from of ['m49','m50','r_good_manor_infirmary','r_good_manor_zhen_room'])for(const to of ['m17','m16','m70','m51'])assert.deepEqual(path(from,to,id,{goodMedicineCured:true}),[],id+' cannot leave before morning farewell');
assert.deepEqual(path('r_good_manor_zhen_room','m50','g21_return'),['r_good_manor_zhen_room','m50'],'a room can always be left even before its entry gate');
assert.deepEqual(path('m49','m17','g23',{goodMedicineCured:true,goodMedicineFarewellReady:true}),['m49','m41','r_good_hanbo_road','m17']);
assert.deepEqual(path('m17','m49','g23',{goodMedicineFarewellReady:true}),[],'first meeting temporarily closes return path');
for(const [id,flag] of [['g23_pickup','goodFirstZi'],['g23_farewell','goodFirstMei']]){
 const flags={goodMedicineCured:true,goodMedicineFarewellReady:true,goodMedicineFirstTalk:true,[flag]:true};
 assert.deepEqual(path('m17','m16',id,flags),['m17','m16']);assert.deepEqual(path('m16','m17',id,flags),['m16','m17']);
 for(const to of ['m49','m70','m18','m51'])assert.deepEqual(path('m16',to,id,flags),[],id+' old hut exit cannot skip the branch conversation');
}
assert.deepEqual(path('m17','m70','g23',{goodMedicineFarewellReady:true}),[],'first conversation cannot open final battlefield');
assert.deepEqual(path('m49','m70','g24',{goodMedicineCured:true,goodMedicineFarewellReady:true,goodMedicineHutComplete:true,goodMedicineReunited:true,goodMedicineChallenged:true}),['m49','m70']);
assert.deepEqual(path('m49','m70','g23_recruitment',{goodMedicineFarewellReady:true,goodMedicineHutComplete:true,goodMedicineReunited:true}),[],'reunion alone cannot skip final invitation');
assert.deepEqual(path('r_good_hanbo_road','m49','g23_reunion',{goodMedicineFarewellReady:true,goodMedicineHutComplete:true}),['r_good_hanbo_road','m41','m49']);
assert.deepEqual(path('r_good_hanbo_road','m17','g23_reunion',{goodMedicineFarewellReady:true,goodMedicineHutComplete:true}),[],'post-hut transfer cannot turn back into the valley');
for(const to of ['m17','m50','m70','m51'])assert.deepEqual(path('m49',to,'g23_reunion',{goodMedicineFarewellReady:true,goodMedicineHutComplete:true}),[],'arriving reunion seals manor until its actual event');
for(const id of ['r_good_manor_infirmary','r_good_manor_zhen_room'])assert.deepEqual(path(id,'m49','g24',{goodMedicineLegacy:true}),[id,'m50','m49'],'historical room save is not stranded');
for(const id of ['e09','g05']){const s=state(id,{route:id==='e09'?'evil':'good'});assert.equal(exitsFor('m50',s,QUESTS).some(e=>!e.locked&&['r_good_manor_infirmary','r_good_manor_zhen_room'].includes(e.to)),false,'new care rooms do not leak into '+id);}
// All actual staged actor/move/scene-hero coordinates, including both conditional
// branches, use the environment active at that step rather than the real map.
const stagePoints=new Map(),addPoint=(key,p)=>{if(Number.isFinite(p?.x)&&Number.isFinite(p?.y)){if(!stagePoints.has(key))stagePoints.set(key,[]);stagePoints.get(key).push({x:p.x,y:p.y});}};
for(const definition of Object.values(staging)){
 const real='map:'+definition.map;addPoint(real,definition.startPoint);
 for(const a of [...definition.actors,...definition.finalActors])addPoint(a.sceneKey||real,a);
 for(const understood of [false,true])for(const firstZi of [false,true]){
  const flags={goodMedicineUnderstood:understood,goodFirstZi:firstZi,goodFirstMei:!firstZi};let key=real;
  for(const step of definition.steps){if(step.when?.flag&&!flags[step.when.flag]||step.when?.not&&flags[step.when.not])continue;if(step.type==='scene'){key=step.scene||real;addPoint(key,step.hero);}if(step.type==='move')addPoint(key,step);}
 }
}
for(const [key,raw] of stagePoints){
 const scene=key.startsWith('map:')?sceneFor(key.slice(4)):getStagingScene(key),g=new GameEngine();assert.ok(scene,key+' registered camera scene');Object.defineProperty(g,'scene',{get:()=>scene});
 const points=[...new Map(raw.map(p=>[p.x+','+p.y,p])).values()];
 for(const p of points){assert.ok(g.passable(p.x,p.y),key+' stage point '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;const path=g.findPath(b.x,b.y,a);assert.ok(path.length,key+' actual stage path');let prior=a;for(const next of path){assert.ok(g.clearSegment(prior,next),key+' stage path does not cross furniture');prior=next;}paths++;}
}
const memorial=getStagingScene('goodMedicineMemorial');assert.deepEqual(memorial.props.map(p=>p.label),['纳兰潜凛之墓']);assert.deepEqual(memorial.portals,{});assert.deepEqual(memorial.points,[]);assert.equal(MAPS.goodMedicineMemorial,undefined);
assert.deepEqual(sceneFor('m34').portals,{});assert.deepEqual(sceneFor('m34').points,[]);
console.log(JSON.stringify({ok:true,scope:'R16 original scene geometry and physical return gates',footpoints,paths,routeChecks}));
