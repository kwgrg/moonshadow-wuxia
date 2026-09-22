import assert from 'node:assert/strict';
import {GameEngine, freshState, restoreState, QUESTS, distance} from '../public/runtime.mjs';
import {LEGACY_QUEST_IDS} from '../public/campaign.mjs';

// Independently authored behavior checks. These test encounter rules, not copied
// dialogue, animation, map assets, or a claimed percentage of original fidelity.
const questIndex = QUESTS.findIndex(q => q.id === 'a05');
assert.notEqual(questIndex, -1, '武当切磋事件存在');
const quest = QUESTS[questIndex];
assert.equal(quest.training?.requiredWins, 5, '必须赢过至少五名不同弟子');
assert.equal(quest.training?.opponents, 10, '应有十名可供选择的弟子');

function createTraining() {
  const state = freshState();
  state.quest = questIndex;
  state.map = quest.map;
  state.phase = 'talk';
  const game = new GameEngine(state);
  const events = [];
  game.onEvent = (name, detail) => events.push({name, detail});
  game.beginObjective();
  assert.equal(game.s.phase, 'training', '开场交谈结束后由玩家选择对手');
  assert.equal(game.s.training.questId, 'a05');
  assert.deepEqual(game.s.training.defeated, []);
  assert.equal(game.s.training.active, null);
  assert.equal(game.s.training.master, false);
  assert.equal(game.s.enemies.length, 0, '未选择弟子时不能自动发动群战');
  return {game, events};
}

function nearby(game, marker) {
  assert.ok(marker, '目标应当可以交互');
  const candidates = [{x:marker.x,y:marker.y}];
  for (const r of [35, 60, 90]) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      candidates.push({x:marker.x + Math.cos(angle) * r,y:marker.y + Math.sin(angle) * r * .7});
    }
  }
  const point = candidates.find(p => game.passable(p.x,p.y) && distance(p,marker) < 135);
  assert.ok(point, `${marker.name || marker.id}: 至少有一个可站立的交互位置`);
  Object.assign(game.s.hero, point);
}

function opponent(game, index) {
  return game.markers.find(m => m.kind === 'training' && m.opponentIndex === index);
}

function selectOpponent(game, index) {
  const marker = opponent(game,index);
  nearby(game,marker);
  assert.equal(game.interact(marker), true);
  assert.equal(game.s.phase,'battle');
  assert.equal(game.s.training.active,index, '战斗必须对应所选弟子');
  assert.equal(game.s.training.master,false);
  assert.equal(game.s.enemies.length,1, '切磋每次只有一名对手');
  assert.equal(game.encounter.friendly,true, '切磋不能计为杀敌战');
  return marker;
}

function winCurrentDuel(game) {
  // Isolate encounter progression from combat balance; the normal attack path
  // still performs the hit, defeat bookkeeping and state transition.
  const enemy = game.s.enemies[0];
  assert.ok(enemy);
  enemy.hp = 1;
  Object.assign(game.s.hero,{x:enemy.x,y:enemy.y});
  game.s.cooldowns[0] = 0;
  assert.equal(game.cast(0),true);
}

function loseCurrentDuel(game) {
  game.attackTarget = null;
  game.target = null;
  game.waypoints = [];
  game.keys.clear();
  game.s.hero.hp = 1;
  game.s.flags.shield = 0;
  const enemy = game.s.enemies[0];
  Object.assign(enemy,{
    x:game.s.hero.x,y:game.s.hero.y,attackTimer:0,
    skillTimer:100,telegraph:0,telegraphZone:null,
  });
  for (let step = 0; step < 40 && game.s.phase === 'battle'; step++) game.tick(.05);
}

function roundTrip(game) {
  return new GameEngine(restoreState(JSON.parse(JSON.stringify({...game.s,questId:game.q.id}))));
}

const {game,events} = createTraining();
const initialMarkers = game.markers.filter(m => m.kind === 'training');
assert.equal(initialMarkers.length,10);
assert.equal(new Set(initialMarkers.map(m => m.id)).size,10,'十人不能共用一个交互身份');
assert.deepEqual(initialMarkers.map(m => m.opponentIndex).sort((a,b) => a-b),[0,1,2,3,4,5,6,7,8,9]);
assert.equal(game.markers.some(m => m.kind === 'master'),false);
const initialKills = game.s.kills;
const initialCoins = game.s.coins;

