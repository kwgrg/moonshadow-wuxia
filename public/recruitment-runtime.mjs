// Independent choice-state implementation. Story thresholds live in authored
// quest data; a terminal refusal is distinct from a recoverable combat defeat.
export const recruitmentMethods={
 refusalCount(){const key=this.q.refusalRule?.key||this.q.id;return Math.max(0,Math.floor(Number(this.s.flags['refusal_'+key])||0));},
 refusalOutcome(index){const rule=this.q.refusalRule;if(!rule||index!==(rule.refuseIndex??1))return null;return this.refusalCount()+1<rule.limit?'repeat':rule.outcome==='fatal'?'fatal':'continue';},
 resolveRefusal(index){
  const outcome=this.refusalOutcome(index);if(!outcome)return false;
  const rule=this.q.refusalRule,key='refusal_'+(rule.key||this.q.id);this.s.flags[key]=Math.min(rule.limit,this.refusalCount()+1);
  if(outcome==='repeat'){this.emit('choice');return true;}
  if(outcome==='fatal'){
   this.s.failure={kind:'refusal',questId:this.q.id,hpBefore:this.s.hero.hp};this.s.hero.hp=0;this.s.phase='failed';this.s.enemies=[];
   this.s.destination=null;this.target=null;this.waypoints=[];this.autoInteract=null;this.attackTarget=null;this.keys.clear();this.paused=true;this.emit('storyFailure');return true;
  }
  return false;
 },
 retryRefusal(){
  const failure=this.s.failure,rule=this.q.refusalRule;
  if(!failure||failure.questId!==this.q.id||failure.kind!=='refusal'||!rule)return false;
  this.s.hero.hp=Math.max(1,Math.min(this.s.hero.maxHp,failure.hpBefore||Math.round(this.s.hero.maxHp*.25)));
  this.s.flags['refusal_'+(rule.key||this.q.id)]=rule.limit-1;delete this.s.choices[this.q.id];this.s.failure=null;this.s.phase='choice';this.paused=false;this.emit('choice');return true;
 }
};
