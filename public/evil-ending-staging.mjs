// Original dialogue, staging and coordinates. Mechanics: docs/evil-ending-reference.md.
// Durations, visible props and actor gestures are web presentation, not native frames.
const move=(actor,x,y,speed=105)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.7)=>({type:'pose',actor,pose:value,duration});
const cue=(key,value)=>({type:'cue',key,value});
const fade=value=>cue('dreamFade',value),light=value=>cue('valleyCareLight',value);
const wait=(duration=.8)=>({type:'wait',duration});
const hide=actor=>({type:'hide',actor}),show=actor=>({type:'show',actor});
const strike=(actor,target)=>({type:'strike',actor,target,duration:.65});
const person=(id,name,sprite,x,y,extra={})=>({id,name,sprite,x,y,direction:-1,pose:'stand',interactive:false,...extra});
const zhen=(x=930,y=575,extra={})=>person('final-zhen','纳兰真',1,x,y,extra);
const mei=(x=1080,y=660,extra={})=>person('final-mei','月眉儿',2,x,y,{npcCell:null,...extra});
const room='r_evil_final_room';
const household=()=>[[450,600],[565,500],[1110,700],[1180,550]].map(([x,y],i)=>person('final-household-'+i,'山庄家丁',0,x,y,{npcCell:4}));
const stage=(map,label,point,actors,steps,extra={})=>({
 map,label,pointOnly:true,startPoint:{x:point[0],y:point[1]},actors,props:[],
 finalActors:actors.map(actor=>({...actor})),finalCues:{dreamFade:'in'},
 steps:[...steps,{type:'release'}],...extra,
});
const poisonActors=()=>[zhen(),mei(1080,660)];
const afterZhenActors=()=>[zhen(930,575,{pose:'fallen'}),mei()];
const dreamActors=()=>[
 zhen(580,500,{enemy:true}),mei(1050,500,{enemy:true}),
 person('final-rose','蔷薇',3,570,610,{npcCell:7,enemy:true}),
 person('final-zi','紫轩',2,1080,710,{npcCell:null,enemy:true}),
];

