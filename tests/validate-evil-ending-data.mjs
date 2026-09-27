import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {QUESTS,REVISION_SEVENTEEN_QUEST_IDS as oldIds} from '../public/campaign.mjs';
import {EVIL_ENDING_ADDITIONS as additions,EVIL_ENDING_EVIDENCE as evidence} from '../public/evil-ending-revisions.mjs';
import {EVIL_ENDING_STAGING as stages} from '../public/evil-ending-staging.mjs';
import {GameEngine,freshState} from '../public/runtime.mjs';

const ids=['e14_report','e14_recovery','e14_letter','e14_poison','e14_mercy','e14_family','e14_zhen_fall','e14_antidote','e14_mei_fall','e14_burial','e14_sleep','e14_dream','e14_father'];
const q=id=>{const quest=QUESTS.find(q=>q.id===id);assert(quest,id+' registered');return quest;};
assert.equal(createHash('sha256').update(JSON.stringify(oldIds)).digest('hex'),'12619f7960ca2e6e4a5bc525603565d3304191432a6a79cff3d22e959fc6afad');
assert.deepEqual(QUESTS.filter(quest=>oldIds.includes(quest.id)).map(q=>q.id),oldIds,'R17 identities and relative order remain stable');
assert.equal(new Set(QUESTS.map(q=>q.id)).size,QUESTS.length);
assert.deepEqual(additions.flatMap(entry=>entry.quests.map(q=>q.id)),ids);
assert.equal(q('e14').encounterTier,20);assert.equal(q('e13').encounterTier,20);
for(const id of ids){
 const quest=q(id);assert.equal(quest.xp,0);assert.equal(quest.money,0);assert.equal(quest.suppressBattleSupplies,true);
 assert.equal(quest.requireStaging,true);assert.equal(quest.when.route,'evil');assert.equal(quest.encounterTier,20);
 assert.equal(quest.choice,undefined);assert.equal(quest.ending,undefined);
 assert.equal(quest.rewards.items,undefined);assert.equal(quest.consumeItems,undefined);assert.equal(quest.requiredItems,undefined,'letter and medicine are not inventory transactions');
 assert.equal(quest.rewards.evil,undefined);assert.equal(quest.rewards.flags.evilFinalOutcome,undefined,'static rewards cannot forge a final decision');
 assert.equal(stages[id].map,quest.map);assert.equal(quest.referencePolicy,'reference-only-no-original-content');
}
assert.deepEqual(q('e13').requiredFlags,Array.from({length:8},(_,i)=>'switch'+(i+1)));
assert.equal(q('e13').rewards.recover,true);assert.equal(q('e13').transition.map,'r_evil_final_room');
assert.deepEqual(q('e14_report').requiredAnyFlags,[['evilFinalRescued','evilFinalLegacyRescued']]);
assert.deepEqual(q('e14_recovery').requiredAnyFlags,[['evilFinalBattleWon','evilFinalLegacyBattleWon']]);
const gate=q('e14');assert.equal(gate.count,29);assert.equal(gate.enemyNames.length,29);assert.equal(gate.distributedCombat,true);assert.equal(gate.victoryTarget,undefined);assert.equal(gate.waves,undefined);assert.equal(gate.boss,null);
assert.equal(gate.enemyNames.filter(name=>name==='武林人士').length,7);assert.equal(gate.enemyNames.filter(name=>name==='武当弟子').length,6);assert.equal(gate.enemyNames.filter(name=>name==='武当道士').length,3);assert.equal(gate.enemyNames.filter(name=>name==='王姓武人').length,2);
assert.deepEqual(gate.legacyCombatCount,{flag:'evilFinalLegacyFourFight',count:4,enemy:'来犯武人'});
assert.equal(gate.xp,65);assert.equal(gate.money,15);assert.equal(gate.ending,false);assert.equal(gate.rewards.recover,true);assert.equal(gate.transition,undefined,'the player returns to the room after the gate battle');
assert.equal(q('e14_letter').playAs,'纳兰真');assert.equal(q('e14_letter').transition.map,'r_evil_final_room');assert.equal(q('e14_poison').playAs,undefined);
assert.equal(q('e14_poison').finalOutcomeCommit,true);assert.equal(q('e14_antidote').rewards.recover,undefined,'returning to ordinary appearance is not proof of resource recovery');
assert.equal(q('e14_mercy').rewards.flags.evilFinalMartialLost,true);assert.equal(q('e14_mercy').rewards.skills,undefined,'loss of martial arts is narrated, not invented stat deletion');
const dream=q('e14_dream');assert.equal(dream.count,4);assert.equal(dream.map,'r_evil_final_room');assert.equal(dream.battleScene,'evilFinalDream');assert.equal(dream.dreamCombat,true);assert.equal(dream.suppressKillRewards,true);
assert.deepEqual(dream.enemyNames,['纳兰真','月眉儿','蔷薇','紫轩']);assert.deepEqual(dream.enemySprites,[1,2,3,2]);assert.equal(dream.rewards.recover,true);assert.equal(dream.transition.map,'r_evil_father_peak');
assert.equal(q('e14_family').endingId,'family');assert.equal(q('e14_father').endingId,'alone');
for(const side of ['family','alone']){
 const game=new GameEngine(freshState());Object.assign(game.s.flags,{route:'evil',evilFinalMercy:side==='family',evilFinalCruel:side==='alone'});
 const visible=ids.filter(id=>game.matches(q(id).when));
 for(const id of ['e14_mercy','e14_family'])assert.equal(visible.includes(id),side==='family');
 for(const id of ['e14_zhen_fall','e14_antidote','e14_mei_fall','e14_burial','e14_sleep','e14_dream','e14_father'])assert.equal(visible.includes(id),side==='alone');
 game.s.flags.route='good';for(const id of ids)assert.equal(game.matches(q(id).when),false,'evil finale cannot leak into good route');
}
const letter=stages.e14_letter.steps;assert(letter.some(step=>step.type==='replace'&&step.actor==='final-kerong'&&step.target==='final-mei'));assert(letter.some(step=>step.type==='readLetter'&&step.actor==='hero'));
const text=id=>stages[id].steps.flatMap(step=>step.lines||[]).map(line=>line[1]).join('\n');
assert.match(text('e14_recovery'),/三个月/);assert.match(text('e14_family'),/五年/);assert.match(text('e14_family'),/爹，娘/);assert.match(text('e14_poison'),/参汤/);assert.match(text('e14_poison'),/断肠散/);
const child=stages.e14_family.actors.find(actor=>actor.name==='杨纳康');assert(child?.child);assert.equal(child.npcCell,null,'child uses the independently generated child art');
for(const id of ['e14_zhen_fall','e14_mei_fall'])assert(stages[id].steps.some(step=>step.type==='strike'),'two deaths are staged, not repeatable combat encounters');
assert(!stages.e14_mercy.steps.some(step=>step.type==='strike'||step.pose==='fallen'),'mercy does not invent Mei suicide');
assert(evidence.verified.length&&evidence.authored.length&&evidence.unknown.length);
console.log('Evil ending data PASS: stable R17 identities; 29-enemy gate; versioned automatic split; staged deaths; four-person dream; zero additional quest awards; evidence boundaries remain explicit.');
