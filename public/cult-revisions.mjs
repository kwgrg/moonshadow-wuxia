// Independently authored playable route from verified mechanics and locating metadata.
// No original scripts, dialogue, maps, coordinates, attributes, or visual assets are used.
const sources = [
  'https://vv0817.neocities.org/gametxt/15_jxqysp',
  'https://www.nbegame.com/post/11647.html',
];
const evidence = (detail, locators) => ({
  sources: [...sources],
  source: `2026-09-22 依据已完成的原版只读静态核验（${locators}）及详攻略第101/101A/101B节独立编写：${detail}。未新增提取；对白、场景、战斗属性与演出为网页独立设计。定位及未确认细节见 docs/recruitment-reference.md 与 docs/cult-route-audit.md。`,
  revised: true,
  dialogueStatus: 'independently-authored-from-verified-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});

const cultRoute = () => ({route: 'good', flag: 'cultPath'});
const noIncidentalReward = {xp: 0, money: 0};
const stageQuest = () => ({
  type: 'talk',
  act: '卷七 · 一念入教',
  when: cultRoute(),
  requireStaging: true,
  hideCompanion: true,
  ...noIncidentalReward,
});

// Only names, factions, multiplicity and the all-enemies-cleared condition are reference facts.
// Order here is a web roster, not original spawn order or position. Duplicate names have unique IDs.
const wudangNames = [
  '天星道长', '张惟宜', '清虚', '清虚', '清逸', '清幻', '清修', '清源',
  '清绿', '清宇', '清毅', '清辛', '清浩', '清灵', '清翌', '清涵', '清慧',
  '静世', '静瑟', '静定', '清能', '清坤', '清志', '清风', '清宜', '清旭',
  '清誉', '清凌', '清艾', '清玳', '清荀', '清奎', '清息', '清熙', '静贤',
  '清刍', '清岚', '清郝', '清寒',
];
const enemies = wudangNames.map((name, index) => ({
  id: `cult-wudang-enemy-${String(index + 1).padStart(2, '0')}`,
  name,
  ...(index < 2 ? {boss: true} : {}),
}));
const allies = [
  {id: 'cult-wudang-ally-nalan', name: '纳兰潜凛', boss: true},
  ...Array.from({length: 26}, (_, index) => ({
    id: `cult-wudang-ally-${String(index + 1).padStart(2, '0')}`,
    name: '无忧教男弟子',
  })),
];

export const CULT_REVISIONS = {
  g15: {
    ...evidence('摘星楼三次招揽；接受转入武当攻战，三次拒绝后留下破围救人', 'script.pak 3a5d7e61'),
    title: '摘星楼招揽',
    hideCompanion: true,
    objective: '回应纳兰潜凛的招揽，决定是否随他攻打武当',
    type: 'choice',
    refusalRule: {limit: 3, outcome: 'continue', key: 'g15', refuseIndex: 1},
    before: [
      ['纳兰潜凛', '武当一倒，便没有人能挡住无忧教。影枫，与我同去，你要的名位自然会有。', 3],
      ['杨影枫', '我来是找真儿她们。你却要我拿旁人的性命换一条见她们的路？', 0],
    ],
    choice: {
      prompt: '纳兰潜凛提出条件：加入无忧教，随他攻打武当。你如何答复？',
      options: [
        {
          text: '接受招揽',
          effects: {flags: {cultPath: true}, companion: null},
          after: [
            ['杨影枫', '我答应随你去。等此事过去，你须带我见她们。', 0],
            ['纳兰潜凛', '那便动身。到了武当，让我看看你的决心。', 3],
          ],
        },
        {
          text: '拒绝加入，设法救人',
          effects: {moral: 2},
          after: [
            ['杨影枫', '我已经答过三次。无论你许下什么，我都不会替你攻打武当。', 0],
            ['纳兰潜凛', '我没有工夫再等。你就留在这楼里，等我回来。', 3],
            ['杨影枫', '他已经离开。趁守卫还未合围，先查清地牢的位置。', 0],
          ],
        },
      ],
    },
    refusalAfter: [
      ['杨影枫', '我不接受。先让我见到她们，再谈其他。', 0],
      ['纳兰潜凛', '今日若不表明立场，往后再来求我便迟了。你再想想。', 3],
    ],
    lastRefusalAfter: [
      ['纳兰潜凛', '山上的人已经备齐。最后问你一次，是否与我同去？', 3],
      ['杨影枫', '我的回答，不会因为你催促便改变。', 0],
    ],
    after: [],
    rewards: {},
    ...noIncidentalReward,
  },
};

export const CULT_ADDITIONS = [{
  beforeId: 'g16',
  quests: [
    {
      id: 'gCult_wudang',
      ...evidence('接受后进入武当山顶，39名敌对角色清除后才返回摘星楼；另有纳兰与26名无忧教友军', 'ini.pak cfa60987；script.pak ad2e8713'),
      title: '武当之劫',
      map: 'm5',
      npc: '纳兰潜凛',
      sprite: 3,
      type: 'battle',
      act: '卷七 · 一念入教',
      when: cultRoute(),
      hideCompanion: true,
      objective: '随无忧教进入武当山顶，击败全部武当守军',
      count: 1,
      boss: null,
      enemy: '武当弟子',
      friendly: false,
      scriptedLoss: false,
      skirmish: {enemies, allies, heroStart: {x: 580, y: 810}},
      before: [
        ['天星道长', '杨少侠，上回你来问剑，今日却站在无忧教一边。你当真想清楚了？', 0],
        ['纳兰潜凛', '影枫，到了此处，便没有两边讨好的余地。', 3],
        ['杨影枫', '我……已经走到这里。出剑吧。', 0],
      ],
      after: [
        ['江湖纪事', '武当山顶的抵抗终止了。影枫收起剑，随纳兰潜凛返回摘星楼。', 0],
      ],
      rewards: {flags: {cultWudangCleared: true}, companion: null},
      ...noIncidentalReward,
      fidelityNote: '敌我身份、数量和全部清除门槛来自已核验配置；稳定ID、名单次序、boss强度标记、站位、寻路与战斗数值均为网页独立设计。',
    },
    {
      id: 'gCult_appointment',
      ...evidence('武当清场后回摘星楼，受任护法左使，再由纳兰带往地下', 'script.pak ad2e8713'),
      ...stageQuest(),
      title: '回楼授职',
      map: 'm61',
      npc: '纳兰潜凛',
      sprite: 3,
      objective: '返回摘星楼厅堂，走到纳兰潜凛面前',
      requiredFlags: ['cultWudangCleared'],
      requirementText: '先完成武当之战，再返回摘星楼见纳兰潜凛。',
      before: [
        ['杨影枫', '我已随你从武当回来。现在，该让我见到她们了。', 0],
      ],
      after: [
        ['江湖纪事', '纳兰潜凛授影枫护法左使之位，随后领他走向地牢。', 0],
      ],
      rewards: {flags: {cultAppointed: true}},
    },
    {
      id: 'gCult_qiangwei',
      ...evidence('地牢先发生蔷薇的固定处决，原续段没有杀或不杀菜单', 'script.pak ad2e8713'),
      ...stageQuest(),
      title: '地牢断义 · 蔷薇',
      map: 'r_cult_dungeon',
      npc: '蔷薇',
      sprite: 1,
      objective: '随纳兰进入地牢，走近关押蔷薇的位置',
      requiredFlags: ['cultAppointed'],
      requirementText: '先到摘星楼厅堂见纳兰潜凛，再随他进入地下。',
      before: [
        ['杨影枫', '铁门后有人走动。蔷薇……是你在里面吗？', 0],
      ],
      after: [
        ['江湖纪事', '影枫听从纳兰的命令，向蔷薇出手。她倒在地牢中，再没能走出去。', 0],
      ],
      rewards: {flags: {cultQiangweiDead: true}, companion: null},
    },
    {
      id: 'gCult_zixuan',
      ...evidence('蔷薇之后才到紫轩处；同样是固定处决演出，没有拒杀或反抗单挑', 'script.pak ad2e8713'),
      ...stageQuest(),
      title: '地牢断义 · 紫轩',
      map: 'r_cult_dungeon',
      npc: '紫轩',
      sprite: 2,
      objective: '走到另一处牢门前，找到紫轩',
      requiredFlags: ['cultQiangweiDead'],
      requirementText: '先随纳兰到蔷薇那一间牢房。',
      before: [
        ['杨影枫', '还有一间牢房。灯影里站着的人，是紫轩。', 0],
      ],
      after: [
        ['江湖纪事', '影枫又向紫轩举剑。纳兰带他离开地下时，两道牢门后都只剩寂静。', 0],
      ],
      rewards: {flags: {cultZixuanDead: true}, companion: null},
    },
    {
      id: 'gCult_farewell',
      ...evidence('地牢后返回楼内见真儿，真儿离开前往忘忧岛，月眉儿亦离去', 'script.pak ad2e8713'),
      ...stageQuest(),
      title: '楼中诀别',
      map: 'r_cult_chamber',
      npc: '纳兰真',
      sprite: 1,
      objective: '回到楼内房间，与纳兰真见面',
      requiredFlags: ['cultZixuanDead'],
      requirementText: '先随纳兰走完地牢，才能回到楼上的房间。',
      before: [
        ['杨影枫', '真儿就在这扇门后。我一路想见她，到了此刻，却不知如何开口。', 0],
      ],
      after: [
        ['江湖纪事', '真儿离开摘星楼，返回忘忧岛。月眉儿也离去了，影枫独自留在楼中。', 0],
      ],
      rewards: {flags: {cultZhenDeparted: true, cultMeiDeparted: true}, companion: null},
    },
    {
      id: 'gCult_epilogue',
      ...evidence('离别后以时间推进收束：纳兰练功而亡，影枫继位修炼，终归孤独；并无额外取经或授技任务', 'script.pak ad2e8713；详攻略101A'),
      ...stageQuest(),
      title: '孤灯余生',
      map: 'r_cult_chamber',
      npc: '旧日灯影',
      sprite: 0,
      objective: '回到房中的灯前，走完这条路的终章',
      requiredFlags: ['cultZhenDeparted', 'cultMeiDeparted'],
      requirementText: '先与真儿、眉儿告别。',
      before: [
        ['杨影枫', '她们走后，楼里仍有人向我行礼。可每次回到这房中，我总会先望向空着的门口。', 0],
      ],
      after: [
        ['江湖纪事', '纳兰后来练功而亡，影枫继位，修成武道德经。他最终舍弃名位，却再寻不回那些失去的人。', 0],
      ],
      rewards: {flags: {cultNalanDead: true, cultEpilogueComplete: true}, companion: null},
      endingId: 'cult',
      fidelityNote: '后期人生以独立时间推进演出呈现，不追加未证实的取经、修炼战或可装备技能奖励；两女离场与结局镜头布局/时长为原创适配。',
    },
  ],
}];
