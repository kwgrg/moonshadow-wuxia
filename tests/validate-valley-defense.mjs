import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS} from '../public/runtime.mjs';
import * as campaign from '../public/campaign.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import {MANOR_DEFENSE_ENEMIES,MANOR_DEFENSE_POSITIONS} from '../public/valley-defense-revisions.mjs';

// Authored state fixtures and actual engine transitions. This is not original
// gameplay, a visual audit or a claim that the earlier g13 battles are complete.
const copy=x=>JSON.parse(JSON.stringify(x)),index=id=>QUESTS.findIndex(q=>q.id===id);
const save=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(save(g)));
const totalXp=g=>g.s.hero.exp+100*(g.s.hero.level-1)+30*g.s.hero.level*(g.s.hero.level-1);
const wealth=g=>({coins:g.s.coins,xp:totalXp(g),potions:g.s.potions,elixirs:g.s.elixirs,inventory:copy(g.s.inventory)});
function create(id,flags={}){
 const s=freshState();s.quest=index(id);assert(s.quest>=0,id+' is registered');s.map=QUESTS[s.quest].map;s.phase='talk';
 s.flags={...s.flags,route:'good',...flags};s.visited=[s.map];s.coins=307;s.hero.exp=19;s.inventory={silver_grass:2};
 return new GameEngine(s);
}
let reloadSteps=0;
function stage(engine,{inspect=()=>{}}={}){
 let g=engine;const id=g.q.id,baseline=wealth(g),seen=new Set();g.beginObjective();assert.equal(g.s.phase,'staging',id);
 for(let ticks=0;ticks<18000&&g.s.sequence;ticks++){
  assert.equal(g.q.id,id);assert.deepEqual(wealth(g),baseline,'no resources before the release/complete transaction');inspect(g);
  const sequence=g.s.sequence;
  if(!seen.has(sequence.step)){
   seen.add(sequence.step);const before=copy(sequence);g=reload(g);reloadSteps++;
   assert.equal(g.s.sequence?.step,before.step);assert.deepEqual(g.s.sequence.cues,before.cues);
   for(const actor of before.actors){const next=g.s.sequence.actors.find(x=>x.id===actor.id);assert.equal(next.x,actor.x);assert.equal(next.y,actor.y);assert.equal(next.pose,actor.pose||'stand');assert.equal(!!next.hidden,!!actor.hidden);assert.equal(!!next.groundSeated,!!actor.groundSeated);}
   const activeId=g.q.id;g.completeQuest();assert.equal(g.q.id,activeId);assert.equal(g.travel('m61'),false);
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' does not deadlock');assert.equal(g.s.flags['staged_'+id],true);return g;
}
function kill(g,enemy){enemy.hp=0;g.markSkirmishDefeat(enemy,true);g.checkSkirmishOutcome();}
function walk(g,to){
 const trace=[g.s.map];assert.equal(g.travel(to),true,'route to '+to);
 for(let i=0;i<18000&&g.s.map!==to;i++){const old=g.s.map,neighbors=g.exits().filter(x=>!x.locked).map(x=>x.to);g.tick(.05);if(g.s.map!==old){assert(neighbors.includes(g.s.map));trace.push(g.s.map);}}
 assert.equal(g.s.map,to);return trace;
}
const battleId='g14_manor_battle';assert.equal(MANOR_DEFENSE_ENEMIES.length,55);assert.equal(new Set(MANOR_DEFENSE_ENEMIES.map(x=>x.id)).size,55);
assert.equal(MANOR_DEFENSE_ENEMIES.filter(x=>x.name==='无忧教男弟子').length,48);assert.equal(MANOR_DEFENSE_ENEMIES.filter(x=>x.name==='霹雳堂弟子').length,6);
assert.equal(MANOR_DEFENSE_ENEMIES.filter(x=>x.name==='丁戈').length,1);assert.equal(Object.keys(MANOR_DEFENSE_POSITIONS).length,55);
const noPrerequisite=create('g14');assert.equal(noPrerequisite.startStaging(),false);noPrerequisite.completeQuest();assert.equal(noPrerequisite.q.id,'g14');
const noResolve=create('g14_resolve');assert.equal(noResolve.startStaging(),false);noResolve.completeQuest();assert.equal(noResolve.q.id,'g14_resolve');
const noTower=create('g15');noTower.s.phase='choice';assert.equal(noTower.choose(0),false);assert.equal(noTower.s.flags.cultPath,undefined);

const noReport=create(battleId);assert.equal(noReport.startStaging(),false);
let game=create('g14_dock_report');const before=wealth(game);game=stage(game);assert.equal(game.q.id,battleId);assert.equal(game.s.flags.valleyManorReported,true);assert.deepEqual(wealth(game),before);assert.deepEqual(walk(game,'m49'),['r_mainland_dock','m41','m49']);game.completeQuest();assert.equal(game.q.id,battleId);
game=stage(game);assert.equal(game.s.phase,'battle');assert.equal(game.travel('m51'),false,'the manor is sealed after the confrontation begins');
assert.equal(game.s.enemies.length,55);assert.equal(game.s.allies.length,0);assert.equal(game.q.skirmish.criticalAllyIds,undefined);
for(const enemy of game.s.enemies){assert(game.passable(enemy.x,enemy.y));assert(Math.hypot(enemy.x-game.s.hero.x,enemy.y-game.s.hero.y)>=420);assert(game.findPath(enemy.x,enemy.y).length);}
const pristine=save(game),idle=reload(game);for(let i=0;i<40;i++)idle.tick(.05);assert(idle.s.hero.hp>0,'two initial seconds are not an unavoidable defeat');
// A real cast must use the skirmish no-loot branch, not ordinary enemy awards.
const target=game.s.enemies[0];Object.assign(target,{x:game.s.hero.x+80,y:game.s.hero.y,hp:1});assert.equal(game.cast(0),true);assert.equal(target.hp,0);assert.deepEqual(wealth(game),before);
for(const enemy of game.s.enemies.slice(1,17))kill(game,enemy);
const survivor=game.s.enemies.find(x=>x.hp>0);survivor.hp=91;const mid=save(game);game=reload(game);
assert.equal(game.s.skirmish.defeatedIds.length,17);assert.equal(game.s.enemies.filter(x=>x.hp===0).length,17);assert.equal(game.s.enemies.find(x=>x.id===survivor.id).hp,91);assert.deepEqual(wealth(game),before);
const leader=game.s.enemies.find(x=>x.id==='manor-ding-ge');kill(game,leader);assert.equal(game.s.phase,'battle','leader death does not clear the army');
const remaining=game.s.enemies.find(x=>x.hp>0);for(const enemy of game.s.enemies)if(enemy!==remaining&&enemy.hp>0)kill(game,enemy);
assert.equal(game.s.skirmish.defeatedIds.length,54);game.completeQuest();assert.equal(game.q.id,battleId);assert.equal(game.travel('m51'),false);
game=reload(game);kill(game,game.s.enemies.find(x=>x.hp>0));assert.equal(game.s.phase,'after');
// The defeated leader must not reappear as a live conversation target. The
// player examines the court and hears the hero's own departure monologue.
function aftermathMarker(g){
 const marker=g.markers.find(m=>m.id==='main');assert.ok(marker);assert.equal(marker.name,'检视山庄');assert.equal(marker.sprite,null);
 assert(g.passable(marker.x,marker.y));assert(g.findPath(marker.x,marker.y).length);
 assert.equal(g.markers.some(m=>m.name==='丁戈'&&!m.hidden&&m.pose!=='fallen'&&m.interactive!==false),false,'no conversational Ding Ge after his defeat');
 assert.equal(g.s.enemies.find(enemy=>enemy.id==='manor-ding-ge').hp,0);
}
aftermathMarker(game);const won=save(game);const victoryReload=reload(game);assert.equal(victoryReload.s.phase,'after');aftermathMarker(victoryReload);assert.deepEqual(wealth(victoryReload),before);game.completeQuest();
assert.equal(game.q.id,'g14');assert.equal(game.s.flags.manorInvadersCleared,true);assert.deepEqual(wealth(game),before,'55 kills and victory give no implicit XP/cash/supplies');
// Failed state is authoritative, including simultaneous defeat and all-clear.
let failed=new GameEngine(restoreState(pristine));for(const enemy of failed.s.enemies){enemy.hp=0;failed.markSkirmishDefeat(enemy);}
failed.s.hero.hp=0;failed.checkSkirmishOutcome();assert.equal(failed.s.skirmish.failed,true);assert.equal(failed.s.skirmish.finished,false);
failed=reload(failed);assert.equal(failed.s.hero.hp,0);assert.equal(failed.s.skirmish.failed,true);const failureBudget=wealth(failed);
assert.equal(failed.potion(),false);assert.equal(failed.elixir(),false);assert.equal(failed.cast(0),false);assert.equal(failed.travel('m51'),false);failed.completeQuest();assert.equal(failed.q.id,battleId);assert.deepEqual(wealth(failed),failureBudget);
failed.retry();assert.equal(failed.s.phase,'battle');assert.equal(failed.s.enemies.filter(x=>x.hp>0).length,55);assert.deepEqual(failed.s.skirmish.defeatedIds,[]);assert.deepEqual(wealth(failed),failureBudget);
// Malformed/missing roster data cannot turn a claimed count into victory.
const malformed=copy(mid);malformed.skirmish.defeatedIds={};malformed.enemies=[null];const repaired=new GameEngine(restoreState(malformed));assert.equal(repaired.s.skirmish.finished,false);assert.equal(repaired.s.enemies.length,55);assert(repaired.s.enemies.some(x=>x.hp>0));
const forged=copy(won);forged.hero.hp=0;forged.skirmish.failed=false;const lost=new GameEngine(restoreState(forged));assert.equal(lost.s.skirmish.failed,true);assert.equal(lost.s.skirmish.finished,false);

assert.deepEqual(walk(game,'m51'),['m49','m51']);game=reload(game);const preTeaching=wealth(game),oldLevel=game.s.hero.level,oldSkills=copy(game.s.skills);let flowing=false;
assert.equal(game.travel('r_hanbo_return'),false,'departure is closed until the actual teaching');game=stage(game,{inspect(g){
 const meng=g.s.sequence.actors.find(x=>x.id==='defense-meng');assert.equal(meng.pose,'sit');assert.equal(meng.groundSeated,true);assert.equal(!!meng.hidden,false);
 assert.equal(g.s.flags.valleyPowerReceived,undefined);if(g.s.sequence.cues.valleyPowerTransfer==='flowing')flowing=true;
}});
assert(flowing);assert.equal(game.q.id,'g14_hanbo');assert.equal(game.s.flags.valleyPowerReceived,true);assert.equal(totalXp(game)-preTeaching.xp,100000);assert(game.s.hero.level>oldLevel);assert.equal(game.s.coins,preTeaching.coins);assert.deepEqual(game.s.skills,oldSkills,'no unverified skill grant');
assert.equal(game.s.claimedRewards.filter(x=>x==='g14').length,1);assert(game.stagingActors().some(x=>x.name==='孟知秋'&&x.pose==='sit'&&x.groundSeated&&!x.hidden));
const afterTeaching=wealth(game);game=reload(game);assert.deepEqual(wealth(game),afterTeaching);const repeat=reload(game);repeat.s.quest=index('g14');repeat.s.map='m51';repeat.s.phase='talk';repeat.beginObjective();repeat.completeQuest();assert.deepEqual(wealth(repeat),afterTeaching);
assert.equal(game.travel('m61'),false,'tower cannot bypass searching the hut');assert.deepEqual(walk(game,'r_hanbo_return'),['m51','r_hanbo_return']);game=stage(game);assert.equal(game.q.id,'g14_resolve');assert.equal(game.s.flags.valleyHanboReached,true);assert.equal(game.travel('m61'),false);assert.deepEqual(walk(game,'m16'),['r_hanbo_return','m16']);game=stage(game);
assert.equal(game.q.id,'g15');assert.equal(game.s.flags.valleyRescueResolved,true);assert.deepEqual(wealth(game),afterTeaching);assert.deepEqual(walk(game,'m61'),['m16','r_hanbo_return','m61']);
assert.equal(game.q.refusalRule.limit,3);assert.equal(game.q.refusalRule.outcome,'continue');
// v11 cursors map by stable IDs. Historical completion is not a new award or a
// fabricated staged scene; pending old g14 must enter the new manor battle.
assert.equal(freshState().campaignRevision,12);assert(Array.isArray(campaign.REVISION_ELEVEN_QUEST_IDS));
for(const numeric of [false,true])for(const id of ['g14','g15']){
 const raw=save(create(id));raw.campaignRevision=11;raw.flags={route:'good',moral:0,evil:0};raw.map=id==='g14'?'m51':'m61';raw.coins=421;raw.hero.exp=37;if(id==='g15'){raw.phase='choice';raw.flags.refusal_g15=2;}
 if(numeric){delete raw.questId;raw.quest=campaign.REVISION_ELEVEN_QUEST_IDS.indexOf(id);}if(id==='g15'){raw.done=['g14'];raw.claimedRewards=['g14'];}
 const migrated=new GameEngine(restoreState(raw));assert.equal(migrated.s.coins,421);assert.equal(totalXp(migrated),37);assert.equal(migrated.s.flags.staged_g14,undefined);assert.equal(migrated.s.flags.staged_g14_manor_battle,undefined);
 if(id==='g14'){assert.equal(migrated.q.id,'g14_dock_report');assert.equal(migrated.s.flags.valleyDefenseLegacy,undefined);assert.equal(migrated.s.done.includes(battleId),false);}
 else{assert.equal(migrated.q.id,'g15');assert.equal(migrated.s.flags.valleyDefenseLegacy,true);assert.equal(migrated.s.done.includes(battleId),false);assert.equal(migrated.s.done.includes('g14_resolve'),false);assert.equal(migrated.s.flags.refusal_g15,2);}
 assert.deepEqual(wealth(reload(migrated)),wealth(migrated),'migration is idempotent');if(id==='g14'&&!numeric)assert.deepEqual(walk(migrated,'r_mainland_dock'),['m51','m49','m41','r_mainland_dock'],'old pending teaching can reach the dock report without being trapped in the valley');
}
const oldDone=save(create('g14'));oldDone.campaignRevision=11;oldDone.done=['g14'];oldDone.claimedRewards=['g14'];const historical=new GameEngine(restoreState(oldDone));assert.equal(historical.q.id,'g15');assert.equal(historical.s.flags.valleyDefenseLegacy,true);assert.equal(totalXp(historical),19);
const evil=save(create('e10'));evil.skills[8]=0;evil.campaignRevision=11;evil.flags.route='evil';const evilLoaded=new GameEngine(restoreState(evil));assert.equal(evilLoaded.q.id,'e10');assert.equal(evilLoaded.s.flags.valleyDefenseLegacy,undefined);
const cult=save(create('gCult_wudang',{cultPath:true}));cult.campaignRevision=11;const cultLoaded=new GameEngine(restoreState(cult));assert.equal(cultLoaded.q.id,'gCult_wudang');assert.equal(cultLoaded.s.done.includes(battleId),false);
// The engine's 99-level and stored-XP cap must survive this large, legitimate
// reward. These are web growth boundaries, not original-level assertions.
for(const initialXp of [0,999950]){
 let capped=create('g14',{manorInvadersCleared:true});Object.assign(capped.s.hero,{level:99,exp:initialXp,maxHp:4024,hp:4024,maxMp:1650,mp:1650});
 capped=stage(capped);assert.equal(capped.s.hero.level,99);assert.equal(capped.s.hero.exp,Math.min(999999,initialXp+100000));assert.equal(capped.s.hero.maxHp,4024);assert.equal(capped.s.hero.maxMp,1650);
 const cappedBudget=wealth(capped),maxima={hp:capped.s.hero.maxHp,mp:capped.s.hero.maxMp};capped=reload(capped);assert.deepEqual(wealth(capped),cappedBudget);assert.equal(capped.s.hero.level,99);assert.deepEqual({hp:capped.s.hero.maxHp,mp:capped.s.hero.maxMp},maxima);
}
console.log(JSON.stringify({result:'PASS',enemies:55,stageReloadCheckpoints:reloadSteps,transmissionXp:100000,legacyNumericAndStableIds:true,note:'Engine contract checks; no original gameplay/fidelity claim.'}));
