// Independent staging and state contracts from the bounded hut-return record.
// Original package payloads, dialogue, maps and coordinates are not included.
const evidence = detail => ({
  sources: ['https://vv0817.neocities.org/gametxt/15_jxqysp', 'https://www.nbegame.com/post/11646.html'],
  source: '依据docs/hut-return-reference.md：Event600返庄争执、蔷薇离家、次日铁云寻人、真儿来报并离场后才置Event3000。' + detail + '。原版仅只读内存核验；消息主题另由攻略第61节与NBE对应段支持。对白、地图分室、坐标、时长及存档阶段为独立网页表现，原版输入与精确动画未核。',
  revised: true,
  dialogueStatus: 'independently-authored-from-recorded-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const quest = (id, title, map, npc, objective, requiredFlags, flags, extra = {}) => ({
  id, title, map, npc, sprite: npc === '纳兰真' ? 1 : 0,
  type: 'talk', act: '卷八 · 霸业歧途', when: {route: 'evil'},
  objective, requiredFlags, requireStaging: true, hideCompanion: true,
  xp: 0, money: 0, rewards: {flags}, before: [], after: [],
  requirementText: '先完成眼前的交谈和行程，再继续下一步。',
  ...evidence('每段完成才提交对应旗标，不在听到消息前开启营救入口'),
  ...extra,
});

export const HUT_RETURN_REVISIONS = {
  e05: {
    requiredAnyFlags: [
      ['evilHutNightComplete', 'evilLegacyHutNight'],
      ['evilHutReportHeard', 'evilLegacyHutReport'],
    ],
    requirementText: '先在小筑醒来，返庄经历蔷薇离家与次日传讯，再前往摘星楼救人。',
  },
};

export const HUT_RETURN_ADDITIONS = [
  {beforeId: 'e05', quests: [
    quest('e04_homecoming', '返庄问讯', 'm49', '铁云', '从小筑沿路返回悲魔山庄，向铁云询问蔷薇的近况',
      [], {evilHutHomecoming: true}, {
        ...evidence('攻略描述返庄后铁云告知蔷薇心情不好；她在大厅右厢房，不能从小筑直接赶往摘星楼'),
        requiredAnyFlags: [['evilHutNightComplete', 'evilLegacyHutNight']],
        requirementText: '先结束小筑这一夜，再沿相邻道路返回悲魔山庄。',
      }),
    quest('e04_quarrel', '厢房争执', 'r_beimo_rose_room', '蔷薇', '走进大厅右厢房，与蔷薇交谈并目送她离开',
      ['evilHutHomecoming'], {evilHutQiangweiLeft: true}, {
        ...evidence('原map030蔷薇对话Event600安排争执及蔷薇向外离去，随后铁云接近；没有此刻的绑架现场或死亡结果'),
        requirementText: '先回庄听铁云说明近况，再进右厢房见蔷薇。',
      }),
    quest('e04_wait', '灯尽待晓', 'r_beimo_hero_room', '杨影枫', '回自己的房间歇下，次日再出门查看',
      ['evilHutQiangweiLeft'], {evilHutReturnMorning: true}, {
        ...evidence('蔷薇离去后的Event610淡出重载仍将她移除，再接次日交谈；网页拆出房内夜过以保留真实回房行动'),
        requirementText: '先结束右厢房的争执，再回自己的房间。',
      }),
    quest('e04_report', '庄中来讯', 'm49', '铁云', '次日回到大厅，安排铁云寻人并听真儿带来的消息',
      ['evilHutReturnMorning'], {evilHutReportHeard: true}, {
        ...evidence('铁云往外寻找并返回后真儿入场；影枫跑近，真儿传讯后离去，才更新赴摘星楼救援目标'),
        rewards: {companion: null, flags: {evilHutReportHeard: true}},
        requirementText: '先回房歇过这一夜，再到大厅询问蔷薇是否回来。',
      }),
  ]},
];
