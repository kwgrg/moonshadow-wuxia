import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,SIDE_QUESTS,distance} from '../public/runtime.mjs';
import {getScene,SCENE_ART_KEYS} from '../public/world.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
const groups={
 'forest-original':['m6','m7','m23','m27','m32','m75','r_forbidden_path','r_forbidden_entry','r_evil_yitian','r_lingjue','r_wudang'],
 'lake-original':['m17'],
 'town-original':['m18','m41','m44','m72','m74']
};
const hashes={'forest-original':'cc53f598bf50b02bf96d884ded06c51ed956b624a75ace175a6fe35c5acdc2c9','lake-original':'98ab7a9c188ccfed24ae5c8153260cd8950dc62bab1a46dc8140c30d42808b0e','town-original':'71f727b7c786fcf8344bf60bf85ea1880732b3ec9c03bb3ae6ee4b1ca293d019'};
const create=map=>{const s=freshState();s.map=map;s.phase='travel';return new GameEngine(s);};
let pointsChecked=0,pathsChecked=0,searchItems=0,restores=0,sideMarkers=0;
function checkPath(g,a,b){if(distance(a,b)<1)return;Object.assign(g.s.hero,a);const route=g.findPath(b.x,b.y);assert.ok(route.length,g.s.map+' reachable '+JSON.stringify({a,b}));assert.ok(distance(route.at(-1),b)<35);let from=a;for(const to of route){assert.equal(g.clearSegment(from,to),true,'no painted obstacle crossing');const steps=Math.max(1,Math.ceil(distance(from,to)/5));for(let n=0;n<=steps;n++)assert.equal(g.passable(from.x+(to.x-from.x)*n/steps,from.y+(to.y-from.y)*n/steps),true,'continuous 5px walking samples');from=to;}pathsChecked++;}
for(const [art,maps] of Object.entries(groups)){
 assert.ok(SCENE_ART_KEYS.includes(art),'renderer preloads new art');const bytes=fs.readFileSync(new URL('../public/assets/'+art+'.png',import.meta.url));assert.equal(bytes.readUInt32BE(16),1536);assert.equal(bytes.readUInt32BE(20),1024);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hashes[art],'published image is the inspected generated PNG');
 for(const map of maps){const g=create(map),scene=g.scene;assert.equal(scene.art,art);assert.equal(scene.drawRoads,false);assert.deepEqual(scene.props,[],'painting is not obscured by duplicate flat props');
  const definitions=Object.values(STAGED_QUESTS).filter(def=>def.map===map);
  const authored=[scene.spawn,scene.objective,scene.exit,...scene.points,...QUESTS.filter(q=>q.map===map&&(Number.isFinite(q.x)||Number.isFinite(q.y))).map(q=>({x:q.x??scene.objective.x,y:q.y??scene.objective.y})),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit]),...(scene.pursuitPath||[]),...definitions.flatMap(def=>[def.startPoint,...(def.actors||[]),...(def.steps||[]).filter(step=>step.type==='move')]).filter(Boolean)];
  for(const marker of g.markers.filter(p=>p.kind==='side'||p.kind==='shop')){authored.push(marker);sideMarkers++;}
  const points=[...new Map(authored.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>[p.x+','+p.y,{x:p.x,y:p.y}])).values()];
  for(const p of points){assert.equal(g.passable(p.x,p.y),true,map+' actual footpoint '+JSON.stringify(p));pointsChecked++;}
  for(const a of points)for(const b of points)checkPath(g,a,b);
  for(const portal of Object.values(scene.portals))assert.ok(distance(portal.entry,portal.exit)>=90,'entry is separated from the return trigger');
  for(const q of QUESTS.filter(q=>q.map===map&&q.type==='search')){g.s.quest=QUESTS.indexOf(q);g.s.phase='search';for(const p of g.searchPoints){assert.equal(g.passable(p.x,p.y),true,q.id+' search item stays on the painted floor');checkPath(g,scene.spawn,p);searchItems++;}}
  // A save at the former terrain edge is repaired to this painting's dry floor.
  const raw=JSON.parse(JSON.stringify({...freshState(),map,hero:{...freshState().hero,x:1370,y:915}}));const loaded=new GameEngine(restoreState(raw));assert.equal(loaded.s.map,map);assert.equal(loaded.passable(loaded.s.hero.x,loaded.s.hero.y),true);checkPath(loaded,loaded.s.hero,loaded.scene.objective);restores++;
 }
}
for(const [map,blocked] of Object.entries({m6:[[320,260],[1160,840],[500,900]],m17:[[800,210],[1120,850],[480,880]],m41:[[750,240],[1150,850],[830,940]]})){const g=create(map);for(const [x,y] of blocked){assert.equal(g.passable(x,y),false,map+' visible water/tree/stall/wall remains solid');assert.equal(g.clearSegment(g.scene.objective,{x,y}),false);}}
// The new lake remains suitable for independently written temporary dream actors.
const lake=create('m17'),dreamFeet=[[920,520],[750,740],[820,620],[1120,550],[1020,590],[1180,480],[650,650],[1030,650],[850,450],[1100,470],[1050,580],[945,560],[940,675]].map(([x,y])=>({x,y}));
for(const p of dreamFeet){assert.equal(lake.passable(p.x,p.y),true);pointsChecked++;}for(const a of dreamFeet)for(const b of dreamFeet)checkPath(lake,a,b);
for(const [map,id,expected] of [['m6','gather_garlic',{x:1110,y:710}],['m75','gather_ginger',{x:1110,y:710}],['m72','gather_fishhook',{x:1060,y:740}]]){const g=create(map),marker=g.markers.find(p=>p.id===id);assert.ok(marker);assert.deepEqual({x:marker.x,y:marker.y},expected,'side quest uses the picture-specific safe position');assert.equal(g.passable(marker.x,marker.y),true);assert.equal(g.passable(1150,820),false,'old obstructed side location is not made walkable');}
for(const [map,region] of Object.entries(MAPS))assert.ok(!['forest','lake','town'].includes(getScene(map,region).art),'no real scene uses the superseded image key');

