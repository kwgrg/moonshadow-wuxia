import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

// Transaction checks for independently authored treatment staging. Real browser
// inspection remains necessary for actor movement, cues and narrative timing.
const ID='g08_deliver',HERB='silver_grass';
const index=id=>QUESTS.findIndex(q=>q.id===id);
const definition=STAGED_QUESTS[ID];
assert.ok(definition,'the sea-house delivery has its own staged scene');
assert.equal(QUESTS[index(ID)].requireStaging,true,'a normal talk cannot skip treatment');
const handoverIndex=definition.steps.findIndex(step=>step.type==='handover');
assert.ok(handoverIndex>=0,'the herbs change hands during the scene');
assert.deepEqual(definition.steps[handoverIndex].items,{silver_grass:12});
assert.equal(definition.steps.filter(step=>step.type==='handover').length,1);

function create(herbs=14,id=ID){
 const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.flags.route='good';
 s.inventory[HERB]=herbs;s.done=['g08'];s.claimedRewards=['g08'];
 const game=new GameEngine(s);Object.assign(game.s.hero,game.scene.spawn);return game;
}
const snapshot=game=>JSON.parse(JSON.stringify({...game.s,questId:game.q.id}));
const paid=game=>game.s.stagedHandovers?.[ID]?.[HERB]||0;
const total=game=>(game.s.inventory[HERB]||0)+paid(game);
function assertUnclaimed(game){
 assert.equal(game.s.inventory.jade_half||0,0,'jade cannot arrive before treatment finishes');
 assert.ok(!game.s.done.includes(ID));assert.ok(!game.s.claimedRewards.includes(ID));
}
function drive(game,{capture=false}={}){
 const states=[],seenWaits=new Set();
 const record=()=>{if(capture&&game.s.sequence)states.push(snapshot(game));};
 game.onEvent=name=>{
  if(name==='stagingStep')record();
  if(name==='stagingDialogue')game.advanceStaging();
 };
 if(game.s.phase!=='staging')assert.equal(game.startStaging(),true,'eligible delivery starts staging');
 else record();
 let ticks=0;
 while(game.q.id===ID&&ticks++<12000){
  if(game.s.sequence){
   assert.equal(total(game),14,'held plus delivered herbs must remain fourteen');
   assert.equal(game.s.sequence.handoverItems?.[HERB]||0,paid(game),'sequence projects the authoritative handover ledger');
   assertUnclaimed(game);
   const step=definition.steps[game.s.sequence.step];
   if(step?.type==='wait'&&game.s.sequence.elapsed>0&&!seenWaits.has(game.s.sequence.step)){
    seenWaits.add(game.s.sequence.step);record();
   }
  }
  game.tick(.05);
 }
 assert.ok(ticks<12000,'treatment must eventually release control');
 assert.equal(game.q.id,'g09');assert.equal(game.s.sequence,null);
 assert.equal(game.s.inventory[HERB],2,'fourteen herbs minus one twelve-herb handover leaves two');
 assert.equal(paid(game),12);assert.equal(total(game),14);
 assert.equal(game.s.inventory.jade_half,2);assert.equal(game.s.flags.silverGrassDelivered,true);
 assert.ok(game.s.flags['staged_'+ID]);assert.ok(game.s.done.includes(ID));assert.ok(game.s.claimedRewards.includes(ID));
 assert.notEqual(game.s.phase,'staging');
 return states;
}

// Missing one herb blocks both entry paths and trigger-based automatic entry.
for(const method of ['manual','objective','interact','automatic']){
 const game=create(11),events=[];game.onEvent=(name,data)=>events.push({name,data});
 const trigger=definition.trigger||definition.startPoint||definition.heroStart||game.scene.objective;
 Object.assign(game.s.hero,game.nearestOpen(trigger.x,trigger.y));
 if(method==='manual')assert.equal(game.startStaging(),false);
 if(method==='objective')game.beginObjective();
 if(method==='interact'){
  const marker=game.markers.find(m=>m.main&&m.kind!=='travel');assert.ok(marker);
  Object.assign(game.s.hero,game.nearestOpen(marker.x,marker.y));assert.ok(distance(game.s.hero,marker)<135);
  game.interact(marker);
 }
 if(method==='automatic')for(let i=0;i<20;i++)game.tick(.05);
 assert.equal(game.q.id,ID);assert.equal(game.s.sequence,null,method+' cannot start with eleven herbs');
 assert.equal(game.s.inventory[HERB],11);assert.equal(paid(game),0);assertUnclaimed(game);
 assert.ok(!events.some(e=>['stagingDialogue','stagingStep','interact'].includes(e.name)),method+' must not show successful treatment before eligibility');
}

// Direct completion is blocked before treatment, including outside the house.
for(const map of ['m33','m32']){
 const game=create();game.s.map=map;game.s.phase=map==='m33'?'talk':'travel';Object.assign(game.s.hero,game.scene.spawn);
 game.completeQuest();assert.equal(game.q.id,ID);assert.equal(game.s.inventory[HERB],14);assert.equal(paid(game),0);assertUnclaimed(game);
 if(map!=='m33'){assert.equal(game.startStaging(),false);game.beginObjective();assert.equal(game.q.id,ID);assert.equal(game.s.inventory[HERB],14);assert.equal(game.s.sequence,null);}
}

