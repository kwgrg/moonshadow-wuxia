// Independent task data derived from the bounded reference audit.
// All dialogue, battle attributes and web state contracts are newly authored.
const sources = ['https://vv0817.neocities.org/gametxt/15_jxqysp', 'https://www.nbegame.com/post/11646.html'];
const evidence = detail => ({
  sources: [...sources],
  source: '依据2026-09-22已完成的只读静态核验及攻略交叉对照：' + detail + '。定位与未知项目见 docs/evil-docks-reference.md；实现取舍见 docs/evil-docks-staging.md。未引入原脚本、原对白或原素材。',
  revised: true,
  dialogueStatus: 'independently-authored-from-verified-mechanics',
  referencePolicy: 'reference-only-no-original-content',
});
const stageQuest = (id, title, map, npc, objective, requiredFlags, rewards, extra = {}) => ({
  id, title, map, npc, sprite: npc === '月眉儿' ? 2 : 0,
  objective, type: 'talk', act: '卷八 · 霸业歧途', when: {route: 'evil'},
  requireStaging: true, hideCompanion: false, xp: 0, money: 0,
  requiredFlags, rewards, before: [['江湖纪事', objective + '。', 0]], after: [],
  requirementText: '先完成眼前的交涉与行程，再继续向渡口走。',
  ...extra,
});
// The multiplicity and names are reference facts. Health, tier and appearance
// are web balance choices; exact authored positions come from the scene layout.
const islandEnemies = [
  ...Array.from({length: 35}, (_, index) => ({
    id: `island-bandit-${String(index + 1).padStart(2, '0')}`,
    name: '强盗', hp: 155, tier: 8, npcCell: 6, sprite: 3, role: 'sword',
  })),
  {id: 'island-bandit-chief', name: '强盗头目', boss: true, hp: 1050, tier: 12, npcCell: 6, sprite: 3, role: 'sword'},
];
const islandAllies = [
  {id: 'island-mei', name: '月眉儿', boss: true, hp: 4400, tier: 12, npcCell: null, sprite: 2, role: 'sword'},
];
const zixuanExclusive = ['evilZixuanRefuse', 'evilZixuanKill'];

export const EVIL_DOCKS_REVISIONS = {
  e07: {
    ...evidence('密室接受后月眉儿跟随，恢复生命、内力、体力，沿禁地各层返回；招揽拒绝次数与失败规则保持现有已核实现'),
    xp: 0, money: 0,
    rewards: {companion: '月眉儿', recover: true, flags: {evilRecruitAccepted: true}},
  },
  e08: {
    ...evidence('紫轩在中原码头登陆后出现并当面报告；杀与不杀都导致她死亡，选择只决定接下来的固定结果演出'),
    title: '中原渡头', map: 'r_mainland_dock', npc: '月眉儿', sprite: 2,
    choiceSpeaker: '月眉儿', choiceSprite: 2,
    objective: '登陆后听紫轩的提醒，回应月眉儿要求你动手的逼迫',
    type: 'choice', requireStaging: true, hideCompanion: false,
    xp: 0, money: 0, rewards: {},
    requiredAnyFlags: [['evilIslandFarewell', 'evilLegacyIslandPassage']],
    legacyStagingFlag: 'evilLegacyDocksPrelude',
    requirementText: '先在忘忧岛渡口辞别众人，再乘船到中原码头。',
    before: [['江湖纪事', '船已靠岸。影枫与月眉儿走上中原的渡头。', 0]],
    after: [],
    choice: {
      prompt: '紫轩说真儿被月眉儿带走，月眉儿却要你向紫轩出手。你如何答复？',
      options: [
        {text: '不肯动手', effects: {evil: -3, flags: {evilZixuanDecision: true, evilZixuanRefuse: true, evilZixuanKill: false}}, after: []},
        {text: '答应月眉儿', effects: {evil: 3, flags: {evilZixuanDecision: true, evilZixuanKill: true, evilZixuanRefuse: false}}, after: []},
      ],
    },
  },
  // The manor's expanded report and night itinerary are a subsequent stage of
  // the same goal. This patch adds only the necessary predecessor guard.
  e09: {
    requiredAnyFlags: [['evilZixuanDead', 'evilLegacyZixuanOutcome']],
    requirementText: '先处理码头上尚未结束的事情，再回悲魔山庄。',
  },
};

