import {npcCellFor} from '../public/renderer-v3.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as core from '../public/runtime.mjs';
import {SOURCES} from '../public/campaign.mjs';
const nodes=new Map(),events={};
class Element{
 constructor(id=''){this.id=id;this.style={setProperty(){}};this.classList={add(){},remove(){}};this.dataset={};this.children=[];this.listeners={};this.open=false;this.hidden=false;this.tagName='BUTTON';}
 set innerHTML(value){this._html=value;for(const m of value.matchAll(/\bid="([^"]+)"/g))if(!nodes.has(m[1]))nodes.set(m[1],new Element(m[1]));}
 get innerHTML(){return this._html||'';}
 querySelector(q){if(q==='button')return this.children[0]||new Element();if(!this.childrenByQuery)this.childrenByQuery={};return this.childrenByQuery[q]??=new Element();}
 append(e){this.children.push(e);if(e.id)nodes.set(e.id,e)}prepend(e){this.children.unshift(e);if(e.id)nodes.set(e.id,e)}replaceChildren(){this.children=[]}focus(){}setAttribute(){}setPointerCapture(){}click(){this.onclick?.()}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}showModal(){this.open=true}close(){this.open=false;for(const fn of this.listeners.close||[])fn()}
}
for(const m of fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8').matchAll(/\bid="([^"]+)"/g))nodes.set(m[1],new Element(m[1]));
nodes.get('dialogue').hidden=true;const selectors=new Map();
const document={getElementById:id=>nodes.get(id)||null,querySelector:q=>{if(!selectors.has(q))selectors.set(q,new Element(q));return selectors.get(q)},querySelectorAll:q=>{
 if(q==='[data-slot]'){if(!selectors.has(q))selectors.set(q,Array.from({length:5},(_,i)=>{const n=new Element();n.dataset.slot=String(i);return n}));return selectors.get(q)}
 if(q==='[data-dir]')return ['up','down','left','right'].map(dir=>{const n=new Element();n.dataset.dir=dir;return n});return [];
},createElement:()=>new Element(),addEventListener(k,fn){events[k]=fn},hidden:false};
const local=new Map();const localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};
const window={addEventListener(k,fn){events[k]=fn},matchMedia:()=>({matches:false})};
const failingArt=new Set(),artRequests=[];
class Image{set src(value){artRequests.push(value);queueMicrotask(()=>failingArt.has(value)?this.onerror():this.onload())}}
class Renderer{resize(){}draw(){}toWorld(x,y){return{x,y}}}
const raf=()=>0,timer=()=>0;
let source=fs.readFileSync(new URL('../public/journey.js',import.meta.url),'utf8').replace(/^import .+;$/gm,'');
source+='\nreturn {engine,updateUi,showCharacter,showBag,showShop,showJournal,showMap,showSaves,showSettings,showAbout,showHelp,showSide,showDialogue,nextDialogue,showChoice,closePanel,track,loadState};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const names=[...Object.keys(core),'SOURCES','Renderer','npcCellFor','document','window','localStorage','Image','requestAnimationFrame','setTimeout','clearTimeout','setInterval','clearInterval','matchMedia','performance','location'];
const values=[...Object.values(core),SOURCES,Renderer,npcCellFor,document,window,localStorage,Image,raf,timer,()=>{},timer,()=>{},()=>({matches:false}),{now:()=>0},{reload(){}}];
const ui=await new AsyncFunction(...names,source)(...values);




