import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {EVIL_ENDING_STAGING as stages} from '../public/evil-ending-staging.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';

// Explicit state/position fixtures exercise production staging and restore.
// They are not natural playthroughs or proof of fidelity to the original game.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>{const n=QUESTS.findIndex(q=>q.id===id);assert(n>=0,id);return n;};
const snapshot=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(snapshot(g)));
const resources=g=>copy({coins:g.s.coins,exp:g.s.hero.exp,level:g.s.hero.level,hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina,inventory:g.s.inventory,potions:g.s.potions,elixirs:g.s.elixirs,kills:g.s.kills,skills:g.s.skills,affection:g.s.affection});
function create(id,claimed=false){
 if(id==='e14_father'){
  // Father-memorial entry requires an actual archived dream outcome, not a flag.
  const g=create('e14_dream');g.s.flags.staged_e14_dream=true;g.startBattle();assert.equal(g.s.phase,'battle');
  g.s.hero.hp=1;g.hurt(g.s.enemies[0],1);g.tick(.01);assert.equal(g.q.id,'e14_father');assert.equal(g.hasDreamCombatOutcome('e14_dream'),true);
  Object.assign(g.s.hero,{hp:177,mp:71,stamina:44});if(claimed)g.s.claimedRewards.push(id);Object.assign(g.s.hero,stages[id].startPoint);return g;
 }
 const s=freshState(),q=QUESTS[index(id)];s.quest=index(id);s.map=q.map;s.phase='talk';s.flags={...s.flags,route:'evil',companions:[],companion:null};
 for(const flag of q.requiredFlags||[])s.flags[flag]=true;
 for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 if(q.when?.flag){s.flags[q.when.flag]=true;s.flags.evilFinalOutcome=q.when.flag==='evilFinalMercy'?'family':'alone';s.flags.evilFinalModel='web-v1';}
 Object.assign(s.hero,{level:20,exp:17,hp:177,mp:71,stamina:44});s.coins=837;s.inventory={silver_grass:2};s.potions=8;s.elixirs=7;
 if(claimed)s.claimedRewards.push(id);
 const g=new GameEngine(s);Object.assign(g.s.hero,stages[id].startPoint);return g;
}
const checks={scenes:0,restores:0,movingRestores:0,poseRestores:0,footpoints:0,paths:0,gates:0};
const checkpoints=new Map();let poisonBefore=null,poisonDuring=null,graveBefore=null;
function checkWorld(g,id){
 assert.equal(g.s.map,stages[id].map,'camera does not change actual map');assert.equal(g.companions.length,0,id+' no duplicate followers');
 assert(g.passable(g.s.hero.x,g.s.hero.y),id+' hero floor');checks.footpoints++;
 for(const actor of g.stagingActors()){
  assert(g.passable(actor.x,actor.y),id+' actor floor '+actor.id);checks.footpoints++;
  if(actor.pose==='fallen')assert.equal(actor.interactive,false,'a body is never a living interaction target');
 }
 if(id==='e14_dream')assert.equal(g.scene.id,'dream:evilFinalDream','dream actors use their actual independent dream ground');
 if(id==='e14_burial')assert.equal(g.scene.props.filter(p=>p.kind==='grave').length,g.s.sequence.cues.evilFinalGraves==='buried'?2:0,'graves appear only after the burial step');
}
for(const claimed of [false,true])for(const id of Object.keys(stages)){
 let g=create(id,claimed);const stage=stages[id],q=g.q,initial=resources(g),seen=new Set(),midpoints=new Set(),origins=new Map();
 assert.equal(STAGED_QUESTS[id],stage);assert.equal(stage.steps.at(-1).type,'release');
 const marker=g.markers.find(m=>m.id==='staging-start');assert(marker?.main&&marker.paintOnly,id+' has a visible entry point');
 g.completeQuest();assert.equal(g.q.id,id,'unplayed staging cannot be skipped');assert.deepEqual(resources(g),initial);
 g.beginObjective();assert(g.s.sequence,id+' enters staging');checks.scenes++;
 for(let tick=0;tick<18000&&g.q.id===id&&g.s.sequence;tick++){
  const seq=g.s.sequence,step=stage.steps[seq.step],key=seq.step;assert.deepEqual(resources(g),initial,id+' choreography cannot grant rewards or recover resources');checkWorld(g,id);
  if(id==='e14_poison'){assert.equal(g.s.flags.evilFinalOutcome,undefined,'branch cannot commit before the complete poisoning scene');if(!claimed&&!poisonBefore)poisonBefore=snapshot(g);if(!claimed&&g.s.hero.pose==='ill'&&!poisonDuring)poisonDuring=snapshot(g);}
  if(id==='e14_burial'&&!claimed&&!graveBefore)graveBefore=snapshot(g);
  let mid=false;
  if(step.type==='move'){
   const a=g.stagingActor(step.actor);if(!origins.has(key))origins.set(key,{x:a.x,y:a.y});
   mid=!midpoints.has(key)&&distance(a,origins.get(key))>12;
  }else if(step.type==='pose')mid=!midpoints.has(key)&&seq.elapsed>0&&seq.elapsed<(step.duration||.5);
  if(!seen.has(key)||mid){
   if(mid){midpoints.add(key);if(step.type==='move')checks.movingRestores++;else checks.poseRestores++;}
   if(!seen.has(key))for(const actor of g.stagingActors())if(distance(g.s.hero,actor)>1){const path=g.findPath(actor.x,actor.y);if(id==='e13'&&actor.id==='final-zhen'&&seq.cues.evilFinalTowerDoor!=='open')assert.equal(path.length,0,'a closed physical cell prevents walking to the captive');else{assert(path.length,id+' path to '+actor.id);assert(distance(path.at(-1),actor)<35);}checks.paths++;}
   seen.add(key);const before=snapshot(g);if(!claimed&&!checkpoints.has(id))checkpoints.set(id,before);
   g=reload(g);checks.restores++;assert.equal(g.q.id,id);assert.equal(g.s.phase,'staging');assert.equal(g.s.sequence.step,before.sequence.step);assert.equal(g.s.sequence.heroPose,before.sequence.heroPose,id+' hero posture at exact step');assert.deepEqual(g.s.sequence.cues,before.sequence.cues);
   assert.deepEqual(resources(g),initial);assert.deepEqual([g.s.hero.x,g.s.hero.y],[before.hero.x,before.hero.y],'reload keeps the moving hero at the saved floor point');
   for(const actor of before.sequence.actors){const restored=g.s.sequence.actors.find(a=>a.id===actor.id);assert(restored);assert.deepEqual([restored.x,restored.y,restored.pose,!!restored.hidden],[actor.x,actor.y,actor.pose,!!actor.hidden]);}
   checkWorld(g,id);g.completeQuest();assert.equal(g.q.id,id,'running scene cannot be force-completed');assert.equal(g.s.sequence.step,before.sequence.step);
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' every movement finishes');assert.equal(g.s.flags['staged_'+id],true);assert.equal(seen.size,stage.steps.length,id+' every step observed');
 if(['e14','e14_dream'].includes(id)){
  assert.equal(g.q.id,id);assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies.length,q.count);assert.equal(g.canCompleteCombat(),false);assert.equal(g.s.done.includes(id),false);assert.equal(g.s.claimedRewards.includes(id),claimed);assert.deepEqual(resources(g),initial);
  if(id==='e14')assert.equal(g.stagingActors().filter(a=>a.name==='山庄家丁').length,4,'four non-combat household actors are not escort victory targets');
  else assert.equal(g.stagingActors().length,0,'dream actors hand off to four live opponents without duplicates');
  const roster=copy(g.s.enemies);g=reload(g);assert.equal(g.s.phase,'battle');assert.deepEqual(g.s.enemies,roster);assert.deepEqual(resources(g),initial);continue;
 }
 const expected={...initial,coins:initial.coins+(claimed?0:q.money??15),exp:initial.exp+(claimed?0:q.xp??65)};
 if(q.rewards.recover&&(!claimed||id==='e13'||id==='e14'||q.dreamCombat)){expected.hp=g.s.hero.maxHp;expected.mp=g.s.hero.maxMp;expected.stamina=100;}
 assert.deepEqual(resources(g),expected,id+' completion grants only explicit effects');assert.equal(g.s.done.filter(value=>value===id).length,1);assert.equal(g.s.claimedRewards.filter(value=>value===id).length,1);
 if(q.transition)assert.equal(g.s.map,q.transition.map);
 if(id==='e14_poison'){assert.equal(g.s.flags.evilFinalOutcome,'family');assert.equal(g.s.flags.evilFinalModel,'web-v1');assert.equal(g.q.id,'e14_mercy');}
 if(q.endingId){assert.equal(g.s.ending,q.endingId);assert.equal(g.s.completed,true);}
 const done=snapshot(g);g=reload(g);g=reload(g);assert.equal(g.s.quest,done.quest);assert.deepEqual(resources(g),expected,'completion reload cannot pay again');assert.equal(g.s.claimedRewards.filter(value=>value===id).length,1);
}

