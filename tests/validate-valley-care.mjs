import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import * as campaign from '../public/campaign.mjs';

// Independently authored state tests. Walking uses real exits and pathfinding;
// animation saves are restored at each step and mid-movement. This does not
// replace visual browser acceptance or establish original-game fidelity.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert.ok(n>=0,id+' exists');return n;};
const snapshot=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const careIds=['g06','g06_confide','g06_inquire','g06_request','g06_return','g06_introduce','g06_rest','g07','g07_dawn','g07_visit','g07_zhen','g07_apology','g07_mainland','g07_island','g07_settle'];
const addedIds=careIds.filter(id=>!['g06','g07'].includes(id));
const budget=g=>copy({coins:g.s.coins,kills:g.s.kills,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,equipment:g.s.equipment,skills:g.s.skills,hero:Object.fromEntries(['hp','maxHp','mp','maxMp','stamina','level','exp'].map(key=>[key,g.s.hero[key]]))});
const lastingBudget=g=>{const result=budget(g);delete result.hero.mp;delete result.hero.stamina;return result;};
const scores=g=>copy({evil:g.s.flags.evil,moral:g.s.flags.moral,affection:g.s.affection});
const followers=g=>g.companions??(g.companion?[g.companion]:[]);
function state(id='g06',flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.visited=[s.map];s.phase='talk';
 Object.assign(s.flags,{route:'good',moral:4,evil:-2,...flags});Object.assign(s.hero,{hp:119,mp:63,stamina:41,exp:17});
 s.coins=379;s.inventory={wood_box:1};s.affection={zhen:3,zi:2,mei:4,wei:1};
 return s;
}
function create(id='g06',flags={}){
 const s=state(id,flags),g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
let branchCases=0,restoredSteps=0,midMoveRestores=0,timedRestores=0,travelRestores=0,companionChecks=0,legacyCases=0;
const visitedSteps=new Set(),stageSaves=new Map(),walkPaths=[];
function visible(g,names){
 const actors=[...g.markers.filter(actor=>actor.sprite!=null&&!actor.hidden),...followers(g)];
 for(const name of names)assert.equal(actors.filter(actor=>actor.name===name).length,1,name+' must appear exactly once on '+g.s.map+' / '+g.q.id);
 for(const actor of followers(g))assert.ok(g.passable(actor.x,actor.y),actor.name+' follower stands on traversable ground');
 companionChecks++;
}
function walk(game,to,names=[],expected){
 let g=game;const path=[g.s.map],restoredMaps=new Set();if(g.s.map===to)return g;
 assert.equal(g.travel(to),true,'route to '+to+' is open');let enteredAt={x:g.s.hero.x,y:g.s.hero.y};
 for(let tick=0;tick<22000&&g.s.map!==to;tick++){
  visible(g,names);const from=g.s.map,neighbors=g.exits().filter(edge=>!edge.locked).map(edge=>edge.to),previous=copy(followers(g));g.tick(.05);
  if(g.s.map!==from){assert.ok(neighbors.includes(g.s.map),'walking crosses a real adjacent exit');path.push(g.s.map);enteredAt={x:g.s.hero.x,y:g.s.hero.y};}
  else for(const actor of followers(g)){const before=previous.find(old=>old.name===actor.name);if(before)assert.ok(g.clearSegment(before,actor),actor.name+' follows around obstacles without crossing them');}
  visible(g,names);
  if(g.s.map!==to&&!restoredMaps.has(g.s.map)&&distance(g.s.hero,enteredAt)>35){
   const state=snapshot(g),loaded=new GameEngine(restoreState(state));assert.equal(loaded.s.map,g.s.map);assert.equal(loaded.q.id,g.q.id);assert.deepEqual(loaded.s.objectiveProgress,g.s.objectiveProgress);assert.deepEqual(budget(loaded),budget(g));assert.deepEqual(scores(loaded),scores(g));visible(loaded,names);
   restoredMaps.add(g.s.map);g=loaded;travelRestores++;
  }
 }
 assert.equal(g.s.map,to,'walking reaches '+to);if(expected)assert.deepEqual(path,expected);walkPaths.push(path);visible(g,names);return g;
}
function leapTo(game,goal){
 let g=game;assert.equal(g.findPath(goal.x,goal.y).length,0,'water cannot be crossed on foot');
 const jump=(g.scene.jumps||[]).flatMap(def=>['a','b'].map(side=>({def,side,from:def[side],to:def[side==='a'?'b':'a']}))).find(({from,to})=>g.findPath(from.x,from.y).length&&g.findPath(goal.x,goal.y,to).length);
 assert.ok(jump,'the authored leap links the two reachable shores');assert.equal(g.moveTo(jump.from.x,jump.from.y),true);
 for(let n=0;n<5000&&distance(g.s.hero,jump.from)>45;n++)g.tick(.05);
 assert.ok(distance(g.s.hero,jump.from)<100,'walk to the takeoff point');const point={x:g.s.hero.x,y:g.s.hero.y};
 assert.equal(g.startJump(jump.def.id,jump.side),true);for(let n=0;n<6;n++)g.tick(.05);
 assert.deepEqual({x:g.s.hero.x,y:g.s.hero.y},point,'logical save position stays on safe ground while airborne');assert.ok(g.renderJump().jumpHeight>0);
 const airborne=snapshot(g);assert.equal(g.cast(0),false,'airborne input cannot cast');g.meditate();assert.equal(g.meditating,false,'airborne input cannot start meditation');assert.equal(g.travel('m51'),false,'airborne input cannot cross a world exit');assert.deepEqual(snapshot(g),airborne,'blocked airborne actions preserve saved state');
 const loaded=reload(g);assert.ok(!loaded.jump,'reloading never leaves a half-completed leap');assert.deepEqual({x:loaded.s.hero.x,y:loaded.s.hero.y},point);assert.ok(loaded.passable(loaded.s.hero.x,loaded.s.hero.y));g=loaded;
 assert.equal(g.startJump(jump.def.id,jump.side),true);for(let n=0;n<30&&g.jump;n++)g.tick(.05);assert.equal(g.jump,null);assert.deepEqual({x:g.s.hero.x,y:g.s.hero.y},jump.to);assert.ok(g.findPath(goal.x,goal.y).length,'landing opens walking on the other shore');return g;
}
function stage(game,onDialogue=()=>{},observe=()=>{}){
 let g=game;const id=g.q.id,steps=STAGED_QUESTS[id].steps,baseline=budget(g),score=scores(g),map=g.s.map;
 g.completeQuest();assert.equal(g.q.id,id,'a required care scene cannot be skipped');g.beginObjective();assert.equal(g.s.phase,'staging',id+' begins');
 const seen=new Set(),moving=new Set(),timed=new Set();let previous=-1,moveStart=null;
 for(let tick=0;tick<16000&&g.s.phase==='staging';tick++){
  const sequence=g.s.sequence,step=steps[sequence.step];observe(g,step);
  assert.equal(g.s.map,map);assert.equal(g.s.enemies.length,0);assert.equal(g.s.skirmish,null);for(const actor of g.stagingActors())assert.ok(g.passable(actor.x,actor.y),id+' / '+actor.name+' stands on traversable ground');assert.deepEqual(budget(g),baseline);assert.deepEqual(scores(g),score);
  const actor=step?.type==='move'?(step.actor==='hero'?g.s.hero:sequence.actors.find(other=>other.id===step.actor)):null;
  if(previous!==sequence.step)moveStart=actor?{x:actor.x,y:actor.y}:null;
  const midMove=previous===sequence.step&&actor&&moveStart&&!moving.has(sequence.step)&&distance(actor,moveStart)>18&&distance(actor,step)>15;
  const midTimed=['wait','pose'].includes(step?.type)&&!timed.has(sequence.step)&&sequence.elapsed>.1&&sequence.elapsed<(step.duration||.5)-.1;
  for(const name of ['纳兰真','月眉儿','蔷薇'])assert.ok([...g.markers.filter(a=>a.sprite!=null&&!a.hidden),...followers(g)].filter(a=>a.name===name).length<=1,name+' scene actor cannot have a following duplicate');
  for(const actor of sequence.actors.filter(actor=>actor.hidden))assert.ok(!followers(g).some(follower=>follower.name===actor.name),id+' step '+sequence.step+' / '+actor.name+' cannot reappear as a follower after leaving an active scene');
  if(!seen.has(sequence.step)||midMove||midTimed){
   const before=snapshot(g),loaded=new GameEngine(restoreState(before));assert.equal(loaded.s.sequence?.step,sequence.step,id+' restores its exact step');assert.equal(loaded.s.sequence.elapsed,sequence.elapsed);assert.deepEqual(loaded.s.sequence.cues,sequence.cues);
   assert.equal(loaded.s.hero.x,g.s.hero.x);assert.equal(loaded.s.hero.y,g.s.hero.y);assert.equal(loaded.scene.atmosphere.light,g.scene.atmosphere.light);
   for(const actor of sequence.actors){const restored=loaded.s.sequence.actors.find(other=>other.id===actor.id);assert.ok(restored);for(const key of ['x','y','pose','direction','sprite','npcCell'])assert.equal(restored[key],actor[key]);assert.equal(!!restored.hidden,!!actor.hidden);assert.deepEqual(restored.renderAt,actor.renderAt,'patient visual placement survives restoration without changing collision feet');}
   assert.deepEqual(budget(loaded),baseline);assert.deepEqual(scores(loaded),score);if(!stageSaves.has(id))stageSaves.set(id,before);
   seen.add(sequence.step);visitedSteps.add(id+':'+sequence.step);if(midMove){moving.add(sequence.step);midMoveRestores++;}if(midTimed){timed.add(sequence.step);timedRestores++;}
   g=loaded;restoredSteps++;assert.equal(g.travel('m49'),false);assert.equal(g.cast(0),false);assert.equal(g.choose(0),false);g.completeQuest();assert.equal(g.q.id,id);
  }
  previous=sequence.step;const active=g;g.onEvent=(type,data)=>{if(type==='stagingDialogue'){onDialogue(data.lines);active.advanceStaging();}};g.tick(.05);
 }
 assert.notEqual(g.s.phase,'staging',id+' releases without a movement deadlock');assert.equal(g.s.sequence,null);assert.equal(g.s.flags['staged_'+id],true);assert.deepEqual(budget(g),baseline);assert.deepEqual(scores(g),score);return g;
}
const migrationOnly=process.argv.includes('--migration-only'),legacyFlowOnly=process.argv.includes('--legacy-flow-only');
for(const id of careIds){const q=QUESTS[index(id)];assert.equal(q.xp,0);assert.equal(q.money,0);assert.equal(q.requireStaging,true);assert.equal(q.when.route,'good');assert.ok(STAGED_QUESTS[id]);}
assert.equal(addedIds.length,13);
if(!migrationOnly&&!legacyFlowOnly){
 for(const answer of [0,1]){
  let g=create();const initial=lastingBudget(g),score=scores(g);assert.equal(g.travel('r_leaf_zhen_room'),false,'care rooms require the initial conversation');g=stage(g);assert.equal(g.s.phase,'choice');assert.equal(g.q.id,'g06');const beforeAnswer=copy(g.s.flags);
  assert.equal(g.choose(answer),true);assert.equal(g.q.id,'g06_confide');assert.equal(g.s.choices.g06,answer);assert.equal(g.s.flags.valleyCareStarted,true);assert.equal(g.s.flags.valleyCareRefused,answer===0);assert.equal(g.s.flags.valleyCareConsidered,answer===1);assert.equal(g.s.flags.companion,null);assert.deepEqual(scores(g),score);assert.deepEqual(lastingBudget(g),initial);
  const changedFlags=Object.keys(g.s.flags).filter(key=>g.s.flags[key]!==beforeAnswer[key]);assert.deepEqual(changedFlags.sort(),['companion','companions','valleyCareConsidered','valleyCareRefused','valleyCareStarted'].sort(),'answer records only its proposal branch; no marriage commitment or unrelated state');
  g=reload(g);assert.equal(g.choose(answer),false);assert.equal(g.travel('m49'),false,'care cannot be abandoned through an old valley exit');
  g=walk(g,'r_leaf_zhen_room',[],['m51','r_leaf_zhen_room']);const heard=[];g=stage(g,lines=>heard.push(...lines.map(line=>line[1])));
  for(const step of STAGED_QUESTS.g06_confide.steps.filter(step=>step.type==='say'&&step.when))for(const line of step.lines){const active=step.when.flag===(answer===0?'valleyCareRefused':'valleyCareConsidered');assert.equal(heard.includes(line[1]),active,'only the actual answer is repeated to Zhen');}
  assert.equal(g.s.flags.valleyZhenHeard,true);
  g=walk(g,'r_leaf_rose_room',[],['r_leaf_zhen_room','m51','r_leaf_rose_room']);assert.ok(!g.markers.some(a=>a.name==='蔷薇'),'inquiry finds the maid, not the absent Qiangwei');g=stage(g);assert.equal(g.s.flags.valleyRoseLocation,true);
  g=walk(g,'m52',[],['r_leaf_rose_room','m51','m52']);g=leapTo(g,STAGED_QUESTS.g06_request.startPoint);g=stage(g);assert.equal(g.s.flags.valleyRoseAsked,true);assert.ok(!g.s.flags.valleyTreatmentAgreed,'lake request alone cannot promise treatment');assert.equal(followers(g).length,0,'Qiangwei goes ahead, rather than becoming a lake follower');
  g=leapTo(g,g.scene.portals.m51.exit);g=walk(g,'m51',[],['m52','m51']);g=stage(g);assert.equal(g.s.flags.valleyTreatmentAgreed,true);assert.equal(g.s.flags.companion,'蔷薇');assert.deepEqual(g.partyNames,['蔷薇']);
  g=walk(g,'r_leaf_zhen_room',['蔷薇'],['m51','r_leaf_zhen_room']);g=stage(g);assert.equal(g.s.flags.valleyIntroduced,true);assert.equal(g.s.flags.companion,null);
  g=walk(g,'r_leaf_hero_room',[],['r_leaf_zhen_room','m51','r_leaf_hero_room']);const nightLights=new Set();g=stage(g,()=>{},active=>{const expected=active.s.sequence.cues.valleyCareLight==='night'?'night':'day';assert.equal(active.scene.atmosphere.light,expected);nightLights.add(expected);assert.ok(!active.s.flags.valleyCareNight,'the light cue precedes milestone completion');});assert.deepEqual([...nightLights],['day','night']);assert.equal(g.s.flags.valleyCareNight,true);assert.equal(g.q.id,'g07');assert.equal(g.scene.atmosphere.light,'night');
  g=walk(g,'r_leaf_rose_room',[],['r_leaf_hero_room','m51','r_leaf_rose_room']);assert.equal(g.scene.atmosphere.light,'night');g=stage(g);assert.equal(g.s.flags.valleyThanks,true);
  g=walk(g,'r_leaf_hero_room',[],['r_leaf_rose_room','m51','r_leaf_hero_room']);assert.equal(g.scene.atmosphere.light,'night','returning to rest precedes daybreak');const dawnLights=new Set();g=stage(g,()=>{},active=>{const expected=active.s.sequence.cues.valleyCareLight==='day'?'day':'night';assert.equal(active.scene.atmosphere.light,expected);dawnLights.add(expected);assert.ok(!active.s.flags.valleyCareMorning,'daylight alone is not completed rest');});assert.deepEqual([...dawnLights],['night','day']);assert.equal(g.s.flags.valleyCareMorning,true);assert.equal(g.scene.atmosphere.light,'day');
  g=walk(g,'r_leaf_mei_room',[],['r_leaf_hero_room','m51','r_leaf_mei_room']);g=stage(g);assert.equal(g.s.flags.valleyMorningReport,true);assert.ok(!g.s.flags.valleyMeiAwake,'maid report does not replace the personal apology');
  g=walk(g,'r_leaf_zhen_room',[],['r_leaf_mei_room','m51','r_leaf_zhen_room']);g=stage(g);assert.equal(g.s.flags.valleyZhenReady,true);assert.equal(g.s.flags.companion,'纳兰真');
  g=walk(g,'r_leaf_mei_room',['纳兰真'],['r_leaf_zhen_room','m51','r_leaf_mei_room']);g=stage(g);assert.equal(g.s.flags.valleyMeiAwake,true);assert.ok(!g.s.flags.valleyCareBoarded);assert.equal(g.q.id,'g07_mainland');assert.deepEqual(g.partyNames,['纳兰真','月眉儿']);
  g=walk(g,'r_mainland_dock',['纳兰真','月眉儿'],['r_leaf_mei_room','m51','m49','m41','r_mainland_dock']);assert.equal(g.travel('m40'),false,'arriving at the mainland dock does not yet board');assert.ok(!g.s.flags.valleyCareSettled);g=stage(g);assert.equal(g.s.flags.valleyCareBoarded,true);
  const boat=g.exits().find(edge=>edge.to==='m40');assert.equal(boat.transport,'boat');assert.match(boat.travelLabel,/乘船/);
  g=walk(g,'m40',['纳兰真','月眉儿'],['r_mainland_dock','m40']);assert.ok(!g.s.flags.valleyCareLanded);assert.ok(!g.s.flags.valleyCareSettled);g=stage(g);assert.equal(g.s.flags.valleyCareLanded,true);
  g=walk(g,'m33',['纳兰真','月眉儿'],['m40','m34','m33']);assert.ok(!g.s.flags.valleyCareSettled);g=stage(g);assert.equal(g.s.flags.valleyCareSettled,true);assert.equal(g.q.id,'g08');assert.equal(g.s.flags.companion,null);assert.equal(followers(g).length,0,'both companions remain at the house');assert.deepEqual(g.partyNames,[]);
  assert.deepEqual(scores(g),score);assert.deepEqual(lastingBudget(g),initial);assert.equal(g.s.done.filter(id=>careIds.includes(id)).length,careIds.length);assert.ok(!g.s.flags.silverGrassDelivered);assert.equal(g.s.inventory.silver_grass||0,0);assert.equal(g.s.inventory.jade_half||0,0);assert.equal(g.s.inventory.mother_letter||0,0);
  g=reload(g);g=walk(g,'m32');assert.equal(followers(g).length,0);g.beginObjective();assert.equal(g.s.phase,'search','only after settling does the existing twelve-herb task begin');assert.equal(g.s.collected,0);assert.deepEqual(lastingBudget(g),initial);branchCases++;
 }
 // Foreign projections, missing predecessor flags, opposite routes, and branch
 // mixtures cannot restore or complete a later care event.
 for(const [id,raw] of stageSaves)for(const mutate of [s=>{s.sequence.questId='foreign';},s=>{s.map=s.map==='m49'?'m51':'m49';},s=>{s.flags.route='evil';}]){
  const invalid=copy(raw);mutate(invalid);const g=new GameEngine(restoreState(invalid));assert.equal(g.s.sequence,null,id+' rejects a foreign scene');assert.ok(!g.s.flags['staged_'+id]);
 }
 for(const id of careIds.filter(id=>id!=='g06')){
  for(const both of [false,true]){const g=create(id,{valleyCareRefused:both,valleyCareConsidered:both});for(const key of g.q.requiredFlags||[])g.s.flags[key]=true;const before=budget(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.sequence,null);assert.deepEqual(budget(g),before);}
  const g=create(id,{valleyCareRefused:true,valleyCareConsidered:false}),before=budget(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.sequence,null);assert.deepEqual(budget(g),before);
 }
 const herbs=create('g08');const before=budget(herbs);herbs.beginObjective();herbs.completeQuest();assert.equal(herbs.q.id,'g08');assert.equal(herbs.s.phase,'talk');assert.deepEqual(budget(herbs),before);
}

// Old narrated history has an explicit label; migration never pretends the new
// scenes were played, invents an answer, refunds a score or pays a new reward.
const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS,campaign.REVISION_NINE_QUEST_IDS];
assert.equal(freshState().campaignRevision,16);assert.ok(Array.isArray(oldTables[8]));assert.ok(!oldTables[8].includes('g06_confide'));
function legacy(id,revision,numeric,{answer,phase='talk',done=[],away=false,flags={}}={}){
 const raw=snapshot(create(id));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf(id);assert.ok(raw.quest>=0);if(numeric)delete raw.questId;
 raw.map=['g06','g07'].includes(id)?'m51':QUESTS[index(id)].map;raw.hero.x=760;raw.hero.y=650;raw.phase=phase;raw.visited=[raw.map];raw.done=[...done];raw.claimedRewards=[...done];raw.flags={route:'good',evil:11,moral:-6,companion:'纳兰真',...flags};
 if(answer!==undefined)raw.choices.g06=answer;
 if(away){raw.map='m49';raw.visited.push('m49');raw.objectiveProgress={questId:id,phase,collectedIds:[]};raw.phase='travel';}
 return raw;
}
function preserved(g,raw){
 assert.deepEqual(budget(g),budget({s:raw}));assert.deepEqual(scores(g),scores({s:raw}));assert.deepEqual(g.s.done,raw.done);assert.deepEqual(g.s.claimedRewards,raw.claimedRewards);
 assert.equal(g.s.map,raw.map);assert.equal(g.s.hero.x,raw.hero.x);assert.equal(g.s.hero.y,raw.hero.y);
 for(const id of addedIds){assert.ok(!g.s.done.includes(id));assert.ok(!g.s.claimedRewards.includes(id));assert.ok(!g.s.flags['staged_'+id]);}
 for(const id of careIds)assert.ok(!g.s.flags['staged_'+id],'legacy metadata must not fabricate newly played staging');
 const again=reload(g);assert.equal(again.q.id,g.q.id);assert.deepEqual(budget(again),budget(g));assert.deepEqual(scores(again),scores(g));assert.deepEqual(again.s.done,g.s.done);legacyCases++;
}
for(let revision=1;revision<=9;revision++)for(const numeric of [false,true]){
 for(const phase of ['talk','choice','after'])for(const away of [false,true]){
  const raw=legacy('g06',revision,numeric,{phase,away}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'g06');assert.ok(!Object.hasOwn(g.s.choices,'g06'));assert.ok(!g.s.flags.valleyCareStarted);assert.ok(!g.s.flags.valleyLegacyCare);
  if(phase==='talk'){assert.ok(!g.s.flags.valleyLegacyCareProposal);assert.equal(g.s.phase,away?'travel':'talk');}
  else{assert.equal(g.s.flags.valleyLegacyCareProposal,true);assert.equal(g.s.phase,away?'travel':'choice');if(away)assert.equal(g.s.objectiveProgress?.phase,'choice');}
 }
 for(const answer of [0,1])for(const phase of ['choice','after']){
  const raw=legacy('g06',revision,numeric,{answer,phase,flags:{valleyCareRefused:answer===1,valleyCareConsidered:answer===0}}),g=new GameEngine(restoreState(raw));preserved(g,raw);
  assert.equal(g.q.id,'g06_confide');assert.equal(g.s.choices.g06,answer);assert.equal(g.s.flags.valleyCareStarted,true);assert.equal(g.s.flags.valleyCareRefused,answer===0);assert.equal(g.s.flags.valleyCareConsidered,answer===1);assert.equal(g.s.flags.companion,null);assert.equal(g.s.phase,'travel');
 }
 for(const answer of [undefined,0,1]){
  const raw=legacy('g07',revision,numeric,{answer,done:['g06']}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'g07');assert.equal(g.s.phase,'travel');assert.equal(g.s.flags.valleyLegacyCarePrelude,true);assert.ok(!g.s.flags.valleyLegacyCare);
  if(answer===undefined){assert.equal(g.s.flags.valleyLegacyCareChoiceUnknown,true);assert.ok(!Object.hasOwn(g.s.choices,'g06'));assert.ok(!g.s.flags.valleyCareRefused&&!g.s.flags.valleyCareConsidered);}
  else{assert.equal(g.s.choices.g06,answer);assert.equal(g.s.flags.valleyCareRefused,answer===0);assert.equal(g.s.flags.valleyCareConsidered,answer===1);}
 }
 for(const id of ['g07','g08','g09','g15','g19']){
  const raw=legacy(id,revision,numeric,{done:['g06','g07'],flags:{companion:'蔷薇'}}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,id==='g07'?'g08':id);assert.equal(g.s.flags.valleyLegacyCare,true);assert.equal(g.s.flags.companion,id==='g19'?null:'蔷薇','pending tower reunion must locate Rose before restoring her escort');if(id==='g19'){assert.equal(g.s.flags.goodTowerLegacyAscent,true);assert.ok(!g.s.flags.goodTowerRoseFreed);}assert.ok(!g.s.flags.valleyCareSettled);
 }
}
for(const answer of [-1,2,99,'0',null]){
 const raw=legacy('g06',9,false,{answer,phase:'choice'}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'g06');assert.equal(g.s.phase,'choice');assert.equal(g.s.flags.valleyLegacyCareProposal,true);assert.ok(!Object.hasOwn(g.s.choices,'g06'));assert.ok(!g.s.flags.valleyCareStarted);
 const oldThanks=legacy('g07',9,false,{answer,done:['g06']}),thanks=new GameEngine(restoreState(oldThanks));preserved(thanks,oldThanks);assert.equal(thanks.q.id,'g07');assert.equal(thanks.s.flags.valleyLegacyCareChoiceUnknown,true);assert.ok(!Object.hasOwn(thanks.s.choices,'g06'));assert.ok(!thanks.s.flags.valleyCareRefused&&!thanks.s.flags.valleyCareConsidered);
}
// A completed prior cursor must not reopen its old answer or grant another task
// reward. The new night thanks remains an unplayed, actionable event.
{
 const raw=legacy('g06',9,false,{done:['g06'],phase:'after'}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'g07');assert.equal(g.s.flags.valleyLegacyCarePrelude,true);assert.ok(!g.s.flags.valleyLegacyCare);assert.ok(!Object.hasOwn(g.s.choices,'g06'));
}
// Unknown historical answers must still allow the remaining night, morning,
// apology and real return trip, without inventing a refused/considered answer.
if(!migrationOnly){
 const raw=legacy('g07',9,false,{done:['g06']}),original=new GameEngine(restoreState(raw)),before=lastingBudget(original),score=scores(original);let g=original;
 while(g.q.id!=='g08'){
  assert.ok(careIds.includes(g.q.id));const names=['g07_mainland','g07_island','g07_settle'].includes(g.q.id)?['纳兰真','月眉儿']:g.q.id==='g07_apology'?['纳兰真']:[];
  g=walk(g,g.q.map,names);g=stage(g);assert.ok(!Object.hasOwn(g.s.choices,'g06'));assert.ok(!g.s.flags.valleyCareRefused&&!g.s.flags.valleyCareConsidered);assert.deepEqual(scores(g),score);
 }
 assert.equal(g.s.flags.valleyCareSettled,true);assert.deepEqual(lastingBudget(g),before);assert.ok(!g.s.done.includes('g06_confide'));assert.deepEqual(g.partyNames,[]);legacyCases++;
}
// Numeric revision-nine indices and their battle tiers are frozen before the
// insertion, including the untouched evil route. No drift by global array index.
for(const [oldIndex,id] of oldTables[8].entries()){
 const raw=copy(state(id));raw.campaignRevision=9;raw.quest=oldIndex;raw.skills[8]=21;raw.flags.switch8=true;raw.flags.route=QUESTS[index(id)].when?.route||'good';if(id==='g07')raw.map='m51';
 const restored=restoreState(raw);assert.equal(QUESTS[restored.quest].id,({e06_rest:'e06_first_interlude',e05:'e04_homecoming',g14:'g14_dock_report',g13:'g13_hut',g16:'g15_escape',g18:'g17_manor',g20:'g19_return',g22:'g21_return',g24:'g23'})[id]||id,id+' keeps its old numeric identity or an explicit new unfinished-stage migration');assert.equal(QUESTS[index(id)].encounterTier,Math.max(1,Math.floor(oldIndex/9)+1),id+' keeps its battle tier');legacyCases++;
}
console.log(JSON.stringify({result:'PASS',mode:migrationOnly?'migration-only':legacyFlowOnly?'legacy-night-to-medicine':'full',branchCases,restoredSteps,midMoveRestores,timedRestores,travelRestores,companionChecks,legacyCases,paths:walkPaths,checks:migrationOnly?'revision 1–9 history, exact balances, pending/recorded/unknown answers, numeric identities and frozen encounter tiers':'exclusive answers without marriage/reward effects; care and thank-you itinerary; actual room doors and boat; saved staging and walking; unique obstacle-aware followers; settlement before medicine; revision 1–9 history and battle-tier compatibility'}));
