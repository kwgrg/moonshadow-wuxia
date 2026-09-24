// Independent mechanics contract. Reference is read-only: see the matching
// reference document. Dialogue, movement, art and save rules are authored here.
const good={route:'good',not:'forsake',notAll:['cultPath']};
const evidence=detail=>({sources:['docs/good-medicine-reunion-reference.md'],revised:true,source:`2026-09-24有界只读核验：${detail}。定位、原创设计与未知见docs/good-medicine-reunion-reference.md。`,dialogueStatus:'independently-authored-from-verified-mechanics',referencePolicy:'reference-only-no-original-content'});
const base={act:'卷七 · 侠路寻心',when:good,before:[],after:[],xp:0,money:0,encounterTier:14,requireStaging:true,repairCompanions:true,suppressBattleSupplies:true};
const talk=(id,title,map,npc,objective,extra={})=>({...base,id,title,map,npc,objective,type:'talk',sprite:1,...evidence('服药、探视、夜游和翌日辞行各有交互条件'),...extra});
export const GOOD_MEDICINE_REUNION_REVISIONS={
 g21:{...base,title:'药王谷求解毒',map:'m23',type:'talk',npc:'胡神医',sprite:0,x:930,y:570,encounterTier:13,xp:65,money:15,
  objective:'带蔷薇到诊院，请胡神医查看毒伤',requiredAnyFlags:[['goodRoseNightComplete','goodTowerValleyLegacy']],
  rewards:{flags:{goodMedicineExamined:true},companions:['蔷薇']},transition:{map:'m49'},
  ...evidence('2030诊查先停随，再恢复跟随，无法解毒后脚本直接返回悲魔山庄；没有领取背包解药的调用')},
 g22:{...base,title:'灯下问心',map:'r_good_manor_zhen_room',type:'choice',npc:'纳兰真',sprite:1,encounterTier:13,xp:65,money:15,
  objective:'探视蔷薇后，回真儿房前与她交谈',commitBeforeDialogue:true,choiceRestoreStaticFlag:'goodMedicineLegacyG22ChoicePaid',
  requiredAnyFlags:[['goodMedicineVisited','goodMedicineLegacy']],
  choice:{prompt:'夜游归来，真儿问你，是否愿意和她一起离开江湖。',options:[
   {text:'我明白',effects:{flags:{goodMedicineUnderstood:true},affection:{zhen:2}},after:[['杨影枫','我愿意。争来争去，我更想珍惜身边的人。',0],['纳兰真','那就把未了的心事说清，再一起走。今晚先歇下吧。',1]]},
   {text:'一时无言',effects:{flags:{goodMedicineUnderstood:false}},after:[['杨影枫','我想回答你，却怕只凭此刻的冲动，辜负你这些年的心意。',0],['纳兰真','不用急着说。天亮以后，我们还有时间。',1]]},
  ]},rewards:{flags:{goodMedicineNightTalk:true},companions:[]},
  ...evidence('2032夜游送房后有是否明白心意的答复；两支翌日均转2033、真儿跟随，仍须与蔷薇交谈才离庄')},
 g23:{...base,title:'樱花谷再相逢',map:'m17',type:'choice',npc:null,sprite:null,requireStaging:false,xp:65,money:15,
  objective:'紫轩与眉儿都在谷中；走近你想先交谈的人',requiredAnyFlags:[['goodMedicineFarewellReady','goodMedicineLegacy']],
  firstMeeting:{actors:[
   {id:'good-meeting-zi',name:'紫轩',sprite:2,npcCell:null,x:920,y:520,index:0},
   {id:'good-meeting-mei',name:'月眉儿',sprite:2,npcCell:null,x:1100,y:610,index:1},
  ]},
  choice:{prompt:'走近谷中一位人物交谈。',options:[
   {text:'与紫轩交谈',effects:{flags:{firstWoman:'zi',goodFirstZi:true,goodFirstMei:false},companions:['紫轩']},after:[
    ['紫轩','你来了。蔷薇的伤好些了吗？',2],['杨影枫','真儿带回了解药，她正在山庄休养。我来，是想问你愿不愿和我们一起离开江湖。',0],
    ['月眉儿','你们先说，我回小筑等。',2],['紫轩','我曾以为，有些话再没有机会说清。若你愿意听，我也愿意重新相信你。',2],['杨影枫','路还很长，我们慢慢说。先去小筑接眉儿。',0],
   ]},
   {text:'与月眉儿交谈',effects:{flags:{firstWoman:'mei',goodFirstZi:false,goodFirstMei:true},companions:['月眉儿']},after:[
    ['月眉儿','蔷薇没事了吧？你走了这么久，我一直惦记着。',2],['杨影枫','她已经服药。我们打算回岛过安稳日子，你愿意同行吗？',0],
    ['月眉儿','只要大家平安，我愿意。',2],['紫轩','我就留在寒波谷吧。还有些话，回小筑再向你们道别。',2],['杨影枫','好，我们送你回去。',0],
   ]},
  ]},rewards:{flags:{goodMedicineFirstTalk:true}},
  ...evidence('2034两名NPC的真实首个交互决定分支；先紫轩转2035且紫轩跟随，先眉儿转2036且只有眉儿跟随')},
 g24:{ending:false,requiredAnyFlags:[['goodMedicineChallenged','goodMedicineLegacy']],requirementText:'先回庄与众人会合，回应纳兰潜凛的最后招揽。',
  before:[['纳兰潜凛','既然谁也说服不了谁，便让这一战作个了断。',3],['杨影枫','你要的是天下，我要的是大家都能自由离开。',0]],
  after:[['江湖纪事','纳兰潜凛倒下，真儿急忙奔上前。',0]],rewards:{flags:{goodMedicineFinalDuelWon:true}},
  ...evidence('2041纳兰死亡回调触发收束，不以10名教徒全部清除为条件；当前网页仍为独立单首领战，护卫和同伴协战尚有差距')},
};
export const GOOD_MEDICINE_REUNION_ADDITIONS=[
 {beforeId:'g22',quests:[
  talk('g21_return','解药归来','m49','纳兰真','随真儿安顿蔷薇，听她说明解药的来历',{
   requiredFlags:['goodMedicineExamined'],rewards:{flags:{goodMedicineCured:true},companions:[]},
  }),
  talk('g21_visit','探看熟睡的蔷薇','r_good_manor_infirmary','蔷薇','亲自到床前查看蔷薇服药后的状况',{
   requiredFlags:['goodMedicineCured'],rewards:{flags:{goodMedicineVisited:true},companions:[]},
  }),
 ]},
 {beforeId:'g23',quests:[
  talk('g22_rest','夜尽天明','r_good_manor_zhen_room','纳兰真','留下休息，等候天明',{
   requiredAnyFlags:[['goodMedicineNightTalk','goodMedicineLegacy']],
   rewards:{flags:{goodMedicineMorningReady:true},companions:['纳兰真']},
  }),
  talk('g22_dawn','天明话别','r_good_manor_infirmary','蔷薇','天亮后和真儿一起看望蔷薇，说明去寒波谷的打算',{
   requiredAnyFlags:[['goodMedicineMorningReady','goodMedicineLegacy']],rewards:{flags:{goodMedicineFarewellReady:true},companions:[]},
  }),
 ]},
 {beforeId:'g24',quests:[
  talk('g23_pickup','小筑接眉儿','m16','月眉儿','陪紫轩回小筑，邀请眉儿一起回庄',{
   when:{...good,flag:'goodFirstZi'},sprite:2,requiredFlags:['goodMedicineFirstTalk'],
   rewards:{flags:{goodMedicineHutComplete:true},companions:['紫轩','月眉儿']},transition:{map:'r_good_hanbo_road'},
  }),
  talk('g23_farewell','小筑辞紫轩','m16','紫轩','陪眉儿回小筑，亲自向紫轩辞别',{
   when:{...good,flag:'goodFirstMei'},sprite:2,requiredFlags:['goodMedicineFirstTalk'],
   rewards:{flags:{goodMedicineHutComplete:true},companions:['月眉儿']},transition:{map:'r_good_hanbo_road'},
  }),
  talk('g23_reunion','山庄重聚','m49','纳兰真','回悲魔山庄与真儿、蔷薇会合',{
   requiredFlags:['goodMedicineHutComplete'],rewards:{flags:{goodMedicineReunited:true},companions:[]},
  }),
  {...talk('g23_recruitment','最后的招揽','m49','纳兰潜凛','当着众人的面，回应最后一次招揽',{
   sprite:3,requiredFlags:['goodMedicineReunited'],rewards:{flags:{goodMedicineChallenged:true},companions:[]},
  }),type:'choice',commitBeforeDialogue:true,choice:{prompt:'纳兰潜凛再次邀你留下，为无忧教效力。',options:[
   {text:'答应留下',effects:{flags:{goodMedicineAcceptedOffer:true}},after:[['杨影枫','若我留下，你便肯让她们平安离开？',0],['纳兰真','影枫，别把自己一生都抵在这里。',1],['杨影枫','我不能拿大家的未来，换一个没有把握的承诺。',0]]},
   {text:'拒绝招揽',effects:{flags:{goodMedicineAcceptedOffer:false}},after:[['杨影枫','我要带她们离开，不会替你去争天下。',0],['纳兰潜凛','看来，终究要分个高下。',3]]},
  ]}},
 ]},
 {beforeId:'gBad1',quests:[
  talk('g24_aftermath','庄中后事','m70','纳兰真','战后陪真儿料理父亲的后事',{
   requiredAnyFlags:[['goodMedicineFinalDuelWon','goodMedicineLegacyFinalDuel']],rewards:{flags:{goodMedicineBurialComplete:true},companions:[]},transition:{map:'m34'},
  }),
  talk('g24_departure','临海辞江湖','m34','纳兰真','在海边与同行的人告别这段江湖路',{
   requiredFlags:['goodMedicineBurialComplete'],ending:true,rewards:{},
  }),
 ]},
];
