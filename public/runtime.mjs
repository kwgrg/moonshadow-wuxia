import {migrateGoodRescue} from './good-rescue-migration.mjs';
import {rescueMethods} from './rescue-runtime.mjs';
import {migrateGoodForbidden} from './good-forbidden-migration.mjs';
import {migrateHutReturn} from './hut-return-migration.mjs';
import {migrateValleyDefense} from './valley-defense-migration.mjs';
import {migrateHutNight} from './hut-night-migration.mjs';
import {migrateValleyCare} from './valley-care-migration.mjs';
import {partyMethods} from './travel-party.mjs';
import {jumpMethods} from './jump-runtime.mjs';
import {migrateManorNight} from './manor-night-migration.mjs';
import {migrateEvilDocks} from './evil-docks-migration.mjs';
import {restorePursuit,pursuitMethods} from './pursuit-runtime.mjs';
import { getScene, getStagingScene } from './world.mjs';
import {restoreStaging,restoreStagedHandovers,stagingMethods,hasStagingBranch} from './staging-runtime.mjs';
import {restoreSkirmish,skirmishMethods} from './skirmish-runtime.mjs';
import {recruitmentMethods} from './recruitment-runtime.mjs';
import {exitsFor,shortestRoute} from './routes.mjs';
import { QUESTS, MAPS, SKILLS, ITEMS, ENDINGS, SIDE_QUESTS, chooseEnding, LEGACY_QUEST_IDS, REVISION_TWO_QUEST_IDS, REVISION_THREE_QUEST_IDS, REVISION_FOUR_QUEST_IDS, REVISION_FIVE_QUEST_IDS, REVISION_SIX_QUEST_IDS, REVISION_SEVEN_QUEST_IDS, REVISION_EIGHT_QUEST_IDS, REVISION_NINE_QUEST_IDS, REVISION_TEN_QUEST_IDS, REVISION_ELEVEN_QUEST_IDS, REVISION_TWELVE_QUEST_IDS, REVISION_THIRTEEN_QUEST_IDS } from './campaign.mjs';
export { QUESTS, MAPS, SKILLS, ITEMS, ENDINGS, SIDE_QUESTS };
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const copy=o=>JSON.parse(JSON.stringify(o));
const singleChoice=q=>!!q.choice&&!q.refusalRule&&!q.repeatRefusal&&!q.switchPuzzle;
const recordedChoice=(q,state)=>{const answer=state.choices[q.id];return Number.isInteger(answer)&&q.choice?.options?.[answer]?answer:null;};
const choiceFlagsMatch=(q,state)=>{const answer=recordedChoice(q,state);return answer!==null&&Object.entries(q.choice.options[answer].effects?.flags||{}).every(([key,value])=>state.flags[key]===value);};
// A recorded answer owns its static branch state. Resuming it never repeats
// score, items, skills, healing, or any other cumulative choice effect.
function repairChoiceAssignments(q,state,answer){const effects=q.choice.options[answer].effects||{};Object.assign(state.flags,effects.flags||{});if(effects.companion!==undefined)state.flags.companion=effects.companion;}
export function freshState(){const spawn=getScene(QUESTS[0].map,MAPS[QUESTS[0].map]).spawn;return {version:3,campaignRevision:14,quest:0,map:QUESTS[0].map,phase:'talk',stage:0,wave:0,training:null,sequence:null,pursuit:null,stagedHandovers:{},failure:null,destination:null,objectiveProgress:null,hero:{x:spawn.x,y:spawn.y,hp:300,maxHp:300,mp:180,maxMp:180,stamina:100,level:1,exp:0,direction:1},potions:5,elixirs:3,coins:150,kills:0,choices:{},flags:{moral:0,evil:0},affection:{zhen:0,zi:0,mei:0,wei:0},inventory:{},equipment:{weapon:'family_sword',armor:'cotton_robe'},skills:{1:0,3:0},hotbar:[1,3,null,null,null],cooldowns:Array(SKILLS.length).fill(0),enemies:[],allies:[],skirmish:null,visited:[QUESTS[0].map],done:[],claimedRewards:[],sideDone:[],opened:[],collectedIds:[],collected:0,completed:false,ending:null,playTime:0};}
export function restoreState(raw){
 if(raw&&!raw.questId&&raw.campaignRevision!==14){const ids=raw.campaignRevision===13?REVISION_THIRTEEN_QUEST_IDS:raw.campaignRevision===12?REVISION_TWELVE_QUEST_IDS:raw.campaignRevision===11?REVISION_ELEVEN_QUEST_IDS:raw.campaignRevision===10?REVISION_TEN_QUEST_IDS:raw.campaignRevision===9?REVISION_NINE_QUEST_IDS:raw.campaignRevision===8?REVISION_EIGHT_QUEST_IDS:raw.campaignRevision===7?REVISION_SEVEN_QUEST_IDS:raw.campaignRevision===6?REVISION_SIX_QUEST_IDS:raw.campaignRevision===5?REVISION_FIVE_QUEST_IDS:raw.campaignRevision===4?REVISION_FOUR_QUEST_IDS:raw.campaignRevision===3?REVISION_THREE_QUEST_IDS:raw.campaignRevision===2?REVISION_TWO_QUEST_IDS:LEGACY_QUEST_IDS;if(ids[raw.quest])raw={...raw,questId:ids[raw.quest]};}
 if(raw?.questId){const index=QUESTS.findIndex(q=>q.id===raw.questId);if(index<0)throw new Error('存档中的任务不在当前流程中');raw={...raw,quest:index};}
 if(!raw||raw.version!==3||!Number.isInteger(raw.quest)||!QUESTS[raw.quest]||!MAPS[raw.map]||!raw.hero)throw new Error('此存档不属于当前流程版本');
 const s=freshState(),h=raw.hero;
 for(const k of ['x','y','hp','maxHp','mp','maxMp','stamina','level','exp'])if(!Number.isFinite(h[k]))throw new Error('角色资料不完整');
 s.quest=raw.quest;s.map=raw.map;s.phase=['talk','battle','search','after','choice','travel','complete','escape','return','training','staging','pursuit','failed'].includes(raw.phase)?raw.phase:'talk';s.stage=clamp(Number(raw.stage)||0,0,30);
 s.hero={x:clamp(h.x,120,1460),y:clamp(h.y,180,950),maxHp:clamp(h.maxHp,300,10000),maxMp:clamp(h.maxMp,180,6000),level:clamp(Math.floor(h.level),1,99),exp:clamp(h.exp,0,999999),hp:clamp(h.hp,1,10000),mp:clamp(h.mp,0,6000),stamina:clamp(h.stamina,0,100),direction:h.direction===-1?-1:1};s.hero.hp=Math.min(s.hero.hp,s.hero.maxHp);s.hero.mp=Math.min(s.hero.mp,s.hero.maxMp);
 for(const k of ['potions','elixirs','coins','kills','collected','playTime'])s[k]=clamp(Number(raw[k])||0,0,999999);
 s.skills={1:0,3:0};for(const [key,value] of Object.entries(raw.skills||{}))if(/^\d+$/.test(key)&&SKILLS[key]&&Number.isFinite(value))s.skills[key]=clamp(value,0,1000);
 if(QUESTS[s.quest].id==='e10'&&!Object.hasOwn(s.skills,8)){s.quest=QUESTS.findIndex(q=>q.id==='e10_teaching');s.phase=s.map===QUESTS[s.quest].map?'talk':'travel';}
 s.hotbar=Array.isArray(raw.hotbar)?raw.hotbar.slice(0,5).map(v=>SKILLS[v]&&Object.hasOwn(s.skills,v)?v:null):s.hotbar;while(s.hotbar.length<5)s.hotbar.push(null);
 for(const id of Object.keys(ITEMS))if(Number.isFinite(raw.inventory?.[id]))s.inventory[id]=clamp(Math.floor(raw.inventory[id]),0,999);
 s.equipment={weapon:ITEMS[raw.equipment?.weapon]?.type==='weapon'?raw.equipment.weapon:'family_sword',armor:ITEMS[raw.equipment?.armor]?.type==='armor'?raw.equipment.armor:'cotton_robe'};
 s.visited=Array.isArray(raw.visited)?[...new Set(raw.visited.filter(id=>MAPS[id]))]:[s.map];if(!s.visited.includes(s.map))s.visited.push(s.map);
 s.done=Array.isArray(raw.done)?[...new Set(raw.done.filter(id=>QUESTS.some(q=>q.id===id)))]:[];s.claimedRewards=[...new Set([...s.done,...(Array.isArray(raw.claimedRewards)?raw.claimedRewards.filter(id=>QUESTS.some(q=>q.id===id)):[])])];s.sideDone=Array.isArray(raw.sideDone)?raw.sideDone.filter(id=>SIDE_QUESTS.some(q=>q.id===id)):[];s.opened=Array.isArray(raw.opened)?raw.opened.filter(v=>typeof v==='string').slice(0,500):[];
 if((raw.campaignRevision||1)<3&&s.done.includes('g08')&&!s.done.includes('g08_deliver')){s.inventory.silver_grass=Math.max(0,(s.inventory.silver_grass||0)-12);s.inventory.jade_half=Math.max(2,s.inventory.jade_half||0);s.done.push('g08_deliver');s.claimedRewards.push('g08_deliver');}
 for(const k of Object.keys(s.affection))s.affection[k]=clamp(Number(raw.affection?.[k])||0,-99,99);
 for(const [key,value] of Object.entries(raw.flags||{}))if(/^[a-zA-Z][\w-]{0,50}$/.test(key)&&['string','number','boolean'].includes(typeof value))s.flags[key]=value;
 if((raw.campaignRevision||1)<3&&s.done.includes('g08_deliver'))s.flags.silverGrassDelivered=true;
 for(const [key,value] of Object.entries(raw.choices||{})){const q=QUESTS.find(q=>q.id===key);if(Number.isInteger(value)&&value>=0&&q?.choice?.options?.[value])s.choices[key]=value;}
 // Preserve historical progress as a legacy summary, without pretending the new scenes were played.
 if((raw.campaignRevision||1)<5&&s.flags.route==='evil'){
  const id=QUESTS[s.quest].id,passed=s.done.includes('e06')||s.quest>=QUESTS.findIndex(q=>q.id==='e07');
  if(passed){for(const key of ['evilQiangweiDecision','evilQiangweiDead','evilFamilyHeard','evilNightPassed','evilEscortStarted','evilFerryReady','evilIslandArrived','evilZhenMissing'])s.flags[key]=true;s.flags.evilLegacyJourney=true;}
  if(id==='e06'&&!s.done.includes('e06')){s.phase=s.map===QUESTS[s.quest].map?'talk':'travel';raw={...raw,sequence:null,objectiveProgress:null};delete s.flags.staged_e06;}
 }
 // Older saves already at the revealed encounter keep that history explicitly;
 // do not claim that newly authored pursuit/staging was played or grant its rewards.
 if((raw.campaignRevision||1)<6&&s.flags.route==='evil'){
  if(s.done.includes('e06_night')||s.flags.evilNightPassed)s.flags.evilDreamEnded=true;
  if(s.quest>=QUESTS.findIndex(q=>q.id==='e07')){
   for(const key of ['evilTrailVillage','evilTrailApproach','evilTrailEntry','evilTrailFirst','evilTrailSecond','evilGateOpened'])s.flags[key]=true;
   s.flags.evilLegacyReveal=true;
  }
  if(QUESTS[s.quest].id==='e06_night'&&!s.done.includes('e06_night')){raw={...raw,sequence:null};s.phase=s.map===QUESTS[s.quest].map?'talk':'travel';}
 }
 // New dream and private-room staging is restarted only when still pending.
 // Unknown historical choices remain explicitly unknown, never invented.
 if((raw.campaignRevision||1)<7&&s.flags.route==='evil'){
  const id=QUESTS[s.quest].id;
  if(s.choices.e06===0||s.choices.e06===1){s.flags.evilQiangweiKill=s.choices.e06===1;s.flags.evilQiangweiRefuse=s.choices.e06===0;}
  if(['e06_night','e06_night_visit'].includes(id)&&!s.done.includes(id)){
   if(!s.flags.evilQiangweiKill&&!s.flags.evilQiangweiRefuse)s.flags.evilLegacyDreamUnknown=true;
   raw={...raw,sequence:null,objectiveProgress:null};delete s.flags['staged_'+id];
   s.phase=s.map===QUESTS[s.quest].map?'talk':'travel';
  }
 }
 raw=migrateEvilDocks(raw,s,QUESTS,REVISION_SEVEN_QUEST_IDS,MAPS,getScene);
 raw=migrateManorNight(raw,s,QUESTS,REVISION_EIGHT_QUEST_IDS,MAPS,getScene);
 raw=migrateValleyCare(raw,s,QUESTS,REVISION_NINE_QUEST_IDS,MAPS,getScene);
 raw=migrateHutNight(raw,s,QUESTS,REVISION_TEN_QUEST_IDS);
 raw=migrateHutReturn(raw,s,QUESTS,REVISION_ELEVEN_QUEST_IDS);
 raw=migrateValleyDefense(raw,s,QUESTS,REVISION_ELEVEN_QUEST_IDS);
 raw=migrateGoodForbidden(raw,s,QUESTS,REVISION_TWELVE_QUEST_IDS);
 raw=migrateGoodRescue(raw,s,QUESTS,REVISION_THIRTEEN_QUEST_IDS);
 s.collectedIds=Array.isArray(raw.collectedIds)?[...new Set(raw.collectedIds.filter(i=>Number.isInteger(i)&&i>=0&&i<(QUESTS[s.quest].count||1)))]:Array.from({length:Math.min(s.collected,QUESTS[s.quest].count||1)},(_,i)=>i);s.collected=s.collectedIds.length;
 if(QUESTS[s.quest].id==='e13'&&!s.flags.switch8){s.quest=QUESTS.findIndex(q=>q.id==='eTower6');s.collected=0;s.collectedIds=[];s.phase='travel';}
 s.ending=ENDINGS[raw.ending]?raw.ending:null;s.completed=!!s.ending;s.phase=s.completed?'complete':s.map!==QUESTS[s.quest].map?'travel':s.phase;
 if(QUESTS[s.quest].training){
  const rule=QUESTS[s.quest].training,old=raw.training;
  const defeated=old?.questId===QUESTS[s.quest].id&&Array.isArray(old.defeated)?[...new Set(old.defeated.filter(i=>Number.isInteger(i)&&i>=0&&i<rule.opponents))]:(raw.wave===1?Array.from({length:rule.requiredWins},(_,i)=>i):[]);
  s.training={questId:QUESTS[s.quest].id,defeated,active:null,master:false,finished:old?.finished===true||raw.phase==='after'};
  if(s.map===QUESTS[s.quest].map){if(s.training.finished)s.phase='after';else if(['battle','training'].includes(s.phase))s.phase='training';}
 }
 s.stagedHandovers=restoreStagedHandovers(raw.stagedHandovers,QUESTS);
 s.sequence=restoreStaging(raw.sequence,QUESTS[s.quest],s);if(s.sequence){s.phase='staging';s.hero.pose=s.sequence.heroPose;}else if(s.phase==='staging'){s.phase=s.map===QUESTS[s.quest].map?'talk':'travel';if(raw.sequence?.sceneKey)Object.assign(s.hero,getScene(s.map,MAPS[s.map]).spawn);}
 s.pursuit=restorePursuit(raw.pursuit,QUESTS[s.quest],s,MAPS[QUESTS[s.quest].map]);if(s.map===QUESTS[s.quest].map&&s.pursuit)s.phase='pursuit';else if(s.phase==='pursuit')s.phase='talk';
 s.destination=MAPS[raw.destination]?raw.destination:null;
 const progress=raw.objectiveProgress;if(progress?.questId===QUESTS[s.quest].id&&['talk','search','return','after','choice','training','pursuit'].includes(progress.phase))s.objectiveProgress={questId:progress.questId,phase:progress.phase,collectedIds:Array.isArray(progress.collectedIds)?[...new Set(progress.collectedIds.filter(i=>Number.isInteger(i)&&i>=0&&i<(QUESTS[s.quest].count||1)))]:[]};
 if(s.objectiveProgress?.phase==='pursuit'&&!s.pursuit)s.objectiveProgress.phase='talk';
 // Unanswered or inconsistent after-states must resume their decision/prelude.
 const current=QUESTS[s.quest];
 if(singleChoice(current)&&!s.done.includes(current.id)){
  const answer=recordedChoice(current,s),ready=!current.requireStaging||s.flags['staged_'+current.id]||s.flags[current.legacyStagingFlag];
  if(answer===null||!choiceFlagsMatch(current,s)){
   const phase=!ready||(answer===null&&current.battleBeforeChoice)?'talk':'choice';
   if(s.phase==='after')s.phase=phase;if(s.objectiveProgress?.phase==='after')s.objectiveProgress.phase=phase;
  }
 }
 if(s.phase==='battle'||s.phase==='escape'||(['search','return'].includes(s.phase)&&QUESTS[s.quest].timeLimit)){s.phase='talk';s.collected=0;s.collectedIds=[];}
 restoreSkirmish(raw,QUESTS[s.quest],s);
 if(s.skirmish)s.cooldowns=SKILLS.map((skill,id)=>clamp(Number(raw.cooldowns?.[id])||0,0,skill?.cooldown||0));
 const rule=QUESTS[s.quest].refusalRule,key='refusal_'+(rule?.key||QUESTS[s.quest].id);
 if(rule?.outcome==='fatal'&&raw.failure?.kind==='refusal'&&raw.failure.questId===QUESTS[s.quest].id&&Number(s.flags[key])>=rule.limit){s.failure={kind:'refusal',questId:QUESTS[s.quest].id,hpBefore:clamp(Number(raw.failure.hpBefore)||s.hero.maxHp*.25,1,s.hero.maxHp)};s.flags[key]=rule.limit;s.phase='failed';s.hero.hp=0;s.enemies=[];s.sequence=null;s.destination=null;}
 else if(s.phase==='failed')s.phase='talk';
 // Rebuild the earned shore rest pose; arbitrary saved poses are not trusted.
 if(!s.sequence&&s.phase==='talk'&&s.map===current.map&&current.id==='e06_rest'&&(s.flags.evilFirstTowerInterludeComplete||s.flags.evilLegacyFirstTowerInterlude))s.hero.pose='sit';
 return s;
}
export class GameEngine{
 constructor(state=freshState()){this.s=state;this.target=null;this.waypoints=[];this.keys=new Set();this.effects=[];this.numbers=[];this.time=0;this.paused=!!state.failure||!!state.skirmish?.failed;this.active=true;this.attackTarget=null;this.onEvent=()=>{};this.hitTime=0;this.dashTime=0;this.walkTime=0;this.attackAngle=0;this.autoInteract=null;this.meditating=false;this.settings={difficulty:'normal',controls:'modern',quality:'high',volume:.35,motion:true};this.followPosition={x:730,y:780};Object.assign(this.s.hero,this.nearestOpen(this.s.hero.x,this.s.hero.y));this.resetParty();this.repairSkirmishPositions?.();}
 get q(){return QUESTS[this.s.quest]}
 get encounter(){if(this.q.training){const t=this.ensureTraining();return {...this.q,waves:null,count:1,type:t.master?'boss':'battle',boss:t.master?this.q.boss:null,enemy:t.master?this.q.boss:this.trainingName(t.active),scriptedLoss:t.master,friendly:true};}const wave=this.q.waves?.[this.s.wave||0];return wave?{...this.q,...wave,type:wave.boss?'boss':'battle',boss:wave.boss||null,scriptedLoss:!!wave.scriptedLoss}:this.q;}
 ensureTraining(){if(!this.q.training)return null;if(this.s.training?.questId!==this.q.id)this.s.training={questId:this.q.id,defeated:[],active:null,master:false};return this.s.training;}
 trainingName(index){return Number.isInteger(index)?'武当弟子·'+(this.q.training?.names?.[index]||String(index+1)):'武当弟子';}
 get region(){return MAPS[this.s.map];}
 hasReachedQuest(id){const index=QUESTS.findIndex(q=>q.id===id);return index>=0&&(this.s.quest>=index||this.s.done.includes(id));}
 get scene(){
  const dream=this.stagingScene();if(dream)return dream;
  let scene=getScene(this.s.map,this.region);
  if(scene.mechanism?.closedFootprint&&!this.s.flags.evilGateOpened&&!this.s.sequence?.cues.gateOpen)scene={...scene,obstacles:[...scene.obstacles,scene.mechanism.closedFootprint]};
  // Keep the newly staged island return in daylight without changing earlier visits.
  if(this.s.map==='m40'&&this.s.flags.evilIslandCleared&&['e08_departure','e08'].includes(this.q.id))scene={...scene,atmosphere:{...scene.atmosphere,light:'day'}};
  if(this.s.flags.route==='evil'&&this.s.flags.evilManorNightStarted&&['m49','m50','r_beimo_hero_room','r_beimo_mei_room'].includes(this.s.map)&&!this.hasReachedQuest('e10')){const morning=this.s.flags.evilManorNightComplete||this.s.flags.evilLegacyManorNight||this.s.sequence?.cues.manorDaybreak;scene={...scene,atmosphere:{...scene.atmosphere,light:morning?'day':'night'}};}
  if(this.s.flags.route==='good'&&(this.s.flags.valleyCareStarted||this.s.flags.valleyLegacyCarePrelude)&&['m51','m52','r_leaf_hero_room','r_leaf_mei_room','r_leaf_zhen_room','r_leaf_rose_room'].includes(this.s.map)&&!this.hasReachedQuest('g08')){const cue=this.s.sequence?.cues.valleyCareLight,night=cue?cue==='night':!this.s.flags.valleyCareMorning&&(this.s.flags.valleyCareNight||this.s.flags.valleyLegacyCarePrelude);return {...scene,atmosphere:{...scene.atmosphere,light:night?'night':'day'}};}
  if(this.s.map==='m16'&&this.s.flags.route==='evil'&&['e04_departure','e04_dream','e05'].includes(this.q.id)){const morning=this.s.sequence?.cues.hutTime==='morning'||this.s.flags.evilHutNightComplete||this.s.flags.evilLegacyHutNight;scene={...scene,atmosphere:{...scene.atmosphere,light:morning?'day':'night'}};}
  if(this.s.flags.route==='evil'&&['e04_homecoming','e04_quarrel','e04_wait','e04_report'].includes(this.q.id)&&['m49','m50','r_beimo_rose_room','r_beimo_hero_room'].includes(this.s.map)){const cue=this.s.sequence?.cues.hutReturnTime,night=cue?cue==='night':this.s.flags.evilHutQiangweiLeft&&!this.s.flags.evilHutReturnMorning;return {...scene,atmosphere:{...scene.atmosphere,light:night?'night':'day'}};}
  if(this.s.map!==this.q.map)return scene;
  const title=this.q.title,night=this.q.sceneLight==='night'||/夜/.test(title)||(this.q.choiceAfterDark&&this.s.phase==='choice'),rain=/雨/.test(title);
  return night||rain?{...scene,atmosphere:{...scene.atmosphere,light:night?'night':scene.atmosphere.light,weather:rain?'rain':scene.atmosphere.weather}}:scene;
 }
 stagingScene(){const sequence=this.s.sequence,definition=this.stagingDefinition();return this.s.phase==='staging'&&definition?.sceneKeys?.includes(sequence?.sceneKey)?getStagingScene(sequence.sceneKey):null;}
 get chapter(){const m=this.region,q=this.q;return {...m,name:q.title,number:q.act,banner:m.name,place:m.name+' · '+m.area,quest:q.title,npc:q.npc||'江湖纪事',npcX:q.x??this.scene.objective.x,npcY:q.y??this.scene.objective.y,sprite:q.sprite||0,enemies:q.count||3,enemyName:q.enemy||'敌方武人'};}
 get npc(){return this.markers.find(m=>m.main)||this.markers[0]||{x:1000,y:600,name:'江湖路',sprite:0,kind:'travel'};}
 get partyNames(){return this.travelPartyNames();}
 get companions(){return this.travelCompanions();}
 get companion(){return this.companions[0]||null;}