// A missing tower switch blocks starting, direct completion and resume; it must
// not merely prevent the reward after already showing a successful rescue.
for(const flag of QUESTS[index('e13')].requiredFlags){
 const g=create('e13');delete g.s.flags[flag];const before=resources(g);
 assert.equal(g.startStaging(),false);g.beginObjective();g.completeQuest();assert.equal(g.s.sequence,null);assert.equal(g.q.id,'e13');assert.deepEqual(resources(g),before);
 const raw=copy(checkpoints.get('e13'));delete raw.flags[flag];assert.equal(restoreState(raw).sequence,null);checks.gates+=4;
}
for(const id of Object.keys(stages))for(const group of [...(QUESTS[index(id)].requiredFlags||[]).map(flag=>[flag]),...(QUESTS[index(id)].requiredAnyFlags||[])]){
 if(group.some(flag=>['evilFinalCruel','evilFinalMercy'].includes(flag)))continue; // The authoritative saved outcome repairs these derived flags.
 const g=create(id);for(const flag of group)delete g.s.flags[flag];assert.equal(g.startStaging(),false);g.completeQuest();assert.equal(g.q.id,id);checks.gates+=2;
}
assert(poisonBefore&&poisonDuring);
{
 const raw=copy(poisonBefore);raw.sequence.heroPose='ill';raw.hero.pose='ill';const restored=restoreState(raw);assert.equal(restored.sequence.heroPose,'stand','future illness cannot be injected before the authored pose');assert.equal(restored.hero.pose,'stand');
 const rawIll=copy(poisonDuring);rawIll.sequence.heroPose='stand';rawIll.hero.pose='stand';const restoredIll=restoreState(rawIll);assert.equal(restoredIll.sequence.heroPose,'ill','earned illness is derived from the played pose even if the raw pose lies');assert.equal(restoredIll.hero.pose,'ill');
 const wrong=copy(poisonDuring);wrong.sequence.heroPose='unknown-pose';assert.equal(restoreState(wrong).sequence.heroPose,'ill');checks.gates+=3;
}
{
 const raw=copy(graveBefore);raw.sequence.cues.evilFinalGraves='buried';const g=new GameEngine(restoreState(raw));assert.equal(g.s.sequence.cues.evilFinalGraves,undefined);assert.equal(g.scene.props.filter(p=>p.kind==='grave').length,0,'future burial cannot appear on load');checks.gates++;
}
console.log(JSON.stringify({result:'PASS',...checks,scope:'R18 authored scene, floor, atomic branch and exact-pose restoration checks; browser and native fidelity remain separate'}));