const baseline=create(),economy={exp:baseline.s.hero.exp,coins:baseline.s.coins};
const states=drive(baseline,{capture:true});
assert.deepEqual({exp:baseline.s.hero.exp,coins:baseline.s.coins},economy);
assert.ok(states.some(s=>s.sequence.step===handoverIndex&&s.inventory[HERB]===14),'the before-handover boundary is saved');
assert.ok(states.some(s=>s.sequence.step>handoverIndex&&s.inventory[HERB]===2),'the after-handover boundary is saved');
assert.ok(states.some(s=>Object.keys(s.sequence.cues||{}).length>0),'visible treatment cues are part of saved staging');
const covered=new Set(states.map(s=>s.sequence.step));
for(let i=0;i<definition.steps.length;i++)assert.ok(covered.has(i),'every treatment step can be resumed: '+i);

// Resume every saved step, including waits/cues. No step may replay the debit.
for(const raw of states){
 const state=restoreState(raw),resumed=new GameEngine(state);
 assert.equal(resumed.s.sequence.step,raw.sequence.step);
 assert.equal(resumed.s.inventory[HERB],raw.inventory[HERB]);
 assert.equal(paid(resumed),raw.stagedHandovers?.[ID]?.[HERB]||0);
 assert.deepEqual(resumed.s.sequence.cues||{},raw.sequence.cues||{},'presentation state survives restoration');
 assert.equal(resumed.s.sequence.elapsed,raw.sequence.elapsed);
 drive(resumed);assert.deepEqual({exp:resumed.s.hero.exp,coins:resumed.s.coins},economy);
}

// The inventory debit belongs to a persistent ledger, not the transient scene.
const afterPayment=states.find(s=>s.sequence.step>handoverIndex&&s.inventory[HERB]===2);assert.ok(afterPayment);
const withoutProjection=JSON.parse(JSON.stringify(afterPayment));delete withoutProjection.sequence.handoverItems;
const reconstructed=new GameEngine(restoreState(withoutProjection));assert.equal(reconstructed.s.sequence.handoverItems[HERB],12);drive(reconstructed);
const replayedBoundary=JSON.parse(JSON.stringify(afterPayment));replayedBoundary.sequence.step=handoverIndex;
const replayed=new GameEngine(restoreState(replayedBoundary));drive(replayed);assert.equal(replayed.s.inventory[HERB],2,'revisiting the already-paid handover step remains idempotent');

// Leaving, completing or walking during an active scene cannot bypass it.
for(const raw of [states.find(s=>s.sequence.step===handoverIndex),afterPayment]){
 const game=new GameEngine(restoreState(raw)),before=snapshot(game),exit=game.exits().find(e=>!e.locked);
 assert.ok(exit);const hero={x:game.s.hero.x,y:game.s.hero.y};Object.assign(game.s.hero,game.scene.portals[exit.to].exit);
 assert.equal(game.enterMap(exit.to),false);Object.assign(game.s.hero,hero);
 assert.equal(game.travel(exit.to),false);assert.equal(game.moveTo(hero.x+60,hero.y),false);
 game.completeQuest();assert.equal(game.q.id,ID);assert.equal(game.s.map,'m33');assert.equal(game.s.inventory[HERB],before.inventory[HERB]);assert.equal(paid(game),before.stagedHandovers?.[ID]?.[HERB]||0);assertUnclaimed(game);
 drive(game);
}

// Re-entering or reloading an already-completed handover cannot give more jade.
const completed=snapshot(baseline),repeat=new GameEngine(restoreState(completed));
assert.equal(repeat.s.inventory[HERB],2);assert.equal(repeat.s.inventory.jade_half,2);
repeat.s.quest=index(ID);repeat.s.map='m33';repeat.s.phase='talk';
assert.equal(repeat.startStaging(),false);repeat.beginObjective();repeat.completeQuest();
assert.equal(repeat.s.inventory[HERB],2);assert.equal(repeat.s.inventory.jade_half,2);assert.equal(paid(repeat),12);
assert.deepEqual({exp:repeat.s.hero.exp,coins:repeat.s.coins},economy);

// Old saves may settle a previously narrated handover once. Current saves may
// not receive free herbs, jade or a completed scene merely for lacking items.
const old=create(14,'g09'),raw=snapshot(old);raw.campaignRevision=2;
const migrated=restoreState(raw);assert.equal(migrated.inventory[HERB],2);assert.equal(migrated.inventory.jade_half,2);assert.ok(migrated.done.includes(ID));assert.ok(migrated.claimedRewards.includes(ID));
const twice=restoreState(JSON.parse(JSON.stringify({...migrated,questId:'g09'})));assert.equal(twice.inventory[HERB],2);assert.equal(twice.inventory.jade_half,2);
raw.inventory={silver_grass:11};raw.campaignRevision=3;const modern=restoreState(raw);assert.equal(modern.inventory[HERB],11);assert.equal(modern.inventory.jade_half||0,0);assert.ok(!modern.done.includes(ID));
raw.campaignRevision=2;raw.done=[];raw.claimedRewards=[];const unsupported=restoreState(raw);assert.equal(unsupported.inventory[HERB],11);assert.equal(unsupported.inventory.jade_half||0,0);

// A normal evil-route transition must skip the good-route treatment entirely.
const evil=create(14,'b07');evil.s.flags.moral=-3;evil.s.flags.evil=3;evil.s.phase='after';evil.completeQuest();
assert.equal(evil.s.flags.route,'evil');assert.ok(evil.q.id.startsWith('e'));assert.equal(evil.s.inventory[HERB],14);assert.equal(paid(evil),0);assert.ok(!evil.s.done.includes(ID));

console.log(JSON.stringify({result:'PASS',checks:'transactional handover, every-step restore, cue/wait persistence, insufficient herbs, route lock, item conservation, idempotent rewards, old/current saves and branch isolation',restoredSnapshots:states.length,coveredSteps:covered.size}));