let checks = 0;
function preset(id){
  if(nodes.get('panel').open) ui.closePanel();
  ui.engine.s = core.freshState();
  ui.engine.s.quest = core.QUESTS.findIndex(q => q.id === id);
  assert.notEqual(ui.engine.s.quest,-1,id+' must exist');
  ui.engine.s.map = ui.engine.q.map;
  ui.engine.s.flags.route = id.startsWith('e')?'evil':'good';
  if(id==='e05') ui.engine.s.flags.evilHutNightComplete=true; // Recruitment fixture begins after the separately tested hut night.
  ui.engine.s.hero = {...ui.engine.s.hero,...ui.engine.nearestOpen(ui.engine.scene.objective.x,ui.engine.scene.objective.y)};
  ui.engine.paused = false;
  ui.engine.active = true;
  ui.engine.target = null;
  ui.engine.waypoints = [];
  ui.engine.attackTarget = null;
  ui.engine.autoInteract = null;
  ui.engine.keys.clear();
  nodes.get('dialogue').hidden = true;
}
function drain(limit=40){
  const seen=[];
  while(!nodes.get('dialogue').hidden && !nodes.get('dialogue-next').hidden){
    assert.ok(seen.length<limit,'dialogue must terminate');
    seen.push(nodes.get('dialogue-text').textContent);
    ui.nextDialogue();
  }
  return seen;
}
function talkToCurrent(){
  const marker=ui.engine.markers.find(m=>m.main);
  assert.ok(marker,'current task must expose an interaction target');
  Object.assign(ui.engine.s.hero,ui.engine.nearestOpen(marker.x-20,marker.y+10));
  assert.ok(core.distance(ui.engine.s.hero,marker)<135,'test must interact within range');
  ui.engine.interact(marker);
  return drain();
}
function clickOption(index){
  const button=nodes.get('choices').children[index];
  assert.ok(button,'choice '+index+' is visible');
  button.click();
  return drain();
}

// Acceptance enters the complete cult route; refusals do not share its dialogue.
preset('g15');ui.engine.s.phase='choice';
const rejectionLines=ui.engine.q.choice.options[1].after.map(line=>line[1]);
ui.showChoice();const accepted=clickOption(0);
assert.equal(ui.engine.s.ending,null);assert.equal(ui.engine.q.id,'gCult_wudang');assert.equal(ui.engine.s.flags.cultPath,true);
assert.ok(accepted.length>0);for(const text of rejectionLines)assert.ok(!accepted.includes(text));checks++;
preset('g15');ui.engine.s.phase='choice';ui.showChoice();
for(let refusal=1;refusal<=3;refusal++){
 const lines=clickOption(1);assert.equal(ui.engine.s.flags.refusal_g15,refusal);assert.equal(ui.engine.s.ending,null);
 if(refusal<3){assert.equal(ui.engine.q.id,'g15');assert.equal(ui.engine.s.flags.moral,0);for(const text of rejectionLines)assert.ok(!lines.includes(text),'cannot announce leaving before the final refusal');}
 else{assert.equal(ui.engine.q.id,'g16');assert.equal(ui.engine.s.flags.moral,2);for(const text of rejectionLines)assert.ok(lines.includes(text));}
}
assert.ok(!ui.engine.s.flags.cultPath);checks++;

// Neither trap choice may announce the outcome before the player fights.
for(const index of [0,1]){
  preset('b04');
  const resultLines=ui.engine.q.after.map(line=>line[1]);
  talkToCurrent();
  assert.equal(ui.engine.s.phase,'choice');
  const beforeFight=clickOption(index);
  assert.equal(ui.engine.s.phase,'battle');
  assert.deepEqual(ui.engine.s.enemies.map(e=>e.name),['蔷薇']);
  assert.ok(!beforeFight.some(text=>/落败后|战败后|战胜了|击败了|落败.*天池|输了.*天池/.test(text)),
    'choice '+index+' must not narrate a resolved duel before combat');
  for(const text of resultLines) assert.ok(!beforeFight.includes(text),'battle result belongs after combat');

  // Resolve the one opponent through the real combat transition; this is a UI-order test,
  // so enemy health/position are reduced instead of replaying the balance simulation.
  const enemy=ui.engine.s.enemies[0];
  Object.assign(enemy,{hp:1,x:ui.engine.s.hero.x+1,y:ui.engine.s.hero.y});
  ui.engine.s.cooldowns[0]=0;
  assert.equal(ui.engine.cast(0),true);
  assert.equal(ui.engine.s.phase,'after');
  const afterFight=talkToCurrent();
  for(const text of resultLines) assert.ok(afterFight.includes(text),'resolved duel must show its result');
  assert.equal(ui.engine.q.id,'b05');
  assert.ok(ui.engine.s.inventory.trap>=1,'both routes ultimately obtain the trap');
  checks++;
}

