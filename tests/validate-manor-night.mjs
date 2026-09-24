import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import * as campaign from '../public/campaign.mjs';

// Independently authored state and route fixtures. These checks do not replace
// browser gameplay or establish visual fidelity to the reference game.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert.ok(n>=0,id+' exists');return n;};
const snapshot=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const budget=g=>copy({coins:g.s.coins,kills:g.s.kills,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,equipment:g.s.equipment,skills:g.s.skills,hero:Object.fromEntries(['hp','maxHp','mp','maxMp','stamina','level','exp'].map(key=>[key,g.s.hero[key]]))});
// Walking regenerates MP and stamina. Each staged sequence separately checks
// all resources exactly; the whole walking itinerary compares lasting rewards.
const lastingBudget=g=>{const result=budget(g);delete result.hero.mp;delete result.hero.stamina;return result;};
const scores=g=>copy({evil:g.s.flags.evil,moral:g.s.flags.moral,affection:g.s.affection});
const manorIds=['e09_report','e09_first_wake','e09','e09_part','e09_sleepless','e09_second_meeting','e09_room_talk','e09_morning'];
const addedIds=manorIds.filter(id=>id!=='e09');
function create(id,flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.visited=[s.map];
 Object.assign(s.flags,{route:'evil',evil:9,moral:-2,evilZixuanDead:true,companion:'月眉儿',...flags});
 Object.assign(s.hero,{hp:113,mp:59,stamina:37,exp:19});s.coins=287;s.inventory={wood_box:1};s.affection.mei=4;
 const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
function walk(g,to){
 const path=[g.s.map];if(g.s.map===to)return path;
 assert.equal(g.travel(to),true,'route to '+to+' is open');
 for(let tick=0;tick<18000&&g.s.map!==to;tick++){
  const from=g.s.map,neighbors=g.exits().filter(edge=>!edge.locked).map(edge=>edge.to);g.tick(.05);
  if(g.s.map!==from){assert.ok(neighbors.includes(g.s.map),'walk only crosses a real adjacent exit');path.push(g.s.map);}
 }
 assert.equal(g.s.map,to,'walk reaches '+to);return path;
}
const migrationOnly=process.argv.includes('--migration-only');
let branchCases=0,residentChecks=0,restoredSteps=0,midMoveRestores=0,timedRestores=0;const visitedSteps=new Set(),stageSaves=new Map();
function stage(game,observe=()=>{},onDialogue=()=>{}){
 let g=game;const id=g.q.id,steps=STAGED_QUESTS[id].steps,baseline=budget(g),score=scores(g),map=g.s.map;
 g.completeQuest();assert.equal(g.q.id,id,'required scene cannot be skipped');g.beginObjective();assert.equal(g.s.phase,'staging',id+' starts');
 const seen=new Set(),movingRestores=new Set(),timed=new Set();let previous=-1,moveStart=null;
 for(let tick=0;tick<15000&&g.s.phase==='staging';tick++){
  const sequence=g.s.sequence,step=steps[sequence.step];observe(g,step);
  assert.equal(g.s.map,map);assert.equal(g.s.enemies.length,0);assert.equal(g.s.skirmish,null);assert.deepEqual(budget(g),baseline);assert.deepEqual(scores(g),score);
  const actor=step?.type==='move'?(step.actor==='hero'?g.s.hero:sequence.actors.find(a=>a.id===step.actor)):null;
  if(previous!==sequence.step)moveStart=actor?{x:actor.x,y:actor.y}:null;
  const midMove=previous===sequence.step&&actor&&moveStart&&!movingRestores.has(sequence.step)&&distance(actor,moveStart)>18&&distance(actor,step)>15;
  const midTimed=['wait','pose'].includes(step?.type)&&!timed.has(sequence.step)&&sequence.elapsed>.1&&sequence.elapsed<(step.duration||.5)-.1;
  if(!seen.has(sequence.step)||midMove||midTimed){
   const before=snapshot(g),loaded=new GameEngine(restoreState(before));
   assert.equal(loaded.s.sequence?.step,sequence.step,id+' reload retains the current step');
   for(const actor of sequence.actors){const restored=loaded.s.sequence.actors.find(other=>other.id===actor.id);assert.ok(restored);for(const key of ['x','y','direction','pose','sprite','npcCell'])assert.equal(restored[key],actor[key]);assert.equal(!!restored.hidden,!!actor.hidden);}
   assert.deepEqual(loaded.s.sequence.cues,sequence.cues);
   assert.equal(loaded.s.sequence.elapsed,sequence.elapsed);assert.equal(loaded.s.hero.x,g.s.hero.x);assert.equal(loaded.s.hero.y,g.s.hero.y);
   assert.deepEqual(budget(loaded),baseline);assert.deepEqual(scores(loaded),score);assert.equal(loaded.scene.atmosphere.light,g.scene.atmosphere.light);
   if(!stageSaves.has(id))stageSaves.set(id,before);
   seen.add(sequence.step);visitedSteps.add(id+':'+sequence.step);if(midMove){movingRestores.add(sequence.step);midMoveRestores++;}if(midTimed){timed.add(sequence.step);timedRestores++;}
   g=loaded;restoredSteps++;assert.equal(g.travel('m51'),false);assert.equal(g.cast(0),false);assert.equal(g.choose(0),false);g.completeQuest();assert.equal(g.q.id,id);
  }
  previous=sequence.step;const active=g;g.onEvent=(type,data)=>{if(type==='stagingDialogue'){onDialogue(data.lines);active.advanceStaging();}};g.tick(.05);
 }
 assert.notEqual(g.s.phase,'staging',id+' finishes without a movement deadlock');assert.equal(g.s.sequence,null);assert.equal(g.s.flags['staged_'+id],true);
 assert.deepEqual(budget(g),baseline);assert.deepEqual(scores(g),score);return g;
}

assert.equal(freshState().campaignRevision,13);
for(const id of manorIds){const q=QUESTS[index(id)];assert.equal(q.xp,0);assert.equal(q.money,0);assert.ok(q.requireStaging);}
if(!migrationOnly){
let g=create('e09_report');const initial=lastingBudget(g);g.s.map='m41';g.s.visited=['m41'];
walk(g,'m49');assert.equal(g.travel('r_beimo_hero_room'),false,'the bedroom route opens after the report');
g=stage(g);assert.equal(g.q.id,'e09_first_wake');assert.equal(g.s.flags.evilManorReported,true);assert.equal(g.s.flags.evilManorNightStarted,true);assert.equal(g.s.flags.companion,null);
assert.equal(g.travel('m51'),false,'the active night closes outside travel');assert.deepEqual(walk(g,g.q.map),['m49','m50','r_beimo_hero_room']);assert.equal(g.companion,null,'Mei does not follow into the hero room');g=stage(g);assert.equal(g.s.flags.evilManorFirstWoke,true);assert.equal(g.q.id,'e09');
assert.deepEqual(walk(g,'m50'),['r_beimo_hero_room','m50']);g=stage(g);assert.equal(g.s.phase,'choice');assert.equal(g.q.id,'e09');assert.equal(g.scene.atmosphere.light,'night');
const decision=snapshot(g);
for(const answer of [0,1]){
 let current=new GameEngine(restoreState(decision));const prior=scores(current);assert.equal(current.choose(answer),true);
 assert.equal(current.s.choices.e09,answer);assert.equal(current.s.flags.evil,prior.evil+(answer===0?2:-1));assert.equal(current.s.affection.mei,prior.affection.mei+(answer===0?1:0));
 assert.equal(current.s.flags.evilMeiEscorted,answer===0);assert.equal(current.s.flags.evilMeiAlone,answer===1);assert.equal(current.s.flags.evilManorDecision,true);
 const committed=scores(current);current=reload(current);assert.deepEqual(scores(current),committed);assert.equal(current.choose(answer),false);
 if(answer===1){
  assert.equal(current.q.id,'e09_part');current=stage(current);assert.equal(current.s.flags.evilMeiParted,true);assert.equal(current.s.flags.companion,null);
  assert.equal(current.q.id,'e09_sleepless');assert.deepEqual(walk(current,current.q.map),['m50','r_beimo_hero_room']);assert.equal(current.companion,null);current=stage(current);assert.equal(current.s.flags.evilManorRestless,true);
  assert.equal(current.q.id,'e09_second_meeting');assert.deepEqual(walk(current,'m50'),['r_beimo_hero_room','m50']);current=stage(current);assert.equal(current.s.flags.evilMeiSecondMet,true);
 }else{for(const id of ['e09_part','e09_sleepless','e09_second_meeting'])assert.ok(!current.s.done.includes(id));}
 assert.equal(current.q.id,'e09_room_talk');assert.equal(current.s.flags.companion,'月眉儿');assert.deepEqual(walk(current,current.q.map),['m50','r_beimo_mei_room']);
 const heard=[];current=stage(current,()=>{},lines=>heard.push(...lines.map(line=>line[1])));
 const opposite=answer===0?'evilMeiAlone':'evilMeiEscorted',chosen=answer===0?'evilMeiEscorted':'evilMeiAlone';
 for(const step of STAGED_QUESTS.e09_room_talk.steps.filter(step=>step.type==='say'&&step.when))for(const line of step.lines){
  if(step.when.flag===opposite)assert.ok(!heard.includes(line[1]),'the other branch dialogue never executes');
  if(step.when.flag===chosen)assert.ok(heard.includes(line[1]),'the chosen room dialogue executes');
 }
 assert.ok(heard.length>0);assert.equal(current.s.flags.evilManorRoomTalk,true);assert.equal(current.q.id,'e09_morning');assert.deepEqual(walk(current,'m50'),['r_beimo_mei_room','m50']);assert.equal(current.scene.atmosphere.light,'night','entering the morning scene is still before its daybreak cue');
 let beforeDaybreak=false,afterDaybreak=false;current=stage(current,active=>{
  if(active.s.sequence.cues.manorDaybreak==='day'){afterDaybreak=true;assert.equal(active.scene.atmosphere.light,'day');}
  else{beforeDaybreak=true;assert.equal(active.scene.atmosphere.light,'night');}
 });
 assert.ok(beforeDaybreak&&afterDaybreak);assert.equal(current.q.id,'e10_teaching');assert.equal(current.s.flags.evilManorNightComplete,true);assert.equal(current.s.flags.evilMeiStaysAtManor,true);assert.equal(current.s.flags.companion,null);assert.equal(current.companion,null);assert.equal(current.scene.atmosphere.light,'day');
 assert.deepEqual(lastingBudget(current),initial);assert.deepEqual(scores(current),committed);current=reload(current);
 for(let repeat=0;repeat<3;repeat++){
  const residents=current.markers.filter(marker=>marker.name==='月眉儿');assert.equal(residents.length,1,'one ordinary Mei stays at the manor');const resident=residents[0];assert.equal(resident.main,false);assert.ok(resident.dialogue?.length);
  Object.assign(current.s.hero,{x:resident.x,y:resident.y});const before=copy(current.s),events=[];current.onEvent=(type,data)=>events.push({type,data});
  assert.equal(current.interact(resident),true);assert.deepEqual(current.s,before,'a resident conversation cannot advance, reward or change followers');
  assert.ok(events.length>0);assert.ok(!events.some(event=>['quest','choice','objective','interact'].includes(event.type)));current=reload(current);residentChecks++;
 }
 assert.deepEqual(walk(current,'m51'),['m50','m49','m51']);assert.equal(current.companion,null);assert.ok(!current.markers.some(marker=>marker.name==='月眉儿'),'resident does not travel to the next location');
 // Returning remains ordinary conversation before the rendezvous, then stops
 // when the later e10 scene takes ownership of Mei's whereabouts.
 walk(current,'m50');assert.equal(current.markers.filter(marker=>marker.name==='月眉儿').length,1);
 current.s.quest=index('e10');assert.ok(!current.markers.some(marker=>marker.name==='月眉儿'));
 branchCases++;
}

// Missing staging must be rejected before either choice effect is applied.
for(const flags of [{},{evilManorFirstWoke:true}]){
 const blocked=create('e09',flags);blocked.s.phase='choice';const before=copy(blocked.s);
 for(const answer of [0,1,0])assert.equal(blocked.choose(answer),false);assert.deepEqual(blocked.s,before);
}
for(const phase of ['choice','after']){
 const unanswered=create('e09',{evilManorFirstWoke:true,staged_e09:true});unanswered.s.phase=phase;
 const restored=reload(unanswered),before=copy(restored.s);restored.completeQuest();
 assert.deepEqual(restored.s,before,'an unanswered garden decision cannot be completed from a stale phase');
}
for(const staged of [false,true])for(const away of [false,true]){
 const unfinished=create('e09',{evilManorReported:true,evilManorNightStarted:true,evilManorFirstWoke:true,staged_e09:staged});
 unfinished.s.phase=away?'travel':'after';if(away){unfinished.s.map='m49';unfinished.s.objectiveProgress={questId:'e09',phase:'after',collectedIds:[]};}
 const restored=reload(unfinished),expected=staged?'choice':'talk';assert.deepEqual(scores(restored),scores(unfinished));assert.deepEqual(budget(restored),budget(unfinished));
 assert.equal(restored.s.phase,away?'travel':expected);if(away){assert.equal(restored.s.objectiveProgress.phase,expected);walk(restored,'m50');assert.equal(restored.s.phase,expected,'returning resumes the repaired choice/talk phase');}
 assert.ok(!Object.hasOwn(restored.s.choices,'e09'));assert.ok(!restored.s.done.includes('e09'));
}
for(const answer of [0,1]){
 const recorded=create('e09',{evilLegacyManorPrelude:true,evilManorDecision:true,evilMeiEscorted:answer===0,evilMeiAlone:answer===1});recorded.s.phase='choice';recorded.s.choices.e09=answer;
 const before=copy(recorded.s);assert.equal(recorded.choose(1-answer),false,'an already-recorded answer cannot be changed for more score');assert.deepEqual(recorded.s,before);
}
for(const flags of [{evilMeiEscorted:false,evilMeiAlone:true},{evilMeiEscorted:true,evilMeiAlone:true},{evilMeiEscorted:false,evilMeiAlone:false}]){
 const conflicted=create('e09',{evilLegacyManorPrelude:true,evilManorDecision:true,...flags});conflicted.s.phase='after';conflicted.s.choices.e09=0;
 const before=copy(conflicted.s);conflicted.completeQuest();assert.deepEqual(conflicted.s,before,'a contradictory current answer cannot advance into a guessed branch');
}
const done=create('e09',{evilLegacyManorPrelude:true});done.s.phase='choice';done.s.choices.e09=0;done.s.done.push('e09');done.s.claimedRewards.push('e09');
const finished=copy(done.s);assert.equal(done.choose(1),false);assert.deepEqual(done.s,finished);
for(const id of ['e09_room_talk','e09_morning']){
 const blocked=create(id);blocked.beginObjective();blocked.completeQuest();assert.equal(blocked.s.sequence,null);assert.equal(blocked.q.id,id);
}
for(const both of [false,true]){
 const blocked=create('e09_room_talk',{evilManorDecision:true,evilMeiEscorted:both,evilMeiAlone:both,evilMeiSecondMet:true});blocked.beginObjective();assert.equal(blocked.s.sequence,null,'room branch must be exclusive');
}
// A saved animation belongs to its task, location and earned preconditions.
for(const [id,raw] of stageSaves){
 for(const mutate of [saved=>{saved.sequence.questId='foreign-quest';},saved=>{saved.flags={route:'evil'};},saved=>{saved.map='m51';}]){
  const invalid=copy(raw);mutate(invalid);
  const restored=new GameEngine(restoreState(invalid));assert.equal(restored.s.sequence,null,id+' rejects foreign or unearned staging');assert.ok(!restored.s.flags['staged_'+id]);
 }
}

}

// Migration checks follow below: all old numerical tables and stable IDs use
// the same history contract, without claiming newly introduced scenes played.

const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS];
let legacyCases=0;
function legacy(id,revision,numeric,{choice,phase='choice',completed=false,flags={}}={}){
 const g=create(id,flags);g.s.map=id==='e09'?'m49':QUESTS[index(id)].map;g.s.phase=phase;
 Object.assign(g.s.hero,{x:730,y:670});g.s.done=completed?['e08','e09']:['e08'];g.s.claimedRewards=[...g.s.done];g.s.visited=[g.s.map];
 if(choice!==undefined)g.s.choices.e09=choice;
 if(id==='e10')g.s.skills[8]=17;
 const raw=snapshot(g);raw.campaignRevision=revision;
 if(numeric){delete raw.questId;raw.quest=oldTables[revision-1].indexOf(id);assert.ok(raw.quest>=0,id+' existed in revision '+revision);}
 else raw.quest=0; // The stable quest identity must win over a conflicting index.
 return raw;
}
function preserved(restored,raw){
 // Resource comparisons do not resolve a historical numerical quest index.
 assert.deepEqual(budget(restored),budget({s:raw}));assert.deepEqual(scores(restored),scores({s:raw}));
 assert.deepEqual(restored.s.done,raw.done);assert.deepEqual(restored.s.claimedRewards,raw.claimedRewards||raw.done);
 assert.equal(restored.s.campaignRevision,13);
 for(const id of addedIds){assert.ok(!restored.s.done.includes(id));assert.ok(!restored.s.claimedRewards.includes(id));assert.ok(!restored.s.flags['staged_'+id]);}
 assert.equal(restored.s.sequence,null);assert.equal(restored.s.skirmish,null);
 const again=reload(restored);assert.deepEqual(budget(again),budget(restored));assert.deepEqual(scores(again),scores(restored));assert.equal(again.q.id,restored.q.id);assert.deepEqual(again.s.done,restored.s.done);
 legacyCases++;
}
for(let revision=1;revision<=8;revision++)for(const numeric of [false,true]){
 // No committed choice: only the already-narrated report/plan is legacy.
 const pending=legacy('e09',revision,numeric),ready=new GameEngine(restoreState(pending));preserved(ready,pending);
 assert.equal(ready.q.id,'e09');assert.equal(ready.s.map,'m50');assert.equal(ready.s.phase,'choice');assert.equal(ready.s.flags.evilLegacyManorPrelude,true);
 assert.ok(!Object.hasOwn(ready.s.choices,'e09'));assert.ok(!ready.s.flags.evilLegacyManorNight);assert.ok(!ready.s.flags.staged_e09);
 assert.ok(!ready.s.flags.evilManorReported&&!ready.s.flags.evilManorFirstWoke,'historical prelude is not new played flags');
 const oldPoint=Object.entries(ready.s.flags).filter(([key])=>key.startsWith('evilLegacyManor'));
 assert.ok(oldPoint.some(([,value])=>value==='m49'),'legacy point records the original map');
 assert.ok(oldPoint.some(([,value])=>value===730)&&oldPoint.some(([,value])=>value===670),'legacy point records original coordinates');
 assert.ok(!ready.s.visited.includes('r_beimo_hero_room')&&!ready.s.visited.includes('r_beimo_mei_room'));
 for(const choice of [0,1]){
  const raw=legacy('e09',revision,numeric,{choice}),partial=new GameEngine(restoreState(raw));preserved(partial,raw);
  assert.equal(partial.q.id,choice===0?'e09_room_talk':'e09_part');assert.equal(partial.s.choices.e09,choice);
  assert.equal(partial.s.flags.evilManorDecision,true);assert.equal(partial.s.flags.evilMeiEscorted,choice===0);assert.equal(partial.s.flags.evilMeiAlone,choice===1);
  assert.ok(!partial.s.flags.evilLegacyManorNight);assert.ok(!partial.s.done.includes('e09'));assert.equal(partial.choose(choice),false);
 }
 for(const choice of [undefined,0,1]){
  const raw=legacy('e09',revision,numeric,{choice,completed:true}),passed=new GameEngine(restoreState(raw));preserved(passed,raw);
  assert.equal(passed.q.id,'e10_teaching');assert.equal(passed.s.map,'m49');assert.equal(passed.s.hero.x,730);assert.equal(passed.s.hero.y,670);
  assert.equal(passed.s.flags.evilLegacyManorNight,true);assert.equal(passed.s.flags.companion,null);assert.equal(passed.companion,null);
  assert.ok(!passed.s.flags.evilManorNightComplete&&!passed.s.flags.staged_e09_morning);
 }
 for(const id of ['e10','e11','e12']){
  const raw=legacy(id,revision,numeric,{choice:0,completed:true}),passed=new GameEngine(restoreState(raw));preserved(passed,raw);
  assert.equal(passed.q.id,id);assert.equal(passed.s.map,raw.map);assert.equal(passed.s.flags.evilLegacyManorNight,true);
  assert.equal(passed.s.flags.companion,raw.flags.companion,'later rendezvous state is not globally cleared');
 }
 if(oldTables[revision-1].includes('e10_teaching')){
  const raw=legacy('e10_teaching',revision,numeric,{completed:true}),passed=new GameEngine(restoreState(raw));preserved(passed,raw);
  assert.equal(passed.q.id,'e10_teaching');assert.equal(passed.s.map,raw.map);assert.equal(passed.s.flags.companion,null);
 }
}
// A legacy e09 cursor still travelling or awaiting its first conversation has
// not narrated the manor report or garden encounter. Only a saved choice phase
// (including its away-from-map objective progress) earns the prelude history.
for(const phase of ['talk','travel']){
 const raw=legacy('e09',8,false,{phase});if(phase==='travel')raw.map='m41';
 const restored=new GameEngine(restoreState(raw));preserved(restored,raw);
 assert.equal(restored.q.id,'e09_report');assert.equal(restored.s.map,raw.map);assert.ok(!restored.s.flags.evilLegacyManorPrelude);
}
const awayChoice=legacy('e09',8,false,{phase:'travel'});awayChoice.map='m41';awayChoice.objectiveProgress={questId:'e09',phase:'choice',collectedIds:[]};
const pendingAway=new GameEngine(restoreState(awayChoice));preserved(pendingAway,awayChoice);assert.equal(pendingAway.q.id,'e09');assert.equal(pendingAway.s.map,'m50');assert.equal(pendingAway.s.phase,'choice');assert.equal(pendingAway.s.flags.evilLegacyManorPrelude,true);
const finishedDock=legacy('e08',7,false,{phase:'after'});finishedDock.done=['e07','e08'];finishedDock.claimedRewards=[...finishedDock.done];finishedDock.map='m41';
const reportFromDock=new GameEngine(restoreState(finishedDock));preserved(reportFromDock,finishedDock);assert.equal(reportFromDock.q.id,'e09_report');assert.equal(reportFromDock.s.map,'m41');assert.ok(!reportFromDock.s.flags.evilLegacyManorPrelude&&!reportFromDock.s.flags.evilLegacyManorNight);
// Invalid raw values must not become choice 0 through clamping. An unknown
// after-state already includes the compressed night and cannot ask again.
for(const choice of [-1,2,99,'0',null])for(const phase of ['choice','after']){
 const raw=legacy('e09',8,false,{choice,phase}),restored=new GameEngine(restoreState(raw));preserved(restored,raw);
 assert.ok(![0,1].includes(restored.s.choices.e09),'invalid raw choices are never fabricated as valid answers');
 assert.equal(restored.q.id,'e10_teaching','an invalid recorded answer is neutral history, never a chance to score a second answer');
 assert.equal(restored.s.flags.evilLegacyManorNight,true);
 assert.ok(!restored.s.flags.evilMeiEscorted&&!restored.s.flags.evilMeiAlone,'unknown history has no invented branch');
}
for(const choice of [0,1])for(const completed of [false,true]){
 const flags={evilMeiEscorted:choice===1,evilMeiAlone:choice===0};
 const raw=legacy('e09',8,false,{choice,completed,flags}),restored=new GameEngine(restoreState(raw));preserved(restored,raw);
 assert.equal(restored.q.id,'e10_teaching');assert.equal(restored.s.flags.evilLegacyManorNight,true);
 assert.ok(!restored.s.flags.evilMeiEscorted&&!restored.s.flags.evilMeiAlone);assert.equal(restored.s.flags.companion,null);
}
const bothRaw=legacy('e09',8,false,{choice:0,flags:{evilMeiEscorted:true,evilMeiAlone:true}}),both=new GameEngine(restoreState(bothRaw));preserved(both,bothRaw);
assert.equal(both.q.id,'e10_teaching');assert.ok(!both.s.flags.evilMeiEscorted&&!both.s.flags.evilMeiAlone);
// Older e10 saves missing the previously added teaching are repaired to that
// task, while still remembering that the compressed manor night is over.
const missingTeaching=legacy('e10',1,true,{completed:true});delete missingTeaching.skills[8];
const repaired=new GameEngine(restoreState(missingTeaching));preserved(repaired,missingTeaching);assert.equal(repaired.q.id,'e10_teaching');assert.equal(repaired.s.flags.evilLegacyManorNight,true);assert.equal(repaired.s.flags.companion,null);
// Saves predating the reward ledger retain credit for their actual historical
// tasks only. A retained later companion must also survive this migration.
const ledgerless=legacy('e09',1,false,{completed:true});delete ledgerless.campaignRevision;delete ledgerless.claimedRewards;
const withoutLedger=new GameEngine(restoreState(ledgerless));preserved(withoutLedger,ledgerless);assert.equal(withoutLedger.q.id,'e10_teaching');assert.deepEqual(withoutLedger.s.claimedRewards,['e08','e09']);
const laterFollower=legacy('e12',8,false,{completed:true,flags:{companion:'纳兰真'}}),following=new GameEngine(restoreState(laterFollower));preserved(following,laterFollower);assert.equal(following.s.flags.companion,'纳兰真');
// Labelled old-night history exposes the same ordinary resident without
// pretending the newly authored morning scene ran.
const oldResidence=legacy('e09',8,false,{completed:true});oldResidence.map='m50';
const historicResident=new GameEngine(restoreState(oldResidence));preserved(historicResident,oldResidence);
assert.ok(!historicResident.s.flags.staged_e09_morning);assert.equal(historicResident.s.flags.evilLegacyManorNight,true);
const oldMei=historicResident.markers.filter(marker=>marker.name==='月眉儿');assert.equal(oldMei.length,1);assert.ok(oldMei[0].dialogue?.length);assert.equal(oldMei[0].main,false);
Object.assign(historicResident.s.hero,{x:oldMei[0].x,y:oldMei[0].y});const historyBefore=copy(historicResident.s);assert.equal(historicResident.interact(oldMei[0]),true);assert.deepEqual(historicResident.s,historyBefore);
// Good-route saves and unrelated earlier evil events do not acquire this history.
for(const id of ['e08','g15']){
 const raw=legacy(id,8,false);if(id==='g15')raw.flags.route='good';
 const unchanged=new GameEngine(restoreState(raw));assert.ok(!unchanged.s.flags.evilLegacyManorPrelude&&!unchanged.s.flags.evilLegacyManorNight);
}
assert.throws(()=>restoreState({...freshState(),version:1}));
if(!migrationOnly){assert.ok(restoredSteps>40);assert.ok(midMoveRestores>0);assert.ok(timedRestores>0);assert.equal(branchCases,2);assert.equal(residentChecks,6);}
console.log(JSON.stringify({result:'PASS',mode:migrationOnly?'migration-only':'full',restoredSteps,midMoveRestores,timedRestores,branchCases,residentChecks,legacyCases,checks:migrationOnly?'revision 1–8 history, exact balances, committed/unknown choices, old ID/numeric compatibility':'physical manor itinerary, two exclusive nights, exact staged restore, daybreak cue, no duplicate scores/rewards, ordinary resident dialogue, revision 1–8 history'}));
