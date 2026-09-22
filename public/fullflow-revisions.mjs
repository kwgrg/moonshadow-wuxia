// Independently authored scenes based on the already recorded story audit.
// No original dialogue, script, assets, coordinates, or engine code are used.
const evilSources = [
  'https://www.nbegame.com/post/11646.html',
  'https://vv0817.neocities.org/gametxt/15_jxqysp',
];
const evidence = detail => ({
  sources: [...evilSources],
  source: '2026-09-22 根据已有邪线攻略核验记录独立补写：' + detail + '。未新提取原目录；对白与战斗数值为网页重新设计。',
  revised: true,
  dialogueStatus: 'independently-authored-from-recorded-events',
  referencePolicy: 'reference-only-no-original-content',
});

export const FULLFLOW_REVISIONS = {
  e02: {
    ...evidence('婚宴前按方离、尚进、张惟宜次序进行三场切磋，之后才有婚夜真儿来访与追否选择'),
    title: '婚宴试剑与旧人',
    choiceAfterDark: true,
    npc: '方离',
    sprite: 0,
    choiceSpeaker: '纳兰真',
    choiceSprite: 1,
    objective: '依次与方离、尚进、张惟宜切磋，再回应婚夜来访的纳兰真',
    type: 'choice',
    battleBeforeChoice: true,
    choiceBeforeObjective: false,
    friendly: true,
    scriptedLoss: false,
    count: 1,
    boss: null,
    enemy: '方离',
    enemySprite: 0,
    waves: [
      {count: 1, enemy: '方离', boss: null, enemySprite: 0, friendly: true, scriptedLoss: false},
      {count: 1, enemy: '尚进', boss: null, enemySprite: 0, friendly: true, scriptedLoss: false},
      {count: 1, enemy: '张惟宜', boss: null, enemySprite: 0, friendly: true, scriptedLoss: false},
    ],
    before: [
      ['江湖纪事', '婚礼将近，几位来客在山庄庭中留出了试剑的空地。方离先走上前来，尚进和张惟宜在一旁候着。', 0],
      ['方离', '今日是喜事，我先讨教几招。只论剑术，咱们点到为止。', 0],
      ['杨影枫', '请。各位远来相贺，我也当拿出几分本事。', 0],
    ],
    choice: {
      prompt: '三场切磋结束，婚礼礼成。夜里，纳兰真送来祝福便转身离去，你要追上她吗？',
      options: [
        {
          text: '追上纳兰真',
          effects: {evil: -2, affection: {zhen: 1}},
          after: [
            ['杨影枫', '真儿，先别走。我一直想找机会和你说说话。', 0],
            ['纳兰真', '我来是为了祝福你。既然已经有了家，就好好照顾蔷薇吧。', 1],
          ],
        },
        {
          text: '不追',
          effects: {evil: 2},
          after: [
            ['江湖纪事', '影枫停在灯下，没有追出去。真儿的脚步渐远，庭中只剩散席后零落的人声。', 0],
            ['杨影枫', '今夜说得再多，也改不了我已作出的决定。', 0],
          ],
        },
      ],
    },
    after: [
      ['江湖纪事', '真儿离开后，影枫回到新房。成婚并未让旧事平息，他与蔷薇之间渐渐生出争执。', 0],
      ['杨影枫', '去庄外走一走吧，让心静下来再回去。', 0],
    ],
  },
  e03: {
    ...evidence('先在庄外败给蒙面人并接十日之约，再往落叶谷向孟知秋问招、获授沧海月明'),
    objective: '把庄外交手的经过告诉孟知秋，请教应对之法',
    before: [
      ['杨影枫', '孟前辈，我在庄外败给一个蒙面人。他约我十日后在芭蕉小筑再战，那路剑法我看不透。', 0],
      ['孟知秋', '招法记得多少，就从哪里说起。先稳住运劲，再找他的破绽。', 0],
    ],
    after: [
      ['孟知秋', '沧海月明的要领已传给你。勤加练习，别再一味急着抢攻。', 0],
      ['杨影枫', '晚辈会记住。待约期到了，再去小筑会他。', 0],
    ],
    rewards: {skills: [7]},
  },
  e04: {
    ...evidence('十日后在芭蕉小筑与紫衫蒙面人单独交手，战后揭露紫轩身份并作是否原谅的选择'),
    npc: '紫衫蒙面人',
    sprite: 2,
    choiceSpeaker: '紫轩',
    choiceSprite: 2,
    objective: '赴芭蕉小筑之约，与紫衫蒙面人交手后问清来意',
    type: 'choice',
    battleBeforeChoice: true,
    choiceBeforeObjective: false,
    friendly: true,
    scriptedLoss: false,
    count: 1,
    boss: null,
    enemy: '紫衫蒙面人',
    enemySprite: 2,
    waves: null,
    before: [
      ['江湖纪事', '十日之约已至。影枫踏入小筑，一名紫衫蒙面人正持剑立在庭中。', 0],
      ['杨影枫', '我依约来了。上回未能接住的招式，今日再试。', 0],
      ['紫衫蒙面人', '那就出剑。等交过手，再说其他的事。', 2],
    ],
    choice: {
      prompt: '交手结束，蒙面人撤下遮面之物，竟是紫轩。她承认曾受命接近你，你是否愿意原谅她？',
      options: [
        {
          text: '原谅',
          effects: {evil: -1},
          after: [
            ['杨影枫', '我忘不了那些事，但也不愿每次见你，都只剩责怪。过去的怨，先放下吧。', 0],
            ['紫轩', '谢谢你肯听我说。月眉儿还会来找你，你往后须多留心。', 2],
          ],
        },
        {
          text: '不原谅',
          effects: {evil: 2},
          after: [
            ['杨影枫', '我现在还做不到。曾经信过的话，不能说忘便忘。', 0],
            ['紫轩', '我明白。愿你以后少遇些像我这样让你失望的人。', 2],
          ],
        },
      ],
    },
    after: [
      ['江湖纪事', '紫轩收剑离去。影枫在小筑留了一夜，翌日才动身返回悲魔山庄。', 0],
      ['杨影枫', '该回去了。还有许多事情，不能只靠回避。', 0],
    ],
  },
  e10: {
    sceneLight: 'night',
    ...evidence('孟知秋在蔷薇墓前信任影枫并传云生结海，授技必须发生于夜袭前'),
    objective: '入夜后与飞龙堡接应者会合，向孟知秋动手',
    before: [
      ['江湖纪事', '入夜后，月眉儿带着接应的人来到落叶谷。影枫已受孟知秋传授云生结海，却仍隐瞒着地牢中发生的一切。', 0],
      ['月眉儿', '人已经到了。你若仍要继续，就随我们进去。', 2],
      ['杨影枫', '孟前辈……我终究还是辜负了你。', 0],
    ],
    rewards: {},
  },
};

