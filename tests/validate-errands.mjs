import assert from 'node:assert/strict';
import {GameEngine,freshState,restoreState,QUESTS,distance} from '../public/runtime.mjs';

// These checks exercise the independent web state machine. They do not prove
// original choreography, map fidelity, combat balance, or browser presentation.
const index=id=>QUESTS.findIndex(q=>q.id===id);
const quest=id=>QUESTS[index(id)];
const visibleCompanions=(game,name)=>[...game.markers.filter(actor=>actor.sprite!=null),...(game.companion?[game.companion]:[])].filter(actor=>actor.name===name);
function create(id){
 const s=freshState();s.quest=index(id);assert.ok(s.quest>=0,id+' exists');s.map=quest(id).map;s.phase='talk';s.flags.route='good';
 const game=new GameEngine(s);Object.assign(game.s.hero,game.scene.spawn);return game;
}
function saved(game){return JSON.parse(JSON.stringify({...game.s,questId:game.q.id}));}
function collect(game,marker){
 const old=game.s.collected;game.interact(marker);
 for(let t=0;t<1800&&game.s.collected===old;t++)game.tick(.05);
 assert.equal(game.s.collected,old+1,'walking to a herb collects exactly one plant');
}
function walk(game,to,companion){
 const from=game.s.map;assert.equal(game.travel(to),true,'route is open');let steps=0;
 while(game.s.map!==to&&steps++<18000){
  if(companion)assert.equal(visibleCompanions(game,companion).length,1,'escort remains present exactly once through the route');
  game.tick(.05);
 }
 assert.equal(game.s.map,to,from+' walks to '+to);assert.ok(steps<18000);
 if(companion)assert.equal(visibleCompanions(game,companion).length,1,'escort arrives with the player exactly once');
}
function finishStaging(game){
 const previous=game.onEvent;game.onEvent=(name,data)=>{previous(name,data);if(name==='stagingDialogue')game.advanceStaging();};
 for(let t=0;t<12000&&game.s.phase==='staging';t++)game.tick(.05);
 assert.notEqual(game.s.phase,'staging','the treatment scene must release control');game.onEvent=previous;
}
function greetAndComplete(game){
 let interacted=false,staged=false;game.onEvent=name=>{if(name==='interact')interacted=true;if(name==='stagingStep')staged=true;};
 const marker=game.markers.find(m=>m.main&&m.kind!=='travel');assert.ok(marker);
 game.interact(marker);for(let t=0;t<1800&&!interacted&&!staged;t++)game.tick(.05);
 assert.ok(interacted||staged,'must reach the giver before handover');
 if(!staged)game.beginObjective();finishStaging(game);
}

// The missing person cannot remain visibly following while being searched for.
for(const id of ['g01','g02']){
 const game=create(id);game.s.flags.companion='纳兰真';assert.equal(game.companion,null);
}
assert.equal(quest('g01').rewards.companion,null);

// Losing the rescue battle grants neither the rescued escort nor the sword art.
const rescue=create('g03');delete rescue.s.skills[6];rescue.beginObjective();assert.equal(rescue.s.phase,'battle');
rescue.s.hero.hp=1;const enemy=rescue.s.enemies[0];Object.assign(enemy,{x:rescue.s.hero.x,y:rescue.s.hero.y,attackTimer:0,skillTimer:100,telegraph:0});
for(let t=0;t<30&&!rescue.paused;t++)rescue.tick(.05);
assert.equal(rescue.paused,true);assert.equal(rescue.s.skills[6],undefined);assert.notEqual(rescue.s.flags.companion,'蔷薇');assert.ok(!rescue.s.done.includes('g03'));
rescue.retry();assert.equal(rescue.s.phase,'battle');
for(const enemy of rescue.s.enemies){enemy.hp=1;Object.assign(rescue.s.hero,{x:enemy.x,y:enemy.y});rescue.s.cooldowns[0]=0;rescue.cast(0);}
assert.equal(rescue.s.phase,'after');rescue.completeQuest();
assert.equal(rescue.q.id,'g03_return');assert.equal(rescue.s.skills[6],undefined,'rescue alone must not teach Taiji');assert.equal(rescue.companion?.name,'蔷薇');
walk(rescue,'m51','蔷薇');assert.equal(rescue.s.skills[6],undefined,'arrival alone must not claim the reward');greetAndComplete(rescue);
assert.equal(rescue.q.id,'g03_invitation');assert.ok(Object.hasOwn(rescue.s.skills,6));assert.equal(rescue.companion,null);
const rewarded=saved(rescue),mastery=rescue.s.skills[6];walk(rescue,'m49');greetAndComplete(rescue);assert.equal(rescue.q.id,'g04');
walk(rescue,rescue.q.map);rescue.s.phase='after';rescue.completeQuest();assert.equal(rescue.companion?.name,'纳兰真','Zhen returns only after the misunderstanding is resolved');
const duplicate=new GameEngine(restoreState(rewarded));duplicate.s.quest=index('g03_return');duplicate.s.map='m51';duplicate.s.phase='talk';
const rewardBefore={exp:duplicate.s.hero.exp,coins:duplicate.s.coins};duplicate.completeQuest();
assert.equal(duplicate.s.skills[6],mastery);assert.deepEqual({exp:duplicate.s.hero.exp,coins:duplicate.s.coins},rewardBefore);

