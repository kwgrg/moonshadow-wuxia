/**
 * Playable scenery for the web adaptation. These are authored layouts, not
 * recovered maps from the 2001 game. Coordinates use a 1536 × 1024 world.
 *
 * Keep the legacy quest anchors clear until each quest has been staged by hand.
 * Rectangles describe the solid footprint at an object's feet, not its artwork.
 */
const LEGACY_ANCHORS = [
  [1020,595], [1030,585], [1120,640], [680,760], [1270,850],
  [840,565], [550,790], [570,770], [530,775], [650,650],
  [1150,820], [1340,820], [1330,820], [800,755],
  [760,580], [915,630], [1070,580], [1225,630]
];

const palettes = {
  cliff:  { surface:'#919087', edge:'#343e40', path:'#a8a594', accent:'#acb8b4' },
  inn:    { surface:'#9a7350', edge:'#342923', path:'#ad8960', accent:'#e0b470' },
  room:   { surface:'#866b53', edge:'#302c28', path:'#a48460', accent:'#d8be8f' },
  temple: { surface:'#8e9b91', edge:'#394d4d', path:'#adbaaa', accent:'#cdb87b' },
  hall:   { surface:'#87998e', edge:'#304643', path:'#aab7a7', accent:'#d5bf81' },
  mountain:{surface:'#868b72', edge:'#384638', path:'#a8a58a', accent:'#c8cba0' },
  forest: { surface:'#657662', edge:'#263e35', path:'#a09b74', accent:'#a3bb7d' },
  cave:   { surface:'#697474', edge:'#263a3d', path:'#89958b', accent:'#91ada3' },
  village:{ surface:'#93866c', edge:'#454238', path:'#b6a78a', accent:'#d9bd89' },
  garden: { surface:'#738970', edge:'#314b41', path:'#b2b398', accent:'#d6bebd' },
  shore:  { surface:'#949d82', edge:'#304f50', path:'#c4bf9b', accent:'#b6d4c4' },
  tower:  { surface:'#747775', edge:'#29353a', path:'#979a8a', accent:'#bda987' }
};

const point = (id,name,x,y,text,extra={}) => ({id,name,x,y,text,kind:'inspect',...extra});
const path = (points,width=72,material='stone') => ({points,width,material});
const prop = (kind,x,y,w=70,h=40,extra={}) => ({kind,x,y,w,h,...extra});
const chest = (id,x,y,text,coins=25) => point(id,'旧木箱',x,y,text,{kind:'chest',appearance:'chest',reward:{coins}});

function classify(name, region) {
  if (/通天塔|摘星楼/.test(name)) return 'tower';
  if (/心魔阵/.test(name)) return 'cave';
  if (/洞|禁地|密室/.test(name)) return 'cave';
  if (/大殿|黑风堂|霹雳堂$/.test(name)) return 'hall';
  if (/酒肆|客栈|醉仙楼/.test(name)) return 'inn';
  if (/房|家$|小屋|布庄|药铺|小筑|破屋/.test(name)) return 'room';
  if (/峰|盆地/.test(name)) return 'cliff';
  if (/天池|溪|渡口|海滩|村南/.test(name)) return 'shore';
  if (/花园|樱花/.test(name)) return 'garden';
  if (/庙|武当|山庄|堡/.test(name)) return 'temple';
  if (/镇|乡|惠安/.test(name)) return 'village';
  if (/山/.test(name)) return 'mountain';
  return region.art==='lake'?'shore':'forest';
}

function atmosphere(kind, name, weather='') {
  const night=/亥时|夜|月色/.test(weather)||/禁地|心魔阵/.test(name);
  const snow=/天池|倚天|剑气峰/.test(name);
  return {
    light: night?'night':'day',
    weather: snow?'snow':/心魔阵/.test(name)?'mist':'clear',
    indoor:['inn','room','hall','tower','cave'].includes(kind),
    particles:kind==='garden'?'petals':kind==='forest'?'leaves':'dust'
  };
}

