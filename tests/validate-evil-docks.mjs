import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import {getScene,getStagingScene} from '../public/world.mjs';
import {Renderer} from '../public/renderer-v3.mjs';
import * as campaign from '../public/campaign.mjs';

// These are state, movement and renderer-contract checks, not browser gameplay
// or proof of full fidelity to the original game. All fixtures are authored.
const copy=value=>JSON.parse(JSON.stringify(value)),index=id=>QUESTS.findIndex(q=>q.id===id);
const snapshot=g=>copy({...g.s,questId:g.q.id});
const economy=g=>copy({coins:g.s.coins,exp:g.s.hero.exp,kills:g.s.kills,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory});
const health=g=>({hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina});
const resources=g=>({...economy(g),...health(g)});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const returnFlags={evilZhenMissing:true,evilGateOpened:true,evilTrailVillage:true,evilTrailApproach:true,evilTrailEntry:true,evilTrailFirst:true,evilTrailSecond:true};
function create(id,flags={}){
 const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id);s.map=QUESTS[s.quest].map;s.flags={...s.flags,route:'evil',...returnFlags,...flags};
 s.visited=[s.map];s.inventory={wood_box:1};s.coins=287;s.hero.exp=19;
 const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
function walk(g,destination){
 const path=[g.s.map];if(g.s.map===destination)return path;
 const initialNeighbors=g.exits().filter(edge=>!edge.locked).map(edge=>edge.to);
 assert.equal(g.travel(destination),true,'travel must begin toward '+destination);
 if(g.s.map!==path.at(-1)){assert.ok(initialNeighbors.includes(g.s.map),'immediate boat travel crosses an adjacent shore');path.push(g.s.map);}
 for(let tick=0;tick<18000&&g.s.map!==destination;tick++){
  const previous=g.s.map,neighbors=g.exits().filter(edge=>!edge.locked).map(edge=>edge.to);g.tick(.05);
  if(g.s.map!==previous){assert.ok(neighbors.includes(g.s.map),'movement only crosses an actual adjacent exit');path.push(g.s.map);}
 }
 assert.equal(g.s.map,destination,'walking must reach '+destination);return path;
}
function renderedWithoutPlayer(g,hidden=true){
 globalThis.devicePixelRatio=1;const actors=[],miniPlayerDots=[];
 const context=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:30})},
  {get:(target,key)=>target[key]??((...args)=>{if(key==='arc'&&args[2]===4&&target.fillStyle==='#d1ffde')miniPlayerDots.push(args);}),set:(target,key,value)=>(target[key]=value,true)});
 const ctx=context(),mini=context(),canvas={clientWidth:1200,clientHeight:800,getContext:()=>ctx},minimap={getContext:()=>mini};
 const renderer=new Renderer(canvas,minimap,g,{});renderer.drawActor=(actor,isHero)=>actors.push({...actor,isHero});renderer.draw();
 if(hidden){assert.ok(!actors.some(actor=>actor.isHero||actor.name==='杨影枫'||actor.name==='月眉儿'),'projection draws neither player nor follower');assert.equal(miniPlayerDots.length,0,'projection omits the player dot from the minimap');}
 else{assert.ok(actors.some(actor=>actor.isHero),'normal world rendering still draws the player');assert.equal(miniPlayerDots.length,1,'normal world rendering restores the player minimap dot');}
}
let restoredSteps=0,midMoveRestores=0,timedRestores=0,renderChecks=0;const projectionSaves=[];
function stage(game,{projection=false,beforeTick=()=>{}}={}){
 let g=game;const id=g.q.id,baseline=resources(g),realMap=g.s.map,visited=copy(g.s.visited),start={x:g.s.hero.x,y:g.s.hero.y,direction:g.s.hero.direction};
 const steps=STAGED_QUESTS[id].steps,seen=new Set(),moves=new Set(),timed=new Set();let previousStep=-1,moveStart=null,projected=false;
 if(g.s.phase!=='staging'){g.completeQuest();assert.equal(g.q.id,id,'required staging cannot be skipped');g.beginObjective();}
 assert.equal(g.s.phase,'staging',id+' must start its staged event');
 for(let tick=0;tick<15000&&g.s.phase==='staging';tick++){
  const sequence=g.s.sequence,step=steps[sequence.step],sceneKey=sequence.sceneKey||null;
  assert.equal(g.s.map,realMap);assert.deepEqual(g.s.visited,visited,'a projected location is not a new world visit');assert.deepEqual(resources(g),baseline,'staging does not deal damage or award resources');
  assert.equal(g.s.enemies.length,0,'staged confrontations are not ordinary rewarding fights');beforeTick(g,step);
  if(sceneKey){
   assert.equal(projection,true);assert.equal(sceneKey,'towerInterlude');assert.equal(g.scene.hidePlayer,true);assert.equal(g.companion,null);
   assert.equal(sequence.origin.map,realMap);assert.equal(sequence.origin.x,start.x);assert.equal(sequence.origin.y,start.y);
   assert.deepEqual(g.scene.portals,{});assert.ok(!MAPS[sceneKey]);projected=true;
   if(!projectionSaves.length){projectionSaves.push(snapshot(g));renderedWithoutPlayer(g);renderChecks++;}
  }else if(projected){assert.equal(g.s.hero.x,start.x,'leaving the projection restores the original road point');assert.equal(g.s.hero.y,start.y);assert.equal(g.s.hero.direction,start.direction);}
  const moving=step.type==='move'?(step.actor==='hero'?g.s.hero:sequence.actors.find(actor=>actor.id===step.actor)):null;
  if(sequence.step!==previousStep)moveStart=moving?{x:moving.x,y:moving.y}:null;
  const midMove=sequence.step===previousStep&&moving&&moveStart&&!moves.has(sequence.step)&&distance(moving,moveStart)>20&&distance(moving,step)>15;
  const midTimed=['strike','pose'].includes(step.type)&&!timed.has(sequence.step)&&sequence.elapsed>.1&&sequence.elapsed<(step.duration||.6)-.1;
  if(!seen.has(sequence.step)||midMove||midTimed){
   if(midTimed){timed.add(sequence.step);timedRestores++;}
   if(midMove){moves.add(sequence.step);midMoveRestores++;}seen.add(sequence.step);
   const saved=snapshot(g),loaded=new GameEngine(restoreState(saved));
   assert.equal(loaded.s.sequence?.step,sequence.step,id+' reload retains exact sequence step');assert.equal(loaded.s.sequence.sceneKey||null,sceneKey);
   assert.deepEqual(loaded.s.sequence.origin,sequence.origin);assert.deepEqual(loaded.s.sequence.cues,sequence.cues);
   assert.deepEqual(resources(loaded),baseline);assert.equal(loaded.s.map,realMap);assert.deepEqual(loaded.s.visited,visited);
   if(!sceneKey){assert.equal(loaded.s.hero.x,saved.hero.x);assert.equal(loaded.s.hero.y,saved.hero.y);}
   for(const actor of sequence.actors){const other=loaded.s.sequence.actors.find(candidate=>candidate.id===actor.id);assert.equal(other.x,actor.x);assert.equal(other.y,actor.y);assert.equal(other.pose,actor.pose);assert.equal(!!other.hidden,!!actor.hidden);}
   g=loaded;restoredSteps++;assert.equal(g.travel('m49'),false);assert.equal(g.cast(0),false);g.completeQuest();assert.equal(g.q.id,id);
  }
  previousStep=sequence.step;const active=g;g.onEvent=type=>{if(type==='stagingDialogue')active.advanceStaging();};g.tick(.05);
 }
 assert.notEqual(g.s.phase,'staging',id+' must release without a movement deadlock');assert.equal(g.s.sequence,null);
 assert.deepEqual(resources(g),baseline);assert.equal(g.s.map,realMap);assert.deepEqual(g.s.visited,visited);
 assert.equal(!!g.s.flags['staged_'+id],true);if(projection){assert.ok(projected);assert.equal(g.s.hero.x,start.x);assert.equal(g.s.hero.y,start.y);}
 return g;
}

