import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import * as campaign from '../public/campaign.mjs';

// Independently authored state checks, with real route walking and production
// staging. This is not original-game playback or a visual browser acceptance.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert.ok(n>=0,id+' exists');return n;};
const ids=['e04_homecoming','e04_quarrel','e04_wait','e04_report'];
const milestones=['evilHutHomecoming','evilHutQiangweiLeft','evilHutReturnMorning','evilHutReportHeard'];
const maps=['m49','r_beimo_rose_room','r_beimo_hero_room','m49'];
const snapshot=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const resources=g=>copy({coins:g.s.coins,kills:g.s.kills,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,skills:g.s.skills,equipment:g.s.equipment,hotbar:g.s.hotbar,hero:Object.fromEntries(['hp','maxHp','mp','maxMp','stamina','exp','level'].map(key=>[key,g.s.hero[key]])),evil:g.s.flags.evil,moral:g.s.flags.moral,affection:g.s.affection});
const noTravelRecovery=g=>{const value=resources(g);delete value.hero.mp;delete value.hero.stamina;return value;};
const visible=g=>[...g.markers.filter(actor=>actor.sprite!=null&&!actor.hidden),...g.companions];
function create(id=ids[0],flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.visited=[s.map];
 Object.assign(s.flags,{route:'evil',evil:7,moral:2,shield:0,companion:'纳兰真',...flags});Object.assign(s.hero,{hp:137,mp:180,stamina:100,exp:23});s.coins=317;s.inventory={wood_box:1};s.affection={zhen:3,zi:2,mei:4,wei:1};
 const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
function ready(id){const n=ids.indexOf(id);return n===0?{evilHutNightComplete:true}:{[milestones[n-1]]:true};}
let branchCases=0,restoredSteps=0,midMoveRestores=0,timedRestores=0,travelRestores=0,invalidSaves=0,legacyCases=0;
const stageSaves=new Map(),walkPaths=[];
function walk(game,to){
 let g=game;if(g.s.map===to)return g;const path=[g.s.map],restoredMaps=new Set(),baseline=noTravelRecovery(g);let entrance=copy(g.s.hero);
 assert.equal(g.travel(to),true,'real route to '+to+' is available');
 for(let tick=0;tick<20000&&g.s.map!==to;tick++){
  const from=g.s.map,neighbors=g.exits().filter(edge=>!edge.locked).map(edge=>edge.to),before=copy(g.s.hero);g.tick(.05);
  if(g.s.map!==from){assert.ok(neighbors.includes(g.s.map),'crossing uses an actual adjacent exit');path.push(g.s.map);entrance=copy(g.s.hero);}
  else assert.ok(g.clearSegment(before,g.s.hero),'walking never crosses the scene collision mask');
  assert.deepEqual(noTravelRecovery(g),baseline,'walking cannot grant chapter rewards');
  if(g.s.map!==to&&!restoredMaps.has(g.s.map)&&distance(g.s.hero,entrance)>35){const raw=snapshot(g),loaded=reload(g);assert.equal(loaded.s.map,g.s.map);assert.equal(loaded.q.id,g.q.id);assert.deepEqual(loaded.s.visited,g.s.visited);assert.deepEqual(loaded.s.objectiveProgress,g.s.objectiveProgress);assert.deepEqual(resources(loaded),resources(g));assert.equal(loaded.s.hero.x,raw.hero.x);assert.equal(loaded.s.hero.y,raw.hero.y);restoredMaps.add(g.s.map);g=loaded;travelRestores++;}
 }
 assert.equal(g.s.map,to,'walk reaches '+to);walkPaths.push(path);return g;
}
function stage(game){
 let g=game;const id=g.q.id,definition=STAGED_QUESTS[id],baseline=resources(g),choices=copy(g.s.choices),map=g.s.map,visited=copy(g.s.visited),companion=g.s.flags.companion,trace=[];
 g.completeQuest();assert.equal(g.q.id,id,'required staging cannot be bypassed');g.beginObjective();assert.equal(g.s.phase,'staging');
 const seen=new Set(),moving=new Set(),timed=new Set();let previous=-1,moveStart=null;
 for(let tick=0;tick<16000&&g.s.sequence;tick++){
  const sequence=g.s.sequence,step=definition.steps[sequence.step];assert.equal(sequence.sceneKey,null,'return scenes remain on the real world map');assert.equal(g.s.map,map);assert.deepEqual(g.s.visited,visited);assert.deepEqual(resources(g),baseline);assert.deepEqual(g.s.choices,choices);assert.equal(g.s.flags.companion,companion);assert.equal(g.s.enemies.length,0);assert.equal(g.s.allies.length,0);assert.equal(g.s.skirmish,null);assert.equal(g.s.failure,null);assert.equal(g.s.completed,false);assert.deepEqual(g.companions,[],'staged visitors cannot turn into following duplicates');
  for(const actor of g.stagingActors())assert.ok(g.passable(actor.x,actor.y),id+' '+actor.name+' stands on traversable ground');
  for(const name of ['蔷薇','纳兰真','铁云'])assert.ok(visible(g).filter(actor=>actor.name===name).length<=1,name+' appears at most once');
  assert.ok(!sequence.actors.some(actor=>actor.pose==='fallen'),'quarrel and message do not invent a death');
  trace.push({step:sequence.step,action:step?.type,actor:step?.actor,focus:step?.focus,hero:copy(g.s.hero),actors:copy(sequence.actors),visible:g.stagingActors().map(actor=>actor.name),cues:copy(sequence.cues),light:g.scene.atmosphere.light});
  const actor=step?.type==='move'?(step.actor==='hero'?g.s.hero:sequence.actors.find(other=>other.id===step.actor)):null;
  if(previous!==sequence.step)moveStart=actor?copy(actor):null;
  const midMove=previous===sequence.step&&actor&&moveStart&&!moving.has(sequence.step)&&distance(actor,moveStart)>18&&distance(actor,step)>15;
  const midTimed=['wait','pose'].includes(step?.type)&&!timed.has(sequence.step)&&sequence.elapsed>.1&&sequence.elapsed<(step.duration||.5)-.1;
  if(!seen.has(sequence.step)||midMove||midTimed){
   const raw=snapshot(g),loaded=reload(g);assert.equal(loaded.s.sequence?.step,sequence.step);assert.equal(loaded.s.sequence.elapsed,sequence.elapsed);assert.deepEqual(loaded.s.sequence.cues,sequence.cues);assert.equal(loaded.s.sequence.sceneKey,null);assert.equal(loaded.s.sequence.heroPose,sequence.heroPose);assert.equal(loaded.s.hero.x,g.s.hero.x);assert.equal(loaded.s.hero.y,g.s.hero.y);assert.equal(loaded.scene.atmosphere.light,g.scene.atmosphere.light);assert.deepEqual(resources(loaded),baseline);assert.deepEqual(loaded.s.choices,choices);
   for(const before of sequence.actors){const after=loaded.s.sequence.actors.find(other=>other.id===before.id);assert.ok(after);for(const key of ['x','y','pose','direction','sprite','npcCell'])assert.equal(after[key],before[key]);assert.equal(!!after.hidden,!!before.hidden);}
   seen.add(sequence.step);if(midMove){moving.add(sequence.step);midMoveRestores++;}if(midTimed){timed.add(sequence.step);timedRestores++;}if(!stageSaves.has(id))stageSaves.set(id,raw);g=loaded;restoredSteps++;
   assert.equal(g.travel('m71'),false);assert.equal(g.cast(0),false);assert.equal(g.choose(0),false);g.completeQuest();assert.equal(g.q.id,id);
  }
  previous=sequence.step;const active=g;g.onEvent=type=>{if(type==='stagingDialogue')active.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' releases');assert.notEqual(g.q.id,id);assert.equal(g.s.flags['staged_'+id],true);assert.equal(g.s.flags[milestones[ids.indexOf(id)]],true);assert.deepEqual(resources(g),baseline);assert.deepEqual(g.s.choices,choices);assert.equal(g.s.map,map);assert.deepEqual(g.s.visited,visited);return {game:g,trace};
}
function reject(g){const before=snapshot(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,before.questId);assert.equal(g.s.sequence,null);assert.deepEqual(resources(g),resources({s:before}));assert.deepEqual(g.s.done,before.done);assert.deepEqual(g.s.claimedRewards,before.claimedRewards);}
assert.equal(freshState().campaignRevision,12);
for(const [n,id] of ids.entries()){
 const q=QUESTS[index(id)];assert.equal(q.map,maps[n]);assert.equal(q.when.route,'evil');assert.equal(q.requireStaging,true);assert.equal(q.hideCompanion,true);assert.equal(q.xp,0);assert.equal(q.money,0);assert.ok(STAGED_QUESTS[id]);assert.ok(!q.choice&&!q.skirmish&&!q.battleBeforeChoice);assert.deepEqual(Object.keys(q.rewards||{}).sort(),id==='e04_report'?['companion','flags']:['flags']);assert.deepEqual(q.rewards.flags,{[milestones[n]]:true});
}
assert.ok(index(ids[0])>index('e04_dream'));assert.equal(index('e05'),index(ids[3])+1);
const offer=QUESTS[index('e05')];assert.equal(offer.forcedOutcome,'defeat');assert.equal(offer.battleBeforeChoice,true);assert.deepEqual(offer.refusalRule,{limit:3,outcome:'fatal',key:'e05',refuseIndex:1});
assert.deepEqual(offer.requiredAnyFlags,[['evilHutNightComplete','evilLegacyHutNight'],['evilHutReportHeard','evilLegacyHutReport']]);
if(!process.argv.includes('--migration-only')){
 for(const answer of [0,1]){
  let g=create(ids[0],{evilHutNightComplete:true,evilHutDecision:true,evilHutForgiven:answer===0,evilHutRefused:answer===1});g.s.choices.e04=answer;g.s.done=['e04','e04_departure','e04_dream'];g.s.claimedRewards=[...g.s.done];g.s.map='m16';g.s.phase='travel';g.s.visited=['m16'];Object.assign(g.s.hero,g.scene.spawn);
  const baseline=noTravelRecovery(g),choice=copy(g.s.choices),beforeFlags=copy(g.s.flags);g=walk(g,'m49');
  for(const [n,id] of ids.entries()){
   assert.equal(g.q.id,id);g=walk(g,QUESTS[index(id)].map);const result=stage(g);g=result.game;
   assert.deepEqual(noTravelRecovery(g),baseline);assert.deepEqual(g.s.choices,choice);assert.equal(g.s.flags.evilHutForgiven,answer===0);assert.equal(g.s.flags.evilHutRefused,answer===1);
   assert.equal(g.s.flags[milestones[n]],true);for(const future of milestones.slice(n+1))assert.ok(!g.s.flags[future],'future milestones wait for their own event');
   if(id==='e04_quarrel'){
    const frames=result.trace,shown=frames.findIndex(f=>f.visible.includes('蔷薇')),gone=frames.findIndex((f,i)=>i>shown&&!f.visible.includes('蔷薇'));assert.ok(shown>=0&&gone>shown,'Qiangwei leaves visibly before removal');const rose=frames[shown].actors.find(a=>a.name==='蔷薇');assert.ok(frames.slice(shown+1,gone).some(f=>distance(f.actors.find(a=>a.name==='蔷薇'),rose)>30));assert.ok(!g.s.flags.evilQiangweiDead&&!g.s.flags.evilQiangweiDecision);
   }
   if(id==='e04_wait'){
    const frames=result.trace,night=frames.findIndex(f=>f.cues.hutReturnTime==='night'),morning=frames.findIndex(f=>f.cues.hutReturnTime==='morning');assert.ok(night>=0&&morning>night,'one actual overnight transition precedes morning');assert.equal(frames[night].light,'night');assert.equal(frames[morning].light,'day');assert.ok(frames.slice(night,morning+1).some(f=>f.cues.dreamFade==='out'),'overnight has an authored fade');
   }
   if(id==='e04_report'){
    const frames=result.trace,shown=frames.findIndex(f=>f.visible.includes('纳兰真')),gone=frames.findIndex((f,i)=>i>shown&&!f.visible.includes('纳兰真'));assert.ok(shown>=0&&gone>shown,'Zhen arrives to report and then leaves');const zhen=frames[shown].actors.find(a=>a.name==='纳兰真');assert.ok(frames.slice(shown+1,gone).some(f=>distance(f.actors.find(a=>a.name==='纳兰真'),zhen)>30));const tieGone=frames.findIndex(f=>!f.visible.includes('铁云')),tieReturned=frames.findIndex((f,i)=>i>tieGone&&f.visible.includes('铁云')),tieGoneAgain=frames.findIndex((f,i)=>i>tieReturned&&!f.visible.includes('铁云'));assert.ok(tieGone>=0&&tieReturned>tieGone&&tieGoneAgain>tieReturned&&shown>tieGoneAgain,'Tieyun leaves, returns to announce the visitor, and withdraws before Zhen arrives');assert.equal(g.s.flags.companion,null);assert.deepEqual(g.partyNames,[]);assert.ok(!visible(g).some(a=>a.name==='纳兰真'));
   }
  }
  assert.equal(g.q.id,'e05');assert.ok(!g.s.flags.cultPath&&!g.s.flags.evilQiangweiDead);const changed=Object.keys(g.s.flags).filter(key=>g.s.flags[key]!==beforeFlags[key]);assert.ok(changed.every(key=>key==='companion'||milestones.includes(key)||ids.some(id=>key==='staged_'+id)),'return chapter cannot invent a marriage, death or unrelated branch: '+changed.join(','));
  g=walk(g,'r_beimo_rose_room');assert.ok(!visible(g).some(a=>a.name==='蔷薇'),'revisiting the empty room does not resurrect Qiangwei');const beforeVisit=snapshot(g);g.beginObjective();g.completeQuest();g=reload(g);assert.equal(g.q.id,'e05');assert.deepEqual(g.s.done,beforeVisit.done);assert.deepEqual(resources(g),resources({s:beforeVisit}));assert.ok(!visible(g).some(a=>a.name==='蔷薇'));
  g=walk(g,'m71');assert.equal(g.requireQuestFlags(),true);for(const id of ids){const replay=reload(g);replay.s.quest=index(id);replay.s.map=replay.q.map;replay.s.phase='talk';const before=resources(replay);replay.completeQuest();assert.equal(replay.canStartStaging(),false);assert.deepEqual(resources(replay),before);assert.equal(replay.s.done.filter(done=>done===id).length,1);}branchCases++;
 }
 // Route and predecessor checks are equally strict when restoring a sequence.
 for(const id of ids){
  for(const flags of [{},{...ready(id),route:'good'},{evilHutReportHeard:true}])reject(create(id,flags));
  const away=create(id,ready(id));away.s.map=away.q.map==='m49'?'m16':'m49';away.s.phase='travel';reject(away);
  const valid=stageSaves.get(id);assert.ok(valid);for(const alter of [raw=>{raw.flags.route='good';},raw=>{for(const key of Object.keys(ready(id)))delete raw.flags[key];},raw=>{raw.sequence.questId='e09';},raw=>{raw.sequence.sceneKey='towerFirstInterlude';},raw=>{raw.map=raw.map==='m49'?'m16':'m49';}]){
   const raw=copy(valid);alter(raw);const bad=new GameEngine(restoreState(raw));assert.equal(bad.s.sequence,null);assert.ok(!bad.s.flags['staged_'+id]);assert.deepEqual(resources(bad),resources({s:raw}));assert.ok(!bad.s.done.includes(id));invalidSaves++;
  }
 }
 for(const first of ['evilHutNightComplete','evilLegacyHutNight'])for(const second of ['evilHutReportHeard','evilLegacyHutReport'])assert.equal(create('e05',{[first]:true,[second]:true}).requireQuestFlags(),true);
 for(const flags of [{},{evilHutNightComplete:true},{evilHutReportHeard:true},{evilLegacyHutReport:true},{evilHutNightComplete:true,evilHutReportHeard:true,route:'good'}])reject(create('e05',flags));
 const repeated=create('e05',{evilHutNightComplete:true,evilHutReportHeard:true});repeated.s.phase='choice';for(let count=1;count<=3;count++){assert.equal(repeated.choose(1),true);assert.equal(repeated.refusalCount(),count);}assert.equal(repeated.s.phase,'failed');let failed=reload(repeated);assert.equal(failed.s.hero.hp,0);assert.equal(failed.refusalCount(),3);assert.equal(failed.retryRefusal(),true);assert.equal(failed.refusalCount(),2);assert.equal(failed.choose(0),true);assert.equal(failed.q.id,'e06');assert.equal(failed.s.flags.evilHutReportHeard,true);
}

// Captured before revision twelve: independent of the newly inserted product.
const revisionEleven=[["a01",1],["a02",1],["a03",1],["a04",1],["a05",1],["a06",1],["a07",1],["a08",1],["a09",1],["a10",2],["a11",2],["a12",2],["a13",2],["a14",2],["a15",2],["a16",2],["a17",2],["a18",2],["a19",3],["a20",3],["a21",3],["a22",3],["a23",3],["a24",3],["a25",3],["a26",3],["a27",3],["a28",4],["a29",4],["a30",4],["a31",4],["a32",4],["a33",4],["a34",4],["a35",4],["a36",4],["a37",5],["a38",5],["a39",5],["a40",5],["a41",5],["a42",5],["a43",5],["a44",5],["a45",5],["a46",6],["a47",6],["a48",6],["a49",6],["a50",6],["a51",6],["a52",6],["a53",6],["a54",6],["a55",7],["a56",7],["a57",7],["a58",7],["a59",7],["a60",7],["a61",7],["a62",7],["a63_trial",7],["a63_zi",8],["a63",8],["a64",8],["a65",8],["a66",8],["a67",8],["a68",8],["b01",8],["b02",8],["b02_ambush",9],["b03",9],["b04",9],["b05",9],["b06",9],["b07",9],["g01",9],["g02",9],["g03",9],["g03_return",10],["g03_invitation",10],["g04",10],["g05",10],["g06",10],["g06_confide",10],["g06_inquire",10],["g06_request",10],["g06_return",10],["g06_introduce",11],["g06_rest",11],["g07",10],["g07_dawn",11],["g07_visit",11],["g07_zhen",11],["g07_apology",11],["g07_mainland",11],["g07_island",11],["g07_settle",12],["g08",10],["g08_deliver",10],["g09",10],["g10",11],["g11",11],["g12",11],["g13",11],["g14",11],["g15",11],["gCult_wudang",11],["gCult_appointment",11],["gCult_qiangwei",11],["gCult_zixuan",12],["gCult_farewell",12],["gCult_epilogue",12],["g16",12],["g17",12],["g18",12],["gTower1",12],["gTower2",12],["gTower3",12],["gTower4",13],["gTower5",13],["gTower6",13],["gTower7",13],["gTower8",13],["g19",13],["g20",13],["g21",13],["g22",13],["g23",14],["g24",14],["gBad1",14],["gBad2",14],["e01",14],["e02",14],["e03_masked_duel",14],["e03",14],["e04",14],["e04_departure",16],["e04_dream",16],["e05",15],["e06",15],["e06_kill",15],["e06_refuse",15],["e06_aftermath",15],["e06_night",15],["e06_night_visit",15],["e06_escort",15],["e06_ferry",15],["e06_landing",16],["e06_first_interlude",17],["e06_rest",16],["e07_village",16],["e07_approach",16],["e07_entry",16],["e07_first",16],["e07_second",16],["e07_gate",16],["e07",16],["e08_interlude",17],["e08_island_battle",17],["e08_departure",17],["e08",17],["e08_refuse",17],["e08_kill",17],["e09_report",17],["e09_first_wake",17],["e09",17],["e09_part",18],["e09_sleepless",18],["e09_second_meeting",18],["e09_room_talk",18],["e09_morning",18],["e10_teaching",18],["e10",18],["e11",18],["e12",18],["eTower1",19],["eSwitch1",19],["eTower2",19],["eSwitch2",19],["eTower3",19],["eSwitch3",19],["eTower4",19],["eSwitch4",19],["eTower5",19],["eSwitch5",20],["eTower6",20],["eSwitch6",20],["eTower7",20],["eSwitch7",20],["eTower8",20],["eSwitch8",20],["e13",20],["e14",20]];
assert.equal(revisionEleven.length,196);assert.deepEqual(campaign.REVISION_ELEVEN_QUEST_IDS,revisionEleven.map(([id])=>id));
for(const [id,tier] of revisionEleven)assert.equal(QUESTS[index(id)].encounterTier??Math.max(1,Math.floor(index(id)/9)+1),tier,id+' retains its pre-insertion encounter tier');
const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS,campaign.REVISION_NINE_QUEST_IDS,campaign.REVISION_TEN_QUEST_IDS,revisionEleven.map(([id])=>id)];
function legacy(revision,numeric,{id='e05',phase='talk',away=false,done=false,claimed=false,count=0}={}){
 const raw=snapshot(create(id,{evilHutNightComplete:true}));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf(id);assert.ok(raw.quest>=0);if(numeric)delete raw.questId;raw.phase=phase;raw.flags.refusal_e05=count;raw.flags.refusal_e07=1;raw.flags.evil=13;raw.hero.mp=63;raw.hero.stamina=41;
 if(count)raw.choices.e05=1;if(done)raw.done=['e05'];if(done||claimed)raw.claimedRewards=['e05'];if(phase==='failed'){raw.hero.hp=0;raw.failure={kind:'refusal',questId:'e05',hpBefore:137};}
 if(away){raw.map='m49';raw.phase='travel';raw.objectiveProgress={questId:id,phase,collectedIds:[]};raw.visited.push('m49');}
 return raw;
}
function preserved(g,raw){
 assert.deepEqual(resources(g),resources({s:raw}));assert.equal(g.s.map,raw.map);assert.equal(g.s.hero.x,raw.hero.x);assert.equal(g.s.hero.y,raw.hero.y);assert.deepEqual(g.s.done,raw.done);assert.deepEqual(g.s.claimedRewards,raw.claimedRewards);assert.deepEqual(g.s.choices,raw.choices);assert.equal(g.s.flags.refusal_e05,raw.flags.refusal_e05);assert.equal(g.s.flags.refusal_e07,raw.flags.refusal_e07);
 for(const id of ids){assert.ok(!g.s.done.includes(id));assert.ok(!g.s.claimedRewards.includes(id));assert.ok(!g.s.flags['staged_'+id]);}for(const key of milestones)assert.ok(!g.s.flags[key]);legacyCases++;
}
for(let revision=1;revision<=11;revision++)for(const numeric of [false,true]){
 for(const away of [false,true]){
  const raw=legacy(revision,numeric,{away}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,ids[0]);assert.equal(g.s.phase,raw.map==='m49'?'talk':'travel');assert.ok(!g.s.flags.evilLegacyHutReport);assert.equal(g.s.objectiveProgress,null);assert.equal(g.s.sequence,null);
 }
 for(const phase of ['battle','choice','failed','after'])for(const away of [false,true]){
  const raw=legacy(revision,numeric,{phase,away,count:phase==='failed'?3:phase==='choice'?2:0}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e05');assert.equal(g.s.flags.evilLegacyHutReport,true);
  if(phase==='failed'){assert.equal(g.s.phase,'failed');assert.equal(g.s.failure.questId,'e05');assert.equal(g.s.hero.hp,0);assert.equal(g.paused,true);assert.equal(g.choose(0),false);assert.equal(g.retryRefusal(),true);assert.equal(g.refusalCount(),2);}
  else if(phase==='choice'||phase==='after')assert.equal(away?g.s.objectiveProgress.phase:g.s.phase,'choice','already defeated save resumes at the offer');
 }
 for(const id of ['e05','e06','e11']){
  const raw=legacy(revision,numeric,{id,done:true,phase:'talk',count:2});raw.choices.e05=0;const g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,id==='e05'?'e06':id);assert.equal(g.s.flags.evilLegacyHutReport,true);assert.equal(g.s.failure,null);
 }
 const raw=legacy(revision,numeric,{phase:'choice',claimed:true,count:1}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e05');const before=resources(g);assert.equal(g.choose(0),true);assert.equal(g.q.id,'e06');assert.deepEqual(resources(g),before,'claimed reward history prevents a second payout');
}
// Recorded replies/refusals are recruitment evidence even when an old UI saved
// a stale talk cursor. Invalid answers and a different quest checkpoint are not.
for(const revision of [1,5,10,11])for(const numeric of [false,true])for(const away of [false,true]){
 for(const evidence of ['answer','count','claimed']){
  const raw=legacy(revision,numeric,{away});if(evidence==='answer')raw.choices.e05=0;if(evidence==='count')raw.flags.refusal_e05=2;if(evidence==='claimed')raw.claimedRewards=['e05'];
  const g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e05');assert.equal(g.s.flags.evilLegacyHutReport,true);assert.equal(away?g.s.objectiveProgress.phase:g.s.phase,'choice');
 }
 for(const answer of [-1,99,'0',null]){
  const raw=legacy(revision,numeric,{away});raw.choices.e05=answer;const g=new GameEngine(restoreState(raw));assert.equal(g.q.id,ids[0]);assert.ok(!g.s.flags.evilLegacyHutReport);assert.ok(!Object.hasOwn(g.s.choices,'e05'));assert.deepEqual(resources(g),resources({s:raw}));legacyCases++;
 }
 const unrelated=legacy(revision,numeric,{away:true});unrelated.objectiveProgress={questId:'e07',phase:'choice',collectedIds:[]};const pending=new GameEngine(restoreState(unrelated));preserved(pending,unrelated);assert.equal(pending.q.id,ids[0]);assert.ok(!pending.s.flags.evilLegacyHutReport);
}
// The preceding hut-night migration can advance old e04 to the old e05 slot.
// It must not reinterpret that earlier after-state as having heard the report.
for(let revision=1;revision<=10;revision++)for(const numeric of [false,true])for(const completed of [false,true]){
 const raw=legacy(revision,numeric,{id:'e04',phase:'after'});delete raw.flags.evilHutNightComplete;
 if(completed){raw.done=['e04'];raw.claimedRewards=['e04'];}delete raw.choices.e04;
 const g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,ids[0]);assert.equal(g.s.flags.evilLegacyHutNight,true);assert.ok(!g.s.flags.evilLegacyHutReport);assert.equal(g.s.sequence,null);
}
// Stale completed offers cannot restore an obsolete fatal screen or a foreign
// animation; completion history wins without adding new scene/reward history.
{
 const raw=legacy(11,false,{done:true,phase:'failed',count:3});raw.hero.hp=137;raw.choices.e05=0;raw.destination='m71';raw.sequence={questId:'e05',step:1};raw.objectiveProgress={questId:'e05',phase:'after',collectedIds:[]};
 const g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e06');assert.equal(g.s.failure,null);assert.equal(g.s.sequence,null);assert.equal(g.s.objectiveProgress,null);assert.equal(g.s.destination,null);assert.equal(g.paused,false);
}
// A pending old offer at the tower must have a playable route back to the new
// report chain, without being trapped behind its own newly introduced gate.
if(!process.argv.includes('--migration-only')){
 let pending=new GameEngine(restoreState(legacy(11,false)));pending=walk(pending,'m49');assert.equal(pending.q.id,ids[0]);assert.equal(pending.requireQuestFlags(),true);
}
for(const phase of ['talk','choice','failed']){
 const raw=legacy(11,false,{phase,count:phase==='failed'?3:0});raw.flags.route='good';const g=new GameEngine(restoreState(raw));assert.equal(g.q.id,'e05');assert.ok(!g.s.flags.evilLegacyHutReport);assert.ok(!g.s.flags.evilHutReportHeard);legacyCases++;
 const modern=copy(raw);modern.campaignRevision=12;modern.flags.route='evil';const current=new GameEngine(restoreState(modern));assert.equal(current.q.id,'e05');assert.ok(!current.s.flags.evilLegacyHutReport);assert.ok(!current.s.flags.evilHutReportHeard);legacyCases++;
}
console.log(JSON.stringify({result:'PASS',mode:process.argv.includes('--migration-only')?'migration-only':'full',branchCases,restoredSteps,midMoveRestores,timedRestores,travelRestores,invalidSaves,legacyCases,walkPaths,checks:'physical return and room doors, exclusive prior answers without new choices, visible departures and empty-room revisit, overnight cue restore, zero chapter rewards, recruitment refusal preservation, revision 1-11 compatibility and independent 196-task baseline'}));
