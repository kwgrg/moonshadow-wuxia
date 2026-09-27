// Independent R18 implementation from the recorded, read-only mechanism audit.
// No original script, dialogue, media, configuration or coordinates are included.
const evidence=detail=>({
 sources:['docs/evil-ending-reference.md'],source:detail+'；机制据已记录核验。对白、布局、时长、难度和保存为网页原创适配。',
 referencePolicy:'reference-only-no-original-content',dialogueStatus:'independently-authored-from-verified-mechanics',revised:true,
});
export const EVIL_ENDING_EVIDENCE={
 verified:['八锁救人后恢复并直接归庄','卧床照料与铁云报告先于庄门战','29敌同场全清','战后探视再过三个月','真儿视角揭面、读信、认姐妹与试药','参汤中毒后依据既有倾向自动分支','低支给解药、眉儿活着离去、失功叙述、五年后一家三口','高支先杀真儿、得解药、再杀眉儿、两墓与四人梦战','梦战胜败都转父墓收束'],
 authored:['全部对白、人物调度、网页场地和道具','演出时长、交互提示、保存恢复与重试','战斗数值、29人分布位置及网页倾向模型web-v1','真儿视角的网页走动与读信表现','失功仅用叙事标记，不抹去技能和等级'],
 unknown:['原比较符>>118的严格或包含边界','原隐藏值全部写入的实际生效规则','药局时真儿可否自由行动','原敌人AI、伤害、掉落及完整动画','庄门战原主角死亡回调'],
};
const room='r_evil_final_room',branchFlags=['evilFinalMercy','evilFinalCruel'];
const q=(id,title,map,npc,objective,requiredFlags,flags,extra={})=>({
 id,title,map,npc,sprite:npc==='纳兰真'?1:npc==='月眉儿'?2:0,objective,type:'talk',act:'卷八 · 归庄终局',
 when:{route:'evil'},before:[],after:[],xp:0,money:0,encounterTier:20,requireStaging:true,
 hideCompanion:true,repairCompanions:true,suppressBattleSupplies:true,requiredFlags,
 requirementText:'先完成眼前的会面与遭遇，再继续这一段行程。',
 rewards:{flags,companions:[]},...evidence('邪线庄门战后药局与分支尾声'),...extra,
});
const branch=side=>({when:{route:'evil',flag:side==='family'?'evilFinalMercy':'evilFinalCruel',not:side==='family'?'evilFinalCruel':'evilFinalMercy'},exclusiveFlags:branchFlags});

export const EVIL_ENDING_REVISIONS={
 e13:{
  title:'八锁开门',objective:'确认八层机关接通，打开第五层牢门接出真儿',before:[],after:[],requireStaging:true,hideCompanion:true,repairCompanions:true,
  requiredFlags:Array.from({length:8},(_,i)=>'switch'+(i+1)),
  rewards:{recover:true,flags:{evilFinalRescued:true},companions:[]},transition:{map:room},
  ...evidence('八锁成立后救出真儿，恢复三值并直接回悲魔山庄照料'),
 },
 e14:{
  title:'庄门来敌',objective:'到庄门迎敌，击退全部二十九名来犯者',type:'battle',map:'m49',npc:'来犯武人',sprite:3,
  before:[],after:[['江湖纪事','庄门前的兵刃声终于停了。影枫收剑，转身赶回真儿休养的屋子。',0]],
  count:29,enemy:'武林人士',boss:null,ending:false,distributedCombat:true,requireStaging:true,hideCompanion:true,repairCompanions:true,
  xp:65,money:15,encounterTier:20,suppressBattleSupplies:false,
  requiredFlags:[],requiredAnyFlags:[['evilFinalReported','evilFinalLegacyGate']],rewards:{recover:true,flags:{evilFinalBattleWon:true},companions:[]},
  legacyCombatCount:{flag:'evilFinalLegacyFourFight',count:4,enemy:'来犯武人'},legacyStagingFlag:'evilFinalLegacyGate',
  enemyNames:[...Array(7).fill('武林人士'),...Array(6).fill('武当弟子'),...Array(3).fill('武当道士'),...Array(2).fill('王姓武人'),'张姓武人','林姓武人','梁姓武人','李姓武人','吴姓武人','聂姓武人','沈姓武人','胖道士','瘦道士','火杀手','火龙'],
  afterMarker:{name:'庄门止息',sprite:null,paintOnly:true},afterObjective:'来敌已退。收剑离开庄门，回房探望真儿。',
  ...evidence('29名敌人绑定同一计数回调，必须全清；四名家丁不据未核Kind5语义设为必护目标'),
 },
};

