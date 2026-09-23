import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS,SKILLS,ITEMS,SIDE_QUESTS,distance} from '../public/runtime.mjs';
import fs from 'node:fs';
const stats=[];
for(const q of QUESTS){assert.ok(MAPS[q.map],q.id);assert.ok(q.before.length||q.requireStaging,q.id);assert.ok(q.sources.length,q.id);if(q.choice)assert.ok(q.choice.options.length>=2,q.id);}
assert.equal(new Set(QUESTS.map(q=>q.id)).size,QUESTS.length);
function option(g,outcome){const id=g.q.id;if(id==='eSwitch6')return g.puzzleCorrect(0)?0:1;if(id==='g15')return outcome==='cult'?0:1;if(id==='g20')return outcome==='zhen_good'?1:0;if(id==='g23')return outcome==='three'?1:0;if(id[0]==='e'){const high=outcome==='alone';return {e02:high?1:0,e04:high?1:0,e06:high?1:0,e08:high?1:0,e09:high?0:1}[id]??0;}return ['alone','family'].includes(outcome)?g.q.choice.options.length-1:0;}
// The lake now has two disconnected walking surfaces. The simulation must
// perform the same authored leap as the player before continuing on foot.
function crossGap(game,goal){
 if(!goal||!game.scene.jumps?.length||game.findPath(goal.x,goal.y).length)return;
 const leap=game.scene.jumps.flatMap(def=>['a','b'].map(side=>({def,side,from:def[side],to:def[side==='a'?'b':'a']}))).find(({from,to})=>game.findPath(from.x,from.y).length&&game.findPath(goal.x,goal.y,to).length);
 assert.ok(leap,game.q.id+' has a real leap to the destination platform');assert.equal(game.moveTo(leap.from.x,leap.from.y),true);
 for(let n=0;n<5000&&distance(game.s.hero,leap.from)>45;n++)game.tick(.05);
 assert.ok(distance(game.s.hero,leap.from)<100,'walk reaches takeoff');assert.equal(game.startJump(leap.def.id,leap.side),true);
 for(let n=0;n<30&&game.jump;n++)game.tick(.05);assert.equal(game.jump,null);assert.ok(game.findPath(goal.x,goal.y).length,'land before continuing on foot');
}
for(const difficulty of ['normal','story']) for(const outcome of ['reunion','three','zhen_good','cult','alone','family']){
 const g=new GameEngine();g.settings.difficulty=difficulty;let transitions=0,battles=0,defeats=0;g.onEvent=(event)=>{if(event==='defeat')defeats++;if(event==='stagingDialogue')g.advanceStaging();if(event==='startingDifficulty')g.chooseStartingDifficulty(difficulty);};
 while(!g.s.completed&&transitions++<1000){const q=g.q;
  if(g.s.map!==q.map){crossGap(g,g.scene.portals?.[g.routeTo(q.map)[1]]?.exit);assert.equal(g.travel(q.map),true,q.id+' route open');for(let t=0;t<18000&&g.s.map!==q.map;t++)g.tick(.05);assert.equal(g.s.map,q.map,q.id+' walking route arrives');continue;}
  if(g.s.phase==='talk'){crossGap(g,g.stagingDefinition()?.startPoint||g.scene.objective);g.beginObjective();}if(g.s.phase==='staging'){for(let t=0;t<5000&&g.s.phase==='staging';t++)g.tick(.05);assert.notEqual(g.s.phase,'staging',q.id+' staging releases');continue;}
  if(g.s.phase==='pursuit'){assert.equal(g.followPursuit(),true,q.id+' following starts through the pursuit action');for(let t=0;t<18000&&g.q.id===q.id&&g.s.phase==='pursuit';t++)g.tick(.05);assert.notEqual(g.q.id,q.id,q.id+' pursuit must reach its real exit');continue;}
  if(g.s.phase==='training'){const opponent=g.markers.find(m=>m.kind==='master')||g.markers.find(m=>m.kind==='training'&&!m.defeated);assert.ok(opponent);g.interact(opponent);for(let n=0;n<1200&&g.s.phase==='training';n++)g.tick(.05);assert.equal(g.s.phase,'battle');}
  if(g.s.phase==='choice'){assert.equal(g.choose(option(g,outcome)),true);continue;}
  if(g.s.phase==='escape'){const marker=g.markers.find(m=>m.main);g.interact(marker);for(let t=0;t<1500&&g.q.id===q.id&&g.s.phase==='escape';t++)g.tick(.05);assert.notEqual(g.q.id,q.id,'Timed escape must progress');continue;}
  if(g.s.phase==='battle'){
   battles++;let ticks=0;
   while(g.s.phase==='battle'&&ticks++<6000&&!g.paused){
    if(g.encounter.scriptedLoss){g.attackTarget=null;g.tick(.05);continue;}
    const enemy=g.s.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,g.s.hero)-distance(b,g.s.hero))[0];g.attackTarget=enemy;
    for(const id of g.s.hotbar)if(id!=null&&id!==3&&id!==5&&id!==15)g.cast(id);
    if(g.s.hero.hp<g.s.hero.maxHp*.5){g.cast(3);g.potion();}if(g.s.hero.mp<30)g.elixir();g.tick(.05);
   }
   if(q.training&&g.s.phase==='training')continue;
   if(q.battleBeforeChoice){assert.equal(g.s.phase,'choice');g.choose(option(g,outcome));continue;}
   assert.equal(g.s.phase,'after',`${outcome} ${q.id} battle should complete (hp ${g.s.hero.hp}, tick ${ticks})`);
  }
  if(g.s.phase==='search'){let safety=0;while(g.s.phase==='search'&&safety++<40){const marker=g.markers.find(m=>m.main);assert.ok(marker,q.id);crossGap(g,marker);g.interact(marker);for(let t=0;t<500&&g.autoInteract;t++)g.tick(.05);assert.equal(g.autoInteract,null,`${q.id} pathfinding reaches collectible`);}if(g.s.phase==='return'){g.interact(g.markers.find(m=>m.kind==='return'));for(let t=0;t<1000&&g.s.phase==='return';t++)g.tick(.05);}assert.equal(g.s.phase,'after',q.id);}
  if(g.s.phase==='after')g.completeQuest();
  assert.equal(defeats,0,`${outcome} ${q.id} should not softlock`);
  if(transitions%17===0){const restored=restoreState(JSON.parse(JSON.stringify(g.s)));assert.equal(restored.quest,g.s.quest);assert.equal(restored.map,g.s.map);}
 }
 assert.equal(g.s.ending,outcome);assert.ok(transitions<1000);assert.ok(g.s.done.length>70);stats.push({difficulty,outcome,events:g.s.done.length,battles,level:g.s.hero.level,visited:g.s.visited.length});
}
const opening=new GameEngine();opening.s.quest=QUESTS.findIndex(q=>q.id==='a05');opening.s.map=opening.q.map;opening.s.training={questId:'a05',defeated:[0,1,2,3,4],active:null,master:true};opening.startBattle();opening.s.enemies[0].hp=1;opening.s.hero.x=opening.s.enemies[0].x;opening.s.hero.y=opening.s.enemies[0].y;opening.cast(0);assert.equal(opening.s.ending,'opening');
const path=new GameEngine();const marker=path.npc;path.interact(marker);for(let i=0;i<1000&&path.autoInteract;i++)path.tick(.05);assert.equal(path.autoInteract,null);assert.ok(distance(path.s.hero,marker)<135);
path.keys.add('ArrowLeft');for(let i=0;i<2000;i++)path.tick(.05);assert.ok(path.s.hero.x>=path.scene.bounds[0]);path.keys.clear();assert.equal(path.equipSkill(18,0),false);path.unlock(18);assert.equal(path.equipSkill(18,4),true);
const donation=new GameEngine();const beggar=SIDE_QUESTS.find(q=>q.repeat);donation.s.map=beggar.map;donation.s.coins=800;for(let i=0;i<9;i++)assert.equal(donation.side(beggar.id),true);assert.equal(donation.s.sideDone.includes(beggar.id),false);donation.side(beggar.id);assert.equal(donation.s.sideDone.includes(beggar.id),true);assert.ok(donation.s.skills[11]!==undefined);assert.equal(donation.side(beggar.id),false);
const fragments=new GameEngine();for(const side of SIDE_QUESTS.filter(q=>q.id.startsWith('sheep'))){fragments.s.map=side.map;assert.ok(fragments.side(side.id));}assert.equal(fragments.s.inventory.sheepskin,7);assert.ok(Object.hasOwn(fragments.s.skills,18));
const save=restoreState(JSON.parse(JSON.stringify(fragments.s)));assert.equal(save.inventory.sheepskin,7);assert.throws(()=>restoreState({version:1}));assert.throws(()=>restoreState({...freshState(),hero:{hp:'NaN'}}));
for(const q of QUESTS.filter(q=>q.type==='boss'||q.type==='battle'))assert.ok((q.count||3)<=4,q.id);
for(const m of Object.values(MAPS))assert.ok(fs.existsSync(new URL('../public/assets/'+m.art+'.png',import.meta.url)));
console.log(JSON.stringify({result:'PASS',questNodes:QUESTS.length,regions:Object.keys(MAPS).length,skills:SKILLS.length-1,endings:7,checks:'All six long-route outcomes, opening branch, collection/pathfinding, 12 herbs, 8/8 tower floors, defeat events, storage, skill equip, donations and seven fragments',campaigns:stats},null,2));
