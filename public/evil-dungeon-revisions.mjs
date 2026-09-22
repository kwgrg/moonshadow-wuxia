// Independent implementation from read-only event verification, never imported content.
const sources=['https://vv0817.neocities.org/gametxt/15_jxqysp','https://www.nbegame.com/post/11646.html'];
const evidence=detail=>({sources,source:'2026-09-22 原版只读内存静态核验及攻略交叉核对：'+detail+'；详见 docs/evil-dungeon-reference.md。对白、位置、镜头、时长与数值均为网页独立表现，未作原版实机验证。',revised:true,dialogueStatus:'independently-authored-from-verified-mechanics',referencePolicy:'reference-only-no-original-content'});
const q=(id,title,map,npc,objective,requiredFlags,rewards,extra={})=>({id,title,map,npc,sprite:npc==='纳兰潜凛'?3:1,objective,type:'talk',act:'卷八 · 霸业歧途',when:{route:'evil'},xp:0,money:0,before:[],after:[],requiredFlags,rewards,requirementText:'先完成眼前的会面与行程，再继续前行。',...evidence('地牢分支后回楼、夜谈、次日辞行，经山路和渡口返忘忧岛海边'),...extra});
export const EVIL_DUNGEON_REVISIONS={
 e05:{hideCompanion:true,rewards:{companion:null}},
 e06:{...evidence('拒绝动手由蔷薇撞墙身亡；听命时由影枫出手；真儿在返回楼内之后才出现'),map:'r_evil_dungeon',x:720,y:500,requireStaging:true,hideCompanion:true,xp:0,money:0,before:[],after:[],rewards:{},choice:{prompt:'纳兰潜凛以你的性命相胁，要你向蔷薇下手。',options:[
  {text:'拒绝动手',effects:{evil:-3,companion:null,flags:{evilQiangweiDecision:true,evilQiangweiRefuse:true,evilQiangweiKill:false}},after:[]},
  {text:'听从胁迫',effects:{evil:3,companion:null,flags:{evilQiangweiDecision:true,evilQiangweiKill:true,evilQiangweiRefuse:false}},after:[]}
 ]}},
 e07:{npc:'真儿的身影',sprite:1,choiceSpeaker:'月眉儿',choiceSprite:2,objective:'追查禁地中的身影，弄清来人的身份',hideCompanion:true,requiredFlags:['evilZhenMissing'],requirementText:'先完成回岛行程，在海边歇息后再追查真儿的去向。',rewards:{companion:'月眉儿'},before:[
 ['江湖纪事','影枫从海边起身，循着那道熟悉的身影，经过村落，追进禁地深处。',0],
 ['江湖纪事','那人用两半玉佩开启密门，读起屋中的旧信。',0],
 ['杨影枫','真儿只有半块玉佩。你手里的另一半从哪里来？',0],
 ['江湖纪事','那人放下书信，揭去了假面，露出月眉儿的面容。',0],
 ['月眉儿','这封信竟说，真儿与我是亲姐妹……既然被你看见，我也不再隐瞒。',2],
 ['江湖纪事','影枫还未问清真儿的下落，月眉儿已转身出手。',0]
 ]}
};
export const EVIL_DUNGEON_ADDITIONS=[{beforeId:'e07',quests:[
 q('e06_kill','从命举剑','r_evil_dungeon','蔷薇','承受自己答复带来的后果',['evilQiangweiDecision','evilQiangweiKill'],{flags:{evilQiangweiDead:true}},{when:{route:'evil',flag:'evilQiangweiKill'},requireStaging:true,hideCompanion:true}),
 q('e06_refuse','拒命惊变','r_evil_dungeon','蔷薇','拦下逼近的纳兰潜凛',['evilQiangweiDecision','evilQiangweiRefuse'],{flags:{evilQiangweiDead:true}},{when:{route:'evil',flag:'evilQiangweiRefuse'},requireStaging:true,hideCompanion:true}),
 q('e06_aftermath','楼内旧事','m71','纳兰潜凛','离开地牢，回楼内听取旧事',['evilQiangweiDead'],{flags:{evilFamilyHeard:true}},{requireStaging:true,hideCompanion:true}),
 q('e06_night','长夜难眠','r_evil_chamber','纳兰真','到客房歇息，回应夜间来访',['evilFamilyHeard'],{flags:{evilNightPassed:true}},{requireStaging:true,hideCompanion:true,sceneLight:'night'}),
 q('e06_escort','辞楼归岛','m71','纳兰潜凛','次日返回厅内辞行，陪真儿下山',['evilNightPassed'],{companion:'纳兰真',flags:{evilEscortStarted:true}},{requireStaging:true,hideCompanion:true,sceneLight:'day'}),
 q('e06_ferry','山下候渡','r_evil_ferry','船夫','陪真儿走下倚天山，到渡口问船',['evilEscortStarted'],{flags:{evilFerryReady:true}},{sprite:0,before:[['船夫','往忘忧岛的船就在岸边。两位若已准备好，便到栈边上船。',0],['杨影枫','走吧，真儿。我陪你回去。',0]],after:[['江湖纪事','船夫解开系索，等候二人登船。',0]]}),
 q('e06_landing','忘忧泊岸','m40','纳兰真','乘船抵达忘忧岛，再走向海边',['evilFerryReady'],{flags:{evilIslandArrived:true}},{before:[['纳兰真','到了。先去海边坐一会儿吧。',1],['杨影枫','好。我也想歇一歇。',0]]}),
 q('e06_rest','海边梦醒','m34','纳兰真','在海边歇息，醒后寻找真儿',['evilIslandArrived'],{companion:null,flags:{evilZhenMissing:true}},{requireStaging:true,hideCompanion:false,after:[['杨影枫','真儿？方才还在这里……去村里找找。',0]]})
]}];
