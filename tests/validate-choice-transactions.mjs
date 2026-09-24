import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';
import {LEGACY_QUEST_IDS,REVISION_TWO_QUEST_IDS,REVISION_THREE_QUEST_IDS,REVISION_FOUR_QUEST_IDS} from '../public/campaign.mjs';

// State-machine checks with authored web data. These are not browser playthroughs
// and do not certify original combat, story timing, or visual fidelity.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>QUESTS.findIndex(q=>q.id===id);
const snapshot=g=>copy({...g.s,questId:g.q.id});
const budget=g=>copy({evil:g.s.flags.evil,moral:g.s.flags.moral,affection:g.s.affection,inventory:g.s.inventory,skills:g.s.skills,hp:g.s.hero.hp,mp:g.s.hero.mp,coins:g.s.coins,potions:g.s.potions,elixirs:g.s.elixirs});
let checks=0,legacyCases=0;
function create(id){
 const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id);const q=QUESTS[s.quest];s.map=q.map;s.phase='choice';s.flags.route=q.when?.route||'good';
 for(const key of q.requiredFlags||[])s.flags[key]=true;
 for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 if(q.requireStaging)s.flags['staged_'+id]=true;
 const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);return g;
}

// A bounded prior-battle fixture uses production outcomes before testing replies.
function resolveDuel(g){g.startBattle();for(let n=0;n<20&&g.s.phase==='battle';n++){if(g.encounter.scriptedLoss){g.s.hero.hp=1;g.hurt(g.s.enemies[0],1);g.tick(.01);}else{const e=g.s.enemies.find(e=>e.hp>0);for(const other of g.s.enemies)Object.assign(other,{x:1300,y:850});Object.assign(g.s.hero,g.nearestOpen(650,750));Object.assign(e,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;g.cast(0);}}assert.equal(g.s.phase,'choice');}
function stage(g){
 g.onEvent=name=>{if(name==='stagingDialogue')g.advanceStaging();};g.beginObjective();assert.equal(g.s.phase,'staging');
 for(let i=0;i<12000&&g.s.phase==='staging';i++)g.tick(.05);
 assert.equal(g.s.phase,'choice');assert.equal(g.s.flags['staged_'+g.q.id],true);
}

// Preconditions reject the whole transaction, including assignment repair.
for(const id of ['a12','e04','e06','e08','e09'])for(const recorded of [false,true]){
 for(const condition of ['away','wrong-phase','done','sequence',...(QUESTS[index(id)].requireStaging?['unstaged']:[])]){
  const g=create(id);if(recorded)g.s.choices[id]=1;
  if(condition==='away')g.s.map=g.q.map==='m49'?'m51':'m49';
  if(condition==='wrong-phase')g.s.phase='talk';
  if(condition==='done')g.s.done.push(id);
  if(condition==='sequence')g.s.sequence={questId:id};
  if(condition==='unstaged')delete g.s.flags['staged_'+id];
  const before=copy(g.s);assert.equal(g.choose(1),false,id+' '+condition);assert.deepEqual(g.s,before,'rejected choice must mutate nothing');checks++;
 }
}
for(const property of ['requiredItems','consumeItems']){
 const missingItem=create('a12'),previous=missingItem.q[property];missingItem.q[property]={wood_box:1};
 try{const before=copy(missingItem.s);assert.equal(missingItem.choose(0),false);assert.deepEqual(missingItem.s,before);}finally{if(previous===undefined)delete missingItem.q[property];else missingItem.q[property]=previous;}
 checks++;
}

// An unanswered or invalid after-state must not skip a choice or its battle.
for(const id of ['a04','g06','e04','e06','e08','e09'])for(const answer of [undefined,-1,99,'0',null])for(const away of [false,true]){
 const g=create(id);g.s.phase='after';if(answer!==undefined)g.s.choices[id]=answer;
 if(away){g.s.map=g.q.map==='m49'?'m51':'m49';g.s.phase='travel';g.s.objectiveProgress={questId:id,phase:'after',collectedIds:[]};}
 const old=snapshot(g),loaded=new GameEngine(restoreState(old)),before=copy(loaded.s);
 assert.equal(loaded.s.phase,away?'travel':loaded.q.battleBeforeChoice?'battle':'choice');if(!away&&loaded.q.battleBeforeChoice)assert.equal(loaded.s.combatProgress.failed,true);
 if(away)assert.equal(loaded.s.objectiveProgress.phase,loaded.q.battleBeforeChoice?'talk':'choice');
 loaded.completeQuest();assert.deepEqual(loaded.s,before,'no legal answer means no completion or reward');
 assert.deepEqual(budget(loaded),budget(g));assert.ok(!Object.hasOwn(loaded.s.choices,id));checks++;
}
for(const id of ['e06','e08','e09'])for(const away of [false,true]){
 const g=create(id);delete g.s.flags['staged_'+id];g.s.phase='after';
 if(away){g.s.map='m49';g.s.phase='travel';g.s.objectiveProgress={questId:id,phase:'after',collectedIds:[]};}
 const loaded=new GameEngine(restoreState(snapshot(g)));assert.equal(away?loaded.s.objectiveProgress.phase:loaded.s.phase,'talk');
 assert.ok(!loaded.s.flags['staged_'+id]);assert.ok(!loaded.s.done.includes(id));checks++;
}
// Direct completion must obey the same gate even without a restore.
for(const id of ['a04','e04','e06','e08','e09']){
 const g=create(id);g.s.phase='after';const before=copy(g.s);g.completeQuest();assert.deepEqual(g.s,before);checks++;
}

// A valid recorded answer is authoritative, even when static assignments were
// damaged. Other cumulative effects and resource balances are never replayed.
for(const spec of [
 {id:'a12',answer:0,inventory:{wood_box:1}},
 {id:'a34',answer:0,affection:{zi:7}},
 {id:'a41',answer:0,flags:{moral:9,investigatedNeedle:true}},
 {id:'e04',answer:1,flags:{evil:7}},
 ...[0,1].flatMap(answer=>[
  {id:'e06',answer,flags:{evil:7,evilQiangweiDecision:false,evilQiangweiKill:answer===0,evilQiangweiRefuse:answer===1,companion:'纳兰真'}},
  {id:'e08',answer,flags:{evil:7,evilZixuanDecision:false,evilZixuanKill:true,evilZixuanRefuse:true}},
  {id:'e09',answer,flags:{evil:7,evilManorDecision:false,evilMeiEscorted:answer===1,evilMeiAlone:answer===0,companion:'蔷薇'},affection:{mei:8}},
 ])
]){
 const g=create(spec.id);if(g.q.battleBeforeChoice)resolveDuel(g);g.s.choices[spec.id]=spec.answer;Object.assign(g.s.flags,spec.flags);Object.assign(g.s.inventory,spec.inventory);Object.assign(g.s.affection,spec.affection);
 const effects=g.q.choice.options[spec.answer].effects,before=budget(g),beforeWrong=copy(g.s);
 assert.equal(g.choose(1-spec.answer),false);assert.deepEqual(g.s,beforeWrong,'a recorded answer cannot be overwritten');
 assert.equal(g.choose(spec.answer),true);assert.notEqual(g.q.id,spec.id,'same answer resumes its consequence');
 // Ordinary task completion can retain its existing XP/money reward; the choice
 // must preserve every cumulative choice effect, including items and healing.
 assert.deepEqual({...budget(g),coins:before.coins},before);
 for(const [key,value] of Object.entries(effects?.flags||{}))assert.equal(g.s.flags[key],value);
 if(effects?.companion!==undefined)assert.equal(g.s.flags.companion,effects.companion);
 const committed=budget(g),loaded=new GameEngine(restoreState(snapshot(g)));assert.deepEqual(budget(loaded),committed);
 assert.equal(loaded.choose(spec.answer),false);assert.deepEqual(budget(loaded),committed);checks++;
}
// A stale current cursor whose task reward was already claimed may finish its
// bookkeeping, but cannot receive either choice items or task money/XP again.
{
 const g=create('a12');g.s.choices.a12=0;g.s.inventory.wood_box=1;g.s.claimedRewards=['a12'];
 const before=copy(g.s);assert.equal(g.choose(0),true);assert.equal(g.s.inventory.wood_box,1);
 assert.equal(g.s.coins,before.coins);assert.equal(g.s.hero.exp,before.hero.exp);assert.equal(g.s.hero.level,before.hero.level);
 assert.equal(g.s.claimedRewards.filter(id=>id==='a12').length,1);assert.equal(g.s.done.filter(id=>id==='a12').length,1);checks++;
}
// Invalid branch assignments in an after-state return to the original answer,
// including an away-from-map objective checkpoint. No mutation occurs on load.
for(const id of ['e06','e08','e09'])for(const away of [false,true]){
 const g=create(id);g.s.phase='after';g.s.choices[id]=1;g.s.flags.evil=12;
 if(away){g.s.map='m49';g.s.phase='travel';g.s.objectiveProgress={questId:id,phase:'after',collectedIds:[]};}
 const old=snapshot(g),loaded=new GameEngine(restoreState(old));assert.deepEqual(budget(loaded),budget(g));
 assert.equal(away?loaded.s.objectiveProgress.phase:loaded.s.phase,'choice');assert.equal(loaded.s.choices[id],1);
 assert.deepEqual(loaded.s.done,old.done);checks++;
}

// A pre-objective answer resumes the still-required fight and cannot reissue
// the selected trap, or allow a different moral choice before combat.
{
 const g=create('b04');g.s.choices.b04=0;g.s.inventory.trap=1;g.s.flags.moral=2;const before=budget(g);
 assert.equal(g.choose(1),false);assert.equal(g.choose(0),true);assert.equal(g.s.phase,'battle');assert.deepEqual(budget(g),before);
 assert.equal(g.choose(0),false);const loaded=new GameEngine(restoreState(snapshot(g)));loaded.beginObjective();assert.equal(loaded.s.phase,'battle');assert.deepEqual(budget(loaded),before);checks++;
}
// Repeated refusal and switch trial choices are intentionally not single-use.
{
 const g=create('e05');resolveDuel(g);for(let n=1;n<=3;n++){assert.equal(g.choose(1),true);assert.equal(g.refusalCount(),n);}
 assert.equal(g.s.phase,'failed');assert.equal(g.retryRefusal(),true);assert.equal(g.choose(0),true);assert.equal(g.q.id,'e06');checks++;
}
{
 const g=create('g20');g.s.flags.goodRoseNightReady=true;const affection=g.s.affection.wei;assert.equal(g.choose(1),true);assert.equal(g.q.id,'g20_return1');assert.equal(g.s.flags.goodRoseRefusal1,true);assert.equal(g.s.affection.wei,affection-1);const committed=snapshot(g);assert.equal(g.choose(1),false);assert.deepEqual(snapshot(g),committed,'the first reply is committed once before the separate walk and next call');assert.ok(!g.s.flags.forsake);checks++;
}
{
 const g=create('eSwitch6');g.s.flags.evil=0;g.s.choices.eSwitch6=1;assert.equal(g.choose(1),true);assert.equal(g.q.id,'eSwitch1');
 g.s.quest=index('eSwitch6');g.s.map=g.q.map;g.s.phase='choice';assert.equal(g.choose(0),true);assert.equal(g.s.flags.switch6,true);assert.equal(g.s.choices.eSwitch6,0);checks++;
}

// Old committed dungeon choices retain the recorded answer and score. The new
// pressure scene is still played; neither migration nor resumption invents a
// completed event or pays the original answer a second time.
const oldTables=[LEGACY_QUEST_IDS,REVISION_TWO_QUEST_IDS,REVISION_THREE_QUEST_IDS,REVISION_FOUR_QUEST_IDS];
for(let revision=1;revision<=4;revision++)for(const numeric of [false,true])for(const answer of [0,1]){
 const raw=snapshot(create('e06'));raw.campaignRevision=revision;raw.quest=oldTables[revision-1].indexOf('e06');raw.map='m71';raw.phase='after';raw.choices.e06=answer;raw.flags.evil=answer===0?-3:3;
 if(numeric)delete raw.questId;
 raw.flags.staged_e06=true;raw.objectiveProgress={questId:'e06',phase:'after',collectedIds:[]};
 const g=new GameEngine(restoreState(raw)),before=budget(g);assert.equal(g.q.id,'e06');assert.equal(g.s.choices.e06,answer);assert.equal(g.s.phase,'travel');assert.equal(g.s.objectiveProgress,null);assert.ok(!g.s.flags.staged_e06);assert.deepEqual(g.s.done,raw.done);
 g.s.map=g.q.map;g.s.phase='talk';Object.assign(g.s.hero,g.scene.spawn);stage(g);
 assert.equal(g.choose(1-answer),false);assert.equal(g.choose(answer),true);assert.equal(g.q.id,answer===0?'e06_refuse':'e06_kill');assert.deepEqual(budget(g),before);
 assert.equal(g.s.flags.evilQiangweiDecision,true);assert.ok(!g.s.flags.evilQiangweiDead);assert.ok(!g.s.done.includes(g.q.id));legacyCases++;
}

// Explicit encounter tiers remain independent of quest insertion; quests with
// no override retain the prior calculation. This mutates only this process.
{
 const g=create('e04'),q=g.q,prior=q.encounterTier;
 try{q.encounterTier=2;g.startBattle();assert.equal(g.s.enemies[0].tier,2);assert.equal(g.s.enemies[0].maxHp,190);delete q.encounterTier;const other=create('e04');other.startBattle();assert.equal(other.s.enemies[0].tier,Math.max(1,Math.floor(other.s.quest/9)+1));}
 finally{if(prior===undefined)delete q.encounterTier;else q.encounterTier=prior;}
 checks++;
}
console.log(JSON.stringify({result:'PASS',checks,legacyCases,covered:'atomic choice guards; invalid after restoration; committed answer resumption without cumulative effects; static branch repair; objective prerequisites; refusal/puzzle exceptions; old e06 choice preservation; explicit encounter tiers'}));
