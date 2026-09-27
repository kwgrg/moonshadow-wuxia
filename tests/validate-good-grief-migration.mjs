import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {GameEngine,freshState,restoreState,QUESTS,MAPS} from '../public/runtime.mjs';
import * as campaign from '../public/campaign.mjs';
import {GOOD_GRIEF_IDS} from '../public/good-grief-migration.mjs';
// These bounded fixtures verify migration and production combat invariants,
// not original-game fidelity or a full browser playthrough.
const copy=x=>JSON.parse(JSON.stringify(x)),idx=id=>QUESTS.findIndex(q=>q.id===id);
const tables=[campaign.LEGACY_QUEST_IDS,...['TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN'].map(n=>campaign['REVISION_'+n+'_QUEST_IDS'])];
const funds=s=>copy({coins:s.coins,potions:s.potions,elixirs:s.elixirs,kills:s.kills,level:s.hero.level,exp:s.hero.exp,inventory:s.inventory,skills:s.skills,affection:s.affection,done:s.done,claimedRewards:s.claimedRewards,combatClaims:s.combatClaims});
const snapshot=g=>copy({...g.s,questId:g.q.id});
let identityCases=0,migrationCases=0,combatCases=0;
assert.equal(freshState().campaignRevision,17);
assert.equal(campaign.REVISION_SIXTEEN_QUEST_IDS.length,238);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(campaign.REVISION_SIXTEEN_QUEST_IDS.map(id=>[id,QUESTS[idx(id)].encounterTier]))).digest('hex'),'ffa9a8cd1b7cd4b04b5149721f70cc137d6155109550311d21b3340ee99d8e52');identityCases++;
function fixture(id){
 const s=freshState(),q=QUESTS[idx(id)];assert.ok(q,id);s.quest=idx(id);s.questId=id;s.map=q.map;s.phase='talk';
 Object.assign(s.flags,{route:'good',forsake:true,goodRoseBuried:true});s.coins=432;s.hero.exp=87;s.inventory={wood_box:1};s.affection.wei=-4;s.skills[4]=7;s.combatClaims=['a06|wave:0|enemy:0'];
 return s;
}
function old(revision,id,numeric=false){const s=fixture(id);s.campaignRevision=revision;if(numeric){s.quest=tables[revision-1].indexOf(id);assert.ok(s.quest>=0);delete s.questId;}return s;}
function settledOnce(raw,expected){const first=restoreState(raw);assert.equal(QUESTS[first.quest].id,expected);const second=restoreState({...copy(first),questId:expected});assert.equal(QUESTS[second.quest].id,expected);assert.deepEqual(funds(second),funds(first));return first;}
for(let revision=1;revision<=16;revision++)for(const numeric of [false,true]){
 for(const id of ['gBad1','gBad2']){
  const raw=old(revision,id,numeric);delete raw.flags.forsake;const before=funds(raw),s=settledOnce(raw,id);
  assert.equal(s.flags.forsake,true);assert.equal(s.flags.goodGriefLegacyNews,true);assert.deepEqual(funds(s),before);assert.ok(!s.flags.goodGriefRoadCleared);assert.ok(!s.done.includes('gBad_road'));assert.ok(!s.done.includes('gBad1_hut'));assert.ok(!s.done.includes('gBad1_burial'));
  if(id==='gBad2'){assert.equal(s.flags.goodGriefLegacyRevenge,true);assert.equal(s.flags.goodGriefLegacySingleDuel,true);assert.ok(!s.flags.goodGriefBuried);assert.ok(!s.flags.goodGriefLegacyDuel);}
  else {assert.equal(s.phase,'talk');assert.equal(s.sequence,null);}
  identityCases++;
 }
 {
  const raw=old(revision,'gBad1',numeric);raw.phase='after';raw.flags.staged_gBad1=true;raw.claimedRewards=['gBad1'];const s=settledOnce(raw,'gBad1');assert.equal(s.flags.staged_gBad1,undefined);assert.equal(s.phase,'talk');assert.deepEqual(funds(s),funds(raw));migrationCases++;
 }
 for(const [id,next] of [['gBad1','gBad1_hut'],['gBad2','gBad2_aftermath']]){
  const raw=old(revision,id,numeric);raw.done=[id];raw.claimedRewards=[id];raw.phase='after';raw.flags.companion='蔷薇';raw.flags.companions=['蔷薇'];const s=settledOnce(raw,next);assert.deepEqual(funds(s),funds(raw));assert.ok(!s.done.includes(next));assert.ok(!s.flags['staged_'+next]);assert.deepEqual(s.flags.companions,[]);assert.equal(s.flags.companion,null);if(id==='gBad2'){assert.equal(s.flags.goodGriefLegacyDuel,true);assert.ok(!s.flags.goodGriefDuelWon);}migrationCases++;
 }
 {
  const raw=old(revision,'gBad2',numeric);raw.ending='zhen_good';raw.completed=true;raw.done=['gBad2'];raw.claimedRewards=['gBad2'];const s=restoreState(raw);assert.equal(s.completed,true);assert.equal(s.ending,'zhen_good');assert.equal(QUESTS[s.quest].id,'gBad2');assert.deepEqual(funds(s),funds(raw));assert.ok(!s.flags.goodGriefLegacyDuel);migrationCases++;
 }
}
// Explicit old report identity is a compatibility summary, never a new burial receipt.
for(const numeric of [false,true]){const raw=old(16,'gBad1',numeric);raw.flags={route:'good'};const g=new GameEngine(restoreState(raw));assert.equal(g.q.id,'gBad1');assert.equal(g.s.flags.goodGriefLegacyNews,true);assert.equal(g.s.flags.goodRoseBuried,undefined);assert.equal(g.s.flags.goodTowerValleyLegacy,undefined);assert.equal(g.requireQuestFlags(),true);migrationCases++;}
// R16 allowed detours through the hut/valley while report or revenge was pending.
// Upgrading those reachable saves must retain a real walk back to the objective.
for(const id of ['gBad1','gBad2'])for(const map of ['m16','m17'])for(const numeric of [false,true]){
 const raw=old(16,id,numeric);raw.map=map;raw.phase='travel';if(id==='gBad2'){raw.done=['gBad1'];raw.claimedRewards=['gBad1'];}
 const g=new GameEngine(restoreState(raw)),prior=funds(g.s);assert.ok(g.routeTo(g.q.map).length,id+' old '+map+' has a return route');assert.equal(g.s.flags.goodGriefHutFound,undefined);assert.equal(g.s.flags.goodGriefBuried,undefined);Object.assign(g.s.hero,g.scene.spawn);const destination=g.q.map;assert.equal(g.travel(destination),true);
 for(let n=0;n<12000&&g.s.map!==destination;n++)g.tick(.05);assert.equal(g.s.map,destination,id+' old '+map+' actually walks back');assert.deepEqual(funds(g.s),prior);assert.ok(!g.s.done.includes('gBad1_hut'));migrationCases++;
}
// Late R16 saves may also be on the original opening roads or visiting the island.
// Those ordinary scenes retain their points/portals and allow the earned return.
for(const id of ['gBad1','gBad2'])for(const map of ['m1','m2','m3','m4','m6','m34']){
 const raw=old(16,id);raw.map=map;raw.phase='travel';if(id==='gBad2'){raw.done=['gBad1'];raw.claimedRewards=['gBad1'];}
 const g=new GameEngine(restoreState(raw)),before=funds(g.s),destination=g.q.map;assert.notEqual(g.scene.variant,'goodGrief',map+' keeps its ordinary scene');assert.ok(Object.keys(g.scene.portals).length,map+' keeps physical exits');assert.ok(g.routeTo(destination).length,id+' old '+map+' return route');Object.assign(g.s.hero,g.scene.spawn);assert.equal(g.travel(destination),true);
 for(let n=0;n<40000&&g.s.map!==destination;n++)g.tick(.05);assert.equal(g.s.map,destination,id+' old '+map+' actually walks home');assert.deepEqual(funds(g.s),before);assert.equal(g.s.flags.goodGriefHutFound,undefined);assert.equal(g.s.flags.goodGriefBuried,undefined);migrationCases++;
}
// A bare completed boolean or unknown ending is not a valid ending receipt.
for(const ending of [null,'invented']){const raw=old(16,'gBad2');raw.done=['gBad2'];raw.claimedRewards=['gBad2'];raw.completed=true;raw.ending=ending;const s=settledOnce(raw,'gBad2_aftermath');assert.equal(s.completed,false);assert.equal(s.ending,null);assert.deepEqual(funds(s),funds(raw));migrationCases++;}
// A new save resumes its own in-progress staging; migration cannot restart it.
for(const id of GOOD_GRIEF_IDS){assert.ok(QUESTS[idx(id)],id);const raw=fixture(id);for(const flag of QUESTS[idx(id)].requiredFlags||[])raw.flags[flag]=true;for(const group of QUESTS[idx(id)].requiredAnyFlags||[])raw.flags[group[0]]=true;const s=restoreState(raw);assert.equal(QUESTS[s.quest].id,id);assert.ok(!s.flags.goodGriefLegacyNews);assert.ok(!s.flags.goodGriefLegacyRevenge);assert.ok(!s.flags.goodGriefLegacyDuel);assert.ok(!s.flags.goodGriefLegacySingleDuel);migrationCases++;}
// R16 numeric indices after the insertion boundary still resolve by frozen identity.
for(const id of ['a01','g21','g22','g23','g24','e14']){const raw=old(16,id,true);raw.flags.route=id==='e14'?'evil':'good';delete raw.flags.forsake;raw.flags.firstWoman='zi';raw.choices.g23=0;const state=restoreState(raw);assert.equal(QUESTS[state.quest].id,id);assert.deepEqual(funds(state),funds(raw));identityCases++;}
// Precise chapter guards: stale route/forsake flags on other chapters add no grief history.
for(const [id,route,cult] of [['e14','evil',false],['e14','good',false],['g24','good',false],['gCult_epilogue','good',true]]){
 const raw=fixture(id);raw.campaignRevision=16;raw.flags.route=route;raw.flags.cultPath=cult;raw.flags.firstWoman='zi';raw.choices.g23=0;const s=restoreState(raw);assert.equal(QUESTS[s.quest].id,id);assert.ok(!s.flags.goodGriefLegacyNews);assert.ok(!s.flags.goodGriefLegacyRevenge);assert.deepEqual(funds(s),funds(raw));migrationCases++;
}
function boss(){const raw=fixture('gBad2'),q=QUESTS[idx('gBad2')];raw.flags.goodGriefLegacySingleDuel=true;for(const flag of q.requiredFlags||[])raw.flags[flag]=true;for(const group of q.requiredAnyFlags||[])raw.flags[group[0]]=true;raw.flags.staged_gBad2=true;const g=new GameEngine(raw);g.startBattle();assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].maxHp,2180);assert.equal(g.s.enemies[0].name,'纳兰潜凛');assert.equal(g.s.enemies[0].boss,true);return g;}
function oldBoss(g){const raw=snapshot(g);raw.campaignRevision=16;for(const key of Object.keys(raw.flags))if(key.startsWith('goodGrief')||key==='staged_gBad2')delete raw.flags[key];return raw;}
function lastHit(g){const enemy=g.s.enemies[0];Object.assign(g.s.hero,g.nearestOpen(enemy.x,enemy.y));Object.assign(enemy,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;assert.equal(g.cast(0),true);assert.equal(g.s.phase,'after');}
{
 let g=boss();g.s.enemies[0].hp=1731;g.s.enemies[0].attackTimer=.71;g.s.enemies[0].skillTimer=.39;g.s.cooldowns[0]=.27;g.s.hero.hp=181;const raw=oldBoss(g),prior=funds(raw);g=new GameEngine(restoreState(raw));
 assert.equal(g.q.id,'gBad2');assert.equal(g.s.phase,'battle');assert.equal(g.s.hero.hp,181);assert.equal(g.s.enemies[0].hp,1731);assert.equal(g.s.enemies[0].attackTimer,.71);assert.equal(g.s.enemies[0].skillTimer,.39);assert.equal(g.s.cooldowns[0],.27);assert.deepEqual(funds(g.s),prior);assert.equal(g.s.flags.staged_gBad2,undefined);assert.equal(g.requireQuestFlags(),true);assert.equal(g.s.flags.goodGriefLegacyRevenge,true);const progress=copy(g.s.combatProgress);g.startBattle();assert.deepEqual(g.s.combatProgress,progress);combatCases++;
 // Death persists, explicit retry clears failure, and a receipt is never paid twice.
 g.s.hero.hp=1;g.hurt(g.s.enemies[0],1);g.tick(.01);assert.equal(g.s.hero.hp,0);const dead=snapshot(g);g=new GameEngine(restoreState(dead));assert.equal(g.s.hero.hp,0);assert.equal(g.s.combatProgress.failed,true);assert.equal(g.paused,true);g.completeQuest();assert.equal(g.q.id,'gBad2');g.retry();assert.equal(g.s.phase,'battle');assert.equal(g.s.enemies[0].hp,2180);lastHit(g);const won=snapshot(g),paid=funds(g.s);g=new GameEngine(restoreState(won));assert.equal(g.canCompleteCombat(),true);assert.equal(g.s.phase,'after');assert.deepEqual(funds(g.s),paid);g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');assert.equal(g.s.completed,false);assert.equal(g.s.flags.goodGriefDuelWon,true);assert.equal(g.s.coins,paid.coins+15);assert.equal(g.s.potions,paid.potions+1);assert.equal(g.s.elixirs,paid.elixirs+1);const rewardLedger=copy(g.s.claimedRewards);g.completeQuest();assert.deepEqual(g.s.claimedRewards,rewardLedger);assert.equal(g.s.claimedRewards.filter(id=>id==='gBad2').length,1);combatCases++;
}
// An old validated pending victory continues to aftermath without replaying the boss.
{
 let g=boss();lastHit(g);const raw=oldBoss(g),prior=funds(raw);g=new GameEngine(restoreState(raw));assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.deepEqual(funds(g.s),prior);g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');assert.equal(g.s.coins,prior.coins+15);assert.equal(g.s.combatClaims.filter(k=>k==='gBad2|wave:0|enemy:0').length,1);combatCases++;
}
// Missing or malformed strict combat evidence stays failed, even with an after tag.
for(const mutate of [r=>delete r.combatProgress,r=>r.combatProgress.encounters['wave:0'].roster.pop(),r=>r.combatProgress.encounters['wave:0'].roster[0].maxHp=1]){
 const g=boss(),raw=oldBoss(g);raw.phase='after';mutate(raw);const s=restoreState(raw);assert.equal(s.combatProgress.failed,true);assert.equal(s.completed,false);assert.equal(QUESTS[s.quest].id,'gBad2');assert.deepEqual(funds(s),funds(raw));combatCases++;
}
// Pre-protocol old battles keep observable rosters and suppress unknown kill receipts.
for(const revision of [1,14]){
 const g=boss(),raw=oldBoss(g);raw.campaignRevision=revision;delete raw.combatVersion;delete raw.combatProgress;delete raw.combatClaims;raw.enemies[0].hp=1523;raw.hero.hp=189;
 let restored=new GameEngine(restoreState(raw));assert.equal(restored.s.enemies.length,1);assert.equal(restored.s.enemies[0].name,'纳兰潜凛');assert.equal(restored.s.enemies[0].hp,1523);assert.equal(restored.s.hero.hp,189);assert.equal(restored.s.combatLegacyNoKillRewards.gBad2,true);const before=funds(restored.s);lastHit(restored);assert.equal(restored.s.coins,before.coins);assert.equal(restored.s.hero.exp,before.exp);assert.equal(restored.s.kills,before.kills);combatCases++;
 const unknown=copy(raw);unknown.phase='after';unknown.enemies=[];restored=new GameEngine(restoreState(unknown));assert.equal(restored.s.phase,'talk');assert.equal(restored.canCompleteCombat(),false);assert.equal(restored.s.combatLegacyNoKillRewards.gBad2,true);assert.ok(!restored.s.done.includes('gBad2'));restored.completeQuest();assert.equal(restored.q.id,'gBad2');combatCases++;
}
// Claimed old quest receipts cannot pay again after victory settlement.
{
 let g=boss();lastHit(g);const raw=oldBoss(g);raw.claimedRewards=['gBad2'];const before=funds(raw);g=new GameEngine(restoreState(raw));g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');assert.equal(g.s.coins,before.coins);assert.equal(g.s.hero.exp,before.exp);assert.equal(g.s.potions,before.potions);assert.equal(g.s.elixirs,before.elixirs);assert.equal(g.s.flags.goodGriefDuelWon,true);combatCases++;
}
// End state has no leftover scalar or array follower assignment.
{const g=new GameEngine(fixture('gBad2_departure'));g.s.flags.companion='纳兰真';g.s.flags.companions=['纳兰真'];g.finish('zhen_good');assert.equal(g.s.flags.companion,null);assert.deepEqual(g.s.flags.companions,[]);migrationCases++;}
console.log(JSON.stringify({result:'PASS',identityCases,migrationCases,combatCases,note:'Bounded legacy fixtures and real engine combat calls; actual browser validation remains separate.'}));
