// Independently authored dialogue and choreography over project scenery.
// The island and burial close-ups expand a narrated outcome into original web scenes.
const move=(actor,x,y,speed=100)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,value,duration=.6)=>({type:'pose',actor,pose:value,duration});
const cue=(key,value)=>({type:'cue',key,value});
const fade=value=>cue('dreamFade',value);
const light=value=>cue('valleyCareLight',value);
const wait=(duration=.8)=>({type:'wait',duration});
const hide=actor=>({type:'hide',actor});
const show=actor=>({type:'show',actor});
const scene=(key,x,y)=>({type:'scene',scene:key,hero:{x,y,direction:1}});
const person=(id,name,sprite,x,y,extra={})=>({id,name,sprite,x,y,sceneKey:null,direction:-1,pose:'stand',...extra});
const zhen=(id,x,y,extra={})=>person(id,'纳兰真',1,x,y,extra);
const nalan=(extra={})=>person('grief-nalan','纳兰潜凛',3,950,520,{npcCell:3,interactive:false,...extra});
const fallen=(id,name,sprite,x,y,extra={})=>person(id,name,sprite,x,y,{pose:'fallen',interactive:false,...extra});
const graveCamera='goodGriefFatherMemorial';
const hutActors=()=>[
 fallen('grief-zi','紫轩',2,930,575,{npcCell:null}),
 fallen('grief-mei','月眉儿',2,1080,660,{npcCell:null}),
 fallen('grief-hut-guard-1','教徒遗体',3,700,620,{npcCell:6}),
 fallen('grief-hut-guard-2','教徒遗体',3,850,780,{npcCell:6}),
 fallen('grief-hut-guard-3','教徒遗体',3,1175,730,{npcCell:6}),
];
const stage=(map,label,point,actors,steps,extra={})=>({
 map,label,pointOnly:true,startPoint:{x:point[0],y:point[1]},actors,props:[],
 finalActors:actors.map(actor=>({...actor})),finalCues:{dreamFade:'in'},
 steps:[...steps,{type:'release'}],...extra,
});

