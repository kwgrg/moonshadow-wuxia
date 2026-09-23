/** Independent good-route care choreography. Real room and sea travel use
 * authored world portals; no original map, script, text or animation is used.
 */
const portrait = name => ['纳兰真', '蔷薇', '萱儿', '樱儿'].includes(name) ? 1 : name === '月眉儿' ? 2 : name === '孟知秋' ? 3 : 0;
const actor = (id, name, point, extra = {}) => ({id, name, sprite: portrait(name), x: point[0], y: point[1], direction: -1, pose: 'stand', ...extra});
const zhen = (point, extra) => actor('care-zhen', '纳兰真', point, extra);
const mei = (point, extra) => actor('care-mei', '月眉儿', point, {npcCell: null, ...extra});
const rose = (point, extra) => actor('care-rose', '蔷薇', point, {npcCell: 7, ...extra});
const meng = (point, extra) => actor('care-meng', '孟知秋', point, {npcCell: 3, ...extra});
const move = (who, point, speed = 110) => ({type: 'move', actor: who, x: point[0], y: point[1], speed});
const face = (who, target) => ({type: 'face', actor: who, target});
const say = (focus, lines) => ({type: 'say', focus, lines: lines.map(([name, text]) => [name, text, portrait(name)])});
const pose = (who, value, duration = .6) => ({type: 'pose', actor: who, pose: value, duration});
const fade = value => ({type: 'cue', key: 'dreamFade', value});
const release = () => ({type: 'release'});
const scene = (map, label, start, actors, steps, extra = {}) => ({
  map, label, startPoint: {x: start[0], y: start[1]}, actors, props: [],
  finalActors: actors.map(value => ({...value})), finalCues: {}, steps, ...extra,
});
// Original project geometry; the map owner validates these on the current art.
const P = {
  court: {hero: [760,650], meng: [850,505], rose: [965,575], nearRose: [895,625], zhenDoor: [520,425]},
  zhen: {hero: [650,570], zhen: [805,490], rose: [900,620], door: [780,810]},
  hero: {bed: [620,450], wake: [690,535], door: [760,760]},
  rose: {hero: [755,705], rose: [950,550], maid: [780,580], nearHero: [835,695], nearRose: [930,630], door: [750,780]},
  lake: {hero: [1040,480], rose: [1180,390], leave: [920,450]},
  patient: {hero: [750,690], mei: [1060,585], ying: [900,660], zhen: [760,585], roseEnter: [900,795], rose: [930,735], door: [820,810], meiExit: [1000,740], zhenExit: [840,750], heroExit: [730,780]},
  mainland: {hero: [690,570], zhen: [815,495], mei: [900,620], heroBoat: [700,455], meiBoat: [900,555]},
  island: {hero: [990,700], zhen: [900,650], mei: [1030,610], heroPath: [850,600], zhenPath: [760,570], meiPath: [930,560]},
  house: {hero: [795,625], zhen: [760,550], zhenCare: [720,610], meiEntry: [665,625], mei: [600,540]},
};
const roomRest = (isMorning = false) => [
  move('hero', P.hero.bed, 95), pose('hero', 'sit', 1),
  say('hero', [['杨影枫', isMorning ? '今夜能做的都做了。明早再去问伤情，别惊扰了屋里的人。' : '孟前辈答应今夜相助。我先在这里等着，别再添乱。']]),
  fade('out'), {type: 'wait', duration: 2},
  {type: 'cue', key: 'valleyCareLight', value: isMorning ? 'day' : 'night'},
  {type: 'wait', duration: .8}, fade('in'),
  say('hero', [['江湖纪事', isMorning ? '窗纸透亮，院中渐渐有了脚步声。' : '灯光已暗，院外的说话声也低了下来。'], ['杨影枫', isMorning ? '天亮了。先去眉儿那边问问。' : '该去向蔷薇当面道谢。']]),
  pose('hero', 'stand'), move('hero', P.hero.wake, 90), move('hero', P.hero.door, 110), release(),
];

