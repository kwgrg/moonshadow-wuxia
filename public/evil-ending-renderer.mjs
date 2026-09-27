// Independently drawn scene details. Cues are presentation, never inventory or damage.
export function drawEvilEndingDetails(){
 const q=this.e.q,s=this.e.s,p=this.e.stagingPresentation?.();
 if(!q.id.startsWith('e14_')||s.map!==q.map||!p)return;
 const cues=p.cues||{},c=this.ctx,h=s.hero;
 if(q.id==='e14_poison'&&cues.evilFinalSoup==='served'){
  // A small serving table at the authored floor position; no copied prop texture.
  c.save();c.translate(870,685);c.fillStyle='#49342a';c.fillRect(-21,-12,5,23);c.fillRect(15,-10,5,22);
  this.polygon([[-28,-25],[21,-22],[29,-12],[-23,-15]],'#8f6746','#c09a6d',1.2);
  this.ellipse(0,-23,14,6,'#d9d5b9','#aeb8a5',1.2);this.ellipse(0,-25,11,4,'#ad8247','#d2b775',1);
  c.strokeStyle='#d1b184';c.lineWidth=2;c.beginPath();c.moveTo(5,-25);c.lineTo(24,-32);c.stroke();
  if(cues.evilFinalPoison!=='active'){c.strokeStyle='#ece4cd66';c.lineWidth=1;c.beginPath();c.moveTo(-4,-31);c.quadraticCurveTo(-12,-41,-4,-50);c.stroke();}
  c.restore();
 }
 if(cues.evilFinalPoison==='active'){
  c.save();c.translate(h.x,h.y);this.ellipse(0,2,35,11,'#31224438');
  c.font='12px "Noto Serif SC",serif';c.textAlign='center';c.fillStyle='#d7b5d4';c.shadowColor='#151126';c.shadowBlur=6;c.fillText('毒发',0,-119);c.restore();
 }
 const time=q.id==='e14_recovery'&&cues.evilFinalMonths==='three'?'三个月后':q.id==='e14_family'&&cues.evilFinalYears==='five'?'五年以后':null;
 if(time&&s.phase==='staging'){
  c.save();c.font='24px "Noto Serif SC",serif';c.textAlign='center';c.fillStyle='#e9d7ad';c.shadowColor='#202a27';c.shadowBlur=8;c.fillText(time,768,250);c.restore();
 }
}

// Cage geometry is authored to match this project's collision footprints.
export function drawEvilCellGate(p){
 const c=this.ctx,[left,back,right,front]=p.bounds,[doorLeft,,doorRight]=p.door,height=p.h||125;
 const rail=(ax,ay,bx,by)=>{
  c.beginPath();c.moveTo(ax,ay-height);c.lineTo(bx,by-height);c.moveTo(ax,ay-17);c.lineTo(bx,by-17);c.stroke();
  const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/20));
  for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;c.beginPath();c.moveTo(x,y-height);c.lineTo(x,y);c.stroke();}
 };
 c.save();c.strokeStyle='#3b4241';c.lineWidth=4;c.lineCap='round';
 rail(left,back,right,back);rail(left,back,left,front);rail(right,back,right,front);
 rail(left,front,doorLeft,front);rail(doorRight,front,right,front);
 if(p.opened){rail(doorLeft,front,doorLeft-42,front+42);rail(doorRight,front,doorRight+42,front+42);}
 else{rail(doorLeft,front,doorRight,front);c.fillStyle='#ac8d52';c.fillRect((doorLeft+doorRight)/2-5,front-74,10,17);}
 c.strokeStyle='#a6aaa088';c.lineWidth=1;c.beginPath();c.moveTo(left,back-height);c.lineTo(right,back-height);c.stroke();c.restore();
}