export const GOOD_GRIEF_STAGING={
 gBad_road:stage('r_good_grief_pass','天山追兵封路',[760,700],[
  person('grief-road-leader','无忧教领头男弟子',3,970,615,{npcCell:6,interactive:false}),
 ],[
  light('day'),move('hero',760,700),face('hero','grief-road-leader'),face('grief-road-leader','hero'),
  say('grief-road-leader',[
   ['无忧教领头男弟子','等的就是你。两边的路都有人守着，别想再往前走。',3],
   ['杨影枫','我今日不想多说。让开。',0],
   ['无忧教领头男弟子','上头要拿你回去，谁也不会放行。',3],
   ['杨影枫','那就由我自己闯出去。',0],
  ]),
  hide('grief-road-leader'),cue('goodGriefPass','fighting'),
 ],{finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day',goodGriefPass:'fighting'}}),

 gBad1:stage('m49','解药来迟与真儿离庄',[760,700],[zhen('grief-zhen',900,580)],[
  light('day'),move('hero',760,700),face('hero','grief-zhen'),face('grief-zhen','hero'),
  say('grief-zhen',[
   ['纳兰真','怎么只有你回来？蔷薇呢？我把解药带回来了。',1],
   ['杨影枫','她已经不在了。我把她安葬在落叶谷。',0],
   ['纳兰真','我本以为，还赶得上……',1],
   ['杨影枫','她独自藏了那么多苦处，我却一直没能察觉。',0],
   ['纳兰真','教中的人给她下了毒，解药却被爹握着。我没能早些带回来。',1],
  ]),wait(1),
  say('grief-zhen',[
   ['纳兰真','如今爹还在追杀你。跟我回忘忧岛，好吗？别再让更多人受伤了。',1],
   ['杨影枫','我不能当作一切都没发生。蔷薇和孟前辈的事，总要有个交代。',0],
   ['纳兰真','我拦不住你，也不愿亲眼看见你们再交手。我先回岛上。',1],
   ['杨影枫','真儿，这些事不是你的错。等这里了结，我会去找你。',0],
   ['纳兰真','我只盼你还能平安回来。',1],
  ]),
  move('grief-zhen',1020,595,85),move('grief-zhen',1175,730,85),hide('grief-zhen'),wait(.8),
  say('hero',[
   ['江湖纪事','真儿独自离开山庄。影枫站在原处，直到她的脚步声消失。',0],
   ['杨影枫','先去寒波谷。紫轩和眉儿还在那里等消息。',0],
  ]),
 ],{finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day'}}),

 gBad1_hut:stage('m16','小筑的无声现场',[760,700],hutActors(),[
  light('day'),move('hero',760,700),face('hero','grief-zi'),
  say('hero',[['杨影枫','紫轩？眉儿？我回来了。',0]]),
  move('hero',865,645,135),face('hero','grief-zi'),pose('hero','kneel'),wait(1),
  say('hero',[
   ['江湖纪事','小筑内横着几具教徒遗体。紫轩和眉儿倒在一旁，已经没有气息。',0],
   ['杨影枫','怎么连你们也……我又来迟了。',0],
  ]),pose('hero','stand'),move('hero',990,730,80),face('hero','grief-mei'),pose('hero','kneel'),wait(1),
  say('hero',[
   ['杨影枫','不用再怕了。我送你们去樱花谷，那里安静。',0],
   ['江湖纪事','影枫收起散落的物件，料理两人的后事。',0],
  ]),pose('hero','stand'),fade('out'),wait(.9),
 ],{finalActors:hutActors(),finalCues:{dreamFade:'out',valleyCareLight:'day'}}),

 gBad1_burial:stage('r_sakura_memorial','樱花谷两座新墓',[805,650],[],[
  light('day'),fade('in'),move('hero',805,650),
  say('hero',[['杨影枫','紫轩，眉儿，这一程送到这里。往后不会再有人惊扰你们了。',0]]),
  fade('out'),wait(1.3),cue('goodGriefMemorial','buried'),fade('in'),
  move('hero',730,620,75),{type:'face',actor:'hero',direction:-1},pose('hero','kneel'),wait(1),
  say('hero',[['杨影枫','你们本该平平安安地留在谷里，等着我们回来。',0]]),
  pose('hero','stand'),move('hero',940,640,75),{type:'face',actor:'hero',direction:1},pose('hero','kneel'),wait(1),
  say('hero',[
   ['杨影枫','我会去摘星楼。欠下的这笔血债，纳兰潜凛不能再躲过去。',0],
   ['江湖纪事','风吹落几片花瓣。影枫向两座新墓告别，转身走向谷外。',0],
  ]),pose('hero','stand'),move('hero',805,750,85),
 ],{auto:true,finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'day',goodGriefMemorial:'buried'}}),

 gBad2:stage('m71','摘星楼复仇对峙',[760,700],[nalan()],[
  light('night'),move('hero',760,700),face('hero','grief-nalan'),face('grief-nalan','hero'),
  say('grief-nalan',[
   ['纳兰潜凛','你竟还敢独自来此。真儿没有把你劝回去么？',3],
   ['杨影枫','别再提她。小筑里的紫轩和眉儿，也是你下的手？',0],
   ['纳兰潜凛','挡在我路上的人，都会有同样的下场。',3],
   ['杨影枫','蔷薇、孟前辈，还有她们……今日我来，要你偿还这些性命。',0],
   ['纳兰潜凛','那便看看你有没有走出这座楼的本事。',3],
  ]),
  hide('grief-nalan'),cue('goodGriefRevenge','fighting'),
 ],{finalActors:[],finalCues:{dreamFade:'in',valleyCareLight:'night',goodGriefRevenge:'fighting'}}),

 gBad2_aftermath:stage('m71','真儿赶到与葬父',[760,700],[
  nalan({pose:'fallen'}),zhen('grief-zhen',1175,730,{hidden:true}),
  zhen('grief-memorial-zhen',895,625,{sceneKey:graveCamera,hidden:true}),
 ],[
  light('night'),move('hero',760,700),wait(.7),show('grief-zhen'),move('grief-zhen',1080,660,145),move('grief-zhen',1020,595,130),
  face('grief-zhen','grief-nalan'),pose('grief-zhen','kneel'),wait(1),
  say('grief-zhen',[['纳兰真','爹……我还是回来晚了。',1],['杨影枫','真儿。',0]]),
  move('hero',850,620,80),face('hero','grief-zhen'),
  say('grief-zhen',[
   ['纳兰真','我知道他做过什么，可他终究是我爹。让我再陪他一会儿。',1],
   ['杨影枫','我陪你料理后事。别的，等你愿意说时再说。',0],
  ]),wait(1),fade('out'),wait(.9),hide('grief-nalan'),hide('grief-zhen'),
  light('day'),scene(graveCamera,760,650),show('grief-memorial-zhen'),pose('grief-memorial-zhen','kneel'),pose('hero','kneel'),cue('goodGriefFatherMemorial','buried'),fade('in'),
  say('hero',[
   ['江湖纪事','两人安葬了纳兰潜凛。尘土落定，真儿仍跪在墓前。',0],
   ['纳兰真','爹，我要走了。往后的路，我想自己选。',1],
  ]),wait(1),pose('hero','stand'),
  say('hero',[['杨影枫','回忘忧岛吧。那里的屋子，还等着有人回去。',0],['纳兰真','嗯……我们回去。',1]]),
  pose('grief-memorial-zhen','stand'),fade('out'),wait(.8),hide('grief-memorial-zhen'),scene(null,760,700),
 ],{auto:true,sceneKeys:[graveCamera],finalActors:[],finalCues:{dreamFade:'out',valleyCareLight:'day',goodGriefFatherMemorial:'buried'}}),

 gBad2_departure:stage('m34','忘忧岛归来',[945,735],[zhen('grief-zhen',1055,720)],[
  light('day'),fade('in'),move('hero',945,735),face('hero','grief-zhen'),face('grief-zhen','hero'),
  say('grief-zhen',[
   ['江湖纪事','离开中原后，影枫和真儿回到忘忧岛。潮水一遍遍拍打着旧日的岸边。',0],
   ['纳兰真','海还是从前的声音。可有些人，再也听不到了。',1],
   ['杨影枫','我们会记得他们。余下的日子，不必再拿去争斗。',0],
   ['纳兰真','陪我慢慢走回去吧。',1],
   ['杨影枫','好。',0],
  ]),wait(1),
  say('hero',[['江湖纪事','两人并肩停在岸上。江湖留下的伤痕，并未随着归来消失；他们仍要一起走过往后的日子。',0]]),
 ],{auto:true,finalActors:[zhen('grief-zhen',1055,720)],finalCues:{dreamFade:'in',valleyCareLight:'day'}}),
};
