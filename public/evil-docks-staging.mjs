/**
 * Independent staging for the evil-route return, island battle and mainland dock.
 * Original game content is not embedded. Evidence and uncertainty are recorded
 * in docs/evil-docks-reference.md and docs/evil-docks-staging.md.
 */
const mei = (x, y, hidden = false, id = 'docks-mei') => ({id, name: '月眉儿', sprite: 2, npcCell: null, x, y, hidden, direction: -1, pose: 'stand'});
const zixuan = (overrides = {}) => ({id: 'mainland-zixuan', name: '紫轩', sprite: 2, x: 900, y: 620, direction: -1, pose: 'stand', ...overrides});
const fallenZixuan = () => zixuan({pose: 'fallen', interactive: false, fallDirection: 1});
const islandYu = (x = 350, y = 470, hidden = false) => ({id: 'villager-yu', name: '于大婶', sprite: 1, x, y, hidden, direction: 1, pose: 'stand'});
const islandWang = (x = 420, y = 485, hidden = false) => ({id: 'villager-wang', name: '王妈', sprite: 1, x, y, hidden, direction: 1, pose: 'stand'});
const chief = (hidden = false) => ({id: 'island-bandit-chief', name: '强盗头目', sprite: 3, npcCell: 6, x: 1260, y: 615, hidden, direction: -1, pose: 'stand', enemy: true});
const residents = () => [
  {id: 'departure-jing', name: '荆十娘', sprite: 1, x: 650, y: 600, direction: 1, pose: 'stand'},
  {id: 'departure-yu', name: '于大婶', sprite: 1, x: 750, y: 560, direction: 1, pose: 'stand'},
  {id: 'departure-fu', name: '福婆婆', sprite: 1, x: 850, y: 570, direction: 1, pose: 'stand'},
  {id: 'departure-dong', name: '小冬瓜', sprite: 0, x: 900, y: 650, direction: 1, pose: 'stand'},
  {id: 'departure-dou', name: '渔夫窦昊', sprite: 0, npcCell: 4, x: 780, y: 690, direction: 1, pose: 'stand'},
];
const towerActors = () => [
  {id: 'tower-meng', name: '孟知秋', sprite: 3, npcCell: 3, x: 620, y: 650, direction: 1, pose: 'stand', hidden: true, sceneKey: 'towerInterlude'},
  {id: 'tower-nalan', name: '纳兰潜凛', sprite: 3, npcCell: 3, x: 950, y: 480, direction: -1, pose: 'stand', hidden: true, sceneKey: 'towerInterlude'},
];
const outcomeScene = steps => ({
  map: 'r_mainland_dock', auto: true, label: '面对渡头的变故',
  actors: [zixuan(), mei(835, 525)], props: [],
  finalActors: [fallenZixuan(), mei(835, 525, true)],
  persistFlag: 'evilZixuanDead', persistentActors: [fallenZixuan()],
  finalCues: {docksOutcome: 'zixuan-fallen'},
  steps,
});

