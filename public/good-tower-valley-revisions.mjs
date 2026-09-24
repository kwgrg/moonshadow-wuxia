// Independent web contracts. Native checks and unknowns: good-tower-valley-reference.md.
const good={route:'good',notAll:['cultPath']};
const pending={route:'good',notAll:['cultPath','goodRoseStayed']};
const evidence=detail=>({sources:['https://vv0817.neocities.org/gametxt/15_jxqysp'],source:`2026-09-24有界静态核验：${detail}。定位与未知项见docs/good-tower-valley-reference.md；对白、动作、布局、数值、存档与重试为独立网页实现。`,revised:true,dialogueStatus:'independently-authored-from-verified-mechanics',referencePolicy:'reference-only-no-original-content'});
const many=(n,floor,kind,name,extra={})=>Array.from({length:n},(_,i)=>({id:`tower-${floor}-${kind}-${String(i+1).padStart(2,'0')}`,name,hp:190,tier:11,sprite:3,npcCell:6,role:'sword',...extra}));
const rosters=[
 [...many(30,1,'man','无忧教男弟子'),...many(8,1,'killer','塔中杀手',{hp:230,role:'ranged'})],
 [...many(23,2,'man','无忧教男弟子'),...many(6,2,'killer','塔中杀手',{hp:230,role:'ranged'})],
 [...many(28,3,'man','无忧教男弟子'),...many(9,3,'killer','塔中杀手',{hp:230,role:'ranged'})],
 [...many(35,4,'man','无忧教男弟子'),...many(2,4,'killer','塔中杀手',{hp:230,role:'ranged'}),...many(4,4,'guard','通天塔守卫',{hp:270,role:'brute'})],
 [...many(30,5,'man','无忧教男弟子'),...many(4,5,'guard','通天塔守卫',{hp:270,role:'brute'})],
 [...many(26,6,'man','无忧教男弟子'),...many(4,6,'guard','通天塔守卫',{hp:270,role:'brute'})],
 [...many(34,7,'man','无忧教男弟子'),...many(8,7,'killer','塔中杀手',{hp:230,role:'ranged'}),...many(1,7,'chief','杀手头目',{hp:950,tier:13,boss:true,npcCell:2})],
];
export const GOOD_TOWER_ENCOUNTERS=Object.fromEntries(rosters.map((enemies,i)=>[`m${62+i}`,{
 id:`tower-floor-${i+1}`,map:`m${62+i}`,type:'battle',title:`通天塔第${i+1}层守卫`,count:enemies.length,
 when:good,skirmish:{enemies,allies:[]},xp:0,money:0,suppressBattleSupplies:true,
 fidelityNote:'楼梯不要求清场。跨层保留逐人生命、失败重试和原创军阵是网页适配；不冒认原引擎跨图保存规则。',
} ]));
const base={act:'卷七 · 侠路寻心',when:good,before:[],after:[],xp:0,money:0,hideCompanion:false,suppressBattleSupplies:true};
const talk=(id,title,map,objective,extra={})=>({...base,id,title,map,objective,encounterTier:13,type:'talk',npc:'蔷薇',sprite:1,npcCell:7,requireStaging:true,...evidence('厅中见父、安葬与夜宿需分别交互；原同图坐标段由网页独立拆分为可行走场景'),...extra});
const invitation=(id,number,requires,extra={})=>({...base,id,encounterTier:13,title:number===1?'落叶谷长夜':`第${number}次挽留`,map:'r_leaf_rose_room',type:'choice',npc:'蔷薇',sprite:1,npcCell:7,x:835,y:695,objective:'走近蔷薇，回应她的挽留',requireStaging:true,commitBeforeDialogue:true,repeatRefusal:false,
 when:number===1?good:{...pending,flag:`goodRoseCall${number-1}Ready`},requiredFlags:requires,
 choice:{prompt:number===1?'蔷薇希望你今夜留在这里陪她。':'蔷薇再次挽留，你如何回应？',options:[
  {text:'留下陪她',effects:{flags:{goodRoseStayed:true,forsake:false},affection:{wei:2}},after:[]},
  {text:'回自己的客房',effects:{flags:{[`goodRoseRefusal${number}`]:true,...(number===4?{forsake:true}:{})},affection:{wei:-1}},after:[]},
 ]},...evidence('Event2022至2025四次邀请，任一次同意均合流；前三拒各回客房并听呼叫，第四拒另有是否探看'),
 fidelityNote:'每拒好感-1、同意+2沿用网页兼容策略，并非已核原数值；每个独立选择只提交一次。',...extra});
