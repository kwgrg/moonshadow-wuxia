// Independent web task contracts. Evidence and limits are documented in
// docs/good-forbidden-reference.md; no original text, assets or coordinates.
const good = {route:'good',not:'cultPath'};
const evidence = detail => ({
  sources:['https://vv0817.neocities.org/gametxt/15_jxqysp'],
  source:`2026-09-24只读静态核验：${detail}。定位与未确认细节见docs/good-forbidden-reference.md；对白、美术、属性、布局、存档和重试均由本项目独立实现。`,
  revised:true,dialogueStatus:'independently-authored-from-verified-mechanics',referencePolicy:'reference-only-no-original-content',
});
const talk = (id,title,map,npc,objective,requiredFlags,rewards,extra={}) => ({
  id,title,map,npc,objective,sprite:0,type:'talk',act:'卷七 · 侠路寻心',when:good,
  requireStaging:true,hideCompanion:true,requiredFlags,before:[],after:[],xp:0,money:0,
  requirementText:'先完成当前的会面、查访与行程。',rewards,...extra,
});
const guard = (id,name,female=false,extra={}) => ({id,name,hp:155,tier:8,sprite:3,npcCell:female?7:6,role:'sword',...extra});
const rose = () => ({id:'good-rose',name:'蔷薇',hp:3400,tier:11,sprite:0,npcCell:7,role:'sword'});
export const GOOD_FORBIDDEN_ENTRY_ENEMIES = [
  ...Array.from({length:22},(_,i)=>guard(`good-entry-man-${String(i+1).padStart(2,'0')}`,'无忧教男弟子')),
  ...Array.from({length:14},(_,i)=>guard(`good-entry-woman-${String(i+1).padStart(2,'0')}`,'无忧教女弟子',true)),
];
export const GOOD_FORBIDDEN_AMBUSH_ENEMIES = [
  ...Array.from({length:50},(_,i)=>guard(`good-ambush-man-${String(i+1).padStart(2,'0')}`,'无忧教男弟子',false,{hp:160,tier:9})),
  ...Array.from({length:2},(_,i)=>guard(`good-ambush-woman-${String(i+1).padStart(2,'0')}`,'无忧教女弟子',true,{hp:160,tier:9})),
  guard('good-ambush-chief','无忧教头目',false,{boss:true,hp:1100,tier:12}),
];
export const GOOD_FORBIDDEN_REVISIONS = {
  g12:{
    ...evidence('Event1820紫轩带主角见重伤张仲天，证词与倒下表现后紫轩留下处理后事，影枫与蔷薇赴岛，置1821'),
    title:'惠安镇证词',x:650,y:700,npc:'紫轩',sprite:2,type:'talk',when:good,requireStaging:true,hideCompanion:true,
    objective:'随紫轩走近重伤的张仲天，听清他的证词',before:[],after:[],
    rewards:{flags:{goodTestimonyHeard:true},companion:'蔷薇'},
  },
  g13:{
    ...evidence('Event1823出一层回外场时遭53敌伏击；全清或任一三名友方败北都会进入三女遭俘结果，第二战玩家死亡回调优先级未确认'),
    title:'禁地出口伏击',x:620,y:690,map:'m60',npc:'无忧教头目',sprite:3,npcCell:6,
    objective:'护着真儿、眉儿和蔷薇应对出口的伏兵',type:'battle',when:good,
    requireStaging:false,hideCompanion:false,requiredFlags:['goodForbiddenReunited'],
    requirementText:'先深入禁地密室找到姐妹，再带她们沿原路出来。',
    count:53,enemy:'无忧教伏兵',boss:null,friendly:false,scriptedLoss:false,
    before:[['无忧教头目','门前门后都是我们的人。把人留下，你也休想轻易脱身。',3],['杨影枫','真儿、眉儿、蔷薇，留意身后，别被他们隔开！',0]],
    after:[['江湖纪事','一番鏖战，三位同伴落入教众手中。影枫收住脚步，盯着对面的挟持者。',0]],
    afterObjective:'看清三位同伴的处境，面对挟持她们的教众。',
    afterMarker:{name:'同伴受制',sprite:null,x:620,y:690},xp:0,money:0,suppressBattleSupplies:true,
    skirmish:{enemies:GOOD_FORBIDDEN_AMBUSH_ENEMIES,allies:[
      {id:'good-zhen',name:'纳兰真',hp:2400,tier:10,sprite:1,npcCell:null,role:'sword'},
      {id:'good-mei',name:'月眉儿',hp:2700,tier:11,sprite:2,npcCell:null,role:'sword'},rose(),
    ],storyOutcome:{kind:'capture',allyIds:['good-zhen','good-mei','good-rose'],heroDefeat:'retry'}},
    rewards:{flags:{goodForbiddenAmbushResolved:true}},
    fidelityNote:'第二战敌人全清或任一三女倒下仍被俘是已核结果。主角败北采用普通失败和独立重试，因原版跨图死亡回调优先级尚未证实；不将此适配冒认原机制。全部HP、等级与伤害平衡为原创网页数据。',
  },
  g14_dock_report:{
    requiredAnyFlags:[['goodForbiddenCaptured','goodForbiddenLegacy'],['goodForbiddenReturnReady','goodForbiddenLegacy']],
    requirementText:'先处理禁地的变故，再从忘忧岛码头搭船回中原。',
  },
};
export const GOOD_FORBIDDEN_ADDITIONS = [
  {beforeId:'g13',quests:[
    talk('g13_hut','海边空屋','r_good_seaside_hut','空屋','回到海边小屋，查看真儿与眉儿的去向',[],{flags:{goodForbiddenHutChecked:true}}, {
      ...evidence('Event1821须先检查海边小屋，发现姐妹不在才置1822，此前村落往禁地出口不执行转场'),
      hideCompanion:false,x:780,y:810,requiredAnyFlags:[['goodTestimonyHeard','goodForbiddenLegacyTestimony']],
      requirementText:'先听完张仲天的证词，再与蔷薇回岛探望姐妹。',
    }),
    {
      ...talk('g13_entry','禁地外场清围','m60','无忧教守卫','与蔷薇击退全部守卫，打开进入禁地的路',['goodForbiddenHutChecked'],{flags:{goodForbiddenEntryCleared:true}}, {
        ...evidence('Event1822入禁地外场有36敌，22男弟子和14女弟子；杨影枫或蔷薇败北绑定公共死亡回调，全清才开放入内出口'),
      }),
      type:'battle',hideCompanion:false,x:620,y:690,count:36,enemy:'无忧教守卫',sprite:3,npcCell:6,boss:null,friendly:false,scriptedLoss:false,
      suppressBattleSupplies:true,
      skirmish:{enemies:GOOD_FORBIDDEN_ENTRY_ENEMIES,allies:[rose()],criticalAllyIds:['good-rose']},
      after:[['蔷薇','拦路的人都倒下了，里面的路通了。',0],['杨影枫','走，先找到真儿和眉儿。',0]],
      afterObjective:'确认入内的路已通，再向禁地深处寻人。',afterMarker:{name:'入内寻人',sprite:null,x:620,y:690},
    },
    talk('g13_reunion','密室会合','r_good_forbidden_chamber','纳兰真','深入密室，走近真儿和眉儿问清事情经过',['goodForbiddenEntryCleared'],{flags:{goodForbiddenReunited:true}}, {
      ...evidence('Event1822依次经过一层二层三层进入独立密室，走近姐妹交谈后才设跟随并置1823；没有重演邪线双玉开门或读信揭面'),sprite:1,hideCompanion:false,x:725,y:805,
    }),
  ]},
  {beforeId:'g14_dock_report',quests:[
    talk('g13_captured','三女遭掳','m60','无忧教头目','面对挟持者，目送被押走的三位同伴',['goodForbiddenAmbushResolved'],{flags:{goodForbiddenCaptured:true},companion:null}, {
      ...evidence('三女遭俘收束把她们押往摘星楼，主角留在禁地外场；恢复出口后决定找孟知秋求援，置2000'),sprite:3,npcCell:6,x:620,y:690,
    }),
    talk('g13_ferry','孤身渡海','m40','渔夫窦昊','走到忘忧岛码头，请窦昊载你回中原',['goodForbiddenCaptured'],{flags:{goodForbiddenReturnReady:true},companion:null}, {
      ...evidence('Event2000主角经村落回岛上码头，窦昊交互才载入中原码头，并接铁云的山庄急报'),npcCell:4,x:990,y:700,
    }),
  ]},
];
