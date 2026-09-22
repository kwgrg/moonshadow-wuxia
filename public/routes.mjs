/**
 * Independently authored travel topology. Only the opening sequence has been
 * checked against the reference. Later links express the web quest itinerary;
 * they are not claims about the original game's map adjacency.
 */
export const ROUTE_MAPS = {
 r_island_village:{name:'忘忧岛村落',area:'村中广场',art:'island-village',weather:'辰时 · 海风入村',poem:'村路闻惊语，归舟待息尘',shop:false,obstacles:[],routeOnly:true},
 r_mainland_dock:{name:'中原码头',area:'临江石岸',art:'mainland-dock',weather:'申时 · 江风渐起',poem:'舟回人未定，旧事到江边',shop:false,obstacles:[],routeOnly:true},
 m31:{name:'忘忧岛村南',area:'临水村路',art:'island',weather:'辰时 · 村路微风',poem:'潮声落屋后，去影入疏林',shop:false,obstacles:[]},
 m57:{name:'无忧教禁地密室',area:'画像与旧信',art:'forbidden-chamber',weather:'亥时 · 尘封旧室',poem:'旧信藏前事，假面待人识',shop:false,obstacles:[]},
 r_forbidden_path:{name:'村北林间路',area:'禁地方向',art:'forest',weather:'辰时 · 林风微动',poem:'疏林藏去影，小径向山深',shop:false,obstacles:[],routeOnly:true},
 r_forbidden_entry:{name:'无忧教禁地入口',area:'林岩石阶',art:'forest',weather:'辰时 · 岩前阴翳',poem:'林尽石阶起，深门不见人',shop:false,obstacles:[],routeOnly:true},
 r_forbidden_first:{name:'无忧教禁地一层',area:'洞窟回廊',art:'cave',weather:'亥时 · 幽窟微光',poem:'回声留一线，前影入重关',shop:false,obstacles:[],routeOnly:true},
 r_forbidden_second:{name:'无忧教禁地二层',area:'折廊石阶',art:'forbidden-second',weather:'亥时 · 石廊无声',poem:'石阶接暗廊，脚步向深处',shop:false,obstacles:[],routeOnly:true},
 r_forbidden_gate:{name:'无忧教禁地三层',area:'双玉机关',art:'forbidden-gate',weather:'亥时 · 石座生寒',poem:'两玉开尘锁，一门藏旧年',shop:false,obstacles:[],routeOnly:true},
 m71:{name:'摘星楼',area:'楼内厅堂',art:'hall',weather:'亥时 · 灯火沉沉',poem:'高堂灯未尽，归路待天明',shop:false,obstacles:[]},
 r_evil_dungeon:{name:'摘星楼地牢',area:'蔷薇囚室',art:'cult-dungeon',weather:'亥时 · 石壁寒灯',poem:'一墙隔生死，归路问何人',shop:false,obstacles:[],routeOnly:true},
 r_evil_chamber:{name:'摘星楼歇宿客房',area:'夜灯下',art:'bedroom',weather:'亥时 · 孤灯未熄',poem:'门外长更尽，梦中故人来',shop:false,obstacles:[],routeOnly:true},
 r_zhen_chamber:{name:'摘星楼真儿房间',area:'西北客房',art:'zhen-chamber',weather:'亥时 · 夜灯低垂',poem:'隔帘闻夜语，相约待归舟',shop:false,obstacles:[],routeOnly:true},
 r_evil_yitian:{name:'倚天山下山道',area:'通往渡头',art:'forest',weather:'辰时 · 山雾初散',poem:'山路向江去，远帆待归人',shop:false,obstacles:[],routeOnly:true},
 r_evil_ferry:{name:'倚天山渡头',area:'候船石岸',art:'island',weather:'辰时 · 江风微起',poem:'一帆分两岸，回首路迢迢',shop:false,obstacles:[],routeOnly:true},
 m61:{name:'摘星楼议事厅',area:'楼内正厅',art:'hall',weather:'亥时 · 灯火沉沉',poem:'高堂灯未尽，故路已难回',shop:false,obstacles:[]},
 r_cult_dungeon:{name:'摘星楼地牢',area:'左右囚室',art:'cult-dungeon',weather:'亥时 · 石壁寒灯',poem:'重门隔故人，灯影照前尘',shop:false,obstacles:[],routeOnly:true},
 r_cult_chamber:{name:'摘星楼客房',area:'灯下旧室',art:'bedroom',weather:'亥时 · 灯影独坐',poem:'人去空帷在，一灯照孤身',shop:false,obstacles:[],routeOnly:true},
 r_lingjue:{name:'凌绝峰山路',area:'下山石径',art:'forest',weather:'卯时 · 晨雾未散',poem:'回首青山远，初踏江湖路',shop:false,obstacles:[],routeOnly:true},
 r_wudang:{name:'武当登山道',area:'云阶',art:'forest',weather:'辰时 · 松风入云',poem:'石阶连云去，问剑向山巅',shop:false,obstacles:[],routeOnly:true}
};

