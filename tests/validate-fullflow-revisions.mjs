import assert from 'node:assert/strict';
import {GameEngine, freshState, restoreState, QUESTS} from '../public/runtime.mjs';
import {REVISION_TWO_QUEST_IDS} from '../public/campaign.mjs';

// These checks exercise stage transitions with the actual engine. Enemy HP is
// reduced for deterministic state tests, so they do not validate combat balance,
// original-game timing, art fidelity, or the browser presentation.
let checks = 0;
function at(id) {
  const state = freshState();
  state.quest = QUESTS.findIndex(q => q.id === id);
  assert.notEqual(state.quest,-1,`missing quest ${id}`);
  state.map = QUESTS[state.quest].map;
  state.visited = [state.map];
  state.flags.route = 'evil';
  state.phase = 'talk';
  const game = new GameEngine(state);
  const events = [];
  game.onEvent = (name,data) => events.push({name,data});
  return {game,events};
}
function strike(game, enemyHp = 1) {
  const enemy = game.s.enemies.find(e => e.hp > 0);
  assert.ok(enemy,'a living opponent must exist');
  enemy.hp = enemyHp;
  Object.assign(game.s.hero,{x:enemy.x,y:enemy.y});
  game.s.cooldowns[0] = 0;
  assert.equal(game.cast(0),true,'real attack resolves the hit');
  return enemy;
}
function lose(game) {
  game.keys.clear();
  game.attackTarget = null;
  game.target = null;
  game.waypoints = [];
  game.s.flags.shield = 0;
  game.s.hero.hp = 1;
  Object.assign(game.s.enemies[0],{
    x:game.s.hero.x,y:game.s.hero.y,attackTimer:0,
    skillTimer:100,telegraph:0,telegraphZone:null,
  });
  for(let i=0;i<100 && game.s.phase==='battle' && !game.paused;i++) game.tick(.05);
}
function totalExperience(game) {
  let value=game.s.hero.exp;
  for(let level=1;level<game.s.hero.level;level++) value+=100+level*60;
  return value;
}
function completeWedding(game) {
  game.beginObjective();
  for(const [index,name] of ['方离','尚进','张惟宜'].entries()) {
    assert.equal(game.s.phase,'battle');
    assert.equal(game.s.wave,index,'each duel has its own wave');
    assert.equal(game.s.enemies.length,1,'never generate a wedding group battle');
    assert.equal(game.s.enemies[0].name,name);
    assert.equal(game.encounter.friendly,true);
    assert.equal(game.encounter.scriptedLoss,false);
    assert.equal(game.choose(0),false,'wedding choice cannot skip a duel');
    strike(game);
    assert.equal(game.s.phase,index<2?'battle':'choice');
  }
}

// Both original options retain their effects, applied once after all three bouts.
for(const [choiceIndex,evilDelta,zhenDelta] of [[0,-2,1],[1,2,0]]) {
  const {game,events}=at('e02');
  const initial={coins:game.s.coins,kills:game.s.kills};
  completeWedding(game);
  assert.equal(game.s.coins,initial.coins,'friendly bouts do not drop coins');
  assert.equal(game.s.kills,initial.kills,'friendly bouts do not count as kills');
  assert.equal(events.filter(e=>e.name==='choice').length,1);
  assert.deepEqual(events.filter(e=>e.name==='wave').map(e=>e.data.index),[2,3]);
  assert.equal(game.q.choiceSpeaker,'纳兰真');
  assert.equal(game.q.choiceSprite,1);
  assert.equal(game.s.flags.evil,0,'effects are not applied during combat');
  assert.equal(game.choose(choiceIndex),true);
  assert.equal(game.q.id,'e03_masked_duel');
  assert.equal(game.s.flags.evil,evilDelta);
  assert.equal(game.s.affection.zhen,zhenDelta);
  assert.equal(game.s.choices.e02,choiceIndex);
  assert.equal(game.choose(choiceIndex),false,'stale choice cannot apply effects again');
  assert.equal(game.s.flags.evil,evilDelta);
  assert.equal(game.s.affection.zhen,zhenDelta);
  checks++;
}