// a38 formerly pointed into the new forest's south-east trees. The explicit
// quest override must be checked as well as scene.objective and scene.exit.
const escapeIndex=QUESTS.findIndex(q=>q.id==='a38');
function escapeGame(){const s=freshState();s.map='m27';s.quest=escapeIndex;s.phase='talk';s.inventory.thunder_bomb=1;const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;}
function finishEscape(g){g.beginObjective();assert.equal(g.s.phase,'escape');const marker=g.markers.find(p=>p.kind==='escape');assert.ok(marker);assert.ok(g.passable(marker.x,marker.y));assert.ok(distance(g.s.hero,marker)>135,'escape requires actual walking');g.interact(marker);assert.equal(g.q.id,'a38','distant activation cannot instantly clear the timer');let ticks=0;for(;ticks<1200&&g.q.id==='a38'&&g.s.phase==='escape';ticks++)g.tick(.05);assert.equal(g.q.id,'a39','walk to the visible exit before sixty seconds');assert.ok(ticks*.05<60);assert.equal(g.s.done.filter(id=>id==='a38').length,1);assert.equal(g.s.claimedRewards.filter(id=>id==='a38').length,1);return ticks*.05;}
const escaped=escapeGame(),main=escaped.markers.find(marker=>marker.id==='main');assert.ok(main);assert.deepEqual({x:main.x,y:main.y},escaped.scene.objective,'escape briefing remains inside the scene');assert.ok(distance(main,escaped.scene.exit)>135,'the countdown starts before reaching the exit');checkPath(escaped,main,escaped.scene.exit);Object.assign(escaped.s.hero,main);const escapeSeconds=finishEscape(escaped);
const timed=escapeGame(),beforeTimeout={coins:timed.s.coins,exp:timed.s.hero.exp,inventory:JSON.stringify(timed.s.inventory)};timed.beginObjective();for(let n=0;n<1201;n++)timed.tick(.05);assert.equal(timed.q.id,'a38');assert.equal(timed.s.phase,'talk');assert.deepEqual({coins:timed.s.coins,exp:timed.s.hero.exp,inventory:JSON.stringify(timed.s.inventory)},beforeTimeout);assert.ok(!timed.s.done.includes('a38'));finishEscape(timed);
const saved=escapeGame();saved.beginObjective();saved.s.timer=12;const resumed=new GameEngine(restoreState(JSON.parse(JSON.stringify({...saved.s,questId:'a38'}))));assert.equal(resumed.q.id,'a38');assert.equal(resumed.s.phase,'talk','ordinary timed escape reload restarts the attempt');assert.ok(!resumed.s.done.includes('a38'));finishEscape(resumed);

console.log(JSON.stringify({result:'PASS',maps:Object.values(groups).flat().length,escapeSeconds,pointsChecked,pathsChecked,searchItems,restores,sideMarkers,checks:'inspected original PNG hashes, art registration, reachable portal/story/side/search feet, continuous safe routes, old edge saves, blocked painted scenery; not a fidelity score'}));