const guestReturn=n=>talk(`g20_return${n}`,'客房里的呼唤','r_leaf_hero_room','回到自己的房间歇下，留意夜间的呼唤',{
 npc:'客房',sprite:null,npcCell:null,x:690,y:535,when:{...pending,flag:`goodRoseRefusal${n}`},requiredFlags:[`goodRoseRefusal${n}`],
 rewards:{flags:{[`goodRoseCall${n}Ready`]:true},companion:null},
});
export const GOOD_TOWER_VALLEY_REVISIONS={
 ...Object.fromEntries(Array.from({length:7},(_,i)=>[`gTower${i+1}`,{
  ...base,title:`通天塔第${i+1}层`,map:`m${62+i}`,type:'passage',npc:'通往上一层的楼梯',sprite:null,npcCell:null,
  objective:`穿过第${i+1}层，找到通往第${i+2}层的楼梯`,requireStaging:false,count:0,boss:null,enemy:null,skirmish:null,friendly:false,scriptedLoss:false,
  towerPassage:{toMap:`m${63+i}`,floor:i+1},rewards:{},
  ...evidence('善线2009/2010上下楼没有清场、开关或羊皮条件；守卫配置死亡回调为空'),
 } ])),
 gTower8:{...base,title:'通天塔顶',type:'talk',map:'m69',npc:'蔷薇',sprite:1,npcCell:7,x:1170,y:475,objective:'走近被困塔顶的蔷薇',requireStaging:true,count:0,boss:null,enemy:null,skirmish:null,
  rewards:{flags:{goodTowerSummitReached:true}},...evidence('原map049第八层基础配置只有非敌鼠，善线入口加入蔷薇，无顶层守卫战')},
 g19:{...base,title:'塔顶重逢',map:'m69',type:'choice',npc:'蔷薇',sprite:1,npcCell:7,x:1170,y:475,objective:'回应蔷薇，问清另一人的去向',requireStaging:true,commitBeforeDialogue:true,
  xp:65,money:15,requiredAnyFlags:[['goodTowerSummitReached','goodTowerLegacyAscent']],
  choice:{prompt:'蔷薇想知道，在你心里她是否也被惦记着。',options:[
   {text:'轻吻她的额头',effects:{flags:{goodTowerKissed:true,goodTowerNoKiss:false},affection:{wei:2},companion:'蔷薇'},after:[]},
   {text:'扶她起身，先离开这里',effects:{flags:{goodTowerKissed:false,goodTowerNoKiss:true},companion:'蔷薇'},after:[]},
  ]},rewards:{flags:{goodTowerRoseFreed:true},companion:'蔷薇'},...evidence('亲吻与拒绝两选择同归跟随Event2010；纳兰真已经由其父带走，蔷薇要回谷见重伤父亲')},
 g20:invitation('g20',1,[],{xp:65,money:15,requiredAnyFlags:[['goodRoseNightReady','goodTowerLegacyNight']]}),
 g21:{requiredAnyFlags:[['goodRoseNightComplete','goodTowerValleyLegacy']],requirementText:'先在落叶谷完成夜间交谈，天亮后再同行求医。'},
 gBad1:{requiredAnyFlags:[['goodRoseBuried','goodTowerValleyLegacy']],requirementText:'先在落叶谷面对蔷薇的离世，并为她办完后事。'},
};
export const GOOD_TOWER_VALLEY_ADDITIONS=[
 {beforeId:'g20',quests:[
  talk('g19_departure','塔顶相伴','m69','听蔷薇说明真儿去向，准备一道下塔',{
   x:1170,y:475,exclusiveFlags:['goodTowerKissed','goodTowerNoKiss'],exclusiveLegacyFlag:'goodTowerLegacyRoseFreed',
   requiredAnyFlags:[['goodTowerRoseFreed','goodTowerLegacyRoseFreed']],rewards:{flags:{goodTowerDepartureReady:true},companion:'蔷薇'},
  }),
  talk('g19_return','重返落叶谷','m51','护送蔷薇回谷，到院中看望孟知秋',{
   x:760,y:650,requiredAnyFlags:[['goodTowerDepartureReady','goodTowerLegacyDeparture']],rewards:{flags:{goodTowerHomecoming:true},companion:null},
  }),
  talk('g19_burial','安葬孟知秋','r_leaf_memorial','陪蔷薇料理后事，在孟知秋墓前停留',{
   x:760,y:650,requiredFlags:['goodTowerHomecoming'],rewards:{flags:{goodTowerMengBuried:true},companion:'蔷薇'},
  }),
  talk('g20_escort','灯下安顿','r_leaf_rose_room','从墓前回到蔷薇房中，陪她安顿下来',{
   x:750,y:815,requiredAnyFlags:[['goodTowerMengBuried','goodTowerLegacyMengBuried']],rewards:{flags:{goodRoseNightReady:true},companion:null},
  }),
 ]},
 {beforeId:'g21',quests:[
  guestReturn(1),invitation('g20_call2',2,['goodRoseCall1Ready']),
  guestReturn(2),invitation('g20_call3',3,['goodRoseCall2Ready']),
  guestReturn(3),invitation('g20_call4',4,['goodRoseCall3Ready']),
  {...talk('g20_cry','夜里的哭声','r_leaf_hero_room','回客房后听见哭声，决定是否过去探看',{
   npc:'夜间的哭声',sprite:null,npcCell:null,x:690,y:535,when:{...pending,flag:'goodRoseRefusal4'},requiredFlags:['goodRoseRefusal4'],
  }),type:'choice',commitBeforeDialogue:true,choice:{prompt:'院子静下来后，隐约传来抽泣。',options:[
   {text:'现在过去看看',effects:{flags:{goodRoseLastVisit:true,goodRoseAloneMorning:false}},after:[]},
   {text:'留在客房，等到天亮',effects:{flags:{goodRoseLastVisit:false,goodRoseAloneMorning:true}},after:[]},
  ]}},
  talk('g20_stay','守候长夜','r_leaf_rose_room','留在蔷薇身边，听她说出未曾告人的痛苦',{
   x:835,y:695,when:{...good,flag:'goodRoseStayed'},requiredFlags:['goodRoseStayed'],
   rewards:{flags:{goodRoseNightComplete:true},recover:true,companion:'蔷薇'},transition:{map:'m23'},
   fidelityNote:'翌日恢复生命、内力、体力为网页独立适配，不照搬未明的原体力-500；转药王谷有原脚本依据。',
  }),
  talk('g20_lastwords','赶去探看','r_leaf_rose_room','赶到蔷薇身边，听她最后的心事',{
   x:835,y:695,when:{...pending,flag:'goodRoseLastVisit'},requiredFlags:['goodRoseRefusal4','goodRoseLastVisit'],
   rewards:{flags:{goodRoseDead:true},companion:null},
  }),
  talk('g20_founddead','天明的寂静','r_leaf_rose_room','天亮后去蔷薇房中查看',{
   x:835,y:695,when:{...pending,flag:'goodRoseAloneMorning'},requiredFlags:['goodRoseRefusal4','goodRoseAloneMorning'],
   rewards:{flags:{goodRoseDead:true},companion:null},
  }),
  talk('g20_rose_burial','落叶无声','r_leaf_memorial','为蔷薇安葬，在墓前告别',{
   x:760,y:650,when:{...pending,flag:'goodRoseDead'},requiredFlags:['goodRoseDead'],rewards:{flags:{goodRoseBuried:true},companion:null},
  }),
 ]},
];
