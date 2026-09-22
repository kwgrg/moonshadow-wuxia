// Original geometry overlays; no reference artwork or original animation frames.
export function drawForbiddenGate(){
 const mechanism=this.scene.mechanism;if(!mechanism)return;
 if(this.e.s.flags.evilGateOpened||this.e.s.sequence?.cues.gateOpen)return;
 const c=this.ctx,x=mechanism.x||800,y=mechanism.y||242,w=270,h=245;
 c.save();c.translate(x,y);const stone=c.createLinearGradient(-w/2,0,w/2,0);stone.addColorStop(0,'#263938');stone.addColorStop(.45,'#53605a');stone.addColorStop(.51,'#2b403b');stone.addColorStop(1,'#263b38');
 c.fillStyle=stone;c.fillRect(-w/2,-h,w,h);c.strokeStyle='#7c82716e';c.lineWidth=4;c.strokeRect(-w/2+7,-h+7,w-14,h-10);
 for(const side of [-1,1]){c.strokeStyle='#99a28a55';c.lineWidth=2;c.strokeRect(side<0?-122:10,-h+21,112,h-39);for(let i=0;i<3;i++){const yy=-h+46+i*63;c.beginPath();c.moveTo(side*12,yy);c.lineTo(side*110,yy);c.stroke();}this.ellipse(side*27,-95,7,10,'#85876b','#b0ae86',1);}
 c.strokeStyle='#152b2a';c.lineWidth=4;c.beginPath();c.moveTo(0,-h);c.lineTo(0,0);c.stroke();c.restore();
}
export function drawForbiddenProp(p){
 if(p.kind==='forbiddenDoor')return true; // Door also appears on unplayed / legacy revisits.
 if(p.kind!=='jadeSocket')return false;
 const c=this.ctx,cues=p.cues||{},lit=p.side==='left'?cues.jadeLeft:cues.jadeRight;
 c.save();c.translate(p.x,p.y);this.ellipse(0,0,15,7,'#243d38','#83927b',1);
 if(lit||this.e.s.flags.evilGateOpened){this.ellipse(0,-1,12,5,'#9bbb9c','#d2d6b5',1);this.glow(0,0,24,'#96bb93');c.strokeStyle='#d1d6b4';c.lineWidth=1;c.beginPath();c.moveTo(-2,-5);c.lineTo(1,4);c.stroke();}c.restore();return true;
}
export function drawForbiddenAction(){
 const s=this.e.s.sequence,step=s&&this.e.stagingDefinition()?.steps[s.step];if(!step||!['useJade','readLetter'].includes(step.type))return;
 const a=this.e.stagingActor(step.actor);if(!a||a.hidden)return;
 const c=this.ctx,t=Math.min(1,s.elapsed/(step.duration||1)),lift=Math.sin(Math.PI*t)*6;
 c.save();c.translate(a.x+(a.direction||1)*25,a.y-73-lift);c.strokeStyle='#ccbb9e';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(-17,11);c.lineTo(-4,0);c.stroke();
 if(step.type==='useJade'){c.fillStyle='#a5c6aa';c.strokeStyle='#e5dfb4';c.lineWidth=1.4;c.beginPath();c.arc(0,0,11,-Math.PI/2,Math.PI/2);c.closePath();c.fill();c.stroke();}
 else{c.rotate(-.16);c.fillStyle='#d1bc86';c.fillRect(-16,-12,31,26);c.strokeStyle='#998053';c.lineWidth=1;c.strokeRect(-16,-12,31,26);c.beginPath();c.moveTo(-1,-12);c.lineTo(-1,14);c.stroke();}c.restore();
}
