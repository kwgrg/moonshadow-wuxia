import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {REVISION_SEVENTEEN_QUEST_IDS} from '../public/campaign.mjs';
import {getScene,getStagingScene,SCENE_ART_KEYS} from '../public/world.mjs';
import {routeEdges,routeNeighbors,shortestRoute} from '../public/routes.mjs';

// Production collision/pathfinding and walking checks. These authored geometry
// fixtures are not a native-game playthrough or evidence of copied layouts.
const room='r_evil_final_room',graves='r_evil_final_graves',shore='r_evil_family_shore',peak='r_evil_father_peak';
const ids=['e14_report','e14','e14_recovery','e14_letter','e14_poison','e14_mercy','e14_family','e14_zhen_fall','e14_antidote','e14_mei_fall','e14_burial','e14_sleep','e14_dream','e14_father'];
const copy=x=>JSON.parse(JSON.stringify(x));
const index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert(i>=0,id+' registered');return i;};
const state=(id,map,flags={})=>({quest:index(id),questId:id,map,phase:'travel',flags:{route:'evil',...flags},done:[],visited:[]});
const create=(id,map=QUESTS[index(id)].map,flags={})=>{const s={...freshState(),...state(id,map,flags)};const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;};
const sceneFor=id=>getScene(id,MAPS[id],'evilFinal');
let footpoints=0,paths=0,routeChecks=0,walks=0,legacyReturns=0,gateChecks=0;

const points={
 [room]:[[620,450],[690,535],[760,700],[805,650],[930,575],[1080,660]],
 [graves]:[[805,650],[730,620],[940,640],[700,500],[1000,500]],
 [shore]:[[800,700],[950,700],[1100,800],[1050,750]],
 [peak]:[[645,515],[520,435]],
 m50:[[870,630],[1030,560],[960,620]],
 m49:[[760,700],[450,600],[565,500],[1110,700],[1180,550]],
};
for(const [id,positions] of [...Object.entries(points),['evilFinalDream',[[760,700],[580,500],[1050,500],[570,610],[1080,710]]]]){
 const scene=id==='evilFinalDream'?getStagingScene(id):sceneFor(id),g=new GameEngine(freshState());
 Object.defineProperty(g,'scene',{get:()=>scene});assert(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)),id+' original project art exists');
 const raw=[scene.spawn,scene.objective,...scene.points,...positions.map(([x,y])=>({x,y})),...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit])];
 const unique=[...new Map(raw.map(p=>[p.x+','+p.y,p])).values()];
 for(const p of unique){assert(g.passable(p.x,p.y),id+' safe footpoint '+JSON.stringify(p));footpoints++;}
 for(const a of unique)for(const b of unique){if(distance(a,b)<1)continue;const path=g.findPath(b.x,b.y,a);assert(path.length,id+' connected actor/door');assert(distance(path.at(-1),b)<35);let prior=a;for(const next of path){assert(g.clearSegment(prior,next));const n=Math.max(1,Math.ceil(distance(prior,next)/5));for(let i=0;i<=n;i++)assert(g.passable(prior.x+(next.x-prior.x)*i/n,prior.y+(next.y-prior.y)*i/n),id+' no corner crossing');prior=next;}paths++;}
 for(const p of Object.values(scene.portals))assert(distance(p.exit,p.entry)>=90,id+' deliberate return approach');
}
assert.deepEqual(Object.keys(sceneFor(room).portals).sort(),['m49','m50']);
for(const map of ['m49','m50'])assert.deepEqual(Object.keys(sceneFor(map).portals),[room]);
for(const map of [graves,shore,peak]){assert.deepEqual(routeNeighbors(map,QUESTS),[],'transfers do not create roads');assert.deepEqual(sceneFor(map).portals,{});}
assert.deepEqual(routeNeighbors(room,QUESTS).sort(),['m49','m50']);
assert.equal(MAPS.evilFinalDream,undefined);assert.deepEqual(getStagingScene('evilFinalDream').portals,{});
assert(SCENE_ART_KEYS.includes('evil-final-dream')&&SCENE_ART_KEYS.includes('evil-family-shore'));
{const dream=getStagingScene('evilFinalDream'),g=new GameEngine(freshState());Object.defineProperty(g,'scene',{get:()=>dream});assert(!g.passable(570,780),'painted diagonal fence is outside dream floor');assert(!g.passable(760,220),'north wall is solid');}
// A variant name cannot delete a historical map's doorways outside its scope.
for(const map of ['m1','m16','m34','m41','m51','m66','r_beimo_hero_room','r_leaf_memorial']){const ordinary=getScene(map,MAPS[map]),foreign=sceneFor(map);assert.equal(foreign.variant,ordinary.variant);assert.deepEqual(foreign.portals,ordinary.portals);assert.deepEqual(foreign.points,ordinary.points);routeChecks++;}

