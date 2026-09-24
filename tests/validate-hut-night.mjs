import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import {getStagingScene} from '../public/world.mjs';
import {Renderer} from '../public/renderer-v3.mjs';
import * as campaign from '../public/campaign.mjs';

// Independent runtime checks, not original-game playback or visual acceptance.
// Duel HP is lowered deterministically; projected attacks never enter combat.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert.ok(n>=0,id+' exists');return n;};
const snapshot=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const resources=g=>copy({coins:g.s.coins,kills:g.s.kills,potions:g.s.potions,elixirs:g.s.elixirs,inventory:g.s.inventory,equipment:g.s.equipment,skills:g.s.skills,hotbar:g.s.hotbar,hero:Object.fromEntries(['hp','maxHp','mp','maxMp','stamina','level','exp'].map(key=>[key,g.s.hero[key]])),evil:g.s.flags.evil,moral:g.s.flags.moral,affection:g.s.affection});
const reality=g=>copy({resources:resources(g),companion:g.s.flags.companion,choices:g.s.choices,deathFlags:Object.fromEntries(Object.entries(g.s.flags).filter(([key])=>/Dead|Killed|Kill$|Fallen|evilTowerInterludeComplete/.test(key))),failure:g.s.failure,ending:g.s.ending,completed:g.s.completed});
function create(id='e04',flags={}){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.flags={...s.flags,route:'evil',evil:6,moral:2,companion:'纳兰真',...flags};s.visited=[s.map];s.coins=321;s.inventory={wood_box:1};Object.assign(s.hero,{hp:143,mp:89,stamina:54,exp:21});s.affection={zhen:3,zi:4,mei:2,wei:1};const g=new GameEngine(s);Object.assign(s.hero,g.scene.spawn);return g;
}
function winDuel(g){
 g.beginObjective();assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].name,'紫轩');assert.equal(g.choose(0),false,'combat cannot be skipped by answering');
 const enemy=g.s.enemies[0];enemy.hp=1;Object.assign(g.s.hero,{x:enemy.x,y:enemy.y});g.s.cooldowns[0]=0;assert.equal(g.cast(0),true);assert.equal(g.s.phase,'choice');assert.ok(!g.s.flags.evilHutDecision);
}
function renderedProjection(g){
 globalThis.devicePixelRatio=1;const drawn=[];const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const r=new Renderer({clientWidth:1200,clientHeight:800,getContext:()=>ctx},{getContext:()=>ctx},g,{});r.drawActor=(actor,hero)=>drawn.push({...actor,hero});r.draw();assert.ok(!drawn.some(a=>a.hero||['杨影枫','纳兰真'].includes(a.name)),'first tower projection draws neither real player nor follower');
}
// A dream visitor seated outdoors must not borrow the patient quilt/caption.
function checkGroundSeatedRendering(){
 globalThis.devicePixelRatio=1;
 const g=create('e04_dream'),images=[],labels=[];let quilts=0;
 const ctx=new Proxy({drawImage:(...args)=>images.push(args),fillText:text=>labels.push(text),createLinearGradient:()=>{quilts++;return {addColorStop(){}};}},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 const atlas={};const r=new Renderer({clientWidth:1200,clientHeight:800,getContext:()=>ctx},{getContext:()=>ctx},g,{'characters-original':atlas});
 const draw=(actor,hero=false)=>{images.length=0;labels.length=0;quilts=0;r.drawActor({...actor,hidden:false},hero);};
 const visitors=STAGED_QUESTS.e04_dream.actors.filter(a=>a.name==='紫轩');assert.equal(visitors.length,2);
 for(const visitor of visitors){
  assert.equal(visitor.groundSeated,true);draw(visitor);assert.equal(quilts,0);assert.ok(labels.includes('紫轩'));assert.ok(!labels.some(text=>/倚榻|卧病/.test(text)));assert.equal(images.length,1);assert.equal(images[0][0],atlas);assert.equal(images[0][1],2*384,'seated visitor uses her own atlas column');
  draw({...visitor,pose:'stand'});assert.equal(images[0][4],1024,'standing and turning leave the seated rendering branch');
 }
 draw({...visitors[0],groundSeated:false});assert.equal(quilts,1,'a patient still receives the existing quilt');assert.ok(labels.includes('倚榻调息'));
 draw({...g.s.hero,name:'杨影枫',pose:'sit'},true);assert.equal(quilts,0);assert.ok(labels.includes('杨影枫'));assert.equal(images[0][1],0,'hero retains the original seated sprite');
}
checkGroundSeatedRendering();
let restoredSteps=0,midMoveRestores=0,timedRestores=0,projectionRestores=0,invalidSaves=0,legacyCases=0,branchCases=0;
const projectedSaves=new Map(),initialSaves=new Map();
function stage(game,{observe=()=>{},companionMayLeave=false}={}){
 let g=game;const id=g.q.id,steps=STAGED_QUESTS[id].steps,baseline=reality(g),visited=copy(g.s.visited),map=g.s.map,trace=[],seen=new Set(),moved=new Set(),timed=new Set();let lastStep=-1,moveStart=null,oldScene=null,origin=null;
 g.addNumber(78,g.s.hero.x,g.s.hero.y);g.addEffect('slash',g.s.hero.x,g.s.hero.y,70,'#ffffff');g.hitTime=.3;g.dashTime=.4;
 g.completeQuest();assert.equal(g.q.id,id,'required scene cannot be manually skipped');g.beginObjective();assert.equal(g.s.phase,'staging',id+' begins');assert.deepEqual(g.numbers,[],'combat numbers cannot freeze over the scene');assert.deepEqual(g.effects,[],'combat arcs cannot leak into a scene');assert.equal(g.hitTime,0);assert.equal(g.dashTime,0);assert.deepEqual(reality(g),baseline,'clearing transient visuals changes no resources');initialSaves.set(id,snapshot(g));
 for(let tick=0;tick<16000&&g.s.sequence;tick++){
  const sequence=g.s.sequence,step=steps[sequence.step],sceneKey=sequence.sceneKey||null;
  assert.equal(g.s.map,map);assert.deepEqual(g.s.visited,visited);assert.deepEqual(reality(g),baseline,'staged movement/strikes do not change the real world');assert.equal(g.s.enemies.length,0);assert.equal(g.s.allies.length,0);assert.equal(g.s.skirmish,null);assert.equal(g.attackTarget,null);
  if(sceneKey){assert.ok(getStagingScene(sceneKey));assert.ok(!MAPS[sceneKey]);assert.deepEqual(g.scene.portals,{});assert.ok(sequence.origin);assert.equal(sequence.origin.map,map);origin=copy(sequence.origin);assert.equal(g.companion,null,'a real follower cannot leak into a projection');if(!projectedSaves.has(sceneKey))projectedSaves.set(sceneKey,snapshot(g));}
  if(oldScene&&!sceneKey){assert.deepEqual({x:g.s.hero.x,y:g.s.hero.y,direction:g.s.hero.direction},{x:origin.x,y:origin.y,direction:origin.direction},'projection returns to its actual saved origin');assert.equal(sequence.origin,null);}
  oldScene=sceneKey;
  const frame={step:sequence.step,sceneKey,hero:{x:g.s.hero.x,y:g.s.hero.y,pose:sequence.heroPose},actors:copy(sequence.actors),visible:g.stagingActors().map(a=>a.name),cues:copy(sequence.cues),action:step?.type,actor:step?.actor,target:step?.target,focus:step?.focus};
  trace.push(frame);observe(g,frame);
  for(const actor of g.stagingActors())assert.ok(g.passable(actor.x,actor.y),id+' actor stands on the active scene floor');
  const actor=step?.type==='move'?(step.actor==='hero'?g.s.hero:sequence.actors.find(a=>a.id===step.actor)):null;
  if(lastStep!==sequence.step)moveStart=actor?{x:actor.x,y:actor.y}:null;
  const midMove=lastStep===sequence.step&&actor&&moveStart&&!moved.has(sequence.step)&&distance(actor,moveStart)>18&&distance(actor,step)>15;
  const midTimed=['wait','pose','strike'].includes(step?.type)&&!timed.has(sequence.step)&&sequence.elapsed>.1&&sequence.elapsed<(step.duration||.5)-.1;
  if(!seen.has(sequence.step)||midMove||midTimed){
   const raw=snapshot(g),loaded=new GameEngine(restoreState(raw));assert.equal(loaded.s.sequence?.step,sequence.step,id+' preserves the exact step');assert.equal(loaded.s.sequence.elapsed,sequence.elapsed);assert.equal(loaded.s.sequence.sceneKey||null,sceneKey);assert.deepEqual(loaded.s.sequence.origin,sequence.origin);assert.deepEqual(loaded.s.sequence.cues,sequence.cues);assert.equal(loaded.s.sequence.heroPose,sequence.heroPose);assert.equal(loaded.s.hero.x,g.s.hero.x);assert.equal(loaded.s.hero.y,g.s.hero.y);assert.deepEqual(reality(loaded),baseline);
   for(const actor of sequence.actors){const restored=loaded.s.sequence.actors.find(a=>a.id===actor.id);assert.ok(restored);for(const key of ['x','y','direction','pose','sprite','npcCell','groundSeated'])assert.equal(restored[key],actor[key]);assert.equal(!!restored.hidden,!!actor.hidden);}
   seen.add(sequence.step);if(midMove){moved.add(sequence.step);midMoveRestores++;}if(midTimed){timed.add(sequence.step);timedRestores++;}if(sceneKey)projectionRestores++;restoredSteps++;g=loaded;
   assert.equal(g.travel('m49'),false);assert.equal(g.enterMap('m49'),false);assert.equal(g.cast(0),false);assert.equal(g.choose(0),false);g.completeQuest();assert.equal(g.q.id,id);
  }
  lastStep=sequence.step;const active=g;g.onEvent=type=>{if(type==='stagingDialogue')active.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' must release');assert.notEqual(g.s.phase,'staging');assert.equal(g.s.map,map);assert.deepEqual(g.s.visited,visited);assert.deepEqual(resources(g),baseline.resources);if(!companionMayLeave)assert.deepEqual(reality(g),baseline);assert.equal(g.s.flags['staged_'+id],true);return {game:g,trace};
}
function reject(g,id){const before=resources(g);g.beginObjective();g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.sequence,null);assert.deepEqual(resources(g),before);assert.ok(!g.s.flags['staged_'+id]);}
assert.equal(freshState().campaignRevision,14);
const addedIds=['e04_departure','e04_dream','e06_first_interlude'];
for(const id of [...addedIds,'e06_rest']){const q=QUESTS[index(id)];assert.equal(q.xp,0);assert.equal(q.money,0);assert.equal(q.requireStaging,true);assert.ok(STAGED_QUESTS[id]);}
if(!process.argv.includes('--migration-only')){
 for(const answer of [0,1]){
  let g=create();const beforeFight={coins:g.s.coins,kills:g.s.kills};winDuel(g);assert.deepEqual({coins:g.s.coins,kills:g.s.kills},beforeFight,'friendly duel does not create loot or a real death');const evil=g.s.flags.evil;
  assert.equal(g.choose(answer),true);assert.equal(g.q.id,'e04_departure');assert.equal(g.s.choices.e04,answer);assert.equal(g.s.flags.evil,evil+(answer===0?-1:2));assert.equal(g.s.flags.evilHutDecision,true);assert.equal(g.s.flags.evilHutForgiven,answer===0);assert.equal(g.s.flags.evilHutRefused,answer===1);
  const selected=reality(g);g=reload(g);assert.deepEqual(reality(g),selected);assert.equal(g.choose(1-answer),false);assert.equal(g.choose(answer),false);assert.ok(!g.s.flags.evilHutNightComplete);
  g=stage(g).game;assert.equal(g.q.id,'e04_dream');assert.equal(g.s.flags.evilHutZixuanDeparted,true);assert.ok(!g.s.flags.evilHutNightComplete);
  const result=stage(g);g=result.game;const dreamKey=answer===0?'hutForgivenessDream':'hutRefusalDream',dream=result.trace.filter(f=>f.sceneKey);
  assert.deepEqual([...new Set(dream.map(f=>f.sceneKey))],[dreamKey]);const people=new Set(dream.flatMap(f=>f.visible));assert.ok(people.has('紫轩'));assert.ok(people.has(answer===0?'纳兰真':'卓非凡'));assert.ok(!people.has(answer===0?'卓非凡':'纳兰真'),'only the committed third person enters the dream');assert.ok(!people.has('蔷薇')&&!people.has('孟知秋'),'later dungeon dreams cannot be mixed into the hut');
  assert.ok(!dream.some(f=>f.actors.some(a=>a.pose==='fallen')),'dream disappearance/attack is not a proven death');
  if(answer===0){const zhenShown=dream.findIndex(f=>f.visible.includes('纳兰真')),zhenGone=dream.findIndex((f,i)=>i>zhenShown&&!f.visible.includes('纳兰真')),ziGone=dream.findIndex((f,i)=>i>zhenGone&&!f.visible.includes('紫轩'));assert.ok(zhenShown>=0&&zhenGone>zhenShown&&ziGone>zhenGone,'Zhen vanishes before Zixuan');const position=dream[zhenGone].hero;assert.ok(dream.slice(zhenGone+1).some(f=>distance(f.hero,position)>30),'hero runs after the vanished figure');}
  else{const strike=dream.find(f=>f.action==='strike'&&f.actor==='hero');assert.ok(strike,'refusal includes the authored attack gesture');assert.equal(strike.actors.find(a=>a.id===strike.target)?.name,'卓非凡');}
  assert.equal(g.q.id,'e04_homecoming');assert.equal(g.s.flags.evilHutNightComplete,true);assert.ok(!g.stagingActors().some(a=>a.name==='紫轩'),'waking does not restore the departed real visitor');assert.deepEqual(reality(g),selected);
  const finished=reload(g);for(const id of ['e04',...addedIds.slice(0,2)]){finished.s.quest=index(id);finished.s.map=finished.q.map;finished.s.phase=id==='e04'?'choice':'talk';finished.completeQuest();assert.equal(finished.choose(answer),false);assert.deepEqual(reality(finished),selected);assert.equal(finished.s.done.filter(done=>done===id).length,1);}
  branchCases++;
 }
 // Existing ordinary defeat remains a real retry; it cannot authorize a dream.
 {
  const g=create();g.beginObjective();g.s.hero.hp=1;Object.assign(g.s.enemies[0],{x:g.s.hero.x,y:g.s.hero.y,attackTimer:0,skillTimer:100,telegraph:0,telegraphZone:null});for(let n=0;n<100&&!g.paused;n++)g.tick(.05);assert.equal(g.paused,true);assert.equal(g.s.phase,'battle');assert.equal(g.choose(0),false);assert.ok(!g.s.flags.evilHutDecision);g.retry();assert.equal(g.s.phase,'battle');assert.ok(!g.s.flags.evilHutNightComplete);assert.equal(g.choose(1),false);
 }
 const tower=create('e06_first_interlude',{evilIslandArrived:true,evilQiangweiDead:true});let rendered=false;
 const first=stage(tower,{observe(g,f){assert.ok(!g.s.flags.evilFirstTowerInterludeComplete);assert.ok(!g.s.flags.evilTowerInterludeComplete);assert.ok(!f.actors.some(a=>a.pose==='fallen'),'first tower clash has no authored death');if(f.sceneKey){assert.equal(f.sceneKey,'towerFirstInterlude');assert.equal(g.scene.hidePlayer,true);assert.ok(!f.visible.includes('纳兰真'));if(!rendered){renderedProjection(g);rendered=true;}}}});
 let g=first.game;assert.ok(rendered);assert.equal(g.q.id,'e06_rest');assert.equal(g.s.flags.evilFirstTowerInterludeComplete,true);assert.ok(!g.s.flags.evilTowerInterludeComplete);assert.ok(!g.s.flags.evilZhenMissing);assert.equal(g.s.flags.companion,'纳兰真');
 const towerFrames=first.trace.filter(f=>f.sceneKey);for(const name of ['纳兰潜凛','孟知秋'])assert.ok(towerFrames.some(f=>f.visible.includes(name)));const report=towerFrames.findIndex(f=>f.action==='say'&&f.focus==='first-tower-disciple'),approach=towerFrames.findIndex((f,i)=>i>report&&f.action==='move'&&f.actor==='first-tower-nalan'),clash=towerFrames.findIndex(f=>f.action==='strike');assert.ok(report>=0&&approach>report&&clash>approach,'disciple reports before Nalan approaches and the first clash begins');
 const afterTower=first.trace.slice(first.trace.findLastIndex(f=>f.sceneKey)+1);assert.ok(afterTower.length);assert.ok(afterTower.every(f=>!f.visible.includes('纳兰真')),'returning camera initially keeps Zhen hidden');
 assert.equal(g.s.hero.pose,'sit','first cutaway releases into the existing beach rest');const returned=snapshot(g);g=reload(g);assert.equal(g.s.hero.pose,'sit','loading the earned callback cannot stand the sleeping hero up');assert.equal(g.q.id,'e06_rest');assert.equal(g.s.flags.evilFirstTowerInterludeComplete,true);assert.equal(g.s.hero.x,returned.hero.x);assert.equal(g.s.hero.y,returned.hero.y);assert.deepEqual(resources(g),resources({s:returned}));
 const rest=stage(g,{companionMayLeave:true,observe(g,f){assert.ok(!g.s.flags.evilZhenMissing);assert.ok(!f.visible.includes('月眉儿'));assert.equal(g.companion,null,'shore actor owns the follower identity even while hidden');}});g=rest.game;
 const trace=rest.trace,shown=trace.findIndex(f=>f.visible.includes('纳兰真'));assert.ok(shown>0,'shore callback starts hidden and later shows Zhen');const zhenAt=trace[shown].actors.find(a=>a.name==='纳兰真');const walked=trace.findIndex((f,i)=>i>shown&&f.visible.includes('纳兰真')&&distance(f.actors.find(a=>a.name==='纳兰真'),zhenAt)>30);assert.ok(walked>shown);const awake=trace.findIndex((f,i)=>i>walked&&f.hero.pose==='stand');assert.ok(awake>walked,'hero wakes after the departure movement begins');assert.ok(trace.some((f,i)=>i>awake&&!f.visible.includes('纳兰真')),'the visible departure is finally removed after waking');assert.equal(g.q.id,'e07_village');assert.equal(g.s.flags.evilZhenMissing,true);assert.equal(g.s.flags.companion,null);assert.ok(!g.s.flags.evilTowerInterludeComplete);
 // A later tower outcome is never a substitute for the earlier earned event.
 reject(create('e06_rest',{evilIslandArrived:true,evilTowerInterludeComplete:true}),'e06_rest');reject(create('e05'),'e05');
 for(const id of ['e04_departure','e04_dream']){
  const good={evilHutDecision:true,evilHutForgiven:true,evilHutRefused:false,evilHutZixuanDeparted:true};
  for(const flags of [{evilHutDecision:false},{evilHutForgiven:false},{evilHutRefused:true},{route:'good'},...(id==='e04_dream'?[{evilHutZixuanDeparted:false}]:[])])reject(create(id,{...good,...flags}),id);
 }
 for(const flags of [{},{evilFirstTowerInterludeComplete:true},{evilLegacyFirstTowerInterlude:true}]){const raw=snapshot(create('e06_rest',flags));raw.hero.pose='fallen';const loaded=new GameEngine(restoreState(raw));assert.equal(loaded.s.hero.pose,flags.evilFirstTowerInterludeComplete||flags.evilLegacyFirstTowerInterlude?'sit':undefined,'beach pose is rebuilt only from earned progress, never arbitrary raw pose');}
 reject(create('e06_first_interlude'),'e06_first_interlude');reject(create('e06_first_interlude',{evilIslandArrived:true,route:'good'}),'e06_first_interlude');
 for(const [key,raw] of projectedSaves){
  const other=key==='hutForgivenessDream'?'hutRefusalDream':'hutForgivenessDream';
  const unhidden=copy(raw);for(const actor of unhidden.sequence.actors)actor.hidden=false;const isolated=new GameEngine(restoreState(unhidden));assert.ok(isolated.s.sequence);for(const actor of isolated.stagingActors())if(Object.hasOwn(actor,'sceneKey'))assert.equal(actor.sceneKey,key,'explicit null and other scene keys cannot leak into the projection');if(key==='towerFirstInterlude')renderedProjection(isolated);else assert.equal(isolated.stagingActors().filter(actor=>actor.name==='紫轩').length,1,'another dream branch cannot add a duplicate visitor');
  const mutations=[s=>{s.sequence.sceneKey=other;},s=>{s.sequence.sceneKey='m71';},s=>{s.sequence.origin=null;},s=>{s.sequence.origin.map='m49';},s=>{s.sequence.origin.x=NaN;},s=>{s.sequence.origin.x=1e9;s.sequence.origin.y=1e9;},s=>{s.sequence.origin.x=-1e9;s.sequence.origin.y=-1e9;},s=>{s.sequence.origin.x=120;s.sequence.origin.y=180;},s=>{s.sequence.questId='e08_interlude';},s=>{s.flags.route='good';}];
  if(key.startsWith('hut'))mutations.push(s=>{s.flags.evilHutForgiven=s.flags.evilHutRefused=true;},s=>{s.flags.evilHutForgiven=s.flags.evilHutRefused=false;},s=>{s.flags.evilHutZixuanDeparted=false;});else mutations.push(s=>{s.flags.evilIslandArrived=false;});
  for(const mutate of mutations){const invalid=copy(raw);mutate(invalid);const rejected=new GameEngine(restoreState(invalid));assert.equal(rejected.s.sequence,null,'invalid '+key+' projection must restart on real map');assert.equal(rejected.s.map,raw.map);assert.ok(rejected.passable(rejected.s.hero.x,rejected.s.hero.y));assert.deepEqual(resources(rejected),resources({s:raw}));assert.ok(!rejected.s.flags['staged_'+raw.questId]);invalidSaves++;}
  const invalid=copy(raw);invalid.map=key;assert.throws(()=>restoreState(invalid),'projection cannot be a world map');
 }
}
// Frozen from revision 10 before new scenes are registered, so inserting an
// event cannot silently make an existing fight harder.
const revisionTenTiers={"a01":1,"a02":1,"a03":1,"a04":1,"a05":1,"a06":1,"a07":1,"a08":1,"a09":1,"a10":2,"a11":2,"a12":2,"a13":2,"a14":2,"a15":2,"a16":2,"a17":2,"a18":2,"a19":3,"a20":3,"a21":3,"a22":3,"a23":3,"a24":3,"a25":3,"a26":3,"a27":3,"a28":4,"a29":4,"a30":4,"a31":4,"a32":4,"a33":4,"a34":4,"a35":4,"a36":4,"a37":5,"a38":5,"a39":5,"a40":5,"a41":5,"a42":5,"a43":5,"a44":5,"a45":5,"a46":6,"a47":6,"a48":6,"a49":6,"a50":6,"a51":6,"a52":6,"a53":6,"a54":6,"a55":7,"a56":7,"a57":7,"a58":7,"a59":7,"a60":7,"a61":7,"a62":7,"a63_trial":7,"a63_zi":8,"a63":8,"a64":8,"a65":8,"a66":8,"a67":8,"a68":8,"b01":8,"b02":8,"b02_ambush":9,"b03":9,"b04":9,"b05":9,"b06":9,"b07":9,"g01":9,"g02":9,"g03":9,"g03_return":10,"g03_invitation":10,"g04":10,"g05":10,"g06":10,"g06_confide":10,"g06_inquire":10,"g06_request":10,"g06_return":10,"g06_introduce":11,"g06_rest":11,"g07":10,"g07_dawn":11,"g07_visit":11,"g07_zhen":11,"g07_apology":11,"g07_mainland":11,"g07_island":11,"g07_settle":12,"g08":10,"g08_deliver":10,"g09":10,"g10":11,"g11":11,"g12":11,"g13":11,"g14":11,"g15":11,"gCult_wudang":11,"gCult_appointment":11,"gCult_qiangwei":11,"gCult_zixuan":12,"gCult_farewell":12,"gCult_epilogue":12,"g16":12,"g17":12,"g18":12,"gTower1":12,"gTower2":12,"gTower3":12,"gTower4":13,"gTower5":13,"gTower6":13,"gTower7":13,"gTower8":13,"g19":13,"g20":13,"g21":13,"g22":13,"g23":14,"g24":14,"gBad1":14,"gBad2":14,"e01":14,"e02":14,"e03_masked_duel":14,"e03":14,"e04":14,"e05":15,"e06":15,"e06_kill":15,"e06_refuse":15,"e06_aftermath":15,"e06_night":15,"e06_night_visit":15,"e06_escort":15,"e06_ferry":15,"e06_landing":16,"e06_rest":16,"e07_village":16,"e07_approach":16,"e07_entry":16,"e07_first":16,"e07_second":16,"e07_gate":16,"e07":16,"e08_interlude":17,"e08_island_battle":17,"e08_departure":17,"e08":17,"e08_refuse":17,"e08_kill":17,"e09_report":17,"e09_first_wake":17,"e09":17,"e09_part":18,"e09_sleepless":18,"e09_second_meeting":18,"e09_room_talk":18,"e09_morning":18,"e10_teaching":18,"e10":18,"e11":18,"e12":18,"eTower1":19,"eSwitch1":19,"eTower2":19,"eSwitch2":19,"eTower3":19,"eSwitch3":19,"eTower4":19,"eSwitch4":19,"eTower5":19,"eSwitch5":20,"eTower6":20,"eSwitch6":20,"eTower7":20,"eSwitch7":20,"eTower8":20,"eSwitch8":20,"e13":20,"e14":20};
assert.deepEqual(campaign.REVISION_TEN_QUEST_IDS,Object.keys(revisionTenTiers),'revision-ten numeric identities remain frozen at their actual 193-entry order');
for(const [id,tier] of Object.entries(revisionTenTiers))assert.equal(QUESTS[index(id)].encounterTier??Math.max(1,Math.floor(index(id)/9)+1),tier,id+' retains the established effective encounter tier');
// Old history is explicit metadata, never a newly played dream or tower fight.
const oldTables=[campaign.LEGACY_QUEST_IDS,campaign.REVISION_TWO_QUEST_IDS,campaign.REVISION_THREE_QUEST_IDS,campaign.REVISION_FOUR_QUEST_IDS,campaign.REVISION_FIVE_QUEST_IDS,campaign.REVISION_SIX_QUEST_IDS,campaign.REVISION_SEVEN_QUEST_IDS,campaign.REVISION_EIGHT_QUEST_IDS,campaign.REVISION_NINE_QUEST_IDS,campaign.REVISION_TEN_QUEST_IDS];
function legacy(id,revision,numeric,{answer,phase='talk',away=false,done=[],flags={}}={}){
 const raw=snapshot(create(id,{...flags}));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf(id);assert.ok(raw.quest>=0,'historical '+id+' exists in revision '+revision);if(numeric)delete raw.questId;
 raw.phase=phase;raw.done=[...done];raw.claimedRewards=[...done];if(answer!==undefined)raw.choices.e04=answer;
 if(away){raw.map='m49';raw.visited.push('m49');const probe=new GameEngine({...copy(raw),quest:index(id),sequence:null});Object.assign(raw.hero,probe.scene.spawn);raw.objectiveProgress={questId:id,phase,collectedIds:[]};raw.phase='travel';}
 return raw;
}
function preserved(g,raw){
 assert.deepEqual(resources(g),resources({s:raw}),'migration preserves exact balances and score');assert.deepEqual(g.s.done,raw.done);assert.deepEqual(g.s.claimedRewards,raw.claimedRewards);assert.equal(g.s.map,raw.map);assert.equal(g.s.hero.x,raw.hero.x);assert.equal(g.s.hero.y,raw.hero.y);assert.equal(g.s.flags.companion,raw.flags.companion);
 for(const id of addedIds){assert.ok(!g.s.done.includes(id));assert.ok(!g.s.claimedRewards.includes(id));assert.ok(!g.s.flags['staged_'+id]);}
 assert.ok(!g.s.flags.evilHutNightComplete);assert.ok(!g.s.flags.evilFirstTowerInterludeComplete);assert.ok(!g.s.flags.evilTowerInterludeComplete,'first-cutaway migration cannot invent the later battle result');
 const again=reload(g);assert.equal(again.q.id,g.q.id);assert.deepEqual(resources(again),resources(g));assert.deepEqual(again.s.done,g.s.done);assert.deepEqual(again.s.claimedRewards,g.s.claimedRewards);legacyCases++;
}
for(let revision=1;revision<=10;revision++)for(const numeric of [false,true]){
 for(const phase of ['talk','battle','choice'])for(const away of [false,true]){
  const raw=legacy('e04',revision,numeric,{phase,away}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e04');assert.ok(!Object.hasOwn(g.s.choices,'e04'));assert.ok(!g.s.flags.evilLegacyHutNight);assert.ok(!g.s.flags.evilHutDecision);assert.equal(g.s.phase,away?'travel':phase==='choice'?'choice':'talk');if(away&&phase==='choice')assert.equal(g.s.objectiveProgress?.phase,'choice');
 }
 for(const answer of [0,1])for(const phase of ['choice','after'])for(const away of [false,true]){
  const raw=legacy('e04',revision,numeric,{answer,phase,away,flags:{evilHutForgiven:answer===1,evilHutRefused:answer===0}}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e04_departure');assert.equal(g.s.choices.e04,answer);assert.equal(g.s.flags.evilHutDecision,true);assert.equal(g.s.flags.evilHutForgiven,answer===0);assert.equal(g.s.flags.evilHutRefused,answer===1);assert.ok(!g.s.flags.evilLegacyHutNight);assert.equal(g.s.phase,away?'travel':'talk');assert.equal(g.s.sequence,null);
 }
 for(const answer of [undefined,-1,2,'0',null])for(const away of [false,true]){
  const raw=legacy('e04',revision,numeric,{answer,phase:'after',away}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e04_homecoming');assert.equal(g.s.flags.evilLegacyHutNight,true);assert.equal(g.s.flags.evilLegacyHutUnknown,true);assert.ok(!Object.hasOwn(g.s.choices,'e04'));assert.ok(!g.s.flags.evilHutForgiven&&!g.s.flags.evilHutRefused);assert.equal(g.s.sequence,null);
 }
 for(const id of ['e04','e05','e06','e07','e11']){
  const raw=legacy(id,revision,numeric,{done:['e04']}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,['e04','e05'].includes(id)?'e04_homecoming':id);assert.equal(g.s.flags.evilLegacyHutNight,true);assert.ok(!Object.hasOwn(g.s.choices,'e04'));if(['e07','e11'].includes(id))assert.equal(g.s.flags.evilLegacyFirstTowerInterlude,true);
 }
 if(oldTables[revision-1].includes('e06_rest')){
  for(const phase of ['talk','staging','after'])for(const away of [false,true]){
   const raw=legacy('e06_rest',revision,numeric,{phase,away,flags:{evilIslandArrived:true,staged_e06_rest:true}});raw.destination='m71';raw.sequence={questId:'e06_rest',step:10,elapsed:.4,actors:[{id:'zhen',name:'纳兰真',x:1210,y:700,hidden:true}],cues:{shoreRest:'asleep'}};
   const g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e06_first_interlude');assert.equal(g.s.sequence,null);assert.equal(g.s.destination,null);assert.equal(g.s.objectiveProgress,null);assert.ok(!g.s.flags.staged_e06_rest);assert.ok(!g.s.flags.evilLegacyFirstTowerInterlude);assert.ok(!g.s.flags.evilZhenMissing);assert.equal(g.s.enemies.length,0);assert.equal(g.s.skirmish,null);
  }
  for(const id of ['e06_rest','e07','e11']){
   const raw=legacy(id,revision,numeric,{done:['e04','e06_rest'],flags:{evilIslandArrived:true,evilZhenMissing:true}}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,id==='e06_rest'?'e07_village':id);assert.equal(g.s.flags.evilLegacyFirstTowerInterlude,true);assert.equal(g.s.flags.evilZhenMissing,true);
  }
 }
}
// Invalid pending answers do not become historical completion. Wrong-route and
// current saves cannot borrow old-history compatibility to skip new content.
for(const answer of [-1,2,99,'0',null]){
 const raw=legacy('e04',10,false,{answer,phase:'choice'}),g=new GameEngine(restoreState(raw));preserved(g,raw);assert.equal(g.q.id,'e04');assert.equal(g.s.phase,'choice');assert.ok(!g.s.flags.evilLegacyHutNight);assert.ok(!Object.hasOwn(g.s.choices,'e04'));
}
for(const revision of [1,5,10,11])for(const id of ['e04','e06_rest']){
 const raw=snapshot(create(id,{route:'good'}));raw.campaignRevision=revision;raw.phase='after';raw.done=[id];raw.claimedRewards=[id];const g=new GameEngine(restoreState(raw));assert.ok(!g.s.flags.evilLegacyHutNight);assert.ok(!g.s.flags.evilLegacyFirstTowerInterlude);assert.equal(g.q.id,id);legacyCases++;
}
for(const id of ['e04','e06_rest']){
 const raw=snapshot(create(id));raw.phase='after';const g=new GameEngine(restoreState(raw));assert.equal(g.q.id,id);assert.ok(!g.s.flags.evilLegacyHutNight);assert.ok(!g.s.flags.evilLegacyFirstTowerInterlude);assert.ok(!g.s.done.includes(id));legacyCases++;
}
// Every revision-ten numeric identity uses the frozen table. The explicit
// redirects are the unfinished beach cutaway, return-message and manor defense.
for(const [oldIndex,id] of campaign.REVISION_TEN_QUEST_IDS.entries()){
 const raw=snapshot(create(id));delete raw.questId;raw.quest=oldIndex;raw.campaignRevision=10;raw.flags.route=QUESTS[index(id)].when?.route||'good';raw.skills[8]=20;raw.flags.switch8=true;
 const g=new GameEngine(restoreState(raw));assert.equal(g.q.id,({e06_rest:'e06_first_interlude',e05:'e04_homecoming',g14:'g14_dock_report',g13:'g13_hut',g16:'g15_escape',g18:'g17_manor'})[id]||id,id+' keeps its numeric identity or explicit migration');assert.deepEqual(resources(g),resources({s:raw}));legacyCases++;
}

console.log(JSON.stringify({result:'PASS',branchCases,restoredSteps,midMoveRestores,timedRestores,projectionRestores,invalidSaves,legacyCases,checks:'two isolated hut dreams, real-world conservation, ordinary duel retry, first tower clash without death, shore disappearance order, exact projected origin restoration'}));
