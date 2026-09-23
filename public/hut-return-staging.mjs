/** Independent web presentation of the recorded return-to-manor sequence.
 * Actual cross-map movement remains the player's walk through world portals.
 * Room divisions and all geometry/timing are authored project design.
 */
const move = (actor, point, speed = 115) => ({type: 'move', actor, x: point[0], y: point[1], speed});
const face = (actor, target) => ({type: 'face', actor, target});
const say = (focus, lines) => ({type: 'say', focus, lines});
const pose = (actor, value, duration = .6) => ({type: 'pose', actor, pose: value, duration});
const fade = value => ({type: 'cue', key: 'dreamFade', value});
const release = () => ({type: 'release'});
const person = (id, name, sprite, point, extra = {}) => ({id, name, sprite, x: point[0], y: point[1], pose: 'stand', direction: -1, ...extra});
// Existing project painting templates; the integrated world owner verifies the
// new right-wing room and portals. These are not original-game coordinates.
const P = {
  hall: {hero: [760,650], heroNear: [800,675], tie: [1030,495], tieNear: [940,565], exit: [1200,800], zhenEntry: [1140,780], zhen: [865,675]},
  roseRoom: {hero: [755,705], heroNear: [835,695], rose: [950,550], roseNear: [930,630], exit: [750,780], tieEntry: [750,815], tieNear: [780,660]},
  heroRoom: {rest: [620,450], wake: [690,535], exit: [760,760]},
};
const tie = (point = P.hall.tie, extra = {}) => person('hut-return-tieyun', '铁云', 0, point, {npcCell: 5, ...extra});
const rose = (point = P.roseRoom.rose, extra = {}) => person('hut-return-qiangwei', '蔷薇', 0, point, {npcCell: 7, ...extra});
const zhen = (point = P.hall.zhenEntry, extra = {}) => person('hut-return-zhen', '纳兰真', 1, point, extra);

