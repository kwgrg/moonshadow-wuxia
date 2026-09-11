// Playable actions restored from the event audit; coordinates and balance remain adaptations.
const source=['https://gl.ali213.net/html/2001/3982.html','https://vv0817.neocities.org/gametxt/15_jxqysp'];
export const GAMEPLAY_REVISIONS={
 a49:{before:[['江湖纪事','几天后的夜里，真儿悄悄来找杨影枫。禁地方向灯火未熄，她想知道父亲究竟在练什么功。',0],['纳兰真','杨大哥，我们去远远看一眼，好不好？',1]],choiceBeforeObjective:true,choice:{prompt:'真儿想偷偷看看父亲在禁地练功，你如何回答？',options:[
  {text:'答应同行，提醒她小心',effects:{affection:{zhen:1}},after:[['杨影枫','好。但只能远远看一眼，别惊扰前辈。',0]]},
  {text:'先劝她不要去',effects:{affection:{zhen:-1}},after:[['纳兰真','你不愿意就算了，我自己去。',1],['江湖纪事','真儿赌气走到海边。杨影枫放心不下，追上去劝解，最终还是陪她同行。',0]]}
 ]}},
 a63_zi:{battleBeforeChoice:true,count:1,boss:'夺命一点金幻影',enemy:'夺命一点金幻影',before:[
  ['江湖纪事','小筑再度燃起火光，夺命一点金的幻影挡在前方。只有击败这段恐惧，才能继续面对旧情。',0],
  ['杨影枫','这一次，我不会再被你逼退。',0]
 ]},
 a63:{battleBeforeChoice:true,count:1,boss:'纳兰潜凛幻影',enemy:'纳兰潜凛幻影',before:[
  ['江湖纪事','忘忧岛的幻境里，纳兰潜凛拦住去路，真儿的身影在远处若隐若现。',0],
  ['杨影枫','是阵法在引我出剑。即使必须应战，也不能把所有人都当作仇敌。',0]
 ]},
 b04:{type:'boss',choiceBeforeObjective:true,count:1,enemy:'蔷薇',boss:'蔷薇',enemySprite:1,friendly:true,
 choice:{prompt:'山路上横着一只捕兽夹，你准备怎么做？',options:[
  {text:'将捕兽夹收起',effects:{moral:2,items:{trap:1}},after:[['杨影枫','先收起来，免得伤了路人。',0],['紫衣少女','谁准你动我的捕兽夹？先接我几招！',1]]},
  {text:'先办正事，暂且不理',effects:{moral:-1},after:[['杨影枫','先去见孟前辈，回来再说。',0],['李总管','老爷还在闭关，蔷薇小姐却带着捕兽夹出去了。少侠可曾见过？',2],['江湖纪事','杨影枫折回山路，收起捕兽夹。紫衣少女赶来，答应只要胜过她，便肯回家。',0],['紫衣少女','要我回去？先比过再说！',1]]}
 ]},after:[['江湖纪事','少女落败，却说自己迷了路，带着杨影枫在山脚与天池之间兜转。回庄向李总管问起此事，总管又请他帮忙劝蔷薇回家。',0],['李总管','正是我们小姐！老爷快出关了，请少侠再去天池劝劝她。',2],['杨影枫','原来一直在逗我……也罢，我再去找她。',0]]},
 b05:{returnToGiver:true},
};
export const GAMEPLAY_ADDITIONS=[{beforeId:'b03',quests:[{
 id:'b02_ambush',title:'夜路遇伏',map:'m50',npc:'飞龙堡伏兵',sprite:3,type:'battle',count:3,enemy:'飞龙堡伏兵',act:'卷六 · 江湖情义',
 objective:'在返回山庄的路上击退飞龙堡伏兵',
 before:[['江湖纪事','离开芭蕉小筑后，埋伏的人马从夜路两侧围拢过来。杨影枫还未理清旧情，已经必须拔剑自保。',0],['杨影枫','既然藏不住了，就出来！',0]],
 after:[['江湖纪事','伏兵散去，夜路重又寂静。杨影枫赶回山庄，向真儿解释今晚的去向。',0]],
 sources:source,rewards:{},revised:true,dialogueStatus:'adapted-from-verified-events'
}]}];