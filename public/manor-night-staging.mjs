/** Independently authored manor-night choreography, using only recorded facts.
 * Cross-map travel remains the player's real doorway walk. Coordinates and
 * timing are project design, not imported original map/animation data.
 */
const mei = (x, y, hidden = false, id = 'manor-mei') => ({id, name: '月眉儿', sprite: 2, npcCell: null, x, y, hidden, pose: 'stand', direction: -1});
const escorted = step => ({...step, when: {flag: 'evilMeiEscorted'}});
const alone = step => ({...step, when: {flag: 'evilMeiAlone'}});
const fade = value => ({type: 'cue', key: 'dreamFade', value});
// Footpoints follow the new project paintings and the map owner's visual review;
// path reachability is verified independently against the scene masks.
const P = {
  report: {hero: [760, 650], mei: [865, 675], tieEntry: [1030, 495], tieNear: [940, 565], tieExit: [1200, 800], meiExit: [1140, 780]},
  heroRoom: {bedside: [620, 450], awake: [690, 535], exit: [760, 760]},
  garden: {heroEntry: [535, 430], meiEntry: [1080, 500], heroWalk: [690, 640], meiWalk: [860, 590], heroTalk: [780, 680], meiTalk: [915, 610], heroExit: [505, 460], meiExit: [1100, 480], secondHero: [570, 520], secondMei: [1060, 610], resident: [960, 550], morningHero: [805, 645]},
  meiRoom: {heroTalk: [650, 570], meiTalk: [805, 490], heroRest: [845, 585], meiRest: [1040, 500], heroExit: [780, 765]},
};
const move = (actor, point, speed = 115) => ({type: 'move', actor, x: point[0], y: point[1], speed});
const stand = actor => ({type: 'pose', actor, pose: 'stand', duration: .4});
const resident = () => ({
  ...mei(...P.garden.resident, false, 'manor-mei-resident'),
  residentUntilQuest: 'e10', interactive: true,
  dialogue: [
    ['月眉儿', '庄里还有事情要照看，我暂且留在这里。', 2],
    ['月眉儿', '路上的事，你自己多留心。', 2],
  ],
});
const sleepers = ({restless = false} = {}) => [
  move('hero', P.heroRoom.bedside, 100),
  {type: 'pose', actor: 'hero', pose: 'sit', duration: 1.1},
  {type: 'say', focus: 'hero', lines: [
    ['杨影枫', restless ? '回到房里，心里反而更乱。闭上眼，园中的话仍一句句响着。' : '铁云说的话还在耳边。先歇一会，也许能让心静下来。', 0],
  ]},
  fade('out'), {type: 'wait', duration: restless ? 1.8 : 2.1},
  fade('in'), {type: 'wait', duration: .8},
  {type: 'say', focus: 'hero', lines: [
    ['杨影枫', restless ? '终究睡不着。再出去走一走吧。' : '怎么醒了……房里闷得很，出去透一口气。', 0],
  ]},
  stand('hero'), move('hero', P.heroRoom.awake, 90),
  move('hero', P.heroRoom.exit, 110),
  {type: 'release'},
];

