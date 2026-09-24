// Original choreography and dialogue over project-owned scenery. Coordinates
// below belong to the independently authored web layouts, not reference maps.
const move=(actor,x,y,speed=115)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.7)=>({type:'pose',actor,pose:value,duration});
const hide=actor=>({type:'hide',actor});
const cue=(key,value)=>({type:'cue',key,value});
const person=(id,name,sprite,x,y,extra={})=>({id,name,sprite,x,y,direction:-1,pose:'stand',...extra});
const rose=(x,y,extra={})=>person('good-rose','蔷薇',0,x,y,{npcCell:7,...extra});
const zhen=(x,y,extra={})=>person('good-zhen','纳兰真',1,x,y,{npcCell:null,...extra});
const mei=(x,y,extra={})=>person('good-mei','月眉儿',2,x,y,{npcCell:null,...extra});
const zi=(x,y)=>person('testimony-zi','紫轩',2,x,y);
const zhang=(extra={})=>person('testimony-zhang','张仲天',0,1000,640,{npcCell:1,pose:'sit',groundSeated:true,interactive:false,...extra});
const guard=(id,x,y,extra={})=>person(id,'无忧教守卫',3,x,y,{npcCell:6,...extra});
const chief=(extra={})=>person('capture-chief','无忧教头目',3,1060,520,{npcCell:6,...extra});
const dou=()=>person('good-ferry-dou','渔夫窦昊',0,1030,610,{npcCell:4});