// Collect in an arbitrary order. Save with eleven plants, reload, then finish.
let herbs=create('g08');herbs.s.flags.companion='纳兰真';assert.equal(herbs.companion,null);herbs.beginObjective();assert.equal(herbs.s.phase,'search');
const order=[11,2,8,0,6,3,10,4,1,9,5,7];let firstMarker;
for(const i of order.slice(0,11)){
 const marker=herbs.markers.find(m=>m.kind==='search'&&m.index===i);assert.ok(marker);if(!firstMarker)firstMarker=marker;collect(herbs,marker);
}
assert.equal(herbs.s.collected,11);assert.equal(herbs.s.inventory.silver_grass||0,0,'unfinished search has no batch reward');
herbs=new GameEngine(restoreState(saved(herbs)));assert.equal(herbs.s.collected,11);
Object.assign(herbs.s.hero,herbs.nearestOpen(firstMarker.x,firstMarker.y));assert.equal(herbs.interact(firstMarker),false);assert.equal(herbs.s.collected,11,'an old marker cannot farm another plant');
collect(herbs,herbs.markers.find(m=>m.kind==='search'&&m.index===order.at(-1)));assert.equal(herbs.s.phase,'after');herbs.completeQuest();
assert.equal(herbs.q.id,'g08_deliver');assert.equal(herbs.s.inventory.silver_grass,12);assert.equal(herbs.s.inventory.jade_half||0,0);assert.ok(!herbs.s.flags.silverGrassDelivered);
walk(herbs,'m33');assert.equal(herbs.s.inventory.silver_grass,12,'walking home does not consume the herbs');
const beforeHandover=saved(herbs);greetAndComplete(herbs);
assert.equal(herbs.q.id,'g09');assert.equal(herbs.s.inventory.silver_grass,0);assert.equal(herbs.s.inventory.jade_half,2);assert.equal(herbs.s.flags.silverGrassDelivered,true);assert.equal(herbs.s.flags.companion,'纳兰真');assert.equal(visibleCompanions(herbs,'纳兰真').length,1,'fixed healer and follower must not be drawn twice');
assert.ok(herbs.s.done.includes('g08_deliver'));assert.ok(herbs.s.claimedRewards.includes('g08_deliver'));
assert.equal(herbs.s.hero.exp,beforeHandover.hero.exp);assert.equal(herbs.s.coins,beforeHandover.coins,'splitting a handover adds no money or experience');
const afterHandover=saved(herbs);walk(herbs,'m56','纳兰真');assert.equal(visibleCompanions(herbs,'纳兰真').length,1,'destination giver and follower must not duplicate');herbs.beginObjective();assert.equal(herbs.s.phase,'search');assert.equal(herbs.companion?.name,'纳兰真','searching beyond the giver restores ordinary following');const restored=new GameEngine(restoreState(afterHandover));assert.equal(restored.s.inventory.jade_half,2);assert.equal(restored.s.inventory.silver_grass,0);
restored.s.quest=index('g08_deliver');restored.s.map='m33';restored.s.phase='talk';restored.completeQuest();assert.equal(restored.s.inventory.jade_half,2);assert.equal(restored.s.inventory.silver_grass,0,'duplicate handover cannot consume twice');

