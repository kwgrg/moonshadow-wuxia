/**
 * Independently authored travel topology. Bounded event-order audits are
 * documented separately; these links express the playable web itinerary.
 * They do not certify every adjacency or coordinate in the original game.
 */
export const ROUTE_MAPS = {
 r_leaf_memorial:{name:'落叶谷墓区',area:'谷中静地',art:'leaf-memorial',weather:'酉时 · 山风拂草',poem:'落叶知归处，故人长相念',shop:false,obstacles:[],routeOnly:true},
 m62:{name:'通天塔第1层',area:'上下楼石廊',art:'tower-lower',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m63:{name:'通天塔第2层',area:'上下楼石廊',art:'tower-lower',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m64:{name:'通天塔第3层',area:'上下楼石廊',art:'tower-middle',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m65:{name:'通天塔第4层',area:'上下楼石廊',art:'tower-middle',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m66:{name:'通天塔第5层',area:'上下楼石廊',art:'tower-middle',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m67:{name:'通天塔第6层',area:'上下楼石廊',art:'tower-middle',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m68:{name:'通天塔第7层',area:'上下楼石廊',art:'tower-middle',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 m69:{name:'通天塔第8层',area:'塔顶囚室',art:'tower-prison',weather:'亥时 · 塔中灯火',poem:'石阶通去路，旧影待归人',shop:false,obstacles:[]},
 r_good_hanbo_road:{name:'寒波谷外山路',area:'通往惠安南郊',art:'forest-original',weather:'辰时 · 谷外清风',poem:'谷声留身后，旧路向人间',shop:false,obstacles:[],routeOnly:true},
 r_good_dunhuang_approach:{name:'敦煌外山道',area:'山庄外连接路',art:'forest-original',weather:'辰时 · 山间微风',poem:'庄门留身后，石路向西行',shop:false,obstacles:[],routeOnly:true},
 r_good_dunhuang_passage:{name:'敦煌洞口通路',area:'洞窟通行段',art:'cave',weather:'辰时 · 洞口微光',poem:'石窟留回声，行人辨去路',shop:false,obstacles:[],routeOnly:true},
 r_good_feilong_approach:{name:'飞龙堡前山径',area:'出洞连接路',art:'forest-original',weather:'辰时 · 风过疏林',poem:'洞尽山光近，前庭又一关',shop:false,obstacles:[],routeOnly:true},
 r_good_desert:{name:'通天塔外沙漠',area:'堡后沙路',art:'desert-passage',weather:'辰时 · 沙地晴光',poem:'黄沙接远塔，归路在身后',shop:false,obstacles:[],routeOnly:true},
 r_good_dungeon:{name:'摘星楼地下牢房',area:'石阶与囚室',art:'rescue-dungeon',weather:'亥时 · 牢中灯火',poem:'阶深闻故语，归路待人同',shop:false,obstacles:[],routeOnly:true},
 r_good_yitian:{name:'倚天山归路',area:'楼外山径',art:'forest-original',weather:'辰时 · 山间微风',poem:'楼影留身后，归人向谷行',shop:false,obstacles:[],routeOnly:true},
 r_good_hanbo_hut:{name:'寒波谷小筑近旁',area:'谷内安置处',art:'hanbo-hut-yard',weather:'辰时 · 溪畔微风',poem:'溪声留归步，暂别待君还',shop:false,obstacles:[],routeOnly:true},
 m59:{name:'惠安镇街口',area:'镇中石街',art:'town-original',weather:'辰时 · 镇中微风',poem:'旧事随人至，归舟向海行',shop:false,obstacles:[]},
 m60:{name:'忘忧岛禁地外场',area:'石阶前庭',art:'temple',weather:'辰时 · 风过空庭',poem:'深门留去路，剑影满前庭',shop:false,obstacles:[]},
 r_good_seaside_hut:{name:'海边空屋',area:'屋内寻人',art:'beimo-mei-room',weather:'辰时 · 窗前寂静',poem:'归来空室静，旧影待人寻',shop:false,obstacles:[],routeOnly:true},
 r_good_forbidden_path:{name:'村北禁地山径',area:'林间连接路',art:'forest-original',weather:'辰时 · 林间微风',poem:'村声留身后，石径向深门',shop:false,obstacles:[],routeOnly:true},
 r_good_forbidden_first:{name:'禁地一层回廊',area:'洞窟石路',art:'cave',weather:'亥时 · 石窟回声',poem:'幽光循石路，归步记前程',shop:false,obstacles:[],routeOnly:true},
 r_good_forbidden_second:{name:'禁地二层折廊',area:'临渊石阶',art:'forbidden-second',weather:'亥时 · 深廊静水',poem:'石阶绕深水，微光向里延',shop:false,obstacles:[],routeOnly:true},
 r_good_forbidden_third:{name:'禁地三层内门',area:'内门前厅',art:'forbidden-gate',weather:'亥时 · 门内静寂',poem:'石门留一线，故人在深处',shop:false,obstacles:[],routeOnly:true},
 r_good_forbidden_chamber:{name:'禁地会合密室',area:'石室会合',art:'forbidden-chamber',weather:'亥时 · 静室微光',poem:'相逢知旧事，归路共人行',shop:false,obstacles:[],routeOnly:true},
 r_beimo_rose_room:{name:'悲魔山庄右厢房',area:'大厅东侧内室',art:'leaf-rose-room',weather:'申时 · 帘外院声',poem:'一室留旧语，门外去人迟',shop:false,obstacles:[],routeOnly:true},
 r_hanbo_return:{name:'寒波谷归途',area:'林间谷路',art:'forest-original',weather:'辰时 · 谷风微凉',poem:'归途思旧影，前路待援人',shop:false,obstacles:[],routeOnly:true},
 m52:{name:'天池',area:'雪岸与湖心岛',art:'tianchi-islet',weather:'巳时 · 湖上清寒',poem:'孤雪分深水，跃影过寒波',shop:false,obstacles:[]},
 m51:{name:'落叶谷',area:'谷中庭院',art:'leaf-courtyard',weather:'辰时 · 谷风穿庭',poem:'谷静闻归步，疏枝映客窗',shop:true,obstacles:[]},
 r_leaf_zhen_room:{name:'落叶谷真儿客房',area:'庭院客房',art:'beimo-mei-room',weather:'辰时 · 纸窗微明',poem:'灯前闻旧事，归路待人同',shop:false,obstacles:[],routeOnly:true},
 r_leaf_mei_room:{name:'落叶谷眉儿病房',area:'临窗病榻',art:'leaf-infirmary',weather:'辰时 · 窗前静养',poem:'一室留清气，重逢释旧疑',shop:false,obstacles:[],routeOnly:true},
 r_leaf_rose_room:{name:'落叶谷蔷薇房间',area:'庭院内室',art:'leaf-rose-room',weather:'辰时 · 帘外谷风',poem:'檐下春秋事，灯前一语深',shop:false,obstacles:[],routeOnly:true},
 r_leaf_hero_room:{name:'落叶谷影枫客房',area:'庭院客房',art:'beimo-hero-room',weather:'辰时 · 一窗清光',poem:'暂歇归人步，推门又一程',shop:false,obstacles:[],routeOnly:true},

 m50:{name:'悲魔山庄后花园',area:'内苑园路',art:'beimo-garden-day',weather:'辰时 · 园中微风',poem:'灯照曲径深，夜语待天明',shop:true,obstacles:[]},
 r_beimo_hero_room:{name:'悲魔山庄影枫卧房',area:'内苑客房',art:'beimo-hero-room',weather:'亥时 · 一灯未眠',poem:'旧事难入梦，推门月色深',shop:false,obstacles:[],routeOnly:true},
 r_beimo_mei_room:{name:'悲魔山庄月眉儿客房',area:'东侧客房',art:'beimo-mei-room',weather:'亥时 · 灯下夜谈',poem:'园路通灯火，隔帘语未休',shop:false,obstacles:[],routeOnly:true},
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
const REPLACED=new Set([['m69','m51'],['m49','m54'],['m54','m62'],['m61','m41'],['m61','m16'],['m61','r_hanbo_return'],['r_good_dungeon','r_good_hanbo_hut'],['r_good_hanbo_hut','m41'],['m59','m60'],['m60','m31'],['m60','r_mainland_dock'],['m59','r_good_seaside_hut'],['r_good_seaside_hut','m60'],['m60','r_good_forbidden_chamber'],['m60','m40'],['m1','m2'],['m2','m3'],['m3','m4'],['m4','m5'],['m5','m6'],['m71','m57'],['m71','r_evil_ferry'],['m34','m57'],['r_evil_chamber','r_zhen_chamber'],['m57','r_forbidden_path'],['r_forbidden_path','r_island_village'],['r_mainland_dock','m49'],['m49','r_beimo_hero_room'],['m49','r_beimo_mei_room'],['r_beimo_hero_room','r_beimo_mei_room']].map(([a,b])=>pairKey(a,b)));

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
const MANOR_ROUTES=[['m49','m50'],['m50','r_beimo_hero_room'],['m50','r_beimo_mei_room']];
const MANOR_MAPS=new Set(['m49','m50','r_beimo_hero_room','r_beimo_mei_room']);
const MANOR_NIGHT_QUESTS=new Set(['e09_first_wake','e09','e09_part','e09_sleepless','e09_second_meeting','e09_room_talk','e09_morning']);
// The four doors are independent web partitions, not recovered original rooms.
const LEAF_ROOMS=['r_leaf_zhen_room','r_leaf_mei_room','r_leaf_rose_room','r_leaf_hero_room'];
const LEAF_ROUTES=LEAF_ROOMS.map(id=>['m51',id]);
const LEAF_COURT=new Set(['m51','m52',...LEAF_ROOMS]);
const GOOD_RETURN_ROUTES=[['m51','m49'],['m49','m41'],['m41','r_mainland_dock'],['r_mainland_dock','m40','boat'],['m40','m34'],['m34','m33']];
const GOOD_RETURN_MAPS=new Set(GOOD_RETURN_ROUTES.flatMap(([a,b])=>[a,b]));
const GOOD_RETURN_PAIRS=new Set(GOOD_RETURN_ROUTES.map(([a,b])=>pairKey(a,b)));
// Chapter-local corridors preserve earlier exploration while preventing a new
// staged return or rescue from inheriting a direct historical quest jump.
const HUT_RETURN_ROUTES=[['m16','m17'],['m17','m49'],['m49','r_beimo_rose_room'],['m49','m50'],['m50','r_beimo_hero_room'],['m49','m71']];
const HUT_RETURN_MAPS=new Set(HUT_RETURN_ROUTES.flat());
const HUT_RETURN_PAIRS=new Set(HUT_RETURN_ROUTES.map(([a,b])=>pairKey(a,b)));
const HUT_RETURN_QUESTS=new Set(['e04_homecoming','e04_quarrel','e04_wait','e04_report','e05']);
const VALLEY_DEFENSE_ROUTES=[['m60','r_good_forbidden_path'],['r_good_forbidden_path','m31'],['m31','m40'],['m40','r_mainland_dock','boat'],['r_mainland_dock','m41'],['m41','m49'],['m49','m51'],['m51','r_hanbo_return'],['r_hanbo_return','m16'],['r_hanbo_return','r_good_yitian'],['r_good_yitian','m61']];
const VALLEY_DEFENSE_MAPS=new Set(VALLEY_DEFENSE_ROUTES.flatMap(([a,b])=>[a,b]));
const VALLEY_DEFENSE_PAIRS=new Set(VALLEY_DEFENSE_ROUTES.map(([a,b])=>pairKey(a,b)));
const VALLEY_DEFENSE_QUESTS=new Set(['g14_dock_report','g14_manor_battle','g14','g14_hanbo','g14_resolve','g15']);
// Dedicated good-line spaces reuse authored paintings but never the evil
// pursuit, jade-door transaction or identity-reveal scene. Directional gates
// allow a migrated player to retreat from m60 and inspect the empty house.
const GOOD_FORBIDDEN_ROUTES=[['m59','m41'],['m41','r_mainland_dock'],['r_mainland_dock','m40','boat'],['m40','m34'],['m34','r_good_seaside_hut'],['m34','m31'],['m31','r_good_forbidden_path'],['r_good_forbidden_path','m60'],['m60','r_good_forbidden_first'],['r_good_forbidden_first','r_good_forbidden_second'],['r_good_forbidden_second','r_good_forbidden_third'],['r_good_forbidden_third','r_good_forbidden_chamber'],['m31','m40']];
const GOOD_FORBIDDEN_MAPS=new Set(GOOD_FORBIDDEN_ROUTES.flatMap(([a,b])=>[a,b]));
const GOOD_FORBIDDEN_PAIRS=new Set(GOOD_FORBIDDEN_ROUTES.map(([a,b])=>pairKey(a,b)));
const GOOD_FORBIDDEN_QUESTS=new Set(['g12','g13_hut','g13_entry','g13_reunion','g13','g13_captured','g13_ferry']);
const GOOD_FORBIDDEN_INNER=new Set(['r_good_forbidden_first','r_good_forbidden_second','r_good_forbidden_third','r_good_forbidden_chamber']);
const GOOD_RESCUE_ROUTES=[['m61','r_good_dungeon'],['m61','r_good_yitian'],['r_good_yitian','r_hanbo_return'],['r_hanbo_return','r_good_hanbo_hut']];
const GOOD_RESCUE_CORE=new Set(GOOD_RESCUE_ROUTES.flat());
const GOOD_RESCUE_PAIRS=new Set(GOOD_RESCUE_ROUTES.map(([a,b])=>pairKey(a,b)));
const GOOD_RESCUE_QUESTS=new Set(['g15_escape','g16','g16_homecoming','g17','g17_departure','g17_manor','g18','gTower1']);
const GOOD_RESCUE_DEPARTURE=[['r_hanbo_return','r_good_hanbo_road'],['r_good_hanbo_road','m41'],['m41','m49']];
const GOOD_RESCUE_TOWER_ROUTE=[['m49','r_good_dunhuang_approach'],['r_good_dunhuang_approach','r_good_dunhuang_passage'],['r_good_dunhuang_passage','r_good_feilong_approach'],['r_good_feilong_approach','m54'],['m54','r_good_desert'],['r_good_desert','m62']];
const GOOD_RESCUE_TOWER_PAIRS=new Set(GOOD_RESCUE_TOWER_ROUTE.map(([a,b])=>pairKey(a,b)));
const GOOD_VALLEY_ROUTES=[['m51','r_leaf_memorial'],['m51','r_leaf_hero_room'],['m51','r_leaf_rose_room']];
const GOOD_VALLEY_MAPS=new Set(['m51','r_leaf_memorial','r_leaf_hero_room','r_leaf_rose_room']);
const GOOD_TOWER_ROUTES=Array.from({length:7},(_,i)=>['m'+(62+i),'m'+(63+i)]);
const GOOD_TOWER_PAIRS=new Set([...GOOD_TOWER_ROUTES,...GOOD_RESCUE_TOWER_ROUTE].map(([a,b])=>pairKey(a,b)));
const GOOD_TOWER_CORRIDOR=new Set([...Array.from({length:8},(_,i)=>'m'+(62+i)),'r_good_desert','m54','r_good_feilong_approach','r_good_dunhuang_passage','r_good_dunhuang_approach']);
const SIDE_ROUTES=[['m10','m72','a11'],['m72','m74','a11'],['m18','m73','a22'],['m7','m75','a07']];

function matches(when,state){
 if(!when)return true;
 if(when.route&&(state.flags?.route||'good')!==when.route)return false;
 if(when.flag&&!state.flags?.[when.flag])return false;
 if(when.not&&state.flags?.[when.not])return false;
 if(when.notAll?.some(key=>state.flags?.[key]))return false;
 return true;
}
function inferredPairAllowed(before,next,route){
 return before.map!==next.map&&
  !((before.map==='r_leaf_memorial'||next.map==='r_leaf_memorial')&&before.map!=='m51'&&next.map!=='m51')&&
  !((before.map==='r_beimo_rose_room'||next.map==='r_beimo_rose_room')&&before.map!=='m49'&&next.map!=='m49')&&
  !((LEAF_ROOMS.includes(before.map)||LEAF_ROOMS.includes(next.map))&&before.map!=='m51'&&next.map!=='m51')&&
  pairKey(before.map,next.map)!==pairKey('m40','m33')&&!REPLACED.has(pairKey(before.map,next.map))&&
  !(route==='evil'&&pairKey(before.map,next.map)===pairKey('m57','m41'));
}
// Test whether the two selected quest predicates can hold while every intervening
// predicate is false. This avoids enumerating every global flag combination as
// independent, unrelated story branches grow.
function predicateLiterals(when,route){
 if(when?.route&&when.route!==route)return null;
 const literals=[];if(when?.flag)literals.push([when.flag,true]);if(when?.not)literals.push([when.not,false]);
 for(const key of when?.notAll||[])literals.push([key,false]);return literals;
}
function satisfiable(clauses,assignment=new Map()){
 let pending=clauses;
 for(;;){
  const reduced=[];let unit=null;
  for(const clause of pending){
   if(clause.some(([key,value])=>assignment.has(key)&&assignment.get(key)===value))continue;
   const rest=clause.filter(([key])=>!assignment.has(key));if(!rest.length)return false;
   if(rest.length===1)unit=rest[0];reduced.push(rest);
  }
  if(!reduced.length)return true;
  if(!unit){const [key,value]=reduced.reduce((a,b)=>a.length<b.length?a:b)[0];return satisfiable(reduced,new Map([...assignment,[key,value]]))||satisfiable(reduced,new Map([...assignment,[key,!value]]));}
  assignment.set(unit[0],unit[1]);pending=reduced;
 }
}
function addPossibleItineraryEdges(quests,add){
 for(const route of ['good','evil']){
  const predicates=quests.map(q=>predicateLiterals(q.when,route));
  for(let i=0;i<quests.length;i++){
   if(predicates[i]===null)continue;
   const skipped=[];
   for(let j=i+1;j<quests.length;j++){
    const next=predicates[j];if(next===null)continue;
    if(inferredPairAllowed(quests[i],quests[j],route)&&satisfiable([...predicates[i].map(l=>[l]),...next.map(l=>[l]),...skipped]))add(quests[i].map,quests[j].map);
    if(!next.length)break;
    skipped.push(next.map(([key,value])=>[key,!value]));
   }
  }
 }
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

/** Physical edges; lockedFrom optionally closes departure from one endpoint. */
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
  if(!inferredPairAllowed(before,next,state.flags?.route||'good'))continue;
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
 if(state.flags?.route==='evil'){
  const report=quests.find(q=>q.id==='e09_report'),current=quests[questIndex(state,quests)]?.id,flags=state.flags;
  if(report&&arrived(report,state,quests)){
   const legacy=!!flags.evilLegacyManorNight,complete=!!flags.evilManorNightComplete||legacy;
   const reported=!!flags.evilManorReported||!!flags.evilLegacyManorPrelude||complete;
   const exclusive=!!flags.evilMeiEscorted!==!!flags.evilMeiAlone;
   const roomReady=complete||(!!flags.evilManorDecision&&exclusive&&(flags.evilMeiEscorted||(flags.evilMeiAlone&&flags.evilMeiSecondMet)));
   for(const [from,to] of MANOR_ROUTES){const locked=to==='r_beimo_mei_room'?!roomReady:!reported;edges.set(pairKey(from,to),{from,to,locked,reason:locked?'先办完当前的交谈，再沿园路进房。':'',inferred:true,design:'authored-manor-night'});}
   const nightActive=!complete&&(flags.evilManorNightStarted||flags.evilLegacyManorPrelude||MANOR_NIGHT_QUESTS.has(current));
   if(nightActive)for(const edge of edges.values()){
    const inside=[edge.from,edge.to].filter(id=>MANOR_MAPS.has(id));
    if(inside.length===1)Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),inside[0]],departureReason:'夜间的事情尚未了结，先留在庄内。'});
   }
   // Morning departure goes through the manor gate. The old early-story
   // garden/valley connection becomes available again after the teaching visit.
   if(nightActive||current==='e09_morning'||current==='e10_teaching'){
    for(const edge of edges.values())if((edge.from==='m50'&&!MANOR_MAPS.has(edge.to))||(edge.to==='m50'&&!MANOR_MAPS.has(edge.from)))Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),'m50'],departureReason:'出庄须先回前院，再沿庄门前往落叶谷。'});
   }
  }
 }
 if(state.flags?.route==='good'){
  const flags=state.flags,start=quests.find(q=>q.id==='g06');
  if(start&&arrived(start,state,quests)){
   const legacy=!!flags.valleyLegacyCare,opened=!!flags.valleyCareStarted||!!flags.valleyLegacyCarePrelude||legacy;
   // Entering a room needs the care visit; leaving it never strands a save.
   for(const [from,to] of LEAF_ROUTES)edges.set(pairKey(from,to),{from,to,locked:false,...(!opened?{lockedFrom:[from],departureReason:'先向孟前辈说明来意，再进客房看望。'}:{}),inferred:true,design:'authored-valley-room'});
   const preparing=opened&&!legacy&&!flags.valleyCareSettled&&!flags.valleyMeiAwake;
   if(preparing)for(const edge of edges.values()){
    const inside=[edge.from,edge.to].filter(id=>LEAF_COURT.has(id));
    if(inside.length===1)Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),inside[0]],departureReason:'谷中的求助与探望尚未办妥，先沿院门和天池的路前行。'});
   }
   const returnStage=quests.find(q=>q.id==='g07_mainland');
   if(legacy||flags.valleyMeiAwake||(returnStage&&arrived(returnStage,state,quests))){
    for(const [from,to,transport] of GOOD_RETURN_ROUTES){
     const ready=legacy||(to==='m40'?flags.valleyCareBoarded:['m34','m33'].includes(to)?flags.valleyCareLanded:flags.valleyMeiAwake);
     edges.set(pairKey(from,to),{from,to,locked:!ready,reason:ready?'':'先与同行人商量好下一段行程。',inferred:true,design:'authored-valley-return',...(transport?{transport,travelLabels:{m40:'乘船返回忘忧岛渡口',r_mainland_dock:'乘船前往中原码头'}}:{})});
    }
   }
   // Old chapter adjacency must not take the patient across the sea on foot
   // or past the house before both companions have been settled there.
   if(flags.valleyMeiAwake&&!flags.valleyCareSettled&&!legacy)for(const edge of edges.values()){
    if(GOOD_RETURN_PAIRS.has(pairKey(edge.from,edge.to)))continue;
    const inside=[edge.from,edge.to].filter(id=>GOOD_RETURN_MAPS.has(id));
    if(inside.length)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),...inside])],departureReason:'同行人还未在海屋安顿，先沿码头与海边的归路前行。'});
   }
  }
 }
 const current=quests[questIndex(state,quests)]?.id,flags=state.flags||{};
 if(flags.route==='evil'&&HUT_RETURN_QUESTS.has(current)){
  const night=!!flags.evilHutNightComplete||!!flags.evilLegacyHutNight;
  const report=!!flags.evilHutReportHeard||!!flags.evilLegacyHutReport;
  const home=!!flags.evilHutHomecoming||report,room=!!flags.evilHutQiangweiLeft||report;
  for(const [from,to] of HUT_RETURN_ROUTES){
   const ready=to==='r_beimo_rose_room'||to==='m50'?home:to==='r_beimo_hero_room'?room:to==='m71'?night&&report:night;
   edges.set(pairKey(from,to),{from,to,locked:false,...(!ready?{lockedFrom:[from],departureReason:to==='m71'?'先返庄听完真儿的消息，再前往摘星楼。':'先完成庄中的交谈，再沿房门继续。'}:{}),inferred:true,design:'authored-hut-return'});
  }
  for(const edge of edges.values()){
   if(HUT_RETURN_MAPS.has(edge.from)&&HUT_RETURN_MAPS.has(edge.to)&&!HUT_RETURN_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{locked:true,reason:'沿小筑、谷路和山庄的相邻道路前行。',design:'hut-return-boundary'});
   for(const inside of ['m16','m17'])if((edge.from===inside||edge.to===inside)&&!HUT_RETURN_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),inside])],departureReason:'返庄须沿小筑外的谷路前行。'});
   if(!night||!report){
    const outside=edge.from==='m71'?edge.to:edge.to==='m71'?edge.from:null;
    if(outside)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),outside])],departureReason:'先结束小筑留宿和返庄传讯，再进摘星楼救人。'});
   }
  }
 }
 if((flags.route||'good')==='good'&&!flags.cultPath&&VALLEY_DEFENSE_QUESTS.has(current)){
  const legacy=!!flags.valleyDefenseLegacy,power=!!flags.valleyPowerReceived||legacy,resolved=!!flags.valleyRescueResolved||legacy;
  for(const [from,to,transport] of VALLEY_DEFENSE_ROUTES){
   const ready=to==='r_hanbo_return'?power:to==='m16'?!!flags.valleyHanboReached||legacy:to==='m61'?resolved:['m41','m49'].includes(to)?!!flags.valleyManorReported||legacy:true;
   const reason=to==='m16'?'先在寒波谷口停步，再进小筑查访。':to==='m61'?'先进小筑确认无人，再赴摘星楼救人。':['m41','m49'].includes(to)?'先在中原码头听铁云说明山庄的变故。':'先听完孟前辈的托付，再离开落叶谷。';
   edges.set(pairKey(from,to),{from,to,locked:false,...(!ready?{lockedFrom:[from],departureReason:reason}:{}),inferred:true,design:'authored-valley-defense',...(transport?{transport,travelLabels:{m40:'乘船返回忘忧岛渡口',r_mainland_dock:'乘船前往中原码头'}}:{})});
  }
  for(const edge of edges.values()){
   if(VALLEY_DEFENSE_MAPS.has(edge.from)&&VALLEY_DEFENSE_MAPS.has(edge.to)&&!VALLEY_DEFENSE_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{locked:true,reason:'沿码头、山庄、落叶谷与寒波谷的相邻道路前行。',design:'valley-defense-boundary'});
   for(const inside of ['m60','m31','m40','r_mainland_dock','m16'])if((edge.from===inside||edge.to===inside)&&!VALLEY_DEFENSE_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),inside])],departureReason:'先沿当前营救行程的相邻道路前行。'});
   if((edge.from==='m16'||edge.to==='m16')&&!VALLEY_DEFENSE_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{locked:true,reason:'这次查访须从寒波谷归途进入小筑。',design:'valley-hut-boundary'});
   if(!power&&!['g14_dock_report','g14_manor_battle'].includes(current)){
    const inside=[edge.from,edge.to].filter(id=>LEAF_COURT.has(id));
    if(inside.length===1)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),inside[0]])],departureReason:'先接受孟前辈的托付，再离开谷中。'});
   }
   if(!resolved){const outside=edge.from==='m61'?edge.to:edge.to==='m61'?edge.from:null;if(outside)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),outside])],departureReason:'先在寒波谷理清行程，再进摘星楼救人。'});}
   if(current==='g14_manor_battle'&&!flags.manorInvadersCleared&&(state.phase==='battle'||flags.staged_g14_manor_battle)&&(edge.from==='m49'||edge.to==='m49'))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),'m49'])],departureReason:'山庄出口被来敌封住，必须清除全部来敌。'});
  }
 }
 if((flags.route||'good')==='good'&&!flags.cultPath){
  const legacy=!!flags.goodForbiddenLegacy,active=GOOD_FORBIDDEN_QUESTS.has(current);
  const testimony=!!flags.goodTestimonyHeard||!!flags.goodForbiddenLegacyTestimony;
  const known=legacy||testimony||active;
  if(known){
   const house=legacy||flags.goodForbiddenHutChecked,cleared=legacy||flags.goodForbiddenEntryCleared,captured=legacy||flags.goodForbiddenCaptured;
   const lockFrom=(edge,from,reason)=>Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),from])],departureReason:reason});
   for(const [from,to,transport] of GOOD_FORBIDDEN_ROUTES){
    // After this chapter, its shared roads must retain later quest gates.
    if(!active&&edges.has(pairKey(from,to)))continue;
    const edge={from,to,locked:false,inferred:true,design:'authored-good-forbidden',...(transport?{transport,travelLabels:{m40:'乘船返回忘忧岛渡口',r_mainland_dock:'乘船前往中原码头'}}:{})};
    if(active&&!legacy){
     if(from==='m59'&&!testimony)lockFrom(edge,from,'先听完镇中的证词，再动身返岛。');
     if(to==='m40'&&transport&&!testimony)lockFrom(edge,from,'先在惠安镇听取消息，再搭船返岛。');
     if(transport&&!flags.goodForbiddenReturnReady)lockFrom(edge,'m40','先找到同行人并办妥返程，再请船夫渡海。');
     if(to==='r_good_forbidden_path'&&!house)lockFrom(edge,from,'海边小屋尚未查过，先去那里寻找真儿与眉儿。');
     if(to==='m60'&&!house)lockFrom(edge,from,'先检查海边空屋，才知是否需要深入禁地。');
     if(to==='r_good_forbidden_first'&&!cleared)lockFrom(edge,from,'守卫仍封着内门，须清除全部来敌。');
     if(to==='m60'&&cleared&&!captured)lockFrom(edge,'m60','先完成禁地中的寻人与返程交涉。');
     if((from==='m60'||to==='m60')&&((current==='g13_entry'&&!cleared&&(state.phase==='battle'||flags.staged_g13_entry))||(current==='g13'&&flags.goodForbiddenReunited&&!captured)))lockFrom(edge,'m60','外场出口已被封住，当前战事尚未了结。');
    }
    edges.set(pairKey(from,to),edge);
   }
   if(active)for(const edge of edges.values()){
    const pair=pairKey(edge.from,edge.to);
    if(!GOOD_FORBIDDEN_PAIRS.has(pair)&&[edge.from,edge.to].some(id=>GOOD_FORBIDDEN_MAPS.has(id))){
     // Arrival at the testimony is allowed; once it ends, all chapter travel
     // must use actual adjoining island layers and the named boat crossing.
     if(current==='g12'&&!testimony&&!GOOD_FORBIDDEN_INNER.has(edge.from)&&!GOOD_FORBIDDEN_INNER.has(edge.to)&&edge.from!=='m60'&&edge.to!=='m60')continue;
     Object.assign(edge,{locked:true,reason:'沿海边、村路与禁地各层的实际出入口前行。',design:'good-forbidden-boundary'});
    }
   }
  }
 }
 // Underground combat is intentionally not an all-clear prerequisite. The
 // actor release owns rescue; the actual return doorway owns departure.
 if((flags.route||'good')==='good'&&!flags.cultPath){
  const active=GOOD_RESCUE_QUESTS.has(current),legacy=!!flags.goodRescueLegacy;
  const settled=!!flags.goodRescueZiSettled||!!flags.goodRescueLegacyZiSettled||legacy,freed=!!flags.goodRescueZiFreed||settled,hall=!!flags.goodRescueHallCleared||freed;
  const departed=!!flags.goodRescueMeiDeparted||!!flags.goodRescueLegacyMeiDeparted||legacy,manor=!!flags.goodRescueManorCleared||legacy,fort=!!flags.goodRescueFortCleared||legacy;
  if(active||hall||freed||settled){
   for(const [from,to] of GOOD_RESCUE_ROUTES){
    const edge={from,to,locked:false,inferred:true,design:'authored-good-rescue'};
    const lock=(id,reason)=>Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),id],departureReason:reason});
    if(to==='r_good_dungeon'){
     if(!hall)lock('m61','厅中来敌仍未退尽，地下入口尚不能通行。');
     if(!freed&&!flags.staged_g16)lock('r_good_dungeon','先找到紫轩，与她说好一起离开，再返回楼中。');
    }
    if(from==='m61'&&to==='r_good_yitian'&&!freed)lock('m61','紫轩还没有离开地下牢房，先去接她。');
    edges.set(pairKey(from,to),edge);
   }
   if(settled)for(const [from,to] of GOOD_RESCUE_DEPARTURE)edges.set(pairKey(from,to),{from,to,locked:false,inferred:true,design:'authored-good-rescue-departure'});
   for(const [from,to] of GOOD_RESCUE_TOWER_ROUTE){
    const edge={from,to,locked:false,inferred:true,design:'authored-good-rescue-tower-road'};
    if((from==='m49'||to==='m54')&&!manor)Object.assign(edge,{lockedFrom:[from],departureReason:'先击退山庄里新来的伏兵，再往飞龙堡赶路。'});
    if(from==='m54'&&!fort)Object.assign(edge,{lockedFrom:[from],departureReason:'堡后的通路仍被封住，须击退堡内全部来敌。'});
    edges.set(pairKey(from,to),edge);
   }
   if(current==='g17'&&!departed)for(const edge of edges.values()){
    if(edge.from==='r_hanbo_return'||edge.to==='r_hanbo_return'){const other=edge.from==='r_hanbo_return'?edge.to:edge.from;if(!['r_good_hanbo_road','r_good_hanbo_hut','r_good_yitian'].includes(other))Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),'r_hanbo_return'],departureReason:'出谷去惠安须沿谷外山路前行。'});}
   }
   if(active)for(const edge of edges.values()){
    const endpoints=[edge.from,edge.to];
    if(!GOOD_RESCUE_TOWER_PAIRS.has(pairKey(edge.from,edge.to))&&!endpoints.every(id=>/^m6[2-9]$/.test(id))&&endpoints.some(id=>['m54','m62'].includes(id)))Object.assign(edge,{locked:true,reason:'沿敦煌洞口、堡前山径与堡后沙地逐段前行。'});
    const battleMap=current==='g17'?'m41':current==='g17_manor'?'m49':current==='g18'?'m54':null;
    const won=current==='g17'?departed:current==='g17_manor'?manor:fort;
    const underway=state.phase==='battle'||flags['staged_'+current];
    if(battleMap&&!won&&underway&&endpoints.includes(battleMap))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),battleMap])],departureReason:'来敌仍封住去路，当前战事尚未了结。'});
    if(current==='g17_departure'&&!departed&&endpoints.includes('m41'))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),'m41'])],departureReason:'先听完眉儿带来的消息，目送她离开险地。'});
   }
   if(active&&!settled)for(const edge of edges.values()){
    if(GOOD_RESCUE_PAIRS.has(pairKey(edge.from,edge.to)))continue;
    const inside=[edge.from,edge.to].filter(id=>GOOD_RESCUE_CORE.has(id));
    if(inside.length)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),...inside])],departureReason:'沿地下牢房、倚天山与寒波谷的归路，先把紫轩安置妥当。'});
   }
  }
 }
 // The good-route stair scripts have no clear-all or sheep-skin gate.
 // Current enemies and their persistence belong to the tower encounter runtime.
 if((flags.route||'good')==='good'&&!flags.cultPath){
  const towerStart=quests.find(q=>q.id==='gTower1');
  const towerKnown=!!towerStart&&questIndex(state,quests)>=quests.indexOf(towerStart);
  if(towerKnown){
   edges.set(pairKey('m49','m51'),{from:'m49',to:'m51',locked:false,inferred:true,design:'authored-good-tower-valley-road'});
   for(const [from,to] of GOOD_TOWER_ROUTES)edges.set(pairKey(from,to),{from,to,locked:false,inferred:true,design:'authored-good-tower-stairs'});
   // Preserve the real lower-floor/desert exit for old tower cursors without
   // fabricating earlier wins. The corridor itself remains a walked journey.
   for(const [from,to] of GOOD_RESCUE_TOWER_ROUTE)edges.set(pairKey(from,to),{from,to,locked:false,inferred:true,design:'authored-good-tower-return'});
   if((current==='g19_departure'||flags.goodTowerRoseFreed)&&!flags.goodTowerDepartureReady&&!flags.goodTowerLegacyDeparture)for(const edge of edges.values())if(edge.from==='m69'||edge.to==='m69')Object.assign(edge,{lockedFrom:[...(edge.lockedFrom||[]),'m69'],departureReason:'先与蔷薇说好回谷的事，再一道下塔。'});
   for(const edge of edges.values())if([edge.from,edge.to].some(id=>GOOD_TOWER_CORRIDOR.has(id))&&!GOOD_TOWER_PAIRS.has(pairKey(edge.from,edge.to)))Object.assign(edge,{locked:true,reason:'塔内须沿楼梯上下，出塔后循沙漠与来时山路返回。',design:'good-tower-physical-boundary'});
  }
 }
 // The original late-valley coordinates are independently split into a
 // courtyard, two rooms and a memorial. Leaving either room remains safe for
 // historical saves; the sealed valley cannot bypass the night's outcome.
 if((flags.route||'good')==='good'&&!flags.cultPath){
  const late=flags.goodTowerHomecoming||flags.goodTowerLegacyNight||flags.goodTowerValleyLegacy||current==='g19_return'||current==='g19_burial'||current==='g20_escort'||current==='g20'||current?.startsWith('g20_');
  if(late){
   const buried=flags.goodTowerHomecoming||flags.goodTowerLegacyMengBuried||flags.goodTowerLegacyNight||flags.goodTowerValleyLegacy;
   for(const [from,to] of GOOD_VALLEY_ROUTES)edges.set(pairKey(from,to),{from,to,locked:false,...(to==='r_leaf_memorial'&&!buried?{lockedFrom:[from],departureReason:'先回院中看望孟前辈，再往谷中静处。'}:{}),inferred:true,design:'authored-good-valley-night'});
   edges.set(pairKey('m49','m51'),{from:'m49',to:'m51',locked:false,inferred:true,design:'authored-good-valley-return'});
   for(const edge of edges.values()){
    const other=edge.from==='m51'?edge.to:edge.to==='m51'?edge.from:null;
    if(other&&!['m49','r_leaf_memorial','r_leaf_hero_room','r_leaf_rose_room'].includes(other))Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),'m51'])],departureReason:'沿前院石阶出谷，房后的旧路已不便通行。'});
   }
   if((flags.goodTowerHomecoming||flags.goodTowerLegacyNight)&&!flags.goodRoseNightComplete&&!flags.goodRoseBuried&&!flags.goodTowerValleyLegacy)for(const edge of edges.values()){
    const inside=[edge.from,edge.to].filter(id=>GOOD_VALLEY_MAPS.has(id));
    if(inside.length===1)Object.assign(edge,{lockedFrom:[...new Set([...(edge.lockedFrom||[]),inside[0]])],departureReason:'谷中的后事与夜间交谈尚未了结，先留在谷内。'});
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
  for(const [a,b] of [...OPENING,...SIDE_ROUTES,...EVIL_ROUTES,...FORBIDDEN_ROUTES,...DOCK_ROUTES,...MANOR_ROUTES,...LEAF_ROUTES,...GOOD_RETURN_ROUTES,...HUT_RETURN_ROUTES,...VALLEY_DEFENSE_ROUTES,...GOOD_FORBIDDEN_ROUTES,...GOOD_RESCUE_ROUTES,...GOOD_RESCUE_DEPARTURE,...GOOD_RESCUE_TOWER_ROUTE,...GOOD_TOWER_ROUTES,...GOOD_VALLEY_ROUTES])add(a,b);
  addPossibleItineraryEdges(quests,add);
  cached={signature,byMap};neighborCache.set(quests,cached);
 }
 return [...(cached.byMap.get(mapId)||[])];
}

/** Directional exit descriptors. Coordinates live in getScene(...).portals[to]. */
export function exitsFor(mapId,state={},quests=[]){
 return routeEdges(state,quests).filter(e=>e.from===mapId||e.to===mapId).map(e=>{
  const to=e.from===mapId?e.to:e.from;
  return {...e,locked:!!e.locked||!!e.lockedFrom?.includes(mapId),reason:e.lockedFrom?.includes(mapId)?e.departureReason:e.reason,id:`route:${mapId}:${to}`,to,exitKey:to,entryKey:mapId,label:ROUTE_MAPS[to]?.name||to,...(e.transport==='boat'?{travelLabel:e.travelLabels?.[to]||(to==='m40'?'乘船前往忘忧岛渡口':'乘船返回倚天山渡头')}:{})};
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
   if(!next||seen.has(next)||edge.lockedFrom?.includes(here))continue;
   const candidate=[...route,next];if(next===to)return candidate;
   seen.add(next);queue.push(candidate);
  }
 }
 return [];
}