// Losing a later wedding bout cannot grant the marriage-night choice. The current
// web retry restarts the sequence, which is an adaptation rather than a claim
// about the original game's exact wedding-loss behavior.
{
  const {game,events}=at('e02');
  game.beginObjective();strike(game);
  assert.equal(game.s.enemies[0].name,'尚进');
  lose(game);
  assert.equal(game.paused,true);
  assert.equal(game.s.phase,'battle');
  assert.equal(game.q.id,'e02');
  assert.equal(events.filter(e=>e.name==='defeat').length,1);
  assert.equal(events.some(e=>e.name==='choice'),false);
  assert.equal(game.choose(1),false);
  assert.equal(game.s.done.includes('e02'),false);
  game.retry();
  assert.equal(game.paused,false);
  assert.equal(game.s.phase,'battle');
  assert.equal(game.s.enemies.length,1);
  assert.equal(game.s.wave,0);
  assert.equal(game.s.enemies[0].name,'方离');
  assert.equal(game.choose(1),false);
  for(let i=0;i<3;i++)strike(game);
  assert.equal(game.s.phase,'choice');
  assert.equal(events.filter(e=>e.name==='choice').length,1);
  checks++;
}

// Strong attacks cannot kill the story opponent and then misreport a loss. Only
// actual player defeat invokes the story-defeat callback and permits the next talk.
{
  const {game,events}=at('e03_masked_duel');
  assert.equal(game.q.when.route,'evil');
  assert.equal(game.q.forcedOutcome,'defeat');
  game.beginObjective();
  const before={coins:game.s.coins,kills:game.s.kills,xp:totalExperience(game)};
  for(let i=0;i<6;i++) {
    const enemy=strike(game);
    assert.equal(enemy.hp,1,'forced story opponent survives a lethal hit');
    assert.equal(game.s.phase,'battle');
    assert.equal(game.q.id,'e03_masked_duel');
  }
  assert.deepEqual({coins:game.s.coins,kills:game.s.kills,xp:totalExperience(game)},before);
  assert.equal(events.some(e=>['victory','scriptedLoss','ending','quest'].includes(e.name)),false);
  lose(game);
  assert.equal(game.paused,false,'story defeat must not open ordinary retry');
  assert.equal(game.s.phase,'after');
  assert.ok(game.s.hero.hp>0);
  assert.equal(game.s.enemies.length,0);
  assert.equal(events.filter(e=>e.name==='scriptedLoss').length,1);
  assert.equal(events.some(e=>e.name==='defeat'||e.name==='ending'),false);
  assert.equal(game.q.id,'e03_masked_duel','aftermath still precedes the next quest');
  game.completeQuest();
  assert.equal(game.q.id,'e03');
  assert.equal(game.s.phase,'travel','the lesson requires traveling to the valley');
  assert.equal(game.s.done.filter(id=>id==='e03_masked_duel').length,1);
  checks++;
}

// The small-house encounter identifies Zixuan before combat. A failed
// attempt remains the same encounter; both forgiveness effects survive the split.
for(const [choiceIndex,expectedEvil] of [[0,-1],[1,2]]) {
  const {game,events}=at('e04');
  assert.equal(game.q.npc,'紫轩');
  assert.ok(game.q.before.some(line=>line[0]==='杨影枫'&&line[1].includes('紫轩')));
  game.beginObjective();
  assert.equal(game.s.enemies.length,1);
  assert.equal(game.s.enemies[0].name,'紫轩');
  assert.equal(game.choose(choiceIndex),false);
  if(choiceIndex===0) {
    lose(game);assert.equal(game.paused,true);
    assert.equal(game.s.phase,'battle');assert.equal(game.q.id,'e04');
    assert.equal(events.some(e=>e.name==='choice'),false);
    game.retry();assert.equal(game.s.enemies[0].name,'紫轩');
  }
  strike(game);
  assert.equal(game.s.phase,'choice');
  assert.equal(game.q.choiceSpeaker,'紫轩');
  assert.equal(game.q.choiceSprite,2);
  assert.ok(game.q.choice.prompt.includes('紫轩'));
  assert.equal(events.filter(e=>e.name==='choice').length,1);
  assert.equal(game.choose(choiceIndex),true);
  assert.equal(game.s.flags.evil,expectedEvil);
  assert.equal(game.q.id,'e04_departure');
  assert.ok(!game.s.flags.evilHutNightComplete,'answering cannot bypass the new departure and dream');
  assert.equal(game.s.kills,0,'the surviving talk partner is not counted as killed');
  checks++;
}

