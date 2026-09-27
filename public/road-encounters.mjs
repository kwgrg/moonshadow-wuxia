// Reference establishes cast/count and open exits only. Balance, local aggro,
// persistent wounds and one receipt per actor are independent web adaptations.
const army=(prefix,count,kind)=>Array.from({length:count},(_,i)=>({
 id:prefix+'-'+String(i+1).padStart(2,'0'),name:kind==='eagle'?'苍鹰':'无忧教男教徒',kind,
 maxHp:kind==='eagle'?150:360,tier:kind==='eagle'?8:11,role:'sword',sprite:3,
 npcCell:kind==='eagle'?null:6,boss:false,road:true,
 aggroRadius:kind==='eagle'?200:230,leashRadius:kind==='eagle'?330:370,
 speed:kind==='eagle'?115:82,reward:{coins:kind==='eagle'?3:10,xp:kind==='eagle'?8:18,kills:1}
}));
export const ROAD_ENCOUNTERS={
 r_good_manor_outer:{id:'r_good_manor_outer',quests:['g23','g23_reunion'],enemies:army('medicine-outer',12,'cultist')},
 r_good_huian_pass:{id:'r_good_huian_pass',quests:['g23','g23_reunion'],enemies:army('medicine-pass',25,'cultist')},
 r_good_medicine_edge:{id:'r_good_medicine_edge',quests:['g21'],enemies:army('medicine-eagle',30,'eagle')}
};
export function roadEncounter(state,questId,map=state.map){
 const d=ROAD_ENCOUNTERS[map];return !state.completed&&state.flags.route==='good'&&!state.flags.forsake&&!state.flags.cultPath&&d?.quests.includes(questId)?d:null;
}
export const roadClaimKey=(map,id)=>map+'|'+id;
