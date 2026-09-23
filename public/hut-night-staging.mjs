/** Independent staging from the bounded early-evil mechanism record.
 * Dialogue, coordinates and timing are original web presentation. Dream and
 * cutaway actors never become real-world companions, victims or battle loot.
 */
const forgiven = step => ({...step, when: {flag: 'evilHutForgiven'}});
const refused = step => ({...step, when: {flag: 'evilHutRefused'}});
const move = (actor, point, speed = 110) => ({type: 'move', actor, x: point[0], y: point[1], speed});
const face = (actor, target) => ({type: 'face', actor, target});
const pose = (actor, value, duration = .6) => ({type: 'pose', actor, pose: value, duration});
const fade = value => ({type: 'cue', key: 'dreamFade', value});
const say = (focus, lines) => ({type: 'say', focus, lines});
const release = () => ({type: 'release'});
const person = (id, name, sprite, point, extra = {}) => ({id, name, sprite, x: point[0], y: point[1], direction: -1, pose: 'stand', ...extra});
// Original project positions. The new lake dream geometry is verified by the
// scene owner against the completed painting before final integration.
const P = {
  hut: {hero: [760,650], zixuan: [930,575], close: [900,620], pause: [820,735], exit: [760,875], rest: [620,450], wake: [690,535]},
  dream: {entry: [750,740], zixuan: [920,520], near: [820,620], zhenEntry: [1120,550], zhenNear: [1020,590], zhenExit: [1180,480], searchOne: [650,650], searchTwo: [1030,650], searchThree: [850,450], zhuoEntry: [1100,470], zhuoNear: [1050,580], zixuanNear: [945,560], strike: [940,675]},
  shore: {hero: [945,735], zhen: [1055,720], leave: [1170,710], far: [1210,700]},
  tower: {nalan: [950,480], nalanNear: [930,520], meng: [620,650], mengNear: [780,620], disciple: [1100,690], report: [1020,575], aside: [1070,650]},
};
const realZixuan = (point = P.hut.zixuan, extra = {}) => person('hut-real-zixuan', '紫轩', 2, point, extra);
const shoreZhen = (hidden = false, point = P.shore.zhen) => person('shore-zhen', '纳兰真', 1, point, {hidden, sceneKey: null});
const dreamActors = () => [
  person('hut-dream-zixuan-f', '紫轩', 2, P.dream.zixuan, {hidden: true, pose: 'sit', groundSeated: true, sceneKey: 'hutForgivenessDream'}),
  person('hut-dream-zhen', '纳兰真', 1, P.dream.zhenEntry, {hidden: true, sceneKey: 'hutForgivenessDream'}),
  person('hut-dream-zixuan-r', '紫轩', 2, P.dream.zixuan, {hidden: true, pose: 'sit', groundSeated: true, sceneKey: 'hutRefusalDream'}),
  person('hut-dream-zhuo', '卓非凡', 0, P.dream.zhuoEntry, {hidden: true, npcCell: 5, sceneKey: 'hutRefusalDream'}),
];
const towerActors = () => [
  person('first-tower-nalan', '纳兰潜凛', 3, P.tower.nalan, {hidden: true, npcCell: 3, sceneKey: 'towerFirstInterlude'}),
  person('first-tower-meng', '孟知秋', 3, P.tower.meng, {hidden: true, npcCell: 3, sceneKey: 'towerFirstInterlude'}),
  person('first-tower-disciple', '无忧教徒', 0, P.tower.disciple, {hidden: true, npcCell: 5, sceneKey: 'towerFirstInterlude'}),
];
const enterDream = (key, zixuan) => [
  {type: 'scene', scene: key, hero: {x: P.dream.entry[0], y: P.dream.entry[1], direction: 1}},
  {type: 'show', actor: zixuan}, fade('in'), {type: 'wait', duration: .8},
  say('hero', [['杨影枫', '怎么又到了这里？', 0]]),
  move('hero', P.dream.near, 150), face('hero', zixuan),
  say(zixuan, [['紫轩', '你来了。', 2], ['杨影枫', '紫轩，你方才不是已经走了吗？', 0]]),
  pose(zixuan, 'stand', .8), face(zixuan, 'hero'), {type: 'wait', duration: .9},
];