const route=(a,b,id,flags={},rest={})=>{routeChecks++;return shortestRoute(a,b,{...state(id,a,flags),...rest},QUESTS);};
for(const id of ids)for(const to of ['m49','m50']){
 const flags={evilFinalReported:true,evilFinalBattleWon:true,evilFinalRecovered:true},allowed=(id==='e14'&&to==='m49')||(id==='e14_letter'&&to==='m50');
 assert.deepEqual(route(room,to,id,flags),allowed?[room,to]:[],id+' only current exit may open');
}
assert.deepEqual(route(room,'m49','e14'),[],'report is earned, not cursor history');
assert.deepEqual(route(room,'m50','e14_letter'),[],'three months must complete');
assert.deepEqual(route('m49',room,'e14_recovery'),[],'gate victory must be earned');
assert.deepEqual(route('m49',room,'e14_recovery',{evilFinalBattleWon:true}),['m49',room]);
for(const id of ids)for(const from of [room,'m49','m50',graves,shore,peak])for(const to of ['m41','m51','r_beimo_hero_room','r_good_manor_infirmary'])assert.deepEqual(route(from,to,id,{evilFinalReported:true,evilFinalBattleWon:true,evilFinalRecovered:true}),[],id+' cannot return to another chapter');
for(const id of ['e06','e13','g24','gBad2'])assert(!routeEdges({...state(id,'m49'),flags:{route:id.startsWith('e')?'evil':'good',forsake:id==='gBad2'}},QUESTS).some(e=>e.design==='authored-evil-final'),'other branch cannot open final manor doors');
assert.deepEqual(route('m69','m66','e13'),['m69','m68','m67','m66'],'rescue return walks three real staircases');

// Historical topology is reconstructed only from the R17 quest identities.
// A renamed last cursor bypasses the new chapter's rules in this baseline;
// no original game map/configuration data is read or embedded.
const oldQuests=REVISION_SEVENTEEN_QUEST_IDS.map(id=>({...QUESTS[index(id)],...(id==='e14'?{id:'old_e14_cursor',map:'m49'}:{})}));
const history={route:'evil',evilGateOpened:true,evilTowerInterludeComplete:true,evilIslandCleared:true,evilIslandFarewell:true,evilZixuanDead:true,evilManorNightComplete:true,evilHutNightComplete:true,evilHutReportHeard:true};
const old={quest:oldQuests.length-1,questId:'old_e14_cursor',map:'m49',flags:history,done:REVISION_SEVENTEEN_QUEST_IDS,visited:Object.keys(MAPS)};
const oldReachable=Object.keys(MAPS).filter(map=>shortestRoute(map,'m49',old,oldQuests).length);
assert(oldReachable.length>30,'legacy baseline exercises actual historical network');
const oldRescue={...old,quest:oldQuests.findIndex(q=>q.id==='e13'),questId:'e13'};
for(const map of Object.keys(MAPS).filter(map=>shortestRoute(map,'m66',oldRescue,oldQuests).length)){
 const path=shortestRoute(map,'m66',state('e13',map,history),QUESTS);assert(path.length,'old rescue location can still return to tower '+map);for(let i=1;i<path.length;i++)assert(getScene(path[i-1],MAPS[path[i-1]]).portals[path[i]],'old rescue return owns a real portal');legacyReturns++;
}
for(const [id,flag,destination] of [['e14','evilFinalLegacyGate','m49'],['e14_report','evilFinalLegacyRescued',room],['e14_recovery','evilFinalLegacyBattleWon',room]])for(const map of oldReachable){
 const s=state(id,map,{...history,[flag]:true}),path=shortestRoute(map,destination,s,QUESTS);assert(path.length,id+' legacy route from '+map);assert(!path.includes(graves)&&!path.includes(shore)&&!path.includes(peak));
 for(let i=1;i<path.length;i++){const scene=(path[i-1]==='m49'||path[i-1]===room)?sceneFor(path[i-1]):getScene(path[i-1],MAPS[path[i-1]]);assert(scene.portals[path[i]],'historical return has real portal '+path[i-1]+' -> '+path[i]);}
 assert.deepEqual(shortestRoute('m49','m66',{...s,map:'m49'},QUESTS),[],'arrival cannot return to previous tower');legacyReturns++;
}
// Save flags from earlier chapters, excessive visits or future completion IDs
// do not unlock new current doors for an ordinary R18 player.
for(const id of ['e14_report','e14_poison','e14_burial','e14_sleep'])for(const to of ['m49','m50'])assert.deepEqual(route(room,to,id,history,{done:QUESTS.map(q=>q.id),visited:Object.keys(MAPS)}),[],'history does not open '+id);