export const EVIL_ENDING_ADDITIONS=[
 {beforeId:'e14',quests:[
  q('e14_report','归庄照料',room,'纳兰真','安顿刚从塔中救出的真儿，听铁云报告庄外动静',[],{evilFinalReported:true},{requiredAnyFlags:[['evilFinalRescued','evilFinalLegacyRescued']]}),
 ]},
 {afterId:'e14',quests:[
  q('e14_recovery','三月相伴',room,'纳兰真','回房探视真儿，在庄中度过休养的日子',[],{evilFinalRecovered:true},{requiredAnyFlags:[['evilFinalBattleWon','evilFinalLegacyBattleWon']]}),
  q('e14_letter','可容的面容','m50','可容','以真儿的视角走近可容，听她说明身份并读信',['evilFinalRecovered'],{evilFinalLetterRead:true},{playAs:'纳兰真',sprite:1,transition:{map:room}}),
  q('e14_poison','参汤里的谎言',room,'纳兰真','等待真儿送汤，面对药性发作后的胁迫',['evilFinalLetterRead'],{evilFinalPoisoned:true},{
   // The runtime commits one versioned outcome after this entire scene. No choice
   // menu or static reward here can select or rewrite that result.
   finalOutcomeCommit:true,
  }),
  q('e14_mercy','不以命换命',room,'月眉儿','拒绝伤害真儿，听眉儿给出最后的答复',['evilFinalPoisoned','evilFinalMercy'],{evilFinalMercySaved:true,evilFinalMartialLost:true},{...branch('family'),transition:{map:'r_evil_family_shore'}}),
  q('e14_family','五年后的海风','r_evil_family_shore','纳兰真','与真儿和儿子杨纳康在海边相聚',['evilFinalMercySaved','evilFinalMercy'],{evilFinalFamilySeen:true},{...branch('family'),endingId:'family'}),
  q('e14_zhen_fall','背弃相守',room,'纳兰真','承受此前抉择积成的后果',['evilFinalPoisoned','evilFinalCruel'],{evilFinalZhenKilled:true},{...branch('alone')}),
  q('e14_antidote','解药交出',room,'月眉儿','向眉儿索取解药，听完她的话',['evilFinalZhenKilled','evilFinalCruel'],{evilFinalAntidoteTaken:true},{...branch('alone')}),
  q('e14_mei_fall','第二次举剑',room,'月眉儿','面对解毒之后仍未停下的杀意',['evilFinalAntidoteTaken','evilFinalCruel'],{evilFinalMeiKilled:true},{...branch('alone'),transition:{map:'r_evil_final_graves'}}),
  q('e14_burial','两座新墓','r_evil_final_graves','杨影枫','安葬真儿和眉儿，停在两座墓前',['evilFinalMeiKilled','evilFinalCruel'],{evilFinalBuried:true},{...branch('alone'),transition:{map:room}}),
  q('e14_sleep','山庄长夜',room,'杨影枫','独自回屋歇下，等待长夜过去',['evilFinalBuried','evilFinalCruel'],{evilFinalSleep:true},{...branch('alone')}),
  q('e14_dream','四道旧影',room,'梦中旧人','面对梦中的真儿、眉儿、蔷薇与紫轩',['evilFinalSleep','evilFinalCruel'],{evilFinalDreamResolved:true},{
   ...branch('alone'),type:'battle',battleScene:'evilFinalDream',dreamCombat:true,suppressKillRewards:true,
   count:4,enemy:'梦中旧人',enemyNames:['纳兰真','月眉儿','蔷薇','紫轩'],enemySprites:[1,2,3,2],
   rewards:{recover:true,flags:{evilFinalDreamResolved:true},companions:[]},transition:{map:'r_evil_father_peak'},
   ...evidence('四名梦中对手全清或主角在该梦死亡，都转到凌绝峰父墓并恢复；不得作为现实死亡或强制重试'),
  }),
  q('e14_father','父墓前','r_evil_father_peak','杨影枫','从梦境醒来，在父亲墓前回望一路所为',['evilFinalDreamResolved','evilFinalCruel'],{evilFinalFatherSeen:true},{...branch('alone'),endingId:'alone'}),
 ]},
];
