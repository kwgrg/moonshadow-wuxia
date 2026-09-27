import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS} from '../public/runtime.mjs';
import {Renderer} from '../public/renderer-v3.mjs';

// Real renderer calls against authored engine fixtures. Browser screenshots are
// separate evidence; no battle receipt is rewritten to make a scene disappear.
const copy=value=>JSON.parse(JSON.stringify(value));
const snapshot=g=>copy({...g.s,questId:g.q.id});
function battle(id='gBad2'){
 const s=freshState();s.quest=QUESTS.findIndex(q=>q.id===id);assert(s.quest>=0);const q=QUESTS[s.quest];s.map=q.map;s.flags={...s.flags,route:'good',forsake:true,goodRoseBuried:true,['staged_'+id]:true};
 for(const flag of q.requiredFlags||[])s.flags[flag]=true;
 for(const group of q.requiredAnyFlags||[])s.flags[group[0]]=true;
 const g=new GameEngine(s);Object.assign(g.s.hero,g.scene.spawn);g.startBattle();assert.equal(g.s.phase,'battle');
 const guard=g.s.enemies.find(unit=>!unit.boss)||g.s.enemies[0];guard.telegraph=.7;guard.telegraphZone={kind:'circle',x:guard.x,y:guard.y,radius:115};return g;
}
function winBoss(){
 const g=battle(),boss=g.s.enemies.find(unit=>unit.boss);assert(boss);
 for(const unit of g.s.enemies)Object.assign(unit,{x:1300,y:850});
 Object.assign(g.s.hero,g.nearestOpen(650,750));Object.assign(boss,{x:g.s.hero.x,y:g.s.hero.y,hp:1});g.s.cooldowns[0]=0;
 assert.equal(g.cast(0),true);assert.equal(g.s.phase,'after');assert.equal(g.canCompleteCombat(),true);assert.equal(g.s.enemies.filter(unit=>unit.hp>0).length,44);return g;
}
function draw(g){
 globalThis.devicePixelRatio=1;const actors=[],calls=[];
 const context=surface=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:30})},{
  get:(target,key)=>target[key]??((...args)=>{if(['fillRect','fillText','arc'].includes(key))calls.push({surface,kind:key,args,fill:target.fillStyle});}),
  set:(target,key,value)=>(target[key]=value,true),
 });
 const world=context('world'),mini=context('mini'),renderer=new Renderer({clientWidth:1280,clientHeight:720,getContext:()=>world},{getContext:()=>mini},g,{});
 const paint=renderer.drawActor.bind(renderer);renderer.drawActor=(actor,hero)=>{actors.push({...actor,hero});paint(actor,hero);};
 const before=snapshot(g);renderer.draw();assert.deepEqual(snapshot(g),before,'rendering cannot mutate HP, defeated IDs, claims, progression or inventory');
 const enemies=actors.filter(actor=>!actor.hero&&!actor.ally&&typeof actor.id==='number'&&actor.hp!==undefined);
 const bars=calls.filter(call=>call.surface==='world'&&call.kind==='fillRect'&&['#c79572','#cb6a59'].includes(call.fill));
 const warnings=calls.filter(call=>call.surface==='world'&&call.kind==='fillText'&&/蓄力重击|剑气将至/.test(call.args[0]));
 const dots=calls.filter(call=>call.surface==='mini'&&call.kind==='arc'&&call.fill==='#f08874');
 return {renderer,enemies,bars,warnings,dots,actors};
}
function remainsVisible(g,label){const r=draw(g),alive=g.s.enemies.filter(e=>e.hp>0).length;assert(alive>0);assert.equal(r.enemies.length,alive,label+' enemies remain visible');assert(r.bars.length>0,label+' health bars remain visible');assert.equal(r.dots.length,alive,label+' minimap stays accurate');return r;}
let checks=0;
{
 const g=winBoss(),before=snapshot(g);assert(g.s.enemies.some(e=>e.hp>0&&e.telegraph>0),'fresh victory retains an unfinished guard threat in its receipt');
 const r=draw(g);assert.equal(r.enemies.length,0);assert.equal(r.bars.length,0);assert.equal(r.warnings.length,0);assert.equal(r.dots.length,0);assert(r.actors.some(a=>a.hero),'hero remains visible');assert.equal(r.renderer.labelledUnits.size,0,'withdrawn guards do not occupy label slots');
 assert.equal(g.s.enemies.length,45);assert.equal(g.s.combatProgress.encounters['wave:0'].roster.filter(e=>e.hp>0).length,44);assert.deepEqual(g.s.combatProgress.encounters['wave:0'].defeatedIds,[44]);assert.deepEqual(snapshot(g),before);checks++;
 const restored=new GameEngine(restoreState(snapshot(g))),again=draw(restored);assert.equal(again.enemies.length,0);assert.equal(again.warnings.length,0);assert.equal(again.dots.length,0);assert.equal(restored.s.combatProgress.encounters['wave:0'].roster.filter(e=>e.hp>0).length,44);checks++;
}
for(const id of ['gBad2','gBad_road','g24']){
 const g=battle(id),r=remainsVisible(g,id+' active');assert(r.warnings.length>0,'active threat still draws');checks++;
 g.s.phase='after';const after=remainsVisible(g,id+' unverified after');assert(after.warnings.length>0,'an after label alone cannot remove a threat');checks++;
}
// Negative fixtures damage different authoritative victory requirements. They
// must fail open visually instead of pretending a still unresolved fight ended.
for(const [label,damage] of [
 ['missing progress',g=>{g.s.combatProgress=null;}],
 ['unfinished receipt',g=>{g.s.combatProgress.finished=false;}],
 ['active outcome',g=>{g.s.combatProgress.encounters['wave:0'].outcome='active';}],
 ['failed receipt',g=>{g.s.combatProgress.failed=true;}],
 ['missing defeat identity',g=>{g.s.combatProgress.encounters['wave:0'].defeatedIds=[];}],
 ['incomplete roster',g=>{g.s.combatProgress.encounters['wave:0'].roster.pop();}],
 ['unrelated quest receipt',g=>{g.s.combatProgress.questId='g24';}],
 ['dead hero',g=>{g.s.hero.hp=0;}],
 ['other failure',g=>{g.s.failure={reason:'invalid'};}],
 ['wrong phase',g=>{g.s.phase='battle';}],
 ['still living boss',g=>{const boss=g.s.combatProgress.encounters['wave:0'].roster.find(e=>e.boss);boss.hp=1;}],
]){
 const g=winBoss();damage(g);remainsVisible(g,label);checks++;
}
// Once the next scene owns the space, its fallen father and arriving daughter
// must still draw; the predicate does not hide authored staging actors.
{
 const g=winBoss();g.completeQuest();assert.equal(g.q.id,'gBad2_aftermath');g.beginObjective();assert(g.s.sequence);
 for(let tick=0;tick<2000&&!g.stagingActors().some(a=>a.name==='纳兰真');tick++)g.tick(.05);
 const r=draw(g);assert.equal(r.enemies.length,0);assert(r.actors.some(a=>a.name==='纳兰潜凛'&&a.pose==='fallen'));assert(r.actors.some(a=>a.name==='纳兰真'));checks++;
}
console.log(`Good grief rendering PASS: ${checks} cases; verified boss victory hides remaining actors, bars, telegraphs and minimap dots without changing any save receipt; ordinary/active/invalid states and aftermath actors remain visible.`);
