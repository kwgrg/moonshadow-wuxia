import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';
import {GOOD_ROAD_STAGING} from '../public/good-road-staging.mjs';
const copy=x=>JSON.parse(JSON.stringify(x)),snapshot=g=>({...copy(g.s),questId:g.q.id});
const economy=g=>copy({coins:g.s.coins,xp:g.s.hero.exp,inventory:g.s.inventory,affection:g.s.affection,claimed:g.s.claimedRewards,done:g.s.done});
function make(){const s=freshState();s.quest=QUESTS.findIndex(q=>q.id==='g23');s.map='m17';s.phase='talk';s.flags={route:'good',goodMedicineFarewellReady:true};return new GameEngine(s);}
function approach(g,index){const actor=g.firstMeetingMarkers().find(a=>a.index===index);assert(actor);g.interact(actor);for(let t=0;t<6000&&!g.s.sequence;t++)g.tick(.05);assert(g.s.sequence,'walk to the actual NPC starts staging');return actor;}
let restores=0,walks=0;
for(const answer of [0,1]){
 let g=make();const before=economy(g);assert.equal(g.startStaging(),false,'cannot start dialogue before choosing a person');assert.equal(g.choose(answer),false);assert.equal(g.finishFirstMeeting(),false);let committed;
 g.onEvent=name=>{if(name==='firstMeetingCommitted')committed=snapshot(g);};approach(g,answer);
 assert(committed);assert.equal(committed.choices.g23,answer);assert.equal(committed.sequence,null,'branch saved before any scene step');assert.deepEqual(economy(g),before);const leaving=answer?'good-meeting-zi':'good-meeting-mei',remaining=answer?'月眉儿':'紫轩';let departed=false,hasMoved=false;const seen=new Set();
 for(let ticks=0;ticks<14000&&g.q.id==='g23';ticks++){
  const seq=g.s.sequence;assert(seq);const definition=GOOD_ROAD_STAGING.g23,step=definition.steps[seq.step];
  assert.equal(g.finishFirstMeeting(),false,'a dialogue callback cannot bypass departure');assert.equal(g.travel('m16'),false);g.completeQuest();assert.equal(g.q.id,'g23');assert.deepEqual(economy(g),before);
  assert.equal(g.firstMeetingMarkers().length,0);assert.equal(g.companions.length,0,'no duplicate selected follower in scene');
  const leaver=seq.actors.find(a=>a.id===leaving),base=definition.actors.find(a=>a.id===leaving);if(Math.hypot(leaver.x-base.x,leaver.y-base.y)>25){hasMoved=true;walks++;}if(leaver.hidden)departed=true;
  for(const actor of g.stagingActors())assert(g.passable(actor.x,actor.y),'independent footpoint '+actor.name);
  if(!seen.has(seq.step)||(step.type==='move'&&ticks%19===0)){
   seen.add(seq.step);const save=snapshot(g);g=new GameEngine(restoreState(save));restores++;assert.equal(g.s.sequence.step,save.sequence.step);assert.deepEqual(g.s.sequence.actors,save.sequence.actors);assert.equal(g.s.flags.firstWoman,answer?'mei':'zi');assert.deepEqual(economy(g),before);
  }
  g.onEvent=name=>{if(name==='stagingDialogue')g.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.q.id,answer?'g23_farewell':'g23_pickup');assert(hasMoved&&departed,'other person actually walks out before completion');assert.deepEqual(g.partyNames,[remaining]);assert.equal(g.s.claimedRewards.filter(x=>x==='g23').length,1);assert.equal(g.s.coins,before.coins+15);const after=economy(g);assert.equal(g.finishFirstMeeting('g23'),false);assert.deepEqual(economy(g),after);
 // Pending R18 after-dialogue saves replay the new visible departure, never change first talk.
 const old={...committed,campaignRevision:18,phase:'after'};let resumed=new GameEngine(restoreState(old));assert.equal(resumed.s.sequence,null);assert.equal(resumed.finishFirstMeeting(),false);resumed.tick(.05);assert(resumed.s.sequence);assert.equal(resumed.s.choices.g23,answer);
 const corrupt=snapshot(resumed);corrupt.choices.g23=1-answer;corrupt.flags.goodFirstZi=answer===1;corrupt.flags.goodFirstMei=answer===0;corrupt.flags.firstWoman=answer?'zi':'mei';const repaired=new GameEngine(restoreState(corrupt));assert.equal(repaired.s.sequence,null,'mismatched branch cannot reuse another movement checkpoint');assert.equal(repaired.s.flags.firstWoman,answer?'zi':'mei');assert.equal(repaired.finishFirstMeeting(),false);
 const noChoice=snapshot(resumed);delete noChoice.choices.g23;const reset=new GameEngine(restoreState(noChoice));assert.equal(reset.s.sequence,null);assert.equal(reset.startStaging(),false);assert.equal(reset.firstMeetingMarkers().length,2);
}
console.log(JSON.stringify({result:'PASS',scope:'actual NPC first-talk, both visible departures, per-step/mid-walk reloads, missing/contradictory old choice, reward and path gating',restores,walks}));
