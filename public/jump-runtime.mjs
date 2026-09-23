// Fixed authored leaps. Saves keep the safe departure footpoint until landing.
const near=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
export const jumpMethods={
 jumpMarkers(){return (this.scene.jumps||[]).flatMap(jump=>['a','b'].map(side=>({id:'jump-'+jump.id+'-'+side,jumpId:jump.id,side,kind:'jump',...jump[side],name:side==='a'?'跃向湖心 · Space':'跃回岸边 · Space',sprite:null,main:false})));},
 pathToJumpFor(goal){
  for(const jump of this.scene.jumps||[])for(const side of ['a','b']){
   const from=jump[side],to=jump[side==='a'?'b':'a'],path=this.findPath(from.x,from.y);
   if(path.length&&this.findPath(goal.x,goal.y,to).length){this.emit('toast',{text:'水面无法步行。走到岸边标记，按空格或交互跃过去。'});return path;}
  }
  return [];
 },
 startJump(id,side){
  if(this.paused||this.s.failure||this.s.sequence||this.jump||this.s.phase==='battle'||!['a','b'].includes(side))return false;
  const def=this.scene.jumps?.find(j=>j.id===id);if(!def)return false;
  const from=def[side],to=def[side==='a'?'b':'a'];
  if(near(this.s.hero,from)>100||!this.clearSegment(this.s.hero,from)||!this.passable(to.x,to.y))return false;
  if(this.s.hero.stamina<24){this.emit('toast',{text:'稍候片刻，待体力恢复再起跳。'});return false;}
  this.jump={id,side,map:this.s.map,from:{x:this.s.hero.x,y:this.s.hero.y},to:{...to},elapsed:0,duration:.85};
  this.s.hero.stamina-=24;this.s.hero.direction=to.x>=this.s.hero.x?1:-1;this.target=null;this.waypoints=[];this.autoInteract=null;this.keys.clear();this.attackTarget=null;this.meditating=false;this.emit('jump');return true;
 },
 renderJump(){if(!this.jump)return null;const j=this.jump,t=Math.min(1,j.elapsed/j.duration);return {x:j.from.x+(j.to.x-j.from.x)*t,y:j.from.y+(j.to.y-j.from.y)*t,jumpHeight:Math.sin(t*Math.PI)*95};},
 tickJump(dt){const j=this.jump;if(!j)return;j.elapsed+=dt;if(j.elapsed>=j.duration){if(j.map===this.s.map&&this.passable(j.to.x,j.to.y))Object.assign(this.s.hero,j.to);this.jump=null;this.resetParty();this._portalCooldown=.4;this.emit('jumpLanded');}},
};
