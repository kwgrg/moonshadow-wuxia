// Reference-only mechanics; all wording and presentation are independently authored.
const evidence={sources:['https://vv0817.neocities.org/gametxt/15_jxqysp'],revised:true,referencePolicy:'reference-only-no-original-content',dialogueStatus:'independently-authored-from-verified-mechanics',source:'只读内存核验：村落身影、禁地入口、一二三层、密室读信后揭面。详见 docs/forbidden-pursuit-reference.md。步行连接、坐标和跟随等待为网页原创设计；没有核验到追丢超时失败。'};
const task=(id,title,map,requiredFlags,rewards,extra={})=>({id,title,map,npc:'真儿的身影',sprite:1,objective:'循着身影继续前行',type:'pursuit',pursuit:true,when:{route:'evil'},act:'卷八 · 霸业歧途',hideCompanion:true,xp:0,money:0,before:[['杨影枫','那道身影还在前面，跟过去看看。',0]],after:[],requiredFlags,rewards:{flags:rewards},requirementText:'先循眼前的线索前行。',...evidence,...extra});
export const FORBIDDEN_REVISIONS={
 e06_night:{npc:'杨影枫',objective:'梦醒后离开客房，去寻找真儿',rewards:{flags:{evilDreamEnded:true}}},
 e07:{title:'密室旧信',stagedNpc:'月眉儿',stagedSprite:2,objective:'进入密室，查看那人读信后的反应',before:[],after:[],requireStaging:true,legacyStagingFlag:'evilLegacyReveal',requiredFlags:['evilZhenMissing','evilGateOpened'],requirementText:'先循身影穿过禁地各层，等石门开启后入室。',...evidence}
};
export const FORBIDDEN_ADDITIONS=[{beforeId:'e06_escort',quests:[task('e06_night_visit','夜中寻人','m71',['evilDreamEnded'],{evilNightPassed:true},{npc:'纳兰真',objective:'离开客房，在楼内找到真儿交谈',type:'talk',pursuit:undefined,requireStaging:true,before:[],sceneLight:'night'})]},
 {beforeId:'e07',quests:[
 task('e07_village','村路惊鸿','m31',['evilZhenMissing'],{evilTrailVillage:true},{objective:'去村南寻找真儿，跟随那道身影'}),
 task('e07_approach','林径寻踪','r_forbidden_path',['evilTrailVillage'],{evilTrailApproach:true}),
 task('e07_entry','禁地入口','r_forbidden_entry',['evilTrailApproach'],{evilTrailEntry:true}),
 task('e07_first','禁地一层','r_forbidden_first',['evilTrailEntry'],{evilTrailFirst:true}),
 task('e07_second','幽潭石径','r_forbidden_second',['evilTrailFirst'],{evilTrailSecond:true}),
 task('e07_gate','双玉石门','r_forbidden_gate',['evilTrailSecond'],{evilGateOpened:true},{objective:'观察身影开启两侧石柱，待门开后跟入',type:'talk',pursuit:undefined,requireStaging:true,before:[]})
 ]}];