// The invitation precedes the infiltration. The book revelation belongs to discovery.
for(const index of [0,1]){
  preset('a49');
  const invitation=talkToCurrent();
  assert.equal(ui.engine.s.phase,'choice');
  assert.ok(!invitation.some(text=>/武道德经|禁地深处听见|听见了交谈声/.test(text)),
    'the player must not infiltrate before deciding to accompany Zhen');
  const acceptedInvitation=clickOption(index);
  assert.equal(ui.engine.s.phase,'search');
  assert.ok(!acceptedInvitation.some(text=>/武道德经/.test(text)),
    'the clue must not be revealed by the invitation choice');
  const clue=ui.engine.markers.find(m=>m.kind==='search');
  assert.ok(clue);
  Object.assign(ui.engine.s.hero,ui.engine.nearestOpen(clue.x-20,clue.y+10));
  assert.equal(ui.engine.interact(clue),true);
  const discovery=drain();
  assert.equal(ui.engine.s.phase,'after');
  assert.ok(discovery.some(text=>/武道德经/.test(text)),'finding the clue must reveal the book');
  const aftermath=talkToCurrent();
  assert.ok(aftermath.length>0);
  assert.equal(ui.engine.q.id,'a50');
  checks++;
}

// Save slots show the same migrated quest that reading the slot will actually load.
const {LEGACY_QUEST_IDS}=await import('../public/campaign.mjs');
const finalQuest=core.QUESTS.find(q=>q.id==='e14');
const old=core.freshState();
delete old.campaignRevision;
old.quest=LEGACY_QUEST_IDS.indexOf('e14');
old.map=finalQuest.map;
const withId={...old,questId:'e14'};
const current={...old,campaignRevision:2,quest:core.QUESTS.findIndex(q=>q.id==='e14')};
for(const [index,state] of [withId,old,current].entries()){
  local.set('moonshadow-journey-v3-slot-'+(index+1),JSON.stringify({date:'migration fixture',state}));
}
ui.showSaves();
for(let slot=1;slot<=3;slot++){
  const state=[withId,old,current][slot-1];
  const expected=core.QUESTS[core.restoreState(state).quest];
  const summary=nodes.get('panel-content').innerHTML.match(new RegExp('卷 '+slot+'<\\/h3><p>(.*?)<\\/p>'))?.[1];
  assert.ok(summary?.includes(expected.title),'slot '+slot+' title must agree with restored quest identity');
  assert.equal(expected.id,'e14');
  checks++;
}
ui.closePanel();

function totalExp(engine){
  let result=engine.s.hero.exp;
  for(let level=1;level<engine.s.hero.level;level++)result+=100+level*60;
  return result;
}
function makeLeverState(){
  const state=core.freshState();
  state.quest=core.QUESTS.findIndex(q=>q.id==='eSwitch6');
  state.questId='eSwitch6';
  state.map=core.QUESTS[state.quest].map;
  state.flags.route='evil';
  state.phase='choice';
  state.done=core.QUESTS.filter(q=>/^eTower[1-6]$|^eSwitch[1-5]$/.test(q.id)).map(q=>q.id);
  for(let floor=1;floor<=5;floor++)state.flags['switch'+floor]=true;
  return state;
}
function replayFiveSwitches(engine){
  for(let floor=1;floor<=5;floor++){
    assert.equal(engine.q.id,'eSwitch'+floor,'cleared fights must be skipped while resetting switches');
    assert.equal(engine.travel(engine.q.map),true);for(let t=0;t<12000&&engine.s.map!==engine.q.map;t++)engine.tick(.05);assert.equal(engine.s.map,engine.q.map,'walk back to the current switch floor');
    engine.beginObjective();
    assert.equal(engine.s.phase,'search');
    const marker=engine.markers.find(m=>m.kind==='search');
    Object.assign(engine.s.hero,engine.nearestOpen(marker.x-20,marker.y+10));
    assert.equal(engine.interact(marker),true);
    assert.equal(engine.s.phase,'after');
    engine.completeQuest();
  }
  assert.equal(engine.q.id,'eSwitch6','recovery returns to the sixth-floor lever without replaying cleared battles');
  assert.equal(engine.travel(engine.q.map),true);for(let t=0;t<12000&&engine.s.map!==engine.q.map;t++)engine.tick(.05);assert.equal(engine.s.map,engine.q.map,'walk back to the current switch floor');
  engine.beginObjective();
  assert.equal(engine.s.phase,'choice');
}