function baseScene(id, region) {
  const name=region.name||'江湖山径',kind=classify(name,region);
  const artByKind={cliff:'cliff',inn:'inn',room:'bedroom',temple:'temple',hall:'hall',mountain:'forest',forest:'forest',cave:'cave',village:'town',garden:'lake',shore:'island',tower:'hall'};
  return {
    id,title:name,kind,art:/天池/.test(name)?'snow':/九曲溪/.test(name)?'forest':artByKind[kind],fallbackArt:kind==='room'?'hall':region.art||'forest',
    bounds:['inn','room','hall','tower'].includes(kind)?[260,420,1435,950]:[150,355,1435,950],
    spawn:{x:785,y:895},objective:{x:1020,y:595},exit:{x:1360,y:850},
    ground:palettes[kind],atmosphere:atmosphere(kind,name,region.weather),
    obstacles:[],points:[],props:[],paths:[]
  };
}

/** A footprint is accepted only when it leaves old story/side-quest anchors clear. */
function solid(scene, object, rectangle) {
  const overlapsAnchor=LEGACY_ANCHORS.some(([x,y])=>
    x>rectangle[0]-28&&x<rectangle[2]+28&&y>rectangle[1]-28&&y<rectangle[3]+28);
  if (!overlapsAnchor) {
    scene.obstacles.push(rectangle);
    scene.props.push({...object,solid:true});
  }
}

