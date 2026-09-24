import {CULT_REVISIONS} from './cult-revisions.mjs';
// Independently authored contracts; see docs/good-rescue-reference.md.
const good={route:'good',not:'cultPath'};
const evidence=detail=>({sources:['https://vv0817.neocities.org/gametxt/15_jxqysp'],source:`2026-09-24只读静态核验：${detail}。定位和未知项见docs/good-rescue-reference.md；对白、布局、数值、存档和重试为独立网页实现。`,revised:true,dialogueStatus:'independently-authored-from-verified-mechanics',referencePolicy:'reference-only-no-original-content'});
const guard=(id,name,npcCell=6,extra={})=>({id,name,hp:180,tier:10,sprite:3,npcCell,role:'sword',...extra});
const many=(count,prefix,name,npcCell=6,extra={})=>Array.from({length:count},(_,i)=>guard(`${prefix}-${String(i+1).padStart(2,'0')}`,name,npcCell,extra));
export const GOOD_RESCUE_HALL_ENEMIES=[...many(43,'rescue-hall-man','无忧教男弟子'),guard('rescue-hall-cultist','无忧教徒')];
export const GOOD_RESCUE_DUNGEON_ENEMIES=many(28,'rescue-dungeon-man','无忧教男弟子');
export const GOOD_RESCUE_MEI_ENEMIES=[...many(25,'rescue-mei-woman','无忧教女弟子',7,{hp:175,tier:9}),...many(2,'rescue-mei-cultist','无忧教教徒',6,{hp:230})];
export const GOOD_RESCUE_MANOR_ENEMIES=[...many(48,'rescue-manor-man','无忧教男弟子',6,{hp:200}),...many(7,'rescue-manor-pili','霹雳堂杀手',6,{hp:240}),guard('rescue-manor-xin','辛楚',2,{boss:true,hp:1250,tier:12})];
export const GOOD_RESCUE_FORT_ENEMIES=[...many(50,'rescue-fort-man','无忧教男弟子',6,{hp:200}),...many(6,'rescue-fort-pili','霹雳堂杀手',6,{hp:240})];
const base={act:'卷七 · 侠路寻心',when:good,hideCompanion:true,before:[],after:[],xp:0,money:0,suppressBattleSupplies:true};
const battle=(id,title,map,enemies,extra={})=>({...base,id,title,map,type:'battle',npc:'无忧教守卫',sprite:3,npcCell:6,count:enemies.length,enemy:'无忧教来敌',boss:null,friendly:false,scriptedLoss:false,requireStaging:true,skirmish:{enemies,allies:[]},...extra});
const talk=(id,title,map,npc,extra={})=>({...base,id,title,map,npc,sprite:2,type:'talk',requireStaging:true,...extra});
export const GOOD_RESCUE_REVISIONS={
 g15:{choice:{...CULT_REVISIONS.g15.choice,options:CULT_REVISIONS.g15.choice.options.map((option,i)=>i===1?{...option,effects:{...option.effects,flags:{...option.effects?.flags,goodRescueRefused:true}},after:[...option.after.slice(0,2),['杨影枫','不能坐等他回来。先闯过楼里的守卫，再找下去的路。',0]]}:option)}},
 g16:{
  ...evidence('Event2005地下28守卫；紫轩交互不查清敌或物品，救出转跟随并开返楼出口，随后实际返空楼和倚天山'),
  title:'地牢救紫轩',map:'r_good_dungeon',npc:'紫轩',sprite:2,x:945,y:410,type:'rescue',when:good,
  objective:'穿过守卫走近紫轩，救出她后带她返回楼上',requireStaging:true,hideCompanion:false,
  requiredFlags:['goodRescueHallCleared'],requiredAnyFlags:[],requirementText:'先击退楼内全部守卫，打开通往地下的入口。',
  count:28,enemy:'无忧教地牢守卫',boss:null,object:null,friendly:false,scriptedLoss:false,
  before:[],after:[],suppressBattleSupplies:true,rescueMission:{actorId:'rescue-zi',companion:'紫轩',exitMap:'m61'},
  skirmish:{enemies:GOOD_RESCUE_DUNGEON_ENEMIES,allies:[]},
  rewards:{flags:{goodRescueZiFreed:true},companion:'紫轩'},
  fidelityNote:'接近救人不要求清空28守卫；释放后余敌继续行动，真实离开地下才提交任务。演出期间暂停、重试重置本场与救人、默认任务65经验15银两为网页适配；紫轩不设未经证实的原版护送血条。',
 },
 g17:{
  ...battle('g17','南郊救眉儿','m41',GOOD_RESCUE_MEI_ENEMIES),
  ...evidence('Event2007返惠安途中27追兵，25女弟子和2教徒；月眉儿为友方，倒下导致失败，全清才交谈离场'),
  npc:'月眉儿',sprite:2,npcCell:null,x:490,y:700,objective:'击退追兵，护住负伤的月眉儿',
  requiredAnyFlags:[['goodRescueZiSettled','goodRescueLegacyZiSettled']],requirementText:'先亲自护送紫轩回寒波谷安置，再离谷去惠安。',
  xp:65,money:15,skirmish:{enemies:GOOD_RESCUE_MEI_ENEMIES,allies:[{id:'rescue-mei',name:'月眉儿',sprite:2,npcCell:null,hp:2800,tier:11,role:'sword'}],criticalAllyIds:['rescue-mei']},
  after:[['杨影枫','追兵已经倒下。眉儿，先缓口气。',0]],afterObjective:'走近眉儿，听她说明脱险经过。',afterMarker:{name:'查看眉儿伤势',sprite:null,x:490,y:700},
  rewards:{flags:{goodRescueMeiBattleWon:true},companion:null},
 },
 g18:{
  ...battle('g18','再入飞龙堡','m54',GOOD_RESCUE_FORT_ENEMIES),
  ...evidence('Event2008飞龙堡50男弟子和6霹雳堂杀手全清，才开门并置2009；出门先经沙漠，再进入通天塔'),
  x:560,y:740,objective:'清除堡内全部守卫，打开通往沙漠的后门',
  requiredAnyFlags:[['goodRescueManorCleared','goodRescueLegacy']],requirementText:'先击退再次占据悲魔山庄的来敌，再经过敦煌一线赶赴飞龙堡。',
  xp:65,money:15,after:[['杨影枫','门前的守卫已清，后面的通路打开了。穿过沙地，就能到通天塔。',0]],
  afterObjective:'确认后门已经打开，再穿过沙漠前往通天塔。',afterMarker:{name:'查看堡后通路',sprite:null,x:560,y:740},
  rewards:{flags:{goodRescueFortCleared:true}},
 },
};
export const GOOD_RESCUE_ADDITIONS=[
 {beforeId:'g16',quests:[battle('g15_escape','摘星楼破围','m61',GOOD_RESCUE_HALL_ENEMIES,{
  ...evidence('三拒后纳兰离场；43男弟子和1教徒共44敌，全部清除才开放地下出口'),
  x:350,y:760,objective:'击退楼内全部守卫，找到进入地下的路',
  requiredAnyFlags:[['goodRescueRefused','goodRescueLegacyRefused']],requirementText:'先在摘星楼作出最后答复。',
  after:[['杨影枫','楼内的守卫都已倒下，那边通往地下。再往下找。',0]],afterObjective:'检查通往地下的入口。',afterMarker:{name:'地下入口已通',sprite:null,x:350,y:760},
  rewards:{flags:{goodRescueHallCleared:true},companion:null},
 })]},
 {beforeId:'g17',quests:[talk('g16_homecoming','护送紫轩归谷','r_good_hanbo_hut','紫轩',{
  ...evidence('Event2006紫轩跟随返回寒波谷，谷内9号到点事件才置2007并停止跟随'),
  hideCompanion:false,x:850,y:650,objective:'带紫轩走到小筑近处，安顿她留下休养',requiredFlags:['goodRescueZiFreed'],
  requirementText:'先救出紫轩，并带她从地下返回楼上。',rewards:{flags:{goodRescueZiSettled:true},companion:null},
 })]},
 {beforeId:'g18',quests:[talk('g17_departure','眉儿脱险','m41','月眉儿',{
  ...evidence('27敌清除后眉儿说明通天塔消息，随后走离并移除，不转跟随；主角继续救人，她自行赴谷养伤'),
  x:490,y:700,objective:'听眉儿说明塔中情形，目送她自行返谷休养',requiredFlags:['goodRescueMeiBattleWon'],
  requirementText:'先击退全部追兵，并护住月眉儿。',rewards:{flags:{goodRescueMeiDeparted:true},companion:null},
 }),battle('g17_manor','山庄再遇伏兵','m49',GOOD_RESCUE_MANOR_ENEMIES,{
  ...evidence('Event2008第二次返庄56敌为辛楚1、无忧教男弟子48、霹雳堂杀手7；全清才恢复出口，不同于较早丁戈55敌'),
  npc:'辛楚',npcCell:2,x:560,y:740,objective:'击退辛楚带来的伏兵，清开继续赶路的出口',
  requiredAnyFlags:[['goodRescueMeiDeparted','goodRescueLegacyMeiDeparted']],requirementText:'先听完眉儿带来的消息，让她离开险地。',
  after:[['杨影枫','又一批人守在这里……路已清开，须尽快赶往飞龙堡。',0]],afterObjective:'查看山庄出口，继续前往飞龙堡。',afterMarker:{name:'山庄出口已通',sprite:null,x:560,y:740},
  rewards:{flags:{goodRescueManorCleared:true},companion:null},
 })]},
];