// Rewards survive completion-marker resets, including states from before the ledger existed.
for(const mode of ['new-ledger','loaded-old-state','live-old-state']){
  let state=makeLeverState();
  if(mode==='new-ledger')state.claimedRewards=[...state.done];
  else {
    delete state.claimedRewards;
    if(mode==='loaded-old-state')state=core.restoreState(JSON.parse(JSON.stringify(state)));
  }
  const lever=new core.GameEngine(state);
  const start={coins:lever.s.coins,xp:totalExp(lever)};
  for(let attempt=0;attempt<2;attempt++){
    const wrong=lever.puzzleCorrect(0)?1:0;
    assert.equal(lever.choose(wrong),true);
    assert.equal(lever.q.id,'eSwitch1');
    for(let floor=1;floor<=8;floor++)assert.equal(!!lever.s.flags['switch'+floor],false);
    assert.equal(lever.s.done.filter(id=>/^eTower[1-6]$/.test(id)).length,6);
    replayFiveSwitches(lever);
    assert.equal(lever.s.coins,start.coins,mode+': resetting switches must not farm money');
    assert.equal(totalExp(lever),start.xp,mode+': resetting switches must not farm experience');
  }
  assert.equal(lever.choose(lever.puzzleCorrect(0)?0:1),true);
  assert.equal(lever.s.flags.switch6,true);
  assert.equal(lever.q.id,'eTower7');
  checks++;
}
// Regression from actual browser QA: the third bout must persist the choice,
// not leave a battle save that forces all three bouts to replay on reload.
preset('e02');ui.engine.s.wave=2;ui.engine.startBattle(true);const lastOpponent=ui.engine.s.enemies[0];lastOpponent.hp=1;Object.assign(ui.engine.s.hero,{x:lastOpponent.x,y:lastOpponent.y+20});ui.engine.cast(0);
const weddingSave=JSON.parse(local.get('moonshadow-journey-v3'));
assert.equal(weddingSave.phase,'choice');assert.equal(weddingSave.questId,'e02');assert.equal(nodes.get('speaker-name').textContent,'纳兰真');assert.equal(core.restoreState(weddingSave).phase,'choice');assert.equal(ui.engine.scene.atmosphere.light,'night');checks++;
// Recruitment options must repeat without showing the accepted-route aftermath.
for(const [id,limit] of [['e05',3],['e07',2]]){
 preset(id);if(id==='e07')Object.assign(ui.engine.s.flags,{evilZhenMissing:true,evilGateOpened:true,staged_e07:true});ui.engine.s.phase='choice';ui.showChoice();
 const initialCoins=ui.engine.s.coins;
 for(let refusal=1;refusal<=limit;refusal++){
  const seen=clickOption(1);
  assert.equal(ui.engine.refusalCount(),refusal);
  assert.ok(!seen.some(line=>ui.engine.q.after.some(after=>after[1]===line)),'refusal cannot narrate acceptance');
  if(refusal<limit){assert.equal(ui.engine.s.phase,'choice');assert.equal(nodes.get('choices').children.length,2);assert.ok(nodes.get('dialogue-text').textContent.includes('已拒绝 '+refusal+' 次'));}
 }
 assert.equal(ui.engine.s.phase,'failed');assert.ok(nodes.get('panel-content').innerHTML.includes('此程中止'));
 const failedSave=JSON.parse(local.get('moonshadow-journey-v3'));
 assert.equal(failedSave.phase,'failed');assert.equal(failedSave.hero.hp,0);assert.equal(core.restoreState(failedSave).failure.questId,id);
 assert.equal(ui.engine.s.coins,initialCoins);assert.ok(!ui.engine.s.done.includes(id));
 nodes.get('close-panel').click();assert.equal(ui.engine.s.phase,'failed');assert.equal(ui.engine.paused,true,'panel close does not retry a fatal answer');
 nodes.get('retry-refusal').click();assert.equal(ui.engine.s.phase,'choice');assert.equal(ui.engine.refusalCount(),limit-1);
 clickOption(0);assert.notEqual(ui.engine.q.id,id);assert.equal(ui.engine.s.failure,null);assert.equal(ui.engine.s.done.filter(q=>q===id).length,1);
 checks++;
}
// Answers must persist even when the player reloads before consequence text finishes.
preset('e05');ui.engine.s.phase='choice';ui.engine.s.flags.refusal_e05=2;ui.showChoice();nodes.get('choices').children[1].click();
assert.equal(nodes.get('dialogue').hidden,false);assert.equal(nodes.get('dialogue-next').hidden,false);
const interruptedAnswer=JSON.parse(local.get('moonshadow-journey-v3'));assert.equal(interruptedAnswer.phase,'failed');assert.equal(interruptedAnswer.flags.refusal_e05,3);assert.equal(core.restoreState(interruptedAnswer).hero.hp,0);drain();checks++;

