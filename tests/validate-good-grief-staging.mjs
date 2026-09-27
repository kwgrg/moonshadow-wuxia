import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';
import {GOOD_GRIEF_STAGING as STAGES} from '../public/good-grief-staging.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
import {getStagingScene} from '../public/world.mjs';

// Production state-machine checks, not an original-game or browser playthrough.
const copy=value=>JSON.parse(JSON.stringify(value));
const index=id=>QUESTS.findIndex(q=>q.id===id);
const save=g=>copy({...g.s,questId:g.q.id});
const reload=g=>new GameEngine(restoreState(save(g)));
const resources=g=>copy({coins:g.s.coins,exp:g.s.hero.exp,hp:g.s.hero.hp,mp:g.s.hero.mp,stamina:g.s.hero.stamina,level:g.s.hero.level,inventory:g.s.inventory,potions:g.s.potions,elixirs:g.s.elixirs,affection:g.s.affection,skills:g.s.skills,equipment:g.s.equipment});
const graves=g=>g.scene.props.filter(prop=>prop.kind==='grave');
const combat=id=>['gBad_road','gBad2'].includes(id);
const ids=['gBad_road','gBad1','gBad1_hut','gBad1_burial','gBad2','gBad2_aftermath','gBad2_departure'];
function create(id,claimed=false){
 const s=freshState(),q=QUESTS[index(id)];assert(q,id+' registered');
 s.quest=index(id);s.map=q.map;s.phase='talk';s.flags={...s.flags,route:'good',forsake:true,goodRoseBuried:true,companions:id==='gBad2_departure'?['纳兰真']:[],companion:id==='gBad2_departure'?'纳兰真':null};
 for(const flag of q.requiredFlags||[])s.flags[flag]=true;
 for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 Object.assign(s.hero,{hp:177,mp:71,stamina:44,level:20,exp:17});s.coins=837;s.inventory={potion:2};s.potions=8;s.elixirs=7;
 if(claimed)s.claimedRewards.push(id);
 const g=new GameEngine(s);Object.assign(g.s.hero,STAGES[id].startPoint);return g;
}

let restores=0,movementRestores=0,footpoints=0,paths=0,gateChecks=0,graveChecks=0,cameraVisits=0;
const checkpoints=new Map();
function checkWorld(g,id){
 const sequence=g.s.sequence;
 assert.equal(g.s.map,STAGES[id].map,id+' camera never changes world map');
 assert.equal(g.companions.length,0,id+' no duplicate arriving companion');
 assert(g.passable(g.s.hero.x,g.s.hero.y),id+' hero footpoint');footpoints++;
 if(sequence.cues.valleyCareLight)assert.equal(g.scene.atmosphere.light,sequence.cues.valleyCareLight,id+' earned light cue');
 if(sequence.sceneKey){assert.equal(g.scene.id,'staging:'+sequence.sceneKey);assert.deepEqual(g.scene.portals,{});}
 const visible=g.stagingActors(),seen=new Set();
 for(const a of visible){
  assert(!seen.has(a.id),id+' unique visible identity');seen.add(a.id);
  assert(g.passable(a.x,a.y),id+' actor footpoint '+a.id);footpoints++;
  const marker=g.markers.find(m=>m.id===a.id);assert(marker,id+' visible actor marker '+a.id);
  if(a.pose==='fallen')assert.equal(marker.interactive,false,id+' dead person cannot be a live interaction');
 }
 if(id==='gBad1_hut'){assert.equal(visible.filter(a=>a.pose==='fallen').length,5,'two women and three dead guards');assert.equal(g.s.enemies.length,0,'corpses do not become a fight');}
 if(id==='gBad2')assert(!visible.some(a=>a.name==='纳兰真'),'Zhen only arrives after the fight');
 if(id==='gBad1_burial'){
  const buried=sequence.cues.goodGriefMemorial==='buried';assert.equal(graves(g).length,buried?2:0,'graves appear only after burial');
  assert.equal(g.passable(700,500),!buried,'first grave footprint follows the cue');assert.equal(g.passable(1000,500),!buried,'second grave footprint follows the cue');
  if(buried)assert.deepEqual(graves(g).map(p=>p.label).sort(),['月眉儿之墓','紫轩之墓'].sort());
  assert.equal(g.s.flags.goodGriefBuried,undefined,'visual burial cannot prematurely earn quest completion');graveChecks++;
 }
 if(sequence.sceneKey==='goodGriefFatherMemorial'){assert.deepEqual(graves(g).map(p=>p.label),['纳兰潜凛之墓'],'father camera contains only his grave');assert(!visible.some(a=>['紫轩','月眉儿','蔷薇'].includes(a.name)));}
}

