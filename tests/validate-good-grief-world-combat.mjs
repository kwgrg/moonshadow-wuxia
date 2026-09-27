import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {getScene,getStagingScene} from '../public/world.mjs';
import {shortestRoute,exitsFor,routeEdges} from '../public/routes.mjs';
import {GOOD_GRIEF_STAGING as stages} from '../public/good-grief-staging.mjs';
// Isolated geometry and real engine combat calls use explicit HP/position fixtures.
// They do not represent a natural full playthrough or prove native visual fidelity.
const copy=x=>JSON.parse(JSON.stringify(x)),index=id=>{const i=QUESTS.findIndex(q=>q.id===id);assert.ok(i>=0,id);return i;};
const snap=g=>copy({...g.s,questId:g.q.id});
const economy=g=>copy({coins:g.s.coins,kills:g.s.kills,level:g.s.hero.level,exp:g.s.hero.exp,potions:g.s.potions,elixirs:g.s.elixirs,claims:g.s.combatClaims,done:g.s.done,claimed:g.s.claimedRewards});
let combatChecks=0,routeChecks=0,footpoints=0,pathChecks=0;
function make(id,flags={}){const s=freshState(),q=QUESTS[index(id)];s.quest=index(id);s.map=q.map;s.flags={route:'good',forsake:true,goodRoseBuried:true,goodTowerHomecoming:true,...flags};for(const k of q.requiredFlags||[])s.flags[k]=true;for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;}
function battle(id){const g=make(id);g.s.flags['staged_'+id]=true;g.startBattle();assert.equal(g.s.phase,'battle');assert.equal(g.s.flags.goodGriefLegacySingleDuel,undefined);return g;}
function hit(g,id){const target=g.s.enemies.find(e=>e.id===id);assert(target&&target.hp>0);for(const e of g.s.enemies)Object.assign(e,{x:1300,y:850});Object.assign(g.s.hero,g.nearestOpen(650,750));Object.assign(target,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;assert.equal(g.cast(0),true);}
for(const [id,count] of [['gBad_road',34],['gBad2',45]]){
 const g=battle(id);assert.equal(g.s.enemies.length,count);assert.equal(new Set(g.s.enemies.map(e=>e.x+','+e.y)).size,count,id+' distributed units have distinct positions');
 for(const a of g.s.enemies){assert(g.passable(a.x,a.y),id+' enemy footpoint');assert(g.findPath(a.x,a.y).length,id+' enemy reachable');for(const b of g.s.enemies)if(a.id!==b.id)assert(distance(a,b)>=58,id+' independent unit spacing');footpoints++;}
 assert.equal(g.canCompleteCombat(),false);g.s.phase='after';g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.completed,false);combatChecks++;
}
{
 let g=battle('gBad_road');assert.equal(g.s.enemies.filter(e=>e.name==='无忧教领头').length,1);assert.equal(g.s.enemies.filter(e=>e.name==='无忧教男弟子').length,33);assert(g.s.enemies.every(e=>!e.boss));hit(g,33);assert.equal(g.s.phase,'battle');assert.equal(g.canCompleteCombat(),false);assert.ok(!g.s.flags.goodGriefRoadCleared);
 for(let i=0;i<32;i++)hit(g,i);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,1);assert.equal(g.canCompleteCombat(),false);const almost=snap(g);g=new GameEngine(restoreState(almost));assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies.filter(e=>e.hp>0).length,1);assert.equal(g.travel('m49'),false);const prior=economy(g);g.completeQuest();assert.equal(g.q.id,'gBad_road');assert.deepEqual(economy(g),prior);hit(g,32);assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.ok(g.markers.filter(m=>m.main).every(m=>m.sprite==null),'a cleared road cannot respawn a living leader marker');const won=economy(g);assert.equal(won.kills,34);assert.equal(won.coins,150+34*15);g=new GameEngine(restoreState(snap(g)));assert.equal(g.canCompleteCombat(),true);g.completeQuest();assert.equal(g.q.id,'gBad1');assert.equal(g.s.flags.goodGriefRoadCleared,true);assert.equal(g.s.coins,won.coins);assert.equal(g.s.potions,won.potions);assert.equal(g.s.elixirs,won.elixirs);assert.equal(g.s.claimedRewards.filter(id=>id==='gBad_road').length,1);combatChecks++;
}
{
 let g=battle('gBad2');assert.equal(g.s.enemies.filter(e=>e.boss).length,1);const boss=g.s.enemies.find(e=>e.boss);assert.equal(boss.id,44);assert.equal(boss.name,'纳兰潜凛');const before=economy(g);hit(g,44);assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,44,'boss victory does not pretend to kill remaining guards');assert.ok(g.markers.filter(m=>m.main).every(m=>m.sprite==null),'a dead boss cannot reappear as a standing dialogue target');assert.equal(g.s.coins,before.coins+80);assert.equal(g.s.kills,before.kills+1);
 const entry=g.s.combatProgress.encounters['wave:0'];assert.deepEqual(entry.defeatedIds,[44]);assert.equal(entry.roster.filter(e=>e.hp>0).length,44);assert.equal(entry.outcome,'victory');assert.deepEqual(g.s.combatClaims,['gBad2|wave:0|enemy:44']);const paid=economy(g),hp=g.s.hero.hp;g.tick(.05);assert.equal(g.s.hero.hp,hp,'remaining force stops attacking after boss callback');assert.equal(g.cast(0),false);assert.deepEqual(economy(g),paid);
 g=new GameEngine(restoreState(snap(g)));assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.equal(g.s.combatProgress.encounters['wave:0'].roster.filter(e=>e.hp>0).length,44);assert.deepEqual(economy(g),paid);g.startBattle();assert.equal(g.s.phase,'after');assert.deepEqual(economy(g),paid);g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');assert.equal(g.s.flags.goodGriefDuelWon,true);assert.equal(g.s.completed,false);assert.equal(g.s.coins,paid.coins+15);assert.equal(g.s.kills,1);assert.equal(g.s.claimedRewards.filter(id=>id==='gBad2').length,1);combatChecks++;
}
// Cooldowns must actually expire before testing post-victory controls. Otherwise
// a rejected attack could hide a corruptible finished roster behind a cooldown.
{
 let g=battle('gBad2');hit(g,0);hit(g,1);hit(g,44);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,42);assert.equal(g.canCompleteCombat(),true);const survivor=g.s.enemies.find(e=>e.hp>0);Object.assign(survivor,{x:g.s.hero.x,y:g.s.hero.y,hp:1});for(let n=0;n<40;n++)g.tick(.05);assert.equal(g.s.cooldowns[0],0);assert.equal(g.s.cooldowns[1],0);g.s.hero.mp=g.s.hero.maxMp;
 const stable=()=>copy({units:g.s.enemies,progress:g.s.combatProgress,economy:economy(g),hp:g.s.hero.hp,mp:g.s.hero.mp,skills:g.s.skills,cooldowns:g.s.cooldowns});const before=stable();assert.equal(g.cast(0),false);assert.equal(g.cast(1),false);assert.deepEqual(stable(),before,'finished basic/skill input cannot alter roster or consume resources');g.keys.add('j');for(let n=0;n<40;n++)g.tick(.05);g.keys.delete('j');assert.deepEqual(stable(),before,'holding J after victory cannot damage survivors');assert.equal(g.canCompleteCombat(),true);
 g=new GameEngine(restoreState(snap(g)));assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.equal(g.s.combatProgress.encounters['wave:0'].roster.filter(e=>e.hp>0).length,42);assert.deepEqual(g.s.combatProgress.encounters['wave:0'].defeatedIds,[0,1,44]);const paid=economy(g);assert.equal(g.cast(0),false);assert.equal(g.cast(1),false);assert.deepEqual(economy(g),paid);g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');combatChecks++;
}
// Killing all guards without the boss cannot satisfy the target-only encounter.
{const g=battle('gBad2');for(let i=0;i<44;i++)hit(g,i);assert.equal(g.s.enemies.filter(e=>e.hp>0).length,1);assert.equal(g.s.enemies.find(e=>e.hp>0).boss,true);assert.equal(g.canCompleteCombat(),false);assert.equal(g.s.phase,'battle');g.completeQuest();assert.equal(g.q.id,'gBad2');combatChecks++;}
for(const id of ['gBad_road','gBad2']){
 let g=battle(id);hit(g,0);const once=economy(g);g.s.hero.hp=1;g.hurt(g.s.enemies.find(e=>e.hp>0),1);g.tick(.01);assert.equal(g.s.hero.hp,0);g=new GameEngine(restoreState(snap(g)));assert.equal(g.s.hero.hp,0);assert.equal(g.s.combatProgress.failed,true);assert.equal(g.paused,true);g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.potion(),false);g.retry();assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies.length,id==='gBad_road'?34:45);hit(g,0);assert.deepEqual(economy(g),once,'retry cannot pay the same enemy slot twice');combatChecks++;
}
for(const id of ['gBad_road','gBad2'])for(const damage of [p=>p.encounters['wave:0'].roster.pop(),p=>p.encounters['wave:0'].roster[1].id=0,p=>p.encounters['wave:0'].defeatedIds=[44],p=>p.encounters['wave:0'].outcome='victory']){
 const g=battle(id),raw=snap(g);damage(raw.combatProgress);const r=new GameEngine(restoreState(raw));assert.equal(r.s.combatProgress.failed,true);assert.equal(r.canCompleteCombat(),false);assert.equal(r.s.completed,false);assert.equal(r.q.id,id);assert.deepEqual(economy(r),economy(g));combatChecks++;
}
{const g=battle('gBad2'),boss=g.s.enemies.find(e=>e.boss);boss.hp=0;g.claimCombatDefeat(boss);g.s.hero.hp=0;assert.equal(g.finishCombatProgress('victory'),false);assert.equal(g.s.combatProgress.failed,true);assert.equal(g.canCompleteCombat(),false);combatChecks++;}
const flags={route:'good',forsake:true,goodTowerHomecoming:true,goodRoseBuried:true};
const state=(id,extra={},rest={})=>({quest:index(id),phase:'travel',flags:{...flags,...extra},done:[],visited:[],...rest});
const route=(from,to,id,extra={},rest={})=>{routeChecks++;return shortestRoute(from,to,state(id,extra,rest),QUESTS);};
assert.deepEqual(route('r_leaf_memorial','r_good_grief_pass','gBad_road'),['r_leaf_memorial','m51','r_good_grief_pass']);
for(const id of ['gBad_road','gBad1'])for(const origin of ['r_leaf_memorial','m51','r_good_grief_pass'])assert.deepEqual(route(origin,'m49',id),[],id+' cannot bypass unfinished blockade');
assert.deepEqual(route('r_good_grief_pass','m49','gBad1',{goodGriefRoadCleared:true}),['r_good_grief_pass','m49']);
assert.deepEqual(route('m49','m16','gBad1',{goodGriefRoadCleared:true}),[],'report cannot be skipped');
assert.deepEqual(route('m49','m16','gBad1_hut',{goodGriefRoadCleared:true,goodGriefNewsTold:true}),['m49','m41','r_good_hanbo_road','r_hanbo_return','m16']);
for(const dest of ['m71','m17','r_sakura_memorial','m49'])assert.deepEqual(route('m16',dest,'gBad1_hut',{goodGriefRoadCleared:true,goodGriefNewsTold:true}),[],'hut investigation blocks premature exit');
// Legacy route summaries cannot skip the newly pending hut investigation.
for(const extra of [{goodGriefLegacyNews:true},{goodGriefLegacyNews:true,goodGriefLegacyRevenge:true}])for(const to of ['m49','m71','m17','r_sakura_memorial'])assert.deepEqual(route('m16',to,'gBad1_hut',extra),[],'legacy flags do not bypass current hut investigation');
assert.deepEqual(QUESTS[index('gBad1_hut')].transition,{map:'r_sakura_memorial'},'hut-to-burial transition is explicit rather than a shortcut route');
assert.deepEqual(route('r_sakura_memorial','m71','gBad1_burial',{goodGriefRoadCleared:true,goodGriefNewsTold:true,goodGriefHutFound:true}),[],'burial must finish before vengeance');
const afterBurial={goodGriefRoadCleared:true,goodGriefNewsTold:true,goodGriefHutFound:true,goodGriefBuried:true};
assert.deepEqual(route('r_sakura_memorial','m71','gBad2',afterBurial),['r_sakura_memorial','m17','m16','r_hanbo_return','r_good_yitian','m71']);
for(const dest of ['r_good_yitian','m49','r_evil_dungeon','r_zhen_chamber','r_evil_chamber','m16','m34'])for(const id of ['gBad2','gBad2_aftermath'])assert.deepEqual(route('m71',dest,id,afterBurial),[],id+' ending hall has no escape or evil-room bypass');
for(const from of ['m49','m16','m71','r_sakura_memorial'])assert.deepEqual(route(from,'m34','gBad2_departure',{...afterBurial,goodGriefFarewellReady:true}),[],'island epilogue is an explicit completed-aftercare transfer');
for(const [id,extra] of [['e06',{route:'evil'}],['gCult_epilogue',{cultPath:true}],['g24',{forsake:false}]])assert.ok(!routeEdges(state(id,extra),QUESTS).some(e=>e.design==='authored-good-grief'),'grief routes do not leak into '+id);
// The actual island ending retains its own sealed scene and route restrictions.
{const g=make('gBad2_departure',{goodGriefFarewellReady:true});assert.equal(g.scene.variant,'goodGrief');assert.deepEqual(g.scene.portals,{});assert(g.exits().every(exit=>exit.locked));for(const to of ['m40','m49','m16','m71'])assert.deepEqual(route('m34',to,'gBad2_departure',{goodGriefFarewellReady:true}),[],'completed-aftercare island scene stays sealed');}
// Real directional walking consumes the same portals exposed to normal controls.
function walk(from,to,id,extra={}){const g=make(id,extra);g.s.map=from;g.s.phase='travel';Object.assign(g.s.hero,g.scene.spawn);const seen=[from];g.onEvent=event=>{if(event==='chapter')seen.push(g.s.map);};assert(g.travel(to));for(let n=0;n<12000&&g.s.map!==to;n++){const previous={x:g.s.hero.x,y:g.s.hero.y},map=g.s.map;g.tick(.05);if(map===g.s.map)assert(g.clearSegment(previous,g.s.hero),'ordinary travel stays on ground');}assert.equal(g.s.map,to,'actual walk reaches '+to);return seen;}
assert.deepEqual(walk('r_leaf_memorial','r_good_grief_pass','gBad_road'),['r_leaf_memorial','m51','r_good_grief_pass']);
assert.deepEqual(walk('m49','m16','gBad1_hut',{goodGriefRoadCleared:true,goodGriefNewsTold:true}),['m49','m41','r_good_hanbo_road','r_hanbo_return','m16']);
assert.deepEqual(walk('r_sakura_memorial','m71','gBad2',afterBurial),['r_sakura_memorial','m17','m16','r_hanbo_return','r_good_yitian','m71']);routeChecks+=3;
// The committed burial cue creates visible solid graves before quest completion,
// and a reload retains the cue rather than hiding or pre-paying the grave scene.
{let g=make('gBad1_burial'),money=economy(g);g.beginObjective();assert(g.s.sequence);g.onEvent=type=>{if(type==='stagingDialogue')g.advanceStaging();};for(let n=0;n<6000&&g.s.sequence?.cues.goodGriefMemorial!=='buried';n++)g.tick(.05);assert.equal(g.s.sequence?.cues.goodGriefMemorial,'buried');assert.equal(g.s.flags.goodGriefBuried,undefined);assert.equal(g.scene.props.length,2);const raw=snap(g);g=new GameEngine(restoreState(raw));assert.equal(g.s.sequence?.step,raw.sequence.step);assert.equal(g.s.sequence?.cues.goodGriefMemorial,'buried');assert.equal(g.scene.props.length,2);assert.deepEqual(economy(g),money);for(const grave of g.scene.props)assert.equal(g.passable(grave.x,grave.y),false);routeChecks++;}
const realMaps=['m51','r_good_grief_pass','m49','m41','r_good_hanbo_road','r_hanbo_return','m16','m17','r_sakura_memorial','r_good_yitian','m71','m34'];
const sceneFor=id=>getScene(id,MAPS[id],id==='m51'?'towerGriefAftermath':'goodGrief');
const observations=new Map(),add=(key,p)=>{if(Number.isFinite(p?.x)&&Number.isFinite(p?.y)){if(!observations.has(key))observations.set(key,[]);observations.get(key).push({x:p.x,y:p.y});}};
for(const id of realMaps){const scene=sceneFor(id);assert.ok(fs.existsSync(new URL('../public/assets/'+scene.art+'.png',import.meta.url)),id+' art exists');for(const p of [scene.spawn,scene.objective,...Object.values(scene.portals).flatMap(p=>[p.entry,p.exit])])add('map:'+id,p);for(const portal of Object.values(scene.portals))assert(distance(portal.entry,portal.exit)>=90,id+' arrival stays away from exit');}
for(const stage of Object.values(stages)){
 const real='map:'+stage.map;add(real,stage.startPoint);add(real,stage.heroStart);for(const a of [...stage.actors,...stage.finalActors])add(a.sceneKey||real,a);let key=real;for(const step of stage.steps){if(step.type==='scene'){key=step.scene||real;add(key,step.hero);}if(step.type==='move')add(key,step);}
}
for(const [key,raw] of observations){
 const scene=key.startsWith('map:')?sceneFor(key.slice(4)):getStagingScene(key);assert(scene,key+' registered');const g=new GameEngine();Object.defineProperty(g,'scene',{get:()=>scene});const points=[...new Map(raw.map(p=>[p.x+','+p.y,p])).values()];
 for(const p of points){assert(g.passable(p.x,p.y),key+' safe point '+JSON.stringify(p));footpoints++;}
 for(const a of points)for(const b of points){if(distance(a,b)<1)continue;const path=g.findPath(b.x,b.y,a);assert(path.length,key+' connected '+JSON.stringify({a,b}));assert(distance(path.at(-1),b)<35);let prior=a;for(const next of path){assert(g.clearSegment(prior,next),key+' no corner cutting');for(let i=0,n=Math.max(1,Math.ceil(distance(prior,next)/5));i<=n;i++)assert(g.passable(prior.x+(next.x-prior.x)*i/n,prior.y+(next.y-prior.y)*i/n),key+' sampled floor');prior=next;}pathChecks++;}
}
const beforeGrave=make('gBad1_burial');assert.deepEqual(beforeGrave.scene.props,[],'two graves are absent until the burial cue commits');for(const [x,y] of [[700,500],[1000,500]])assert(beforeGrave.passable(x,y),'unbuilt grave has no invisible collision');beforeGrave.s.flags.goodGriefBuried=true;const graves=beforeGrave.scene.props;assert.deepEqual(graves.map(p=>p.label),['紫轩之墓','月眉儿之墓']);for(const grave of graves)assert.equal(beforeGrave.passable(grave.x,grave.y),false,'each visible grave has a solid footprint');
for(const a of [beforeGrave.scene.spawn,{x:805,y:650},{x:730,y:620},{x:940,y:640}])for(const b of [{x:805,y:750},beforeGrave.scene.portals.m17.exit])assert(beforeGrave.findPath(b.x,b.y,a).length,'new graves leave the kneeling/walking/exit route open');
const father=getStagingScene('goodGriefFatherMemorial');assert.deepEqual(father.props.map(p=>p.label),['纳兰潜凛之墓']);assert.deepEqual(father.portals,{});assert.equal(MAPS.goodGriefFatherMemorial,undefined);assert.deepEqual(sceneFor('m34').portals,{});
// One physical doorway cannot expose a locked old exit over the active exit.
for(const [id,extra] of [['gBad_road',{}],['gBad1',{goodGriefLegacyNews:true}],['g21',{forsake:false,goodRoseNightComplete:true}]]){const g=make(id,extra);g.s.map='m51';g.s.phase='travel';const exits=g.markers.filter(m=>m.kind==='travel');for(let a=0;a<exits.length;a++)for(let b=a+1;b<exits.length;b++)assert(distance(exits[a],exits[b])>=45,id+' distinct visible exits: '+exits[a].to+' / '+exits[b].to);routeChecks++;}
console.log(JSON.stringify({result:'PASS',combatChecks,routeChecks,footpoints,pathChecks,note:'R17 independent world geometry and engine encounter fixtures; browser and fidelity evaluation remain separate.'}));