export const HUT_NIGHT_STAGING = {
  e04_departure: {
    map: 'm16', auto: true, label: '目送紫轩离去', startPoint: {x: P.hut.hero[0], y: P.hut.hero[1]},
    actors: [realZixuan()], props: [], finalActors: [realZixuan(P.hut.exit, {hidden: true})], finalCues: {},
    steps: [
      move('hero', P.hut.hero), face('hero', 'hut-real-zixuan'), face('hut-real-zixuan', 'hero'),
      ...[
        say('hero', [['杨影枫', '旧事我还记着，但我愿意放下这一次怨。', 0], ['紫轩', '你肯这样说，我已经知足。', 2]]),
        move('hut-real-zixuan', P.hut.close, 85), face('hut-real-zixuan', 'hero'), {type: 'wait', duration: 1.1},
        say('hut-real-zixuan', [['紫轩', '我该走了。往后的路，你自己珍重。', 2], ['杨影枫', '你也保重。', 0]]),
        move('hut-real-zixuan', P.hut.pause, 95), {type: 'wait', duration: .6},
      ].map(forgiven),
      ...[
        say('hero', [['杨影枫', '我还不能当作那些事没有发生。此刻答应原谅，只会骗了你。', 0], ['紫轩', '我明白。你不必勉强自己。', 2]]),
        {type: 'wait', duration: .7},
        say('hut-real-zixuan', [['紫轩', '那就到这里吧。', 2]]),
      ].map(refused),
      move('hut-real-zixuan', P.hut.exit, 105), {type: 'hide', actor: 'hut-real-zixuan'},
      move('hero', P.hut.rest, 90),
      say('hero', [['杨影枫', '屋里忽然静了。先在这里歇一夜，天亮再走。', 0]]), release(),
    ],
  },
  e04_dream: {
    map: 'm16', auto: true, label: '在小筑歇下', startPoint: {x: P.hut.rest[0], y: P.hut.rest[1]},
    sceneKeys: ['hutForgivenessDream', 'hutRefusalDream'], returnToOrigin: true,
    actors: dreamActors(), props: [], finalActors: [], finalCues: {hutTime: 'morning', dreamFade: 'in'},
    steps: [
      move('hero', P.hut.rest, 95), pose('hero', 'sit', .9),
      {type: 'cue', key: 'hutTime', value: 'sleep'}, {type: 'wait', duration: 1},
      fade('out'), {type: 'wait', duration: .8},
      ...[
        ...enterDream('hutForgivenessDream', 'hut-dream-zixuan-f'),
        {type: 'show', actor: 'hut-dream-zhen'}, move('hut-dream-zhen', P.dream.zhenNear, 100),
        face('hero', 'hut-dream-zhen'),
        say('hut-dream-zhen', [['纳兰真', '杨大哥。', 1], ['杨影枫', '真儿？你怎么也在这里？', 0]]),
        move('hut-dream-zhen', P.dream.zhenExit, 100), {type: 'wait', duration: .6}, {type: 'hide', actor: 'hut-dream-zhen'},
        say('hero', [['杨影枫', '真儿，等等！', 0]]), move('hero', P.dream.zhenNear, 165), move('hero', P.dream.zhenExit, 170),
        face('hero', 'hut-dream-zixuan-f'), say('hero', [['杨影枫', '紫轩，你看见她往哪边去了吗？', 0]]),
        say('hut-dream-zixuan-f', [['紫轩', '影枫……', 2]]), {type: 'wait', duration: .8}, {type: 'hide', actor: 'hut-dream-zixuan-f'},
        move('hero', P.dream.near, 160), say('hero', [['杨影枫', '怎么连你也不见了？', 0]]),
        move('hero', P.dream.searchOne, 175), move('hero', P.dream.searchTwo, 165), move('hero', P.dream.searchThree, 165),
        {type: 'wait', duration: .8}, fade('out'), {type: 'wait', duration: .8},
      ].map(forgiven),
      ...[
        ...enterDream('hutRefusalDream', 'hut-dream-zixuan-r'),
        {type: 'show', actor: 'hut-dream-zhuo'}, move('hut-dream-zhuo', P.dream.zhuoNear, 100),
        face('hut-dream-zixuan-r', 'hut-dream-zhuo'), face('hero', 'hut-dream-zhuo'),
        say('hero', [['杨影枫', '卓非凡？', 0], ['卓非凡', '影枫。', 0]]),
        face('hut-dream-zhuo', 'hero'),
        move('hut-dream-zixuan-r', P.dream.zixuanNear, 90), face('hut-dream-zixuan-r', 'hut-dream-zhuo'),
        {type: 'wait', duration: .9}, say('hero', [['杨影枫', '站住！', 0]]), move('hero', P.dream.strike, 180),
        {type: 'strike', actor: 'hero', target: 'hut-dream-zhuo', duration: .6},
        {type: 'wait', duration: .8}, fade('out'), {type: 'wait', duration: .8},
        {type: 'hide', actor: 'hut-dream-zhuo'}, {type: 'hide', actor: 'hut-dream-zixuan-r'},
      ].map(refused),
      {type: 'scene', scene: null, hero: {restore: true}},
      {type: 'cue', key: 'hutTime', value: 'morning'}, pose('hero', 'sit', .6),
      fade('in'), {type: 'wait', duration: .8},
      say('hero', [['杨影枫', '原来只是梦……', 0], ['江湖纪事', '屋内已经没有紫轩的身影，影枫独自醒来。', 0]]),
      pose('hero', 'stand', .7), move('hero', P.hut.wake, 90),
      say('hero', [['杨影枫', '天亮了，该回去了。', 0]]), release(),
    ],
  },
  e06_first_interlude: {
    map: 'm34', label: '在海边歇息', startPoint: {x: P.shore.hero[0], y: P.shore.hero[1]},
    sceneKeys: ['towerFirstInterlude'], returnToOrigin: true, finalHeroPose: 'sit',
    actors: [shoreZhen(), ...towerActors()], props: [],
    finalActors: [shoreZhen(true)], finalCues: {shoreRest: 'asleep', dreamFade: 'in'},
    steps: [
      move('hero', P.shore.hero, 105), face('hero', 'shore-zhen'), face('shore-zhen', 'hero'),
      say('hero', [['杨影枫', '到岛上了。一路奔波，我想在这里坐一会儿。', 0], ['纳兰真', '你先歇着。', 1]]),
      pose('hero', 'sit', .8), {type: 'cue', key: 'shoreRest', value: 'asleep'},
      fade('out'), {type: 'wait', duration: .8}, {type: 'hide', actor: 'shore-zhen'},
      {type: 'scene', scene: 'towerFirstInterlude'},
      {type: 'show', actor: 'first-tower-nalan'}, {type: 'show', actor: 'first-tower-meng'}, {type: 'show', actor: 'first-tower-disciple'},
      fade('in'), {type: 'wait', duration: .8},
      say('first-tower-nalan', [['江湖纪事', '此时，摘星楼中传来急促的脚步声。', 0]]),
      move('first-tower-disciple', P.tower.report, 140), face('first-tower-disciple', 'first-tower-nalan'),
      say('first-tower-disciple', [['无忧教徒', '教主，孟知秋已经闯到楼前！', 0], ['纳兰潜凛', '让开，我来会他。', 3]]),
      move('first-tower-disciple', P.tower.aside, 115), move('first-tower-nalan', P.tower.nalanNear, 100),
      face('first-tower-nalan', 'first-tower-meng'), face('first-tower-meng', 'first-tower-nalan'),
      say('first-tower-nalan', [['纳兰潜凛', '既然到了，就近前说话。', 3], ['孟知秋', '你我今日须有个交代。', 3]]),
      move('first-tower-meng', P.tower.mengNear, 120),
      {type: 'strike', actor: 'first-tower-nalan', target: 'first-tower-meng', duration: .65}, {type: 'wait', duration: .35},
      {type: 'strike', actor: 'first-tower-meng', target: 'first-tower-nalan', duration: .65}, {type: 'wait', duration: .8},
      fade('out'), {type: 'wait', duration: .8},
      {type: 'hide', actor: 'first-tower-disciple'}, {type: 'hide', actor: 'first-tower-nalan'}, {type: 'hide', actor: 'first-tower-meng'},
      {type: 'scene', scene: null, hero: {restore: true}}, pose('hero', 'sit', .6),
      fade('in'), {type: 'wait', duration: .8}, release(),
    ],
  },
  e06_rest: {
    map: 'm34', auto: true, label: '从海边休息中醒来', startPoint: {x: P.shore.hero[0], y: P.shore.hero[1]},
    actors: [shoreZhen(true)], props: [], finalActors: [shoreZhen(true, P.shore.far)], finalCues: {shoreRest: 'awake'},
    steps: [
      pose('hero', 'sit', .6), {type: 'cue', key: 'shoreRest', value: 'asleep'}, {type: 'wait', duration: 1.1},
      {type: 'show', actor: 'shore-zhen'}, move('shore-zhen', P.shore.leave, 90), move('shore-zhen', P.shore.far, 90),
      {type: 'wait', duration: .7}, {type: 'cue', key: 'shoreRest', value: 'awake'}, pose('hero', 'stand', .7),
      {type: 'hide', actor: 'shore-zhen'}, {type: 'face', actor: 'hero', direction: 1},
      say('hero', [['杨影枫', '真儿？……已经不在这里了。先去村里看看。', 0]]), release(),
    ],
  },
};
