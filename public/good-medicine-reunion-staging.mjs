// Independently written dialogue, movement and scene presentation.
// All coordinates refer to project paintings; the reference directory is never used at runtime.
const move=(actor,x,y,speed=100)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.6)=>({type:'pose',actor,pose:value,duration});
const cue=(key,value)=>({type:'cue',key,value});
const fade=value=>cue('dreamFade',value);
const light=value=>cue('valleyCareLight',value);
const wait=(duration=.7)=>({type:'wait',duration});
const hide=actor=>({type:'hide',actor});
const show=actor=>({type:'show',actor});
const scene=(key,x,y)=>({type:'scene',scene:key,hero:{x,y,direction:1}});
const person=(id,name,sprite,x,y,extra={})=>({id,name,sprite,x,y,sceneKey:null,direction:-1,pose:'stand',...extra});
const rose=(id,x,y,extra={})=>person(id,'蔷薇',1,x,y,{npcCell:7,...extra});
const zhen=(id,x,y,extra={})=>person(id,'纳兰真',1,x,y,extra);
const zi=(id,x,y,extra={})=>person(id,'紫轩',2,x,y,{npcCell:null,...extra});
const mei=(id,x,y,extra={})=>person(id,'月眉儿',2,x,y,{npcCell:null,...extra});
const nalan=(extra={})=>person('medicine-nalan','纳兰潜凛',3,1175,730,{npcCell:3,...extra});
const atScene=(key,extra={})=>({sceneKey:key,hidden:true,...extra});
const stage=(map,label,point,actors,steps,extra={})=>({map,label,pointOnly:true,startPoint:{x:point[0],y:point[1]},actors,props:[],finalActors:actors.map(a=>({...a})),finalCues:{dreamFade:'in'},steps:[...steps,{type:'release'}],...extra});
const when=(steps,condition)=>steps.map(step=>({...step,when:condition}));
const infirmary='goodMedicineInfirmary',garden='goodMedicineGarden',zhenRoom='goodMedicineZhenRoom',heroRoom='goodMedicineHeroRoom',memorial='goodMedicineMemorial';
const sleepingRose=()=>rose('medicine-resting-rose',1080,575,{pose:'ill',interactive:false});
const reunionActors=()=>[
 zhen('medicine-zhen',900,580),rose('medicine-rose',1020,595),mei('medicine-mei',1175,730),
 zi('medicine-zi',900,700,{hidden:true,when:{flag:'goodFirstZi'}}),nalan({x:1175,y:650,hidden:true}),
];
export const GOOD_MEDICINE_REUNION_STAGING={
 g21:stage('m23','诊院问医',[850,680],[
  rose('medicine-rose',930,570,{pose:'sit',groundSeated:true}),person('medicine-doctor','胡神医',0,1090,485),
 ],[
  move('hero',850,680),face('hero','medicine-doctor'),face('medicine-doctor','medicine-rose'),
  say('hero',[['杨影枫','胡神医，她中了毒。一路赶来，只盼你还有办法。',0],['胡神医','先让她歇稳，我看看脉息。',0]]),
  pose('medicine-rose','sit'),pose('medicine-doctor','kneel'),wait(1.3),
  say('medicine-doctor',[['胡神医','这毒来得古怪，眼下我手里的药只能缓一时，不能根除。',0],['杨影枫','难道就没有别的办法了？',0],['胡神医','要解这毒，还是得找到下毒之人的解药。别在这里白白耗尽她的气力。',0]]),
  pose('medicine-doctor','stand'),face('hero','medicine-rose'),
  say('hero',[['杨影枫','蔷薇，我们先回悲魔山庄。真儿若有消息，也会到那里找我们。',0],['蔷薇','我还能走……你扶着我。',1]]),
  pose('medicine-rose','stand'),move('hero',790,810,85),move('medicine-rose',850,680,65),hide('medicine-rose'),fade('out'),wait(.65),
 ],{finalActors:[person('medicine-doctor','胡神医',0,1090,485)],finalCues:{dreamFade:'out'}}),
 g21_return:stage('m49','归庄得到解药',[760,700],[
  zhen('medicine-zhen',900,580),rose('medicine-rose',850,780),
  rose('patient',1080,575,atScene(infirmary,{pose:'sit',interactive:false})),zhen('medicine-bed-zhen',840,620,atScene(infirmary)),
  zhen('medicine-garden-zhen',910,590,atScene(garden)),zhen('medicine-room-zhen',930,520,atScene(zhenRoom)),
 ],[
  fade('in'),move('hero',760,700),face('medicine-zhen','hero'),face('hero','medicine-zhen'),
  say('medicine-zhen',[['纳兰真','你们总算回来了！解药我已经带到，先让蔷薇服下。',1],['杨影枫','真儿……我们刚从药王谷回来。胡神医也解不了这毒。',0],['纳兰真','有话待会儿说。她撑了这么久，先到里面躺下。',1]]),
  move('medicine-zhen',1020,595),move('hero',900,580),fade('out'),wait(.7),hide('medicine-zhen'),hide('medicine-rose'),
  scene(infirmary,850,720),show('patient'),show('medicine-bed-zhen'),cue('medicine','ready'),fade('in'),
  face('medicine-bed-zhen','patient'),say('medicine-bed-zhen',[['纳兰真','慢慢喝，不急。我在这里扶着你。',1]]),cue('medicine','served'),wait(1.5),pose('patient','ill'),
  say('hero',[['江湖纪事','蔷薇服下解药，紧绷的身体渐渐放松，终于安稳睡去。',0],['杨影枫','她睡着了……真儿，谢谢你。',0],['纳兰真','让她好好歇息。我们到园里说，不要吵醒她。',1]]),
  fade('out'),wait(.7),hide('medicine-bed-zhen'),scene(garden,760,650),show('medicine-garden-zhen'),fade('in'),face('hero','medicine-garden-zhen'),
  say('medicine-garden-zhen',[['杨影枫','这解药是从你父亲那里得来的？',0],['纳兰真','是。我知道你还有许多事想问，可我更担心的是你们能不能平安。',1],['杨影枫','一路争胜，到了今日，反倒只想让大家安安稳稳活着。',0],['纳兰真','那就把这些话记住。紫轩和眉儿，也都还在等你的消息。',1],['杨影枫','等蔷薇缓过来，我会去见她们。',0]]),
  light('night'),wait(.8),say('medicine-garden-zhen',[['纳兰真','天色已晚，我先回房。你稍后再看看蔷薇，好吗？',1],['杨影枫','好，我先送你过去。',0]]),
  move('medicine-garden-zhen',1020,480,85),move('hero',805,645,90),move('hero',1020,480,90),fade('out'),wait(.65),hide('medicine-garden-zhen'),
  scene(zhenRoom,850,650),show('medicine-room-zhen'),fade('in'),face('hero','medicine-room-zhen'),
  say('medicine-room-zhen',[['纳兰真','我到了。你去吧，蔷薇醒来若找不到人，会担心的。',1],['杨影枫','你也歇一歇。这一路，你为我们做得太多了。',0]]),
  move('medicine-room-zhen',1000,500,85),move('hero',750,780,90),fade('out'),wait(.6),hide('medicine-room-zhen'),scene(null,760,700),fade('in'),
 ],{auto:true,sceneKeys:[infirmary,garden,zhenRoom],props:[{id:'medicine-antidote-bowl',kind:'medicineBowl',actor:'medicine-bed-zhen',sceneKey:infirmary}],finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'night',medicine:'served'}}),
 g21_visit:stage('r_good_manor_infirmary','亲自探看蔷薇',[850,720],[sleepingRose()],[
  light('night'),move('hero',850,720),face('hero','medicine-resting-rose'),pose('hero','kneel'),wait(1),
  say('hero',[['杨影枫','呼吸比方才平稳多了。解药总算起了作用。',0],['江湖纪事','蔷薇仍在熟睡。影枫替她理好被角，轻轻退开。',0],['杨影枫','先不吵她。回去告诉真儿，也让她放心。',0]]),pose('hero','stand'),
 ],{finalCues:{dreamFade:'in',valleyCareLight:'night'},persistFor:['g22','g22_rest']}),
 g22:stage('r_good_manor_zhen_room','夜游后送真儿回房',[850,650],[
  zhen('medicine-zhen',930,520),zhen('medicine-walk-zhen',910,590,atScene(garden)),
 ],[
  light('night'),move('hero',850,650),face('hero','medicine-zhen'),
  say('hero',[['杨影枫','蔷薇睡得很稳，你可以放心了。',0],['纳兰真','那就好。你若还不累，陪我到园里走走吧。',1]]),
  move('medicine-zhen',750,780,85),fade('out'),wait(.6),hide('medicine-zhen'),scene(garden,760,650),show('medicine-walk-zhen'),fade('in'),
  move('hero',805,645,85),face('hero','medicine-walk-zhen'),face('medicine-walk-zhen','hero'),
  say('medicine-walk-zhen',[['纳兰真','小时候，我总想知道山庄外面是什么模样。如今走过这么多地方，却开始想念安静的日子。',1],['杨影枫','我从前只想证明手里的剑，后来才知道，赢下一场比试并不能留下谁。',0],['纳兰真','若有一天，我们都能放下这些，就找个不必争斗的地方住下。',1],['杨影枫','到那时候，连夜里也能睡得安稳些。',0]]),wait(.8),
  say('medicine-walk-zhen',[['纳兰真','夜深了，送我回去吧。还有一句话，我想问你。',1]]),move('medicine-walk-zhen',1020,480,85),move('hero',1020,480,90),fade('out'),wait(.6),hide('medicine-walk-zhen'),
  scene(null,850,650),show('medicine-zhen'),move('medicine-zhen',930,520,85),fade('in'),move('hero',875,610,80),face('hero','medicine-zhen'),
  say('medicine-zhen',[['纳兰真','我说的那些安静日子，是想和你一起过。影枫，你明白我的心意吗？',1]]),
 ],{sceneKeys:[garden],finalActors:[zhen('medicine-zhen',930,520)],finalCues:{dreamFade:'in',valleyCareLight:'night'}}),
 g22_rest:stage('r_good_manor_zhen_room','夜尽天明',[875,610],[
  zhen('medicine-zhen',930,520),zhen('medicine-morning-zhen',760,810,atScene(heroRoom)),
 ],[
  light('night'),
  ...when([
   face('hero','medicine-zhen'),say('hero',[['杨影枫','今晚就在这里陪你。等天亮，再把未了的事一件件办妥。',0]]),pose('hero','sit'),pose('medicine-zhen','sit'),fade('out'),wait(1.5),light('day'),pose('hero','stand'),pose('medicine-zhen','stand'),fade('in'),
   say('medicine-zhen',[['纳兰真','天亮了。蔷薇大概也醒了，我们一起去看看她。',1]]),
  ],{flag:'goodMedicineUnderstood'}),
  ...when([
   say('medicine-zhen',[['纳兰真','你也累了，先回房休息。明日的事，明日再说。',1]]),move('hero',750,780,90),fade('out'),wait(.6),hide('medicine-zhen'),scene(heroRoom,760,810),move('hero',620,450,90),pose('hero','sit'),fade('in'),
   say('hero',[['杨影枫','她的心意我并非不懂，只是还有太多牵挂，没能说清。',0]]),fade('out'),wait(1.4),light('day'),pose('hero','stand'),move('hero',690,535,85),fade('in'),show('medicine-morning-zhen'),
   say('medicine-morning-zhen',[['纳兰真','已经天亮了。醒了就一同去看看蔷薇吧。',1],['杨影枫','好，我这就来。',0]]),fade('out'),wait(.6),hide('medicine-morning-zhen'),scene(null,850,650),show('medicine-zhen'),fade('in'),
  ],{not:'goodMedicineUnderstood'}),
  hide('medicine-zhen'),
 ],{auto:true,sceneKeys:[heroRoom],finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day'}}),
 g22_dawn:stage('r_good_manor_infirmary','天明问安与辞行',[850,720],[
  rose('medicine-rose',1080,575,{pose:'sit'}),zhen('medicine-zhen',840,620),
 ],[
  light('day'),move('hero',850,720),face('hero','medicine-rose'),face('medicine-rose','hero'),
  say('medicine-rose',[['蔷薇','你们都在啊。我这一觉，像睡了很久。',1],['纳兰真','醒来就好。今日再歇一歇，不必急着走动。',1],['杨影枫','见你精神好些，我终于放心了。',0],['蔷薇','别只顾着我。紫轩和眉儿还不知道我们平安，你该去看看她们。',1],['杨影枫','我正有这个打算。等大家见了面，再商量今后的日子。',0],['纳兰真','我留在庄里陪蔷薇。路上小心，我们等你回来。',1]]),
  move('hero',820,810,95),
 ],{finalActors:[rose('medicine-rose',1080,575,{pose:'sit'}),zhen('medicine-zhen',840,620)],finalCues:{dreamFade:'in',valleyCareLight:'day'},persistFor:['g23','g23_pickup','g23_farewell']}),
 g23_pickup:stage('m16','在小筑接上眉儿',[760,700],[zi('medicine-zi',930,575),mei('medicine-mei',1080,660)],[
  move('hero',760,700),face('hero','medicine-mei'),face('medicine-zi','medicine-mei'),
  say('medicine-mei',[['月眉儿','你们说完了？我把要带的东西都理好了。',2],['杨影枫','眉儿，一起回悲魔山庄吧。真儿和蔷薇还在等我们。',0],['月眉儿','好。只要大家平平安安，去哪里都一样。',2],['紫轩','那便一起走吧。路上还有许多话，可以慢慢说。',2]]),
  move('hero',760,810),move('medicine-mei',760,700,85),hide('medicine-mei'),hide('medicine-zi'),fade('out'),wait(.6),
 ],{finalActors:[],finalCues:{dreamFade:'out'}}),
 g23_farewell:stage('m16','在小筑向紫轩辞行',[760,700],[zi('medicine-zi',930,575),mei('medicine-mei',1080,660)],[
  move('hero',760,700),face('hero','medicine-zi'),face('medicine-mei','medicine-zi'),
  say('hero',[['杨影枫','紫轩，你当真决定留下？',0],['紫轩','这里清静，我想再住些日子。你不必替我作决定。',2],['月眉儿','我们会记着你的。若你想来，随时给我们送个消息。',2],['紫轩','我知道。一路小心，也替我向真儿和蔷薇问好。',2],['杨影枫','你也保重。我们先走了。',0]]),
  move('hero',760,810,85),move('medicine-mei',760,700,85),hide('medicine-mei'),face('medicine-zi','hero'),wait(.6),fade('out'),wait(.6),
 ],{finalActors:[zi('medicine-zi',930,575)],finalCues:{dreamFade:'out'}}),
 g23_reunion:stage('m49','归庄重聚',[760,700],reunionActors(),[
  fade('in'),...when([show('medicine-zi')],{flag:'goodFirstZi'}),move('hero',760,700),face('hero','medicine-zhen'),
  say('medicine-zhen',[['纳兰真','你们回来了！眉儿，这一路可还顺利？',1],['月眉儿','都好。见你们平安，我就放心了。',2],['蔷薇','总算又见到大家了。快过来，别站在门边。',1]]),
  ...when([say('medicine-zi',[['紫轩','我也来了。这些日子有许多误会，往后慢慢说清便是。',2]])],{flag:'goodFirstZi'}),
  ...when([say('hero',[['杨影枫','紫轩想留在寒波谷，她托我向你们问好。',0],['纳兰真','只要她平安就好。',1]])],{flag:'goodFirstMei'}),
  say('hero',[['杨影枫','眼下人都安顿好了。往后的日子，我想和你们认真商量。',0]]),
  show('medicine-nalan'),move('medicine-nalan',1060,530,110),face('hero','medicine-nalan'),face('medicine-zhen','medicine-nalan'),
  say('medicine-nalan',[['纳兰潜凛','人倒是聚齐了。影枫，你想离开江湖，可曾问过我的意思？',3],['纳兰真','爹……你怎么来了？',1],['杨影枫','有什么话，就在这里说吧。',0]]),
 ],{auto:true,finalActors:[zhen('medicine-zhen',900,580),rose('medicine-rose',1020,595),mei('medicine-mei',1175,730),zi('medicine-zi',900,700,{when:{flag:'goodFirstZi'}}),nalan({x:1060,y:530})],finalCues:{dreamFade:'in'}}),
 g23_recruitment:stage('m49','最后的招揽',[760,700],[nalan({x:1060,y:530}),zhen('medicine-zhen',900,580),rose('medicine-rose',1020,595),mei('medicine-mei',1175,730),zi('medicine-zi',900,700,{when:{flag:'goodFirstZi'}})],[
  move('hero',760,700),face('hero','medicine-nalan'),
  say('medicine-nalan',[['纳兰潜凛','你的本事已足以在教中立足。留下助我，往后的路自然不同。你怎么回答？',3]]),
 ],{finalActors:[nalan({x:1060,y:530}),zhen('medicine-zhen',900,580),rose('medicine-rose',1020,595),mei('medicine-mei',1175,730),zi('medicine-zi',900,700,{when:{flag:'goodFirstZi'}})]}),
 g24_aftermath:stage('m70','料理庄中后事',[760,700],[
  nalan({x:1060,y:530,pose:'fallen',interactive:false}),zhen('medicine-zhen',900,580),mei('medicine-mei',1175,730),rose('medicine-rose',850,780),zi('medicine-zi',900,700,{when:{flag:'goodFirstZi'}}),
  zhen('medicine-memorial-zhen',895,625,atScene(memorial)),mei('medicine-memorial-mei',965,575,atScene(memorial)),rose('medicine-memorial-rose',1110,590,atScene(memorial)),zi('medicine-memorial-zi',900,700,atScene(memorial,{when:{flag:'goodFirstZi'}})),
 ],[
  move('hero',760,700),move('medicine-zhen',1020,595,130),pose('medicine-zhen','kneel'),wait(1),
  say('medicine-zhen',[['纳兰真','爹……到最后，你还是不肯停下来。',1],['杨影枫','真儿……',0],['纳兰真','先别说了。让我再陪他一会儿。',1]]),wait(1),
  say('medicine-mei',[['月眉儿','我们陪你。后面的事，一起办好。',2],['蔷薇','是啊。你不必一个人撑着。',1]]),
  fade('out'),wait(1),hide('medicine-nalan'),hide('medicine-zhen'),hide('medicine-mei'),hide('medicine-rose'),hide('medicine-zi'),
  scene(memorial,760,650),show('medicine-memorial-zhen'),show('medicine-memorial-mei'),show('medicine-memorial-rose'),...when([show('medicine-memorial-zi')],{flag:'goodFirstZi'}),
  cue('goodMedicineMemorial','buried'),pose('medicine-memorial-zhen','kneel'),pose('hero','kneel'),fade('in'),
  say('hero',[['江湖纪事','众人安葬了纳兰潜凛。新土旁，真儿久久没有起身。',0],['纳兰真','爹，我会记得你。可我的往后，要由我自己走了。',1]]),wait(1),
  say('medicine-memorial-mei',[['月眉儿','回去吧。大家都还在这里。',2],['杨影枫','等你准备好了，我们便启程。',0],['纳兰真','嗯。走吧。',1]]),pose('medicine-memorial-zhen','stand'),pose('hero','stand'),
  fade('out'),wait(.8),hide('medicine-memorial-zhen'),hide('medicine-memorial-mei'),hide('medicine-memorial-rose'),hide('medicine-memorial-zi'),scene(null,760,700),
 ],{auto:true,sceneKeys:[memorial],finalActors:[],finalCues:{dreamFade:'out',goodMedicineMemorial:'buried'}}),
 g24_departure:stage('m34','临海辞江湖',[945,735],[
  zhen('medicine-zhen',1055,720),zi('medicine-zi',980,610,{when:{flag:'goodFirstZi'}}),rose('medicine-rose',980,610,{when:{not:'goodFirstZi'}}),
 ],[
  fade('in'),move('hero',945,735),face('hero','medicine-zhen'),
  say('medicine-zhen',[['纳兰真','走了这么远，听到海浪声，心里才慢慢静下来。',1],['杨影枫','以后不必再赶着争输赢了。先把眼前的日子过好。',0]]),
  ...when([face('hero','medicine-zi'),say('medicine-zi',[['紫轩','既然决定重新开始，就把该说的话慢慢说清。',2],['杨影枫','好。这一回，我们不用急着赶路。',0]])],{flag:'goodFirstZi'}),
  ...when([face('hero','medicine-rose'),say('medicine-rose',[['蔷薇','风比山谷里暖些。我想在这里多站一会儿。',1],['杨影枫','那就多留一会儿。海就在眼前，不会走远。',0]])],{not:'goodFirstZi'}),
  wait(1),say('hero',[['江湖纪事','潮声一阵阵漫过岸边。那段追逐胜负的江湖路，终于在此停下。',0]]),
 ],{auto:true,finalActors:[zhen('medicine-zhen',1055,720),zi('medicine-zi',980,610,{when:{flag:'goodFirstZi'}}),rose('medicine-rose',980,610,{when:{not:'goodFirstZi'}})],finalCues:{dreamFade:'in'}}),
};