// An empty near-field action must not fall back to auto-walking toward a remote
// marker, particularly next to a fallen actor after this route has ended.
preset('gCult_epilogue');ui.engine.s.completed=true;ui.engine.s.ending='cult';ui.engine.s.phase='complete';
ui.engine.s.flags.staged_gCult_zixuan=true;ui.engine.s.map='r_cult_dungeon';
Object.assign(ui.engine.s.hero,{x:650,y:610});ui.updateUi();
assert.equal(nodes.get('interaction').hidden,true);
events.keydown({key:'e',repeat:false,target:{tagName:'CANVAS'},preventDefault(){}});
assert.equal(ui.engine.target,null);assert.equal(ui.engine.autoInteract,null);assert.equal(ui.engine.s.destination,null);
nodes.get('mobile-talk').click();assert.equal(ui.engine.target,null);assert.equal(ui.engine.autoInteract,null);
assert.equal(nodes.get('dialogue').hidden,true);assert.equal(nodes.get('panel').open,false);checks++;

// Loading a different pursuit must discard the previous actor route and auto-follow.
preset('e07_first');ui.engine.s.flags.route='evil';ui.engine.s.flags.evilTrailEntry=true;ui.engine.beginObjective();ui.engine.followPursuit();for(let i=0;i<20;i++)ui.engine.tick(.05);
const savedTrail=JSON.parse(JSON.stringify({...ui.engine.s,questId:ui.engine.q.id}));
ui.engine._pursuitPath=[{x:1400,y:350}];ui.engine._pursuitFollow=true;
ui.loadState(savedTrail);assert.equal(ui.engine._pursuitPath,null);assert.equal(ui.engine._pursuitFollow,false);assert.equal(ui.engine.s.pursuit.actor.x,savedTrail.pursuit.actor.x);
ui.engine.s.hero.x+=1;events.pagehide();const departure=JSON.parse(local.get('moonshadow-journey-v3'));assert.equal(departure.hero.x,ui.engine.s.hero.x);assert.equal(departure.questId,'e07_first');checks++;

