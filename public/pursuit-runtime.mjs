// Independently designed persistent pursuit: no countdown, damage or inventory rewards.
import {getScene} from './world.mjs';
const near=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.3);
const actorAt=p=>({id:'pursuit-shadow',name:'真儿的身影',sprite:1,x:p.x,y:p.y,direction:1});
export function restorePursuit(raw,quest,state,region={}){
 if(!quest.pursuit||raw?.questId!==quest.id||quest.requiredFlags?.some(key=>!state.flags[key]))return null;
 const scene=getScene(quest.map,region),path=scene.pursuitPath||[];
 if(!path.length||!Number.isInteger(raw.point)||raw.point<0||raw.point>=path.length)return null;
 const base=path[raw.point],a=raw.actor,[l,t,r,b]=scene.bounds;
 const valid=!!a&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=l&&a.x<=r&&a.y>=t&&a.y<=b&&!scene.obstacles.some(v=>a.x>v[0]-8&&a.x<v[2]+8&&a.y>v[1]-8&&a.y<v[3]+8);
 return {questId:quest.id,point:raw.point,actor:{...actorAt(valid?a:base),direction:a?.direction===-1?-1:1},finished:raw.finished===true&&valid&&raw.point===path.length-1&&near(a,path.at(-1))<8&&near(state.hero,a)<170};
}
export const pursuitMethods={
 pursuitMarker(){if(!this.q.pursuit||this.s.map!==this.q.map)return null;const path=this.scene.pursuitPath||[];return path.length?{...(this.s.pursuit?.questId===this.q.id?this.s.pursuit.actor:actorAt(path[0])),kind:'pursuit',main:true}:null;},
 startPursuit(){if(!this.q.pursuit||this.s.map!==this.q.map||!this.requireQuestFlags())return false;const path=this.scene.pursuitPath;if(!path?.length)return false;if(this.s.pursuit?.questId!==this.q.id)this.s.pursuit={questId:this.q.id,point:0,actor:actorAt(path[0]),finished:false};this.s.phase='pursuit';this.emit('objective');return true;},
 followPursuit(){if(this.s.phase!=='pursuit'||!this.s.pursuit)return false;this._pursuitFollow=true;this.autoInteract=null;this.s.destination=null;return true;},
 tickPursuit(dt){
  const p=this.s.pursuit;if(this.s.phase!=='pursuit'||!p||p.questId!==this.q.id||this.s.map!==this.q.map)return;
  const path=this.scene.pursuitPath,a=p.actor,hero=this.s.hero;
  if(p.finished){this.completeQuest();return;}
  if(near(a,path[p.point])<8){
   if(p.point===path.length-1){if(near(hero,a)<170){p.finished=true;this._pursuitFollow=false;this.completeQuest();return;}}
   else if(near(hero,a)<340){p.point++;this._pursuitPath=null;this.emit('pursuitProgress');}
  }
  const target=path[p.point];
  if(near(a,target)>5){
   if(!this._pursuitPath?.length){this.s.hero=a;this._pursuitPath=this.findPath(target.x,target.y);this.s.hero=hero;}
   const next=this._pursuitPath?.[0];
   if(next){const dx=next.x-a.x,dy=next.y-a.y,d=Math.hypot(dx,dy),stride=Math.min(d,145*dt);if(d<3){a.x=next.x;a.y=next.y;this._pursuitPath.shift();}else{a.x+=dx/d*stride;a.y+=dy/d*stride;if(Math.abs(dx)>1)a.direction=dx>0?1:-1;}}
  }
  this._pursuitSaveTime=(this._pursuitSaveTime||0)+dt;if(this._pursuitSaveTime>=1){this._pursuitSaveTime=0;this.emit('pursuitProgress');}
  if(this._pursuitFollow){this._pursuitFollowTime=(this._pursuitFollowTime||0)-dt;if(this._pursuitFollowTime<=0){this._pursuitFollowTime=.55;if(near(hero,a)>90)this.approach(a);}}
 }
};
