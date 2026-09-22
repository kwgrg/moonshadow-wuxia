import {npcCellFor} from '../public/renderer-v3.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameEngine, freshState, restoreState, QUESTS, MAPS, distance} from '../public/runtime.mjs';
import {getScene} from '../public/world.mjs';

// These assertions check specific, source-reviewed events, not a similarity score.
const quest=id=>QUESTS.find(q=>q.id===id);
const compact=text=>text.replace(/[。；;\s]/g,'');
const knownFixes=()=>{
 assert.equal(quest('a18').count,1,'卓非凡切磋应是一对一');
 assert.equal(quest('a18').friendly,true,'切磋不应按杀敌处理');
 assert.equal(quest('a50').playAs,'纳兰真','此处由真儿保护失去武功的影枫');
 assert.notEqual(quest('a50').enemy,'纳兰真','同伴不能被错配为敌人');
 assert.equal(quest('b06').scriptedLoss,true,'孟知秋比武是剧情败局');
 assert.equal(quest('b07').type,'talk','告知比武结果应为交谈');
 for(const q of QUESTS.filter(q=>q.revised)){
  assert.ok(q.sources?.length,`${q.id}: 缺少核对来源`);
  for(const [,text] of q.before)assert.notEqual(compact(text),compact(q.objective),`${q.id}: 将任务指令当对白`);
  assert.ok(q.after.every(v=>!v[1].includes('此间事了')),`${q.id}: 空泛结尾`);
 }
};

const engine=new GameEngine(),sceneSignatures=new Set(),art=new Set();
let reachablePoints=0;
for(const [id,region] of Object.entries(MAPS)){
 const scene=getScene(id,region);art.add(scene.art);
 assert.ok(fs.existsSync(new URL(`../public/assets/${scene.art}.png`,import.meta.url)),`${id}: 缺场景图片`);
 assert.ok(scene.obstacles.length>=2,`${id}: 没有可辨识的地形阻挡`);
 assert.ok(scene.points.length>=2,`${id}: 缺少探索内容`);
 sceneSignatures.add(JSON.stringify([scene.bounds,scene.paths,scene.obstacles,scene.points.map(p=>[p.x,p.y])]));
 engine.s.map=id;engine.s.hero={...engine.s.hero,...scene.spawn};engine.s.phase='travel';
 assert.ok(engine.passable(scene.spawn.x,scene.spawn.y),`${id}: 出生点在障碍中`);
 for(const p of [scene.objective,scene.exit,...scene.points]){
  engine.s.hero={...engine.s.hero,...scene.spawn};
  assert.ok(engine.approach(p),`${id}: ${p.name||'主线/出口'} 无法接近`);
  // Check every segment, so paths cannot silently cut through collision corners.
  let previous={...scene.spawn};
  for(const next of [engine.target,...engine.waypoints]){
   assert.ok(engine.clearSegment(previous,next),`${id}: 路径穿过实心障碍`);previous=next;
  }
  assert.ok(distance(previous,p)<135,`${id}: 交互点距离不足`);reachablePoints++;
 }
}
assert.ok(sceneSignatures.size>=20,'仅改名字或颜色不能算不同场景布局');

// An optional chest can be opened once, survives save/load and cannot be farmed.
const chestGame=new GameEngine(),chest=chestGame.scene.points.find(p=>p.kind==='chest');
assert.ok(chest);chestGame.s.hero={...chestGame.s.hero,...chestGame.nearestOpen(chest.x-40,chest.y+35)};
const money=chestGame.s.coins,potions=chestGame.s.potions;
chestGame.interact(chest);chestGame.interact(chest);
assert.equal(chestGame.s.coins,money+(chest.reward?.coins||0));
assert.equal(chestGame.s.potions,potions+(chest.reward?.potions||0));
const saved=restoreState(JSON.parse(JSON.stringify({...chestGame.s,questId:chestGame.q.id})));
assert.ok(saved.opened.includes(chestGame.s.map+':'+chest.id));

// Search objects can be found in any order; saved progress identifies real objects.
const searchGame=new GameEngine();searchGame.s.quest=QUESTS.findIndex(q=>q.type==='search'&&(q.count||1)>2);
searchGame.s.map=searchGame.q.map;searchGame.beginObjective();
const last=searchGame.markers.filter(m=>m.kind==='search').at(-1);
searchGame.s.hero={...searchGame.s.hero,...searchGame.nearestOpen(last.x-35,last.y+25)};
assert.equal(searchGame.interact(last),true);assert.equal(searchGame.s.collected,1);
assert.ok(!searchGame.markers.some(m=>m.id===last.id));
assert.ok(restoreState(JSON.parse(JSON.stringify(searchGame.s))).collectedIds.includes(last.index));

// Red warning shapes must be honest: dodging out of the visible region works.
const zone={kind:'circle',x:800,y:650,radius:125};
assert.equal(engine.inThreat({x:800,y:650},zone),true);
assert.equal(engine.inThreat({x:970,y:650},zone),false);
const line={kind:'line',x:500,y:600,targetX:900,targetY:600,width:30};
assert.equal(engine.inThreat({x:700,y:600},line),true);
assert.equal(engine.inThreat({x:700,y:650},line),false);