export const GOOD_FORBIDDEN_STAGING={
  g12:{
    map:'m59',label:'紫轩引见伤者',startPoint:{x:650,y:700},
    actors:[rose(560,660),zi(1060,470),zhang()],props:[],
    finalActors:[zi(1000,550),zhang({pose:'fallen'}),rose(640,715,{hidden:true})],
    finalCues:{goodTestimony:'heard'},persistFor:['g13_hut'],
    steps:[
      move('hero',650,700),move('testimony-zi',1000,550),face('testimony-zi','hero'),face('hero','testimony-zi'),
      say('testimony-zi',[
        ['紫轩','影枫，我正等你。这里有位伤者，一直念着要见你。',2],
        ['杨影枫','是谁？带我过去。',0],
      ]),
      move('hero',760,620),move('good-rose',650,590),face('hero','testimony-zhang'),
      say('testimony-zhang',[
        ['杨影枫','张仲天？客栈那一夜之后，我以为你已经……',0],
        ['张仲天','那时卓非凡盯上了我，我借诈死才脱身。可这一回，躲不掉了。',0],
        ['杨影枫','究竟是谁伤了你？',0],
        ['张仲天','我本是无忧教的人。纳兰潜凛拿到武道德经后，容不下知道内情的人。你也要提防他。',0],
        ['杨影枫','原来这一切都牵着他……你先别说话，我去找大夫。',0],
        ['张仲天','来不及了。你记住这句话，别再落进他的局里。',0],
      ]),
      pose('testimony-zhang','fallen',1.1),{type:'wait',duration:.8},
      say('testimony-zi',[
        ['紫轩','他已经撑得太久了。',2],
        ['蔷薇','我爹没有离开落叶谷，纳兰又得了经书……岛上的真儿和眉儿怕是还不知道。',0],
        ['杨影枫','得赶快回去找她们。紫轩，你随我们一起走么？',0],
        ['紫轩','我留下替张先生料理后事。你们先去，别耽搁了。',2],
        ['杨影枫','有劳你了。蔷薇，我们去渡口。',0],
      ]),
      cue('goodTestimony','heard'),move('good-rose',640,715),move('hero',730,770),hide('good-rose'),{type:'release'},
    ],
  },
  g13_hut:{
    map:'r_good_seaside_hut',label:'海边屋中寻人',startPoint:{x:780,y:810},
    actors:[rose(890,730)],props:[],finalActors:[rose(1010,600,{hidden:true})],finalCues:{goodHutSearch:'empty'},
    steps:[
      move('hero',780,810),face('hero','good-rose'),
      say('hero', [['杨影枫','真儿，眉儿？我们回来了。',0]]),
      move('hero',730,660),move('good-rose',1010,600),move('hero',590,470,95),
      say('hero', [['杨影枫','休息的地方空着，她们都不在。',0]]),
      move('hero',900,575,95),move('hero',1070,535,85),face('hero','good-rose'),
      say('good-rose',[
        ['蔷薇','屋里没有，外面也没听见回应。',0],
        ['杨影枫','恐怕去了禁地。我们过去找，不能再等。',0],
      ]),
      cue('goodHutSearch','empty'),move('hero',780,810),hide('good-rose'),{type:'release'},
    ],
  },
  g13_entry:{
    map:'m60',label:'外场守卫封路',startPoint:{x:620,y:690},
    actors:[rose(525,680),guard('good-entry-spokesman',820,590,{enemy:true})],props:[],
    finalActors:[rose(490,805,{hidden:true}),guard('good-entry-spokesman',820,590,{hidden:true,enemy:true})],finalCues:{goodForbiddenEntry:'fighting'},
    steps:[
      move('hero',620,690),face('hero','good-entry-spokesman'),face('good-rose','good-entry-spokesman'),
      say('good-entry-spokesman',[
        ['无忧教守卫','禁地戒严，来者止步！',3],
        ['杨影枫','我们来找纳兰真和月眉儿。把路让开。',0],
        ['无忧教守卫','没有教主的命令，谁也别想进去。',3],
        ['蔷薇','越不肯让路，越得进去看清楚。影枫，我与你一起。',0],
        ['杨影枫','小心他们围过来，别离得太远。',0],
      ]),
      move('hero',400,770,140),move('good-rose',490,805,130),
      face('hero','good-entry-spokesman'),face('good-rose','good-entry-spokesman'),
      cue('goodForbiddenEntry','fighting'),hide('good-entry-spokesman'),hide('good-rose'),{type:'release'},
    ],
  },
  g13_reunion:{
    map:'r_good_forbidden_chamber',label:'密室找到姐妹',startPoint:{x:725,y:805},
    actors:[rose(615,745),zhen(965,505),mei(1100,620)],props:[],
    finalActors:[rose(645,610,{hidden:true}),zhen(930,560,{hidden:true}),mei(1020,670,{hidden:true})],finalCues:{goodForbiddenReunion:'leaving'},
    steps:[
      move('hero',725,805),face('hero','good-zhen'),
      say('hero', [['杨影枫','真儿，眉儿！总算找到你们了。',0]]),
      move('hero',760,690),move('good-rose',645,610),move('good-zhen',930,560),move('good-mei',1020,670),
      face('hero','good-zhen'),face('good-zhen','hero'),
      say('good-zhen',[
        ['纳兰真','影枫，你和蔷薇怎么也来了？',1],
        ['杨影枫','小屋里找不到你们，我放心不下。孟前辈的行踪查清了，他根本没有来岛上。',0],
        ['月眉儿','伤真儿的那个人，竟会是我们自己的父亲。',2],
        ['杨影枫','纳兰潜凛已经拿到武道德经。张仲天临终前提醒我，他在除掉知情的人。',0],
        ['纳兰真','我曾以为是孟知秋……还连累你们奔波。',1],
        ['蔷薇','如今都说清了。先离开这里，往后的事一起想办法。',0],
        ['杨影枫','沿来时的路走，我和蔷薇照看前后。',0],
      ]),
      cue('goodForbiddenReunion','leaving'),
      move('good-rose',725,850),hide('good-rose'),move('good-zhen',725,850),hide('good-zhen'),move('good-mei',725,850),hide('good-mei'),
      move('hero',725,805),{type:'release'},
    ],
  },
  g13_captured:{
    map:'m60',auto:true,label:'挟持与押走',startPoint:{x:620,y:690},
    actors:[zhen(630,590,{bound:true,interactive:false}),mei(765,585,{bound:true,interactive:false}),rose(900,585,{bound:true,interactive:false}),chief(),guard('capture-guard-left',550,490),guard('capture-guard-right',1130,630)],props:[],
    finalActors:[zhen(805,405,{hidden:true}),mei(805,405,{hidden:true}),rose(805,405,{hidden:true}),chief({x:805,y:405,hidden:true}),guard('capture-guard-left',805,405,{hidden:true}),guard('capture-guard-right',805,405,{hidden:true})],
    finalCues:{goodForbiddenCaptives:'gone',dreamFade:'in'},
    steps:[
      cue('dreamFade','out'),{type:'wait',duration:.4},move('hero',620,690,420),cue('goodForbiddenCaptives','held'),cue('dreamFade','in'),{type:'wait',duration:.4},
      face('hero','capture-chief'),move('hero',620,650,90),
      say('capture-chief',[
        ['无忧教头目','再往前一步，你就看着她们受伤。',3],
        ['杨影枫','把剑移开！你们冲着我来。',0],
      ]),
      move('hero',620,710,75),
      say('good-rose',[
        ['蔷薇','影枫，别硬闯。先想办法，再来救我们。',0],
        ['纳兰真','我们还活着，你别把自己也留在这里。',1],
        ['月眉儿','记住他们的去向。我们会等你。',2],
        ['无忧教头目','把人带去摘星楼！杨影枫，要找人，就到那里来。',3],
        ['杨影枫','我一定会去。你们若伤她们，这笔账我会逐个讨回来。',0],
      ]),
      cue('goodForbiddenCaptives','escorted'),
      move('capture-guard-left',805,405,110),hide('capture-guard-left'),
      move('good-zhen',805,405,90),hide('good-zhen'),move('good-mei',805,405,90),hide('good-mei'),move('good-rose',805,405,90),hide('good-rose'),
      move('capture-chief',805,405,105),hide('capture-chief'),move('capture-guard-right',805,405,100),hide('capture-guard-right'),
      cue('goodForbiddenCaptives','gone'),{type:'wait',duration:.6},
      say('hero', [['杨影枫','她们被带去摘星楼了。先回中原，找孟前辈商量救人的办法。',0]]),
      {type:'release'},
    ],
  },
  g13_ferry:{
    map:'m40',label:'独自回中原',startPoint:{x:990,y:700},actors:[dou()],props:[],finalActors:[dou()],finalCues:{goodForbiddenFerry:'ready'},
    steps:[
      move('hero',990,700),face('hero','good-ferry-dou'),face('good-ferry-dou','hero'),
      say('good-ferry-dou',[
        ['杨影枫','窦大叔，劳你送我回中原。有急事，越快越好。',0],
        ['渔夫窦昊','船正好能走。你先上栈桥，我来解缆。',0],
        ['杨影枫','多谢。',0],
      ]),
      move('hero',1175,700,125),cue('goodForbiddenFerry','ready'),{type:'release'},
    ],
  },
};
