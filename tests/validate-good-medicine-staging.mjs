import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';
import {GOOD_MEDICINE_REUNION_STAGING as STAGES} from '../public/good-medicine-reunion-staging.mjs';
import {getStagingScene} from '../public/world.mjs';
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>QUESTS.findIndex(q=>q.id===id);
const save=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(save(g)));
const money=g=>copy({coins:g.s.coins,exp:g.s.hero.exp,inventory:g.s.inventory,potions:g.s.potions,elixirs:g.s.elixirs,affection:g.s.affection});
const matches=(actor,g)=>!actor.when||(!actor.when.flag||g.s.flags[actor.when.flag])&&(!actor.when.not||!g.s.flags[actor.when.not]);
function create(id,extra={}){
 const s=freshState(),q=QUESTS[index(id)];assert(q,id);s.quest=index(id);s.map=q.map;s.phase='talk';s.flags={route:'good',goodRoseNightComplete:true,...extra};
 for(const flag of q.requiredFlags||[])s.flags[flag]=true;
 for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 if(q.when?.flag)s.flags[q.when.flag]=true;
 if(typeof extra.goodFirstZi==='boolean'){s.choices.g23=extra.goodFirstZi?0:1;s.flags.firstWoman=extra.goodFirstZi?'zi':'mei';}
 const arriving=['g21','g21_return'].includes(id)?['蔷薇']:id==='g22_dawn'?['纳兰真']:id==='g23_pickup'?['紫轩']:id==='g23_farewell'?['月眉儿']:id==='g23_reunion'?(extra.goodFirstZi?['紫轩','月眉儿']:['月眉儿']):[];s.flags.companions=arriving;s.flags.companion=arriving[0]||null;
 s.hero.hp=177;s.hero.mp=71;s.coins=837;s.hero.exp=17;s.inventory={potion:2};s.potions=8;s.elixirs=7;
 const g=new GameEngine(s),p=STAGES[id].startPoint;Object.assign(g.s.hero,p);return g;
}
let scenes=0,reloads=0,movementReloads=0,actorsObserved=0;
const variants=Object.keys(STAGES).flatMap(id=>['g22_rest','g23_reunion','g23_recruitment','g24_aftermath','g24_departure'].includes(id)?[{id,flags:{goodFirstZi:true,goodFirstMei:false,goodMedicineUnderstood:true}},{id,flags:{goodFirstZi:false,goodFirstMei:true,goodMedicineUnderstood:false}}]:[{id,flags:{}}]);
for(const {id,flags} of variants){
 let g=create(id,flags),initial=money(g);const staged=STAGES[id],seen=new Set(),mid=new Set(),sceneKeys=new Set(),vitals=[g.s.hero.hp,g.s.hero.mp];
 assert(staged.steps.at(-1).type==='release');assert.equal(staged.map,g.q.map);g.beginObjective();assert(g.s.sequence,id+' starts');
 for(let ticks=0;ticks<18000&&g.q.id===id&&g.s.sequence;ticks++){
  const sequence=g.s.sequence,step=staged.steps[sequence.step];assert.deepEqual(money(g),initial,id+' cannot award during a scene');assert.deepEqual([g.s.hero.hp,g.s.hero.mp],vitals,id+' scene cannot change battle resources');
  assert.equal(g.s.map,staged.map,'camera scenes do not teleport the world state');assert.equal(g.companions.length,0,'arriving companions do not duplicate or reappear behind room actors');
  if(['night','day'].includes(sequence.cues.valleyCareLight))assert.equal(g.scene.atmosphere.light,sequence.cues.valleyCareLight,id+' scene light follows the earned cue');
  if(sequence.sceneKey){sceneKeys.add(sequence.sceneKey);assert.equal(g.scene.id,'staging:'+sequence.sceneKey);assert.deepEqual(g.scene.portals,{});}
  const actorIds=new Set();for(const a of g.stagingActors()){
   assert(matches(a,g),id+' branch actor remains hidden');assert(!actorIds.has(a.id),'unique visible actor');actorIds.add(a.id);assert(g.passable(a.x,a.y),id+' walkable '+a.id);actorsObserved++;
  }
  if(id==='g24_departure'){assert.equal(actorIds.has('medicine-zi'),!!flags.goodFirstZi);assert.equal(actorIds.has('medicine-rose'),!flags.goodFirstZi);}
  if(id==='g23_recruitment'||(id==='g24_aftermath'&&sequence.step===0))assert.equal(actorIds.has('medicine-zi'),!!flags.goodFirstZi,id+' branch membership');
  const key=sequence.step,shouldReload=!seen.has(key)||(step.type==='move'&&sequence.elapsed===0&&!mid.has(key)&&ticks%7===0);
  if(shouldReload){
   if(seen.has(key)){mid.add(key);movementReloads++;}seen.add(key);
   const before=save(g);g=reload(g);reloads++;assert.equal(g.q.id,id);assert.equal(g.s.phase,'staging');assert.equal(g.s.sequence?.step,before.sequence.step,id+' step survives');assert.equal(g.s.sequence.sceneKey,before.sequence.sceneKey);assert.deepEqual(g.s.sequence.cues,before.sequence.cues);
   assert.deepEqual([g.s.hero.x,g.s.hero.y],[before.hero.x,before.hero.y]);assert.deepEqual(money(g),initial);
   for(const old of before.sequence.actors){const now=g.s.sequence.actors.find(a=>a.id===old.id);assert(now);assert.deepEqual([now.x,now.y,now.pose],[old.x,old.y,old.pose]);}
   g.completeQuest();assert.equal(g.q.id,id,'unreleased stage cannot bypass prerequisite/reward');assert.equal(g.s.sequence.step,before.sequence.step);
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' releases');assert(g.s.flags['staged_'+id],id+' one stage completion');
 for(const key of sceneKeys)assert(staged.sceneKeys.includes(key));scenes+=sceneKeys.size;
 if(QUESTS[index(id)].type==='choice'){assert.equal(g.q.id,id);assert.equal(g.s.phase,'choice');assert.deepEqual(money(g),initial);g=reload(g);assert.equal(g.s.phase,'choice');for(const a of g.stagingActors())assert(matches(a,g),'final actor branch survives refresh');if(id==='g23_recruitment')assert.equal(g.stagingActors().some(a=>a.id==='medicine-zi'),!!flags.goodFirstZi);}
 else{const q=QUESTS[index(id)];assert.equal(g.s.coins,initial.coins+(q.money??15));assert.equal(g.s.hero.exp,initial.exp+(q.xp??65));assert.equal(g.s.claimedRewards.filter(qid=>qid===id).length,1,id+' claims once');}
}
for(const id of ['g21_return','g22','g22_rest','g24_aftermath']){
 const g=create(id,{goodFirstZi:true,goodMedicineUnderstood:false});g.beginObjective();const bad=save(g);bad.sequence.sceneKey='unknown-original-map';assert.equal(restoreState(bad).sequence,null,'unregistered camera cannot restore');
}
for(const key of ['goodMedicineInfirmary','goodMedicineZhenRoom','goodMedicineGarden','goodMedicineHeroRoom','goodMedicineMemorial']){
 const a=getStagingScene(key),b=getStagingScene(key);assert(a&&b);assert.deepEqual(a.portals,{});a.obstacles.push([1,2,3,4]);assert.notEqual(a.obstacles.length,b.obstacles.length,'camera geometry clones');
}
const memorial=getStagingScene('goodMedicineMemorial');assert.equal(memorial.props.length,1);assert.equal(memorial.props[0].label,'纳兰潜凛之墓');
console.log(`Good medicine staging PASS: ${variants.length} branch scenes, ${scenes} camera visits, ${reloads} restores (${movementReloads} mid-movement), ${actorsObserved} visible-footpoint observations; no native or browser claim.`);