// Saved dream projections loaded through slots or import must await their own
// backdrop. A failed uncached asset must freeze the exact saved step and retry
// the image, not allow an invisible dream to continue on a fallback room.
const loadResources=game=>JSON.parse(JSON.stringify({inventory:game.s.inventory,coins:game.s.coins,exp:game.s.hero.exp,hp:game.s.hero.hp,mp:game.s.hero.mp,potions:game.s.potions,elixirs:game.s.elixirs,kills:game.s.kills,done:game.s.done,claimedRewards:game.s.claimedRewards}));
async function flushArt(){for(let n=0;n<25;n++)await Promise.resolve();}
for(const [mode,branch,art] of [['manual-load','kill','wedding-dream'],['import','refuse','lake-dream']]){
 const state=core.freshState();state.quest=core.QUESTS.findIndex(q=>q.id==='e06_night');state.map='r_evil_chamber';state.flags={...state.flags,route:'evil',evilFamilyHeard:true,[branch==='kill'?'evilQiangweiKill':'evilQiangweiRefuse']:true};state.choices.e06=branch==='kill'?1:0;state.done=['e06',branch==='kill'?'e06_kill':'e06_refuse','e06_aftermath'];state.claimedRewards=[...state.done];
 const sourceGame=new core.GameEngine(state);sourceGame.onEvent=type=>{if(type==='stagingDialogue')sourceGame.advanceStaging();};sourceGame.beginObjective();for(let n=0;n<2000&&!sourceGame.s.sequence?.sceneKey;n++)sourceGame.tick(.05);assert.ok(sourceGame.s.sequence?.sceneKey,'fixture is an earned scene transition');
 const raw=JSON.parse(JSON.stringify({...sourceGame.s,questId:sourceGame.q.id})),resourceBefore=loadResources(sourceGame),url='./assets/'+art+'.png',requestsBefore=artRequests.filter(value=>value===url).length;failingArt.add(url);
 if(mode==='import'){ui.showSaves();await nodes.get('import-save').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(raw)}]}});}
 else ui.loadState(raw); // The manual-slot handler calls this same entry point.
 await flushArt();assert.equal(ui.engine.sceneLoading,true,mode+' keeps the load lock after an asset failure');assert.equal(ui.engine.sceneLoadFailed,true,mode+' exposes the retry action');assert.equal(artRequests.filter(value=>value===url).length,requestsBefore+1);const savedStep=ui.engine.s.sequence.step;
 for(let n=0;n<80;n++)ui.engine.tick(.05);assert.equal(ui.engine.s.sequence.step,savedStep,'failed loading never advances a scene');assert.equal(ui.engine.s.sequence.sceneKey,raw.sequence.sceneKey);assert.deepEqual(loadResources(ui.engine),resourceBefore);assert.match(nodes.get('track-button').innerHTML,/重新载入/);
 failingArt.delete(url);ui.track();assert.equal(ui.engine.sceneLoading,true,'retry waits for the new request');ui.engine.tick(.05);assert.equal(ui.engine.s.sequence.step,savedStep);await flushArt();assert.equal(artRequests.filter(value=>value===url).length,requestsBefore+2,'retry makes a fresh request after the rejected image');assert.equal(ui.engine.sceneLoadFailed,false);assert.equal(ui.engine.sceneLoading,false);assert.equal(ui.engine.s.sequence.step,savedStep,'finishing an image load does not replay or skip a step');
 for(let n=0;n<80&&ui.engine.s.sequence.step===savedStep;n++)ui.engine.tick(.05);assert.ok(ui.engine.s.sequence.step>savedStep,'successful retry resumes the saved sequence');assert.deepEqual(loadResources(ui.engine),resourceBefore,'loading and retry never alter rewards or combat resources');checks++;
}

