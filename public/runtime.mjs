import { QUESTS, MAPS, SKILLS, ITEMS, ENDINGS, SIDE_QUESTS, chooseEnding } from './campaign.mjs';
export { QUESTS, MAPS, SKILLS, ITEMS, ENDINGS, SIDE_QUESTS };
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const copy=o=>JSON.parse(JSON.stringify(o));
export function freshState(){return {version:3,quest:0,map:QUESTS[0].map,phase:'talk',stage:0,hero:{x:810,y:745,hp:300,maxHp:300,mp:180,maxMp:180,stamina:100,level:1,exp:0,direction:1},potions:5,elixirs:3,coins:150,kills:0,choices:{},flags:{moral:0,evil:0},affection:{zhen:0,zi:0,mei:0,wei:0},inventory:{},equipment:{weapon:'family_sword',armor:'cotton_robe'},skills:{1:0,3:0},hotbar:[1,3,null,null,null],cooldowns:Array(SKILLS.length).fill(0),enemies:[],visited:[QUESTS[0].map],done:[],sideDone:[],opened:[],collected:0,completed:false,ending:null,playTime:0};}
export function restoreState(raw){
 if(raw?.questId){const index=QUESTS.findIndex(q=>q.id===raw.questId);if(index<0)throw new Error('存档中的任务不在当前流程中');raw={...raw,quest:index};}
 if(!raw||raw.version!==3||!Number.isInteger(raw.quest)||!QUESTS[raw.quest]||!MAPS[raw.map]||!raw.hero)throw new Error('此存档不属于当前流程版本');
 const s=freshState(),h=raw.hero;
 for(const k of ['x','y','hp','maxHp','mp','maxMp','stamina','level','exp'])if(!Number.isFinite(h[k]))throw new Error('角色资料不完整');
 s.quest=raw.quest;s.map=raw.map;s.phase=['talk','battle','search','after','choice','travel','complete','escape'].includes(raw.phase)?raw.phase:'talk';s.stage=clamp(Number(raw.stage)||0,0,30);
 s.hero={x:clamp(h.x,400,1400),y:clamp(h.y,520,920),maxHp:clamp(h.maxHp,300,10000),maxMp:clamp(h.maxMp,180,6000),level:clamp(Math.floor(h.level),1,99),exp:clamp(h.exp,0,999999),hp:clamp(h.hp,1,10000),mp:clamp(h.mp,0,6000),stamina:clamp(h.stamina,0,100),direction:h.direction===-1?-1:1};s.hero.hp=Math.min(s.hero.hp,s.hero.maxHp);s.hero.mp=Math.min(s.hero.mp,s.hero.maxMp);
 for(const k of ['potions','elixirs','coins','kills','collected','playTime'])s[k]=clamp(Number(raw[k])||0,0,999999);
 s.skills={1:0,3:0};for(const [key,value] of Object.entries(raw.skills||{}))if(/^\d+$/.test(key)&&SKILLS[key]&&Number.isFinite(value))s.skills[key]=clamp(value,0,1000);
 s.hotbar=Array.isArray(raw.hotbar)?raw.hotbar.slice(0,5).map(v=>SKILLS[v]&&Object.hasOwn(s.skills,v)?v:null):s.hotbar;while(s.hotbar.length<5)s.hotbar.push(null);
 for(const id of Object.keys(ITEMS))if(Number.isFinite(raw.inventory?.[id]))s.inventory[id]=clamp(Math.floor(raw.inventory[id]),0,999);
 s.equipment={weapon:ITEMS[raw.equipment?.weapon]?.type==='weapon'?raw.equipment.weapon:'family_sword',armor:ITEMS[raw.equipment?.armor]?.type==='armor'?raw.equipment.armor:'cotton_robe'};
 s.visited=Array.isArray(raw.visited)?[...new Set(raw.visited.filter(id=>MAPS[id]))]:[s.map];if(!s.visited.includes(s.map))s.visited.push(s.map);
 s.done=Array.isArray(raw.done)?[...new Set(raw.done.filter(id=>QUESTS.some(q=>q.id===id)))]:[];s.sideDone=Array.isArray(raw.sideDone)?raw.sideDone.filter(id=>SIDE_QUESTS.some(q=>q.id===id)):[];s.opened=Array.isArray(raw.opened)?raw.opened.filter(v=>typeof v==='string').slice(0,500):[];
 for(const k of Object.keys(s.affection))s.affection[k]=clamp(Number(raw.affection?.[k])||0,-99,99);
 for(const [key,value] of Object.entries(raw.flags||{}))if(/^[a-zA-Z][\w-]{0,50}$/.test(key)&&['string','number','boolean'].includes(typeof value))s.flags[key]=value;
 for(const [key,value] of Object.entries(raw.choices||{}))if(QUESTS.some(q=>q.id===key)&&Number.isInteger(value))s.choices[key]=clamp(value,0,10);
 s.ending=ENDINGS[raw.ending]?raw.ending:null;s.completed=!!s.ending;s.phase=s.completed?'complete':s.map!==QUESTS[s.quest].map?'travel':s.phase;
 if(s.phase==='battle'||s.phase==='escape'){s.phase='talk';s.collected=0;}return s;
}
export class GameEngine{
 constructor(state=freshState()){this.s=state;this.target=null;this.waypoints=[];this.keys=new Set();this.effects=[];this.numbers=[];this.time=0;this.paused=false;this.active=true;this.attackTarget=null;this.onEvent=()=>{};this.hitTime=0;this.dashTime=0;this.walkTime=0;this.attackAngle=0;this.autoInteract=null;this.meditating=false;this.settings={difficulty:'normal',controls:'modern',quality:'high',volume:.35,motion:true};this.followPosition={x:730,y:780};}
 get q(){return QUESTS[this.s.quest]}
 get region(){return MAPS[this.s.map]}
 get chapter(){const m=this.region,q=this.q;return {...m,name:q.title,number:q.act,banner:m.name,place:m.name+' · '+m.area,quest:q.title,npc:q.npc||'江湖纪事',npcX:q.x||1030,npcY:q.y||585,sprite:q.sprite||0,enemies:q.count||3,enemyName:q.enemy||'敌方武人'};}
 get npc(){return this.markers.find(m=>m.main)||this.markers[0]||{x:1000,y:600,name:'江湖路',sprite:0,kind:'travel'};}
 get companion(){return this.s.flags.companion&&!this.s.completed&&this.s.flags.companion!==this.q.playAs?{x:this.followPosition.x,y:this.followPosition.y,name:this.s.flags.companion,sprite:this.s.flags.companion==='紫轩'?2:1,direction:this.s.hero.direction}:null;}
 get markers(){
  const q=this.q,at=this.s.map===q.map,list=[];
  if(at&&!this.s.completed){if(this.s.phase==='search'){const count=q.count||1;for(let i=0;i<count;i++)if(i>=this.s.collected)list.push({id:'search-'+i,kind:'search',x:[1120,680,1270,840][i%4],y:[640,760,850,565][i%4],name:q.object||q.itemName||'线索',main:true,sprite:null,index:i});}
   else if(this.s.phase==='escape')list.push({id:'escape',kind:'escape',x:q.x||1330,y:q.y||820,name:q.object||'出口',main:true,sprite:null});
   else if(this.s.phase!=='battle')list.push({id:'main',kind:'main',x:q.x||1020,y:q.y||595,name:q.npc||q.object||'江湖纪事',main:true,sprite:q.sprite});}
  if(this.s.phase!=='battle'){
   if(this.region.shop)list.push({id:'shop',kind:'shop',x:650,y:650,name:'行脚商人',sprite:0});
   list.push({id:'exit',kind:'travel',x:1340,y:820,name:at?'江湖舆图':'前往 '+MAPS[q.map].name,sprite:null});
   for(const side of SIDE_QUESTS.filter(q=>q.map===this.s.map&&!this.s.sideDone.includes(q.id)))list.push({id:side.id,kind:'side',x:side.x||570,y:side.y||780,name:side.npc,sprite:side.sprite??0});
  }return list;
 }
 emit(type,data={}){this.onEvent(type,data);}
 addNumber(text,x,y,color='#ffe3a0'){this.numbers.push({text:String(text),x,y,life:1.15,color});}
 addEffect(kind,x,y,radius,color,life=.7){this.effects.push({kind,x,y,radius,color,life,total:life,angle:this.attackAngle});}
 passable(x,y){if(x<410||x>1400||y<520||y>920)return false;return !(this.region.obstacles||[]).some(r=>x>r[0]&&x<r[2]&&y>r[1]&&y<r[3]);}
 findPath(x,y){
  x=clamp(x,420,1390);y=clamp(y,530,910);if(!this.passable(x,y))return [];
  const origin=this.s.hero,step=40,key=(a,b)=>a+','+b;const start=[Math.round((origin.x-410)/step),Math.round((origin.y-520)/step)],goal=[Math.round((x-410)/step),Math.round((y-520)/step)];const queue=[start],seen=new Set([key(...start)]),prev=new Map();let found=false;
  while(queue.length){const [a,b]=queue.shift();if(a===goal[0]&&b===goal[1]){found=true;break}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const u=a+dx,v=b+dy,k=key(u,v);if(seen.has(k)||!this.passable(410+u*step,520+v*step))continue;seen.add(k);prev.set(k,[a,b]);queue.push([u,v]);}}
  if(!found)return [];let p=goal,path=[];while(key(...p)!==key(...start)){path.push({x:410+p[0]*step,y:520+p[1]*step});p=prev.get(key(...p));if(!p)return [];}path.reverse();path.push({x,y});return path;
 }
 moveTo(x,y){this.waypoints=this.findPath(x,y);this.target=this.waypoints.shift()||null;this.attackTarget=null;this.meditating=false;return !!this.target;}
 interact(marker=null){if(this.paused)return false;const m=marker||this.markers.filter(m=>m.main).sort((a,b)=>distance(this.s.hero,a)-distance(this.s.hero,b))[0]||this.npc;if(!m)return false;
  if(this.s.completed){this.emit('ending');return true;}if(this.s.phase==='battle'){this.emit('toast',{text:'先解决眼前的对手。'});return false;}
  if(distance(this.s.hero,m)>135){this.moveTo(m.x-40,m.y+45);this.autoInteract=m.id;return false;}
  this.autoInteract=null;this.target=null;this.waypoints=[];
  if(m.kind==='search'){if(m.index!==this.s.collected){this.emit('toast',{text:'先取近处的线索。'});return false;}this.s.collected++;this.addEffect('heal',m.x,m.y,55,'#e1cd8e');this.emit('collect',{name:m.name});if(this.s.collected>=(this.q.count||1)){this.s.phase='after';this.emit('objective');}return true;}
  if(m.kind==='escape'){this.completeQuest();return true;}if(m.kind==='shop')this.emit('shop');else if(m.kind==='travel')this.emit('map');else if(m.kind==='side')this.emit('side',{id:m.id});else this.emit('interact');return true;
 }
 beginObjective(){const q=this.q;if(q.type==='battle'||q.type==='boss'){this.startBattle();return;}if(q.type==='escape'){this.s.phase='escape';this.s.timer=q.duration;this.emit('objective');return;}if(['search','fetch','puzzle'].includes(q.type)){this.s.collected=0;this.s.phase='search';this.emit('objective');return;}if(q.type==='choice'||q.choice){this.s.phase='choice';this.emit('choice');return;}this.completeQuest();}
 startBattle(){
  this.s.phase='battle';this.s.enemies=[];this.target=null;this.waypoints=[];this.attackTarget=null;const q=this.q,count=q.count||3,tier=Math.max(1,Math.floor(this.s.quest/9)+1);
  for(let i=0;i<count;i++){const boss=(q.type==='boss'||q.boss)&&i===count-1;const hp=q.scriptedLoss?8000:(boss?430:120)+tier*(boss?125:35);this.s.enemies.push({id:i,x:760+(i%4)*155,y:580+Math.floor(i/4)*110+(i%2)*50,hp,maxHp:hp,attackTimer:1.5+i*.4,telegraph:0,skillTimer:boss?5:999,sprite:q.friendly?0:3,name:boss?(q.boss||q.npc||'首领'):(q.enemy||'敌方武人'),boss,direction:-1,flash:0,tier});}this.emit('battle');
 }
 applyEffects(effects={}){for(const [k,v] of Object.entries(effects.flags||{}))this.s.flags[k]=v;for(const [k,v] of Object.entries(effects.affection||{}))if(k in this.s.affection)this.s.affection[k]+=v;this.s.flags.moral+=(effects.moral||0);this.s.flags.evil+=(effects.evil||0);for(const id of effects.skills||[])this.unlock(id);for(const [id,count] of Object.entries(effects.items||{}))if(ITEMS[id])this.s.inventory[id]=(this.s.inventory[id]||0)+count;if(effects.companion!==undefined)this.s.flags.companion=effects.companion;}
 choose(index){const options=this.q.choice?.options;if(this.s.phase!=='choice'||!options||!Number.isInteger(index)||!options[index])return false;const choice=options[index];this.s.choices[this.q.id]=index;this.applyEffects(choice.effects);if(this.q.repeatRefusal&&index===1){this.s.flags.refusals=(this.s.flags.refusals||0)+1;if(this.s.flags.refusals<4){this.emit('choice');return true;}this.s.flags.forsake=true;}if(choice.ending){this.finish(choice.ending);return true;}this.completeQuest();return true;}
 completeQuest(){
  if(this.s.completed)return;const q=this.q;if(this.s.done.includes(q.id))return;this.s.done.push(q.id);this.applyEffects(q.rewards);this.gainExp(q.xp||65);this.s.coins+=q.money||15;if(q.type==='battle'||q.type==='boss'){this.s.potions++;this.s.elixirs++;}
  if(q.setRoute){const affection=Object.values(this.s.affection).reduce((a,b)=>a+b,0);this.s.flags.route=affection>=2||(affection>=0&&this.s.flags.moral>=0)?'good':'evil';this.s.flags.companion=this.s.flags.route==='evil'?null:'纳兰真';}
  if(q.ending){this.finish(chooseEnding(this.s));return;}
  this.s.quest++;while(QUESTS[this.s.quest]?.when&&!this.matches(QUESTS[this.s.quest].when)){this.s.quest++;}
  if(this.s.quest>=QUESTS.length){this.s.quest=QUESTS.length-1;this.finish(chooseEnding(this.s));return;}
  this.s.phase=this.s.map===this.q.map?'talk':'travel';this.s.collected=0;this.s.enemies=[];this.target=null;this.waypoints=[];this.autoInteract=null;this.emit('quest');
 }
 matches(when){if(when.route){const route=this.s.flags.route||'good';if(route!==when.route)return false;}if(when.flag&&!this.s.flags[when.flag])return false;if(when.not&&this.s.flags[when.not])return false;return true;}
 finish(id){if(!ENDINGS[id])id='reunion';this.s.ending=id;this.s.completed=true;this.s.phase='complete';this.s.flags.companion=null;this.emit('ending');}
 travel(id){if(this.s.phase==='battle'){this.emit('toast',{text:'交战中无法离开。'});return false;}if(!MAPS[id]||(!this.s.visited.includes(id)&&id!==this.q.map))return false;this.s.map=id;if(!this.s.visited.includes(id))this.s.visited.push(id);this.s.phase=this.s.completed?'complete':id===this.q.map?'talk':'travel';this.s.collected=0;this.target=null;this.waypoints=[];this.s.hero.x=800;this.s.hero.y=755;this.followPosition={x:735,y:780};this.autoInteract=null;this.attackTarget=null;this.effects=[];this.s.enemies=[];this.emit('chapter');return true;}
 advance(){return this.travel(this.q.map);}
 unlock(id){if(!SKILLS[id]||Object.hasOwn(this.s.skills,id))return;this.s.skills[id]=0;const free=this.s.hotbar.indexOf(null);if(free!==-1)this.s.hotbar[free]=id;this.emit('unlock',{id});}
 equipSkill(id,slot){if(!SKILLS[id]||!Object.hasOwn(this.s.skills,id)||!Number.isInteger(slot)||slot<0||slot>4)return false;const existing=this.s.hotbar.indexOf(id);if(existing!==-1)this.s.hotbar[existing]=this.s.hotbar[slot];this.s.hotbar[slot]=id;return true;}
 skillLevel(id){return Math.min(10,1+Math.floor((this.s.skills[id]||0)/50));}
 damageBonus(){return (ITEMS[this.s.equipment.weapon]?.attack||0);}
 cast(index){const skill=SKILLS[index],h=this.s.hero;if(!skill||this.paused||!this.active||this.s.completed)return false;if(index!==0&&!Object.hasOwn(this.s.skills,index)){this.emit('toast',{text:'这门武学尚未习得。'});return false;}if(this.s.cooldowns[index]>0)return false;if(h.mp<skill.cost){this.emit('toast',{text:'内力不足，可用补气丹或在安全处打坐。'});return false;}if(skill.heal&&h.hp>=h.maxHp)return false;
  h.mp-=skill.cost;this.s.cooldowns[index]=skill.cooldown;this.hitTime=.3;this.emit('cast',{index});const level=this.skillLevel(index);if(index)this.s.skills[index]=Math.min(500,(this.s.skills[index]||0)+1);
  if(skill.heal){const amount=Math.min(h.maxHp-h.hp,130+h.level*14+level*10);h.hp+=amount;this.addNumber('+'+amount,h.x,h.y-100,'#c7efad');this.addEffect('heal',h.x,h.y,100,skill.color,1);return true;}
  if(skill.shield){this.s.flags.shield=8+level*.3;this.addEffect('heal',h.x,h.y,120,skill.color,1);return true;}
  const sorted=this.s.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(h,a)-distance(h,b));const nearest=sorted[0];if(nearest){this.attackAngle=Math.atan2((nearest.y-h.y)*.8,nearest.x-h.x);h.direction=nearest.x>=h.x?1:-1;}
  this.addEffect(index===0?'slash':skill.effect||'moon',h.x,h.y-30,skill.range*.52,skill.color,index===0?.35:.85);let hit=0;
  for(const e of sorted){if(distance(h,e)>skill.range)continue;if(index===0&&hit)break;const damage=Math.round((skill.damage+this.damageBonus())*(1+(h.level-1)*.055)*(1+(level-1)*.08));e.hp=Math.max(0,e.hp-damage);e.flash=.2;this.addNumber(damage,e.x,e.y-90,skill.color);hit++;if(skill.slow)e.slow=3;if(e.hp===0){this.s.kills++;this.s.coins+=e.boss?80:15;this.gainExp(e.boss?100:25);this.addEffect('spark',e.x,e.y-40,55,'#eac98a',.8);}}
  if(this.s.phase==='battle'&&this.s.enemies.every(e=>e.hp<=0)){this.s.phase='after';this.attackTarget=null;this.target=null;this.waypoints=[];if(this.q.openingEnding)this.finish('opening');else this.emit('victory');}return true;
 }
 gainExp(n){const h=this.s.hero;h.exp+=n;while(h.exp>=100+h.level*60){h.exp-=100+h.level*60;h.level++;h.maxHp+=38;h.maxMp+=15;h.hp=h.maxHp;h.mp=h.maxMp;this.addEffect('heal',h.x,h.y,140,'#ebd18b',1.4);this.emit('level');}if(h.level>=50&&this.settings.difficulty==='story')this.unlock(10);}
 potion(){if(this.s.potions<=0){this.emit('toast',{text:'金创药已用尽，可拜访商人补充。'});return false;}const h=this.s.hero;if(h.hp>=h.maxHp){this.emit('toast',{text:'气血充盈。'});return false;}const n=Math.min(h.maxHp-h.hp,Math.max(180,h.maxHp*.48));h.hp+=n;this.s.potions--;this.addNumber('+'+Math.round(n),h.x,h.y-90,'#c8e5af');return true;}
 elixir(){if(this.s.elixirs<=0){this.emit('toast',{text:'补气丹已用尽，可在安全处按 V 打坐。'});return false;}const h=this.s.hero;if(h.mp>=h.maxMp)return false;h.mp=Math.min(h.maxMp,h.mp+Math.max(120,h.maxMp*.6));this.s.elixirs--;return true;}
 buy(id){const item=ITEMS[id];if(!item||!item.price||this.s.phase==='battle')return false;if(this.s.coins<item.price){this.emit('toast',{text:'银两不足。'});return false;}this.s.coins-=item.price;if(id==='potion')this.s.potions++;else if(id==='elixir')this.s.elixirs++;else this.s.inventory[id]=(this.s.inventory[id]||0)+1;this.emit('purchase',{id});return true;}
 equip(id){const item=ITEMS[id];if(!item||!['weapon','armor'].includes(item.type)||!(this.s.inventory[id]||['family_sword','cotton_robe'].includes(id)))return false;this.s.equipment[item.type]=id;return true;}
 side(id){const q=SIDE_QUESTS.find(q=>q.id===id);if(!q||q.map!==this.s.map||this.s.sideDone.includes(id))return false;
  const required=q.herbs?['ginger','garlic','poppy']:q.requireItem?[q.requireItem]:q.fetch?[q.fetch]:[];if(required.some(k=>!this.s.inventory[k])){this.emit('toast',{text:'还需要：'+required.filter(k=>!this.s.inventory[k]).map(k=>ITEMS[k].name).join('、')});return false;}
  if(q.cost&&this.s.coins<q.cost){this.emit('toast',{text:'需要 '+q.cost+' 两银子。'});return false;}this.s.coins-=q.cost||0;
  if(q.repeat){this.s.flags[id+'Count']=(this.s.flags[id+'Count']||0)+1;if(this.s.flags[id+'Count']<q.repeat){this.emit('toast',{text:'已施舍 '+this.s.flags[id+'Count']+' 次。'});return true;}}
  for(const k of required){this.s.inventory[k]--;if(this.s.equipment.weapon===k)this.s.equipment.weapon='family_sword';}this.s.sideDone.push(id);this.applyEffects(q.rewards);if(this.s.inventory.sheepskin>=7)this.unlock(18);this.gainExp(75);this.emit('sideComplete',{id});return true;}
 dash(){if(this.paused||this.s.hero.stamina<24||this.dashTime>0)return false;const h=this.s.hero;let dx=0,dy=0;if(this.target){dx=this.target.x-h.x;dy=this.target.y-h.y;}else{dx=(this.keys.has('ArrowRight')||(this.settings.controls==='modern'&&this.keys.has('d'))?1:0)-(this.keys.has('ArrowLeft')||(this.settings.controls==='modern'&&this.keys.has('a'))?1:0);dy=(this.keys.has('ArrowDown')||(this.settings.controls==='modern'&&this.keys.has('s'))?1:0)-(this.keys.has('ArrowUp')||(this.settings.controls==='modern'&&this.keys.has('w'))?1:0);if(!dx&&!dy)dx=h.direction;}const len=Math.hypot(dx,dy)||1,nx=clamp(h.x+dx/len*145,420,1390),ny=clamp(h.y+dy/len*105,530,910);if(!this.passable(nx,ny))return false;this.addEffect('dash',h.x,h.y,60,'#c5e8e5',.6);h.x=nx;h.y=ny;h.stamina-=24;this.dashTime=.6;this.emit('dash');return true;}
 meditate(){if(this.paused)return;if(this.s.phase==='battle'){this.emit('toast',{text:'交战中无法打坐。'});return;}this.meditating=!this.meditating;this.target=null;this.waypoints=[];this.emit('toast',{text:this.meditating?'凝神静气，恢复气血与内力。':'收功起身。'});}
 tick(dt){dt=clamp(dt,0,.05);if(this.paused||!this.active)return;this.time+=dt;this.s.playTime+=dt;this.dashTime=Math.max(0,this.dashTime-dt);this.hitTime=Math.max(0,this.hitTime-dt);this.s.cooldowns=this.s.cooldowns.map(c=>Math.max(0,c-dt));this.s.flags.shield=Math.max(0,(this.s.flags.shield||0)-dt);const h=this.s.hero;h.stamina=Math.min(100,h.stamina+dt*12);h.mp=Math.min(h.maxMp,h.mp+dt*(this.meditating?35:this.s.phase==='battle'?2:6));if(this.meditating)h.hp=Math.min(h.maxHp,h.hp+dt*30);
  let dx=(this.keys.has('ArrowRight')||(this.settings.controls==='modern'&&this.keys.has('d'))?1:0)-(this.keys.has('ArrowLeft')||(this.settings.controls==='modern'&&this.keys.has('a'))?1:0),dy=(this.keys.has('ArrowDown')||(this.settings.controls==='modern'&&this.keys.has('s'))?1:0)-(this.keys.has('ArrowUp')||(this.settings.controls==='modern'&&this.keys.has('w'))?1:0);
  if(dx||dy){this.target=null;this.waypoints=[];this.attackTarget=null;this.autoInteract=null;this.meditating=false;}else if(this.target){dx=this.target.x-h.x;dy=this.target.y-h.y;if(Math.hypot(dx,dy)<8){this.target=this.waypoints.shift()||null;dx=dy=0;}}
  if(dx||dy){this.meditating=false;const len=Math.hypot(dx,dy),speed=this.keys.has('Shift')&&h.stamina>3?250:190,nx=h.x+dx/len*speed*dt,ny=h.y+dy/len*speed*.73*dt;if(this.passable(nx,h.y))h.x=nx;if(this.passable(h.x,ny))h.y=ny;if(speed===250)h.stamina=Math.max(0,h.stamina-dt*12);if(Math.abs(dx)>.01)h.direction=dx>=0?1:-1;this.walkTime+=dt*11;}else this.walkTime=0;
  if(this.s.phase==='escape'){this.s.timer-=dt;if(this.s.timer<=0){this.s.phase='talk';h.x=800;h.y=740;this.target=null;this.emit('toast',{text:'未能及时撤出。回到缺口前，重新寻找出路。'});}}
  this.followPosition.x+=(h.x-65-this.followPosition.x)*dt*2;this.followPosition.y+=(h.y+35-this.followPosition.y)*dt*2;
  if(this.autoInteract){const marker=this.markers.find(m=>m.id===this.autoInteract);if(marker&&distance(h,marker)<135){this.target=null;this.waypoints=[];this.interact(marker);}}
  if(this.attackTarget&&this.attackTarget.hp>0){if(distance(h,this.attackTarget)<175){this.target=null;this.waypoints=[];this.cast(0);}else if(!this.target){this.waypoints=this.findPath(this.attackTarget.x,this.attackTarget.y+30);this.target=this.waypoints.shift()||null;}}
  if(this.keys.has('j'))this.cast(0);
  if(this.s.phase==='battle'){
   for(const e of this.s.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,(e.slow||0)-dt);e.direction=h.x>=e.x?1:-1;const d=distance(h,e);if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){this.addEffect('fire',e.x,e.y,200,'#ee7464',.7);if(d<250&&this.dashTime<=0)this.hurt(e,2.2);}continue;}
    e.skillTimer-=dt;if(e.boss&&e.skillTimer<=0){e.telegraph=1.15;e.skillTimer=6;this.emit('warning',{name:e.name});continue;}
    if(d>102){const len=Math.hypot(h.x-e.x,h.y-e.y)||1,speed=(e.boss?74:65)*(e.slow>0?.4:1);const nx=e.x+(h.x-e.x)/len*speed*dt,ny=e.y+(h.y-e.y)/len*speed*.72*dt;if(this.passable(nx,ny)){e.x=nx;e.y=ny;}}
    e.attackTimer-=dt;if(e.attackTimer<=0&&d<128){e.attackTimer=e.boss?1.3:1.9;this.addEffect('enemy',e.x,e.y-30,60,'#eb7f70',.35);if(this.dashTime<=0)this.hurt(e,1);}
   }if(h.hp<=0){if(this.q.scriptedLoss){h.hp=Math.round(h.maxHp*.25);this.s.enemies=[];this.s.phase='after';this.emit('scriptedLoss');}else{this.paused=true;this.target=null;this.emit('defeat');}}
  }
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);this.numbers=this.numbers.filter(n=>(n.life-=dt)>0);
 }
 hurt(e,mult){const armor=ITEMS[this.s.equipment.armor]?.defense||0,damage=Math.max(2,Math.round(((e.boss?15:7)+e.tier*2-armor)*mult*(this.settings.difficulty==='story'?.42:1)*(this.s.flags.shield>0?.4:1)));this.s.hero.hp=Math.max(0,this.s.hero.hp-damage);this.addNumber('-'+damage,this.s.hero.x,this.s.hero.y-95,'#ffa394');this.emit('hurt');}
 retry(){this.s.hero.hp=this.s.hero.maxHp;this.s.hero.mp=this.s.hero.maxMp;this.s.hero.stamina=100;this.s.hero.x=800;this.s.hero.y=750;this.s.cooldowns=Array(SKILLS.length).fill(0);this.paused=false;this.startBattle();}
}
