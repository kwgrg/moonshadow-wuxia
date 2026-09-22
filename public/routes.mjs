/**
 * Independently authored travel topology. Only the opening sequence has been
 * checked against the reference. Later links express the web quest itinerary;
 * they are not claims about the original game's map adjacency.
 */
export const ROUTE_MAPS = {
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
const REPLACED=new Set([['m1','m2'],['m2','m3'],['m3','m4'],['m4','m5'],['m5','m6']].map(([a,b])=>pairKey(a,b)));

const SIDE_ROUTES=[['m10','m72','a11'],['m72','m74','a11'],['m18','m73','a22'],['m7','m75','a07']];

function matches(when,state){
 if(!when)return true;
 if(when.route&&(state.flags?.route||'good')!==when.route)return false;
 if(when.flag&&!state.flags?.[when.flag])return false;
 if(when.not&&state.flags?.[when.not])return false;
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
 const itinerary=quests.filter(q=>matches(q.when,state));
 for(let i=1;i<itinerary.length;i++){
  const before=itinerary[i-1],next=itinerary[i];
  if(before.map===next.map||REPLACED.has(pairKey(before.map,next.map)))continue;
  // Hide future itineraries entirely. Merely having visited an unrelated map
  // cannot unlock another route, nor can the opposite morality branch do so.
  if(!arrived(next,state,quests))continue;
  const key=pairKey(before.map,next.map);
  if(!edges.has(key))edges.set(key,{from:before.map,to:next.map,requires:before.id,locked:false,reason:'',inferred:true});
 }
 return [...edges.values()];
}

/** Possible neighbours for stable authored portal placement, regardless of save. */
export function routeNeighbors(mapId,quests=[]){
 const neighbors=new Set();
 for(const [a,b] of [...OPENING,...SIDE_ROUTES]){if(a===mapId)neighbors.add(b);if(b===mapId)neighbors.add(a);}
 // Enumerate real branch combinations rather than joining the end of one
 // mutually exclusive story branch directly to the beginning of the other.
 const flagNames=[...new Set(quests.flatMap(q=>[q.when?.flag,q.when?.not]).filter(Boolean))];
 const variations=[{},Object.fromEntries(flagNames.map(k=>[k,true]))];
 for(const route of ['good','evil'])for(const flags of variations){
  const state={quest:quests.length,flags:{...flags,route}};
  for(const e of routeEdges(state,quests)){
   if(e.from===mapId)neighbors.add(e.to);
   if(e.to===mapId)neighbors.add(e.from);
  }
 }
 return [...neighbors];
}

/** Directional exit descriptors. Coordinates live in getScene(...).portals[to]. */
export function exitsFor(mapId,state={},quests=[]){
 return routeEdges(state,quests).filter(e=>e.from===mapId||e.to===mapId).map(e=>{
  const to=e.from===mapId?e.to:e.from;
  return {...e,id:`route:${mapId}:${to}`,to,exitKey:to,entryKey:mapId,label:ROUTE_MAPS[to]?.name||to};
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
