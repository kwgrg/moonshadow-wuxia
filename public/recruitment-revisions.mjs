// Independent data for recruitment encounters. Original dialogue and assets are not used.
// Runtime integration must persist refusal counts and terminal failure before showing their UI.
const sources = [
  'https://vv0817.neocities.org/gametxt/15_jxqysp',
  'https://www.nbegame.com/post/11646.html',
];
const evidence = (section, locator) => ({
  sources: [...sources],
  source: `2026-09-22 原版 script.pak 项 ${locator} 只读内存静态核验，并与杜胜利详攻略第${section}节及 NBE 邪派线交叉核对：败战后招揽、拒绝次数与致死处理有证据；未作原版实机验证。对白、战斗数值与失败恢复为网页独立设计。原版隐藏值和网页量表未整体校准，保留现有 effects。定位与边界见 docs/recruitment-reference.md。`,
  revised: true,
  dialogueStatus: 'independently-authored-from-verified-guide-events',
  referencePolicy: 'reference-only-no-original-content',
});

export const RECRUITMENT_REVISIONS = {
  e05: {
    ...evidence('61–62', '558c527c'),
    title: '摘星楼受制',
    npc: '纳兰潜凛',
    sprite: 3,
    objective: '向纳兰潜凛索要蔷薇，交手后回应入教胁迫',
    type: 'choice',
    battleBeforeChoice: true,
    choiceBeforeObjective: false,
    scriptedLoss: true,
    forcedOutcome: 'defeat',
    friendly: false,
    count: 1,
    boss: '纳兰潜凛',
    enemy: '纳兰潜凛',
    enemySprite: 3,
    waves: null,
    refusalRule: {limit: 3, outcome: 'fatal', key: 'e05', refuseIndex: 1},
    before: [
      ['杨影枫', '真儿告诉我，蔷薇被你带到了这里。你要找孟知秋，为何把她牵扯进来？', 0],
      ['纳兰潜凛', '孟知秋肯为她而来，我便有了让他低头的筹码。你若要抢人，先过我这一关。', 3],
      ['杨影枫', '那便让我领教。今日我不能丢下她离开。', 0],
    ],
    choice: {
      prompt: '交手落败，退路也被封住。纳兰潜凛要你加入无忧教，你如何答复？',
      options: [
        {
          text: '加入无忧教',
          effects: {},
          after: [
            ['杨影枫', '我答应。但我要先去见蔷薇。', 0],
            ['纳兰潜凛', '跟我来。你的答复，还得用行动证明。', 3],
          ],
        },
        {text: '拒绝', effects: {}, after: []},
      ],
    },
    refusalAfter: [
      ['杨影枫', '我不愿替无忧教做事。放了蔷薇，我和她一道离开。', 0],
      ['纳兰潜凛', '你尚未脱身，便想和我讲条件？再答一次。', 3],
    ],
    lastRefusalAfter: [
      ['纳兰潜凛', '这是你最后的机会。想清楚，再开口。', 3],
      ['杨影枫', '你拿我们的性命相逼，就一定能换来忠心么？', 0],
    ],
    fatalAfter: [
      ['杨影枫', '我不会加入无忧教。', 0],
      ['江湖纪事', '第三次拒绝之后，纳兰潜凛出手杀死了影枫。这次救援终止在摘星楼。', 0],
    ],
    after: [
      ['江湖纪事', '纳兰潜凛接受了入教的答复，带影枫走向关押蔷薇的地牢。', 0],
      ['杨影枫', '蔷薇还在等我。先见到她，再想办法。', 0],
    ],
  },
  e07: {
    ...evidence('63–65', 'c5a3875f'),
    title: '玉佩与假面',
    npc: '月眉儿',
    sprite: 2,
    objective: '追查假真儿开启的密室，与月眉儿交手后回应招揽',
    type: 'choice',
    battleBeforeChoice: true,
    choiceBeforeObjective: false,
    scriptedLoss: true,
    forcedOutcome: 'defeat',
    friendly: false,
    count: 1,
    boss: '月眉儿',
    enemy: '月眉儿',
    enemySprite: 2,
    waves: null,
    refusalRule: {limit: 2, outcome: 'fatal', key: 'e07', refuseIndex: 1},
    before: [
      ['江湖纪事', '影枫醒来后寻不见真儿，循着她的身影进入禁地。那人用两半玉佩开启密门，又读起屋中的旧信。', 0],
      ['杨影枫', '真儿只有半块玉佩。你手里的另一半从哪里来？', 0],
      ['月眉儿', '既然跟到了这里，也瞒不住了。这封信说，真儿与我是亲姐妹……', 2],
      ['江湖纪事', '她揭去假面。影枫还未问清真儿的下落，月眉儿已转身出手。', 0],
    ],
    choice: {
      prompt: '你败在月眉儿手中。她邀你加入飞龙堡，共同离岛，你如何答复？',
      options: [
        {
          text: '加入飞龙堡',
          effects: {},
          after: [
            ['杨影枫', '我答应与你一道走。真儿的事，你还要向我说清楚。', 0],
            ['月眉儿', '先离开这里，回悲魔山庄再谈。', 2],
          ],
        },
        {text: '拒绝', effects: {}, after: []},
      ],
    },
    refusalAfter: [
      ['杨影枫', '你假扮真儿，又突然出手，要我怎能信你？', 0],
      ['月眉儿', '信不信由你。可你若不肯随我走，便休想从这里出去。', 2],
    ],
    lastRefusalAfter: [
      ['月眉儿', '我只再问一次。你要加入飞龙堡，还是执意拒绝？', 2],
      ['杨影枫', '让我想清楚。', 0],
    ],
    fatalAfter: [
      ['杨影枫', '我仍不答应。', 0],
      ['江湖纪事', '第二次拒绝之后，月眉儿向影枫下了杀手。他没能走出禁地。', 0],
    ],
    after: [
      ['江湖纪事', '影枫答应加入飞龙堡，与月眉儿离开密室。回村的路上，他们发现神驼帮正在岛上抢掠。', 0],
      ['杨影枫', '先把通往渡口的路打通，不能让村里的人受困。', 0],
    ],
  },
};