// The web adaptation keeps the existing separate gate encounter (m4). Its
// placement before r_wudang is authored staging, not a measured original map.
const OPENING = [
 ['m1','r_lingjue','a01','先在墓前辞别父亲，再踏上下山的路。'],
 ['r_lingjue','m2','a01','先完成山顶的辞别。'],
 ['m2','m3','a02','先在酒肆问明上山的方向。'],
 ['m3','m4','a03','两位守山弟子仍守着北边石阶。'],
 ['m4','r_wudang','a04','先向山门弟子说明来意。'],
 ['r_wudang','m5','a04','先通过山门，才能登上演武坪。'],
 ['m2','m6','a05','先去武当问剑，下山后再沿商道前行。']
];
const pairKey=(a,b)=>[a,b].sort().join('|');
const REPLACED=new Set([['m1','m2'],['m2','m3'],['m3','m4'],['m4','m5'],['m5','m6'],['m71','m57'],['m71','r_evil_ferry'],['m34','m57'],['r_evil_chamber','r_zhen_chamber'],['m57','r_forbidden_path'],['r_forbidden_path','r_island_village'],['r_mainland_dock','m49']].map(([a,b])=>pairKey(a,b)));

// These links are independent web staging. A ferry is an explicit voyage,
// while the mountain connector must be walked on both sides of the journey.
const EVIL_ROUTES=[
 ['m71','r_evil_dungeon','e05','e06'],
 ['m71','r_evil_chamber','e06_aftermath','e06_night'],
 ['m71','r_zhen_chamber','e06_night','e06_night_visit'],
 ['m71','r_evil_yitian','e06_escort','e06_ferry'],
 ['r_evil_yitian','r_evil_ferry','e06_escort','e06_ferry'],
 ['r_evil_ferry','m40','e06_ferry','e06_landing','boat']
];

// New pursuit progress uses earned flags. Past visits and numeric quest order
// cannot substitute for the trail or open the inner door in current saves.
const FORBIDDEN_ROUTES=[
 ['m34','m31','evilZhenMissing','e07_village'],
 ['m31','r_forbidden_path','evilTrailVillage','e07_approach'],
 ['r_forbidden_path','r_forbidden_entry','evilTrailApproach','e07_entry'],
 ['r_forbidden_entry','r_forbidden_first','evilTrailEntry','e07_first'],
 ['r_forbidden_first','r_forbidden_second','evilTrailFirst','e07_second'],
 ['r_forbidden_second','r_forbidden_gate','evilTrailSecond','e07_gate'],
 ['r_forbidden_gate','m57','evilGateOpened','e07']
];

// Island departure is a physical return through the same layers. The painted
// village and mainland dock are authored locations; the sea edge is a voyage.
const DOCK_ROUTES=[
 ['r_forbidden_path','m31','evilTowerInterludeComplete','e08_interlude'],
 ['m31','r_island_village','evilTowerInterludeComplete','e08_interlude'],
 ['r_island_village','m40','evilIslandCleared','e08_island_battle'],
 ['m40','r_mainland_dock','evilIslandFarewell','e08_departure','boat'],
 ['r_mainland_dock','m41','evilZixuanDead','e08'],
 ['m41','m49','evilZixuanDead','e08']
];
const ISLAND_CORRIDOR=new Set(['m57','r_forbidden_gate','r_forbidden_second','r_forbidden_first','r_forbidden_entry','r_forbidden_path','m31','r_island_village','m40','r_mainland_dock','m41']);
const ISLAND_PAIRS=new Set([...FORBIDDEN_ROUTES.slice(2),...DOCK_ROUTES].map(([a,b])=>pairKey(a,b)));
const SIDE_ROUTES=[['m10','m72','a11'],['m72','m74','a11'],['m18','m73','a22'],['m7','m75','a07']];

