// Original dream lighting and costume accents; no extracted images or frames.
export function drawDreamAccessories(){
 const seq=this.e.s.sequence;if(seq?.sceneKey!=='weddingDream')return;
 const actors=[this.e.s.hero,...seq.actors.filter(a=>a.id==='wedding-rose'&&!a.hidden)],c=this.ctx;
 for(const a of actors){c.save();c.translate(a.x,a.y);c.strokeStyle='#982f34';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-12,-88);c.quadraticCurveTo(-4,-62,18,-40);c.stroke();c.strokeStyle='#dca45b';c.lineWidth=1;c.beginPath();c.moveTo(-15,-88);c.quadraticCurveTo(-7,-62,15,-40);c.stroke();this.ellipse(13,-49,7,5,'#b63b3c','#e4b27b',1);c.restore();}
}
export function drawDreamOverlay(){
 const seq=this.e.s.sequence;if(!seq)return;const c=this.ctx,definition=this.e.stagingDefinition();
 if(seq.cues.dreamThreat&&seq.sceneKey==='weddingDream'){c.save();const haze=c.createRadialGradient(810,570,120,810,570,900);haze.addColorStop(0,'#290b0b00');haze.addColorStop(1,'#430914aa');c.fillStyle=haze;c.fillRect(0,0,1536,1024);c.restore();}
 const fade=seq.cues.dreamFade;if(!fade)return;
 let alpha=fade==='out'?1:0;
 const prior=definition.steps[seq.step-1],step=definition.steps[seq.step];
 if(prior?.type==='cue'&&prior.key==='dreamFade'&&step?.type==='wait'){const progress=Math.min(1,seq.elapsed/Math.min(.8,step.duration));alpha=fade==='out'?progress:1-progress;}
 if(alpha>0){c.save();c.globalAlpha=alpha;c.fillStyle='#0c1420';c.fillRect(0,0,1536,1024);c.restore();}
}