 get searchPoints(){
  const defaults=[[1120,640],[680,760],[1270,850],[840,565],[440,580],[970,830],[620,540],[1220,480],[360,790],[1030,690],[780,890],[1330,730]];
  return Array.from({length:this.q.count||1},(_,index)=>{
   const specified=this.q.searchPoints?.[index],xy=defaults[index%defaults.length];
   return {...this.nearestOpen(specified?.x??xy[0],specified?.y??xy[1]),name:specified?.name||this.q.object||'线索',text:specified?.text||null,index};
  });
 }
 get markers(){
  const q=this.q,at=this.s.map===q.map,list=[],scene=this.scene,revealed=this.s.flags['staged_'+q.id]||this.s.flags[q.legacyStagingFlag];
  if(at&&!this.s.completed){
   if(q.rescueMission){const marker=this.rescueMarker();if(marker)list.push(marker);}
   else if(this.s.phase==='search'){for(const point of this.searchPoints)if(!this.s.collectedIds.includes(point.index))list.push({...point,id:'search-'+point.index,kind:'search',main:true,sprite:null});}
   else if(this.s.phase==='return')list.push({id:'return',kind:'return',...scene.objective,name:q.npc||'交还物品',main:true,sprite:q.sprite});
   else if(this.s.phase==='escape')list.push({id:'escape',kind:'escape',x:q.x??scene.exit.x,y:q.y??scene.exit.y,name:q.object||'出口',main:true,sprite:null});
   else if(q.pursuit){const marker=this.pursuitMarker();if(marker)list.push(marker);}
   else if(this.canStartStaging()){const definition=this.stagingDefinition(),point=definition.startPoint||definition.trigger||definition.heroStart||scene.objective;list.push({id:'staging-start',kind:'main',x:point.x,y:point.y,name:definition.label||(q.id==='a03'?'池边石碑':q.id==='a01'?'辞别父亲':'走近酒肆'),main:true,sprite:null});}
   else if(!['battle','training','staging'].includes(this.s.phase))list.push({id:'main',kind:'main',x:q.x??scene.objective.x,y:q.y??scene.objective.y,name:(this.s.phase==='choice'&&q.choiceSpeaker)||(revealed&&q.stagedNpc)||q.npc||q.object||'江湖纪事',main:true,sprite:this.s.phase==='choice'?(q.choiceSprite??q.sprite):revealed?(q.stagedSprite??q.sprite):q.sprite,...(this.s.phase==='after'?q.afterMarker||{}:{})});
  }
  if(at&&q.training&&['training','battle','after'].includes(this.s.phase)){
   const t=this.ensureTraining();
   for(let i=0;i<q.training.opponents;i++){
    if(this.s.phase==='battle'&&t.active===i)continue;
    const p=scene.trainingPositions?.[i]||{x:500+(i%5)*150,y:650+Math.floor(i/5)*160},won=t.defeated.includes(i);
    list.push({id:'training-'+i,kind:'training',opponentIndex:i,...p,name:this.trainingName(i)+(won?' · 已切磋':''),displayName:q.training.names[i]+(won?'·已切磋':''),main:!won&&this.s.phase==='training',sprite:0,defeated:won});
   }
   if(!t.master&&this.s.phase!=='after'){const unlocked=t.defeated.length>=q.training.requiredWins;list.push({id:'training-master',kind:unlocked?'master':'trainingObserver',...scene.objective,name:q.boss,main:unlocked&&this.s.phase==='training',sprite:0});}
  }
  if(at&&q.skirmish&&this.s.phase==='after'){const main=list.find(marker=>marker.main),leader=this.s.allies.find(ally=>ally.name===q.npc&&ally.hp>0);if(main&&leader)Object.assign(main,{x:leader.x,y:leader.y,direction:leader.direction,npcCell:leader.npcCell});}
  const stagedActors=this.stagingActors();
  if(at&&['talk','choice'].includes(this.s.phase)){
   const mainIndex=list.findIndex(marker=>marker.id==='main'&&marker.kind==='main'),main=list[mainIndex];
   const actor=main&&stagedActors.find(actor=>actor.name===main.name);
   if(actor){
    // A dialogue target keeps its identity but occupies the actor's final footpoint.
    // Fallen actors remain scenery and must not become standing quest targets.
    if(actor.interactive===false||actor.pose==='fallen')list.splice(mainIndex,1);
    else for(const key of ['x','y','direction','pose','sprite','npcCell','renderAt','renderScale'])if(Object.hasOwn(actor,key))main[key]=actor[key];
   }
  }
  list.push(...stagedActors.filter(actor=>!list.some(marker=>marker.name===actor.name)));
  if(this.s.phase==='battle'&&this.rescueReady()){const exit=this.exits().find(e=>e.to===q.rescueMission.exitMap&&!e.locked),portal=exit&&scene.portals?.[exit.to];if(portal)list.push({...portal.exit,id:'exit-'+exit.to,kind:'travel',name:'带紫轩返回楼上',to:exit.to,locked:false,main:true,sprite:null});}
  if(!['battle','staging'].includes(this.s.phase)){
   if(this.region.shop&&!(this.s.flags.route==='good'&&(this.q.id==='g06'||this.s.flags.valleyCareStarted||this.s.flags.valleyLegacyCarePrelude)&&!this.s.flags.valleyCareSettled&&this.s.map==='m51')&&!(this.s.flags.route==='evil'&&this.s.flags.evilManorNightStarted&&['m49','m50','r_beimo_hero_room','r_beimo_mei_room'].includes(this.s.map)&&!this.hasReachedQuest('e10')))list.push({id:'shop',kind:'shop',x:650,y:650,name:'行脚商人',sprite:0});
   for(const exit of this.exits()){const portal=scene.portals?.[exit.to];if(portal)list.push({...exit,...portal.exit,kind:'travel',name:exit.locked?'暂未通行 · '+MAPS[exit.to].name:(exit.travelLabel||'前往 '+MAPS[exit.to].name),sprite:null,main:!exit.locked&&exit.to===this.routeTo(this.s.destination||q.map)[1]});}
   for(const side of SIDE_QUESTS.filter(q=>q.map===this.s.map&&!this.s.sideDone.includes(q.id)))list.push({id:side.id,kind:'side',x:scene.sidePositions?.[side.id]?.x??side.x??570,y:scene.sidePositions?.[side.id]?.y??side.y??780,name:side.npc,sprite:side.sprite??null});
   for(const point of scene.points)list.push({...point,sprite:null,main:false,opened:this.s.opened.includes(this.s.map+':'+point.id)});
  }
  if(!this.s.sequence&&!this.s.completed)list.push(...this.jumpMarkers());
  return list;
 }
 emit(type,data={}){this.onEvent(type,data);}
 addNumber(text,x,y,color='#ffe3a0'){this.numbers.push({text:String(text),x,y,life:1.15,color});}
 addEffect(kind,x,y,radius,color,life=.7){this.effects.push({kind,x,y,radius,color,life,total:life,angle:this.attackAngle});}
 passable(x,y){
  const [left,top,right,bottom]=this.scene.bounds;
  return x>=left&&x<=right&&y>=top&&y<=bottom&&!this.scene.obstacles.concat(this.stagingScene()?[]:this.region.obstacles||[]).some(r=>x>r[0]-8&&x<r[2]+8&&y>r[1]-8&&y<r[3]+8);
 }
 nearestOpen(x,y){
  const [left,top,right,bottom]=this.scene.bounds;
  x=clamp(x,left+12,right-12);y=clamp(y,top+12,bottom-12);
  if(this.passable(x,y))return {x,y};
  for(let radius=20;radius<600;radius+=20)for(let i=0;i<16;i++){
   const px=x+Math.cos(i*Math.PI/8)*radius,py=y+Math.sin(i*Math.PI/8)*radius;
   if(this.passable(px,py))return {x:px,y:py};
  }
  return {...this.scene.spawn};
 }
 clearSegment(a,b){
  if(!this.passable(a.x,a.y)||!this.passable(b.x,b.y))return false;
  const dx=b.x-a.x,dy=b.y-a.y,obstacles=this.scene.obstacles.concat(this.stagingScene()?[]:this.region.obstacles||[]);
  for(const r of obstacles){
   let low=0,high=1,hit=true;
   for(const [origin,delta,min,max] of [[a.x,dx,r[0]-8+1e-7,r[2]+8-1e-7],[a.y,dy,r[1]-8+1e-7,r[3]+8-1e-7]]){
    if(Math.abs(delta)<1e-12){if(origin<min||origin>max){hit=false;break;}}
    else{const t1=(min-origin)/delta,t2=(max-origin)/delta;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));if(low>high){hit=false;break;}}
   }
   if(hit)return false;
  }
  return true;
 }
 findPath(x,y,origin=this.s.hero){
  if(!this.passable(x,y))return [];
  if(this.clearSegment(origin,{x,y}))return [{x,y}];
  const [left,top,right,bottom]=this.scene.bounds,step=30,key=(a,b)=>a+','+b;
  const gridPoint=([a,b])=>({x:left+a*step,y:top+b*step});
  const nearestCell=point=>{
   let best=null,bestDistance=Infinity;
   for(let a=0;a<=(right-left)/step;a++)for(let b=0;b<=(bottom-top)/step;b++){
    const p=gridPoint([a,b]),d=Math.hypot(p.x-point.x,p.y-point.y);
    if(d<bestDistance&&this.passable(p.x,p.y)&&this.clearSegment(point,p)){best=[a,b];bestDistance=d;}
   }
   return best;
  };
  const start=nearestCell(origin),goal=nearestCell({x,y});if(!start||!goal)return [];
  const queue=[start],seen=new Set([key(...start)]),prev=new Map();let head=0,found=false;
  while(head<queue.length){const cell=queue[head++],[a,b]=cell;if(a===goal[0]&&b===goal[1]){found=true;break;}
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const next=[a+dx,b+dy],k=key(...next),p=gridPoint(next);
    if(seen.has(k)||!this.passable(p.x,p.y)||!this.clearSegment(gridPoint(cell),p))continue;
    seen.add(k);prev.set(k,cell);queue.push(next);
   }
  }
  if(!found)return [];let cell=goal,path=[{x,y}];
  while(key(...cell)!==key(...start)){path.push(gridPoint(cell));cell=prev.get(key(...cell));if(!cell)return [];}
  path.push(gridPoint(start));return path.reverse();
 }
 approach(marker){
  const options=[];
  for(const radius of [65,95,115])for(let i=0;i<12;i++){
   const point={x:marker.x+Math.cos(i*Math.PI/6)*radius,y:marker.y+Math.sin(i*Math.PI/6)*radius*.7};
   if(this.passable(point.x,point.y))options.push(point);
  }
  options.sort((a,b)=>distance(this.s.hero,a)-distance(this.s.hero,b));
  for(const p of options)if(this.moveTo(p.x,p.y))return true;
  return false;
 }
 moveTo(x,y){if(this.s.failure||this.s.sequence||this.jump)return false;this.waypoints=this.findPath(x,y);if(!this.waypoints.length)this.waypoints=this.pathToJumpFor({x,y});this.target=this.waypoints.shift()||null;this.attackTarget=null;this.meditating=false;return !!this.target;}
 interact(marker=null){if(this.paused||this.s.phase==='staging'||this.jump)return false;const m=marker||this.markers.filter(m=>m.main).sort((a,b)=>distance(this.s.hero,a)-distance(this.s.hero,b))[0]||this.npc;if(!m||m.interactive===false||m.hidden||m.pose==='fallen')return false;
  if(this.s.completed&&!['travel','inspect','chest'].includes(m.kind)){this.emit('ending');return true;}if(this.s.phase==='battle'&&!(m.kind==='rescue'&&this.canStartRescueStaging())&&!(m.kind==='travel'&&this.rescueReady()&&m.to===this.q.rescueMission.exitMap)){this.emit('toast',{text:'先解决眼前的对手。'});return false;}
  if(distance(this.s.hero,m)>135){if(this.approach(m))this.autoInteract=m.id;else this.emit('toast',{text:'这里暂时走不过去，请从另一侧接近。'});return false;}
  this.autoInteract=null;this.target=null;this.waypoints=[];
  if(m.kind==='rescue')return this.startStaging();
  if(m.kind==='jump')return this.startJump(m.jumpId,m.side);
  if(m.kind==='pursuit'&&this.s.phase==='pursuit')return this.followPursuit();
  if(m.kind==='stagingActor'){if(this.canStartStaging())return this.startStaging();if(m.dialogue?.length){this.emit('residentDialogue',{lines:m.dialogue});return true;}this.emit('toast',{text:'此刻没有新的交谈。'});return false;}
  if(m.kind==='training'){if(this.ensureTraining()?.defeated.includes(m.opponentIndex)){this.emit('toast',{text:'这一场已经切磋过了，请另择对手。'});return false;}return this.challengeTraining(m.opponentIndex);}
  if(m.kind==='master')return this.challengeTraining(null);
  if(m.kind==='trainingObserver'){this.emit('toast',{text:'先与五名不同的弟子切磋，再来请教张惟宜。'});return false;}
  if(m.kind==='search'){
   if(this.s.collectedIds.includes(m.index))return false;
   this.s.collectedIds.push(m.index);this.s.collected=this.s.collectedIds.length;
   this.addEffect('heal',m.x,m.y,55,'#e1cd8e');this.emit('collect',{name:m.name,text:m.text});
   if(this.s.collected>=(this.q.count||1)){this.s.phase=this.q.returnToGiver?'return':'after';this.emit('objective');}return true;
  }
  if(m.kind==='inspect'||m.kind==='chest'){
   const id=this.s.map+':'+m.id,first=!this.s.opened.includes(id);
   if(first){this.s.opened.push(id);for(const key of ['coins','potions','elixirs'])this.s[key]+=Math.max(0,m.reward?.[key]||0);}
   this.emit('explore',{name:m.name,text:m.text,reward:first?m.reward:null,empty:!first&&m.kind==='chest'});return true;
  }
  if(m.kind==='return'){this.s.phase='after';this.emit('objective');return true;}
  if(m.kind==='escape'){this.completeQuest();return true;}if(m.kind==='shop')this.emit('shop');else if(m.kind==='travel'){if(m.locked){this.emit('toast',{text:m.reason||'前路尚未开放。'});return false;}return this.enterMap(m.to);}else if(m.kind==='side')this.emit('side',{id:m.id});else{if(!this.requireQuestItems())return false;this.emit('interact');}return true;
 }
 requireItems(items){const missing=Object.entries(items||{}).filter(([id,count])=>(this.s.inventory[id]||0)<count);if(missing.length){this.emit('toast',{text:'还需要：'+missing.map(([id,count])=>(ITEMS[id]?.name||id)+' '+count+' 份').join('、')});return false;}return true;}
 requireQuestFlags(){if(!hasStagingBranch(this.q,this.s)){this.emit('toast',{text:'先完成当前答复的结果，再继续前行。'});return false;}if(this.q.when?.route&&(this.s.flags.route||'good')!==this.q.when.route)return false;if(this.q.requiredFlags?.some(key=>!this.s.flags[key])||this.q.requiredAnyFlags?.some(group=>!group.some(key=>this.s.flags[key]))){this.emit('toast',{text:this.q.requirementText||'牢门仍锁着，需要先接通全部楼层的机关。'});return false;}return true;}
 beginObjective(){if(this.s.failure||this.s.skirmish?.failed||this.s.map!==this.q.map)return;if(!this.requireQuestItems()||!this.requireQuestFlags())return;if(this.q.rescueMission){this.ensureRescueEncounter();if(this.canStartRescueStaging())this.startStaging();return;}if(this.canStartStaging()){this.startStaging();return;}if(this.s.sequence)return;const q=this.q;if(q.pursuit){this.startPursuit();return;}if(q.battleBeforeChoice&&this.s.phase==='choice'){this.emit('choice');return;}if(q.training){this.ensureTraining();this.s.phase='training';this.emit('objective');return;}if(q.choiceBeforeObjective&&!Object.hasOwn(this.s.choices,q.id)){this.s.phase='choice';this.emit('choice');return;}if(q.battleBeforeChoice){this.startBattle();return;}if(q.type==='battle'||q.type==='boss'){this.startBattle();return;}if(q.type==='escape'){this.s.phase='escape';this.s.timer=q.duration;this.emit('objective');return;}if(['search','fetch','puzzle'].includes(q.type)){this.s.collected=0;this.s.collectedIds=[];this.s.timer=q.timeLimit||0;this.s.phase='search';this.emit('objective');return;}if(q.type==='choice'||q.choice){this.s.phase='choice';this.emit('choice');return;}this.completeQuest();}
 challengeTraining(index){
  if(!this.q.training||this.s.phase!=='training'||this.s.map!==this.q.map)return false;
  const t=this.ensureTraining();
  if(index===null){if(t.defeated.length<this.q.training.requiredWins)return false;t.master=true;t.active=null;}
  else{if(!Number.isInteger(index)||index<0||index>=this.q.training.opponents||t.defeated.includes(index))return false;t.active=index;t.master=false;}
  this.startBattle();this.emit('trainingStart',{name:this.encounter.enemy,master:t.master});return true;
 }
 finishTrainingWin(){
  const t=this.ensureTraining();if(!t||t.active===null)return false;
  const name=this.trainingName(t.active);if(!t.defeated.includes(t.active))t.defeated.push(t.active);
  t.active=null;t.master=false;this.s.enemies=[];this.s.phase='training';this.attackTarget=null;this.target=null;this.waypoints=[];this.autoInteract=null;
  this.emit('trainingWin',{name,wins:t.defeated.length,required:this.q.training.requiredWins});return true;
 }
 startBattle(nextWave=false){
  if(this.s.failure||this.s.skirmish?.failed)return false;
  if(this.q.skirmish)return this.startSkirmish();
  if(this.q.training){const t=this.ensureTraining();if(t.active===null&&!t.master){this.s.phase='training';return false;}}
  if(!nextWave)this.s.wave=0;
  this.s.phase='battle';this.s.enemies=[];this.target=null;this.waypoints=[];this.attackTarget=null;const q=this.encounter,count=q.count||3,tier=this.q.encounterTier??Math.max(1,Math.floor(this.s.quest/9)+1);
  for(let i=0;i<count;i++){const boss=(q.type==='boss'||q.boss)&&i===count-1;const hp=q.scriptedLoss?8000:(boss?430:120)+tier*(boss?125:35);this.s.enemies.push({id:i,...this.nearestOpen(760+(i%4)*155,580+Math.floor(i/4)*110+(i%2)*50),hp,maxHp:hp,attackTimer:1.5+i*.4,telegraph:0,role:boss?'master':q.friendly?'sword':i%3===1?'ranged':i%3===2?'brute':'sword',skillTimer:2.5+i*.65,sprite:q.enemySprite??(q.friendly?0:3),name:boss?(q.boss||q.npc||'首领'):(q.enemy||'敌方武人'),boss,direction:-1,flash:0,tier,telegraphZone:null});}if(this.q.training&&this.s.enemies.length===1){const t=this.ensureTraining(),position=t.master?this.scene.objective:this.scene.trainingPositions?.[t.active];if(position)Object.assign(this.s.enemies[0],this.nearestOpen(position.x,position.y));}else{const actors=(this.stagingDefinition()?.actors||[]).filter(actor=>actor.enemy);for(let i=0;i<Math.min(actors.length,this.s.enemies.length);i++)Object.assign(this.s.enemies[i],this.nearestOpen(actors[i].x,actors[i].y),{name:actors[i].name});}this.emit('battle');
 }
 applyEffects(effects={}){for(const [k,v] of Object.entries(effects.flags||{}))this.s.flags[k]=v;for(const [k,v] of Object.entries(effects.affection||{}))if(k in this.s.affection)this.s.affection[k]+=v;this.s.flags.moral+=(effects.moral||0);this.s.flags.evil+=(effects.evil||0);for(const id of effects.skills||[])this.unlock(id);for(const [id,count] of Object.entries(effects.items||{}))if(ITEMS[id])this.s.inventory[id]=Math.max(0,(this.s.inventory[id]||0)+count);if(effects.companion!==undefined)this.s.flags.companion=effects.companion;if(effects.recover===true&&!this.s.failure&&!this.s.skirmish?.failed){this.s.hero.hp=this.s.hero.maxHp;this.s.hero.mp=this.s.hero.maxMp;this.s.hero.stamina=100;}}
 puzzleCorrect(index){const p=this.q.switchPuzzle;return !!p&&index===((this.s.flags.evil||0)>=p.evilThreshold?p.highCorrectIndex:p.lowCorrectIndex);}
 choose(index){
  const q=this.q,options=q.choice?.options;
  if(this.s.map!==q.map||this.s.phase!=='choice'||this.s.sequence||this.s.completed||this.s.failure||this.s.skirmish?.failed||this.s.done.includes(q.id)||!options||!Number.isInteger(index)||!options[index])return false;
  const answer=recordedChoice(q,this.s),resuming=singleChoice(q)&&answer!==null;
  if(resuming&&answer!==index)return false;
  if(!this.requireQuestFlags()||!this.requireQuestItems()||(!this.s.claimedRewards?.includes(q.id)&&!this.requireItems(this.outstandingItems(q.consumeItems))))return false;
  if(q.requireStaging&&!this.s.flags['staged_'+q.id]&&!this.s.flags[q.legacyStagingFlag])return false;
  const choice=options[index],puzzle=q.switchPuzzle;
  if(resuming){repairChoiceAssignments(q,this.s,answer);if(choice.ending)this.finish(choice.ending);else if(q.choiceBeforeObjective)this.beginObjective();else this.completeQuest();return true;}
  if(puzzle){
   if(this.puzzleCorrect(index)){this.s.flags[puzzle.successFlag]=true;this.s.choices[this.q.id]=index;this.completeQuest();}
   else{this.s.claimedRewards=[...new Set([...(this.s.claimedRewards||[]),...this.s.done])];for(const key of puzzle.resetFlags)this.s.flags[key]=false;this.s.done=this.s.done.filter(id=>!/^eSwitch[1-8]$/.test(id));this.s.quest=QUESTS.findIndex(q=>q.id===puzzle.retryQuestId);this.s.phase=this.s.map===this.q.map?'talk':'travel';this.s.collected=0;this.s.collectedIds=[];this.target=null;this.waypoints=[];this.autoInteract=null;this.emit('quest');}
   return true;
  }
  this.s.choices[this.q.id]=index;if(this.resolveRefusal(index))return true;this.applyEffects(choice.effects);if(this.q.repeatRefusal&&index===1){this.s.flags.refusals=(this.s.flags.refusals||0)+1;if(this.s.flags.refusals<4){this.emit('choice');return true;}this.s.flags.forsake=true;}if(choice.ending){this.finish(choice.ending);return true;}if(this.q.choiceBeforeObjective){this.beginObjective();return true;}this.completeQuest();return true;}
 completeQuest(){
  if(this.s.failure||this.s.skirmish?.failed||this.s.completed||this.s.sequence||this.s.map!==this.q.map)return;const q=this.q;if(singleChoice(q)&&!choiceFlagsMatch(q,this.s))return;if(q.id==='e09'){const answer=this.s.choices.e09;if(!this.s.flags.evilManorDecision||![0,1].includes(answer)||this.s.flags.evilMeiEscorted!==(answer===0)||this.s.flags.evilMeiAlone!==(answer===1))return;}if(q.pursuit&&(!this.s.pursuit?.finished||this.s.pursuit.questId!==q.id||this.s.phase!=='pursuit'))return;if(q.rescueMission&&(this._rescueExitCommit!==q.id||!this.rescueReady()))return;if(q.skirmish&&!q.rescueMission&&(!this.s.skirmish?.finished||this.s.phase!=='after'))return;if(q.refusalRule&&(this.s.phase!=='choice'||!Object.hasOwn(this.s.choices,q.id)||(this.s.choices[q.id]===(q.refusalRule.refuseIndex??1)&&this.refusalCount()<q.refusalRule.limit)))return;if(q.requireStaging&&!this.s.flags['staged_'+q.id]&&!this.s.flags[q.legacyStagingFlag]&&!this.s.done.includes(q.id))return;if(!this.requireQuestItems()||(!this.s.claimedRewards?.includes(q.id)&&!this.requireItems(this.outstandingItems(q.consumeItems))))return;if(q.training&&this.s.phase!=='after'){this.emit('toast',{text:'本次试剑尚未结束。'});return;}if(!this.requireQuestFlags())return;if(this.s.done.includes(q.id))return;this.s.done.push(q.id);const claimed=this.s.claimedRewards??=[];const firstReward=!claimed.includes(q.id);if(firstReward){claimed.push(q.id);for(const [id,count] of Object.entries(this.outstandingItems(q.consumeItems)))this.s.inventory[id]-=count;this.applyEffects(q.rewards);for(const [id,count] of Object.entries(q.ensureItems||{}))if(ITEMS[id])this.s.inventory[id]=Math.max(this.s.inventory[id]||0,count);this.gainExp(q.xp??65);this.s.coins+=q.money??15;if(!q.suppressBattleSupplies&&(q.type==='battle'||q.type==='boss')){this.s.potions++;this.s.elixirs++;}}else{for(const [key,value] of Object.entries(q.rewards?.flags||{}))this.s.flags[key]=value;if(q.rescueMission&&q.rewards?.companion!==undefined)this.s.flags.companion=q.rewards.companion;}
  if(q.setRoute){const affection=Object.values(this.s.affection).reduce((a,b)=>a+b,0);this.s.flags.route=affection>=2||(affection>=0&&this.s.flags.moral>=0)?'good':'evil';this.s.flags.companion=this.s.flags.route==='evil'?null:'纳兰真';}
  if(q.endingId){this.finish(q.endingId);return;}if(q.ending){this.finish(chooseEnding(this.s));return;}
  this.s.objectiveProgress=null;this.s.pursuit=null;this._pursuitPath=null;this._pursuitFollow=false;this.s.destination=null;this.s.allies=[];this.s.skirmish=null;this.s.quest++;while(QUESTS[this.s.quest]&&((QUESTS[this.s.quest].when&&!this.matches(QUESTS[this.s.quest].when))||this.s.done.includes(QUESTS[this.s.quest].id))){this.s.quest++;}
  if(this.s.quest>=QUESTS.length){this.s.quest=QUESTS.length-1;this.finish(chooseEnding(this.s));return;}
  this.s.phase=this.s.map===this.q.map?'talk':'travel';this.s.collected=0;this.s.collectedIds=[];this.s.enemies=[];this.target=null;this.waypoints=[];this.autoInteract=null;this.emit('quest');
 }
 matches(when){if(when.route){const route=this.s.flags.route||'good';if(route!==when.route)return false;}if(when.flag&&!this.s.flags[when.flag])return false;if(when.not&&this.s.flags[when.not])return false;if(when.notAll?.some(key=>this.s.flags[key]))return false;return true;}
 finish(id){if(!ENDINGS[id])id='reunion';this.s.ending=id;this.s.completed=true;this.s.phase='complete';this.s.flags.companion=null;this.emit('ending');}
 routeCache(){const keys=[...new Set(QUESTS.flatMap(q=>[q.when?.flag,q.when?.not,...(q.when?.notAll||[]),...(q.requiredFlags||[]),...(q.requiredAnyFlags||[]).flat()]).filter(Boolean))];const key=this.s.quest+'|'+this.s.flags['staged_'+this.q.id]+'|'+this.s.done.join(',')+'|'+this.s.flags.route+'|'+keys.map(k=>k+':'+this.s.flags[k]).join(',');if(this._routeCache?.key!==key)this._routeCache={key,exits:new Map(),paths:new Map()};return this._routeCache;}
 exits(){const cache=this.routeCache();if(!cache.exits.has(this.s.map))cache.exits.set(this.s.map,exitsFor(this.s.map,this.s,QUESTS));return cache.exits.get(this.s.map);}
 routeTo(id){const cache=this.routeCache(),key=this.s.map+'>'+id;if(!cache.paths.has(key))cache.paths.set(key,shortestRoute(this.s.map,id,this.s,QUESTS));return cache.paths.get(key);}
 travelBlocked(){return !!this.jump||!!this.s.failure||this.paused||(this.s.phase==='battle'&&!this.rescueReady())||['escape','staging'].includes(this.s.phase)||(['search','return'].includes(this.s.phase)&&this.q.timeLimit);}
 travel(id){
  if(this.travelBlocked()){this.emit('toast',{text:'当前交谈或挑战结束后才能离开。'});return false;}
  if(!MAPS[id])return false;if(id===this.s.map){this.s.destination=null;return true;}
  const route=this.routeTo(id);if(route.length<2){this.emit('toast',{text:'暂未找到通往此地的道路。'});return false;}
  const exit=this.markers.find(marker=>marker.kind==='travel'&&marker.to===route[1]&&!marker.locked);if(!exit)return false;
  this.s.destination=id;this.interact(exit);return true;
 }
 enterMap(id){
  if(this.travelBlocked())return false;const exit=this.exits().find(exit=>exit.to===id&&!exit.locked),portal=this.scene.portals?.[id];
  if(!exit||!portal||distance(this.s.hero,portal.exit)>135)return false;
  if(this.q.rescueMission&&this.s.map===this.q.map&&!this.finishRescueAtExit(id))return false;
  const from=this.s.map;if(from===this.q.map)this.s.objectiveProgress={questId:this.q.id,phase:this.s.phase,collectedIds:[...this.s.collectedIds]};this.s.map=id;if(!this.s.visited.includes(id))this.s.visited.push(id);
  this.s.phase=this.s.completed?'complete':id===this.q.map?(this.q.training&&this.s.training?.questId===this.q.id?(this.s.training.finished?'after':'training'):'talk'):'travel';
  const progress=this.s.objectiveProgress?.questId===this.q.id?this.s.objectiveProgress:null;
  if(id===this.q.map&&progress){this.s.phase=progress.phase;this.s.collectedIds=[...progress.collectedIds];this.s.collected=this.s.collectedIds.length;}else{this.s.collected=0;this.s.collectedIds=[];}this.target=null;this.waypoints=[];
  const entry=this.scene.portals?.[from]?.entry||this.scene.spawn;Object.assign(this.s.hero,this.nearestOpen(entry.x,entry.y));
  this.resetParty();this.jump=null;this.autoInteract=null;this.attackTarget=null;this.effects=[];this.s.enemies=[];this._portalCooldown=.8;
  if(this.s.destination===id)this.s.destination=null;this.emit('chapter');return true;
 }

 advance(){return this.travel(this.q.map);}
 unlock(id){if(!SKILLS[id]||Object.hasOwn(this.s.skills,id))return;this.s.skills[id]=0;const free=this.s.hotbar.indexOf(null);if(free!==-1)this.s.hotbar[free]=id;this.emit('unlock',{id});}
 equipSkill(id,slot){if(!SKILLS[id]||!Object.hasOwn(this.s.skills,id)||!Number.isInteger(slot)||slot<0||slot>4)return false;const existing=this.s.hotbar.indexOf(id);if(existing!==-1)this.s.hotbar[existing]=this.s.hotbar[slot];this.s.hotbar[slot]=id;return true;}
 skillLevel(id){return Math.min(10,1+Math.floor((this.s.skills[id]||0)/50));}
 damageBonus(){return (ITEMS[this.s.equipment.weapon]?.attack||0);}
 cast(index){const skill=SKILLS[index],h=this.s.hero;if(!skill||this.jump||this.paused||!this.active||this.s.completed||this.s.phase==='staging')return false;if(index!==0&&!Object.hasOwn(this.s.skills,index)){this.emit('toast',{text:'这门武学尚未习得。'});return false;}if(this.s.cooldowns[index]>0)return false;if(h.mp<skill.cost){this.emit('toast',{text:'内力不足，可用补气丹或在安全处打坐。'});return false;}if(skill.heal&&h.hp>=h.maxHp)return false;
  h.mp-=skill.cost;this.s.cooldowns[index]=skill.cooldown;this.hitTime=.3;this.emit('cast',{index});const level=this.skillLevel(index);if(index)this.s.skills[index]=Math.min(500,(this.s.skills[index]||0)+1);
  if(skill.heal){const amount=Math.min(h.maxHp-h.hp,130+h.level*14+level*10);h.hp+=amount;this.addNumber('+'+amount,h.x,h.y-100,'#c7efad');this.addEffect('heal',h.x,h.y,100,skill.color,1);return true;}
  if(skill.shield){this.s.flags.shield=8+level*.3;this.addEffect('heal',h.x,h.y,120,skill.color,1);return true;}
  const sorted=this.s.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(h,a)-distance(h,b));const nearest=sorted[0];if(nearest){this.attackAngle=Math.atan2((nearest.y-h.y)*.8,nearest.x-h.x);h.direction=nearest.x>=h.x?1:-1;}
  this.addEffect(index===0?'slash':skill.effect||'moon',h.x,h.y-30,skill.range*.52,skill.color,index===0?.35:.85);let hit=0;
  for(const e of sorted){if(distance(h,e)>skill.range)continue;if(index===0&&hit)break;const damage=Math.round((skill.damage+this.damageBonus())*(1+(h.level-1)*.055)*(1+(level-1)*.08));e.hp=Math.max(this.encounter.forcedOutcome==='defeat'?1:0,e.hp-damage);e.flash=.2;this.addNumber(damage,e.x,e.y-90,skill.color);hit++;if(skill.slow)e.slow=3;if(e.hp===0){if(this.q.skirmish){this.markSkirmishDefeat(e,true);continue;}if(!this.q.friendly)this.s.kills++;this.s.coins+=this.q.friendly?0:e.boss?80:15;this.gainExp(e.boss?100:25);this.addEffect('spark',e.x,e.y-40,55,'#eac98a',.8);}}
  if(this.q.skirmish){this.checkSkirmishOutcome();return true;}
  if(this.s.phase==='battle'&&this.s.enemies.every(e=>e.hp<=0)){if(this.q.training&&this.ensureTraining().active!==null){this.finishTrainingWin();return true;}if(this.q.waves&&(this.s.wave||0)<this.q.waves.length-1){this.s.wave=(this.s.wave||0)+1;h.hp=Math.min(h.maxHp,h.hp+100);h.mp=Math.min(h.maxMp,h.mp+60);this.startBattle(true);this.emit('wave',{index:this.s.wave+1,total:this.q.waves.length,name:this.encounter.boss||this.encounter.enemy});return true;}this.s.phase='after';this.attackTarget=null;this.target=null;this.waypoints=[];if(this.q.openingEnding)this.finish('opening');else if(this.q.battleBeforeChoice){this.s.phase='choice';this.emit('choice');}else this.emit('victory');}return true;
 }
 gainExp(n){const h=this.s.hero;h.exp=Math.min(999999,h.exp+n);while(h.level<99&&h.exp>=100+h.level*60){h.exp-=100+h.level*60;h.level++;h.maxHp+=38;h.maxMp+=15;h.hp=h.maxHp;h.mp=h.maxMp;this.addEffect('heal',h.x,h.y,140,'#ebd18b',1.4);this.emit('level');}if(h.level>=50&&this.settings.difficulty==='story')this.unlock(10);}
 potion(){if(this.s.failure||this.s.skirmish?.failed)return false;if(this.s.potions<=0){this.emit('toast',{text:'金创药已用尽，可拜访商人补充。'});return false;}const h=this.s.hero;if(h.hp>=h.maxHp){this.emit('toast',{text:'气血充盈。'});return false;}const n=Math.min(h.maxHp-h.hp,Math.max(180,h.maxHp*.48));h.hp+=n;this.s.potions--;this.addNumber('+'+Math.round(n),h.x,h.y-90,'#c8e5af');return true;}
 elixir(){if(this.s.failure||this.s.skirmish?.failed)return false;if(this.s.elixirs<=0){this.emit('toast',{text:'补气丹已用尽，可在安全处按 V 打坐。'});return false;}const h=this.s.hero;if(h.mp>=h.maxMp)return false;h.mp=Math.min(h.maxMp,h.mp+Math.max(120,h.maxMp*.6));this.s.elixirs--;return true;}
 buy(id){const item=ITEMS[id];if(!item||!item.price||this.s.phase==='battle')return false;if(this.s.coins<item.price){this.emit('toast',{text:'银两不足。'});return false;}this.s.coins-=item.price;if(id==='potion')this.s.potions++;else if(id==='elixir')this.s.elixirs++;else this.s.inventory[id]=(this.s.inventory[id]||0)+1;this.emit('purchase',{id});return true;}
 equip(id){const item=ITEMS[id];if(!item||!['weapon','armor'].includes(item.type)||!(this.s.inventory[id]||['family_sword','cotton_robe'].includes(id)))return false;this.s.equipment[item.type]=id;return true;}
 side(id){const q=SIDE_QUESTS.find(q=>q.id===id);if(!q||q.map!==this.s.map||this.s.sideDone.includes(id))return false;
  const required=q.herbs?['ginger','garlic','poppy']:q.requireItem?[q.requireItem]:q.fetch?[q.fetch]:[];if(required.some(k=>!this.s.inventory[k])){this.emit('toast',{text:'还需要：'+required.filter(k=>!this.s.inventory[k]).map(k=>ITEMS[k].name).join('、')});return false;}
  if(q.cost&&this.s.coins<q.cost){this.emit('toast',{text:'需要 '+q.cost+' 两银子。'});return false;}this.s.coins-=q.cost||0;
  if(q.repeat){this.s.flags[id+'Count']=(this.s.flags[id+'Count']||0)+1;if(this.s.flags[id+'Count']<q.repeat){this.emit('toast',{text:'已施舍 '+this.s.flags[id+'Count']+' 次。'});return true;}}
  for(const k of required){this.s.inventory[k]--;if(this.s.equipment.weapon===k)this.s.equipment.weapon='family_sword';}this.s.sideDone.push(id);this.applyEffects(q.rewards);if(this.s.inventory.sheepskin>=7)this.unlock(18);this.gainExp(75);this.emit('sideComplete',{id});return true;}
 dash(){if(this.jump)return false;const nearby=this.jumpMarkers().find(m=>distance(this.s.hero,m)<100);if(nearby)return this.startJump(nearby.jumpId,nearby.side);if(this.paused||this.s.phase==='staging'||this.s.hero.stamina<24||this.dashTime>0)return false;const h=this.s.hero;let dx=0,dy=0;if(this.target){dx=this.target.x-h.x;dy=this.target.y-h.y;}else{dx=(this.keys.has('ArrowRight')||(this.settings.controls==='modern'&&this.keys.has('d'))?1:0)-(this.keys.has('ArrowLeft')||(this.settings.controls==='modern'&&this.keys.has('a'))?1:0);dy=(this.keys.has('ArrowDown')||(this.settings.controls==='modern'&&this.keys.has('s'))?1:0)-(this.keys.has('ArrowUp')||(this.settings.controls==='modern'&&this.keys.has('w'))?1:0);if(!dx&&!dy)dx=h.direction;}const len=Math.hypot(dx,dy)||1,nx=h.x+dx/len*145,ny=h.y+dy/len*105;if(!this.clearSegment(h,{x:nx,y:ny}))return false;this.addEffect('dash',h.x,h.y,60,'#c5e8e5',.6);h.x=nx;h.y=ny;h.stamina-=24;this.dashTime=.6;this.emit('dash');return true;}
 meditate(){if(this.jump||this.paused||this.s.phase==='staging')return;if(this.s.phase==='battle'){this.emit('toast',{text:'交战中无法打坐。'});return;}this.meditating=!this.meditating;this.target=null;this.waypoints=[];this.emit('toast',{text:this.meditating?'凝神静气，恢复气血与内力。':'收功起身。'});}
 tick(dt){dt=clamp(dt,0,.05);if(this.sceneLoading||this.s.failure||this.paused||!this.active)return;this.time+=dt;this.s.playTime+=dt;if(this.jump){this.tickJump(dt);return;}this.ensureRescueEncounter();if(this.canStartStaging()){const d=this.stagingDefinition();if(this.hasQuestItems()&&(d.auto||(d.trigger&&distance(this.s.hero,d.trigger)<(d.trigger.radius||135))))this.startStaging();}if(this.s.phase==='staging'){this.tickStaging(dt);return;}this._portalCooldown=Math.max(0,(this._portalCooldown||0)-dt);this.dashTime=Math.max(0,this.dashTime-dt);this.hitTime=Math.max(0,this.hitTime-dt);this.s.cooldowns=this.s.cooldowns.map(c=>Math.max(0,c-dt));this.s.flags.shield=Math.max(0,(this.s.flags.shield||0)-dt);const h=this.s.hero;h.stamina=Math.min(100,h.stamina+dt*12);h.mp=Math.min(h.maxMp,h.mp+dt*(this.meditating?35:this.s.phase==='battle'?2:6));if(this.meditating)h.hp=Math.min(h.maxHp,h.hp+dt*30);
  let dx=(this.keys.has('ArrowRight')||(this.settings.controls==='modern'&&this.keys.has('d'))?1:0)-(this.keys.has('ArrowLeft')||(this.settings.controls==='modern'&&this.keys.has('a'))?1:0),dy=(this.keys.has('ArrowDown')||(this.settings.controls==='modern'&&this.keys.has('s'))?1:0)-(this.keys.has('ArrowUp')||(this.settings.controls==='modern'&&this.keys.has('w'))?1:0);
  if(dx||dy){this._pursuitFollow=false;this.s.destination=null;this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;this.meditating=false;}else if(this.target){dx=this.target.x-h.x;dy=this.target.y-h.y;if(Math.hypot(dx,dy)<8){this.target=this.waypoints.shift()||null;dx=dy=0;}}
  if(dx||dy){this.meditating=false;const len=Math.hypot(dx,dy),speed=this.keys.has('Shift')&&h.stamina>3?250:190,nx=h.x+dx/len*speed*dt,ny=h.y+dy/len*speed*.73*dt;if(this.passable(nx,h.y))h.x=nx;if(this.passable(h.x,ny))h.y=ny;if(speed===250)h.stamina=Math.max(0,h.stamina-dt*12);if(Math.abs(dx)>.01)h.direction=dx>=0?1:-1;this.walkTime+=dt*11;}else this.walkTime=0;
  this.tickPursuit(dt);
  if(this.s.phase==='escape'||(['search','return'].includes(this.s.phase)&&this.q.timeLimit)){this.s.timer-=dt;if(this.s.timer<=0){this.s.phase='talk';this.s.collected=0;this.s.collectedIds=[];h.x=this.scene.spawn.x;h.y=this.scene.spawn.y;this.target=null;this.waypoints=[];this.autoInteract=null;this.emit('toast',{text:this.q.timeLimit?'气息将尽，先返回岸边。调整路线后再试。':'未能及时撤出，已返回入口，可重新尝试。'});}}
  this.stepParty(dt);
  if(this.autoInteract){const marker=this.markers.find(m=>m.id===this.autoInteract);if(marker&&distance(h,marker)<135){this.target=null;this.waypoints=[];this.interact(marker);}}
  if(this.s.destination&&!this.target&&!this.autoInteract&&this._portalCooldown<=0)this.travel(this.s.destination);
  if(!this.travelBlocked()&&this._portalCooldown<=0&&!this.s.destination&&!this.autoInteract&&!this.target&&!this.waypoints.length&&(dx||dy)){const portal=this.exits().find(exit=>!exit.locked&&this.scene.portals?.[exit.to]&&distance(h,this.scene.portals[exit.to].exit)<48);if(portal){this.enterMap(portal.to);return;}}
  if(this.attackTarget&&this.attackTarget.hp>0){if(distance(h,this.attackTarget)<175){this.target=null;this.waypoints=[];this.cast(0);}else if(!this.target){this.waypoints=this.findPath(this.attackTarget.x,this.attackTarget.y+30);this.target=this.waypoints.shift()||null;}}
  if(this.keys.has('j'))this.cast(0);
  if(this.s.phase==='battle'&&this.q.skirmish)this.tickSkirmish(dt);
  else if(this.s.phase==='battle'){
   for(const e of this.s.enemies){
    if(e.hp<=0)continue;
    e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,(e.slow||0)-dt);e.direction=h.x>=e.x?1:-1;
    const d=distance(h,e);
    if(e.telegraph>0){
     e.telegraph-=dt;
     if(e.telegraph<=0){
      const zone=e.telegraphZone;
      if(zone){
       this.addEffect(e.role==='ranged'?'enemy':'fire',zone.kind==='line'?zone.targetX:zone.x,zone.kind==='line'?zone.targetY:zone.y,zone.radius||100,'#ee7464',.6);
       if(this.inThreat(h,zone)&&this.dashTime<=0)this.hurt(e,e.role==='brute'?2:e.boss?2.2:1.4);
      }
      e.telegraphZone=null;
     }
     continue;
    }
    e.skillTimer-=dt;
    if(e.skillTimer<=0&&d<(e.role==='ranged'?650:e.boss?440:285)){
     e.telegraph=e.role==='brute'?1.45:e.role==='ranged'?1.05:1.2;
     e.skillTimer=e.boss?5:e.role==='ranged'?3.8:5.5;
     e.telegraphZone=e.role==='ranged'
      ?{kind:'line',x:e.x,y:e.y,targetX:h.x,targetY:h.y,width:30}
      :{kind:'circle',x:h.x,y:h.y,radius:e.boss?150:e.role==='brute'?125:85};
     this.emit('warning',{name:e.name});continue;
    }
    const desired=e.role==='ranged'?280:102;
    if(d>desired||e.role==='ranged'&&d<150){
     const angle=Math.atan2(h.y-e.y,h.x-e.x)+(e.role==='ranged'&&d<150?Math.PI:0);
     const speed=(e.boss?86:e.role==='brute'?58:78)*(e.slow>0?.4:1);
     for(const offset of [0,.65,-.65,1.15,-1.15]){
      const nx=e.x+Math.cos(angle+offset)*speed*dt,ny=e.y+Math.sin(angle+offset)*speed*.72*dt;
      if(this.passable(nx,ny)){e.x=nx;e.y=ny;break;}
     }
    }
    e.attackTimer-=dt;
    if(e.attackTimer<=0&&d<128){e.attackTimer=e.boss?1.3:1.9;this.addEffect('enemy',e.x,e.y-30,60,'#eb7f70',.35);if(this.dashTime<=0)this.hurt(e,1);}
   }if(h.hp<=0){if(this.encounter.scriptedLoss){h.hp=this.q.training?h.maxHp:Math.round(h.maxHp*.25);if(this.q.training)this.ensureTraining().finished=true;this.s.enemies=[];this.s.phase=this.q.battleBeforeChoice?'choice':'after';this.emit('scriptedLoss');if(this.q.battleBeforeChoice)this.emit('choice');}else{this.paused=true;this.target=null;this.emit('defeat');}}
  }
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);this.numbers=this.numbers.filter(n=>(n.life-=dt)>0);
 }
 inThreat(point,zone){
  if(zone.kind==='circle')return Math.hypot(point.x-zone.x,(point.y-zone.y)*1.3)<zone.radius;
  const dx=zone.targetX-zone.x,dy=(zone.targetY-zone.y)*1.3;
  const px=point.x-zone.x,py=(point.y-zone.y)*1.3;
  const t=clamp((px*dx+py*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(px-t*dx,py-t*dy)<zone.width;
 }
 hurt(e,mult){const armor=ITEMS[this.s.equipment.armor]?.defense||0,damage=Math.max(2,Math.round(((e.boss?15:7)+e.tier*2-armor)*mult*(this.settings.difficulty==='story'?.42:1)*(this.s.flags.shield>0?.4:1)));this.s.hero.hp=Math.max(0,this.s.hero.hp-damage);this.addNumber('-'+damage,this.s.hero.x,this.s.hero.y-95,'#ffa394');this.emit('hurt');}
 retry(){if(this.s.failure)return false;this.resetRescueAttempt();if(this.q.skirmish)this.s.skirmish=null;this.s.hero.hp=this.s.hero.maxHp;this.s.hero.mp=this.s.hero.maxMp;this.s.hero.stamina=100;this.s.hero.x=this.scene.spawn.x;this.s.hero.y=this.scene.spawn.y;this.s.cooldowns=Array(SKILLS.length).fill(0);this.paused=false;this.startBattle();}
}

Object.assign(GameEngine.prototype,stagingMethods,recruitmentMethods,skirmishMethods,pursuitMethods,rescueMethods);

Object.assign(GameEngine.prototype,partyMethods,jumpMethods);