export const MANOR_NIGHT_STAGING = {
  e09_report: {
    map: 'm49', label: '听铁云禀报', startPoint: {x: P.report.hero[0], y: P.report.hero[1]},
    actors: [
      {id: 'manor-tieyun', name: '铁云', sprite: 0, npcCell: 5, x: P.report.tieEntry[0], y: P.report.tieEntry[1], pose: 'stand', direction: -1},
      mei(...P.report.mei),
    ], props: [],
    finalActors: [
      {id: 'manor-tieyun', name: '铁云', sprite: 0, npcCell: 5, x: P.report.tieExit[0], y: P.report.tieExit[1], pose: 'stand', hidden: true},
      mei(...P.report.meiExit, true),
    ], finalCues: {},
    steps: [
      move('hero', P.report.hero, 120), move('manor-tieyun', P.report.tieNear, 150),
      {type: 'face', actor: 'hero', target: 'manor-tieyun'},
      {type: 'face', actor: 'manor-mei', target: 'manor-tieyun'},
      {type: 'say', focus: 'manor-tieyun', lines: [
        ['铁云', '庄主，楼里传来消息：摘星楼已被攻破，纳兰潜凛也死在孟知秋手下。', 0],
        ['杨影枫', '孟知秋……后来去了哪里？', 0],
        ['铁云', '他已经携回蔷薇姑娘的遗体。听回报的人说，他一直以为您也遭了不测。', 0],
        ['铁云', '如今孟知秋已经回到落叶谷。属下知道的消息，都在这里了。', 0],
        ['杨影枫', '原来他竟一直这样以为……', 0],
      ]},
      {type: 'face', actor: 'manor-mei', target: 'hero'},
      {type: 'say', focus: 'manor-mei', lines: [
        ['月眉儿', '今日先歇下吧。往后的事，等心绪定了再谈。', 2],
        ['铁云', '属下告退。', 0],
      ]},
      move('manor-tieyun', P.report.tieExit, 140), {type: 'hide', actor: 'manor-tieyun'},
      move('manor-mei', P.report.meiExit, 110), {type: 'hide', actor: 'manor-mei'},
      {type: 'say', focus: 'hero', lines: [['江湖纪事', '铁云的脚步声远去，影枫独自走向住处。', 0]]},
      {type: 'release'},
    ],
  },
  e09_first_wake: {
    map: 'r_beimo_hero_room', label: '在自己的房中歇下',
    actors: [], props: [], finalActors: [], finalCues: {dreamFade: 'in'}, steps: sleepers(),
  },
  e09: {
    map: 'm50', label: '走近园中的月眉儿', startPoint: {x: P.garden.heroEntry[0], y: P.garden.heroEntry[1]},
    actors: [mei(...P.garden.meiEntry, true)], props: [],
    finalActors: [mei(...P.garden.meiTalk)], finalCues: {},
    steps: [
      move('hero', P.garden.heroEntry, 115), {type: 'show', actor: 'manor-mei'},
      {type: 'say', focus: 'manor-mei', lines: [
        ['月眉儿', '你也醒着？我见园里有灯，就出来走走。', 2],
        ['杨影枫', '铁云的消息，叫人怎么睡得安稳。', 0],
        ['月眉儿', '往园里走几步吧，有些话正好说清楚。', 2],
      ]},
      move('manor-mei', P.garden.meiWalk, 105), move('hero', P.garden.heroWalk, 110),
      move('manor-mei', P.garden.meiTalk, 105), move('hero', P.garden.heroTalk, 110),
      {type: 'face', actor: 'hero', target: 'manor-mei'}, {type: 'face', actor: 'manor-mei', target: 'hero'},
      {type: 'say', focus: 'manor-mei', lines: [
        ['月眉儿', '纳兰已死，接下来不能放任孟知秋把一切握在手里。落叶谷须早作安排。', 2],
        ['杨影枫', '他仍把我当作蔷薇的丈夫，也以为我已死。若我现在回去，他也许不会防我。', 0],
        ['月眉儿', '你先以旧日情分入谷，别让他看出我们另有打算。我留在庄中，后续再作接应。', 2],
        ['杨影枫', '借他的信任走近他……我明白你的意思。', 0],
      ]},
      {type: 'wait', duration: 1.4},
      {type: 'say', focus: 'manor-mei', lines: [
        ['江湖纪事', '二人在园中谈了许久，灯影随风渐渐倾斜。', 0],
        ['月眉儿', '时辰不早，我该回房了。', 2],
      ]},
      {type: 'release'},
    ],
  },
  e09_part: {
    map: 'm50', auto: true, label: '在园中与月眉儿暂别',
    actors: [mei(...P.garden.meiTalk)], props: [], finalActors: [mei(...P.garden.meiExit, true)], finalCues: {},
    steps: [
      {type: 'face', actor: 'hero', target: 'manor-mei'},
      {type: 'say', focus: 'hero', lines: [
        ['杨影枫', '我想独自静一静，你先回去吧。', 0],
        ['月眉儿', '也好。夜里风凉，别站得太久。', 2],
      ]},
      move('manor-mei', P.garden.meiExit, 105), {type: 'hide', actor: 'manor-mei'},
      {type: 'wait', duration: .7}, move('hero', P.garden.heroExit, 105),
      {type: 'release'},
    ],
  },
  e09_sleepless: {
    map: 'r_beimo_hero_room', label: '回房后再试着入睡',
    actors: [], props: [], finalActors: [], finalCues: {dreamFade: 'in'}, steps: sleepers({restless: true}),
  },
  e09_second_meeting: {
    map: 'm50', label: '第二次走入后园', startPoint: {x: P.garden.secondHero[0], y: P.garden.secondHero[1]},
    actors: [mei(...P.garden.secondMei, true)], props: [],
    finalActors: [mei(...P.garden.meiExit, true)], finalCues: {},
    steps: [
      move('hero', P.garden.secondHero, 110), {type: 'show', actor: 'manor-mei'},
      move('manor-mei', P.garden.meiTalk, 100), move('hero', P.garden.heroTalk, 100),
      {type: 'face', actor: 'hero', target: 'manor-mei'}, {type: 'face', actor: 'manor-mei', target: 'hero'},
      {type: 'say', focus: 'manor-mei', lines: [
        ['月眉儿', '方才不是说回去歇息？怎么又出来了。', 2],
        ['杨影枫', '躺下以后更睡不着。我以为园里已经没人。', 0],
        ['月眉儿', '我也没有睡意。既然又碰见，就到我房里，把还没说完的话说完。', 2],
        ['杨影枫', '好。今夜的风，吹不散心里的事。', 0],
      ]},
      move('manor-mei', P.garden.meiExit, 105), move('hero', [P.garden.meiExit[0] - 80, P.garden.meiExit[1]], 105),
      {type: 'hide', actor: 'manor-mei'}, {type: 'release'},
    ],
  },
  e09_room_talk: {
    map: 'r_beimo_mei_room', label: '在房中继续交谈',
    actors: [mei(...P.meiRoom.meiTalk)], props: [], finalActors: [mei(...P.meiRoom.meiRest)], finalCues: {dreamFade: 'in'},
    steps: [
      move('hero', P.meiRoom.heroTalk, 105),
      {type: 'face', actor: 'hero', target: 'manor-mei'}, {type: 'face', actor: 'manor-mei', target: 'hero'},
      ...[
        {type: 'say', focus: 'manor-mei', lines: [
          ['月眉儿', '已经送到门里了，还要急着回去吗？', 2],
          ['杨影枫', '我再陪你一会。明日的事，明日再去面对。', 0],
          ['月眉儿', '那就坐下，今夜别只想着谁胜谁负。', 2],
        ]},
        move('hero', P.meiRoom.heroRest, 80), move('manor-mei', P.meiRoom.meiRest, 75),
        {type: 'pose', actor: 'hero', pose: 'sit', duration: 1},
        {type: 'pose', actor: 'manor-mei', pose: 'sit', duration: 1},
        {type: 'say', focus: 'manor-mei', lines: [['江湖纪事', '烛影渐低，二人留在房中，夜色在窗外静静过去。', 0]]},
        fade('out'), {type: 'wait', duration: 2.2},
      ].map(escorted),
      ...[
        {type: 'say', focus: 'manor-mei', lines: [
          ['月眉儿', '园中说得匆忙。你进谷以后，先听孟知秋怎么说，别急着露出打算。', 2],
          ['杨影枫', '他若再提起蔷薇，我也只能把要说的话藏住。', 0],
          ['月眉儿', '今夜既然睡不下，就慢慢想清楚。灯还亮着，我听你说。', 2],
        ]},
        {type: 'pose', actor: 'hero', pose: 'sit', duration: 1},
        {type: 'pose', actor: 'manor-mei', pose: 'sit', duration: 1},
        {type: 'wait', duration: 1.2},
        {type: 'say', focus: 'hero', lines: [['江湖纪事', '二人对着烛火又谈了许久，窗外始终没有别人的脚步声。', 0]]},
        stand('manor-mei'), move('manor-mei', P.meiRoom.meiRest, 80),
        fade('out'), {type: 'wait', duration: 2.2},
      ].map(alone),
      stand('hero'), stand('manor-mei'), fade('in'), {type: 'wait', duration: .9},
      move('hero', P.meiRoom.heroExit, 90), {type: 'release'},
    ],
  },
  e09_morning: {
    map: 'm50', label: '等待天明后辞行',
    actors: [resident()], props: [], finalActors: [resident()],
    persistentActors: [resident()], persistFlag: 'evilMeiStaysAtManor', legacyPersistFlag: 'evilLegacyManorNight',
    finalCues: {manorDaybreak: 'day', dreamFade: 'in'},
    steps: [
      move('hero', P.garden.morningHero, 105),
      {type: 'face', actor: 'hero', target: 'manor-mei-resident'},
      {type: 'say', focus: 'hero', lines: [['江湖纪事', '园中仍有一层薄暗，回廊下的灯将熄未熄。', 0]]},
      fade('out'), {type: 'wait', duration: 1.2},
      {type: 'cue', key: 'manorDaybreak', value: 'day'},
      fade('in'), {type: 'wait', duration: 1},
      {type: 'say', focus: 'manor-mei-resident', lines: [
        ['月眉儿', '天已经亮了。庄里的事我来照看，你先独自去落叶谷。', 2],
        ['杨影枫', '我这就动身。', 0],
        ['月眉儿', '路上留心。到了谷里，也别忘记我们商量过的事。', 2],
      ]},
      move('hero', P.garden.heroEntry, 105), {type: 'release'},
    ],
  },
};
