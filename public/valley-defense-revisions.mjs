// Independent implementation of the bounded mechanics audit in
// docs/valley-defense-reference.md. No original script, text or coordinates.
const evidence = detail => ({
  sources: ['https://vv0817.neocities.org/gametxt/15_jxqysp'],
  source: `2026-09-23原目录只读静态核验：${detail}。定位见docs/valley-defense-reference.md；对白、属性、站位和演出为本项目独立设计，未复制原内容。`,
  revised: true,
  dialogueStatus: 'independently-authored-from-verified-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const good = {route: 'good', not: 'cultPath'};
// A new web deployment: 54 ordinary attackers and one leader, all separated
// by 60 world units, at least 420 from the player's initial fighting position.
const rows = [
  [385,630,1290], [445,690,1290], [505,750,1290],
  [565,810,1290], [625,810,1290], [685,870,990],
];
const positions = rows.flatMap(([y,from,to]) => Array.from({length:(to-from)/60+1},(_,i)=>({x:from+i*60,y})));
export const MANOR_DEFENSE_ENEMIES = [
  ...Array.from({length:48},(_,i)=>({id:`manor-wuyou-${String(i+1).padStart(2,'0')}`,name:'无忧教男弟子',hp:155,tier:8,npcCell:6,sprite:3,role:'sword'})),
  ...Array.from({length:6},(_,i)=>({id:`manor-pili-${String(i+1).padStart(2,'0')}`,name:'霹雳堂弟子',hp:220,tier:9,npcCell:6,sprite:3,role:'sword'})),
  {id:'manor-ding-ge',name:'丁戈',boss:true,hp:1200,tier:12,npcCell:2,sprite:3,role:'sword'},
];
export const MANOR_DEFENSE_POSITIONS = Object.fromEntries(MANOR_DEFENSE_ENEMIES.map((enemy,i)=>[enemy.id,i<54?positions[i]:{x:1050,y:685}]));

export const VALLEY_DEFENSE_REVISIONS = {
  g14: {
    ...evidence('Event2000在破坏后的落叶谷见重伤孟知秋，传功原生调用AddExp(100000)，随后Event2001仍可对话；此时没有死亡或清谷战'),
    title:'落叶谷传功',map:'m51',npc:'孟知秋',sprite:3,npcCell:3,
    objective:'走近重伤的孟知秋，听取托付并接受传功',
    type:'talk',when:good,requireStaging:true,hideCompanion:true,
    requiredAnyFlags:[['manorInvadersCleared','valleyDefenseLegacy']],
    requirementText:'先清除占据悲魔山庄的来敌，再赴落叶谷寻找孟知秋。',
    before:[],after:[],xp:100000,money:0,
    rewards:{flags:{valleyPowerReceived:true},companion:null},
    fidelityNote:'经验增长是已核机制；单次100000经验保留其量级，成长仍走本项目经验系统，不等同复用原版等级曲线或内力数值。未授未证实的技能，孟知秋在此段仍存活。',
  },
  g15:{
    requiredAnyFlags:[['valleyRescueResolved','valleyDefenseLegacy']],
    requirementText:'先接受孟知秋的托付，经过寒波谷决定赴摘星楼救人。',
  },
};

export const VALLEY_DEFENSE_ADDITIONS = [
  {beforeId:'g14',quests:[{
    id:'g14_dock_report',
    ...evidence('Event2000登陆中原码头后铁云前来报告悲魔山庄遭占，再赴山庄清敌'),
    title:'码头急报',map:'r_mainland_dock',npc:'铁云',sprite:0,npcCell:5,
    objective:'登上中原码头，听取铁云带来的消息',
    type:'talk',act:'卷七 · 侠路同归',when:good,requireStaging:true,hideCompanion:true,
    before:[],after:[],xp:0,money:0,rewards:{flags:{valleyManorReported:true},companion:null},
  },{
    id:'g14_manor_battle',
    ...evidence('Event2000丁戈交涉后封住悲魔山庄出口，48无忧教男弟子、6霹雳堂弟子与丁戈共55敌全清才开放，没有友军保护条件'),
    title:'悲魔山庄解围',map:'m49',npc:'丁戈',sprite:3,npcCell:2,x:600,y:710,
    objective:'拒绝丁戈的招揽，清除占据山庄的全部来敌',
    type:'battle',act:'卷七 · 侠路同归',when:good,requireStaging:true,hideCompanion:true,
    requiredFlags:['valleyManorReported'],requirementText:'先在中原码头听取铁云的报告，再回悲魔山庄。',
    count:55,enemy:'无忧教与霹雳堂来敌',boss:null,friendly:false,scriptedLoss:false,
    before:[],after:[['杨影枫','庄里的来敌已尽。得赶去落叶谷，看看孟前辈是否平安。',0]],
    afterObjective:'检视院中，再动身前往落叶谷寻找孟知秋。',
    afterMarker:{name:'检视山庄',sprite:null,x:600,y:710},
    xp:0,money:0,suppressBattleSupplies:true,
    skirmish:{enemies:MANOR_DEFENSE_ENEMIES,allies:[],positions:MANOR_DEFENSE_POSITIONS,heroStart:{x:400,y:770}},
    rewards:{flags:{manorInvadersCleared:true},companion:null},
    fidelityNote:'人数、阵营与全清开出口来自静态核验；稳定ID、战斗属性、阵形与开场距离为独立网页设计。没有原版地图坐标或敌人属性导入。',
  }]},
  {beforeId:'g15',quests:[{
    id:'g14_hanbo',
    ...evidence('传功后经过寒波谷，因担心紫轩而决定去芭蕉小筑查看；独立网页分为林谷与屋内两区'),
    title:'寒波谷归途',map:'r_hanbo_return',npc:'归途',sprite:0,
    objective:'经过寒波谷，前往芭蕉小筑查看紫轩是否平安',
    type:'talk',act:'卷七 · 侠路同归',when:good,requireStaging:true,hideCompanion:true,
    requiredFlags:['valleyPowerReceived'],requirementText:'先到落叶谷听取孟知秋的托付。',
    before:[],after:[],xp:0,money:0,rewards:{flags:{valleyHanboReached:true}},
  },{
    id:'g14_resolve',
    ...evidence('传功后离谷置Event2002，寒波谷trap04独白才置Event2003；摘星楼入口在Event2003调用三次招揽'),
    title:'小筑无人',map:'m16',npc:'空屋',sprite:0,
    objective:'走进芭蕉小筑，查看空屋后决定先赴摘星楼救人',
    type:'talk',act:'卷七 · 侠路同归',when:good,requireStaging:true,hideCompanion:true,
    requiredFlags:['valleyHanboReached'],requirementText:'先经过寒波谷，再进芭蕉小筑找紫轩。',
    before:[],after:[],xp:0,money:0,rewards:{flags:{valleyRescueResolved:true}},
    fidelityNote:'寒波谷的事件顺序已核；网页林谷分区、往返拓扑和脚点独立设计，未复制原地图。',
  }]},
];
