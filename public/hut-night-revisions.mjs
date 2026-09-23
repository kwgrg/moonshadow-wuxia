// Independently authored task overlays from the bounded early-evil audit.
// No original script, dialogue, coordinates, animation or engine code is used.
const evidence = detail => ({
  sources: ['https://vv0817.neocities.org/gametxt/15_jxqysp', 'https://www.nbegame.com/post/11646.html'],
  source: '依据docs/early-evil-interludes-reference.md已有局部静态核验：' + detail + '。本轮不再读取原目录；对白、布局、动作、时长和存档契约为独立网页表现，完整对白寓意与原版实机输入仍未确认。',
  revised: true,
  dialogueStatus: 'independently-authored-from-recorded-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const hutBranches = ['evilHutForgiven', 'evilHutRefused'];
const stageQuest = (id, title, map, npc, objective, requiredFlags, flags, detail, extra = {}) => ({
  id, title, map, npc, sprite: npc === '紫轩' ? 2 : npc === '纳兰真' ? 1 : 0,
  type: 'talk', act: '卷八 · 霸业歧途', when: {route: 'evil'},
  objective, requiredFlags, requireStaging: true, hideCompanion: true,
  xp: 0, money: 0, rewards: {flags}, before: [], after: [],
  requirementText: '先完成眼前的交谈和经历，再继续下一段行程。',
  ...evidence(detail), ...extra,
});

export const HUT_NIGHT_REVISIONS = {
  e04: {
    ...evidence('小筑战前已认出紫轩；保留先单挑再选原谅，选答只开启对应离去与梦境，不提前跳过留宿'),
    after: [],
    choice: {
      prompt: '交手结束，紫轩谈起当年受命接近你的往事。你是否愿意原谅她？',
      options: [
        {text: '原谅', effects: {evil: -1, flags: {evilHutDecision: true, evilHutForgiven: true, evilHutRefused: false}}, after: []},
        {text: '不原谅', effects: {evil: 2, flags: {evilHutDecision: true, evilHutRefused: true, evilHutForgiven: false}}, after: []},
      ],
    },
  },
  e05: {
    requiredAnyFlags: [['evilHutNightComplete', 'evilLegacyHutNight']],
    requirementText: '先在小筑歇过这一夜，天亮后再继续赶路。',
  },
  e06_rest: {
    ...evidence('首次摘星楼切镜返回海边后，真儿外观演员先短暂隐藏再出现离去，影枫醒后寻找；不重复前任务的坐下和到岛交谈'),
    requiredFlags: [],
    requiredAnyFlags: [['evilFirstTowerInterludeComplete', 'evilLegacyFirstTowerInterlude']],
    requirementText: '先与真儿在海边歇下，醒来后再继续寻找。',
    objective: '在海边醒来，寻找已经离开的真儿',
    xp: 0, money: 0, before: [], after: [],
    hideCompanion: true, requireStaging: true,
    rewards: {companion: null, flags: {evilZhenMissing: true}},
  },
};

export const HUT_NIGHT_ADDITIONS = [
  {beforeId: 'e05', quests: [
    stageQuest('e04_departure', '小筑话别', 'm16', '紫轩', '说清战后的答复，目送紫轩离开小筑',
      ['evilHutDecision'], {evilHutZixuanDeparted: true},
      'Event595两种答复有不同话别与移动，紫轩现实离去后才进入相应梦境', {exclusiveFlags: hutBranches}),
    stageQuest('e04_dream', '花影迷梦', 'm16', '杨影枫', '在小筑歇下，醒来后再动身',
      ['evilHutDecision', 'evilHutZixuanDeparted'], {evilHutNightComplete: true},
      '原谅梦第三人为纳兰真，真儿与紫轩先后消失；拒绝梦第三人为卓非凡，紫轩靠近卓，影枫出招后醒来。梦中没有已核现实死亡或战利品', {exclusiveFlags: hutBranches}),
  ]},
  {beforeId: 'e06_rest', quests: [
    stageQuest('e06_first_interlude', '海边歇息', 'm34', '纳兰真', '与真儿在海边稍作歇息',
      ['evilIslandArrived'], {evilFirstTowerInterludeComplete: true},
      'Event3020海边插入首次楼战：教徒报告、纳兰靠近、双方交锋开始后直接返回海边，没有此段判胜或纳兰倒地；区别于Event3060第二次楼战',
      {hideCompanion: false}),
  ]},
];
