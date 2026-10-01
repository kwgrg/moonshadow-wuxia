import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS} from '../public/runtime.mjs';
import {getScene} from '../public/world.mjs';
import {REVISION_NINETEEN_QUEST_IDS} from '../public/campaign.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
const q=QUESTS.find(q=>q.id==='a38'),original=copy(q),snapshot=g=>({...copy(g.s),questId:g.q.id});
let checks=0;
function make(map=q.map){const s=freshState();s.quest=QUESTS.indexOf(q);s.map=map;s.visited=[map];s.inventory.thunder_bomb=1;s.flags.probeHasLoot=true;const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;}
function tick(g,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++)g.tick(.05);}
function reset(config={}){for(const key of Object.keys(q))delete q[key];Object.assign(q,copy(original));for(const key of ['autoEscape','escapeGoal','escapeMaps','escapeRoute','escapeRetry','escapeLegacyGoal','escapeLegacyRetry','requiredItems','requiredFlags','requiredAnyFlags','requireStaging','sceneVariant'])delete q[key];Object.assign(q,{map:'m27',duration:60},config);}
try{
 reset();
 // A real pre-R20 clock is retained rather than silently starting another minute.
 for(const remaining of [60,31.25,.05,0]){
  const g=make(),raw=snapshot(g);raw.campaignRevision=19;raw.phase='escape';raw.timer=remaining;delete raw.escapeProgress;
  const r=new GameEngine(restoreState(raw));assert.equal(r.s.timer,remaining);assert.equal(r.escapeFailed(),remaining===0);assert.equal(r.s.escapeProgress.status,remaining?'active':'failed');checks++;
 }
 let g=make();assert.equal(g.s.escapeProgress,null);assert.equal(g.startEscape(),true);tick(g,40);
 const left=g.s.timer;assert(Math.abs(left-20)<1e-8);g=new GameEngine(restoreState(snapshot(g)));assert.equal(g.s.timer,left);assert.equal(g.s.phase,'escape');
 // Calling beginObjective twice cannot extend an existing attempt.
 g.beginObjective();assert.equal(g.s.timer,left);const awards={coins:g.s.coins,items:copy(g.s.inventory),claims:copy(g.s.claimedRewards),hp:g.s.hero.hp};
 tick(g,21);assert.equal(g.escapeFailed(),true);assert.equal(g.s.phase,'failed');assert.equal(g.paused,true);g=new GameEngine(restoreState(snapshot(g)));assert.equal(g.escapeFailed(),true);assert.equal(g.paused,true);g.completeQuest();assert.equal(g.q.id,'a38');
 assert.equal(g.retryEscape(),true);assert.equal(g.s.timer,60);assert.equal(g.s.escapeProgress.attempt,2);assert.deepEqual({coins:g.s.coins,items:g.s.inventory,claims:g.s.claimedRewards,hp:g.s.hero.hp},awards);checks+=7;
 // Menu/dialogue, scene loading and background focus pause active play. Jumping
 // remains part of active play and cannot freeze the countdown.
 for(const gate of ['paused','sceneLoading','active']){const v=gate==='active'?false:true;g[gate]=v;const before=g.s.timer;tick(g,2);assert.equal(g.s.timer,before);g[gate]=!v;checks++;}
 g.jump={probe:true};g.tickJump=()=>{};const beforeJump=g.s.timer;g.tick(.05);assert.equal(g.s.timer,beforeJump-.05);g.jump=null;checks++;
 // An after-phase or damaged transcript is never proof that the exit was used.
 for(const damage of [raw=>{delete raw.escapeProgress;raw.phase='after';},raw=>{delete raw.escapeProgress;raw.phase='failed';},raw=>{raw.escapeProgress.remaining=NaN;},raw=>{raw.escapeProgress.questId='a39';},raw=>{raw.escapeProgress.status='completed';raw.escapeProgress.goalReached=null;},raw=>{raw.escapeProgress.remaining=61;}]){
  const raw=snapshot(g);damage(raw);const r=new GameEngine(restoreState(raw));assert.equal(r.escapeFailed(),true);r.completeQuest();assert.equal(r.q.id,'a38');assert.equal(r.s.inventory.thunder_bomb,1);assert.equal(r.retryEscape(),true);checks++;
 }
 // A normal retreat must approach the real marker; a caller cannot finish from
 // a distant position or substitute another coordinate for that marker.
 const marker=g.escapeMarker();assert.equal(g.finishEscape(marker),false);const fake={...marker,x:marker.x-100};Object.assign(g.s.hero,marker);assert.equal(g.finishEscape(fake),false);assert.equal(g.finishEscape(marker),true);assert.notEqual(g.q.id,'a38');const won=snapshot(g);assert.equal(won.claimedRewards.filter(id=>id==='a38').length,1);assert.equal(g.finishEscape(marker),false);assert.equal(g.s.inventory.thunder_bomb,1);g=new GameEngine(restoreState(won));assert.equal(g.s.coins,won.coins);checks+=4;

 reset({map:'m26',autoEscape:true,requiredItems:{thunder_bomb:1},requiredFlags:['probeHasLoot'],escapeMaps:['m26','m25'],escapeRoute:[['m26','m25'],['m25','m24']],escapeRetry:{map:'m26',...getScene('m26',MAPS.m26).spawn},escapeGoal:{map:'m25',...getScene('m25',MAPS.m25).portals.m24.exit,to:'m24',name:'测试墙外出口'}});
 g=make();assert.equal(g.escapeActive(),true);assert.equal(g.s.timer,60);g.completeQuest();assert.equal(g.q.id,'a38');assert.deepEqual(g.routeTo('m25'),['m26','m25']);assert.equal(g.travel('m24'),false,'outside travel cannot bypass the escape marker');
 const beforeTravel=snapshot(g);g.trackEscape();for(let n=0;n<1500&&g.s.map==='m26';n++)g.tick(.05);assert.equal(g.s.map,'m25');assert(g.s.timer<beforeTravel.timer);assert(g.s.timer>0);const atWall=snapshot(g);g=new GameEngine(restoreState(atWall));assert.equal(g.s.timer,atWall.timer);assert.equal(g.s.phase,'escape');assert.equal(g.enterMap('m24'),false,'ordinary portal use does not prove escape');
 g.trackEscape();for(let n=0;n<1500&&g.q.id==='a38';n++)g.tick(.05);assert.notEqual(g.q.id,'a38');assert.equal(g.s.map,'m24','only actual outside destination settles the retreat');assert.equal(g.s.inventory.thunder_bomb,1);assert.equal(g.s.claimedRewards.filter(id=>id==='a38').length,1);assert.equal(g.s.coins,165);checks+=10;
 // Missing prerequisite inventory/flags cannot start a freshly configured timer.
 for(const missing of ['items','flags']){const s=freshState();s.quest=QUESTS.indexOf(q);s.map=q.map;if(missing==='items')s.flags.probeHasLoot=true;else s.inventory.thunder_bomb=1;const r=new GameEngine(s);assert.equal(r.escapeActive(),false);assert.equal(r.startEscape(),false);r.completeQuest();assert.equal(r.q.id,'a38');checks++;}
 // Legacy m27 remains on its own map and preserves a live timer, then explicitly
 // retries that same independently authored old layout without refunding loot.
 Object.assign(q,{escapeLegacyGoal:{map:'m27',x:1250,y:410,name:'旧版围墙缺口'},escapeLegacyRetry:{map:'m27',x:780,y:875}});
 const legacy=make('m27'),old=snapshot(legacy);old.campaignRevision=19;old.phase='escape';old.timer=12.5;old.escapeProgress=null;
 g=new GameEngine(restoreState(old));assert.equal(g.s.map,'m27');assert.equal(g.s.escapeProgress.mode,'legacy');assert.equal(g.s.timer,12.5);tick(g,13);g=new GameEngine(restoreState(snapshot(g)));assert.equal(g.escapeFailed(),true);assert.equal(g.retryEscape(),true);assert.equal(g.s.map,'m27');assert.equal(g.s.escapeProgress.mode,'legacy');assert.equal(g.s.inventory.thunder_bomb,1);checks+=5;
 // Numeric R19 indices resolve through the frozen R19 list, independent of
 // newly inserted R20 nodes. These unaffected samples exercise that path.
 for(const id of ['a01','a08','a18','gTower1','e14_father']){const s=freshState();s.campaignRevision=19;s.quest=REVISION_NINETEEN_QUEST_IDS.indexOf(id);s.map=QUESTS.find(q=>q.id===id).map;const r=restoreState(copy(s));assert.equal(QUESTS[r.quest].id,id);assert.equal(r.campaignRevision,20);checks++;}
 assert.equal(REVISION_NINETEEN_QUEST_IDS.length,256);assert.equal(freshState().campaignRevision,20);
 console.log(JSON.stringify({result:'PASS',checks,coverage:'persistent countdown; explicit failed retry; corrupted/after guard; actual exit proximity; cross-map walk and outside settlement; legacy layout; R19 numeric migration',limitation:'State/path tests use independently configured probe exits; actual browser/art and final production wall leap require separate validation.'},null,2));
}finally{for(const key of Object.keys(q))delete q[key];Object.assign(q,original);}