export const VALLEY_CARE_STAGING = {
  g06: scene('m51', '向孟知秋求助', P.court.hero, [meng(P.court.meng)], [
    move('hero', P.court.hero), face('hero', 'care-meng'), face('care-meng', 'hero'),
    say('hero', [['杨影枫', '胡先生说，眉儿的经脉还须仰仗前辈相助。请您救她。'], ['孟知秋', '老夫可以出手。但你与蔷薇的事，也不能总是含糊过去。'], ['杨影枫', '前辈是要晚辈以婚事作答？'], ['孟知秋', '我给你一天时间想清楚。你若肯娶蔷薇，救人的事自会尽力。']]),
    release(),
  ]),
  g06_confide: scene('r_leaf_zhen_room', '与真儿商量', P.zhen.hero, [zhen(P.zhen.zhen)], [
    move('hero', P.zhen.hero), face('hero', 'care-zhen'), face('care-zhen', 'hero'),
    {...say('hero', [['杨影枫', '我拒绝用婚事换救治。孟前辈仍给了我一天，可眉儿不能这样等着。']]), when: {flag: 'valleyCareRefused'}},
    {...say('hero', [['杨影枫', '我只说还要考虑，没有许下婚约。孟前辈给了一天，我得想别的办法。']]), when: {flag: 'valleyCareConsidered'}},
    say('care-zhen', [['纳兰真', '若不是眉儿设法救我，我也不能平安回来。她受了这样的伤，我们更不能丢下她。'], ['杨影枫', '我误会了她，还伤了她……这一回总得把事情做对。'], ['纳兰真', '去和蔷薇说清楚吧。也许她能劝孟前辈先救人。'], ['杨影枫', '我这就去找她。你先在这里照看消息。']]),
    release(),
  ], {persistFor: ['g06_inquire','g06_request','g06_return']}),
  g06_inquire: scene('r_leaf_rose_room', '询问蔷薇去向', P.rose.hero, [actor('care-xuan', '萱儿', P.rose.maid)], [
    move('hero', P.rose.hero), face('hero', 'care-xuan'), face('care-xuan', 'hero'),
    say('care-xuan', [['萱儿', '少侠是来找小姐的？她去了天池，还没回来。'], ['杨影枫', '我有急事求她帮忙。这就去天池找。'], ['萱儿', '那边临水的路不好走，您慢些。']]),
    release(),
  ]),
  g06_request: scene('m52', '在天池请求蔷薇相助', P.lake.hero, [rose(P.lake.rose)], [
    move('hero', P.lake.hero), face('hero', 'care-rose'), face('care-rose', 'hero'),
    say('hero', [['杨影枫', '蔷薇，眉儿伤得很重。孟前辈愿意救她，却要我先答应婚事。'], ['蔷薇', '爹怎么把这两件事搅在一起？救人不能等。'], ['杨影枫', '我来求你帮忙，不是要你替我担下难处。'], ['蔷薇', '先别说这些了。我回去和爹谈，你随后来。']]),
    move('care-rose', P.lake.leave, 125), fade('out'), {type: 'wait', duration: .7},
    {type: 'hide', actor: 'care-rose'}, fade('in'),
    say('hero', [['杨影枫', '她已经先回去了。我也得赶回谷里。']]), release(),
  ], {finalActors: [rose(P.lake.leave, {hidden: true})], finalCues: {dreamFade: 'in'}}),
  g06_return: scene('m51', '听父女说情', P.court.hero, [meng(P.court.meng), rose(P.court.rose)], [
    move('hero', P.court.hero), face('care-rose', 'care-meng'), face('hero', 'care-meng'),
    say('care-rose', [['蔷薇', '爹，眉儿还伤着。先救她，好不好？我的事不能拿她的性命来逼。'], ['孟知秋', '你倒替他说起话来了。'], ['蔷薇', '女儿只求您先救人。其余的事，往后再说。'], ['孟知秋', '好吧。今夜我替她运功，你们先去安顿，别在旁边扰动。'], ['杨影枫', '多谢前辈。晚辈记下这份救命之恩。']]),
    face('care-rose', 'hero'), move('care-rose', P.court.nearRose, 95),
    say('care-rose', [['蔷薇', '带我去见真儿吧，也让她放心。'], ['杨影枫', '好，就在客房。我们过去。']]), release(),
  ], {finalActors: [meng(P.court.meng), rose(P.court.nearRose)]}),
  g06_introduce: scene('r_leaf_zhen_room', '把好消息告诉真儿', P.zhen.hero, [zhen(P.zhen.zhen), rose(P.zhen.door)], [
    move('hero', P.zhen.hero), move('care-rose', P.zhen.rose, 100),
    face('care-zhen', 'care-rose'), face('care-rose', 'care-zhen'),
    say('hero', [['杨影枫', '真儿，蔷薇已经劝动孟前辈，他答应今夜替眉儿运功。'], ['纳兰真', '蔷薇，多谢你。眉儿能撑过这一关，大家才放得下心。'], ['蔷薇', '别急着谢，先把人照顾好。爹既然答应，就不会敷衍。'], ['杨影枫', '我先回房等着，有事再来叫我。']]),
    move('care-rose', P.zhen.door, 100), {type: 'hide', actor: 'care-rose'}, release(),
  ], {finalActors: [zhen(P.zhen.zhen), rose(P.zhen.door, {hidden: true})], persistFor: ['g06_rest','g07','g07_dawn','g07_visit']}),
  g06_rest: scene('r_leaf_hero_room', '回客房等候', P.hero.bed, [], roomRest(), {finalActors: [], finalCues: {dreamFade: 'in', valleyCareLight: 'night'}}),
  g07: scene('r_leaf_rose_room', '夜里当面致谢', P.rose.hero, [rose(P.rose.rose)], [
    move('hero', P.rose.nearHero), move('care-rose', P.rose.nearRose, 90), face('hero', 'care-rose'), face('care-rose', 'hero'),
    say('hero', [['杨影枫', '白天多亏你开口，才让孟前辈答应救人。我该当面谢你。'], ['蔷薇', '她受了那么重的伤，我总不能在旁边看着。你也别再把谢字挂在嘴边了。'], ['杨影枫', '我知道。这份心意，不能只用一句话带过。'], ['蔷薇', '夜深了，回去歇着吧。明早还得照看她。']]),
    move('hero', P.rose.door, 100), release(),
  ], {finalActors: [rose(P.rose.nearRose)]}),
  g07_dawn: scene('r_leaf_hero_room', '等到次日清晨', P.hero.bed, [], roomRest(true), {finalActors: [], finalCues: {dreamFade: 'in', valleyCareLight: 'day'}}),
  g07_visit: scene('r_leaf_mei_room', '听樱儿说明伤情', P.patient.hero, [mei(P.patient.mei, {pose: 'ill', renderAt: {x:1080,y:320}, renderScale: 1.4}), actor('care-ying', '樱儿', P.patient.ying)], [
    move('hero', P.patient.hero), face('hero', 'care-ying'), face('care-ying', 'hero'),
    say('care-ying', [['樱儿', '少侠来了。老爷昨夜运功后已经闭关休息，姑娘的伤势总算稳住了。'], ['杨影枫', '她现在怎样？可还需要别的药？'], ['樱儿', '还得慢慢调养，不能当作已经好了。您先轻声些。'], ['杨影枫', '我去告诉真儿，再和她一起过来。']]), release(),
  ], {persistFor: ['g07_zhen']}),
  g07_zhen: scene('r_leaf_zhen_room', '邀真儿再探眉儿', P.zhen.hero, [zhen(P.zhen.zhen)], [
    move('hero', P.zhen.hero), face('hero', 'care-zhen'), face('care-zhen', 'hero'),
    say('hero', [['杨影枫', '樱儿说，孟前辈已经运功相助，伤势稳下来了。我们一起过去看看。'], ['纳兰真', '好。我正想问她醒了没有。'], ['杨影枫', '还有当初的误会，我得亲口向她赔不是。']]),
    move('care-zhen', P.zhen.door, 100), {type: 'hide', actor: 'care-zhen'}, release(),
  ], {finalActors: [zhen(P.zhen.door, {hidden: true})]}),
  g07_apology: scene('r_leaf_mei_room', '向苏醒的眉儿致歉', P.patient.hero, [mei(P.patient.mei, {pose: 'sit', renderAt: {x:1080,y:320}, renderScale: 1.4}), zhen(P.patient.zhen), rose(P.patient.roseEnter, {hidden: true})], [
    move('hero', P.patient.hero), face('hero', 'care-mei'), face('care-zhen', 'care-mei'),
    say('hero', [['杨影枫', '眉儿，你醒了。那日在峰上，我只顾着逼问，竟伤了救真儿的人。是我错了。'], ['月眉儿', '你动手的时候，可曾肯听我把话说完？'], ['杨影枫', '没有。无论你是否肯原谅，这句话我都该说。'], ['纳兰真', '是我没来得及把事情说清。你先养好伤，我们再慢慢谈。']]),
    {type: 'show', actor: 'care-rose'}, move('care-rose', P.patient.rose, 100), face('care-rose', 'care-mei'),
    say('care-rose', [['蔷薇', '误会既然说开，先顾眼下吧。你还得调养，别和自己的身体赌气。'], ['月眉儿', '我记着你们说的话。只是这伤，还没那么容易好。'], ['纳兰真', '忘忧岛离忧山有银丝草。我们送你到海边小屋，再取药来。'], ['杨影枫', '胡先生说要十二株。先安顿你们，采药的事交给我。'], ['蔷薇', '那我就送到这里。路上慢些，不必急赶。']]),
    move('care-rose', P.patient.door, 100), {type: 'hide', actor: 'care-rose'},
    pose('care-mei', 'stand', 1), move('care-mei', P.patient.meiExit, 65), move('care-zhen', P.patient.zhenExit, 85), move('hero', P.patient.heroExit, 90),
    say('care-zhen', [['纳兰真', '眉儿，走慢一点。我在旁边陪着你。']]),
    {type: 'hide', actor: 'care-mei'}, {type: 'hide', actor: 'care-zhen'}, release(),
  ], {finalActors: [mei(P.patient.meiExit, {hidden: true}), zhen(P.patient.zhenExit, {hidden: true}), rose(P.patient.door, {hidden: true})]}),
  g07_mainland: scene('r_mainland_dock', '陪伤者准备登船', P.mainland.hero, [zhen(P.mainland.zhen), mei(P.mainland.mei)], [
    move('hero', P.mainland.hero), face('hero', 'care-mei'),
    say('hero', [['杨影枫', '船就在前面。眉儿，若走得累了便说，别勉强。'], ['月眉儿', '走得慢些便是，不必一路问。'], ['纳兰真', '到岛上先回海边小屋。采药的路，我会告诉你。']]),
    move('care-mei', P.mainland.meiBoat, 65), move('hero', P.mainland.heroBoat, 90), release(),
  ], {finalActors: [zhen(P.mainland.zhen), mei(P.mainland.meiBoat)]}),
  g07_island: scene('m40', '从岛上渡口前往海屋', P.island.hero, [zhen(P.island.zhen), mei(P.island.mei)], [
    move('hero', P.island.hero), face('hero', 'care-zhen'),
    say('care-zhen', [['纳兰真', '到了。沿着海边走，就能回到小屋。'], ['杨影枫', '先把眉儿安顿好，再去找药。'], ['月眉儿', '我还能走，别在渡口耽搁了。']]),
    move('care-zhen', P.island.zhenPath, 80), move('care-mei', P.island.meiPath, 65), move('hero', P.island.heroPath, 85), release(),
  ], {finalActors: [zhen(P.island.zhenPath), mei(P.island.meiPath)]}),
  g07_settle: scene('m33', '在海屋安置伤者', P.house.hero, [zhen(P.house.zhen), mei(P.house.meiEntry)], [
    move('hero', P.house.hero), move('care-mei', P.house.mei, 60), pose('care-mei', 'ill', 1),
    move('care-zhen', P.house.zhenCare, 80), face('hero', 'care-zhen'),
    say('care-zhen', [['纳兰真', '眉儿在这里歇着，我留下照料。你去离忧山找银丝草，记住要十二株。'], ['杨影枫', '我记着。药没找齐之前，她还不能算康复。'], ['月眉儿', '去吧，我在这里等药。'], ['杨影枫', '真儿，她就拜托你了。']]), release(),
  ], {
    props: [{id: 'care-patient-cot', kind: 'sickbed', x: 600, y: 550, w: 190, h: 62, sortY: 535}],
    finalActors: [zhen(P.house.zhenCare), mei(P.house.mei, {pose: 'ill'})], persistFor: ['g08'],
  }),
};
