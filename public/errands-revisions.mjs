// Independently authored handovers from the project's recorded story audit.
// Quest positions use existing web scenes, never original map coordinates.
const sources=[
 'https://www.nbegame.com/post/11647.html',
 'https://vv0817.neocities.org/gametxt/15_jxqysp'
];
const evidence=detail=>({
 sources:[...sources],
 source:'2026-09-22 依据既有正线攻略核验记录拆分：'+detail+'。对白为重新创作，未提取原版内容。',
 revised:true,
 dialogueStatus:'independently-authored-from-recorded-events',
 referencePolicy:'reference-only-no-original-content'
});
const good={route:'good'};

export const ERRANDS_REVISIONS={
 g01:{
  ...evidence('真儿失踪时不能仍作为跟随者出现在找人现场'),
  hideCompanion:true,
  rewards:{companion:null}
 },
 g02:{hideCompanion:true},
 g03:{
  ...evidence('在敦煌十洞出口击退劫持者后救出蔷薇；送抵落叶谷后才获孟知秋所赠太极剑谱'),
  objective:'击退洞口的飞龙堡劫持者，带蔷薇离开',
  after:[
   ['蔷薇','总算能出来了。我要回落叶谷，爹还不知道我被抓到这里。',1],
   ['杨影枫','跟紧我。先送你平安回谷，再去查真儿的消息。',0]
  ],
  rewards:{companion:'蔷薇'}
 },
 g04:{hideCompanion:true,
  ...evidence('凌绝峰交手后真儿现身，澄清月眉儿曾救自己，此后才恢复真儿同行'),
  rewards:{companion:'纳兰真'}
 },
 g08:{
  ...evidence('银丝草在离忧山采集十二株，采齐后必须返海边小屋交还，再有煎药与玉佩相认'),
  objective:'在离忧山采齐十二株银丝草',
  hideCompanion:true,
  before:[
   ['杨影枫','真儿在海边小屋照看眉儿。我来山上找药，凑齐十二株银丝草就回去。',0],
   ['杨影枫','山路两侧都有草木，须仔细辨认，免得把不合用的也带回去。',0]
  ],
  after:[
   ['杨影枫','十二株，已经齐了。把药草收好，回海边小屋交给真儿。',0]
  ],
  rewards:{items:{silver_grass:12},companion:null}
 },
 g09:{
  ...evidence('返屋煎药并对合两半玉佩后才进入密室；密室取得母亲遗书，不重复获得玉佩'),
  requiredItems:{jade_half:2},
  rewards:{items:{mother_letter:1}}
 }
};

export const ERRANDS_ADDITIONS=[
 {
  beforeId:'g04',
  quests:[
   {
    id:'g03_return',
    ...evidence('洞口救出蔷薇，送回落叶谷后由孟知秋赠太极剑谱'),
    title:'护送归谷',map:'m51',npc:'孟知秋',sprite:0,type:'talk',act:'卷七 · 侠路寻心',when:{...good},
    objective:'带蔷薇回到落叶谷，向孟知秋报平安',
    before:[
     ['蔷薇','爹，我回来了。那些人把我捆在洞口，是他把我救出来的。',1],
     ['孟知秋','人平安回来就好。影枫，这一趟辛苦你了。',0],
     ['杨影枫','见她受困，岂有不救之理。送到谷中，我也能放心。',0]
    ],
    after:[
     ['孟知秋','这册太极剑谱交给你。招式须与运劲相合，往后静下心来慢慢体会。',0],
     ['蔷薇','我留在家里，你也早些回庄看看吧。若有消息，记得来告诉我们。',1]
    ],
    rewards:{skills:[6],companion:null},xp:0,money:0,
    fidelityNote:'授谱时点与落叶谷见既有审计；路线、角色站位及护送移动为网页独立设计，原版十洞地理未核。'
   },
   {
    id:'g03_invitation',
    ...evidence('护送蔷薇并获太极剑谱后回悲魔山庄，由铁云转达月眉儿的凌绝峰之约'),
    title:'回庄得邀',map:'m49',npc:'铁云',sprite:0,type:'talk',act:'卷七 · 侠路寻心',when:{...good},
    objective:'返回悲魔山庄，向铁云问起新消息',
    before:[
     ['铁云','庄主，月眉儿留下了话，请你去凌绝峰见面。',0],
     ['杨影枫','我正要问清真儿的事。她既肯见我，就到峰上当面说。',0]
    ],
    after:[
     ['铁云','山庄这边我会照看，庄主路上留神。',0],
     ['杨影枫','好。我这就动身。',0]
    ],
    rewards:{},xp:0,money:0
   }
  ]
 },
 {
  beforeId:'g09',
  quests:[{
   id:'g08_deliver',
   ...evidence('十二株银丝草带回海边小屋交由真儿煎药，眉儿好转后两半玉佩相合，随后赴禁地密室'),
   title:'海屋交药',map:'m33',npc:'纳兰真',sprite:1,type:'talk',act:'卷七 · 侠路寻心',when:{...good},
   objective:'把十二株银丝草交给纳兰真，为月眉儿煎药',
   requiredItems:{silver_grass:12},consumeItems:{silver_grass:12},requireStaging:true,hideCompanion:true,
   before:[
    ['纳兰真','你回来了。让我看看药草，十二株齐了便能煎药。',1],
    ['杨影枫','都在这里，山上采来的。我把药草交给你。',0]
   ],
   after:[
    ['江湖纪事','真儿把药草洗净煎好，守着月眉儿服下。过了一阵，眉儿的气息渐渐平稳。',0],
    ['纳兰真','眉儿，你身上这半块玉佩，缺口竟和我的一样。让我把它们靠在一起。',1],
    ['月眉儿','正好合上了。母亲留下的东西，为什么会分在我们两人手里？',2],
    ['纳兰真','到禁地的密室看看吧。两块玉佩已在这里，也许能打开那扇门。',1]
   ],
   rewards:{items:{jade_half:2},flags:{silverGrassDelivered:true},companion:'纳兰真'},xp:0,money:0,
   fidelityNote:'资料仅称海边小屋。m33沿用网页版a46/a47的海屋治疗场景，不据此声称原版具体地图编号、屋内布局或路径已核；煎药时长为原创叙事转场。'
  }]
 }
];
