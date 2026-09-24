// Original dialogue and choreography over independently authored web scenery.
const move=(actor,x,y,speed=120)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.6)=>({type:'pose',actor,pose:value,duration});
const hide=actor=>({type:'hide',actor});
const cue=(key,value)=>({type:'cue',key,value});
const person=(id,name,sprite,x,y,extra={})=>({id,name,sprite,x,y,direction:-1,pose:'stand',...extra});
const zi=(x,y,extra={})=>person('rescue-zi','紫轩',2,x,y,{npcCell:null,interactive:false,...extra});
const mei=(x,y,extra={})=>person('rescue-mei','月眉儿',2,x,y,{npcCell:null,...extra});
const nalan=(x,y,extra={})=>person('rescue-nalan','纳兰潜凛',3,x,y,{npcCell:2,...extra});
const xin=(extra={})=>person('rescue-manor-xin','辛楚',3,1060,530,{npcCell:2,...extra});
const fortGuard=(extra={})=>person('rescue-fort-spokesman','无忧教守卫',3,1060,530,{npcCell:6,...extra});
export const GOOD_RESCUE_STAGING={
 g15_escape:{
  map:'m61',label:'留楼与破围',startPoint:{x:350,y:760},actors:[nalan(950,480)],props:[],
  finalActors:[nalan(1235,700,{hidden:true})],finalCues:{goodRescueHall:'fighting'},
  steps:[
   move('hero',350,760),face('hero','rescue-nalan'),
   say('rescue-nalan',[['纳兰潜凛','守住这里。在我回来以前，不许他离楼。',3]]),
   move('rescue-nalan',1175,530,130),move('hero',560,690),move('rescue-nalan',1235,700,130),hide('rescue-nalan'),
   say('hero',[['杨影枫','楼口被封住了。先闯开守卫，找出通往地下的路。',0]]),
   move('hero',350,760,140),cue('goodRescueHall','fighting'),{type:'release'},
  ],
 },
 g16:{
  map:'r_good_dungeon',label:'走近紫轩',startPoint:{x:945,y:410},
  actors:[zi(970,280,{pose:'sit',groundSeated:true})],props:[],
  finalActors:[zi(965,345,{hidden:true})],finalCues:{goodRescueZi:'following'},
  steps:[
   move('hero',945,410),face('hero','rescue-zi'),
   say('rescue-zi',[['紫轩','影枫……你来了。',2],['杨影枫','先别急着起身。我带你离开这里。',0]]),
   move('hero',965,345,85),pose('hero','kneel'),{type:'wait',duration:.7},
   say('rescue-zi',[
    ['紫轩','真儿她们没与我关在一起。我听见守卫谈到飞龙堡，那里或许还有藏人的地方。',2],
    ['杨影枫','这条线索我记下了。你现在能走么？',0],
    ['紫轩','慢一些就好，我跟着你。',2],
    ['杨影枫','先回寒波谷休养。走到楼上，再从来路下山。',0],
   ]),
   pose('hero','stand'),move('hero',945,410,85),pose('rescue-zi','stand'),move('rescue-zi',965,345,75),
   cue('goodRescueZi','following'),hide('rescue-zi'),{type:'release'},
  ],
 },
 g16_homecoming:{
  map:'r_good_hanbo_hut',label:'小筑前安置',startPoint:{x:850,y:650},actors:[zi(1040,460)],props:[],
  finalActors:[zi(1090,410)],finalCues:{goodRescueZi:'settled'},persistFor:['g17','g17_departure','g17_manor','g18','gTower1','gTower2','gTower3','gTower4','gTower5','gTower6','gTower7','gTower8'],
  steps:[
   move('hero',850,650),move('hero',1010,520,90),face('hero','rescue-zi'),face('rescue-zi','hero'),
   say('rescue-zi',[
    ['紫轩','终于回来了。这里安静，我能好好歇一歇。',2],
    ['杨影枫','你先留下休养。我去飞龙堡查真儿她们的下落，有消息便回来。',0],
    ['紫轩','一路小心，别只顾着赶路。',2],
    ['杨影枫','我会的。你也要照顾好自己。',0],
   ]),
   move('rescue-zi',1090,410,75),cue('goodRescueZi','settled'),move('hero',1100,790,105),{type:'release'},
  ],
 },
 g17:{
  map:'m41',label:'途中遇见追兵',startPoint:{x:490,y:700},actors:[mei(680,665)],props:[],
  finalActors:[mei(570,735,{hidden:true})],finalCues:{goodRescueMei:'fighting'},
  steps:[
   move('hero',490,700),face('hero','rescue-mei'),
   say('rescue-mei',[['月眉儿','影枫！当心，他们追过来了。',2],['杨影枫','眉儿，你受伤了？往我这边来！',0]]),
   move('rescue-mei',570,735,110),face('rescue-mei','hero'),
   say('hero',[['杨影枫','先挡住追兵，别让他们把我们分开。',0]]),
   cue('goodRescueMei','fighting'),hide('rescue-mei'),{type:'release'},
  ],
 },
 g17_departure:{
  map:'m41',label:'脱险后的消息',startPoint:{x:490,y:700},actors:[mei(680,665)],props:[],
  finalActors:[mei(280,625,{hidden:true})],finalCues:{goodRescueMei:'departed'},
  steps:[
   move('hero',520,760),face('hero','rescue-mei'),face('rescue-mei','hero'),
   say('rescue-mei',[
    ['杨影枫','追兵不会再赶来了。你是怎样逃出来的？',0],
    ['月眉儿','卢总管拼上性命才把我送出通天塔。真儿和蔷薇还被关在那里。',2],
    ['杨影枫','通天塔……从飞龙堡还能过去，对么？',0],
    ['月眉儿','能到。可他们重重设防，你一个人要小心。',2],
    ['杨影枫','紫轩已经回到寒波谷。你伤得不轻，先去与她一起养伤，我去救人。',0],
    ['月眉儿','我知道自己撑不了多久，就不拖累你了。一定把她们带回来。',2],
    ['杨影枫','我答应你。慢些走，到了谷里便好好歇着。',0],
   ]),
   move('rescue-mei',490,745,90),move('rescue-mei',405,675,90),move('rescue-mei',280,625,90),hide('rescue-mei'),cue('goodRescueMei','departed'),{type:'release'},
  ],
 },
 g17_manor:{
  map:'m49',label:'山庄伏兵再起',startPoint:{x:560,y:740},actors:[xin()],props:[],
  finalActors:[xin({hidden:true})],finalCues:{goodRescueManor:'fighting'},
  steps:[
   move('hero',560,740),face('hero','rescue-manor-xin'),face('rescue-manor-xin','hero'),
   say('rescue-manor-xin',[
    ['辛楚','你果然又从这里经过。这一次，路可没那么好走。',3],
    ['杨影枫','无忧教与霹雳堂又聚在了一起。还想拦我？',0],
    ['辛楚','能不能过去，问过我们的兵刃。',3],
   ]),
   move('hero',440,780,140),hide('rescue-manor-xin'),cue('goodRescueManor','fighting'),{type:'release'},
  ],
 },
 g18:{
  map:'m54',label:'飞龙堡封门',startPoint:{x:560,y:740},actors:[fortGuard()],props:[],
  finalActors:[fortGuard({hidden:true})],finalCues:{goodRescueFort:'fighting'},
  steps:[
   move('hero',560,740),face('hero','rescue-fort-spokesman'),
   say('rescue-fort-spokesman',[
    ['无忧教守卫','后门已经封住，谁也别想靠近。',3],
    ['杨影枫','我来找被你们关押的人。把路让开。',0],
    ['无忧教守卫','你先过得了这一关再说！',3],
   ]),
   move('hero',440,780,140),hide('rescue-fort-spokesman'),cue('goodRescueFort','fighting'),{type:'release'},
  ],
 },
};