function handcrafted(scene) {
  switch (scene.id) {
    case 'm1':
      scene.kind='cliff';scene.art='cliff';scene.ground=palettes.cliff;
      scene.bounds=[170,375,1435,955];scene.spawn={x:495,y:870};scene.exit={x:1365,y:885};
      scene.atmosphere={light:'dawn',weather:'mist',indoor:false,particles:'dust'};
      scene.paths=[path([[495,870],[725,815],[760,685],[1020,615]],76),path([[760,685],[1285,710],[1365,885]],60),path([[760,685],[570,515],[325,470]],46)];
      solid(scene,prop('rock',435,650,165,88),[365,612,505,685]);
      solid(scene,prop('pine',1320,480,160,205),[1295,460,1345,505]);
      solid(scene,prop('rock',900,850,118,74),[850,830,950,883]);
      scene.props.push(prop('incense',1020,622,62,30),prop('pine',180,680,180,235),prop('rock',1200,960,225,80),prop('rock',220,390,175,100));
      scene.points=[
        point('father-sword','石上剑痕',335,478,'石面上的剑痕深浅不一。父亲当年练剑的足迹，一直延伸到临崖处。',{appearance:'sword'}),
        point('cliff-road','山路石刻',1260,710,'石刻指向山下酒肆。循石径向东南走，便能离开凌绝峰。',{appearance:'stele'}),
        {...chest('travel-bundle',590,875,'临行的包袱里留着干粮和一瓶伤药。',0),name:'行囊',appearance:'bundle'}
      ];
      // The departure bundle contains medicine, not a nested coin object.
      scene.points[2].reward={potions:1};
      return true;
    case 'm2':
      scene.kind='inn';scene.art='inn';scene.ground=palettes.inn;scene.bounds=[250,420,1435,950];
      scene.spawn={x:1290,y:900};scene.exit={x:1370,y:875};
      scene.paths=[path([[1370,875],[1060,820],[820,755],[780,605],[1020,595]],78,'wood'),path([[820,755],[425,745],[370,500]],58,'wood')];
      solid(scene,prop('table',435,595,138,88),[378,563,492,625]);
      solid(scene,prop('table',1210,490,135,82),[1155,455,1265,516]);
      solid(scene,prop('counter',780,455,310,70),[640,427,920,490]);
      solid(scene,prop('table',1015,765,145,80),[955,737,1075,796]);
      scene.props.push(prop('lantern',335,540,45,105),prop('lantern',1390,655,45,100),prop('barrels',310,830,85,64),prop('rack',1260,390,170,90));
      scene.points=[point('wine-sign','酒肆招牌',360,470,'山脚小店靠来往香客谋生。掌柜把通往洗剑池的山路画在了木牌上。',{appearance:'sign'}),point('travel-rumor','行商留下的字条',1200,715,'纸条提醒过路客：山道近来有拦路匪徒，独行时要留心林间动静。',{appearance:'scroll'}),chest('inn-supplies',345,890,'墙边旧箱里有掌柜给远行客备下的些许盘缠。',18)];
      return true;
    case 'm3':
      scene.kind='temple';scene.art='temple';scene.ground=palettes.temple;
      scene.spawn={x:435,y:890};scene.exit={x:1370,y:535};
      scene.paths=[path([[435,890],[745,825],[1020,710],[1020,595],[1370,535]],86),path([[1020,710],[1200,740],[1320,865]],58),path([[745,825],[375,660],[310,460]],54)];
      solid(scene,prop('pool',405,535,315,130),[260,475,550,580]);
      solid(scene,prop('rock',880,815,115,68),[837,790,923,841]);
      solid(scene,prop('pine',1330,720,120,175),[1303,696,1355,746]);
      scene.props.push(prop('weaponRack',1125,475,150,105),prop('lantern',655,535,44,98),prop('lantern',1450,500,44,98));
      scene.points=[point('wash-sword','洗剑池碑',630,440,'碑旁设有解剑架。想上武当，先要在这里面对守山弟子的规矩。',{appearance:'stele'}),point('clear-water','池畔水纹',325,660,'清水映着山门，脚下湿苔很滑。池畔的石路能绕回平台。',{appearance:'water'}),chest('pool-medicine',1260,900,'石缝边的小匣里留着一瓶药。',12)];
      scene.points[2].reward={potions:1};
      return true;
    case 'm4':
      scene.kind='temple';scene.art='temple';scene.ground=palettes.temple;
      scene.spawn={x:790,y:915};scene.exit={x:1380,y:480};
      scene.paths=[path([[790,915],[790,790],[1020,695],[1020,595],[1380,480]],95),path([[790,790],[410,725],[335,495]],64)];
      solid(scene,prop('brazier',865,460,85,70),[833,430,897,475]);
      solid(scene,prop('pine',345,650,140,195),[320,628,370,675]);
      solid(scene,prop('rock',1235,750,112,70),[1190,725,1280,775]);
      scene.props.push(prop('gate',1110,420,255,200),prop('weaponRack',1330,640,125,95),prop('lantern',520,445,42,110),prop('lantern',1450,510,42,110));
      scene.points=[point('wudang-rules','门规碑',475,515,'门规碑立在院边：入门先通报。守门弟子正在等你的答复。',{appearance:'stele'}),point('training-post','练功木桩',385,845,'木桩上布满新旧剑痕。庭院两侧留着退让和转身的空地。',{appearance:'dummy'}),chest('courtyard-box',1335,905,'檐下药箱里收着应急的金创药。',8)];
      scene.points[2].reward={potions:1};
      return true;
    case 'm5':
      // Independently staged outdoor practice yard. These positions belong to
      // this web layout and do not reproduce the original game's map grid.
      scene.title='武当演武场';scene.kind='temple';scene.art='temple';scene.ground=palettes.temple;
      scene.atmosphere={light:'day',weather:'clear',indoor:false,particles:'dust'};
      scene.trainingPositions=[
        {x:450,y:540},{x:450,y:660},{x:450,y:780},
        {x:610,y:815},{x:785,y:815},{x:960,y:815},{x:1135,y:815},
        {x:1235,y:730},{x:1235,y:610},{x:1235,y:490}
      ];
      scene.arena={x:840,y:650,radius:165};
      scene.points=[
        point('practice-etiquette','切磋须知',640,435,'各位弟子分列场边候教。走近其中一位问剑，即可与他单独切磋；收剑之后，再向下一位请教。',{appearance:'sign'}),
        point('practice-rack','场边剑架',1140,445,'木剑用于试招。胜负既分便应收势，围观的弟子也会给场上两人留出退让的距离。',{appearance:'sword'}),
        {...chest('training-supplies',350,740,'练武用的补气药收在场边，休息时可以取用。',0),reward:{elixirs:1}}
      ];
      return true;
    case 'm6':
      scene.kind='mountain';scene.art='forest';scene.ground=palettes.mountain;
      scene.bounds=[155,355,1435,955];scene.spawn={x:275,y:885};scene.exit={x:1400,y:465};
      scene.paths=[path([[275,885],[550,710],[790,675],[1040,735],[1310,640],[1400,465]],85,'earth'),path([[1040,735],[1180,890]],46,'earth'),path([[790,675],[555,465],[290,415]],40,'earth')];
      solid(scene,prop('cart',385,555,180,85),[310,528,460,590]);
      solid(scene,prop('rock',900,850,120,75),[855,825,945,882]);
      solid(scene,prop('pine',1320,745,155,215),[1295,720,1345,770]);
      solid(scene,prop('rock',1240,430,175,70),[1160,403,1320,458]);
      scene.props.push(prop('barrels',250,570,90,70),prop('pine',225,735,145,220),prop('pine',580,400,160,220));
      scene.points=[point('overturned-cart','倾覆的货车',380,660,'车轮陷进石缝，货箱散了一地。商道的脚印向前方树林延伸。',{appearance:'cart'}),point('forest-tracks','林间足迹',480,440,'杂草被人踩倒了，折枝指向黑风洞一带。先确认商人已经脱险，再继续追踪。',{appearance:'trace'}),chest('merchant-supplies',1370,920,'遗落的药包仍未被雨水浸透。',20)];
      return true;
    default:return false;
  }
}