export const EVIL_DOCKS_ADDITIONS = [
  {beforeId: 'e08', quests: [
    stageQuest('e08_interlude', '楼中再战', 'r_forbidden_path', '江湖纪事', '沿禁地各层退回山路',
      ['evilRecruitAccepted'], {flags: {evilTowerInterludeComplete: true}}, {
        ...evidence('禁地返回途中切到摘星楼第二次交锋；主角与月眉儿隐藏，叙事结果为孟知秋胜、纳兰倒下，随后恢复二人在山路的位置'),
        before: [['江湖纪事', '禁地外的风声渐近，二人循原路向岛上走去。', 0]],
        after: [['江湖纪事', '摘星楼中的交锋已有结果。影枫与月眉儿仍在返回村落的路上。', 0]],
      }),
    stageQuest('e08_island_battle', '村中解围', 'r_island_village', '月眉儿', '听取居民求援，与月眉儿击退全部来犯者',
      ['evilTowerInterludeComplete'], {companion: '月眉儿', recover: true, flags: {evilIslandCleared: true}}, {
        ...evidence('于大婶与王妈求援后撤离；35名强盗和1名强盗头目全部清除才转往码头，之后恢复三项状态'),
        type: 'battle', count: 1, enemy: '强盗', boss: null, friendly: false, scriptedLoss: false,
        suppressBattleSupplies: true,
        skirmish: {enemies: islandEnemies, allies: islandAllies, criticalAllyIds: ['island-mei']},
        before: [['江湖纪事', '村内传来奔走呼救声。先护住来路，再查清前面发生了什么。', 0]],
        after: [['月眉儿', '来犯的人已经退尽。去渡口吧，村里的人还在那里等消息。', 2]],
      }),
    stageQuest('e08_departure', '岛岸送别', 'm40', '月眉儿', '到忘忧岛码头辞别众人，再向船边走去',
      ['evilIslandCleared'], {flags: {evilIslandFarewell: true}}, {
        ...evidence('岛战之后由荆十娘、于大婶、福婆婆、小冬瓜、渔夫窦昊送别，随后两人登船转中原码头；未见收费或船票条件'),
        before: [['江湖纪事', '潮水拍着渡口。村里的人已经等在岸边。', 0]],
        after: [['江湖纪事', '众人送别已毕，通往中原的船等候二人登上栈桥。', 0]],
      }),
  ]},
  {beforeId: 'e09', quests: [
    stageQuest('e08_refuse', '不肯举剑', 'r_mainland_dock', '紫轩', '面对拒绝动手之后的骤变',
      ['evilZixuanDecision', 'evilZixuanRefuse'], {companion: '月眉儿', flags: {evilZixuanDead: true}}, {
        ...evidence('拒绝亲手杀害后仍出现紫轩倒地结果；月眉儿施害由上下文和攻略支持，具体出剑动作为网页独立编排'),
        sprite: 2, when: {route: 'evil', flag: 'evilZixuanRefuse'}, exclusiveFlags: zixuanExclusive,
        before: [['杨影枫', '我不会向她动手。真儿的事还没有问清楚。', 0]],
        after: [['江湖纪事', '紫轩倒在渡头。影枫未能挽回这一结果，月眉儿催他返回山庄。', 0]],
      }),
    stageQuest('e08_kill', '渡头举剑', 'r_mainland_dock', '紫轩', '承受亲手出剑的后果',
      ['evilZixuanDecision', 'evilZixuanKill'], {companion: '月眉儿', flags: {evilZixuanDead: true}}, {
        ...evidence('选择亲手杀害后主角明确攻击紫轩，随后出现倒地结果；不构成普通战斗或掉落事件'),
        sprite: 2, when: {route: 'evil', flag: 'evilZixuanKill'}, exclusiveFlags: zixuanExclusive,
        before: [['江湖纪事', '影枫握紧剑柄，转向面前的紫轩。', 0]],
        after: [['江湖纪事', '影枫亲手向紫轩出剑。她留在渡头，月眉儿与他继续回庄。', 0]],
      }),
  ]},
];