assert.equal(freshState().campaignRevision,13);
// Start at the existing post-duel decision; the preceding reveal/duel has its own tests.
let game=create('e07',{staged_e07:true});game.s.phase='choice';Object.assign(game.s.hero,{hp:31,mp:41,stamina:12});
const initial=economy(game);assert.equal(game.choose(0),true);assert.equal(game.q.id,'e08_interlude');
assert.equal(game.s.flags.evilRecruitAccepted,true);assert.equal(game.s.flags.companion,'月眉儿');
assert.deepEqual(health(game),{hp:game.s.hero.maxHp,mp:game.s.hero.maxMp,stamina:100});assert.deepEqual(economy(game),initial);
const accepted=snapshot(game);const cannotReplay=reload(game);Object.assign(cannotReplay.s.hero,{hp:67,mp:51,stamina:23});
cannotReplay.s.quest=index('e07');cannotReplay.s.map='m57';cannotReplay.s.phase='choice';cannotReplay.choose(0);
assert.deepEqual(health(cannotReplay),{hp:67,mp:51,stamina:23},'repeating a completed acceptance cannot provide free recovery');assert.deepEqual(economy(cannotReplay),initial);
const reverse=walk(game,'r_forbidden_path');
assert.deepEqual(reverse,['m57','r_forbidden_gate','r_forbidden_second','r_forbidden_first','r_forbidden_entry','r_forbidden_path']);
assert.ok(!game.s.flags.evilTowerInterludeComplete);assert.equal(game.travel('m40'),false,'the return must not bypass the interlude and village');
game=stage(game,{projection:true});assert.equal(game.q.id,'e08_island_battle');assert.equal(game.s.flags.evilTowerInterludeComplete,true);
assert.equal(game.s.flags.companion,'月眉儿');assert.equal(game.scene.hidePlayer,undefined);assert.ok(game.companion);renderedWithoutPlayer(game,false);renderChecks++;
assert.deepEqual(walk(game,'r_island_village'),['r_forbidden_path','m31','r_island_village']);
assert.equal(game.travel('m40'),false,'the village battle gates the dock');
let civilianSafe=false;
game=stage(game,{beforeTick(g){
 if(g.s.sequence.cues.islandCivilians==='safe'){
  civilianSafe=true;for(const id of ['villager-yu','villager-wang'])assert.equal(g.s.sequence.actors.find(actor=>actor.id===id).hidden,true);
 }
 assert.ok(!g.s.flags.evilIslandCleared);assert.equal(g.s.skirmish,null);
}});
assert.ok(civilianSafe);assert.equal(game.s.phase,'battle');assert.equal(game.s.enemies.length,36);assert.equal(game.s.allies.length,1);assert.equal(game.companion,null);
assert.ok(!game.stagingActors().some(actor=>['于大婶','王妈','强盗头目','月眉儿'].includes(actor.name)),'staged civilians and stand-ins leave before the actual battle');
const combatBudget=economy(game),chief=game.s.enemies.find(enemy=>enemy.name==='强盗头目');chief.hp=0;game.markSkirmishDefeat(chief);game.checkSkirmishOutcome();
game.completeQuest();assert.equal(game.q.id,'e08_island_battle');assert.equal(game.travel('m40'),false,'the chief alone is not victory');
const oneRemaining=game.s.enemies.find(enemy=>enemy.hp>0);
for(const enemy of game.s.enemies)if(enemy!==oneRemaining&&enemy.hp>0){enemy.hp=0;game.markSkirmishDefeat(enemy);}
game.checkSkirmishOutcome();game.completeQuest();assert.equal(game.q.id,'e08_island_battle');assert.equal(game.s.skirmish.defeatedIds.length,35);
game=reload(game);const last=game.s.enemies.find(enemy=>enemy.hp>0);last.hp=0;game.markSkirmishDefeat(last);game.checkSkirmishOutcome();
assert.equal(game.s.phase,'after');Object.assign(game.s.hero,{hp:83,mp:47,stamina:19});const cleared=snapshot(game);
game.completeQuest();assert.equal(game.q.id,'e08_departure');assert.equal(game.s.flags.evilIslandCleared,true);
assert.deepEqual(health(game),{hp:game.s.hero.maxHp,mp:game.s.hero.maxMp,stamina:100});assert.deepEqual(economy(game),combatBudget,'all-clear adds no implicit medicines, money or XP');
const doneBattle=reload(game);Object.assign(doneBattle.s.hero,{hp:93,mp:43,stamina:17});doneBattle.s.quest=index('e08_island_battle');doneBattle.s.map='r_island_village';doneBattle.s.phase='after';doneBattle.s.skirmish=copy(cleared.skirmish);
doneBattle.completeQuest();assert.deepEqual(health(doneBattle),{hp:93,mp:43,stamina:17});assert.deepEqual(economy(doneBattle),combatBudget);
assert.deepEqual(walk(game,'m40'),['r_island_village','m40']);assert.equal(game.scene.atmosphere.light,'day');
const namedResidents=new Set(game.stagingActors().map(actor=>actor.name));
for(const name of ['荆十娘','于大婶','福婆婆','小冬瓜','渔夫窦昊'])assert.ok(namedResidents.has(name));
assert.equal(game.travel('r_mainland_dock'),false,'farewell occurs before boarding');game=stage(game);
assert.equal(game.q.id,'e08');assert.equal(game.s.flags.evilIslandFarewell,true);assert.equal(game.scene.atmosphere.light,'day');
const boat=game.exits().find(edge=>edge.to==='r_mainland_dock');assert.ok(boat&&!boat.locked);assert.equal(boat.transport,'boat');assert.match(boat.travelLabel,/中原/);
assert.deepEqual(walk(game,'r_mainland_dock'),['m40','r_mainland_dock']);
const returningBoat=game.exits().find(edge=>edge.to==='m40');assert.ok(returningBoat);assert.equal(returningBoat.transport,'boat');assert.match(returningBoat.travelLabel,/忘忧岛/);
assert.equal(game.travel('m49'),false,'the unresolved dock encounter gates inland travel');
game=stage(game);assert.equal(game.q.id,'e08');assert.equal(game.s.phase,'choice');assert.ok(!game.s.flags.evilZixuanDead);
// The released dialogue target and its visual actor are one person. Keeping the
// objective point here would put Mei under Zixuan at the mainland dock.
for(const current of [game,reload(game)]){
 const mei=current.markers.filter(marker=>marker.name==='月眉儿'),zixuan=current.markers.filter(marker=>marker.name==='紫轩');
 assert.equal(mei.length,1);assert.equal(zixuan.length,1);
 assert.deepEqual(Object.fromEntries(['id','kind','main','x','y','direction','pose','sprite','npcCell'].map(key=>[key,mei[0][key]])),
  {id:'main',kind:'main',main:true,x:835,y:525,direction:-1,pose:'stand',sprite:2,npcCell:null});
 assert.deepEqual({x:zixuan[0].x,y:zixuan[0].y,kind:zixuan[0].kind},{x:900,y:620,kind:'stagingActor'});
 assert.ok(distance(mei[0],zixuan[0])>135,'the two people retain separate final footpoints');
 assert.equal(current.companion,null,'the main actor also replaces the ordinary follower');
 let interaction=null;current.onEvent=type=>{interaction=type;};Object.assign(current.s.hero,{x:835,y:525});
 const before=copy(current.s);assert.equal(current.interact(mei[0]),true);assert.equal(interaction,'interact');
 assert.deepEqual(current.s,before,'opening the conversation cannot commit an answer');
}
const decision=snapshot(game);let branchCases=0;
// Other revealed speakers retain their staged appearance; stage triggers and
// battle aftermath actors are covered by the existing staging/skirmish suites.
for(const spec of [
 {id:'e07',phase:'choice',name:'月眉儿',x:1030,y:550,sprite:2},
 {id:'gCult_appointment',phase:'talk',name:'纳兰潜凛',x:1100,y:620,sprite:3,npcCell:3},
]){
 const current=create(spec.id,{['staged_'+spec.id]:true});current.s.phase=spec.phase;
 const speakers=current.markers.filter(marker=>marker.name===spec.name);assert.equal(speakers.length,1);
 const speaker=speakers[0];assert.equal(speaker.id,'main');assert.equal(speaker.kind,'main');assert.equal(speaker.main,true);
 for(const key of ['x','y','sprite'])assert.equal(speaker[key],spec[key]);
 if(Object.hasOwn(spec,'npcCell'))assert.equal(speaker.npcCell,spec.npcCell);
}
// Restoring a stale cursor after a death scene must not turn its final corpse
// into a standing, clickable main NPC. Hidden Mei also must not reappear.
for(const id of ['gCult_qiangwei','gCult_zixuan','e06_kill','e06_refuse','e08_refuse','e08_kill']){
 const current=create(id,{['staged_'+id]:true});current.s.phase='talk';
 const bodies=current.markers.filter(marker=>marker.name===current.q.npc);
 assert.equal(bodies.length,1,id+' has one corpse');assert.equal(bodies[0].pose,'fallen');
 assert.equal(bodies[0].main,false);assert.equal(bodies[0].interactive,false);
 const before=copy(current.s);Object.assign(current.s.hero,{x:bodies[0].x,y:bodies[0].y});
 const nearBody=copy(current.s);assert.equal(current.interact(bodies[0]),false);assert.deepEqual(current.s,nearBody);
 assert.equal(current.s.quest,before.quest);
 if(id.startsWith('e08_'))assert.ok(!current.markers.some(marker=>marker.name==='月眉儿'));
}
// Daylight belongs only to this return, including the wait to board after the
// farewell. Earlier island scenes retain their existing atmosphere and cache.
const originalDockLight=getScene('m40',MAPS.m40).atmosphere.light;
assert.equal(originalDockLight,'night');
for(const spec of [
 {id:'e08_departure',cleared:true,expected:'day'},
 {id:'e08',cleared:true,expected:'day'},
 {id:'e08_departure',cleared:false,expected:originalDockLight},
 {id:'a56',cleared:false,expected:originalDockLight},
 {id:'e06_landing',cleared:false,expected:originalDockLight},
 {id:'e06_landing',cleared:true,expected:originalDockLight},
 {id:'e09',cleared:true,expected:originalDockLight},
]){
 const current=create(spec.id,{evilIslandCleared:spec.cleared});current.s.map='m40';
 assert.equal(current.scene.atmosphere.light,spec.expected,spec.id+' return-window light');
 assert.equal(reload(current).scene.atmosphere.light,spec.expected,'reload retains return-window light');
}
assert.equal(getScene('m40',MAPS.m40).atmosphere.light,originalDockLight,'daylight must not mutate the shared scene');
// A stale menu or an inconsistent saved cursor must not apply an already
// completed answer again, even though that answer has real score/flag effects.
for(const spec of [
 {id:'e08',flags:{evilIslandFarewell:true,staged_e08:true},recorded:0,replay:1},
 {id:'e09',flags:{evilLegacyManorPrelude:true},recorded:1,replay:0},
]){
 const stale=create(spec.id,spec.flags);stale.s.phase='choice';stale.s.choices[spec.id]=spec.recorded;
 stale.s.done.push(spec.id);stale.s.claimedRewards.push(spec.id);stale.s.flags.evil=11;stale.s.affection.mei=4;
 const before=copy(stale.s);assert.equal(stale.choose(spec.replay),false,'completed choices reject a stale menu submission');
 assert.deepEqual(stale.s,before,'rejected answers do not change the stored choice, flags, morality, affection or resources');
}