function matches(when,state){
 if(!when)return true;
 if(when.route&&(state.flags?.route||'good')!==when.route)return false;
 if(when.flag&&!state.flags?.[when.flag])return false;
 if(when.not&&state.flags?.[when.not])return false;
 if(when.notAll?.some(key=>state.flags?.[key]))return false;
 return true;
}
function questIndex(state,quests){
 const id=state.currentQuestId||state.questId;
 return id?quests.findIndex(q=>q.id===id):Number.isInteger(state.quest)?state.quest:-1;
}
function arrived(quest,state,quests){
 return (state.done||[]).includes(quest.id)||questIndex(state,quests)>=quests.indexOf(quest);
}
function finished(id,state,quests){
 const i=quests.findIndex(q=>q.id===id);
 return (state.done||[]).includes(id)||(i>=0&&questIndex(state,quests)>i);
}

/** Undirected edges, including closed nearby passages for in-world feedback. */
export function routeEdges(state={},quests=[]){
 const edges=new Map();
 for(const [from,to,requires,reason] of OPENING){
  const locked=!finished(requires,state,quests);
  edges.set(pairKey(from,to),{from,to,requires,locked,reason:locked?reason:'',inferred:false});
 }
 for(const [from,to,requires] of SIDE_ROUTES){
  const stage=quests.find(q=>q.id===requires);
  if(stage&&arrived(stage,state,quests))edges.set(pairKey(from,to),{from,to,requires,locked:false,reason:'',inferred:true,design:'authored-side-route'});
 }
 if(state.flags?.route==='evil')for(const [from,to,requires,stageId,transport] of EVIL_ROUTES){
  const stage=quests.find(q=>q.id===stageId);
  if(!stage||!arrived(stage,state,quests))continue;
  const locked=!finished(requires,state,quests);
  edges.set(pairKey(from,to),{from,to,requires,locked,reason:locked?'先办完眼前的事，再从这里离开。':'',inferred:true,design:'authored-evil-route',...(transport?{transport}: {})});
 }
 if(state.flags?.route==='evil')for(const [from,to,requiresFlag,stageId] of FORBIDDEN_ROUTES){
  const stage=quests.find(q=>q.id===stageId);if(!stage||!arrived(stage,state,quests))continue;
  const locked=!state.flags?.[requiresFlag];
  edges.set(pairKey(from,to),{from,to,requiresFlag,locked,reason:locked?'先追上前方身影，确认她走过的路。':'',inferred:true,design:'authored-forbidden-pursuit'});
 }
 const itinerary=quests.filter(q=>matches(q.when,state));
 for(let i=1;i<itinerary.length;i++){
  const before=itinerary[i-1],next=itinerary[i];
  if(before.map===next.map||REPLACED.has(pairKey(before.map,next.map))||(state.flags?.route==='evil'&&pairKey(before.map,next.map)===pairKey('m57','m41')))continue;
  // Hide future itineraries entirely. Merely having visited an unrelated map
  // cannot unlock another route, nor can the opposite morality branch do so.
  if(!arrived(next,state,quests))continue;
  const key=pairKey(before.map,next.map);
  if(!edges.has(key))edges.set(key,{from:before.map,to:next.map,requires:before.id,locked:false,reason:'',inferred:true});
 }
 if(state.flags?.route==='evil'){
  const interlude=quests.find(q=>q.id==='e08_interlude'),departureActive=!!interlude&&arrived(interlude,state,quests);
  if(departureActive){
   for(const [from,to,requiresFlag,stageId,transport] of DOCK_ROUTES){
    const stage=quests.find(q=>q.id===stageId);if(!stage||!arrived(stage,state,quests))continue;
    const legacy=requiresFlag==='evilZixuanDead'?state.flags.evilLegacyZixuanOutcome:state.flags.evilLegacyIslandPassage;
    const locked=!state.flags[requiresFlag]&&!legacy;
    edges.set(pairKey(from,to),{from,to,requiresFlag,locked,reason:locked?'先完成当前的交涉或解围，再沿归途前行。':'',inferred:true,design:'authored-island-departure',...(transport?{transport,travelLabels:{m40:'乘船返回忘忧岛渡口',r_mainland_dock:'乘船前往中原码头'}}:{})});
   }
   // Earlier visits must not turn the island-to-mainland journey into an
   // overland shortcut. Normal exploration returns after the dock outcome.
   if(!state.flags.evilZixuanDead&&!state.flags.evilLegacyZixuanOutcome)for(const edge of edges.values()){
    if((ISLAND_CORRIDOR.has(edge.from)||ISLAND_CORRIDOR.has(edge.to))&&!ISLAND_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{locked:true,reason:'岛上的行程尚未结束，先沿归路处理眼前的事情。',design:'island-passage-boundary'});
   }
  }
 }
 // Future itinerary edges and historical saves must not provide a second way
 // into the evil-line chamber before the actual gate-opening transaction.
 if(state.flags?.route==='evil'&&!state.flags.evilGateOpened)for(const edge of edges.values())if(edge.from==='m57'||edge.to==='m57')Object.assign(edge,{locked:true,requiresFlag:'evilGateOpened',reason:'密门仍未开启，须先循着身影找到机关。'});
 return [...edges.values()];
}