export const HUT_RETURN_STAGING = {
  e04_homecoming: {
    map: 'm49', label: '回庄向铁云问讯', startPoint: {x: P.hall.hero[0], y: P.hall.hero[1]},
    actors: [tie()], props: [], finalActors: [tie(P.hall.exit, {hidden: true})], finalCues: {},
    steps: [
      move('hero', P.hall.hero), move('hut-return-tieyun', P.hall.tieNear, 135), face('hero', 'hut-return-tieyun'),
      say('hut-return-tieyun', [
        ['铁云', '庄主回来了。少夫人这几日心情不好，正在大厅右侧的厢房。', 0],
        ['杨影枫', '知道了，我过去。', 0],
        ['铁云', '属下先告退。', 0],
      ]),
      move('hut-return-tieyun', P.hall.exit, 130), {type: 'hide', actor: 'hut-return-tieyun'}, release(),
    ],
  },
  e04_quarrel: {
    map: 'r_beimo_rose_room', label: '在右厢房见蔷薇', startPoint: {x: P.roseRoom.hero[0], y: P.roseRoom.hero[1]},
    actors: [rose(), tie(P.roseRoom.tieEntry, {hidden: true})], props: [],
    finalActors: [rose(P.roseRoom.exit, {hidden: true}), tie(P.roseRoom.exit, {hidden: true})], finalCues: {},
    steps: [
      move('hero', P.roseRoom.hero), face('hero', 'hut-return-qiangwei'),
      say('hut-return-qiangwei', [
        ['蔷薇', '这些日子，你不是练剑就是外出，连一句去向也不肯告诉我。', 0],
        ['杨影枫', '我刚回来，不想再争。', 0],
      ]),
      move('hut-return-qiangwei', P.roseRoom.roseNear, 95), move('hero', P.roseRoom.heroNear, 95),
      face('hut-return-qiangwei', 'hero'), face('hero', 'hut-return-qiangwei'),
      say('hut-return-qiangwei', [
        ['蔷薇', '我在这里等你，你却连听我说几句话都不愿意。', 0],
        ['杨影枫', '让我安静一会儿，行么？', 0],
        ['蔷薇', '那我走，省得留在这里碍你的事。', 0],
      ]),
      move('hut-return-qiangwei', P.roseRoom.exit, 135), {type: 'wait', duration: .5}, {type: 'hide', actor: 'hut-return-qiangwei'},
      {type: 'wait', duration: .8}, {type: 'show', actor: 'hut-return-tieyun'}, move('hut-return-tieyun', P.roseRoom.tieNear, 105),
      face('hut-return-tieyun', 'hero'), face('hero', 'hut-return-tieyun'),
      say('hut-return-tieyun', [
        ['铁云', '少夫人刚出了院门，走得很急。庄主……', 0],
        ['杨影枫', '让她静一静。你先退下吧。', 0],
      ]),
      move('hut-return-tieyun', P.roseRoom.exit, 110), {type: 'hide', actor: 'hut-return-tieyun'},
      move('hero', P.roseRoom.exit, 95), release(),
    ],
  },
  e04_wait: {
    map: 'r_beimo_hero_room', label: '回房歇息待晓', startPoint: {x: P.heroRoom.rest[0], y: P.heroRoom.rest[1]},
    actors: [], props: [], finalActors: [], finalCues: {hutReturnTime: 'morning', dreamFade: 'in'},
    steps: [
      {type: 'cue', key: 'hutReturnTime', value: 'night'}, move('hero', P.heroRoom.rest, 95),
      say('hero', [['杨影枫', '天色已晚。先歇下，明日再说。', 0]]), pose('hero', 'sit', .8),
      fade('out'), {type: 'wait', duration: 1.8}, {type: 'cue', key: 'hutReturnTime', value: 'morning'},
      fade('in'), {type: 'wait', duration: .6}, pose('hero', 'stand', .7), move('hero', P.heroRoom.wake, 85),
      say('hero', [['杨影枫', '已经天亮了，出去看看。', 0]]), move('hero', P.heroRoom.exit, 105), release(),
    ],
  },
  e04_report: {
    map: 'm49', label: '安排寻人与听取来讯', startPoint: {x: P.hall.hero[0], y: P.hall.hero[1]},
    actors: [tie(), zhen(P.hall.zhenEntry, {hidden: true})], props: [],
    finalActors: [tie(P.hall.exit, {hidden: true}), zhen(P.hall.zhenEntry, {hidden: true})], finalCues: {},
    steps: [
      move('hero', P.hall.hero), move('hut-return-tieyun', P.hall.tieNear, 135), face('hero', 'hut-return-tieyun'),
      say('hut-return-tieyun', [
        ['铁云', '庄主，少夫人整夜都没回来。', 0],
        ['杨影枫', '到庄外找一找，也叫其他人沿附近的路问问。', 0],
        ['铁云', '是，属下这就去。', 0],
      ]),
      move('hut-return-tieyun', P.hall.exit, 145), {type: 'hide', actor: 'hut-return-tieyun'}, {type: 'wait', duration: 1.2},
      {type: 'show', actor: 'hut-return-tieyun'}, move('hut-return-tieyun', P.hall.tieNear, 145),
      say('hut-return-tieyun', [['铁云', '庄主，真姑娘来了，说有急事。', 0]]),
      move('hut-return-tieyun', P.hall.exit, 115), {type: 'hide', actor: 'hut-return-tieyun'},
      {type: 'show', actor: 'hut-return-zhen'}, move('hut-return-zhen', P.hall.zhen, 105), move('hero', P.hall.heroNear, 155),
      face('hero', 'hut-return-zhen'), face('hut-return-zhen', 'hero'),
      say('hut-return-zhen', [
        ['杨影枫', '真儿，你怎么来了？', 0],
        ['纳兰真', '蔷薇被我爹抓到摘星楼了。他想拿她逼孟知秋就范。', 1],
        ['杨影枫', '什么？', 0],
        ['纳兰真', '我求他放人，他不肯听，还动手打了我。你快把消息告诉孟知秋，设法救她。', 1],
        ['杨影枫', '真儿……', 0],
        ['纳兰真', '该说的都说了，我先走了。', 1],
      ]),
      move('hut-return-zhen', P.hall.zhenEntry, 115), {type: 'wait', duration: .6}, {type: 'hide', actor: 'hut-return-zhen'},
      {type: 'wait', duration: .6},
      say('hero', [
        ['杨影枫', '如今连她的去向，我也不好再过问。', 0],
        ['杨影枫', '蔷薇还在等人救她。不能事事都等孟前辈来，我亲自去摘星楼。', 0],
      ]), release(),
    ],
  },
};