// The elder in the wedding dream must keep his elder portrait in dialogue too.
assert.equal(npcCellFor('孟知秋'),3,'Meng uses the same elder atlas cell as his staged actor');ui.showDialogue([['孟知秋','对话肖像检测。',3]],()=>{});assert.equal(nodes.get('speaker-portrait').src,'./assets/npcs.png','Meng must not fall back to the masked character portrait');assert.match(nodes.get('speaker-portrait').style.transform,/-75%/);ui.nextDialogue();checks++;

// Reusing the faction engine must not leak the former battle's title into the
// island HUD. Check the actual UI text and its live enemy count after a defeat.
preset('e08_island_battle');ui.engine.s.flags.evilTowerInterludeComplete=true;ui.engine.s.flags.staged_e08_island_battle=true;
ui.engine.sceneLoading=false;ui.engine.sceneLoadFailed=false;ui.engine.startSkirmish();ui.updateUi();
assert.match(nodes.get('quest-description').textContent,/村中解围.*0 \/ 36/);
assert.doesNotMatch(nodes.get('quest-description').textContent,/武当/);
ui.engine.s.enemies[0].hp=0;ui.engine.markSkirmishDefeat(ui.engine.s.enemies[0]);ui.updateUi();
assert.match(nodes.get('quest-description').textContent,/村中解围.*1 \/ 36/);checks++;

// Manor answers have no deferred aftermath text: both must be saved at the
// click, before any doorway travel or consequence animation can begin.
for(const answer of [0,1]){
 preset('e09');ui.engine.s.phase='choice';Object.assign(ui.engine.s.flags,{evilManorFirstWoke:true,evilManorNightStarted:true,staged_e09:true,evil:9});ui.engine.s.affection.mei=4;
 const money=ui.engine.s.coins,xp=ui.engine.s.hero.exp;ui.showChoice();nodes.get('choices').children[answer].click();
 const raw=JSON.parse(local.get('moonshadow-journey-v3'));assert.equal(raw.questId,answer===0?'e09_room_talk':'e09_part');assert.equal(raw.choices.e09,answer);
 assert.equal(raw.flags.evil,9+(answer===0?2:-1));assert.equal(raw.affection.mei,4+(answer===0?1:0));assert.equal(raw.coins,money);assert.equal(raw.hero.exp,xp);
 const restored=new core.GameEngine(core.restoreState(raw));assert.equal(restored.choose(answer),false);assert.equal(restored.s.flags.evil,raw.flags.evil);assert.equal(restored.s.affection.mei,raw.affection.mei);checks++;
}
// The real residentDialogue UI finishes without invoking the current teaching
// objective, issuing rewards or making the resident follow the player.
preset('e10_teaching');ui.engine.s.map='m50';ui.engine.s.phase='travel';Object.assign(ui.engine.s.flags,{evilManorNightStarted:true,evilManorNightComplete:true,evilMeiStaysAtManor:true,staged_e09_morning:true,companion:null});
const resident=ui.engine.markers.find(marker=>marker.name==='月眉儿');assert.ok(resident?.dialogue?.length);Object.assign(ui.engine.s.hero,{x:resident.x,y:resident.y});
const beforeResident=JSON.stringify(ui.engine.s);assert.equal(ui.engine.interact(resident),true);assert.equal(nodes.get('dialogue').hidden,false);
assert.deepEqual(drain(),resident.dialogue.map(line=>line[1]));assert.equal(JSON.stringify(ui.engine.s),beforeResident);assert.equal(ui.engine.paused,false);assert.equal(ui.engine.companion,null);checks++;

console.log(JSON.stringify({result:'PASS',checks,
  covered:['山庄两答复立即保存与留庄闲谈无副作用','岛战进度使用当前战名与实际清敌计数','手动与导入梦境存档的图片失败锁定及重试','终局与拒绝对白分流','招揽计数、剧情死亡保存与返回末次答复','捕兽夹两种选择的战前战后顺序','潜入邀请先于线索发现','旧新存档槽标题与读取一致','错杆重拨不重复奖励，包括旧存档'],
  note:'UI functions run in a DOM stub; this guards narrative state transitions and does not replace visual browser QA.'
},null,2));