// A failed sixth-floor lever resets every switch, retains cleared fights and allows a full retry.
const lever=new GameEngine();lever.s.quest=QUESTS.findIndex(q=>q.id==='eSwitch6');lever.s.map=lever.q.map;lever.s.flags.route='evil';lever.s.phase='choice';
lever.s.done=QUESTS.filter(q=>/^eTower[1-6]$|^eSwitch[1-5]$/.test(q.id)).map(q=>q.id);
for(let i=1;i<=5;i++)lever.s.flags['switch'+i]=true;
const incorrect=lever.puzzleCorrect(0)?1:0;
assert.equal(lever.choose(incorrect),true);assert.equal(lever.q.id,'eSwitch1');
assert.equal(lever.s.done.filter(id=>id.startsWith('eSwitch')).length,0);
assert.equal(lever.s.done.filter(id=>id.startsWith('eTower')).length,6);
for(let floor=1;floor<=5;floor++){
 assert.equal(lever.q.id,'eSwitch'+floor);assert.equal(lever.travel(lever.q.map),true);for(let t=0;t<12000&&lever.s.map!==lever.q.map;t++)lever.tick(.05);assert.equal(lever.s.map,lever.q.map);lever.beginObjective();
 while(lever.s.phase==='search'){
  const item=lever.markers.find(m=>m.kind==='search');lever.s.hero={...lever.s.hero,...lever.nearestOpen(item.x-30,item.y+20)};lever.interact(item);
 }
 if(lever.s.phase==='choice')lever.choose(0);else lever.completeQuest();
}
assert.equal(lever.q.id,'eSwitch6');
lever.s.quest=QUESTS.findIndex(q=>q.id==='eSwitch6');lever.s.map=lever.q.map;lever.s.phase='choice';
assert.equal(lever.choose(lever.puzzleCorrect(0)?0:1),true);assert.equal(lever.s.flags.switch6,true);assert.equal(lever.q.id,'eTower7');
const rescue=new GameEngine();rescue.s.quest=QUESTS.findIndex(q=>q.id==='e13');rescue.s.map=rescue.q.map;rescue.s.flags.route='evil';
rescue.completeQuest();assert.equal(rescue.q.id,'e13','八层机关未全开不能救人');
for(let i=1;i<=8;i++)rescue.s.flags['switch'+i]=true;rescue.completeQuest();assert.equal(rescue.q.id,'e14');

// Imported pre-expansion saves retain quest identity after insertion changes numeric indices.
const {LEGACY_QUEST_IDS}=await import('../public/campaign.mjs');
const legacy=freshState();delete legacy.campaignRevision;legacy.quest=LEGACY_QUEST_IDS.indexOf('e14');legacy.map=quest('e14').map;
assert.equal(QUESTS[restoreState(legacy).quest].id,'e14');
const oldDoor={...legacy,quest:LEGACY_QUEST_IDS.indexOf('e13'),map:quest('e13').map,flags:{route:'evil',switch1:true,switch2:true,switch3:true,switch4:true,switch5:true}};
assert.equal(QUESTS[restoreState(oldDoor).quest].id,'eTower6');

// Finding the hairpin is not the end of the challenge: the player must get back to shore.
const dive=new GameEngine();dive.s.quest=QUESTS.findIndex(q=>q.id==='b05');dive.s.map=dive.q.map;dive.beginObjective();
const pin=dive.markers.find(m=>m.kind==='search');dive.s.hero={...dive.s.hero,...dive.nearestOpen(pin.x-30,pin.y+20)};dive.interact(pin);
assert.equal(dive.s.phase,'return');assert.equal(dive.s.inventory.hairpin,undefined);
dive.s.timer=.01;dive.tick(.05);assert.equal(dive.s.phase,'talk');assert.equal(dive.s.collected,0,'超时应允许完整重试');
// A merchant or Taoist must not silently fall back to the hero's appearance.
for(const [name,cell] of [['酒肆老板',0],['张仲天',1],['守山道士',2],['老者',3],['村民',4],['武当弟子',5],['黑衣刺客',6],['蔷薇',7]])assert.equal(npcCellFor(name),cell,name);
for(const name of ['杨影枫','纳兰真','紫轩','月眉儿','红衣少女','陌生女子'])assert.equal(npcCellFor(name),null,name+'应保留自身造型');
for(const name of ['npcs','props'])assert.ok(fs.existsSync(new URL('../public/assets/'+name+'.png',import.meta.url)));
knownFixes();
const unresolvedInstructions=QUESTS.filter(q=>q.before.some(v=>compact(v[1])===compact(q.objective))).map(q=>q.id);
console.log(JSON.stringify({result:'PASS',sourceReviewedEvents:QUESTS.filter(q=>q.revised).length,
 sceneLayouts:sceneSignatures.size,backgrounds:art.size,reachablePoints,
 checks:['剧情角色与战斗性质','地形与探索点可达','路径不穿障碍','宝箱不可重复领取','存档保留调查状态','任意顺序收集','蓄力范围与命中一致'],
 unresolvedInstructionDialogue:unresolvedInstructions,
 note:'以上是具体缺陷检查，不代表全流程原作匹配度，也不能替代人工试玩。'},null,2));