export const EVIL_ENDING_STAGING={
 e13:stage('m66','八层机关齐开',[760,700],[zhen(1030,570)],[
  move('hero',1030,690,100),face('hero','final-zhen'),face('final-zhen','hero'),
  say('hero',[
   ['杨影枫','八处机关都已接通。真儿，往后退一点，我来推开门。',0],
   ['纳兰真','你能找到这里，我便知道自己还有出去的一天。',1],
  ]),cue('evilFinalTowerDoor','open'),wait(.8),move('final-zhen',1030,670,75),move('final-zhen',960,640,75),
  say('final-zhen',[
   ['杨影枫','你站不稳，先扶着我。我们回悲魔山庄。',0],
   ['纳兰真','好。回去以后，你要把这些日子的事告诉我。',1],
  ]),fade('out'),wait(1),
 ],{finalActors:[],finalCues:{dreamFade:'out',evilFinalTowerDoor:'open'}}),

 e14_report:stage(room,'安顿真儿与来敌消息',[760,700],[
  zhen(620,450,{pose:'ill'}),person('final-tie','铁云',0,1080,660,{npcCell:5,hidden:true}),
 ],[
  light('day'),fade('in'),move('hero',690,535,95),face('hero','final-zhen'),
  say('final-zhen',[
   ['纳兰真','已经回来了么？方才我像是又听见塔里的门声。',1],
   ['杨影枫','这里是山庄。门外有人照看，你安心睡一会儿。',0],
   ['纳兰真','等我好些，我们再慢慢说话。',1],
  ]),show('final-tie'),move('final-tie',930,575,130),face('final-tie','hero'),
  say('final-tie',[
   ['铁云','庄主，门外聚了许多武林中人。他们带着兵器，不肯离开。',0],
   ['杨影枫','有多少人？',0],
   ['铁云','各处来的人站满了门前，属下已让家丁退到一旁。',0],
   ['杨影枫','照顾好真儿。我去门前见他们。',0],
  ]),move('final-tie',1080,660,125),hide('final-tie'),move('hero',760,700,95),
 ],{auto:true,finalActors:[zhen(620,450,{pose:'ill'})],finalCues:{dreamFade:'in',valleyCareLight:'day'}}),

 e14:stage('m49','二十九人堵在庄门',[760,700],[
  person('final-gate-spokesman','来犯武人',3,1030,600,{npcCell:6}),
  ...household(),
 ],[
  light('day'),move('hero',760,700),face('hero','final-gate-spokesman'),
  say('final-gate-spokesman',[
   ['来犯武人','杨影枫，今日诸位同道在此，你休想闭门躲过去。',3],
   ['杨影枫','庄内还有病人。有什么事，到门外说。',0],
   ['来犯武人','我们既然来了，就不会听你三言两语便散。',3],
   ['杨影枫','铁云，带庄里的人退后。',0],
  ]),hide('final-gate-spokesman'),cue('evilFinalGate','fighting'),
 ],{finalActors:household(),finalCues:{valleyCareLight:'day',evilFinalGate:'fighting'}}),

 e14_recovery:stage(room,'探视之后的三个月',[760,700],[zhen(620,450,{pose:'ill'})],[
  light('day'),move('hero',690,535,95),face('hero','final-zhen'),
  say('final-zhen',[
   ['纳兰真','外面安静了。你有没有受伤？',1],
   ['杨影枫','已经结束了。往后的日子，你只管把身子养好。',0],
   ['纳兰真','你也坐一会儿。回到你身边以后，我才敢真的闭上眼。',1],
  ]),pose('hero','sit',1),wait(1),fade('out'),wait(1.2),
  say('hero',[['江湖纪事','三个月过去。真儿渐渐康复，两人在山庄中相伴度日。',0]]),
  cue('evilFinalMonths','three'),pose('final-zhen','stand'),move('final-zhen',930,575,85),pose('hero','stand'),fade('in'),
  say('final-zhen',[
   ['纳兰真','今日精神好多了，我想去园里走走。',1],
   ['杨影枫','别太累。晚些时候，我等你回来。',0],
  ]),move('final-zhen',1080,660,95),hide('final-zhen'),
 ],{finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day',evilFinalMonths:'three'}}),

 e14_letter:stage('m50','真儿在园中读信',[870,630],[
  person('final-kerong','可容',1,1030,560,{npcCell:null}),mei(1030,560,{hidden:true}),
 ],[
  light('day'),move('hero',870,630,95),move('final-kerong',960,620,100),face('hero','final-kerong'),
  say('final-kerong',[
   ['可容','真儿姑娘，有些话，我一直没有机会单独对你说。',1],
   ['纳兰真','你今日怎么这样郑重？',1],
  ]),fade('out'),wait(.55),{type:'replace',actor:'final-kerong',target:'final-mei'},fade('in'),
  say('final-mei',[
   ['纳兰真','眉儿？这些日子，原来是你扮作可容！',1],
   ['月眉儿','先看这封信。看过以后，你就会明白我为什么来找你。',2],
  ]),{type:'readLetter',actor:'hero',duration:1.8},cue('evilFinalLetter','read'),
  say('hero',[
   ['纳兰真','母亲的信……这里写的两个女儿，竟然是我们。',1],
   ['月眉儿','我们是亲姐妹。许多事，我也曾被蒙在鼓里。',2],
   ['纳兰真','姐姐。若早些知道，我们之间何必绕这么远的路。',1],
   ['月眉儿','可还有一个人，你并没有真正看清。影枫做过的事，他都告诉你了么？',2],
   ['纳兰真','他对我很好。我不能只听旁人的话便疑他。',1],
   ['月眉儿','那就让他亲口说。我带来的药，只会让人把心里的真话说出来。',2],
   ['纳兰真','真的不会伤到他？',1],
   ['月眉儿','你想知道他有没有骗你，就把药放进给他的汤里。',2],
   ['纳兰真','……我只想听他亲口告诉我。',1],
  ]),cue('evilFinalTruthDrug','accepted'),fade('out'),wait(.8),
 ],{finalActors:[mei(960,620)],finalCues:{dreamFade:'out',valleyCareLight:'day',evilFinalLetter:'read',evilFinalTruthDrug:'accepted'}}),

 e14_poison:stage(room,'参汤与毒发',[805,650],[zhen(1080,660),mei(1080,660,{hidden:true})],[
  light('day'),fade('in'),move('hero',805,650,90),move('final-zhen',930,575,85),face('hero','final-zhen'),
  say('final-zhen',[
   ['纳兰真','我煮了参汤，趁热喝些吧。',1],
   ['杨影枫','这几日都是你在忙。你才好起来，也该歇一歇。',0],
  ]),cue('evilFinalSoup','served'),wait(1),pose('hero','sit',.9),
  say('hero',[['杨影枫','这汤……腹中怎么忽然像刀绞一样？',0]]),
  cue('evilFinalPoison','active'),pose('hero','ill',1),face('final-zhen','hero'),
  say('final-zhen',[
   ['纳兰真','影枫！怎么会这样？她说这药只会让你说真话……',1],
   ['杨影枫','谁给你的药？',0],
  ]),show('final-mei'),face('final-mei','hero'),
  say('final-mei',[
   ['月眉儿','是我。你喝下的，是断肠散。',2],
   ['纳兰真','你答应过不会伤他的！',1],
   ['月眉儿','我带了解药。影枫，杀了真儿，我便把它给你。',2],
   ['杨影枫','你竟要我拿她的命来换。',0],
  ]),wait(1),
 ],{auto:true,finalActors:poisonActors(),finalCues:{dreamFade:'in',valleyCareLight:'day',evilFinalSoup:'served',evilFinalPoison:'active'},finalHeroPose:'ill'}),

 e14_mercy:stage(room,'不肯以命换命',[805,650],poisonActors(),[
  cue('evilFinalPoison','active'),pose('hero','ill'),face('hero','final-mei'),
  say('hero',[
   ['杨影枫','我做过许多错事，可这一回，我不会再拿别人抵偿。你把解药收回去。',0],
   ['纳兰真','姐姐，错把药放进汤里的是我。求你救他！',1],
   ['月眉儿','到了此刻，你还是不肯动手……',2],
  ]),wait(1),move('final-mei',980,670,75),
  say('final-mei',[
   ['月眉儿','把这解药服下。它能保住性命，却保不住你的武功。',2],
   ['杨影枫','只要真儿平安，我不再求别的。',0],
   ['月眉儿','今后的路，你们自己走吧。不要再来找我。',2],
  ]),cue('evilFinalPoison','cleared'),wait(1),pose('hero','stand'),
  move('final-mei',1080,660,90),hide('final-mei'),
  say('final-zhen',[
   ['纳兰真','你还在，已经够了。我们离开这里，好不好？',1],
   ['杨影枫','好。把争斗留在这里，我们一起走。',0],
  ]),fade('out'),wait(1),
 ],{auto:true,finalActors:[zhen()],finalCues:{dreamFade:'out',valleyCareLight:'day',evilFinalPoison:'cleared'}}),

 e14_family:stage('r_evil_family_shore','五年后的海边',[800,700],[
  zhen(950,700),person('final-child','杨纳康',0,1100,800,{npcCell:null,child:true,hidden:true}),
 ],[
  fade('out'),say('hero',[['江湖纪事','五年以后。海边的小径上，影枫和真儿又听见了熟悉的潮声。',0]]),cue('evilFinalYears','five'),light('day'),fade('in'),
  face('hero','final-zhen'),face('final-zhen','hero'),
  say('final-zhen',[
   ['纳兰真','这条路走了这么多年，你还会想起从前么？',1],
   ['杨影枫','会。但我如今没有武功，也不想再用一柄剑证明什么。',0],
   ['纳兰真','你总说自己少了许多，可我觉得，我们有了从前没有的日子。',1],
  ]),show('final-child'),move('final-child',1050,680,115),face('hero','final-child'),face('final-zhen','final-child'),
  say('final-child',[
   ['杨纳康','爹，娘，你们又不等我！',0],
   ['纳兰真','纳康，慢些跑，石头上还湿着。',1],
   ['杨影枫','来，跟在我们中间。回家以后，再听你讲今天的事。',0],
  ]),move('final-child',875,680,90),face('final-child','hero'),wait(1),say('hero',[['江湖纪事','孩子走到父母身旁。三个人的影子留在潮水够不到的地方。',0]]),
 ],{auto:true,finalActors:[zhen(950,700),person('final-child','杨纳康',0,875,680,{npcCell:null,child:true})],finalCues:{dreamFade:'in',valleyCareLight:'day',evilFinalYears:'five'}}),

 e14_zhen_fall:stage(room,'向真儿举剑',[805,650],poisonActors(),[
  cue('evilFinalPoison','active'),pose('hero','ill'),
  say('hero',[
   ['杨影枫','解药就在你手里。只要照你说的做，你便会给我？',0],
   ['月眉儿','你可以试试。',2],
   ['纳兰真','影枫……你看看我。',1],
  ]),pose('hero','stand'),move('hero',870,625,65),face('hero','final-zhen'),strike('hero','final-zhen'),fade('out'),wait(.8),pose('final-zhen','fallen'),cue('evilFinalZhen','fallen'),fade('in'),
  say('hero',[['江湖纪事','真儿倒在影枫面前。方才还带着温度的汤，已经无人再去收拾。',0]]),
 ],{auto:true,finalActors:afterZhenActors(),finalCues:{dreamFade:'in',evilFinalPoison:'active',evilFinalZhen:'fallen'}}),

 e14_antidote:stage(room,'拿到解药',[805,650],afterZhenActors(),[
  cue('evilFinalPoison','active'),face('hero','final-mei'),
  say('hero',[
   ['杨影枫','我已经照做。解药。',0],
   ['月眉儿','拿去。你所要保住的性命，就在这一点药里。',2],
  ]),move('final-mei',980,670,70),wait(.8),cue('evilFinalPoison','cleared'),pose('hero','stand'),
  say('final-mei',[
   ['月眉儿','如今毒已解了。你心里还有什么放不下？',2],
   ['杨影枫','你让我亲手杀了她，却还问我放不下什么。',0],
  ]),
 ],{auto:true,finalActors:[zhen(930,575,{pose:'fallen'}),mei(980,670)],finalCues:{dreamFade:'in',evilFinalPoison:'cleared',evilFinalZhen:'fallen'}}),

 e14_mei_fall:stage(room,'再次出手',[805,650],[zhen(930,575,{pose:'fallen'}),mei(980,670)],[
  cue('evilFinalPoison','cleared'),face('hero','final-mei'),
  say('hero',[
   ['月眉儿','你要把所有的事都算在我头上？剑一直在你自己手里。',2],
   ['杨影枫','这把剑，也不会再为你留下余地。',0],
  ]),move('hero',895,700,90),strike('hero','final-mei'),fade('out'),wait(.8),pose('final-mei','fallen'),cue('evilFinalMei','fallen'),fade('in'),
  move('hero',870,625,65),face('hero','final-zhen'),pose('hero','kneel',1),
  say('hero',[
   ['杨影枫','真儿……方才你还在同我说话。',0],
   ['江湖纪事','屋里再无人回答。影枫伏在真儿身旁，许久才起身料理两人的后事。',0],
  ]),pose('hero','stand'),fade('out'),wait(1),
 ],{auto:true,finalActors:[zhen(930,575,{pose:'fallen'}),mei(980,670,{pose:'fallen'})],finalCues:{dreamFade:'out',evilFinalPoison:'cleared',evilFinalZhen:'fallen',evilFinalMei:'fallen'}}),

 e14_burial:stage('r_evil_final_graves','两人的安葬',[805,650],[],[
  light('day'),fade('out'),wait(1),cue('evilFinalGraves','buried'),fade('in'),
  move('hero',730,620,75),{type:'face',actor:'hero',direction:-1},pose('hero','kneel',1),
  say('hero',[['杨影枫','真儿，我答应带你回家，却亲手把你留在了这里。',0]]),
  pose('hero','stand'),move('hero',940,640,75),{type:'face',actor:'hero',direction:1},pose('hero','kneel',1),
  say('hero',[
   ['杨影枫','眉儿，你把我推到绝路，我也把剑落了下去。如今这些话，再说给谁听？',0],
   ['江湖纪事','新土掩住两人的棺木。影枫站起时，山庄已经等不到任何人归来。',0],
  ]),pose('hero','stand'),move('hero',805,750,75),fade('out'),wait(.9),
 ],{auto:true,finalActors:[],finalCues:{dreamFade:'out',valleyCareLight:'day',evilFinalGraves:'buried'}}),

 e14_sleep:stage(room,'一个人的长夜',[760,700],[],[
  light('night'),fade('in'),move('hero',690,535,75),{type:'face',actor:'hero',direction:-1},
  say('hero',[['杨影枫','还同从前一样的屋子，怎么连一声脚步也听不见了。',0]]),
  move('hero',620,450,65),pose('hero','sit',1.1),fade('out'),wait(1.3),cue('evilFinalNight','asleep'),
  say('hero',[['江湖纪事','灯火熄去。影枫在断续的睡意里，又听见有人喊他的名字。',0]]),
 ],{auto:true,finalActors:[],finalCues:{dreamFade:'out',valleyCareLight:'night',evilFinalNight:'asleep'},finalHeroPose:'sit'}),

 e14_dream:stage(room,'梦中四道旧影',[760,700],dreamActors(),[
  fade('in'),light('night'),cue('evilFinalDream','active'),move('hero',760,700,90),
  say('final-zhen',[['纳兰真','你说带我回去的时候，心里可曾想过后来的那一剑？',1]]),
  face('hero','final-mei'),say('final-mei',[['月眉儿','你要找的借口，还要从我这里拿么？',2]]),
  face('hero','final-rose'),say('final-rose',[['蔷薇','你走过那么多地方，有没有停下来想过我们？',3]]),
  face('hero','final-zi'),say('final-zi',[['紫轩','留下来的每一句话，你真的都听见了吗？',2]]),
  say('hero',[['杨影枫','别再说了！你们明明已经……',0],['江湖纪事','四道身影逼近。影枫拔剑，却辨不清自己要斩断的是谁。',0]]),
  ...dreamActors().map(actor=>hide(actor.id)),
 ],{auto:true,heroStart:{x:760,y:700},finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'night',evilFinalDream:'active'}}),

 e14_father:stage('r_evil_father_peak','梦醒祭父',[645,515],[],[
  light('day'),fade('in'),move('hero',520,435,80),{type:'face',actor:'hero',direction:-1},pose('hero','kneel',1),
  say('hero',[
   ['江湖纪事','影枫从梦中惊醒。回到凌绝峰父墓前时，山风仍像他当年下山那日一样。',0],
   ['杨影枫','爹，我曾以为，只要手中的剑比别人强，就没有过不去的事。',0],
   ['杨影枫','后来我赢了许多场，身边的人却一个也没有留下。',0],
   ['杨影枫','真儿、眉儿，还有那些被我丢在身后的名字……如今只在梦里肯同我说话。',0],
   ['杨影枫','这一程，我究竟把自己带到了哪里？',0],
  ]),wait(1.5),say('hero',[['江湖纪事','墓前无人作答。影枫独自跪着，直到风吹散了山间的薄雾。',0]]),
 ],{auto:true,finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day'},finalHeroPose:'kneel'}),
};
