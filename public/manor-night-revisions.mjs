// Independent web staging contracts based only on the existing bounded audit.
// No original script, dialogue, image or map content is embedded here.
const evidence = detail => ({
  sources: ['https://vv0817.neocities.org/gametxt/15_jxqysp', 'https://www.nbegame.com/post/11646.html'],
  source: '依据docs/evil-docks-reference.md已记录的只读核验：' + detail + '。本模块只读取现有概述，未再次访问原目录；对白、布局、动作时长和保存事务为独立网页实现。',
  revised: true,
  dialogueStatus: 'independently-authored-from-recorded-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const branchFlags = ['evilMeiEscorted', 'evilMeiAlone'];
const quest = (id, title, map, npc, objective, requiredFlags, rewards, extra = {}) => ({
  id, title, map, npc, sprite: npc === '月眉儿' ? 2 : 0,
  objective, type: 'talk', act: '卷八 · 霸业歧途', when: {route: 'evil'},
  requireStaging: true, hideCompanion: true, sceneLight: 'night', xp: 0, money: 0,
  requiredFlags, rewards, before: [['江湖纪事', '庄内灯火未熄，脚步声沿着回廊传来。', 0]], after: [],
  requirementText: '先完成眼前的交谈与行程，再继续这一夜的事情。',
  ...extra,
});

export const MANOR_NIGHT_REVISIONS = {
  e09: {
    ...evidence('铁云报告与主角首次入睡醒来在先；园中接近、同行并商量计划后，才给送她回房或独自回房的共同选择'),
    title: '园中密议', map: 'm50', npc: '月眉儿', sprite: 2,
    objective: '走进后园，与月眉儿商量往后的行动，再决定是否送她回房',
    type: 'choice', requireStaging: true, hideCompanion: true, sceneLight: 'night',
    choiceSpeaker: '月眉儿', choiceSprite: 2, xp: 0, money: 0, rewards: {},
    requiredFlags: [],
    requiredAnyFlags: [['evilManorFirstWoke', 'evilLegacyManorPrelude']],
    legacyStagingFlag: 'evilLegacyManorPrelude',
    requirementText: '先听完铁云的消息，回自己的房间歇下，再在醒后出门。',
    before: [['江湖纪事', '影枫推门走入夜色，园中另一道身影正转过回廊。', 0]],
    after: [],
    choice: {
      prompt: '园中话已说完，月眉儿准备回房。你如何答复？',
      options: [
        {text: '送她回房', effects: {evil: 2, affection: {mei: 1}, companion: '月眉儿', flags: {evilManorDecision: true, evilMeiEscorted: true, evilMeiAlone: false}}, after: []},
        {text: '独自回房', effects: {evil: -1, companion: null, flags: {evilManorDecision: true, evilMeiEscorted: false, evilMeiAlone: true}}, after: []},
      ],
    },
  },
  e10_teaching: {
    requiredAnyFlags: [['evilManorNightComplete', 'evilLegacyManorNight']],
    requirementText: '先走完山庄这一夜的交谈，在次日辞别月眉儿后独自前往落叶谷。',
  },
};

export const MANOR_NIGHT_ADDITIONS = [
  {beforeId: 'e09', quests: [
    quest('e09_report', '回庄闻讯', 'm49', '铁云', '回到悲魔山庄，听铁云转述摘星楼与落叶谷的消息',
      [], {companion: null, flags: {evilManorReported: true, evilManorNightStarted: true}}, {
        ...evidence('Event3100铁云走近并报告：摘星楼已破、纳兰死亡；孟知秋携回蔷薇遗体、以为影枫也已遇难，随后回到落叶谷；铁云谈毕离开'),
        sceneLight: null, hideCompanion: false,
        requiredAnyFlags: [['evilZixuanDead', 'evilLegacyZixuanOutcome']],
        requirementText: '先结束中原码头的变故，再沿陆路回到山庄。',
        before: [['江湖纪事', '影枫与月眉儿回到庄内，铁云闻声赶来。', 0]],
      }),
    quest('e09_first_wake', '灯尽初醒', 'r_beimo_hero_room', '杨影枫', '回自己的房间入睡，醒来后走向通往后园的房门',
      ['evilManorReported'], {flags: {evilManorFirstWoke: true}}, {
        ...evidence('报告后转入夜间；主角先入睡，再醒来出房，随后才触发园中相遇'),
        before: [['江湖纪事', '客房的灯渐暗，白日听来的消息却仍在心头。', 0]],
      }),
  ]},
  {beforeId: 'e10_teaching', quests: [
    quest('e09_part', '园中暂别', 'm50', '月眉儿', '目送月眉儿自行回房，再返回自己的住处',
      ['evilManorDecision', 'evilMeiAlone'], {companion: null, flags: {evilMeiParted: true}}, {
        ...evidence('不送房的答复之后月眉儿先离开，主角随后回房；不会在答复时直接跳到天亮'),
        when: {route: 'evil', flag: 'evilMeiAlone'}, exclusiveFlags: branchFlags,
        before: [['月眉儿', '那便各自回去吧。今夜的话，你再想一想。', 2]],
      }),
    quest('e09_sleepless', '辗转难眠', 'r_beimo_hero_room', '杨影枫', '回房歇下，难以入睡时再起身出门',
      ['evilMeiAlone', 'evilMeiParted'], {flags: {evilManorRestless: true}}, {
        ...evidence('独自回房支路保留再次入睡、心绪不宁和第二次起身外出，不凭选择直接合流'),
        when: {route: 'evil', flag: 'evilMeiAlone'}, exclusiveFlags: branchFlags,
        before: [['江湖纪事', '影枫回到房中，门外的风声隔着窗纸传来。', 0]],
      }),
    quest('e09_second_meeting', '重逢回廊', 'm50', '月眉儿', '第二次出门，在后园重逢月眉儿并同往她的房间',
      ['evilMeiAlone', 'evilManorRestless'], {companion: '月眉儿', flags: {evilMeiSecondMet: true}}, {
        ...evidence('不送房支路在第二次外出后重遇月眉儿，再有交谈和移动；攻略将后续解释为入室秉烛夜谈'),
        when: {route: 'evil', flag: 'evilMeiAlone'}, exclusiveFlags: branchFlags,
        before: [['江湖纪事', '影枫再度走入园中，方才分开的身影仍在回廊尽头。', 0]],
      }),
    quest('e09_room_talk', '烛下长谈', 'r_beimo_mei_room', '月眉儿', '与月眉儿在房中继续交谈，度过这一夜余下的时辰',
      ['evilManorDecision'], {flags: {evilManorRoomTalk: true}}, {
        ...evidence('送房支有同行入室、对话、继续移动和时间过渡；不送支在第二次相逢后另有夜谈。两支不得串接播放或新增奖励'),
        hideCompanion: false, exclusiveFlags: branchFlags,
        requiredAnyFlags: [['evilMeiEscorted', 'evilMeiSecondMet']],
        requirementText: '送她回房，或先完成独自回房后的第二次出门与重逢，再来继续交谈。',
        before: [['江湖纪事', '房中只留一盏烛火，门外的脚步声终于静下来。', 0]],
      }),
    quest('e09_morning', '薄明辞行', 'm50', '月眉儿', '天亮后在后园辞别月眉儿，独自准备前往落叶谷',
      ['evilManorRoomTalk'], {companion: null, flags: {evilMeiStaysAtManor: true, evilManorNightComplete: true}}, {
        ...evidence('翌日恢复白天；月眉儿留庄成为通常交互人物，主角独自继续下一步。不存在本段物品、武功或金钱奖励'),
        sceneLight: null, exclusiveFlags: branchFlags,
        before: [['江湖纪事', '天边将明，影枫沿着房外的回廊来到后园。', 0]],
      }),
  ]},
];