// Learn before the night attack, equip/use the move, then lose and retry. Its
// proficiency and unlock history must survive retry rather than be granted anew.
{
  const {game,events}=at('e10_teaching');game.s.flags.evilLegacyManorNight=true;
  assert.equal(Object.hasOwn(game.s.skills,8),false);
  game.beginObjective();
  assert.equal(game.q.id,'e10');
  assert.equal(Object.hasOwn(game.s.skills,8),true);
  assert.equal(game.equipSkill(8,4),true,'skill is equippable before combat starts');
  assert.equal(game.s.hotbar[4],8);
  assert.equal(game.s.claimedRewards.filter(id=>id==='e10_teaching').length,1);
  assert.equal(events.filter(e=>e.name==='unlock'&&e.data.id===8).length,1);
  game.beginObjective();
  assert.equal(game.s.phase,'battle');
  const enemy=game.s.enemies[0];Object.assign(game.s.hero,{x:enemy.x,y:enemy.y});
  assert.equal(game.cast(8),true,'new move is usable in the night attack');
  const proficiency=game.s.skills[8];assert.ok(proficiency>0);
  lose(game);assert.equal(game.paused,true);
  game.retry();
  assert.equal(game.s.phase,'battle');
  assert.equal(game.s.skills[8],proficiency);
  assert.equal(game.s.hotbar[4],8);
  assert.equal(events.filter(e=>e.name==='unlock'&&e.data.id===8).length,1);
  strike(game);assert.equal(game.s.phase,'after');game.completeQuest();
  assert.equal(game.q.id,'e11');
  assert.equal(game.s.skills[8],proficiency);
  assert.equal(events.filter(e=>e.name==='unlock'&&e.data.id===8).length,1);
  checks++;
}

// Every revision-two numeric task must retain its identity after insertion. Give
// the separate e10/e13 gate requirements here so this isolates index migration.
assert.equal(REVISION_TWO_QUEST_IDS.includes('e03_masked_duel'),false);
assert.equal(REVISION_TWO_QUEST_IDS.includes('e10_teaching'),false);
for(const [oldIndex,id] of REVISION_TWO_QUEST_IDS.entries()) {
  const raw=freshState();
  raw.campaignRevision=2;raw.quest=oldIndex;
  raw.map=QUESTS.find(q=>q.id===id).map;raw.phase='talk';
  raw.skills[8]=4;
  for(let floor=1;floor<=8;floor++)raw.flags['switch'+floor]=true;
  delete raw.questId;
  const restored=restoreState(raw);
  assert.equal(QUESTS[restored.quest].id,id,`${id}: revision-two numeric index`);
  assert.equal(restored.campaignRevision,12);
}
checks++;

// An old save already at the night attack but lacking its taught move must
// actually return to the teaching step; merely moving the reward would strand it.
for(const mode of ['numeric','quest-id','away']) {
  const raw=freshState();raw.campaignRevision=2;
  raw.quest=REVISION_TWO_QUEST_IDS.indexOf('e10');
  raw.map=mode==='away'?'m49':'m51';raw.phase='battle';
  raw.flags.route='evil';
  if(mode==='quest-id')raw.questId='e10';
  delete raw.skills[8];
  const recovered=new GameEngine(restoreState(raw));
  assert.equal(recovered.q.id,'e10_teaching');
  assert.equal(recovered.s.phase,mode==='away'?'travel':'talk');
  assert.equal(Object.hasOwn(recovered.s.skills,8),false,'migration does not silently invent mastery');
  if(mode!=='away') {
    recovered.beginObjective();
    assert.equal(recovered.q.id,'e10');
    assert.equal(Object.hasOwn(recovered.s.skills,8),true);
    assert.equal(recovered.equipSkill(8,4),true);
  }
}
{
  const raw=freshState();raw.campaignRevision=2;
  raw.quest=REVISION_TWO_QUEST_IDS.indexOf('e10');raw.map='m51';
  raw.skills[8]=23;raw.hotbar[4]=8;
  const recovered=restoreState(raw);
  assert.equal(QUESTS[recovered.quest].id,'e10','already taught saves do not replay the lesson');
  assert.equal(recovered.skills[8],23);assert.equal(recovered.hotbar[4],8);
}
checks++;

console.log(JSON.stringify({result:'PASS',checks,covered:[
  '婚宴三场一对一结束后才开放婚夜选择，原善恶/好感效果不变',
  '婚宴与小筑普通失败保留战斗重试，不提前进入选择',
  '蒙面人剧情败局不能被强攻错误击杀，败后再赴落叶谷',
  '战前认出紫轩，单挑后才作原谅选择',
  '云生结海夜袭前可装备使用，重试不重授或重置熟练度',
  '全部旧revision2数字任务映射与旧e10缺技能迁移',
],note:'真实引擎状态测试；不是原版参数认证或实际浏览器通关。'},null,2));
