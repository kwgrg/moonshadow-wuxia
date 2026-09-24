import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import * as campaign from '../public/campaign.mjs';
import {applyCompanionEffects} from '../public/travel-party.mjs';
// Production state-machine/DOM boundaries, not original-game fidelity or browser play.
const copy=x=>JSON.parse(JSON.stringify(x)),idx=id=>QUESTS.findIndex(q=>q.id===id),snap=g=>({...copy(g.s),questId:g.q.id});
const resources=s=>copy({coins:s.coins,hero:s.hero,affection:s.affection,inventory:s.inventory,skills:s.skills,potions:s.potions,elixirs:s.elixirs,claimedRewards:s.claimedRewards,done:s.done});
let checks=0,legacyCases=0;
function make(id='g23'){
 const s=freshState();s.quest=idx(id);assert.ok(s.quest>=0,id);const q=QUESTS[s.quest];s.map=q.map;s.phase='talk';s.flags.route='good';
 for(const flag of q.requiredFlags||[])s.flags[flag]=true;for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;
}
function approach(g,index){const actor=g.markers.find(m=>m.kind==='firstMeeting'&&m.index===index);assert.ok(actor);g.interact(actor);for(let n=0;n<5000&&!Object.hasOwn(g.s.choices,'g23');n++)g.tick(.05);assert.equal(g.s.choices.g23,index);assert.ok(distance(g.s.hero,actor)<=135);return actor;}
const first=QUESTS[idx('g23')];assert.deepEqual(first.firstMeeting.actors.map(a=>[a.id,a.index]),[['good-meeting-zi',0],['good-meeting-mei',1]]);assert.deepEqual(first.before,[]);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(campaign.REVISION_FIFTEEN_QUEST_IDS.map(id=>[id,QUESTS[idx(id)].encounterTier]))).digest('hex'),'798188d83c0d583daafc28c437047fc244c29ec141b14fa2398b82d8cd71f525','frozen R15 IDs and combat strength stay fixed');checks++;
for(const answer of [0,1]){
 let g=make();const before=resources(g.s);assert.equal(g.markers.filter(m=>m.kind==='firstMeeting').length,2);assert.equal(g.choose(answer),false);g.completeQuest();assert.equal(g.q.id,'g23');assert.deepEqual(resources(g.s),before);
 // A forged visible coordinate cannot bypass the canonical actor-distance check.
 assert.equal(g.interactFirstMeeting({...g.q.firstMeeting.actors[answer],x:g.s.hero.x,y:g.s.hero.y}),false);
 const events=[];let committed;
 g.onEvent=(name)=>{events.push(name);if(name==='firstMeetingCommitted')committed=snap(g);};
 const actor=approach(g,answer);assert.deepEqual(events.filter(x=>x.startsWith('firstMeeting')),['firstMeetingCommitted','firstMeetingDialogue']);assert.equal(committed.choices.g23,answer);assert.equal(committed.done.includes('g23'),false);assert.equal(committed.claimedRewards.includes('g23'),false);assert.equal(g.companions.some(a=>a.name===actor.name),false,'standing NPC is not duplicated by follower');assert.equal([...g.markers,...g.companions].filter(a=>a.name===actor.name&&a.sprite!=null).length,1,'exactly one selected person while talking');
 g.completeQuest();assert.equal(g.q.id,'g23','only dialogue finish can settle');assert.equal(g.travel('m16'),false);
 g=new GameEngine(restoreState(committed));assert.equal(g.firstMeetingReady(),true);assert.equal(g.s.flags.firstWoman,answer?'mei':'zi');assert.equal(g.choose(1-answer),false);const other=g.q.firstMeeting.actors[1-answer];Object.assign(g.s.hero,other);assert.equal(g.interactFirstMeeting(other),false);assert.equal(g.finishFirstMeeting('wrong'),false);Object.assign(g.s.hero,actor);assert.equal(g.interactFirstMeeting(actor),true);assert.equal(g.finishFirstMeeting(),true);assert.equal(g.q.id,answer?'g23_farewell':'g23_pickup');assert.deepEqual(g.partyNames,[answer?'月眉儿':'紫轩']);assert.equal(g.markers.filter(m=>m.kind==='firstMeeting').length,0);assert.equal([...g.markers,...g.companions].filter(a=>a.name===actor.name&&a.sprite!=null).length,1,'selected actor becomes exactly one follower after dialogue');assert.equal([...g.markers,...g.companions].filter(a=>a.name===other.name&&a.sprite!=null).length,0,'other actor leaves the valley presentation');assert.equal(g.s.coins,before.coins+15);assert.equal(g.s.claimedRewards.filter(id=>id==='g23').length,1);const after=resources(g.s);assert.equal(g.finishFirstMeeting('g23'),false);assert.deepEqual(resources(g.s),after);checks++;
}
// Arrays survive reload; explicit removal and older scalar updates remain compatible.
{
 const g=make('g23_pickup');applyCompanionEffects(g.s.flags,{companions:['紫轩','月眉儿','紫轩','invented']});let r=new GameEngine(restoreState(snap(g)));assert.deepEqual(r.partyNames,['紫轩','月眉儿']);r.s.flags.companion='蔷薇';r=new GameEngine(restoreState(snap(r)));assert.deepEqual(r.partyNames,['蔷薇']);applyCompanionEffects(r.s.flags,{companions:[]});assert.deepEqual(new GameEngine(restoreState(snap(r))).partyNames,[]);checks++;
}
// A claimed but unfinished authored reunion node repairs followers without paying again.
for(const id of ['g23_pickup','g23_farewell']){
 const g=make(id);g.s.flags[id==='g23_pickup'?'goodFirstZi':'goodFirstMei']=true;g.s.flags['staged_'+id]=true;g.s.claimedRewards.push(id);applyCompanionEffects(g.s.flags,{companions:['蔷薇']});const money=g.s.coins,exp=g.s.hero.exp;g.completeQuest();assert.equal(g.s.coins,money);assert.equal(g.s.hero.exp,exp);assert.deepEqual(g.partyNames,id==='g23_pickup'?['紫轩','月眉儿']:['月眉儿']);checks++;
}
const tables=[campaign.LEGACY_QUEST_IDS,...['TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN'].map(n=>campaign['REVISION_'+n+'_QUEST_IDS'])];
function old(revision,id,extra={}){const g=make(id),raw=snap(g);raw.campaignRevision=revision;raw.quest=tables[revision-1].indexOf(id);delete raw.questId;assert.ok(raw.quest>=0);raw.coins=321;raw.hero.exp=83;raw.inventory={wood_box:1};raw.flags={route:'good',companion:'蔷薇'};Object.assign(raw,extra);return raw;}
for(let revision=1;revision<=15;revision++){
 for(const id of ['g21','g22','g23','g24']){
  const raw=old(revision,id),prior=resources(raw),r=new GameEngine(restoreState(raw));assert.equal(r.q.id,id==='g22'?'g21_return':id==='g24'?'g23':id);assert.deepEqual(resources(r.s),prior);assert.equal(r.s.campaignRevision,16);if(id==='g24'){assert.equal(r.s.flags.goodMedicineLegacyUnknownFirstMeeting,true);assert.equal(r.s.ending,null);}legacyCases++;
 }
 for(const answer of [0,1]){
  const raw=old(revision,'g24',{choices:{g23:answer},done:['g23'],claimedRewards:['g23']});raw.flags.firstWoman=answer?'zi':'mei';const r=new GameEngine(restoreState(raw));assert.equal(r.q.id,'g24');assert.equal(r.s.flags.firstWoman,answer?'mei':'zi');assert.equal(r.s.flags.goodFirstZi,answer===0);assert.deepEqual(resources(r.s),resources(raw));assert.ok(!r.s.done.includes('g23_pickup'));assert.ok(!r.s.flags.goodMedicineReunited);legacyCases++;
 }
 for(const answer of [0,1]){
  const raw=old(revision,'g22',{choices:{g22:answer},claimedRewards:['g22']});raw.affection.zhen=13;const r=new GameEngine(restoreState(raw));assert.equal(r.q.id,'g22_rest');assert.equal(r.s.affection.zhen,13);assert.equal(r.s.coins,321);assert.deepEqual(r.partyNames,['纳兰真']);assert.ok(!r.s.done.includes('g22_rest'));legacyCases++;
 }
 const raw=old(revision,'gBad2',{done:['gBad1'],claimedRewards:['gBad1']});const r=new GameEngine(restoreState(raw));assert.equal(r.q.id,'gBad2');assert.equal(r.s.flags.forsake,true);assert.deepEqual(resources(r.s),resources(raw));legacyCases++;
}
// Unknown historical first talk is a real interaction with no replacement rewards/history.
for(const answer of [0,1]){
 const raw=old(15,'g24',{done:['g21','g22','g23'],claimedRewards:['g21','g22','g23']});let g=new GameEngine(restoreState(raw));const original=resources(g.s);g.s.map='m17';g.s.phase='talk';Object.assign(g.s.hero,g.scene.spawn);approach(g,answer);g=new GameEngine(restoreState(snap(g)));assert.equal(g.finishFirstMeeting(),true);assert.equal(g.q.id,'g24');assert.equal(g.s.flags.firstWoman,answer?'mei':'zi');const after=resources(g.s);delete original.hero;delete after.hero;assert.deepEqual(after,original);assert.deepEqual(g.partyNames,[]);checks++;
}
// Stale completed cursors preserve history while resuming the new continuation.
for(const id of ['g22','g24']){
 const raw=old(15,id,{choices:{g22:0,g23:1},done:[id],claimedRewards:[id]});const r=new GameEngine(restoreState(raw));assert.equal(r.q.id,id==='g22'?'g22_rest':'g24_aftermath');assert.deepEqual(resources(r.s),resources(raw));if(id==='g24'){assert.equal(r.s.flags.goodMedicineLegacyFinalDuel,true);assert.ok(!r.s.flags.goodMedicineFinalDuelWon);assert.equal(r.requireQuestFlags(),true);}checks++;
}
for(const firstWoman of ['zi','mei']){const raw=old(15,'g24');raw.flags.firstWoman=firstWoman;const r=new GameEngine(restoreState(raw));assert.equal(r.q.id,'g24');assert.equal(r.s.flags.firstWoman,firstWoman);assert.equal(Object.hasOwn(r.s.choices,'g23'),false,'valid historical summary does not fabricate a new first conversation');checks++;}
// Only explicit old bad-route history repairs its lost prerequisite summary.
for(const id of ['gBad1','gBad2']){const raw=old(15,id);const r=new GameEngine(restoreState(raw));assert.equal(r.s.flags.forsake,true);assert.equal(r.s.flags.goodTowerValleyLegacy,true);assert.equal(r.requireQuestFlags(),true);assert.ok(!r.s.flags.goodRoseBuried);assert.deepEqual(resources(r.s),resources(raw));checks++;}
{const raw=old(15,'g24');const r=restoreState(raw);assert.ok(!r.flags.forsake);assert.ok(!r.flags.goodTowerValleyLegacy,'unrelated missing flags do not manufacture bad-route history');checks++;}
// Recorded first talk repairs the branch while preserving an active ordinary final battle.
for(const answer of [0,1]){
 let g=make('g24');g.s.choices.g23=answer;g.startBattle();g.s.enemies[0].hp-=7;g.s.enemies[0].attackTimer=.45;g.s.cooldowns[0]=.3;
 const raw=snap(g);raw.campaignRevision=15;raw.flags.firstWoman=answer?'zi':'mei';g=new GameEngine(restoreState(raw));assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies[0].hp,raw.enemies[0].hp);assert.equal(g.s.enemies[0].attackTimer,.45);assert.equal(g.s.cooldowns[0],.3);assert.equal(g.s.flags.firstWoman,answer?'mei':'zi');
 const enemy=g.s.enemies[0];Object.assign(g.s.hero,g.nearestOpen(enemy.x,enemy.y));Object.assign(enemy,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;assert.equal(g.cast(0),true);assert.equal(g.s.phase,'after');const won=snap(g);g=new GameEngine(restoreState(won));assert.equal(g.canCompleteCombat(),true);const coins=g.s.coins;g.completeQuest();assert.equal(g.q.id,'g24_aftermath');assert.equal(g.s.coins,coins+15);assert.equal(g.s.completed,false);assert.equal(g.s.flags.goodMedicineFinalDuelWon,true);assert.equal(g.s.claimedRewards.filter(id=>id==='g24').length,1);checks++;
}
// Completed endings and unrelated routes retain their recorded outcome.
for(const ending of ['reunion','three','zhen_good','cult']){const raw=old(15,'g24',{ending,completed:true});const r=restoreState(raw);assert.equal(r.ending,ending);assert.equal(r.completed,true);assert.ok(!r.flags.goodMedicineLegacyUnknownFirstMeeting);checks++;}
// A missing live ending branch recovers before marking the ending node done or paid.
{
 let g=make('g24_departure');g.s.flags.staged_g24_departure=true;const before=resources(g.s);g.completeQuest();assert.equal(g.q.id,'g23');assert.equal(g.s.completed,false);assert.deepEqual(resources(g.s),before);g.s.map='m17';g.s.phase='talk';Object.assign(g.s.hero,g.scene.spawn);approach(g,1);assert.equal(g.finishFirstMeeting(),true);assert.equal(g.q.id,'g24_departure');assert.equal(g.s.flags.firstWoman,'mei');assert.equal(g.finish('invalid'),false);assert.equal(g.s.completed,false);checks++;
}

