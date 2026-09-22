import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';

// Focused checks for the independently authored e05/e07 refusal state machine.
// Thresholds follow the recorded event audit; animation and UI need their own QA.
const index=id=>QUESTS.findIndex(q=>q.id===id);
function create(id){const s=freshState();s.quest=index(id);s.map=QUESTS[s.quest].map;s.phase='talk';s.flags.route='evil';if(id==='e07')Object.assign(s.flags,{evilZhenMissing:true,evilGateOpened:true,staged_e07:true});const game=new GameEngine(s);Object.assign(game.s.hero,game.scene.spawn);return game;}
// e07 fixtures start after the separately tested pursuit and reveal, isolating recruitment.
const snapshot=game=>JSON.parse(JSON.stringify({...game.s,questId:game.q.id}));
function enterChoice(game){
 assert.equal(game.choose(1),false,'refusal is unavailable before the duel');game.beginObjective();assert.equal(game.s.phase,'battle');assert.equal(game.s.enemies.length,1);
 // Exceptionally high damage must not invert a required story defeat.
 const enemy=game.s.enemies[0];enemy.hp=1;Object.assign(game.s.hero,{x:enemy.x,y:enemy.y});game.s.cooldowns[0]=0;game.cast(0);assert.equal(enemy.hp,1);assert.equal(game.s.phase,'battle');
 game.s.hero.hp=1;Object.assign(enemy,{x:game.s.hero.x,y:game.s.hero.y,attackTimer:0,skillTimer:100,telegraph:0,telegraphZone:null});
 for(let t=0;t<40&&game.s.phase==='battle';t++)game.tick(.05);
 assert.equal(game.s.phase,'choice','story defeat must lead to the reply, not an uncommittable after phase');assert.equal(game.s.enemies.length,0);assert.equal(game.s.failure,null);assert.ok(game.s.hero.hp>0);
}
let restoredFailures=0;
for(const [id,limit,nextId] of [['e05',3,'e06'],['e07',2,'e08']]){
 const game=create(id),rule=game.q.refusalRule;assert.deepEqual(rule,{limit,outcome:'fatal',key:id,refuseIndex:1});
 // Counts from the other confrontation must not lower this one's threshold.
 const other=id==='e05'?'e07':'e05';game.s.flags['refusal_'+other]=20;enterChoice(game);assert.equal(game.refusalCount(),0);
 const resources={exp:game.s.hero.exp,coins:game.s.coins,inventory:{...game.s.inventory}},hpBefore=game.s.hero.hp;
 game.completeQuest();assert.equal(game.q.id,id,'an unanswered offer cannot be completed directly');
 for(let n=1;n<=limit;n++){
  assert.equal(game.refusalOutcome(1),n<limit?'repeat':'fatal');assert.equal(game.choose(1),true);assert.equal(game.refusalCount(),n);assert.equal(game.q.id,id);assert.ok(!game.s.done.includes(id));assert.ok(!game.s.claimedRewards.includes(id));
  assert.deepEqual({exp:game.s.hero.exp,coins:game.s.coins,inventory:{...game.s.inventory}},resources,'refusing grants no continuation rewards');
  if(n<limit){
   assert.equal(game.s.phase,'choice');assert.equal(game.s.failure,null);assert.equal(game.s.hero.hp,hpBefore);
   const restored=new GameEngine(restoreState(snapshot(game)));assert.equal(restored.s.phase,'choice');assert.equal(restored.refusalCount(),n);assert.equal(restored.s.failure,null);assert.equal(restored.s.hero.hp,hpBefore);
   game.completeQuest();assert.equal(game.q.id,id,'a nonterminal refusal cannot masquerade as acceptance');
  }
 }
 assert.equal(game.s.phase,'failed');assert.equal(game.s.hero.hp,0);assert.equal(game.s.failure.kind,'refusal');assert.equal(game.s.failure.questId,id);assert.equal(game.s.failure.hpBefore,hpBefore);assert.equal(game.paused,true);
 assert.equal(game.choose(0),false);assert.equal(game.choose(1),false);assert.equal(game.refusalCount(),limit,'no extra answers while dead');
 for(const original of [game,new GameEngine(restoreState(snapshot(game)))]){
  assert.equal(original.s.phase,'failed');assert.equal(original.s.hero.hp,0,'loading cannot silently revive the character');assert.equal(original.paused,true);restoredFailures++;
  original.s.hero.mp=Math.min(original.s.hero.mp,original.s.hero.maxMp/2);
  const medicine={hp:original.s.hero.hp,mp:original.s.hero.mp,potions:original.s.potions,elixirs:original.s.elixirs};
  assert.equal(original.potion(),false,'medicine cannot revive a fatal story outcome');
  assert.equal(original.elixir(),false,'mana medicine is unavailable after a fatal story outcome');
  assert.deepEqual({hp:original.s.hero.hp,mp:original.s.hero.mp,potions:original.s.potions,elixirs:original.s.elixirs},medicine,'failed-state medicines neither change resources nor consume inventory');
  const dead=snapshot(original),exit=original.exits().find(e=>!e.locked);assert.ok(exit);Object.assign(original.s.hero,original.scene.portals[exit.to].exit);
  assert.equal(original.enterMap(exit.to),false);assert.equal(original.travel(exit.to),false);assert.equal(original.moveTo(original.s.hero.x+20,original.s.hero.y),false);assert.equal(original.retry(),false);assert.equal(original.startBattle(),false);
  original.beginObjective();original.completeQuest();original.tick(.05);
  assert.equal(original.q.id,id);assert.equal(original.s.phase,'failed');assert.equal(original.s.map,dead.map);assert.equal(original.s.hero.hp,0);assert.deepEqual(original.s.inventory,dead.inventory);
 }
 const retried=new GameEngine(restoreState(snapshot(game)));assert.equal(retried.retryRefusal(),true);assert.equal(retried.s.phase,'choice');assert.equal(retried.s.failure,null);assert.equal(retried.s.hero.hp,hpBefore);assert.equal(retried.refusalCount(),limit-1);assert.ok(!Object.hasOwn(retried.s.choices,id));assert.equal(retried.s.enemies.length,0,'reply retry does not replay the whole duel');
 assert.equal(retried.refusalOutcome(1),'fatal');assert.equal(retried.choose(1),true);assert.equal(retried.s.phase,'failed','the same final refusal is still fatal after retry');
 assert.equal(retried.retryRefusal(),true);assert.equal(retried.choose(0),true);assert.equal(retried.q.id,nextId);assert.equal(retried.s.failure,null);assert.ok(retried.s.done.includes(id));assert.ok(retried.s.claimedRewards.includes(id));assert.equal(retried.s.hero.hp,hpBefore);
 if(id==='e07'){assert.equal(retried.s.inventory.jade_half||0,0);assert.equal(retried.s.inventory.mother_letter||0,0);assert.equal(retried.s.flags.companion,'月眉儿');}
 const accepted=snapshot(retried);retried.s.quest=index(id);retried.s.map=QUESTS[index(id)].map;retried.s.phase='choice';retried.completeQuest();
 assert.deepEqual(retried.s.inventory,accepted.inventory);assert.equal(retried.s.coins,accepted.coins);assert.equal(retried.s.hero.exp,accepted.hero.exp,'revisiting an accepted offer cannot repay rewards');

 // Acceptance is possible after any nonfatal number of refusals, including zero.
 for(let count=0;count<limit;count++){
  const accepting=create(id);accepting.s.phase='choice';accepting.s.flags['refusal_'+id]=count;assert.equal(accepting.choose(0),true);assert.equal(accepting.q.id,nextId);assert.equal(accepting.s.failure,null);assert.ok(accepting.s.done.includes(id));
 }
 const old=create(id);old.s.phase='choice';const raw=snapshot(old);raw.campaignRevision=2;const migrated=new GameEngine(restoreState(raw));assert.equal(migrated.q.id,id);assert.equal(migrated.s.phase,'choice');assert.equal(migrated.refusalCount(),0,'legacy offers start with no fabricated refusal history');
}
console.log(JSON.stringify({result:'PASS',quests:['e05','e07'],restoredFailureChecks:restoredFailures,checks:'forced duel loss, refusal thresholds, no early rewards, persistent fatal state, blocked bypasses, reply retry, acceptance and legacy choice saves'}));