function generatedLayout(scene) {
  const n=Number(scene.id.replace(/\D/g,''))||1,shift=(n%4)*30;
  const {kind}=scene;
  // Main road is always connected. Branches are drawn to inspection points.
  scene.spawn={x:420+(n%3)*160,y:900};
  scene.exit={x:1370,y:470+(n%3)*180};
  scene.paths=[path([[scene.spawn.x,900],[800,800],[1020,690],[1020,595]],82),path([[1020,690],[1335,700],[scene.exit.x,scene.exit.y]],68),path([[800,800],[360,760],[350,470]],52)];
  if (['inn','room'].includes(kind)) {
    scene.paths.forEach(p=>p.material='wood');
    solid(scene,prop('table',425+shift,555,130,78),[370+shift,523,480+shift,586]);
    solid(scene,prop('counter',910,450,240,65),[800,425,1020,482]);
    solid(scene,prop('table',1190,745,115,75),[1144,715,1236,775]);
    scene.props.push(prop('lantern',320,595,45,102),prop('rack',1160,430,150,90),prop('barrels',1390,740,78,72));
  } else if (['hall','tower'].includes(kind)) {
    scene.paths.forEach(p=>p.material='tile');
    for(const [x,y] of [[400+shift,530],[1285,490],[400,820],[1285-shift,755]]) solid(scene,prop('column',x,y,62,170),[x-23,y-24,x+23,y+24]);
    scene.props.push(prop('altar',820,430,260,100),prop('rug',950,750,270,115),prop('brazier',1360,590,68,65));
    if(kind==='tower')scene.props.push(prop('stairs',1400,430,145,75,{label:`${n-61} 层`}));
  } else if (kind==='cave') {
    scene.paths.forEach(p=>p.material='earth');
    for(const [x,y,w] of [[365,605,190],[700+shift,430,190],[920,840,120],[1320,590,120]]) solid(scene,prop('rock',x,y,w,105),[x-w*.42,y-36,x+w*.42,y+37]);
    scene.props.push(prop('crystal',230,475,105,125),prop('brazier',1270,420,70,65),prop('rock',1400,980,260,130),prop('crystal',465,890,70,85));
  } else if (kind==='shore') {
    scene.paths.forEach(p=>p.material='sand');
    solid(scene,prop('pool',400,530,350,155),[235,470,560,595]);
    solid(scene,prop('rock',900,840,120,65),[850,815,950,872]);
    scene.props.push(prop('boat',210,775,180,95),prop('reeds',1380,570,100,85),prop('reeds',325,660,90,70),prop('pine',1385,950,180,215));
    scene.points.push(point('water-notes','水边旧木牌',620,425,'木牌上的水痕标着涨潮的高度。沿高处石路行走，能绕过低洼的水边。',{appearance:'sign'}));
  } else if (kind==='village') {
    solid(scene,prop('stall',400,565,210,125),[310,525,490,610]);
    solid(scene,prop('cart',870+shift,840,155,76),[805+shift,813,935+shift,875]);
    scene.props.push(prop('gate',1280,410,230,180),prop('lantern',270,730,45,110),prop('barrels',1360,740,90,75),prop('well',655,435,100,65));
  } else if (kind==='temple') {
    solid(scene,prop('pool',430,525,250,120),[320,475,545,570]);
    solid(scene,prop('brazier',910,840,90,62),[875,817,945,865]);
    scene.props.push(prop('gate',1290,430,245,180),prop('weaponRack',1260,720,150,108),prop('pine',220,820,165,235));
  } else if (kind==='garden') {
    solid(scene,prop('pool',420,510,280,125),[290,456,545,560]);
    solid(scene,prop('rock',930,860,140,75),[875,835,985,890]);
    scene.props.push(prop('blossom',320,675,235,240),prop('blossom',1300,505,230,235),prop('bench',1180,745,140,55));
  } else {
    scene.paths.forEach(p=>p.material=kind==='cliff'?'stone':'earth');
    solid(scene,prop('rock',395+shift,600,190,94),[320+shift,566,470+shift,637]);
    solid(scene,prop('rock',905,845,125,85),[855,818,955,880]);
    solid(scene,prop('pine',1305,730,160,205),[1279,706,1331,755]);
    scene.props.push(prop('pine',225,805,165,235),prop('pine',680+shift,395,140,210),prop('rock',1415,990,240,130));
  }
  const readable={inn:['客舍木牌','过往旅人在木牌上记下邻近街巷与山路。'],room:['案上手记','几页日用手记散在案边，房主人似乎刚离开。'],temple:['院中碑文','碑面写着山门规矩，石阶连接着庭院与正殿。'],hall:['殿侧陈设','宽阔的中庭留给来客，廊柱旁可以绕行。'],tower:['旧层记','墙上残留着前人刻下的层数，楼梯仍通向上方。'],cave:['洞壁刻痕','沿洞壁绕行，石柱之间还有能够通过的缺口。'],village:['街边告示','街道两侧聚着行商，岔道能通向后巷。'],shore:['岸边记号','渔人把返航方向记在石上，岸边另有一条小路。'],garden:['旧琴台','花瓣落满石台，水声从园中另一侧传来。'],forest:['折枝与脚印','林地留下过路人的痕迹，沿空隙可以绕过巨石。'],mountain:['山路石标','石标已被风雨磨损，仍能认出通往前方的方向。'],cliff:['崖边剑痕','石面上的深痕仍留着岁月的风霜。']}[kind];
  scene.points.push(point('local-inscription',readable[0],kind==='garden'?635:345,kind==='garden'?425:450,readable[1],{appearance:kind==='room'?'scroll':kind==='forest'?'trace':'stele'}));
  scene.points.push(chest('wayside-cache',1370,915,'路边旧箱里留着可供旅人补给的物品。',15+n%4*5));
  scene.points.push(point('far-corner','角落遗迹',1380,385+((n%2)*40),'走近才看见的旧痕迹，让这处地方多了一段未被记下的往事。',{appearance:kind==='cave'?'crystal':kind==='shore'?'boat':'sign'}));
  // No point relies on reaching its exact solid footprint; its adjacent space is open.
  scene.points=scene.points.map(p=>({...p,y:Math.max(scene.bounds[1]+35,p.y)}));
}

