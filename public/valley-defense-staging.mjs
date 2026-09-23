// Newly authored choreography, not original animation or dialogue.
const move=(actor,x,y,speed=110)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.6)=>({type:'pose',actor,pose:value,duration});
const cue=value=>({type:'cue',key:'valleyPowerTransfer',value});
const ding=(x=735,y=590,hidden=false)=>({id:'manor-ding-ge',name:'丁戈',sprite:3,npcCell:2,x,y,direction:-1,hidden});
const meng=()=>({id:'defense-meng',name:'孟知秋',sprite:3,npcCell:3,x:950,y:520,direction:-1,pose:'sit',groundSeated:true,interactive:false});

export const VALLEY_DEFENSE_STAGED_QUESTS={
  g14_dock_report:{
    map:'r_mainland_dock',label:'渡头急报',startPoint:{x:690,y:570},
    actors:[{id:'defense-tieyun',name:'铁云',sprite:0,npcCell:5,x:930,y:700,direction:-1}],props:[],
    finalActors:[{id:'defense-tieyun',name:'铁云',sprite:0,npcCell:5,x:700,y:845,direction:-1,hidden:true}],finalCues:{},
    steps:[
      move('hero',690,570),move('defense-tieyun',850,590,140),face('hero','defense-tieyun'),face('defense-tieyun','hero'),
      say('defense-tieyun',[
        ['铁云','杨公子，总算等到你回来了！无忧教的人占了悲魔山庄，霹雳堂也跟着他们。',0],
        ['杨影枫','庄中出了事？我正要去落叶谷找孟前辈，先回山庄看看。',0],
        ['铁云','他们封住庄里的通路，你独自进去，务必小心。',0],
        ['杨影枫','我知道了。你先避开他们，别再涉险。',0],
      ]),
      move('defense-tieyun',700,845,125),{type:'hide',actor:'defense-tieyun'},{type:'release'},
    ],
  },
  g14_manor_battle:{
    map:'m49',label:'占庄者拦路',startPoint:{x:600,y:710},actors:[ding()],props:[],
    finalActors:[ding(1050,685,true)],finalCues:{manorDefense:'fighting'},
    steps:[
      move('hero',600,710),face('hero','manor-ding-ge'),face('manor-ding-ge','hero'),
      say('manor-ding-ge',[
        ['丁戈','杨影枫，悲魔山庄已经换了主人。你独自来此，是想投奔无忧教么？',3],
        ['杨影枫','你带着霹雳堂的人占了庄子，还问我来做什么？让开。',0],
        ['丁戈','何必替别人拼命。肯站到我们这边，便能保全自己。',3],
        ['杨影枫','我不拿旁人的安危换自己的退路。',0],
        ['丁戈','既然如此，就别想轻易出这道门。',3],
      ]),
      move('hero',400,770,140),move('manor-ding-ge',1050,685,130),
      face('hero','manor-ding-ge'),face('manor-ding-ge','hero'),
      {type:'cue',key:'manorDefense',value:'fighting'},
      {type:'hide',actor:'manor-ding-ge'},{type:'release'},
    ],
  },
  g14:{
    map:'m51',label:'重伤托付',startPoint:{x:850,y:650},actors:[meng()],props:[],
    finalActors:[meng()],finalCues:{valleyPowerTransfer:'settled'},persistFor:['g14_hanbo','g14_resolve','g15'],
    steps:[
      move('hero',850,650),face('hero','defense-meng'),face('defense-meng','hero'),
      say('defense-meng',[
        ['杨影枫','孟前辈！谷里竟成了这样。伤你的人是纳兰潜凛？',0],
        ['孟知秋','是他。先别管我……蔷薇在哪里？',3],
        ['杨影枫','她与真儿、眉儿被无忧教带走了。我会去把她们救出来。',0],
        ['孟知秋','你如今的功力还难与他抗衡。近前来，让我助你一程。',3],
        ['杨影枫','前辈伤得这样重，怎能再耗损自己？',0],
        ['孟知秋','救人要紧。我放心不下蔷薇，往后还望你多照看她。',3],
      ]),
      move('hero',850,600,85),pose('hero','sit'),cue('ready'),
      {type:'wait',duration:.7},cue('flowing'),{type:'wait',duration:2.4},cue('settled'),
      say('defense-meng',[
        ['杨影枫','这股气息……前辈，先歇一歇。',0],
        ['孟知秋','纳兰的落脚处在倚天山摘星楼。去吧，别被他的言语蒙蔽。',3],
        ['杨影枫','我记住了。等救出她们，再回来看您。',0],
      ]),
      pose('hero','stand'),move('hero',850,680,90),{type:'release'},
    ],
  },
  g14_hanbo:{
    map:'r_hanbo_return',label:'寒波谷归途',startPoint:{x:850,y:650},actors:[],props:[],
    finalActors:[],finalCues:{},
    steps:[
      move('hero',850,650),
      say('hero',[
        ['杨影枫','到了寒波谷，便又想起紫轩。不知她如今是否平安……',0],
        ['杨影枫','先去芭蕉小筑看看，再赶往摘星楼。',0],
      ]),
      move('hero',900,610),{type:'release'},
    ],
  },
  g14_resolve:{
    map:'m16',label:'进屋寻人',startPoint:{x:760,y:780},actors:[],props:[],
    finalActors:[],finalCues:{},
    steps:[
      move('hero',760,780),move('hero',930,575,105),
      say('hero',[
        ['杨影枫','紫轩？……屋里没人。她也落到了无忧教手里么？',0],
      ]),
      move('hero',700,620,90),
      say('hero',[
        ['杨影枫','再等下去也没有消息。先去摘星楼救出真儿她们，再找紫轩。',0],
      ]),
      move('hero',760,810),{type:'release'},
    ],
  },
};