export const FULLFLOW_ADDITIONS = [
  {
    beforeId: 'e03',
    quests: [{
      id: 'e03_masked_duel',
      ...evidence('庄外蒙面人击败影枫，约十日后在芭蕉小筑再战；在此不提前揭露来人身份'),
      title: '庄外蒙面客',
      map: 'm49',
      npc: '蒙面人',
      sprite: 3,
      type: 'boss',
      act: '卷八 · 霸业歧途',
      when: {route: 'evil'},
      objective: '在山庄外迎战拦路的蒙面人',
      count: 1,
      enemy: '蒙面人',
      boss: '蒙面人',
      enemySprite: 3,
      scriptedLoss: true,
      forcedOutcome: 'defeat',
      friendly: true,
      before: [
        ['江湖纪事', '庄外有人拦住去路。来者遮着面容，剑尖低垂，却未留下绕行的空隙。', 0],
        ['蒙面人', '听说悲魔山庄的主人剑法了得。我想亲自试一试。', 3],
        ['杨影枫', '既然是来问剑的，就请赐教。', 0],
      ],
      after: [
        ['江湖纪事', '影枫未能挡住来人的剑势。蒙面人收住追击，退开几步。', 0],
        ['蒙面人', '十日后，芭蕉小筑。若还想再试，便来赴约。', 3],
        ['杨影枫', '这路功夫究竟出自何处？先去落叶谷请教孟前辈。', 0],
      ],
      rewards: {},
      xp: 0,
      money: 0,
      fidelityNote: '剧情败战与十日之约见既有审计；血量、招式与时间转场为网页适配，尚未核验原版参数。',
    }],
  },
  {
    beforeId: 'e10',
    quests: [{
      id: 'e10_teaching',
      ...evidence('在蔷薇墓前隐去实情、得到孟知秋信任并学会云生结海，之后才发生夜袭'),
      title: '墓前授艺',
      map: 'm51',
      npc: '孟知秋',
      sprite: 0,
      type: 'talk',
      act: '卷八 · 霸业歧途',
      when: {route: 'evil'},
      objective: '在落叶谷见孟知秋，接受他传授云生结海',
      before: [
        ['江湖纪事', '孟知秋带影枫来到蔷薇墓前。影枫隐去了地牢中的真相，没有说出她临终时的经过。', 0],
        ['孟知秋', '我原以为连你也回不来了。既然尚在人世，就先留在谷里。', 0],
        ['杨影枫', '孟前辈，我……还有许多做得不好的地方。', 0],
      ],
      after: [
        ['孟知秋', '云生结海重在气息相续。把今日所授练熟，往后莫再轻易受人所制。', 0],
        ['江湖纪事', '影枫记下运劲方法。天色渐晚，他已能使出新招，却不知该如何面对眼前仍信任他的老人。', 0],
      ],
      rewards: {skills: [8]},
      xp: 0,
      money: 0,
      fidelityNote: '单独授技节点用于保证云生结海在夜袭前可用；地点细节与人物动作仍待独立演出及浏览器验证。',
    }],
  },
];
