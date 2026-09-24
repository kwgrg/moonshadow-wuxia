// Original dialogue/choreography. All footpoints belong to project paintings.
const move=(actor,x,y,speed=105)=>({type:'move',actor,x,y,speed});
const face=(actor,target)=>({type:'face',actor,target});
const say=(focus,lines)=>({type:'say',focus,lines});
const pose=(actor,pose,duration=.6)=>({type:'pose',actor,pose,duration});
const cue=(key,value)=>({type:'cue',key,value});
const fade=value=>cue('dreamFade',value);
const wait=(duration=.8)=>({type:'wait',duration});
const hide=actor=>({type:'hide',actor});
const rose=(x,y,extra={})=>({id:'tower-rose',name:'蔷薇',sprite:1,npcCell:7,x,y,direction:-1,pose:'stand',...extra});
const meng=(x,y,extra={})=>({id:'tower-meng',name:'孟知秋',sprite:3,npcCell:3,x,y,direction:1,pose:'fallen',interactive:false,...extra});
const stage=(map,label,point,actors,steps,extra={})=>({map,label,pointOnly:true,startPoint:{x:point[0],y:point[1]},actors,props:[],finalActors:actors.map(a=>({...a})),finalCues:{dreamFade:'in'},steps:[...steps,{type:'release'}],...extra});
const roomRose=()=>rose(950,550);
const towerRose=()=>rose(1320,350);
const night=()=>cue('valleyCareLight','night');
const day=()=>cue('valleyCareLight','day');
const invitationLines=[
 [['蔷薇','屋里明明点着灯，我还是不敢一个人闭上眼。今晚能留在这里吗？',1]],
 [['蔷薇','我知道你也很累。可一安静下来，我就想起爹……再陪我一会儿，好不好？',1]],
 [['杨影枫','听到你叫我，我便过来了。哪里不舒服？',0],['蔷薇','你坐近些就好。我只是怕这间屋子又只剩我一个人。',1]],
 [['蔷薇','我不想再装作什么事都没有。今晚，你能留下吗？',1]],
];
const invite=n=>stage('r_leaf_rose_room',`第${n}次夜间挽留`,[835,695],[roomRose()],[night(),move('hero',835,695),face('hero','tower-rose'),face('tower-rose','hero'),say('tower-rose',invitationLines[n-1])],{finalCues:{valleyCareLight:'night',dreamFade:'in'}});
const returnRoom=n=>stage('r_leaf_hero_room','回客房后再闻呼唤',[690,535],[],[
 night(),move('hero',620,450),pose('hero','sit'),say('hero',[['杨影枫',n===1?'她受了这些惊吓，今夜难免睡不安稳。我先在这里歇一会儿。':'又回到了房里，院中的风声比方才更清楚了。',0]]),
 fade('out'),wait(1),fade('in'),wait(.5),say('hero',[['蔷薇','影枫……你还醒着吗？',1],['杨影枫','是蔷薇在叫我。去看看她。',0]]),pose('hero','stand'),move('hero',690,535),move('hero',760,875),
],{finalActors:[],finalCues:{valleyCareLight:'night',dreamFade:'in'}});
export const GOOD_TOWER_VALLEY_STAGING={
 gTower8:stage('m69','塔顶望见蔷薇',[1170,475],[towerRose()],[
  move('hero',1170,475),face('hero','tower-rose'),say('hero',[['杨影枫','蔷薇？我看见你了！',0],['蔷薇','我在这里。影枫，真的是你……',1]]),
 ]),
 g19:stage('m69','走近重逢之人',[1170,475],[towerRose()],[
  move('hero',1170,475),face('hero','tower-rose'),face('tower-rose','hero'),say('tower-rose',[
   ['杨影枫','总算找到你了。先让我看看，你伤着没有？',0],
   ['蔷薇','我一直盼你来。见到我以后，你还会记得我也在等你吗？',1],
  ]),
 ]),
 g19_departure:stage('m69','重逢后的答复',[1170,475],[towerRose()],[
  move('tower-rose',1220,470,85),move('hero',1170,475,85),face('hero','tower-rose'),face('tower-rose','hero'),
  {...fade('out'),when:{flag:'goodTowerKissed'}},{...wait(.55),when:{flag:'goodTowerKissed'}},
  {...say('tower-rose',[['江湖纪事','影枫俯身，在她额前轻轻一吻。蔷薇终于松开了紧攥的手。',0]]),when:{flag:'goodTowerKissed'}},
  {...fade('in'),when:{flag:'goodTowerKissed'}},
  {...say('tower-rose',[['杨影枫','我怎会不担心你。先扶稳了，我们一道离开。',0],['蔷薇','那你可要走慢些。',1]]),when:{flag:'goodTowerNoKiss'}},
  say('tower-rose',[
   ['杨影枫','真儿还在塔里吗？',0],['蔷薇','她父亲已经把她带走了。我没能问到他们要去哪里。',1],
   ['蔷薇','爹呢？你见过他没有？',1],['杨影枫','孟前辈还在落叶谷，伤势很重。',0],
   ['蔷薇','那我们快回去，我要亲眼看看他。',1],['杨影枫','好。沿楼梯慢慢下去，跟紧我。',0],
  ]),hide('tower-rose'),cue('goodTowerJourney','returning'),
 ],{finalActors:[rose(1220,470,{hidden:true})],finalCues:{goodTowerJourney:'returning',dreamFade:'in'}}),
 g19_return:stage('m51','谷中再见父亲',[760,650],[meng(850,505),rose(965,575)],[
  move('hero',760,650),move('tower-rose',915,570,80),face('tower-rose','tower-meng'),pose('tower-rose','kneel'),wait(1),
  say('tower-rose',[['蔷薇','爹，我回来了……你看看我。',1],['杨影枫','孟前辈？',0]]),
  move('hero',805,620,80),pose('hero','kneel'),wait(1),say('hero',[['杨影枫','已经……没有气息了。',0],['蔷薇','我好不容易回来了，你却听不见我了。',1]]),
  pose('hero','stand'),cue('goodTowerMeng','dead'),
 ],{finalActors:[meng(850,505),rose(915,570,{pose:'kneel'})],finalCues:{goodTowerMeng:'dead'},persistFor:['g19_burial']}),
 g19_burial:stage('r_leaf_memorial','墓前送别',[760,650],[rose(965,575)],[
  move('hero',760,650),move('tower-rose',895,625,75),pose('tower-rose','kneel'),pose('hero','kneel'),
  say('hero',[['杨影枫','孟前辈，影枫来迟了。您的后事，我会和蔷薇一起办好。',0]]),fade('out'),wait(1.2),cue('goodTowerMeng','buried'),fade('in'),wait(.5),
  say('tower-rose',[['蔷薇','爹，这里很静。我以后会常来看你。',1],['杨影枫','先把眼泪擦一擦。你一路都没能歇下。',0],['蔷薇','真儿跟着她父亲，至少眼下不会有事。天要黑了……我们回去吧。',1]]),
  pose('hero','stand'),pose('tower-rose','stand'),hide('tower-rose'),
 ],{finalActors:[rose(895,625,{hidden:true})],finalCues:{goodTowerMeng:'buried',dreamFade:'in'}}),
 g20_escort:stage('r_leaf_rose_room','把她送回房里',[750,815],[rose(930,630)],[
  move('hero',835,695,90),move('tower-rose',950,550,75),face('hero','tower-rose'),night(),
  say('tower-rose',[['蔷薇','以前我嫌这房间太闷，现在却怕出了门，再也听不到爹叫我。',1],['杨影枫','你今日太累了。先坐一会儿，我在这里。',0]]),pose('tower-rose','sit'),
 ],{finalActors:[roomRose()],finalCues:{valleyCareLight:'night',dreamFade:'in'}}),
 g20:invite(1),g20_return1:returnRoom(1),g20_call2:invite(2),g20_return2:returnRoom(2),g20_call3:invite(3),g20_return3:returnRoom(3),g20_call4:invite(4),
 g20_cry:stage('r_leaf_hero_room','静夜哭声',[690,535],[],[
  night(),move('hero',620,450),pose('hero','sit'),say('hero',[['杨影枫','院子安静下来了。她大概也该歇息了。',0]]),fade('out'),wait(1.4),fade('in'),wait(.5),
  say('hero',[['江湖纪事','一阵压抑的抽泣声穿过庭院，时断时续。',0],['杨影枫','是蔷薇……',0]]),pose('hero','stand'),move('hero',690,535),
 ],{finalActors:[],finalCues:{valleyCareLight:'night',dreamFade:'in'}}),
 g20_stay:stage('r_leaf_rose_room','陪伴与隐痛',[835,695],[roomRose()],[
  night(),move('hero',835,695),face('hero','tower-rose'),say('hero',[['杨影枫','我留下。你不用一个人熬过这一夜。',0],['蔷薇','听你这么说，我总算能安心一些。',1]]),
  pose('hero','sit'),pose('tower-rose','sit'),fade('out'),wait(1.2),fade('in'),wait(.5),
  say('tower-rose',[['杨影枫','怎么又哭了？若有什么事，不必再藏着。',0],['蔷薇','我中了无忧教的穿肠雪蛛毒。他们说，十日里没有解药，我便活不成了。',1],['杨影枫','你一直一个人忍着这些？',0],['蔷薇','我怕一说出口，连这一晚也留不住。',1],['杨影枫','天亮我就陪你去求医。还有时间，我们一起想办法。',0]]),
  fade('out'),wait(1),day(),fade('in'),wait(.5),pose('hero','stand'),pose('tower-rose','stand'),
  say('hero',[['杨影枫','走吧，我们去药王谷。',0],['蔷薇','嗯，我跟你走。',1]]),hide('tower-rose'),
 ],{finalActors:[rose(950,550,{hidden:true})],finalCues:{valleyCareLight:'day',dreamFade:'in'}}),
 g20_lastwords:stage('r_leaf_rose_room','夜间赶到她身边',[835,695],[rose(950,550,{pose:'ill'})],[
  night(),move('hero',835,695,150),face('hero','tower-rose'),pose('hero','kneel'),
  say('hero',[['江湖纪事','蔷薇已经伤害了自己，气息渐弱。影枫急忙赶到她身旁。',0],['杨影枫','蔷薇！你怎么这样冷？',0],['蔷薇','你还是来了……让我靠一会儿。',1],['杨影枫','别闭眼，我马上去找人救你。',0],['蔷薇','我早已中了他们的毒。那些话一直没能告诉你，现在也不必再瞒着了。',1]]),
  fade('out'),wait(.65),pose('tower-rose','fallen'),fade('in'),wait(.65),
  say('hero',[['杨影枫','蔷薇……回答我。',0],['江湖纪事','她再没有回应。影枫守在床边，直到窗外渐渐发白。',0]]),fade('out'),wait(.8),day(),fade('in'),pose('hero','stand'),
 ],{finalActors:[rose(950,550,{pose:'fallen',interactive:false})],finalCues:{valleyCareLight:'day',dreamFade:'in'},persistFor:['g20_rose_burial']}),
 g20_founddead:stage('r_leaf_rose_room','天明后的房间',[835,695],[rose(950,550,{pose:'fallen',interactive:false})],[
  day(),move('hero',835,695),face('hero','tower-rose'),say('hero',[['杨影枫','蔷薇，天亮了。',0]]),pose('hero','kneel'),wait(1),
  say('hero',[['杨影枫','怎么会……昨夜还听见你的声音。',0],['江湖纪事','蔷薇已在昨夜自尽。那个始终没能说出口的求救，留在了空寂的房里。',0]]),wait(.8),pose('hero','stand'),
 ],{finalActors:[rose(950,550,{pose:'fallen',interactive:false})],finalCues:{valleyCareLight:'day'},persistFor:['g20_rose_burial']}),
 g20_rose_burial:stage('r_leaf_memorial','送她长眠',[760,650],[],[
  day(),move('hero',760,650),pose('hero','kneel'),say('hero',[['杨影枫','孟前辈，我把蔷薇送到这里了。',0]]),fade('out'),wait(1.2),cue('goodRoseMemorial','buried'),fade('in'),wait(.6),
  say('hero',[['杨影枫','一路赶来，只想着再快一些。到了最后，还是没能听懂你的话。',0],['江湖纪事','墓前落叶无声。影枫站起身，独自走向谷口。',0]]),pose('hero','stand'),
 ],{finalActors:[],finalCues:{goodRoseMemorial:'buried',valleyCareLight:'day',dreamFade:'in'}}),
};