for(const answer of [0,1]){
 let g=new GameEngine(restoreState(decision));const baseline=economy(g),evil=g.s.flags.evil,resultId=answer===0?'e08_refuse':'e08_kill',otherId=answer===0?'e08_kill':'e08_refuse';
 assert.equal(g.choose(answer),true);assert.equal(g.q.id,resultId);assert.equal(g.s.choices.e08,answer);assert.equal(g.s.flags.evil,evil+(answer===0?-3:3));assert.ok(!g.s.flags.evilZixuanDead);
 g=reload(g);assert.equal(g.q.id,resultId);assert.equal(g.choose(answer),false);assert.equal(g.s.flags.evil,evil+(answer===0?-3:3));assert.deepEqual(economy(g),baseline);
 let fallenSeen=false;
 g=stage(g,{beforeTick(active){
  assert.ok(!active.s.flags.evilZixuanDead,'the choice alone does not commit the death');
  const body=active.s.sequence.actors.find(actor=>actor.id==='mainland-zixuan');if(body.pose==='fallen'){fallenSeen=true;assert.equal(active.stagingActors().find(actor=>actor.id===body.id).interactive,false);}
 }});
 assert.ok(fallenSeen);assert.equal(g.q.id,'e09_report');assert.equal(g.s.flags.evilZixuanDead,true);assert.equal(g.s.flags.companion,'月眉儿');
 assert.ok(g.s.done.includes(resultId));assert.ok(!g.s.done.includes(otherId));assert.ok(!g.s.flags['staged_'+otherId]);assert.deepEqual(economy(g),baseline);
 assert.equal(g.s.enemies.length,0);assert.equal(g.s.skirmish,null);
 for(let revisit=0;revisit<2;revisit++){
  const bodies=g.markers.filter(marker=>marker.name==='紫轩');assert.equal(bodies.length,1,'only one persistent Zixuan remains at the dock');assert.equal(bodies[0].pose,'fallen');assert.equal(bodies[0].interactive,false);
  Object.assign(g.s.hero,{x:bodies[0].x,y:bodies[0].y});assert.equal(g.interact(bodies[0]),false);
  walk(g,'m41');walk(g,'r_mainland_dock');g=reload(g);assert.deepEqual(economy(g),baseline);
 }
 assert.equal(g.s.flags.evil,evil+(answer===0?-3:3));assert.deepEqual(walk(g,'m49'),['r_mainland_dock','m41','m49']);assert.equal(g.requireQuestFlags(),true);
 branchCases++;
}
for(const id of ['e08_refuse','e08_kill'])for(const both of [false,true]){
 const g=create(id,{evilZixuanDecision:true,evilZixuanRefuse:both,evilZixuanKill:both});g.beginObjective();g.completeQuest();assert.equal(g.s.sequence,null);assert.equal(g.q.id,id,'neither missing nor competing outcomes may execute');
}
for(const flags of [{},{evilIslandFarewell:true},{evilLegacyIslandPassage:true},{evilIslandFarewell:true,evilLegacyIslandPassage:true}]){
 const g=create('e08',flags),allowed=!!(flags.evilIslandFarewell||flags.evilLegacyIslandPassage);g.beginObjective();
 assert.equal(g.s.phase,allowed?'staging':'talk','either actual farewell or explicit legacy passage satisfies the OR prerequisite');
 if(allowed){const invalid=snapshot(g);delete invalid.flags.evilIslandFarewell;delete invalid.flags.evilLegacyIslandPassage;
  const blocked=new GameEngine(restoreState(invalid));assert.equal(blocked.s.sequence,null);blocked.beginObjective();assert.equal(blocked.s.phase,'talk');}
}
for(const authorized of [false,true]){
 const g=create('e09_report',authorized?{evilLegacyZixuanOutcome:true}:{});g.beginObjective();assert.equal(g.s.phase,authorized?'staging':'talk','the manor report requires a completed current or explicit historical dock result');
}
for(const key of ['m61','lakeDream','invalidProjection']){
 const corrupt=copy(projectionSaves[0]);corrupt.sequence.sceneKey=key;const loaded=new GameEngine(restoreState(corrupt));
 assert.equal(loaded.s.sequence,null);assert.equal(loaded.s.map,'r_forbidden_path');assert.ok(loaded.passable(loaded.s.hero.x,loaded.s.hero.y));assert.ok(!loaded.s.flags.evilTowerInterludeComplete);
}

