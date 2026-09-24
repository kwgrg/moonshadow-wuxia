import assert from 'node:assert/strict';
import {QUESTS,REVISION_FOURTEEN_QUEST_IDS} from '../public/campaign.mjs';
import {GOOD_TOWER_ENCOUNTERS,GOOD_TOWER_VALLEY_ADDITIONS} from '../public/good-tower-valley-revisions.mjs';
import {GOOD_TOWER_VALLEY_STAGING} from '../public/good-tower-valley-staging.mjs';
import {migrateGoodTowerValley} from '../public/good-tower-valley-migration.mjs';
const oldIds=REVISION_FOURTEEN_QUEST_IDS,baseline={"identityTiers":[["a01",1],["a02",1],["a03",1],["a04",1],["a05",1],["a06",1],["a07",1],["a08",1],["a09",1],["a10",2],["a11",2],["a12",2],["a13",2],["a14",2],["a15",2],["a16",2],["a17",2],["a18",2],["a19",3],["a20",3],["a21",3],["a22",3],["a23",3],["a24",3],["a25",3],["a26",3],["a27",3],["a28",4],["a29",4],["a30",4],["a31",4],["a32",4],["a33",4],["a34",4],["a35",4],["a36",4],["a37",5],["a38",5],["a39",5],["a40",5],["a41",5],["a42",5],["a43",5],["a44",5],["a45",5],["a46",6],["a47",6],["a48",6],["a49",6],["a50",6],["a51",6],["a52",6],["a53",6],["a54",6],["a55",7],["a56",7],["a57",7],["a58",7],["a59",7],["a60",7],["a61",7],["a62",7],["a63_trial",7],["a63_zi",8],["a63",8],["a64",8],["a65",8],["a66",8],["a67",8],["a68",8],["b01",8],["b02",8],["b02_ambush",9],["b03",9],["b04",9],["b05",9],["b06",9],["b07",9],["g01",9],["g02",9],["g03",9],["g03_return",10],["g03_invitation",10],["g04",10],["g05",10],["g06",10],["g06_confide",10],["g06_inquire",10],["g06_request",10],["g06_return",10],["g06_introduce",11],["g06_rest",11],["g07",10],["g07_dawn",11],["g07_visit",11],["g07_zhen",11],["g07_apology",11],["g07_mainland",11],["g07_island",11],["g07_settle",12],["g08",10],["g08_deliver",10],["g09",10],["g10",11],["g11",11],["g12",11],["g13_hut",12],["g13_entry",12],["g13_reunion",13],["g13",11],["g13_captured",13],["g13_ferry",13],["g14_dock_report",12],["g14_manor_battle",13],["g14",11],["g14_hanbo",13],["g14_resolve",13],["g15",11],["gCult_wudang",11],["gCult_appointment",11],["gCult_qiangwei",11],["gCult_zixuan",12],["gCult_farewell",12],["gCult_epilogue",12],["g15_escape",14],["g16",12],["g16_homecoming",15],["g17",12],["g17_departure",15],["g17_manor",15],["g18",12],["gTower1",12],["gTower2",12],["gTower3",12],["gTower4",13],["gTower5",13],["gTower6",13],["gTower7",13],["gTower8",13],["g19",13],["g20",13],["g21",13],["g22",13],["g23",14],["g24",14],["gBad1",14],["gBad2",14],["e01",14],["e02",14],["e03_masked_duel",14],["e03",14],["e04",14],["e04_departure",16],["e04_dream",16],["e04_homecoming",17],["e04_quarrel",17],["e04_wait",17],["e04_report",17],["e05",15],["e06",15],["e06_kill",15],["e06_refuse",15],["e06_aftermath",15],["e06_night",15],["e06_night_visit",15],["e06_escort",15],["e06_ferry",15],["e06_landing",16],["e06_first_interlude",17],["e06_rest",16],["e07_village",16],["e07_approach",16],["e07_entry",16],["e07_first",16],["e07_second",16],["e07_gate",16],["e07",16],["e08_interlude",17],["e08_island_battle",17],["e08_departure",17],["e08",17],["e08_refuse",17],["e08_kill",17],["e09_report",17],["e09_first_wake",17],["e09",17],["e09_part",18],["e09_sleepless",18],["e09_second_meeting",18],["e09_room_talk",18],["e09_morning",18],["e10_teaching",18],["e10",18],["e11",18],["e12",18],["eTower1",19],["eSwitch1",19],["eTower2",19],["eSwitch2",19],["eTower3",19],["eSwitch3",19],["eTower4",19],["eSwitch4",19],["eTower5",19],["eSwitch5",20],["eTower6",20],["eSwitch6",20],["eTower7",20],["eSwitch7",20],["eTower8",20],["eSwitch8",20],["e13",20],["e14",20]]};
const get=id=>QUESTS.find(q=>q.id===id);
assert.equal(oldIds.length,213);assert.deepEqual(oldIds,baseline.identityTiers.map(([id])=>id));
for(const [id,tier] of baseline.identityTiers)assert.equal(get(id).encounterTier,tier,id+' historical tier');
assert.equal(new Set(QUESTS.map(q=>q.id)).size,QUESTS.length);assert.equal(GOOD_TOWER_VALLEY_ADDITIONS.flatMap(x=>x.quests).length,15);
const count=[38,29,37,41,34,30,43],enemyIds=[];
for(let floor=1;floor<=7;floor++){
 const q=get('gTower'+floor),encounter=GOOD_TOWER_ENCOUNTERS['m'+(61+floor)];
 assert.equal(q.type,'passage');assert.equal(q.towerPassage.toMap,'m'+(62+floor));assert.equal(q.skirmish,null);assert.equal(q.count,0);
 assert.equal(encounter.skirmish.enemies.length,count[floor-1]);assert.equal(encounter.skirmish.allies.length,0);assert.equal(encounter.xp,0);assert.equal(encounter.money,0);
 assert(!q.requiredFlags?.some(key=>/clear|kill|sheep/i.test(key)));enemyIds.push(...encounter.skirmish.enemies.map(e=>e.id));
}
assert.equal(enemyIds.length,252);assert.equal(new Set(enemyIds).size,252);assert.equal(get('gTower8').type,'talk');assert.equal(get('gTower8').skirmish,null);
assert.equal(get('g20').repeatRefusal,false);assert.equal(get('g20').xp,65);assert.equal(get('g20').money,15);
for(const {quests} of GOOD_TOWER_VALLEY_ADDITIONS)for(const q of quests){assert.equal(q.xp,0);assert.equal(q.money,0);assert.equal(q.map,GOOD_TOWER_VALLEY_STAGING[q.id].map);assert.equal(GOOD_TOWER_VALLEY_STAGING[q.id].steps.at(-1).type,'release');}
for(const id of ['g19','g20','g20_call2','g20_call3','g20_call4','g20_cry'])assert.equal(get(id).commitBeforeDialogue,true,id);
assert.equal(get('g19_return').rewards.companion,null);assert.equal(get('g19_burial').rewards.companion,'蔷薇');assert.equal(get('g20_escort').rewards.companion,null);assert.equal(get('g20_stay').rewards.companion,'蔷薇');assert.deepEqual(get('g20_stay').transition,{map:'m23'});
const matches=(w,f)=>!w||(!w.route||w.route===f.route)&&(!w.flag||f[w.flag])&&(!w.not||!f[w.not])&&!w.notAll?.some(k=>f[k]);
const dataNext=(id,flags)=>QUESTS.slice(QUESTS.indexOf(get(id))+1).find(q=>matches(q.when,flags))?.id;
for(let accepted=1;accepted<=4;accepted++){
 const flags={route:'good',goodRoseNightReady:true};let current='g20';
 for(let n=1;n<=accepted;n++){
  assert.equal(current,n===1?'g20':`g20_call${n}`);
  const q=get(current),option=q.choice.options[n===accepted?0:1];Object.assign(flags,option.effects.flags);
  const next=dataNext(current,flags);
  if(n===accepted){assert.equal(next,'g20_stay');assert.equal(flags.forsake,false);assert(!flags.goodRoseDead);Object.assign(flags,get(next).rewards.flags);assert.equal(dataNext(next,flags),'g21');}
  else{assert.equal(next,`g20_return${n}`);assert.equal(get(next).map,'r_leaf_hero_room');Object.assign(flags,get(next).rewards.flags);current=dataNext(next,flags);assert.equal(get(current).map,'r_leaf_rose_room');}
 }
}
for(const visit of [0,1]){
 const flags={route:'good',goodRoseNightReady:true};
 for(let n=1;n<=4;n++){const id=n===1?'g20':`g20_call${n}`;Object.assign(flags,get(id).choice.options[1].effects.flags);if(n<4){assert.equal(flags.forsake,undefined);Object.assign(flags,get(`g20_return${n}`).rewards.flags);}}
 assert.equal(flags.forsake,true);assert.equal(dataNext('g20_call4',flags),'g20_cry');assert(!flags.goodRoseDead);
 Object.assign(flags,get('g20_cry').choice.options[visit].effects.flags);
 const death=dataNext('g20_cry',flags);assert.equal(death,visit===0?'g20_lastwords':'g20_founddead');assert(!flags.goodRoseDead);
 Object.assign(flags,get(death).rewards.flags);assert.equal(dataNext(death,flags),'g20_rose_burial');Object.assign(flags,get('g20_rose_burial').rewards.flags);assert.equal(dataNext('g20_rose_burial',flags),'gBad1');
}
let cases=0;
function migrate(version,id,extra={},numeric=false){
 const raw={campaignRevision:version,quest:oldIds.indexOf(id),...(numeric?{}:{questId:id}),map:extra.map||get(id)?.map||'m51',coins:817,inventory:{elixir:3},...extra};
 const s={quest:QUESTS.findIndex(q=>q.id===id),map:raw.map,flags:{route:'good',companion:'紫轩',...(extra.flags||{})},choices:{...(extra.choices||{})},done:[...(extra.done||[])],claimedRewards:[...(extra.claimedRewards||[])],coins:817,inventory:{elixir:3},hero:{hp:73,level:31},affection:{wei:7},phase:'choice',sequence:{bad:true},enemies:[{id:'old-circle'}],allies:[],failure:extra.failure};
 const stable=JSON.stringify([s.coins,s.inventory,s.hero,s.affection,s.done,s.claimedRewards,s.choices]);
 const out=migrateGoodTowerValley(raw,s,QUESTS,oldIds);assert.equal(JSON.stringify([s.coins,s.inventory,s.hero,s.affection,s.done,s.claimedRewards,s.choices]),stable,'history/economy unchanged');
 assert(!Object.keys(s.flags).some(k=>k.startsWith('staged_')));cases++;return {raw:out,s,id:QUESTS[s.quest].id};
}
for(let version=1;version<=14;version++)for(const numeric of [false,true]){
 for(let floor=1;floor<=8;floor++){const a=migrate(version,'gTower'+floor,{},numeric);assert.equal(a.id,'gTower'+floor);assert.equal(a.s.flags.companion,null);assert.equal(a.s.flags.goodTowerLegacyAccess,true);assert.deepEqual(a.s.enemies,[]);}
 let a=migrate(version,'g19',{},numeric);assert.equal(a.id,'g19');assert.equal(a.s.flags.goodTowerLegacyAscent,true);
 for(const answer of [0,1]){a=migrate(version,'g19',{choices:{g19:answer},claimedRewards:['g19']},numeric);assert.equal(a.id,'g19_departure');assert.equal(a.s.flags.goodTowerKissed,answer===0);assert.equal(a.s.flags.companion,'蔷薇');}
 a=migrate(version,'g20',{},numeric);assert.equal(a.id,'g19_return');assert.equal(a.s.flags.companion,'蔷薇');
 for(let n=1;n<=3;n++){a=migrate(version,'g20',{flags:{refusals:n},choices:{g20:1}},numeric);assert.equal(a.id,`g20_return${n}`);assert.equal(a.s.flags['goodRoseRefusal'+n],true);assert.equal(a.s.flags.goodTowerLegacyNight,true);assert.equal(a.s.flags.companion,null);}
 a=migrate(version,'g20',{flags:{refusals:2},choices:{g20:0}},numeric);assert.equal(a.id,'g20_stay');assert.equal(a.s.flags.goodRoseStayed,true);
 a=migrate(version,'g20',{flags:{refusals:4,forsake:true},choices:{g20:1}},numeric);assert.equal(a.id,'g20_cry');assert.equal(a.s.flags.goodRoseDead,undefined);
 for(const later of ['g21','gBad1','g22']){a=migrate(version,later,{},numeric);assert.equal(a.id,later);assert.equal(a.s.flags.goodTowerValleyLegacy,true);assert.equal(a.s.flags.goodTowerHomecoming,undefined);}
 a=migrate(version,'gTower8',{done:['gTower8']},numeric);assert.equal(a.id,'g19');assert.equal(a.s.flags.goodTowerLegacyAscent,true);
 for(const early of ['g18','g15']){a=migrate(version,early,{},numeric);assert.equal(a.id,early);assert.equal(a.s.flags.goodTowerLegacyAccess,undefined);}
}
for(const extra of [{flags:{route:'evil'}},{flags:{cultPath:true}},{ending:'cult'},{completed:true},{campaignRevision:15}]){const a=migrate(14,'g20',extra);assert.equal(a.id,'g20');assert.equal(a.s.flags.goodTowerLegacyRoseFreed,undefined);}
console.log(`Good tower/valley data PASS: 213 stable IDs/tiers, 252 independent enemies, 4 stay positions, 2 death paths, ${cases} migration fixtures; no browser or native-play claim.`);