const cache=new Map();

/** Immutable-by-convention layout. The engine stores discoveries in its save state. */
export function getScene(mapId,region={}) {
  const key=[mapId,region.name,region.weather].join('|');
  if(cache.has(key))return cache.get(key);
  const scene=baseScene(mapId,region);
  if(!handcrafted(scene))generatedLayout(scene);
  alignPaintedGround(scene);
  for(const p of scene.points) {

    scene.paths.push(path([[p.x,p.y],[p.x,Math.min(900,p.y+80)]],28,['inn','room'].includes(scene.kind)?'wood':'earth'));
  }
  cache.set(key,scene);
  return scene;
}

export const SCENE_ART_KEYS=['cliff','inn','temple','hall','island','cave','bedroom'];


// Match the painted ground before exposing a layout to the engine. These masks
// approximate cliffs, fences, pools and walls with connected rectangular areas.
function alignPaintedGround(scene){
  const masks={
    bedroom:{bounds:[210,355,1425,930],spawn:{x:1010,y:735},exit:{x:1375,y:880},edges:[[210,750,295,930],[295,880,1260,930],[1100,745,1250,930],[1255,700,1330,930],[1380,355,1425,420]]},
    cliff:{bounds:[230,280,1435,950],spawn:{x:850,y:740},exit:{x:1370,y:865},edges:[[230,780,650,950],[230,690,380,780],[650,825,1230,950],[650,775,1020,825],[230,280,270,480],[1330,280,1435,610]]},
    inn:{bounds:[270,320,1380,860],spawn:{x:500,y:745},exit:{x:390,y:800},edges:[[270,320,330,585],[1280,470,1380,860],[1030,785,1380,860],[620,835,1030,860],[270,810,330,860]]},
    temple:{bounds:[280,325,1390,950],spawn:{x:650,y:820},exit:{x:805,y:365},edges:[[280,325,555,345],[280,810,340,950],[755,865,1390,950],[1325,325,1390,760]]},
    hall:{bounds:[190,260,1380,950],spawn:{x:760,y:815},exit:{x:765,y:915},edges:[[190,820,525,950],[1025,820,1380,950],[190,260,230,475],[1340,260,1380,480]]},
    island:{bounds:[290,340,1390,940],spawn:{x:675,y:835},exit:{x:1295,y:710},edges:[[290,340,565,390],[1030,340,1390,570],[1130,570,1390,650],[1190,765,1390,940],[825,825,1190,940],[290,830,465,940]]},
    cave:{bounds:[325,345,1375,950],spawn:{x:830,y:875},exit:{x:1270,y:395},edges:[[325,345,410,470],[325,660,510,950],[510,805,650,950],[1100,810,1375,950],[1300,590,1375,805]]},
    forest:{bounds:[270,380,1400,950],spawn:{x:775,y:875},exit:{x:1250,y:395},edges:[[270,760,355,950],[1315,650,1400,950],[560,380,825,430]]}
  };
  const mask=masks[scene.art];
  if(!mask)return;
  scene.bounds=mask.bounds.slice();scene.spawn={...mask.spawn};scene.exit={...mask.exit};
  scene.obstacles.push(...mask.edges.map(r=>r.slice()));
  // Outdoor artwork is not an interior even when the story returns at night.
  if(['cliff','inn','temple','island','forest'].includes(scene.art))scene.atmosphere.indoor=false;
  if(scene.id==='m1'){
    scene.objective={x:400,y:330,paintOnly:true};scene.props=[];
    scene.points[0].x=520;scene.points[0].y=435;
    scene.points[1].x=1230;scene.points[1].y=680;
    scene.points[2].x=1100;scene.points[2].y=680;
    scene.obstacles=mask.edges.map(r=>r.slice());
    scene.paths=[path([[850,740],[830,650],[645,515],[400,330]],52),path([[830,650],[1110,655],[1240,710],[1370,865]],44)];
  }else if(scene.id==='m2'){
    scene.objective={x:990,y:490};scene.props=scene.props.filter(p=>['table','barrels'].includes(p.kind));
    scene.points[0].x=420;scene.points[0].y=715;scene.points[1].x=1160;scene.points[1].y=545;scene.points[2].x=750;scene.points[2].y=765;
    scene.paths=[path([[390,800],[500,745],[690,680],[990,490]],58,'stone'),path([[690,680],[1090,685],[1160,545]],42,'stone')];
  }else if(scene.id==='m3'){
    scene.objective={x:645,y:400};scene.spawn={x:510,y:855};scene.exit={x:805,y:365};
    scene.props=scene.props.filter(p=>p.kind==='weaponRack');scene.obstacles=mask.edges.map(r=>r.slice());
    scene.points[0].x=595;scene.points[0].y=380;scene.points[1].x=350;scene.points[1].y=390;scene.points[2].x=1180;scene.points[2].y=730;
    scene.paths=[path([[510,855],[610,715],[710,520],[645,400]],62),path([[710,520],[920,535],[1180,730]],46),path([[710,520],[805,365]],56)];
  }else if(scene.id==='m4'){
    scene.objective={x:815,y:410};scene.spawn={x:555,y:845};scene.exit={x:810,y:355};
    scene.props=scene.props.filter(p=>p.kind==='weaponRack');scene.obstacles=mask.edges.map(r=>r.slice());
    scene.points[0].x=1150;scene.points[0].y=430;scene.points[1]={...scene.points[1],x:400,y:655,name:'院中石砖',text:'石砖沿庭院向正殿铺开。门阶前留着宽阔的空地，转身与退让都有余地。',paintOnly:true};scene.points[2].x=1160;scene.points[2].y=765;
    scene.paths=[path([[555,845],[745,700],[815,410],[810,355]],76),path([[745,700],[430,630],[400,655]],44),path([[745,700],[1160,765]],44)];
  }else if(scene.id==='m5'){
    // Keep the two side queues and the southern waiting line outside the arena.
    // Zhang Weiyi oversees the yard from the north; the gate remains reachable.
    scene.spawn={x:700,y:735};scene.objective={x:835,y:445};scene.exit={x:805,y:365};
    scene.props=[];scene.obstacles=mask.edges.map(r=>r.slice());
    scene.paths=[
      path([[700,735],[840,650],[835,445],[805,365]],78),
      path([[450,540],[450,660],[450,780],[610,815],[785,815],[960,815],[1135,815],[1235,730],[1235,610],[1235,490]],48),
      path([[450,660],[840,650],[1235,610]],48)
    ];
  }else if(scene.id==='m6'){
    scene.spawn={x:800,y:880};scene.objective={x:1000,y:600};scene.exit={x:1250,y:395};
    scene.points[0]={...scene.points[0],name:'林间石径',text:'竹林旁的石径在这里变宽。前方岔路一侧绕着山崖，另一侧深入树林。',paintOnly:true};scene.points[2].x=1150;scene.points[2].y=875;
    scene.paths=[path([[800,880],[840,740],[1010,600],[1110,470],[1250,395]],65,'earth'),path([[840,740],[500,650],[380,660]],48,'earth')];
  }
  if(/^m[1-6]$/.test(scene.id)||scene.art==='bedroom'){scene.drawRoads=false;scene.props=[];scene.obstacles=mask.edges.map(r=>r.slice());}
  const open=(x,y)=>x>=scene.bounds[0]+12&&x<=scene.bounds[2]-12&&y>=scene.bounds[1]+12&&y<=scene.bounds[3]-12&&!scene.obstacles.some(r=>x>r[0]-12&&x<r[2]+12&&y>r[1]-12&&y<r[3]+12);
  const project=p=>{
    if(open(p.x,p.y))return p;let best=null,dist=Infinity;
    for(let x=scene.bounds[0]+25;x<scene.bounds[2]-12;x+=25)for(let y=scene.bounds[1]+25;y<scene.bounds[3]-12;y+=25){const d=Math.hypot(p.x-x,p.y-y);if(d<dist&&open(x,y)){dist=d;best={x,y};}}
    return {...p,...best};
  };
  scene.spawn=project(scene.spawn);scene.objective=project(scene.objective);scene.exit=project(scene.exit);scene.points=scene.points.map(project);
  // A path drawn over a newly masked cliff would be misleading. Keep only
  // grounded segments; interaction pathfinding supplies routes around obstacles.
  scene.paths=scene.paths.flatMap(road=>{
    const segments=[];
    for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(len/15));let good=true;
      for(let j=0;j<=n;j++)if(!open(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n)){good=false;break;}
      if(good)segments.push({...road,points:[a,b]});
    }return segments;
  });
}





