// Independently authored data from the recorded good-route walkthrough audit.
// No original game script, dialogue, media, coordinates or numerical model.
const sources = ['https://vv0817.neocities.org/gametxt/15_jxqysp', 'https://www.nbegame.com/post/11647.html'];
const evidence = detail => ({
  sources: [...sources], revised: true,
  source: '2026-09-23 依据详攻略82–85节及NBE正线相应段的已核概述：' + detail + '。对白、动作、房图与状态契约为网页独立创作；未核原版数值、精确动画与发钗奖励，详见docs/valley-care-staging.md。',
  dialogueStatus: 'independently-authored-from-recorded-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const choiceFlags = ['valleyCareRefused', 'valleyCareConsidered'];
const quest = (id, title, map, npc, objective, requiredFlags, flags, detail, extra = {}) => ({
  id, title, map, npc, sprite: ['纳兰真', '蔷薇', '萱儿', '樱儿'].includes(npc) ? 1 : npc === '月眉儿' ? 2 : 0,
  type: 'talk', act: '卷七 · 侠路寻心', when: {route: 'good'},
  objective, requiredFlags, requireStaging: true, hideCompanion: true,
  exclusiveFlags: choiceFlags, ...(id.startsWith('g07') ? {exclusiveLegacyFlag: 'valleyLegacyCareChoiceUnknown'} : {}), xp: 0, money: 0,
  rewards: {flags}, before: [], after: [],
  requirementText: '先完成眼前的照料和交谈，再去下一处。',
  ...evidence(detail), ...extra,
});
export const VALLEY_CARE_REVISIONS = {
  g06: {
    ...evidence('孟知秋以婚事为条件，拒绝与考虑两答复均获一天时间；此时婚约未成立，之后都须逐步求助'),
    title: '救人与婚约', map: 'm51', npc: '孟知秋', sprite: 3,
    objective: '听孟知秋提出救治条件，决定如何答复', type: 'choice',
    requireStaging: true, hideCompanion: true, choiceSpeaker: '孟知秋', choiceSprite: 3,
    legacyStagingFlag: 'valleyLegacyCareProposal',
    xp: 0, money: 0, rewards: {}, after: [],
    before: [['江湖纪事', '伤者已在谷中安顿，影枫前来向孟知秋求助。', 0]],
    choice: {
      prompt: '孟知秋将救治与婚事相提并论，给你一天时间考虑。你如何回应？',
      options: [
        {text: '拒绝以婚换治', effects: {companion: null, flags: {valleyCareStarted: true, valleyCareRefused: true, valleyCareConsidered: false}}, after: []},
        {text: '考虑', effects: {companion: null, flags: {valleyCareStarted: true, valleyCareConsidered: true, valleyCareRefused: false}}, after: []},
      ],
    },
  },
  g07: quest('g07', '月下道谢', 'r_leaf_rose_room', '蔷薇', '夜里到蔷薇房中，向她当面道谢',
    [], {valleyThanks: true}, '影枫入夜后去蔷薇房中道谢；没有主角亲眼目睹运功的已核依据，也不提前给出痊愈结论', {sceneLight: 'night', requiredAnyFlags: [['valleyCareNight', 'valleyLegacyCarePrelude']]}),
  g08: {
    requiredAnyFlags: [['valleyCareSettled', 'valleyLegacyCare']],
    requirementText: '先把真儿与眉儿送到忘忧岛海边小屋安置，再独自采集十二株银丝草。',
  },
};
export const VALLEY_CARE_ADDITIONS = [
  {beforeId: 'g07', quests: [
    quest('g06_confide', '隔壁商量', 'r_leaf_zhen_room', '纳兰真', '到隔壁见真儿，说清孟知秋的条件与自己的答复',
      ['valleyCareStarted'], {valleyZhenHeard: true}, '两种答复后都到真儿房中商量，真儿说明自己曾被月眉儿救出'),
    quest('g06_inquire', '问讯侍女', 'r_leaf_rose_room', '萱儿', '到蔷薇房中，向萱儿询问她的去向',
      ['valleyZhenHeard'], {valleyRoseLocation: true}, '蔷薇不在房内，由侍女萱儿告知她在天池'),
    quest('g06_request', '天池求助', 'm52', '蔷薇', '到天池找到蔷薇，请她劝父亲先救人',
      ['valleyRoseLocation'], {valleyRoseAsked: true}, '影枫到天池求助，蔷薇听后先行返回落叶谷；不在湖边就宣告父亲答应'),
    quest('g06_return', '父女说情', 'm51', '孟知秋', '返回谷中，听蔷薇向孟知秋说情',
      ['valleyRoseAsked'], {valleyTreatmentAgreed: true}, '父女说情后孟知秋答应今夜救治；不要求影枫先承认婚约', {rewards: {companion: '蔷薇', flags: {valleyTreatmentAgreed: true}}}),
    quest('g06_introduce', '引见真儿', 'r_leaf_zhen_room', '纳兰真', '带蔷薇到真儿房中，转告今晚救治的消息',
      ['valleyTreatmentAgreed'], {valleyIntroduced: true}, '应允之后带蔷薇见真儿，再回主角自己的房间休息', {hideCompanion: false, rewards: {companion: null, flags: {valleyIntroduced: true}}}),
    quest('g06_rest', '客房歇息', 'r_leaf_hero_room', '杨影枫', '回自己的房间休息，入夜后起身去向蔷薇道谢',
      ['valleyIntroduced'], {valleyCareNight: true}, '主角休息后入夜，救治过程不以主角亲见的运功画面补写'),
  ]},
  {beforeId: 'g08', quests: [
    quest('g07_dawn', '再宿候明', 'r_leaf_hero_room', '杨影枫', '道谢后回房休息，待天亮再去探问伤情',
      ['valleyThanks'], {valleyCareMorning: true}, '夜谢之后经过夜间时间过渡，翌日才去伤者房间'),
    quest('g07_visit', '晨起问伤', 'r_leaf_mei_room', '樱儿', '到眉儿房中，听樱儿说明救治后的情况',
      ['valleyCareMorning'], {valleyMorningReport: true}, '侍女樱儿告知孟知秋运功后闭关，眉儿伤势已稳定；仍须药草调养'),
    quest('g07_zhen', '再邀真儿', 'r_leaf_zhen_room', '纳兰真', '去见真儿，邀她一起再探眉儿',
      ['valleyMorningReport'], {valleyZhenReady: true}, '听侍女报告后先找真儿，再一起去看已醒来的眉儿', {rewards: {companion: '纳兰真', flags: {valleyZhenReady: true}}}),
    quest('g07_apology', '床前释误', 'r_leaf_mei_room', '月眉儿', '与真儿探望苏醒的眉儿，说明误会并当面致歉',
      ['valleyZhenReady'], {valleyMeiAwake: true}, '影枫向苏醒的月眉儿道歉，真儿与蔷薇也劝说；之后影枫、真儿、眉儿三人返岛，蔷薇留谷', {hideCompanion: false, rewards: {companion: '纳兰真', flags: {valleyMeiAwake: true}}}),
    quest('g07_mainland', '护送登船', 'r_mainland_dock', '纳兰真', '陪真儿与尚需调养的眉儿到中原码头登船',
      ['valleyMeiAwake'], {valleyCareBoarded: true}, '三人从落叶谷返回忘忧岛；网页将大陆登船拆为实际行走任务，不新增原版精确船务对白', {hideCompanion: false}),
    quest('g07_island', '伤者归岛', 'm40', '纳兰真', '抵达忘忧岛渡口，陪眉儿走向海边小屋',
      ['valleyCareBoarded'], {valleyCareLanded: true}, '三人先到忘忧岛，再在海边小屋安置；不是到码头就完成调养', {hideCompanion: false}),
    quest('g07_settle', '海屋安置', 'm33', '纳兰真', '把眉儿安顿在海边小屋，由真儿照料，再准备独自进山采药',
      ['valleyCareLanded'], {valleyCareSettled: true}, '海边小屋安置在十二株银丝草采集之前；此时没有服药成功、玉佩相认或母亲信件奖励', {hideCompanion: false, rewards: {companion: null, flags: {valleyCareSettled: true}}}),
  ]},
];