for(const mutate of [raw=>{raw.sequence.origin=null;},raw=>{raw.sequence.origin.map='m61';}]){
 const raw=copy(projectionSaves[0]),baseline=resources(new GameEngine(restoreState(raw)));mutate(raw);
 let restored=new GameEngine(restoreState(raw));assert.equal(restored.s.sequence,null,'a projection without its valid real-map origin must be rejected');
 assert.equal(restored.s.map,'r_forbidden_path');assert.equal(restored.s.phase,'talk');assert.ok(restored.passable(restored.s.hero.x,restored.s.hero.y));
 assert.ok(!restored.s.flags.evilTowerInterludeComplete&&!restored.s.flags.staged_e08_interlude);assert.deepEqual(resources(restored),baseline);
 restored=stage(restored,{projection:true});assert.equal(restored.q.id,'e08_island_battle','a rejected projection may be replayed from a real safe point');
}

const oldLists=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS];
const newEvents=['e08_interlude','e08_island_battle','e08_departure','e08_refuse','e08_kill'];let legacyCases=0;
function legacy(id,revision,numeric,{choice=null,done=false}={}){
 const g=create(id);g.s.map=id==='e08'?'m41':'m49';g.s.phase='choice';g.s.done=done?['e07','e08']:['e07'];g.s.claimedRewards=[...g.s.done];
 g.s.hero.hp=113;g.s.hero.mp=59;g.s.hero.stamina=37;g.s.flags.evil=9;
 if(choice!==null)g.s.choices.e08=choice;
 const raw=snapshot(g);raw.campaignRevision=revision;
 if(numeric){delete raw.questId;raw.quest=oldLists[revision-1].indexOf(id);assert.ok(raw.quest>=0);}else raw.quest=0;
 return {raw,budget:economy(g)};
}
function noInventedEvents(g,raw,budget){
 assert.equal(g.s.campaignRevision,13);assert.deepEqual(economy(g),budget);assert.equal(g.s.flags.evil,raw.flags.evil);
 assert.deepEqual(g.s.done,raw.done);assert.deepEqual(g.s.claimedRewards,raw.claimedRewards);
 for(const id of newEvents){assert.ok(!g.s.done.includes(id));assert.ok(!g.s.claimedRewards.includes(id));assert.ok(!g.s.flags['staged_'+id]);}
 assert.equal(g.s.skirmish,null);assert.ok(!g.s.flags.evilTowerInterludeComplete&&!g.s.flags.evilIslandCleared&&!g.s.flags.evilIslandFarewell);
}
for(let revision=1;revision<=7;revision++)for(const numeric of [false,true]){
 for(const choice of [null,0,1]){
  const {raw,budget}=legacy('e08',revision,numeric,{choice}),g=new GameEngine(restoreState(raw));noInventedEvents(g,raw,budget);
  assert.equal(g.s.flags.evilLegacyIslandPassage,true);assert.equal(g.s.map,'r_mainland_dock');assert.equal(g.s.flags.evilLegacyDockMap,'m41');assert.ok(!g.s.flags.evilZixuanDead);
  if(choice===null){assert.equal(g.q.id,'e08');assert.equal(g.s.phase,'choice');assert.ok(!Object.hasOwn(g.s.choices,'e08'));}
  else{assert.equal(g.q.id,choice===0?'e08_refuse':'e08_kill');assert.equal(g.s.choices.e08,choice);assert.equal(g.s.flags.evilZixuanRefuse,choice===0);assert.equal(g.s.flags.evilZixuanKill,choice===1);}
  const again=reload(g);assert.equal(again.q.id,g.q.id);assert.deepEqual(economy(again),budget);assert.equal(again.s.flags.evil,9);legacyCases++;
 }
 for(const choice of [null,0,1]){
  const {raw,budget}=legacy('e09',revision,numeric,{choice,done:true}),g=new GameEngine(restoreState(raw));noInventedEvents(g,raw,budget);
  assert.equal(g.q.id,'e09');assert.equal(g.s.map,'m50');assert.equal(g.s.flags.evilLegacyManorPrelude,true);assert.equal(g.s.flags.evilLegacyZixuanOutcome,true);assert.equal(g.s.flags.evilZixuanDead,true);
  if(choice===null){assert.equal(g.s.flags.evilLegacyZixuanUnknown,true);assert.ok(!g.s.flags.evilZixuanKill&&!g.s.flags.evilZixuanRefuse);}
  else{assert.equal(g.s.flags.evilZixuanRefuse,choice===0);assert.equal(g.s.flags.evilZixuanKill,choice===1);}
  legacyCases++;
 }
}
for(const flags of [{evilZixuanKill:true},{evilZixuanKill:true,evilZixuanRefuse:true}]){
 const {raw,budget}=legacy('e09',7,false,{choice:0,done:true});Object.assign(raw.flags,flags);const g=new GameEngine(restoreState(raw));noInventedEvents(g,raw,budget);
 assert.equal(g.s.flags.evilLegacyZixuanUnknown,true,'conflicting choice/flags preserve an unknown historical perpetrator');assert.ok(!g.s.flags.evilZixuanKill&&!g.s.flags.evilZixuanRefuse);legacyCases++;
}
// A saved choice may already have affected the old hidden score even if its
// task-completion entry was never recorded. A conflict must not ask again.
for(const flags of [{evilZixuanKill:true},{evilZixuanKill:true,evilZixuanRefuse:true}]){
 const {raw,budget}=legacy('e08',7,false,{choice:0});Object.assign(raw.flags,flags);const g=new GameEngine(restoreState(raw));noInventedEvents(g,raw,budget);
 assert.equal(g.q.id,'e09_report');assert.equal(g.s.map,'m41');assert.ok(!g.s.flags.evilLegacyManorPrelude);assert.equal(g.s.flags.evilLegacyZixuanUnknown,true);assert.equal(g.s.flags.evilZixuanDead,true);
 assert.ok(!g.s.flags.evilZixuanKill&&!g.s.flags.evilZixuanRefuse);assert.equal(g.s.flags.evil,9);legacyCases++;
}
for(const choice of [null,0,1]){
 const {raw,budget}=legacy('e08',7,false,{choice,done:true}),g=new GameEngine(restoreState(raw));noInventedEvents(g,raw,budget);
 assert.equal(g.q.id,'e09_report','a completed old dock task must not resume its already-decided menu or skip the new manor report');assert.equal(g.s.flags.evilZixuanDead,true);assert.equal(g.s.sequence,null);legacyCases++;
}
const preDock=legacy('e08',7,false);preDock.raw.phase='talk';const untouched=new GameEngine(restoreState(preDock.raw));
assert.equal(untouched.q.id,'e08');assert.equal(untouched.s.phase,'talk');assert.ok(!untouched.s.flags.evilLegacyDocksPrelude);assert.equal(untouched.s.sequence,null);
const good=legacy('e08',7,false);good.raw.flags.route='good';const otherRoute=restoreState(good.raw);assert.ok(!otherRoute.flags.evilLegacyIslandPassage,'the migration is isolated from the good route');
assert.ok(midMoveRestores>0);assert.ok(restoredSteps>70);assert.ok(timedRestores>0);assert.equal(renderChecks,2);
console.log(JSON.stringify({result:'PASS',restoredSteps,midMoveRestores,timedRestores,renderChecks,branchCases,legacyCases,checks:'physical return, projection isolation, staged civilian withdrawal, 36-enemy clear, one-time recovery, boat passage, exclusive dock outcomes, persistent body, old-save history'}));