// One missing plant must block interaction, direct start, and direct completion.
const short=create('g08_deliver');short.s.inventory.silver_grass=11;let talks=0;const events=[];short.onEvent=(name,detail)=>{events.push({name,detail});if(name==='interact')talks++;};
const giver=short.markers.find(m=>m.main&&m.kind!=='travel');Object.assign(short.s.hero,short.nearestOpen(giver.x,giver.y));
assert.ok(distance(short.s.hero,giver)<135);assert.equal(short.interact(giver),false);short.beginObjective();short.completeQuest();
assert.equal(talks,0);assert.equal(short.q.id,'g08_deliver');assert.equal(short.s.inventory.silver_grass,11);assert.equal(short.s.inventory.jade_half||0,0);assert.ok(!short.s.done.includes('g08_deliver'));assert.ok(events.some(e=>e.name==='toast'&&e.detail.text.includes('银丝草')));
short.s.inventory.silver_grass=14;short.beginObjective();finishStaging(short);assert.equal(short.q.id,'g09');assert.equal(short.s.inventory.silver_grass,2,'only the required twelve are consumed');assert.equal(short.s.inventory.jade_half,2);

// The chamber cannot start before the two halves exist; it does not grant them.
for(const count of [0,1]){const chamber=create('g09');chamber.s.inventory.jade_half=count;chamber.beginObjective();assert.equal(chamber.s.phase,'talk');assert.equal(chamber.s.collected,0);chamber.completeQuest();assert.equal(chamber.q.id,'g09');assert.equal(chamber.s.inventory.mother_letter||0,0);}
const chamber=create('g09');chamber.s.inventory.jade_half=2;chamber.beginObjective();assert.equal(chamber.s.phase,'search');
while(chamber.s.phase==='search')collect(chamber,chamber.markers.find(m=>m.kind==='search'));
chamber.completeQuest();assert.equal(chamber.s.inventory.jade_half,2);assert.equal(chamber.s.inventory.mother_letter,1);

// Revision-two saves already narrated the handover. Migration settles that old
// ledger once; current-format missing-item saves must never receive free items.
const legacy=create('g09');legacy.s.done=['g03','g08'];legacy.s.claimedRewards=['g03','g08'];legacy.s.inventory={silver_grass:14};legacy.s.skills[6]=275;
const raw=saved(legacy);raw.campaignRevision=2;const migrated=restoreState(raw);
assert.equal(QUESTS[migrated.quest].id,'g09');assert.equal(migrated.skills[6],275);assert.equal(migrated.inventory.silver_grass,2);assert.equal(migrated.inventory.jade_half,2);assert.ok(migrated.done.includes('g08_deliver'));assert.ok(migrated.claimedRewards.includes('g08_deliver'));assert.equal(migrated.flags.silverGrassDelivered,true);assert.equal(migrated.hero.exp,raw.hero.exp);assert.equal(migrated.coins,raw.coins);
const migratedAgain=restoreState(JSON.parse(JSON.stringify({...migrated,questId:'g09'})));assert.equal(migratedAgain.inventory.silver_grass,2);assert.equal(migratedAgain.inventory.jade_half,2);assert.equal(migratedAgain.skills[6],275);
raw.inventory.jade_half=2;assert.equal(restoreState(raw).inventory.jade_half,2,'legacy possession is not doubled');
const oldMeeting=create('g04');oldMeeting.s.done=['g03'];oldMeeting.s.claimedRewards=['g03'];oldMeeting.s.skills[6]=275;oldMeeting.s.flags.companion='纳兰真';const meetingRaw=saved(oldMeeting);meetingRaw.campaignRevision=2;const meeting=new GameEngine(restoreState(meetingRaw));assert.equal(meeting.q.id,'g04','completed old rescue is not replayed');assert.equal(meeting.s.skills[6],275);assert.equal(meeting.companion,null,'old following state must not reveal the missing person before the duel');
raw.campaignRevision=3;raw.inventory={silver_grass:11};const modern=restoreState(raw);assert.equal(modern.inventory.silver_grass,11);assert.equal(modern.inventory.jade_half||0,0);assert.ok(!modern.done.includes('g08_deliver'),'modern saves cannot masquerade as a narrated legacy handover');
raw.campaignRevision=2;raw.done=[];raw.claimedRewards=[];assert.equal(restoreState(raw).inventory.jade_half||0,0,'old version alone is insufficient without the completed gathering event');

for(const id of ['g03_return','g03_invitation','g08_deliver']){assert.equal(quest(id).when.route,'good');const evil=create(id);evil.s.flags.route='evil';assert.equal(evil.matches(quest(id).when),false);}
console.log('PASS: escort route, defeat/retry and delayed Taiji; twelve herbs with save/reload; missing-item gates, exact one-time consumption, jade/chamber ledger, legacy migration and branch isolation.');