// Regression: a historical paid g22 with a lost answer must replay only the
// static answer. Exercise actual rooms and authored movement, not staged flags.
function regressionWalk(g,to){
 const trace=[g.s.map];assert.equal(g.travel(to),true,'real route to '+to);
 for(let ticks=0;ticks<28000&&g.s.map!==to;ticks++){
  const from=g.s.map,position={...g.s.hero};g.tick(.05);
  if(g.s.map!==from)trace.push(g.s.map);else assert(g.clearSegment(position,g.s.hero),'walk remains inside authored floor');
 }
 assert.equal(g.s.map,to,'walk reaches '+to);return trace;
}
function regressionStage(g){
 const id=g.q.id;g.onEvent=name=>{if(name==='stagingDialogue')g.advanceStaging();};g.beginObjective();
 assert(g.s.sequence,id+' begins its real scene');
 for(let ticks=0;ticks<22000&&g.q.id===id&&g.s.sequence;ticks++)g.tick(.05);
 assert.equal(g.s.sequence,null,id+' releases');assert.equal(g.s.flags['staged_'+id],true);
}
const replayEconomy=g=>copy({coins:g.s.coins,exp:g.s.hero.exp,affection:g.s.affection,inventory:g.s.inventory,potions:g.s.potions,elixirs:g.s.elixirs});
for(const answer of [0,1]){
 const raw=old(15,'g22',{map:'m49',choices:{},done:[],claimedRewards:['g22']});raw.affection.zhen=13;
 let g=new GameEngine(restoreState(raw));Object.assign(g.s.hero,g.scene.spawn);const economy=replayEconomy(g);
 assert.equal(g.q.id,'g21_return');assert.equal(g.s.flags.goodMedicineLegacyG22ChoicePaid,true);
 regressionStage(g);assert.equal(g.q.id,'g21_visit');
 assert.deepEqual(regressionWalk(g,g.q.map),['m49','m50','r_good_manor_infirmary']);regressionStage(g);assert.equal(g.q.id,'g22');
 assert.deepEqual(regressionWalk(g,g.q.map),['r_good_manor_infirmary','m50','r_good_manor_zhen_room']);regressionStage(g);assert.equal(g.s.phase,'choice');
 g=new GameEngine(restoreState(snap(g)));assert.equal(g.s.flags.goodMedicineLegacyG22ChoicePaid,true);assert.deepEqual(replayEconomy(g),economy);
 assert.equal(g.choose(answer),true);assert.equal(g.q.id,'g22_rest');assert.equal(g.s.flags.goodMedicineUnderstood,answer===0);assert.equal(g.s.choices.g22,answer);assert.deepEqual(replayEconomy(g),economy,'paid answer cannot pay affection, XP, money or supplies again');
 regressionStage(g);assert.equal(g.q.id,'g22_dawn');assert.equal(g.s.flags.goodMedicineMorningReady,true);assert.deepEqual(g.partyNames,['纳兰真']);assert.deepEqual(replayEconomy(g),economy);checks++;
}
for(const answer of [0,1]){
 const g=make('g22');g.s.affection.zhen=13;const before=replayEconomy(g);regressionStage(g);assert.equal(g.s.phase,'choice');assert.equal(g.choose(answer),true);assert.equal(g.q.id,'g22_rest');assert.equal(g.s.flags.goodMedicineUnderstood,answer===0);
 assert.equal(g.s.affection.zhen,before.affection.zhen+(answer===0?2:0),'a genuinely new answer keeps its authored affection');assert.equal(g.s.coins,before.coins+15);assert.equal(g.s.hero.exp,before.exp+65);checks++;
}
// A lost final-branch answer is recoverable through actual adjoining portals,
// including after a previous final victory; neither traversal invents rewards.
for(const won of [false,true])for(const answer of [0,1]){
 const raw=old(15,'g24',{map:'m70',choices:{},done:won?['g23','g24']:['g23'],claimedRewards:won?['g23','g24']:['g23']});
 let g=new GameEngine(restoreState(raw));Object.assign(g.s.hero,g.scene.spawn);const economy=replayEconomy(g),history=copy(g.s.done);assert.equal(g.q.id,'g23');
 assert.deepEqual(regressionWalk(g,'m17'),['m70','m49','m41','r_good_hanbo_road','m17']);approach(g,answer);assert.equal(g.travel('m49'),false);
 g=new GameEngine(restoreState(snap(g)));assert.equal(g.travel('m49'),false);assert.equal(g.finishFirstMeeting(),true);assert.equal(g.q.id,won?'g24_aftermath':'g24');
 assert.deepEqual(regressionWalk(g,'m70'),['m17','r_good_hanbo_road','m41','m49','m70']);assert.deepEqual(replayEconomy(g),economy);assert.deepEqual(g.s.done,history);checks++;
}

console.log(JSON.stringify({result:'PASS',checks,legacyCases,scope:'real near-person first conversation, persistence-before-dialogue, once-only result, party normalization, R1–15 migration, unknown ending recovery; no full-game fidelity claim'}));
