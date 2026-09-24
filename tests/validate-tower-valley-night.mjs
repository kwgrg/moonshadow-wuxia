import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,MAPS} from '../public/runtime.mjs';
import {STAGED_QUESTS} from '../public/staging.mjs';
const idx=id=>QUESTS.findIndex(q=>q.id===id),copy=x=>JSON.parse(JSON.stringify(x));
let checks=0;
const snapshot=g=>({...copy(g.s),questId:g.q.id});
function make(){const s=freshState();Object.assign(s,{quest:idx('g19_return'),map:'m51'});Object.assign(s.flags,{route:'good',goodTowerDepartureReady:true,goodTowerRoseFreed:true,companion:'蔷薇'});return new GameEngine(s);}
function arrive(g){g.s.map=g.q.map;g.s.phase='talk';g.resetParty();Object.assign(g.s.hero,g.scene.spawn);}
function stage(g,reload=false){const qid=g.q.id;assert.ok(STAGED_QUESTS[qid],qid);assert.ok(g.startStaging(),qid+' can start');let saved=false;for(let n=0;n<12000&&g.s.sequence;n++){const step=g.stagingDefinition().steps[g.s.sequence.step];if(reload&&!saved&&g.s.sequence.step>2){g=new GameEngine(restoreState(snapshot(g)));saved=true;assert.equal(g.q.id,qid);assert.ok(g.s.sequence);}
if(step?.type==='say')g.advanceStaging();else g.tick(.05);if(qid==='g20_stay'&&g.s.sequence?.cues.valleyCareLight==='day')assert.equal(g.scene.atmosphere.light,'day','explicit dawn overrides title');}
assert.equal(g.s.sequence,null,qid+' stage terminates');assert.ok(g.s.flags['staged_'+qid]);checks++;return g;}
function setupNight(){let g=make();g=stage(g,true);assert.equal(g.q.id,'g19_burial');assert.equal(g.s.flags.companion,null);arrive(g);g=stage(g,true);assert.equal(g.q.id,'g20_escort');assert.equal(g.s.flags.companion,'蔷薇');assert.equal(g.scene.props.some(p=>p.label==='孟知秋之墓'),true);arrive(g);g=stage(g,true);assert.equal(g.q.id,'g20');assert.equal(g.s.flags.companion,null);return g;}
for(let accepted=1;accepted<=4;accepted++){
 let g=setupNight();const coins=g.s.coins,affection=g.s.affection.wei;
 for(let call=1;call<=accepted;call++){
  if(call>1){assert.equal(g.q.id,'g20_return'+(call-1));assert.equal(g.beginObjective(),undefined);assert.equal(g.q.id,'g20_return'+(call-1),'cannot skip room travel');arrive(g);g=stage(g,true);assert.equal(g.q.id,'g20_call'+call);arrive(g);}
  g=stage(g,true);assert.equal(g.s.phase,'choice');const id=g.q.id;assert.equal(g.choose(call===accepted?0:1),true);assert.equal(g.choose(1),false,'committed choice cannot be replayed');g=new GameEngine(restoreState(snapshot(g)));assert.equal(g.s.affection.wei,affection-(call-1)+(call===accepted?2:-1));assert.ok(g.s.done.includes(id));
 }
 assert.equal(g.q.id,'g20_stay');assert.equal(g.s.flags.forsake,false);assert.equal(g.s.flags.goodRoseDead,undefined);arrive(g);g=stage(g,true);assert.equal(g.q.id,'g21');assert.equal(g.s.map,'m23');assert.equal(g.s.flags.companion,'蔷薇');assert.equal(g.s.coins,coins+15,'only existing first choice pays');assert.equal(g.s.flags.goodRoseNightComplete,true);checks++;
}
for(const visit of [0,1]){
 let g=setupNight();const coins=g.s.coins;
 for(let call=1;call<=4;call++){
  if(call>1){arrive(g);g=stage(g);arrive(g);}g=stage(g,call===2);assert.equal(g.choose(1),true);assert.equal(g.choose(1),false);
 }
 assert.equal(g.q.id,'g20_cry');assert.equal(g.s.flags.forsake,true);assert.ok(!g.s.flags.goodRoseDead);assert.equal(g.s.affection.wei,-4);arrive(g);g=stage(g,true);assert.equal(g.choose(visit),true);assert.equal(g.q.id,visit===0?'g20_lastwords':'g20_founddead');assert.ok(!g.s.flags.goodRoseDead);g=new GameEngine(restoreState(snapshot(g)));arrive(g);g=stage(g,true);assert.equal(g.q.id,'g20_rose_burial');assert.equal(g.s.flags.goodRoseDead,true);assert.equal(g.s.flags.companion,null);arrive(g);assert.ok(!g.scene.props.some(p=>p.label==='蔷薇之墓'));g=stage(g,true);assert.equal(g.q.id,'gBad1');assert.equal(g.s.flags.goodRoseBuried,true);assert.ok(g.scene.props.some(p=>p.label==='蔷薇之墓'));assert.equal(g.s.coins,coins+15);checks++;
}
// Narrative footpoints must not become invented stone props or traders beside the body.
{const g=make();assert.ok(!g.markers.some(m=>m.kind==='shop'));assert.equal(g.markers.find(m=>m.id==='staging-start').paintOnly,true);checks++;}
// Malformed and old decisions must not invent a new performance or award.
{const g=setupNight(),raw=snapshot(g);raw.phase='after';const r=new GameEngine(restoreState(raw));assert.notEqual(r.s.phase,'after');const before=copy(r.s);r.completeQuest();assert.deepEqual(r.s,before);checks++;}
console.log(JSON.stringify({result:'PASS',checks,scope:'authored staging, branch commitments, cross-room requirements, both bereavement paths, once-only first-choice award, refresh at each stage; not full-game fidelity proof'}));