for(const claimed of [false,true])for(const id of ids){
 let g=create(id,claimed);const stage=STAGES[id],q=g.q,initial=resources(g),seen=new Set(),moved=new Set(),moveOrigins=new Map(),cameras=new Set();
 assert.equal(STAGED_QUESTS[id],stage,id+' production registry uses this stage');assert.equal(stage.map,q.map);assert.equal(stage.steps.at(-1).type,'release');
 const start=g.markers.find(m=>m.id==='staging-start');assert(start?.main&&start.paintOnly,id+' clear point marker before stage');assert.deepEqual([start.x,start.y],[stage.startPoint.x,stage.startPoint.y]);
 g.completeQuest();assert.equal(g.q.id,id,'an unplayed stage cannot be skipped');assert.deepEqual(resources(g),initial);
 g.beginObjective();assert(g.s.sequence,id+' actually starts in GameEngine');
 for(let ticks=0;ticks<18000&&g.q.id===id&&g.s.sequence;ticks++){
  const sequence=g.s.sequence,step=stage.steps[sequence.step],key=sequence.step;
  assert.deepEqual(resources(g),initial,id+' no money, healing, skill or item effects inside choreography');checkWorld(g,id);
  if(sequence.sceneKey)cameras.add(sequence.sceneKey);
  let mid=false;
  if(step.type==='move'){
   const a=g.stagingActor(step.actor);if(!moveOrigins.has(key))moveOrigins.set(key,{x:a.x,y:a.y});
   mid=!moved.has(key)&&distance(a,moveOrigins.get(key))>12;
  }
  if(!seen.has(key)||mid){
   if(mid){moved.add(key);movementRestores++;}
   if(!seen.has(key))for(const a of g.stagingActors()){
    if(distance(g.s.hero,a)<1)continue;
    const path=g.findPath(a.x,a.y);assert(path.length,id+' path to visible actor '+a.id);assert(distance(path.at(-1),a)<35,id+' path reaches actor');paths++;
   }
   seen.add(key);const before=save(g);if(!claimed&&!checkpoints.has(id))checkpoints.set(id,before);
   g=reload(g);restores++;assert.equal(g.q.id,id);assert.equal(g.s.phase,'staging');assert.equal(g.s.sequence.step,before.sequence.step,id+' exact step restoration');assert.equal(g.s.sequence.sceneKey,before.sequence.sceneKey);assert.equal(g.s.sequence.heroPose,before.sequence.heroPose);assert.deepEqual(g.s.sequence.cues,before.sequence.cues);assert.deepEqual(resources(g),initial);
   assert.deepEqual([g.s.hero.x,g.s.hero.y],[before.hero.x,before.hero.y],id+' moving hero stays in place after reload');
   for(const old of before.sequence.actors){const now=g.s.sequence.actors.find(a=>a.id===old.id);assert(now);assert.deepEqual([now.x,now.y,now.pose,now.direction,!!now.hidden],[old.x,old.y,old.pose,old.direction,!!old.hidden],id+' actor state restored');}
   checkWorld(g,id);g.completeQuest();assert.equal(g.q.id,id,'running stage cannot be force-completed');assert.equal(g.s.sequence.step,before.sequence.step);assert.deepEqual(resources(g),initial);
  }
  const current=g;g.onEvent=type=>{if(type==='stagingDialogue')current.advanceStaging();};g.tick(.05);
 }
 assert.equal(g.s.sequence,null,id+' every move and camera releases');assert.equal(g.s.flags['staged_'+id],true);assert.equal(seen.size,stage.steps.length,id+' every step was observed');
 for(const camera of cameras)assert(stage.sceneKeys?.includes(camera));cameraVisits+=cameras.size;
 if(combat(id)){
  assert.equal(g.q.id,id);assert.equal(g.s.phase,'battle','release begins the battle rather than claiming victory');assert.equal(g.s.enemies.length,q.count);assert.equal(g.canCompleteCombat(),false);assert.equal(g.s.done.includes(id),false);assert.equal(g.s.claimedRewards.includes(id),claimed);assert.deepEqual(resources(g),initial);
  assert.equal(g.stagingActors().length,0,'stage actors do not double the live battle roster');assert(!g.markers.some(m=>m.id==='grief-nalan'||m.id==='grief-road-leader'));
  const roster=copy(g.s.enemies);g=reload(g);assert.equal(g.s.phase,'battle');assert.deepEqual(g.s.enemies,roster);assert.deepEqual(resources(g),initial);g.completeQuest();assert.equal(g.q.id,id);assert.equal(g.s.done.includes(id),false);
 }else{
  const expected={...initial,coins:initial.coins+(claimed?0:q.money??15),exp:initial.exp+(claimed?0:q.xp??65)};assert.deepEqual(resources(g),expected,id+' one permitted completion award');
  assert.equal(g.s.done.filter(value=>value===id).length,1);assert.equal(g.s.claimedRewards.filter(value=>value===id).length,1,'claim receipt never duplicates');
  if(q.transition)assert.equal(g.s.map,q.transition.map,'explicit scripted transfer after stage');
  if(id==='gBad1'){assert.equal(g.partyNames.length,0,'Zhen departs alone');assert(!g.stagingActors().some(a=>a.name==='纳兰真'));}
  if(id==='gBad1_burial'){assert.equal(g.s.flags.goodGriefBuried,true);assert.equal(graves(g).length,2,'completed graves remain visible');}
  if(id==='gBad2_departure'){assert.equal(g.s.ending,'zhen_good');assert.equal(g.s.completed,true);assert.deepEqual(g.partyNames,[]);}
  const end=save(g);g=reload(g);g=reload(g);assert.equal(g.s.quest,end.quest);assert.equal(g.s.map,end.map);assert.deepEqual(resources(g),expected,'reloading completion cannot pay twice');assert.equal(g.s.claimedRewards.filter(value=>value===id).length,1);
  if(id==='gBad1_burial')assert.equal(graves(g).length,2,'graves persist after completed-save reload');
 }
}