// Any order is legal. Four wins do not unlock the master and the fifth win
// should return control to the player, without forcing the next battle.
const chosen = [7,2,9,0,5];
let firstDefeatedMarker;
for (let i = 0; i < chosen.length; i++) {
  const marker = selectOpponent(game,chosen[i]);
  if (!firstDefeatedMarker) firstDefeatedMarker = marker;
  assert.equal(game.travel('m1'),false,'切磋进行中不能离场绕过胜负');
  winCurrentDuel(game);
  assert.equal(game.s.phase,'training','弟子认输后返回自由选人');
  assert.equal(game.q.id,'a05','弟子获胜不能直接跳过张惟宜');
  assert.equal(game.s.training.active,null);
  assert.equal(game.s.training.defeated.length,i+1);
  assert.deepEqual(new Set(game.s.training.defeated),new Set(chosen.slice(0,i+1)));
  assert.equal(game.s.kills,initialKills,'友好切磋不能增加击杀');
  assert.equal(game.s.coins,initialCoins,'友好切磋不能掉落敌人银两');
  assert.equal(game.markers.some(m => m.kind === 'master'),i >= 4,'五名不同弟子胜利才解锁张惟宜');
  assert.equal(game.s.completed,false,'弟子胜利不能触发序章特殊结局');
}
assert.equal(events.some(e => e.name === 'ending'),false);
assert.equal(game.s.enemies.filter(e => e.hp > 0).length,0,'第五胜后不能自动接上张惟宜战斗');

// A stale marker from an already won bout must not manufacture another win.
nearby(game,firstDefeatedMarker);
game.interact(firstDefeatedMarker);
assert.equal(game.s.phase,'training');
assert.equal(game.s.training.defeated.length,5);
assert.equal(game.s.coins,initialCoins);
assert.equal(game.s.kills,initialKills);

// Save/loading preserves the exact opponents beaten, not just a raw counter.
const safeSave = roundTrip(game);
assert.equal(safeSave.s.phase,'training');
assert.deepEqual(new Set(safeSave.s.training.defeated),new Set(chosen));
assert.equal(safeSave.markers.some(m => m.kind === 'master'),true);

// An interrupted bout is not a defeat. Loading it restores safe selection
// without inventing a result or discarding the already earned victories.
selectOpponent(game,1);
const interruptedSave = roundTrip(game);
assert.equal(interruptedSave.s.phase,'training','未完成切磋读档应回到可选对手状态');
assert.equal(interruptedSave.s.training.active,null);
assert.equal(interruptedSave.s.training.master,false);
assert.deepEqual(new Set(interruptedSave.s.training.defeated),new Set(chosen));
assert.equal(interruptedSave.s.enemies.length,0);

// A disciple loss uses the normal defeat/retry path. Only the later master
// battle has the special story-defeat result; losing here cannot skip ahead.
loseCurrentDuel(game);
assert.equal(game.s.phase,'battle','普通弟子败战不能自动推进故事');
assert.equal(game.paused,true,'普通弟子败战应进入重试状态');
assert.equal(game.q.id,'a05');
assert.equal(game.s.training.active,1);
assert.deepEqual(new Set(game.s.training.defeated),new Set(chosen));
assert.equal(game.s.completed,false);
assert.equal(game.s.ending,null);
assert.equal(events.filter(e => e.name === 'defeat').length,1);
game.retry();
assert.equal(game.paused,false);
assert.equal(game.s.phase,'battle');
assert.equal(game.s.training.active,1,'重试必须保留当前选择的弟子');
assert.equal(game.s.training.master,false);
assert.equal(game.s.enemies.length,1);
assert.deepEqual(new Set(game.s.training.defeated),new Set(chosen));
assert.equal(game.s.kills,initialKills);
assert.equal(game.s.coins,initialCoins);
winCurrentDuel(game);
assert.equal(game.s.training.defeated.length,6);