function walk(id,from,to,flags){const g=create(id,from,{shield:0,...flags}),initial={coins:g.s.coins,done:[...g.s.done],flags:copy(g.s.flags)};assert(g.travel(to));for(let i=0;i<12000&&g.s.map!==to;i++){const point={x:g.s.hero.x,y:g.s.hero.y},map=g.s.map;g.tick(.05);if(map===g.s.map)assert(g.clearSegment(point,g.s.hero),'actual door walk stays on floor');}assert.equal(g.s.map,to);assert.equal(g.s.coins,initial.coins);assert.deepEqual(g.s.done,initial.done);assert.deepEqual(g.s.flags,initial.flags);walks++;return g;}
walk('e14',room,'m49',{evilFinalReported:true});
walk('e14_recovery','m49',room,{evilFinalBattleWon:true});
walk('e14_letter',room,'m50',{evilFinalRecovered:true});
walk('e14','m66','m49',{...history,evilFinalLegacyGate:true});
walk('e14_report','m50',room,{...history,evilFinalLegacyRescued:true});
walk('e14_recovery','m50',room,{...history,evilFinalLegacyBattleWon:true});
walk('e13','m69','m66',history);

// New graves use distinct labels and only committed state adds their collision.
{let g=create('e14_burial',graves,{evilFinalCruel:true,evilFinalMeiKilled:true});assert.deepEqual(g.scene.props,[]);assert(g.passable(700,500)&&g.passable(1000,500));g.s.flags.evilFinalBuried=true;assert.deepEqual(g.scene.props.map(p=>p.label),['纳兰真之墓','月眉儿之墓']);assert(!g.passable(700,500)&&!g.passable(1000,500));for(const [x,y] of [[730,620],[940,640],[805,650]])assert(g.findPath(x,y).length);g=new GameEngine(restoreState({...copy(g.s),questId:g.q.id}));assert.deepEqual(g.scene.props.map(p=>p.label),['纳兰真之墓','月眉儿之墓']);assert(!g.passable(700,500)&&!g.passable(1000,500));}
assert.deepEqual(sceneFor(peak).props,[],'painted father grave is not overlaid with unrelated graves');
for(const [id,map,flags] of [['e14_report',room,{}],['e14_burial',graves,{evilFinalCruel:true}],['e14_family',shore,{evilFinalMercy:true}],['e14_father',peak,{evilFinalCruel:true}]]){
 const g=create(id,map,flags),before=copy({coins:g.s.coins,potions:g.s.potions,elixirs:g.s.elixirs,done:g.s.done,flags:g.s.flags});assert(g.scene.points.length>=2,map+' retains meaningful observations');
 for(const p of g.scene.points){assert.equal(p.kind,'inspect');assert.equal(p.reward,undefined);Object.assign(g.s.hero,p);assert(g.interact(p));assert(g.interact(p));}
 assert.deepEqual({coins:g.s.coins,potions:g.s.potions,elixirs:g.s.elixirs,done:g.s.done,flags:g.s.flags},before,'environment observation cannot pay or move story');
}
// The tower's independently drawn cage encloses the patient until the legal
// opening cue. Eight switches gate the scene; an open door leaves the sides solid.
const switches=Object.fromEntries(Array.from({length:8},(_,i)=>['switch'+(i+1),true]));
for(let missing=1;missing<=8;missing++){
 const flags={...switches,['switch'+missing]:false},g=create('e13','m66',flags);g.s.phase='talk';g.beginObjective();assert.equal(g.s.sequence,null);assert(!g.passable(1030,620));assert.equal(g.scene.props.find(p=>p.kind==='cellGate').opened,false);gateChecks++;
}
{
 let g=create('e13','m66',switches);g.s.phase='talk';Object.assign(g.s.hero,{x:1030,y:690});assert(g.passable(1030,570));assert.deepEqual(g.findPath(1030,570),[],'three sides and front form a closed cage');assert(!g.passable(1030,510)&&!g.passable(955,570)&&!g.passable(1135,570));
 g.onEvent=event=>{if(event==='stagingDialogue')g.advanceStaging();};g.beginObjective();assert(g.s.sequence);
 for(let n=0;n<12000&&g.s.sequence?.cues.evilFinalTowerDoor!=='open';n++){g.tick(.05);assert(g.passable(g.s.hero.x,g.s.hero.y));for(const a of g.stagingActors())assert(g.passable(a.x,a.y));}
 assert.equal(g.s.sequence?.cues.evilFinalTowerDoor,'open');assert(g.passable(1030,620));assert(g.findPath(1030,570).length);assert(!g.passable(1030,510)&&!g.passable(955,570)&&!g.passable(1135,570));assert.equal(g.scene.props.find(p=>p.kind==='cellGate').opened,true);
 const raw={...copy(g.s),questId:'e13'};g=new GameEngine(restoreState(raw));assert.equal(g.s.sequence?.step,raw.sequence.step);assert.equal(g.scene.props.find(p=>p.kind==='cellGate').opened,true);assert(g.passable(1030,620));gateChecks++;
}
for(const id of ['e12','g19_departure']){const g=create(id,'m66');if(id.startsWith('g'))g.s.flags.route='good';assert.equal(g.scene.rescueGate,undefined,'cage does not change other tower chapters');assert(!g.scene.props.some(p=>p.kind==='cellGate'));gateChecks++;}
console.log(JSON.stringify({ok:true,footpoints,paths,routeChecks,walks,legacyMaps:oldReachable.length,legacyReturns,gateChecks}));