export const EVIL_DOCKS_STAGING = {
  e08_interlude: {
    map: 'r_forbidden_path', auto: true, label: '循山路返回村落',
    sceneKeys: ['towerInterlude'], actors: towerActors(), props: [],
    finalActors: [], finalCues: {towerOutcome: 'nalan-fallen', dreamFade: 'in'},
    steps: [
      {type: 'cue', key: 'dreamFade', value: 'out'},
      {type: 'wait', duration: .8},
      // No hero position is supplied on entry: the runner remembers the real
      // road position; hidePlayer comes from the independent scene definition.
      {type: 'scene', scene: 'towerInterlude'},
      {type: 'show', actor: 'tower-meng'},
      {type: 'show', actor: 'tower-nalan'},
      {type: 'cue', key: 'dreamFade', value: 'in'},
      {type: 'wait', duration: .9},
      {type: 'say', focus: 'tower-meng', lines: [
        ['江湖纪事', '与此同时，摘星楼中，两道身影再次交锋。', 0],
        ['孟知秋', '这场交手，也该有个结果了。', 3],
        ['纳兰潜凛', '那就看谁还能站到最后。', 3],
      ]},
      {type: 'move', actor: 'tower-meng', x: 780, y: 620, speed: 150},
      {type: 'move', actor: 'tower-nalan', x: 930, y: 520, speed: 115},
      {type: 'face', actor: 'tower-meng', target: 'tower-nalan'},
      {type: 'face', actor: 'tower-nalan', target: 'tower-meng'},
      {type: 'strike', actor: 'tower-nalan', target: 'tower-meng', duration: .6},
      {type: 'wait', duration: .3},
      {type: 'strike', actor: 'tower-meng', target: 'tower-nalan', duration: .65},
      {type: 'pose', actor: 'tower-nalan', pose: 'fallen', duration: 1},
      {type: 'cue', key: 'towerOutcome', value: 'nalan-fallen'},
      {type: 'move', actor: 'tower-meng', x: 760, y: 650, speed: 80},
      {type: 'say', focus: 'tower-meng', lines: [
        ['江湖纪事', '纳兰潜凛倒在楼中，没能再起身。山路上的两人仍在向村落走去。', 0],
      ]},
      {type: 'cue', key: 'dreamFade', value: 'out'},
      {type: 'wait', duration: .8},
      {type: 'hide', actor: 'tower-meng'},
      {type: 'hide', actor: 'tower-nalan'},
      {type: 'scene', scene: null, hero: {restore: true}},
      {type: 'cue', key: 'dreamFade', value: 'in'},
      {type: 'wait', duration: .9},
      {type: 'release'},
    ],
  },
  e08_island_battle: {
    map: 'r_island_village', label: '走近求援的居民', startPoint: {x: 400, y: 620},
    actors: [islandYu(), islandWang(), mei(520, 600, false, 'island-mei'), chief()], props: [],
    // The actual battle owns the ally/enemy objects after release. These hidden
    // presentation actors prevent a decorative follower or second chief.
    finalActors: [islandYu(230, 580, true), islandWang(230, 580, true), mei(520, 600, true, 'island-mei'), chief(true)],
    finalCues: {islandCivilians: 'safe', islandConflict: 'ready'},
    steps: [
      {type: 'move', actor: 'hero', x: 400, y: 620, speed: 135},
      {type: 'move', actor: 'villager-yu', x: 450, y: 540, speed: 165},
      {type: 'move', actor: 'villager-wang', x: 545, y: 520, speed: 160},
      {type: 'face', actor: 'hero', target: 'villager-yu'},
      {type: 'face', actor: 'island-mei', target: 'villager-wang'},
      {type: 'say', focus: 'villager-yu', lines: [
        ['于大婶', '前头全是闯进村的人，我们才从巷里逃出来！', 1],
        ['王妈', '他们自称神驼帮，拦着村路不让人过去。', 1],
        ['杨影枫', '你们先退到后面，别再往他们跟前走。', 0],
        ['月眉儿', '沿来时的路退。我与影枫留在这里。', 2],
      ]},
      {type: 'move', actor: 'villager-yu', x: 350, y: 560, speed: 150},
      {type: 'move', actor: 'villager-yu', x: 230, y: 580, speed: 155},
      {type: 'hide', actor: 'villager-yu'},
      {type: 'move', actor: 'villager-wang', x: 350, y: 560, speed: 155},
      {type: 'move', actor: 'villager-wang', x: 230, y: 580, speed: 155},
      {type: 'hide', actor: 'villager-wang'},
      {type: 'cue', key: 'islandCivilians', value: 'safe'},
      {type: 'face', actor: 'hero', target: 'island-bandit-chief'},
      {type: 'face', actor: 'island-mei', target: 'island-bandit-chief'},
      {type: 'say', focus: 'island-bandit-chief', lines: [
        ['强盗头目', '还有人敢挡神驼帮的路？把他们围住！', 3],
        ['杨影枫', '村里的人已经退开。眉儿，留心他们从两侧过来。', 0],
        ['月眉儿', '先稳住脚下，别被人群冲散。', 2],
      ]},
      {type: 'cue', key: 'islandConflict', value: 'ready'},
      {type: 'release'},
    ],
  },
  e08_departure: {
    map: 'm40', label: '向渡口的众人辞行', startPoint: {x: 990, y: 700},
    actors: [...residents(), mei(1030, 610)], props: [],
    finalActors: [...residents(), mei(1095, 680, true)],
    persistFor: ['e08'], persistentActors: residents(), finalCues: {islandFarewell: 'spoken'},
    steps: [
      {type: 'move', actor: 'hero', x: 990, y: 700, speed: 135},
      {type: 'face', actor: 'hero', target: 'departure-jing'},
      {type: 'say', focus: 'departure-jing', lines: [
        ['荆十娘', '村里的路已经稳住。你们若要离岛，就趁这一阵顺风吧。', 1],
        ['于大婶', '方才只顾着逃命，还没来得及向两位道谢。', 1],
        ['杨影枫', '大家能平安回去便好。我们也该动身了。', 0],
      ]},
      {type: 'face', actor: 'hero', target: 'departure-fu'},
      {type: 'say', focus: 'departure-fu', lines: [
        ['福婆婆', '此去路长，记得照顾好自己。', 1],
        ['小冬瓜', '以后还能再见到你们吗？', 0],
        ['杨影枫', '若有机会，我会再来看大家。', 0],
      ]},
      {type: 'face', actor: 'hero', target: 'departure-dou'},
      {type: 'say', focus: 'departure-dou', lines: [
        ['渔夫窦昊', '船已经备妥。往中原的两位，沿栈桥过来吧。', 0],
        ['月眉儿', '我们走吧。各位保重。', 2],
      ]},
      {type: 'cue', key: 'islandFarewell', value: 'spoken'},
      {type: 'move', actor: 'hero', x: 1175, y: 700, speed: 120},
      {type: 'move', actor: 'docks-mei', x: 1095, y: 680, speed: 125},
      {type: 'hide', actor: 'docks-mei'},
      {type: 'release'},
    ],
  },
  e08: {
    map: 'r_mainland_dock', label: '听见渡头的招呼', startPoint: {x: 700, y: 455},
    actors: [mei(815, 495), zixuan({x: 700, y: 865, hidden: true})], props: [],
    finalActors: [mei(835, 525), zixuan()], finalCues: {docksPrelude: 'decision'},
    steps: [
      {type: 'show', actor: 'mainland-zixuan'},
      {type: 'say', focus: 'mainland-zixuan', lines: [
        ['紫轩', '影枫！你总算到岸了。先别走，我有话要告诉你。', 2],
      ]},
      {type: 'move', actor: 'mainland-zixuan', x: 820, y: 730, speed: 160},
      {type: 'move', actor: 'hero', x: 690, y: 570, speed: 120},
      {type: 'move', actor: 'mainland-zixuan', x: 900, y: 620, speed: 150},
      {type: 'move', actor: 'docks-mei', x: 835, y: 525, speed: 100},
      {type: 'face', actor: 'hero', target: 'mainland-zixuan'},
      {type: 'face', actor: 'mainland-zixuan', target: 'hero'},
      {type: 'say', focus: 'mainland-zixuan', lines: [
        ['紫轩', '真儿是被月眉儿带走的。你怎么还跟她走在一起？', 2],
        ['杨影枫', '你说真儿……她现在究竟在哪里？', 0],
      ]},
      {type: 'face', actor: 'docks-mei', target: 'mainland-zixuan'},
      {type: 'face', actor: 'hero', target: 'docks-mei'},
      {type: 'say', focus: 'docks-mei', lines: [
        ['月眉儿', '她说什么，你便信什么？影枫，你不是已经答应与我同行了吗。', 2],
        ['紫轩', '我冒着险来找你，只想让你留心眼前的人。', 2],
        ['月眉儿', '既然已作了选择，就由你来杀她。', 2],
      ]},
      {type: 'cue', key: 'docksPrelude', value: 'decision'},
      {type: 'release'},
    ],
  },
  e08_refuse: outcomeScene([
    {type: 'say', focus: 'hero', lines: [
      ['杨影枫', '我不会向她动手。先把真儿的下落说清楚。', 0],
      ['月眉儿', '你下不了手，就让开。', 2],
    ]},
    {type: 'move', actor: 'docks-mei', x: 825, y: 650, speed: 185},
    {type: 'face', actor: 'docks-mei', target: 'mainland-zixuan'},
    {type: 'strike', actor: 'docks-mei', target: 'mainland-zixuan', duration: .6},
    {type: 'pose', actor: 'mainland-zixuan', pose: 'fallen', duration: .85},
    {type: 'cue', key: 'docksOutcome', value: 'zixuan-fallen'},
    {type: 'wait', duration: .8},
    {type: 'face', actor: 'hero', target: 'mainland-zixuan'},
    {type: 'say', focus: 'mainland-zixuan', lines: [
      ['杨影枫', '紫轩！', 0],
      ['紫轩', '看清你身旁的人……别把真儿也丢下。', 2],
    ]},
    {type: 'move', actor: 'docks-mei', x: 835, y: 525, speed: 105},
    {type: 'say', focus: 'docks-mei', lines: [
      ['月眉儿', '已经没有别的话可说了。回山庄去。', 2],
    ]},
    {type: 'hide', actor: 'docks-mei'},
    {type: 'release'},
  ]),
  e08_kill: outcomeScene([
    {type: 'face', actor: 'hero', target: 'mainland-zixuan'},
    {type: 'say', focus: 'hero', lines: [
      ['杨影枫', '我已经答应与她同行。你不该再拦在这里。', 0],
      ['紫轩', '影枫，你要用剑来回答我吗？', 2],
    ]},
    {type: 'move', actor: 'hero', x: 800, y: 675, speed: 125},
    {type: 'face', actor: 'hero', target: 'mainland-zixuan'},
    {type: 'strike', actor: 'hero', target: 'mainland-zixuan', duration: .65},
    {type: 'pose', actor: 'mainland-zixuan', pose: 'fallen', duration: .85},
    {type: 'cue', key: 'docksOutcome', value: 'zixuan-fallen'},
    {type: 'wait', duration: 1},
    {type: 'say', focus: 'mainland-zixuan', lines: [
      ['紫轩', '我来找你，是要你小心她……', 2],
      ['杨影枫', '紫轩……', 0],
    ]},
    {type: 'move', actor: 'hero', x: 760, y: 700, speed: 70},
    {type: 'face', actor: 'hero', target: 'mainland-zixuan'},
    {type: 'say', focus: 'docks-mei', lines: [
      ['月眉儿', '走吧。山庄里还有事等着我们。', 2],
    ]},
    {type: 'hide', actor: 'docks-mei'},
    {type: 'release'},
  ]),
};