// The remaining optional bouts remain available even after the minimum five.
for (const index of [3,4,6,8]) {
  selectOpponent(game,index);
  winCurrentDuel(game);
}
assert.equal(game.s.training.defeated.length,10,'十名弟子都应可以独立切磋');
assert.equal(game.s.coins,initialCoins);
assert.equal(game.s.kills,initialKills);
const master = game.markers.find(m => m.kind === 'master');
nearby(game,master);
assert.equal(game.interact(master),true);
assert.equal(game.s.phase,'battle');
assert.equal(game.s.training.master,true);
assert.equal(game.s.enemies.length,1,'张惟宜应为一对一挑战');
assert.equal(game.encounter.scriptedLoss,true,'正常推进保留张惟宜胜出的剧情结果');
loseCurrentDuel(game);
assert.equal(game.s.phase,'after','张惟宜胜出后继续剧情');
assert.equal(game.s.completed,false);
assert.equal(game.s.ending,null);
assert.equal(events.filter(e => e.name === 'defeat').length,1,'张惟宜败局不能再次触发普通死亡面板');
assert.equal(game.s.hero.hp,game.s.hero.maxHp,'张惟宜剧情败局恢复生命再继续');
game.completeQuest();
assert.notEqual(game.q.id,'a05','剧情败局必须能够推进到下一事件');

// A previous numeric a05 save with no training field must remain loadable.
// It has no individually recorded victories, so it cannot fabricate wins.
const legacy = freshState();
legacy.quest = LEGACY_QUEST_IDS.indexOf('a05');
legacy.map = quest.map;
legacy.phase = 'battle';
legacy.wave = 0;
delete legacy.questId;
delete legacy.campaignRevision;
delete legacy.training;
const recovered = new GameEngine(restoreState(legacy));
assert.equal(recovered.q.id,'a05');
assert.equal(recovered.s.phase,'training');
assert.deepEqual(recovered.s.training.defeated,[]);
assert.equal(recovered.s.training.active,null);
assert.equal(recovered.s.training.master,false);
assert.equal(recovered.markers.filter(m => m.kind === 'training').length,10);
assert.equal(recovered.markers.some(m => m.kind === 'master'),false);


// The former wave 1 represented five already won disciple bouts. Preserve
// that gate, while allowing a voluntary master interaction in the new system.
const legacyMaster = {...legacy,hero:{...legacy.hero},wave:1};
const migratedMaster = new GameEngine(restoreState(legacyMaster));
assert.equal(migratedMaster.s.phase,'training');
assert.deepEqual(migratedMaster.s.training.defeated,[0,1,2,3,4]);
assert.equal(migratedMaster.s.training.active,null);
assert.equal(migratedMaster.s.training.master,false);
assert.equal(migratedMaster.markers.some(m => m.kind === 'master'),true);
const legacyAfter = {...legacy,hero:{...legacy.hero},phase:'after',wave:1};
const migratedAfter = new GameEngine(restoreState(legacyAfter));
assert.equal(migratedAfter.q.id,'a05');
assert.equal(migratedAfter.s.phase,'after','已结束的旧比武不能强迫重新挑战');

// A completed sparring session survives leaving the courtyard and reloading.
migratedAfter.s.visited.push('m2');assert.equal(migratedAfter.travel('m2'),true);
const awayAfter=new GameEngine(restoreState(JSON.parse(JSON.stringify(migratedAfter.s))));
assert.equal(awayAfter.travel('m5'),true);assert.equal(awayAfter.s.phase,'after');
assert.equal(awayAfter.markers.filter(m=>m.kind==='training').length,10,'旁观弟子不应在剧情败北后消失');
console.log(JSON.stringify({result:'PASS',scenario:'武当自由切磋',checks:[
  '十名不同弟子可选且可任意顺序挑战',
  '一对一友好战斗不掉银两且不记击杀',
  '重复挑战已胜弟子不能刷门槛',
  '赢五名弟子后由玩家选择挑战张惟宜',
  '弟子败战重试原对手并保留胜场',
  '可完成其余五场可选切磋',
  '战斗存档恢复到安全选择状态',
  '旧版 a05 数字任务存档兼容',
  '张惟宜剧情败局继续故事',
]},null,2));