// One all-map adjacency index per immutable campaign shape. A new branch flag
// does not cause every map to enumerate the same combinations independently.
const neighborCache=new WeakMap();
/** Possible neighbours for stable authored portal placement, regardless of save. */
export function routeNeighbors(mapId,quests=[]){
 const signature=JSON.stringify(quests.map(q=>[q.id,q.map,q.when]));
 let cached=neighborCache.get(quests);
 if(!cached||cached.signature!==signature){
  const byMap=new Map(),add=(a,b)=>{if(!byMap.has(a))byMap.set(a,new Set());if(!byMap.has(b))byMap.set(b,new Set());byMap.get(a).add(b);byMap.get(b).add(a);};
  for(const [a,b] of [...OPENING,...SIDE_ROUTES,...EVIL_ROUTES,...FORBIDDEN_ROUTES,...DOCK_ROUTES])add(a,b);
  const flagNames=[...new Set(quests.flatMap(q=>[q.when?.flag,q.when?.not,...(q.when?.notAll||[])]).filter(Boolean))];
  const variations=flagNames.reduce((states,key)=>states.flatMap(flags=>[{...flags,[key]:false},{...flags,[key]:true}]),[{}]);
  for(const route of ['good','evil'])for(const flags of variations)for(const edge of routeEdges({quest:quests.length,flags:{...flags,route}},quests))add(edge.from,edge.to);
  cached={signature,byMap};neighborCache.set(quests,cached);
 }
 return [...(cached.byMap.get(mapId)||[])];
}

/** Directional exit descriptors. Coordinates live in getScene(...).portals[to]. */
export function exitsFor(mapId,state={},quests=[]){
 return routeEdges(state,quests).filter(e=>e.from===mapId||e.to===mapId).map(e=>{
  const to=e.from===mapId?e.to:e.from;
  return {...e,id:`route:${mapId}:${to}`,to,exitKey:to,entryKey:mapId,label:ROUTE_MAPS[to]?.name||to,...(e.transport==='boat'?{travelLabel:e.travelLabels?.[to]||(to==='m40'?'乘船前往忘忧岛渡口':'乘船返回倚天山渡头')}:{})};
 });
}

/** Includes both endpoints; [] means no currently passable route. */
export function shortestRoute(from,to,state={},quests=[]){
 if(from===to)return [from];
 const queue=[[from]],seen=new Set([from]),edges=routeEdges(state,quests).filter(e=>!e.locked);
 while(queue.length){
  const route=queue.shift(),here=route.at(-1);
  for(const edge of edges){
   const next=edge.from===here?edge.to:edge.to===here?edge.from:null;
   if(!next||seen.has(next))continue;
   const candidate=[...route,next];if(next===to)return candidate;
   seen.add(next);queue.push(candidate);
  }
 }
 return [];
}