// Every required group blocks entry as well as continuation from a tampered save.
for(const id of ids){
 const q=QUESTS[index(id)],groups=[...(q.requiredFlags||[]).map(flag=>[flag]),...(q.requiredAnyFlags||[])];
 for(const group of groups){
  const g=create(id);for(const flag of group)delete g.s.flags[flag];const before=resources(g);g.beginObjective();g.completeQuest();assert.equal(g.s.sequence,null,id+' missing prerequisite blocks scene');assert.equal(g.q.id,id);assert.deepEqual(resources(g),before);gateChecks++;
  const raw=copy(checkpoints.get(id));for(const flag of group)delete raw.flags[flag];assert.equal(restoreState(raw).sequence,null,id+' interrupted scene cannot ignore lost prerequisite');gateChecks++;
 }
 const unknown=copy(checkpoints.get(id));unknown.sequence.sceneKey='foreign-map';assert.equal(restoreState(unknown).sequence,null,'unknown camera rejected');gateChecks++;
}
{
 const raw=copy(checkpoints.get('gBad1_burial'));raw.sequence.cues.goodGriefMemorial='buried';const g=new GameEngine(restoreState(raw));assert.equal(g.s.sequence.cues.goodGriefMemorial,undefined,'future grave cue cannot be injected before its step');assert.equal(graves(g).length,0);graveChecks++;
}
{
 const a=getStagingScene('goodGriefFatherMemorial'),b=getStagingScene('goodGriefFatherMemorial');assert(a&&b);assert.deepEqual(a.portals,{});assert.deepEqual(a.points,[]);assert.deepEqual(graves({scene:a}).map(p=>p.label),['纳兰潜凛之墓']);a.obstacles.push([1,2,3,4]);assert.notEqual(a.obstacles.length,b.obstacles.length,'camera geometry is independent per access');
}
console.log(`Good grief staging PASS: ${ids.length*2} scenes, ${restores} restores (${movementRestores} moving), ${cameraVisits} camera visits, ${footpoints} footpoints, ${paths} actor paths, ${graveChecks} grave checks, ${gateChecks} gates; browser verification remains separate.`);
