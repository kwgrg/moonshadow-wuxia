import {drawDreamAccessories,drawDreamOverlay} from './night-dream-renderer.mjs';
import {drawForbiddenGate,drawForbiddenProp,drawForbiddenAction} from './forbidden-renderer.mjs';
import {clamp} from './runtime.mjs';
import {getScene} from './world.mjs';

const W=1536,H=1024,TAU=Math.PI*2;
const FONT='"Noto Serif SC","Songti SC",SimSun,serif';

// Common role portraits. These are archetypes, not claims of original likeness.
// Cell order is shared with the dialogue UI: 4 columns × 2 rows, 384 × 512.
export function npcCellFor(name){
  const n=String(name||'').replace(/幻影$/,'');
  if(!n||/杨影枫|纳兰真|紫轩|月眉儿|红衣少女|陌生女子/.test(n))return null;
  if(/蔷薇|捕兽夹紫衣少女/.test(n))return 7;
  if(/老板|掌柜|小二|店主|酒保|李总管/.test(n))return 0;
  if(/商人|行商|货郎|张仲天/.test(n))return 1;
  if(/道士|道长|天星|张惟宜/.test(n))return 2;
  if(/老头|老者|老丈|长老|钓叟|纳兰潜凛|孟知秋/.test(n))return 3;
  if(/强盗|匪|刺客|黑衣|蒙面|叛众|帮凶|打手|伏兵|劫持者|追兵|守卫|塔卫|来犯|刀客/.test(n))return 6;
  if(/弟子|执事|铁云|卓非凡/.test(n))return 5;
  if(/村民|路人|酒客|书生|王炜|乞丐|家丁|大夫|小叁子|李四/.test(n))return 4;
  return null;
}
// Scene footprints drive collision; this renderer draws their visible objects.
export class Renderer {
  constructor(canvas,mini,engine,assets) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mini=mini;this.mctx=mini.getContext('2d');
    this.e=engine;this.assets=assets;this.cameraX=0;this.cameraY=0;this.s=1;this.resize();
  }
  get scene(){return this.e.scene||getScene(this.e.s.map,this.e.region||this.e.chapter);}
  get allies(){const main=this.e.s.phase==='after'?this.e.markers.find(marker=>marker.main):null;return this.e.s.map===this.e.q.map&&this.e.q.skirmish?(this.e.s.allies||[]).filter(ally=>!main||ally.name!==main.name):[];}
  get background(){const s=this.scene;return this.assets[s.art]||this.assets[s.fallbackArt]||this.assets[this.e.chapter.art];}
  resize(){this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;this.dpr=Math.min(devicePixelRatio||1,this.e.settings.quality==='high'?2:1.25);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.s=Math.max(this.w/W,this.h/H);if(this.w<760)this.s=Math.max(this.s,.75);}
  camera(){const focus=this.e.stagingFocus?.()||this.e.s.hero;const x=clamp(this.w/2-focus.x*this.s,this.w-W*this.s,0),y=clamp(this.h*.61-focus.y*this.s,this.h-H*this.s,0);this.cameraX+=(x-this.cameraX)*.08;this.cameraY+=(y-this.cameraY)*.08;}
  toWorld(x,y){return{x:(x-this.cameraX)/this.s,y:(y-this.cameraY)/this.s};}
  backgroundImage(c,w,h){if(this.background)c.drawImage(this.background,0,0,w,h);else{c.fillStyle='#24403d';c.fillRect(0,0,w,h);}}
  polygon(points,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  ellipse(x,y,rx,ry,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  glow(x,y,r,color){const c=this.ctx;c.save();c.globalAlpha=.15;this.ellipse(x,y,r,r*.72,color);c.globalAlpha=.27;this.ellipse(x,y,r*.4,r*.35,color);c.restore();}
  drawRoads(){
    const c=this.ctx,s=this.scene;if(s.drawRoads===false)return;c.save();c.lineCap='round';c.lineJoin='round';
    for(const road of s.paths){
      c.beginPath();road.points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
      c.strokeStyle=s.ground.edge;c.globalAlpha=.22;c.lineWidth=road.width+8;c.stroke();
      c.strokeStyle=road.material==='wood'?'#998060':s.ground.path;c.globalAlpha=road.material==='earth'?.2:.27;c.lineWidth=road.width;c.stroke();
      if(['earth','sand'].includes(road.material))continue;
      for(let j=1;j<road.points.length;j++){
        const [ax,ay]=road.points[j-1],[bx,by]=road.points[j],len=Math.hypot(bx-ax,by-ay),steps=Math.max(1,Math.floor(len/31)),nx=-(by-ay)/(len||1),ny=(bx-ax)/(len||1);
        c.globalAlpha=.17;c.strokeStyle=s.ground.edge;c.lineWidth=1.5;
        for(let i=1;i<steps;i++){const x=ax+(bx-ax)*i/steps,y=ay+(by-ay)*i/steps;c.beginPath();c.moveTo(x+nx*road.width*.42,y+ny*road.width*.42);c.lineTo(x-nx*road.width*.42,y-ny*road.width*.42);c.stroke();}
      }
    }c.restore();
  }
  drawInteractiveItem(p){
    const c=this.ctx,atlas=this.assets.props;
    const cells={chest:[p.opened?1:0,0],stele:[2,0],bundle:[3,0],sign:[0,1],lantern:[1,1],sword:[2,1],lever:[3,1]};
    const cell=cells[p.kind];
    c.save();c.translate(p.x,p.y);
    if(atlas&&cell){
      const height=p.kind==='sword'?92:p.kind==='stele'?78:p.kind==='lantern'?88:72,width=height*.75;
      this.ellipse(0,1,width*.33,5,'#09202036');
      c.drawImage(atlas,cell[0]*384,cell[1]*512,384,512,-width/2,-height+5,width,height);
    }else{
      // Until an item image arrives, a small glint preserves the affordance
      // without inventing a large flat object over the painted scene.
      c.globalAlpha=p.opened?.35:.7;c.strokeStyle='#ddceaa';c.lineWidth=1;
      c.beginPath();c.moveTo(-4,-8);c.lineTo(0,-12);c.lineTo(4,-8);c.lineTo(0,-4);c.closePath();c.stroke();
      this.ellipse(0,1,9,3,null,'#bccdb55c',.8);
    }
    c.restore();
  }
  drawExit(m){
    const c=this.ctx,d=Math.hypot(m.x-this.e.s.hero.x,m.y-this.e.s.hero.y);
    c.save();c.strokeStyle=d<170?'#d6e5c5b0':'#b8cdb557';c.lineWidth=1.2;
    c.beginPath();c.ellipse(m.x,m.y,15,5,0,0,TAU);c.stroke();
    if(d<230){c.font=`12px ${FONT}`;c.textAlign='center';c.fillStyle='#d5dcc3';c.shadowColor='#18302e';c.shadowBlur=5;c.fillText(m.name,m.x,m.y-32);if(d<140){c.font=`11px ${FONT}`;c.fillText('E · 前往',m.x,m.y-16);}}
    c.restore();
  }
  drawProp(p){
    if(p.paintOnly)return;
    if(p.render==='point'||p.render==='marker'||p.interactive){this.drawInteractiveItem(p);return;}
    const c=this.ctx,w=p.w||70,h=p.h||55,t=this.e.time;c.save();c.translate(p.x,p.y);
    if(p.alpha!==undefined)c.globalAlpha=p.alpha;
    if(!['pool','rug','trace','water'].includes(p.kind))this.ellipse(4,4,w*.48,Math.min(24,h*.2),'#0921224b');
    switch(p.kind){
      case 'rock':
        this.polygon([[-w*.5,0],[-w*.42,-h*.58],[-w*.12,-h],[w*.32,-h*.78],[w*.52,-h*.24],[w*.4,h*.13]],'#677975','#a9b3a177',1.5);
        this.polygon([[-w*.42,-h*.58],[-w*.12,-h],[w*.11,-h*.42],[-w*.06,-h*.02]],'#8b989077');
        this.polygon([[w*.11,-h*.42],[w*.32,-h*.78],[w*.52,-h*.24],[w*.4,h*.13]],'#253c3e66');
        c.strokeStyle='#c1c6b344';c.beginPath();c.moveTo(-w*.28,-h*.12);c.lineTo(w*.08,-h*.37);c.lineTo(w*.22,-h*.2);c.stroke();break;
      case 'pine':case 'blossom':{
        const blossom=p.kind==='blossom';this.polygon([[-8,2],[-4,-h*.78],[7,-h*.8],[12,0]],'#474b3a','#172f2eaa',2);
        c.strokeStyle='#4b503d';c.lineWidth=7;c.beginPath();c.moveTo(2,-h*.3);c.lineTo(-w*.3,-h*.68);c.moveTo(4,-h*.48);c.lineTo(w*.3,-h*.81);c.stroke();
        for(let i=0;i<10;i++){const a=i*2.4,k=(i%3+1)/3,x=Math.cos(a)*w*.29*k,y=-h*.67+Math.sin(a)*h*.23;this.ellipse(x,y,w*(.18+(i%2)*.07),h*.13,blossom?['#c2a0a4da','#ddc1b6dc','#956e84d9'][i%3]:['#314c45ef','#4b6250ed','#657756de'][i%3]);}break;
      }
      case 'pool':case 'water':
        this.ellipse(0,0,w*.51,h*.51,'#a0ac9588','#354f4ec9',7);this.ellipse(0,-2,w*.46,h*.44,'#315f639e','#bcd4c07a',2);
        for(let i=0;i<4;i++)this.ellipse(Math.sin(t*.5+i)*w*.12,-h*.1+i*8,w*(.12+i*.07),4+i*2,null,'#b5d4c635',1);break;
      case 'table':case 'counter':case 'altar':case 'bench':{
        const height=p.kind==='altar'?h*.95:h*.65;c.fillStyle='#44382cee';c.fillRect(-w*.38,-height,w*.075,height);c.fillRect(w*.31,-height,w*.075,height);
        this.polygon([[-w*.5,-height],[-w*.42,-height-h*.34],[w*.47,-height-h*.34],[w*.54,-height],[w*.45,-height+h*.17],[-w*.45,-height+h*.17]],'#937452','#c2a57a88',1.5);
        c.strokeStyle='#d9bd892f';for(let i=0;i<4;i++){c.beginPath();c.moveTo(-w*.42,-height-h*.23+i*6);c.lineTo(w*.43,-height-h*.23+i*6);c.stroke();}
        if(p.kind==='table'){this.ellipse(-w*.12,-height-h*.12,15,6,'#baad8c','#493e32',2);this.ellipse(w*.21,-height-h*.08,8,4,'#e0d5b6');c.fillStyle='#6c7865';c.fillRect(w*.17,-height-h*.25,8,12);}
        if(p.kind==='altar')for(const x of [-w*.27,w*.27]){c.fillStyle='#9d6245';c.fillRect(x,-height-27,7,22);this.glow(x+3,-height-29,24,'#f4cb89');}break;
      }
      case 'column':
        this.ellipse(0,2,w*.57,14,'#6d8178','#b2bea8aa',2);c.fillStyle='#6b4539';c.fillRect(-w*.28,-h,w*.56,h);c.fillStyle='#a07556';c.fillRect(-w*.2,-h,w*.12,h);this.ellipse(0,-h,w*.35,10,'#a39171');
        c.strokeStyle='#c7b37d99';c.lineWidth=5;c.beginPath();c.moveTo(-w*.28,-h+25);c.lineTo(w*.28,-h+25);c.moveTo(-w*.28,-15);c.lineTo(w*.28,-15);c.stroke();break;
      case 'gate':case 'door':
        c.fillStyle='#514a3d';c.fillRect(-w*.38,-h*.9,w*.1,h*.9);c.fillRect(w*.28,-h*.9,w*.1,h*.9);c.fillStyle='#8e8060';c.fillRect(-w*.4,-h*.87,w*.8,16);
        this.polygon([[-w*.56,-h*.82],[-w*.35,-h],[w*.35,-h],[w*.56,-h*.82]],'#3d5550','#a9b299aa',2);this.polygon([[-w*.53,-h*.82],[w*.53,-h*.82],[w*.42,-h*.74],[-w*.42,-h*.74]],'#63716a');
        c.fillStyle='#a99060';c.fillRect(-w*.16,-h*.78,w*.32,28);c.font=`15px ${FONT}`;c.textAlign='center';c.fillStyle='#253733';c.fillText(p.label||'山门',0,-h*.78+20);break;
      case 'grave':{
        // Original procedural stone, with a small grounded soil mound. Keep
        // the existing 107px silhouette and footprint; no texture asset input.
        const earth=c.createRadialGradient(7,-1,3,7,0,43);
        earth.addColorStop(0,'#4d4431b3');earth.addColorStop(.58,'#74624770');earth.addColorStop(1,'#675c4200');
        this.ellipse(6,3,43,17,earth);this.ellipse(11,7,33,10,'#302d2433');
        this.ellipse(3,-2,34,11,'#77644b83');
        for(let i=0;i<25;i++){
          const a=i*2.39996,r=13+(i%7)*3.5,x=3+Math.cos(a)*r,y=-1+Math.sin(a)*r*.29;
          this.ellipse(x,y,1.3+(i%3)*.55,.6+(i%2)*.4,i%3?'#a18b653b':'#3e3a2c52');
        }
        const stone=c.createLinearGradient(-29,-99,34,7);
        stone.addColorStop(0,'#a49f90');stone.addColorStop(.32,'#8b897e');stone.addColorStop(.76,'#74776d');stone.addColorStop(1,'#62675f');
        const side=c.createLinearGradient(24,-80,36,-75);
        side.addColorStop(0,'#62665e');side.addColorStop(1,'#454c46');
        this.polygon([[25,1],[34,-6],[34,-94],[24,-103],[17,-106],[25,-95]],side,'#454a423b',.8);
        this.polygon([[-29,1],[-29,-88],[-27,-94],[-19,-104],[-15,-106],[17,-106],[25,-96],[27,-90],[26,1]],stone,'#464e4552',.8);
        c.save();c.clip();
        // Fixed mineral flecks and subtle bedding remain still between frames.
        for(let i=0;i<100;i++){
          const n=(i*73+Math.round(p.x)*7+Math.round(p.y)*3)%997;
          const x=-28+(n%57),y=-104+((i*47+n*3)%102);
          c.fillStyle=i%4===0?'#ded8c530':i%3===0?'#303d3430':'#c5c2ae1f';
          c.fillRect(x,y,.45+(i%3)*.45,.45+((i+1)%3)*.4);
        }
        c.lineWidth=.65;c.strokeStyle='#d7d0ba25';
        for(let i=0;i<7;i++){const y=-93+i*13;c.beginPath();c.moveTo(-25,y);c.bezierCurveTo(-12,y+2,6,y-2,25,y+1);c.stroke();}
        c.strokeStyle='#39483c35';c.beginPath();c.moveTo(-23,-86);c.lineTo(-20,-72);c.lineTo(-23,-63);c.moveTo(24,-42);c.lineTo(19,-36);c.lineTo(21,-23);c.stroke();
        c.restore();
        // Narrow bevels catch light without a bright flat rectangular inset.
        c.strokeStyle='#d0cab18c';c.lineWidth=.9;c.beginPath();c.moveTo(-28,-1);c.lineTo(-28,-87);c.lineTo(-18,-103);c.lineTo(16,-104);c.stroke();
        c.strokeStyle='#3a433a55';c.lineWidth=.8;c.beginPath();c.moveTo(22,-93);c.lineTo(23,-3);c.stroke();
        c.font=`12px ${FONT}`;c.textAlign='center';
        (p.label||'杨熙烈之墓').slice(0,6).split('').forEach((letter,i)=>{
          const y=-82+i*13;c.fillStyle='#d1c9b673';c.fillText(letter,-.25,y+.65);c.fillStyle='#42493ef0';c.fillText(letter,-1,y);
        });
        const plinth=c.createLinearGradient(0,-8,0,12);
        plinth.addColorStop(0,'#9b998a');plinth.addColorStop(.38,'#7b7f70');plinth.addColorStop(1,'#555d51');
        this.polygon([[-40,2],[-30,-8],[29,-8],[41,1],[39,11],[-38,11]],plinth,'#3c49383b',.7);
        c.strokeStyle='#bbb8a56b';c.lineWidth=.7;c.beginPath();c.moveTo(-38,2);c.lineTo(38,2);c.stroke();
        for(let i=0;i<17;i++){const x=-35+(i*19)%70,y=3+(i*7)%7;c.fillStyle=i%3?'#bdbaa430':'#343f303d';c.fillRect(x,y,1.1+(i%3),.8);}
        this.ellipse(-25,5,8,2,'#58604352');this.ellipse(29,5,6,2,'#505b4050');
        break;
      }
      case 'stele':{
        const tall=p.kind==='grave'?92:70;this.polygon([[-31,2],[-31,-tall],[-19,-tall-15],[19,-tall-15],[31,-tall],[31,2]],'#8c9b90','#ced0b3aa',2);
        c.fillStyle='#52655d';c.fillRect(-24,-tall+3,48,tall-9);c.fillStyle='#d5cfac';c.font=`${p.kind==='grave'?13:12}px ${FONT}`;c.textAlign='center';
        (p.label||(p.kind==='grave'?'杨熙烈之墓':'旧碑')).slice(0,6).split('').forEach((s,i)=>c.fillText(s,0,-tall+16+i*13));
        this.polygon([[-42,4],[-33,-8],[34,-8],[43,4],[39,13],[-38,13]],'#657e72','#b7c0a777',1);break;
      }
      case 'chest':{
        c.fillStyle='#674831';c.fillRect(-32,-27,64,29);this.polygon([[-32,-27],[-25,p.opened?-65:-39],[28,p.opened?-65:-39],[32,-27]],p.opened?'#776049':'#a0804b','#dcc49599',1.5);
        c.strokeStyle='#c4a45f';c.lineWidth=5;c.beginPath();c.moveTo(-22,-27);c.lineTo(-22,0);c.moveTo(22,-27);c.lineTo(22,0);c.stroke();
        if(p.opened){c.fillStyle='#1b2725';c.fillRect(-26,-27,52,8);}else{c.fillStyle='#d4b67c';c.fillRect(-5,-23,10,13);this.glow(0,-22,35,'#dbbe72');}break;
      }
      case 'lantern':case 'brazier':case 'incense':{
        const incense=p.kind==='incense';
        if(p.kind==='lantern'){c.strokeStyle='#534c38';c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(0,-h);c.lineTo(20,-h);c.stroke();this.ellipse(20,-h+23,16,24,'#d1aa70','#4e4b35',2);c.fillStyle='#695c37';c.fillRect(7,-h-1,26,5);this.glow(20,-h+22,60,'#efb971');}
        else{this.ellipse(0,-14,w*.4,13,incense?'#718d7d':'#645e48','#b3b98e',2);c.fillStyle='#4d6155';c.fillRect(-w*.24,-12,w*.48,12);
          if(incense){c.strokeStyle='#a7a68a';c.lineWidth=2;for(let i=-1;i<2;i++){c.beginPath();c.moveTo(i*9,-15);c.lineTo(i*9,-40+i*3);c.stroke();}}
          else{for(let i=0;i<3;i++)this.polygon([[-13+i*9,-15],[-8+i*9,-49-Math.sin(t*5+i)*7],[2+i*9,-15]],i===1?'#f6d18b':'#ce8e4bcc');this.glow(0,-25,65,'#e7b76b');}}
        if(this.e.settings.motion){c.strokeStyle='#bfc7b144';c.lineWidth=2;c.beginPath();c.moveTo(0,incense?-42:-48);c.bezierCurveTo(18,-67,-10,-88,Math.sin(t)*15,-115);c.stroke();}break;
      }
      case 'weaponRack':case 'rack':case 'sword':
        if(p.kind==='sword'){this.polygon([[-23,0],[2,-18],[24,-4],[17,9]],'#617769');c.save();c.rotate(.19);c.fillStyle='#ced7c7';c.fillRect(-3,-85,6,74);c.fillStyle='#ad9760';c.fillRect(-15,-65,30,5);c.fillStyle='#433f30';c.fillRect(-3,-96,6,20);c.restore();}
        else{c.fillStyle='#635740';c.fillRect(-w*.42,-h,w*.07,h);c.fillRect(w*.35,-h,w*.07,h);c.fillRect(-w*.43,-h*.7,w*.86,8);for(let i=0;i<5;i++){const x=-w*.3+i*w*.15;c.fillStyle=p.kind==='rack'?['#a48966','#7c8975','#b49769'][i%3]:'#c5cbbb';c.fillRect(x,-h*.85,7,h*.82);c.fillStyle='#a7996b';c.fillRect(x-5,-h*.56,17,4);}}break;
      case 'sign':
        c.fillStyle='#62543e';c.fillRect(-4,-73,8,77);this.polygon([[-36,-80],[30,-80],[43,-61],[30,-45],[-36,-45]],'#a28b61','#d9c29699',1.5);c.fillStyle='#4a4e3a';c.font=`13px ${FONT}`;c.textAlign='center';c.fillText(p.label||'山路',0,-58);break;
      case 'scroll':
        c.save();c.rotate(-.15);c.fillStyle='#c7bb91';c.fillRect(-27,-34,54,34);c.strokeStyle='#706c4d';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-18,-25+i*6);c.lineTo(16-(i%2)*11,-25+i*6);c.stroke();}c.fillStyle='#786c4b';c.fillRect(-29,-36,4,39);c.fillRect(25,-36,4,39);c.restore();break;
      case 'trace':
        for(let i=0;i<6;i++){c.save();c.translate(-20+(i%2)*21,-i*9);c.rotate(-.2);this.ellipse(0,0,5,10,'#253f389c');c.restore();}break;
      case 'herb':case 'reeds':
        c.strokeStyle='#739779';c.lineWidth=2;for(let i=0;i<7;i++){const x=(i-3)*7,y=-25-(i%3)*12;c.beginPath();c.moveTo(x,2);c.quadraticCurveTo(x-10,y*.6,x+(i%2?10:-10),y);c.stroke();this.ellipse(x+(i%2?7:-7),y+8,9,4,i%3?'#7fac86':'#b8b68a');}break;
      case 'boat':
        this.polygon([[-w*.55,-7],[-w*.32,-h*.32],[w*.45,-h*.24],[w*.56,-h*.07],[w*.31,h*.16],[-w*.26,h*.16]],'#796744','#b5a17aaa',2);this.polygon([[-w*.38,-h*.15],[w*.41,-h*.13],[w*.25,0],[-w*.22,0]],'#3f4940');c.strokeStyle='#bfa982';c.lineWidth=4;c.beginPath();c.moveTo(-w*.35,-h*.38);c.lineTo(w*.35,h*.4);c.stroke();break;
      case 'barrels':
        for(let i=0;i<3;i++){const x=(i-1)*w*.27,y=-(i%2)*13;this.ellipse(x,y-22,17,25,'#8d7753','#423f31',2);this.ellipse(x,y-45,15,6,'#a18c66','#c2ac77',1);c.strokeStyle='#515749';c.lineWidth=3;c.beginPath();c.moveTo(x-16,y-32);c.lineTo(x+16,y-32);c.moveTo(x-16,y-12);c.lineTo(x+16,y-12);c.stroke();}break;
      case 'cart':
        this.polygon([[-w*.42,-15],[-w*.4,-50],[w*.38,-50],[w*.48,-17]],'#876d4b','#bb9f6d',2);for(const x of [-w*.3,w*.31]){this.ellipse(x,-1,19,24,'#39483d','#b09a6c',4);c.strokeStyle='#ac9868';c.lineWidth=2;c.beginPath();c.moveTo(x-16,-1);c.lineTo(x+16,-1);c.moveTo(x,-23);c.lineTo(x,21);c.stroke();}c.strokeStyle='#ab9066';c.lineWidth=6;c.beginPath();c.moveTo(w*.4,-18);c.lineTo(w*.75,12);c.stroke();break;
      case 'dummy':
        c.fillStyle='#866946';c.fillRect(-8,-105,16,110);c.fillRect(-40,-70,80,10);this.ellipse(0,-117,17,21,'#a38d59','#c6b67d',2);c.strokeStyle='#bdb180';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-18,-92+i*9);c.lineTo(18,-92+i*9);c.stroke();}break;
      case 'crystal':
        for(let i=0;i<4;i++){const x=(i-1.5)*w*.19,hh=h*(.45+(i%3)*.2);this.polygon([[x-9,0],[x-13,-hh*.6],[x,-hh],[x+12,-hh*.63],[x+9,0]],i%2?'#7fbbb59f':'#8aaab99f','#c4e3d28a',1);}this.glow(0,-h*.35,w*.6,'#84bdbb');break;
      case 'rug':this.polygon([[-w*.5,-h*.45],[w*.5,-h*.45],[w*.45,h*.4],[-w*.45,h*.4]],'#80594455','#c0aa714b',3);this.ellipse(0,0,w*.23,h*.3,null,'#c6b78e55',2);break;
      case 'stairs':for(let i=0;i<7;i++){c.fillStyle=i%2?'#a8ada0':'#6a7a73';c.fillRect(-w/2+i*3,-i*h/7,w-i*6,7);}break;
      case 'well':this.ellipse(0,-15,w*.45,h*.45,'#6e8272','#bfc5a8',4);this.ellipse(0,-20,w*.3,h*.25,'#173f41');c.strokeStyle='#807759';c.lineWidth=6;c.beginPath();c.moveTo(-w*.4,-15);c.lineTo(-w*.4,-95);c.lineTo(w*.4,-95);c.lineTo(w*.4,-15);c.stroke();break;
      default:this.ellipse(0,-10,18,14,'#899b82','#c8cba8',1);
    }c.restore();
  }
  // Treatment props and poses are drawn from this project's own atlas and
  // original geometry. They are presentation only; the runner owns item use.
  drawStagingProp(p){
    if(drawForbiddenProp.call(this,p))return;
    if(['cultSeal','timePassage','solitaryLamp'].includes(p.kind)){this.drawCultProp(p);return;}
    const c=this.ctx,cues=p.cues||{},medicine=cues.medicine,t=this.e.settings.motion?this.e.time:0;
    if(p.kind==='herbBundle'&&medicine!=='handed')return;
    if(p.kind==='medicineBowl'&&!['ready','served'].includes(medicine))return;
    if(p.kind==='jadePair'&&!cues.jade)return;
    if(p.kind==='jadeHalf'&&cues.jadeStory!=='shown')return;
    c.save();c.translate(p.x,p.y);
    if(p.kind==='jadeHalf'){
      c.translate((p.direction||1)*26,-72);this.glow(0,0,22,'#96c6aa');
      c.beginPath();c.moveTo(0,-14);c.lineTo(2,-6);c.lineTo(-1,4);c.lineTo(0,14);c.arc(0,0,14,Math.PI/2,-Math.PI/2,true);c.closePath();c.fillStyle='#91b99b';c.fill();c.strokeStyle='#d8d8af';c.lineWidth=1.2;c.stroke();
      c.strokeStyle='#b08e56';c.beginPath();c.moveTo(-3,-13);c.quadraticCurveTo(-8,-27,2,-22);c.stroke();
    }else if(p.kind==='sickbed'){

      const w=p.w||190;
      this.ellipse(0,8,w*.58,23,'#201b174d');
      const wood=c.createLinearGradient(0,-46,0,15);wood.addColorStop(0,'#9a744c');wood.addColorStop(1,'#463121');
      this.polygon([[-w/2,-36],[w/2,-27],[w/2,5],[-w/2,0]],wood,'#402f23',2);
      for(const x of [-w*.42,w*.42]){c.fillStyle='#4d3425';c.fillRect(x-5,-1,10,20);c.fillStyle='#987249';c.fillRect(x-4,-1,3,19);}
      this.polygon([[-w*.49,-43],[w*.46,-37],[w*.49,-24],[-w*.48,-27]],'#c5b798','#e0cfad',1.2);
      const quilt=c.createLinearGradient(0,-40,0,-15);quilt.addColorStop(0,'#747b8b');quilt.addColorStop(1,'#3e485b');
      this.polygon([[-w*.2,-40],[w*.45,-35],[w*.47,-18],[-w*.22,-24]],quilt,'#9a98a0',1);
      c.strokeStyle='#b3a69266';c.lineWidth=1;for(let i=0;i<7;i++){c.beginPath();c.moveTo(-28+i*15,-36);c.lineTo(-31+i*15,-23);c.stroke();}
      c.save();c.translate(-w*.34,-37);c.rotate(.07);this.ellipse(0,0,23,12,'#ded4b8','#a49980',1);this.ellipse(-2,-2,17,7,'#eee3c8');c.restore();
      this.polygon([[-w*.52,4],[-w*.52,-66],[-w*.47,-72],[-w*.43,-64],[-w*.43,-1]],wood,'#3d2e22',2);
      c.strokeStyle='#be9463';c.lineWidth=2;c.beginPath();c.moveTo(-w*.485,-57);c.lineTo(-w*.485,-7);c.stroke();
    }else if(p.kind==='medicineStove'){
      this.ellipse(1,5,36,12,'#1c201b66');
      const clay=c.createLinearGradient(-23,0,25,0);clay.addColorStop(0,'#514c43');clay.addColorStop(.5,'#8d7b63');clay.addColorStop(1,'#3b3932');
      this.polygon([[-23,-39],[23,-39],[28,1],[-28,1]],clay,'#b2a084',1.2);
      this.ellipse(0,0,28,9,'#4a4439','#a89371',1);
      this.ellipse(0,-11,12,8,'#242923');
      if(['brewing','ready'].includes(medicine)){
        this.glow(0,-9,22,'#e2a24d');
        this.polygon([[-8,-8],[-3,-23-Math.sin(t*5)*3],[1,-13],[7,-20],[9,-8]],'#efbb6c');
      }
      this.ellipse(0,-42,30,10,'#383b32','#b8aa8b',1.5);
      const pot=c.createRadialGradient(-8,-66,4,0,-60,30);pot.addColorStop(0,'#9d7351');pot.addColorStop(.6,'#6e4d38');pot.addColorStop(1,'#342c24');
      this.ellipse(0,-60,24,22,pot,'#c1956b',1);
      c.strokeStyle='#76533c';c.lineWidth=5;c.beginPath();c.arc(24,-64,9,-1.7,1.7);c.stroke();
      this.ellipse(0,-78,23,6,'#73543d','#b18b63',1);this.ellipse(0,-84,5,4,'#b19870');
      if(['brewing','ready'].includes(medicine)){
        for(let i=0;i<3;i++){
          const drift=Math.sin(t*1.7+i*2)*4;c.strokeStyle=`rgba(233,229,201,${medicine==='ready'?.4:.27+i*.06})`;c.lineWidth=2+i*.35;
          c.beginPath();c.moveTo((i-1)*8,-86);c.bezierCurveTo((i-1)*8+14+drift,-105,(i-1)*8-12+drift,-121,(i-1)*8+drift,-140-i*5);c.stroke();
        }
        c.font=`12px ${FONT}`;c.textAlign='center';c.shadowColor='#282419';c.shadowBlur=5;c.fillStyle='#ead5a8';c.fillText(medicine==='brewing'?'文火煎药':'药汁已成',0,-157);
      }
    }else if(p.kind==='herbBundle'){
      c.translate((p.direction||1)*20,-61);c.rotate(-.12);
      this.polygon([[-18,0],[-13,-14],[15,-12],[21,3],[1,10]],'#b1a586','#dfd1ae',1);
      c.strokeStyle='#7d9b70';c.lineWidth=2;for(let i=0;i<7;i++){const x=-12+i*4;c.beginPath();c.moveTo(x,2);c.lineTo(x+3,-20-(i%3)*3);c.stroke();this.ellipse(x+2,-17-(i%3)*3,5,2.6,i%2?'#a4bd92':'#7b9b6b');}
      c.strokeStyle='#76553a';c.beginPath();c.moveTo(-16,-2);c.lineTo(17,-5);c.stroke();
    }else if(p.kind==='medicineBowl'){
      let x=(p.direction||1)*21,y=-59,tilt=0;
      if(medicine==='served'){
        const patient=p.actors.find(actor=>actor.id==='patient'),sequence=this.e.s.sequence,step=sequence&&p.definition.steps[sequence.step];
        const prior=sequence&&p.definition.steps[sequence.step-1],serving=step?.type==='wait'&&prior?.type==='cue'&&prior.key==='medicine'&&prior.value==='served';
        if(patient){
          const mouth={x:patient.x-56-p.x,y:patient.y-41-p.y},tray={x:patient.x-106-p.x,y:patient.y+21-p.y};
          if(serving){tilt=sequence.elapsed<1.9?-.18:0;const progress=clamp(sequence.elapsed/.8,0,1),settle=clamp((sequence.elapsed-1.9)/.7,0,1);x+=(mouth.x-x)*progress;y+=(mouth.y-y)*progress;x+=(tray.x-x)*settle;y+=(tray.y-y)*settle;}
          else{x=tray.x;y=tray.y;}
        }
      }
      c.translate(x,y);c.rotate(tilt);
      this.polygon([[-14,-4],[14,-4],[9,6],[-9,6]],'#b9c8bd','#e4e3c8',1);
      this.ellipse(0,-4,14,5,'#d7deca','#658c84',1);this.ellipse(0,-4,10,3.1,medicine==='ready'?'#765633':'#8b7145');
      if(medicine==='ready'){c.strokeStyle='#eee8cf88';c.lineWidth=1;c.beginPath();c.moveTo(0,-10);c.bezierCurveTo(-6,-16,5,-22,1,-29);c.stroke();}
    }else if(p.kind==='jadePair'){
      const sequence=this.e.s.sequence,step=sequence&&p.definition.steps[sequence.step],joining=cues.jade==='joined'&&step?.type==='wait';
      const progress=cues.jade==='joined'?(joining?clamp(sequence.elapsed/1.1,0,1):1):0,gap=21*(1-progress);
      this.ellipse(0,0,68,46,'#13362f80');this.glow(0,-2,58,progress?'#bce3ac':'#829f88');
      for(const side of [-1,1]){
        c.save();c.translate(side*gap,0);c.scale(side,1);
        const jade=c.createLinearGradient(0,-28,25,27);jade.addColorStop(0,'#d1e0b1');jade.addColorStop(.4,'#84b597');jade.addColorStop(1,'#355f50');
        c.beginPath();c.moveTo(0,-28);c.lineTo(3,-15);c.lineTo(-2,-5);c.lineTo(3,9);c.lineTo(0,28);c.arc(0,0,28,Math.PI/2,-Math.PI/2,true);c.closePath();c.fillStyle=jade;c.fill();c.strokeStyle='#e6dfb0';c.lineWidth=1.3;c.stroke();
        c.strokeStyle='#426c5666';c.lineWidth=1;c.beginPath();c.arc(0,0,19,1.9,4.4);c.stroke();this.ellipse(-12,-9,3,3,'#d8e2bc88');
        c.strokeStyle='#b99762';c.beginPath();c.moveTo(-5,-26);c.quadraticCurveTo(-13,-40,-1,-39);c.stroke();c.restore();
      }
      c.font=`12px ${FONT}`;c.textAlign='center';c.shadowColor='#09281f';c.shadowBlur=6;c.fillStyle='#f0e4bd';c.fillText(cues.jade==='joined'?'玉佩相合':'两半旧玉',0,51);
    }
    c.restore();
  }
  drawGroundSeatedActor(a,hero=false){
    const c=this.ctx,sprite=hero?0:clamp(a.sprite||0,0,3),cell=hero?null:(a.npcCell??npcCellFor(a.name));
    const colors=[['#727e88','#b4bcb8','#c0c7be77'],['#a97570','#d4b5a7','#e7c9b777'],['#88768f','#c4b3c8','#dccbdf77'],['#746b58','#bab099','#d1c3a877']][sprite];
    c.save();c.translate(a.x,a.y);this.ellipse(0,1,39,11,'#08222570');
    // Authored ground-seated robe silhouette; a bed quilt is only for resting patients.
    c.save();if(!hero&&a.direction===-1)c.scale(-1,1);
    c.beginPath();c.moveTo(-20,-25);c.bezierCurveTo(-27,-15,-42,-13,-42,-3);c.bezierCurveTo(-43,8,-25,10,-8,4);c.quadraticCurveTo(0,2,8,4);c.bezierCurveTo(25,10,43,8,42,-3);c.bezierCurveTo(42,-13,27,-15,20,-25);c.closePath();c.fillStyle=colors[0];c.fill();c.strokeStyle=colors[1];c.lineWidth=1.2;c.stroke();
    c.strokeStyle=colors[2];c.beginPath();c.moveTo(-39,0);c.quadraticCurveTo(0,-13,36,1);c.moveTo(-21,-17);c.lineTo(12,4);c.stroke();
    if(cell!==null&&this.assets.npcs)c.drawImage(this.assets.npcs,(cell%4)*384,Math.floor(cell/4)*512,384,305,-43,-94,86,84);
    else if(this.assets['characters-original'])c.drawImage(this.assets['characters-original'],sprite*384,0,384,600,-27,-94,54,84);
    c.restore();c.font='15px '+FONT;c.textAlign='center';c.fillStyle='#e4dabb';c.shadowColor='#092022';c.shadowBlur=6;c.fillText(hero?'杨影枫':a.name,0,-105);c.restore();
  }
  drawRestingActor(a){
    const c=this.ctx,sequence=this.e.s.sequence,step=sequence&&this.e.stagingPresentation?.()?.definition.steps[sequence.step];
    const rising=a.pose==='sit'&&step?.type==='pose'&&step.actor===a.id;
    let rise=a.pose==='sit'?1:0;if(rising)rise=clamp(sequence.elapsed/(step.duration||1),0,1);rise=rise*rise*(3-2*rise);
    c.save();c.translate(a.renderAt?.x??a.x,a.renderAt?.y??a.y);c.scale(a.renderScale||1,a.renderScale||1);
    c.save();c.translate(-8-22*rise,-38+18*rise);c.rotate(-Math.PI/2*(1-rise));
    if(a.name==='月眉儿'&&this.assets['mei-original'])c.drawImage(this.assets['mei-original'],0,0,1024,1536,-26,-75,52,82);
    else if(this.assets['characters-original'])c.drawImage(this.assets['characters-original'],clamp(a.sprite||0,0,3)*384,0,384,600,-26,-75,52,82);
    c.restore();
    const quilt=c.createLinearGradient(0,-40,0,4);quilt.addColorStop(0,'#777886');quilt.addColorStop(.55,'#555d72');quilt.addColorStop(1,'#353d51');
    this.polygon([[-17-25*rise,-40+11*rise],[73,-29],[88,-7],[39,6],[-20-25*rise,-13]],quilt,'#a6a4a3',1);
    c.strokeStyle='#c1b3a266';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-7+i*16,-33+rise*8);c.quadraticCurveTo(-15+i*16,-12,6+i*15,-5);c.stroke();}
    if(rise>.5){c.strokeStyle='#c6b7b66e';c.beginPath();c.moveTo(-36,-20);c.quadraticCurveTo(-7,-10,24,-15);c.stroke();}
    c.font=`15px ${FONT}`;c.textAlign='center';c.shadowColor='#001416';c.shadowBlur=7;c.shadowOffsetY=2;c.fillStyle='#f1d898';c.fillText(a.name,-24,-72-45*rise);
    c.font=`11px ${FONT}`;c.fillStyle='#d7d4b9';c.fillText(rise>.7?'倚榻调息':'卧病休养',-24,-57-45*rise);c.restore();
  }
  drawCultProp(p){
    const c=this.ctx,cues=p.cues||{},time=this.e.settings.motion?this.e.time:0;
    if(p.kind==='cultSeal'&&!cues.appointment)return;
    if(p.kind==='timePassage'&&!cues.chapterTime)return;
    c.save();c.translate(p.x,p.y);
    if(p.kind==='cultSeal'){
      const fill=c.createLinearGradient(-16,-37,17,13);fill.addColorStop(0,'#cbb985');fill.addColorStop(.5,'#9b8157');fill.addColorStop(1,'#534331');
      this.ellipse(0,2,27,9,'#142a2b66');
      this.polygon([[-17,-38],[17,-38],[17,2],[0,12],[-17,2]],fill,'#e5d4a6',1.2);
      c.strokeStyle='#ecd7a2';c.lineWidth=1;c.strokeRect(-12,-33,24,28);c.font=`17px ${FONT}`;c.textAlign='center';c.fillStyle='#3d352c';c.fillText(cues.appointment==='inherited'?'主':'令',0,-10);
      c.strokeStyle='#78533d';c.lineWidth=2;c.beginPath();c.moveTo(-3,-37);c.quadraticCurveTo(-17,-60,0,-57);c.quadraticCurveTo(15,-60,3,-37);c.stroke();
      c.font=`12px ${FONT}`;c.shadowColor='#092020';c.shadowBlur=5;c.fillStyle='#dfce9f';c.fillText(cues.appointment==='inherited'?'继任教主':'护法左使',0,30);
    }else if(p.kind==='timePassage'){
      const words={later:'此后岁月',years:'数度春秋',alone:'独对长夜'};
      c.textAlign='center';c.shadowColor='#0c2028';c.shadowBlur=10;c.fillStyle='#d7d0bc';c.font=`27px ${FONT}`;c.fillText(words[cues.chapterTime]||'',0,0);
      c.strokeStyle='#c4b88a66';c.lineWidth=1;c.beginPath();c.moveTo(-122,-9);c.lineTo(-75,-9);c.moveTo(75,-9);c.lineTo(122,-9);c.stroke();
    }else if(p.kind==='solitaryLamp'){
      const alone=cues.chapterTime==='alone';this.ellipse(0,0,17,5,'#514838','#b19d6f',1);
      c.fillStyle='#8c7956';c.fillRect(-3,-39,6,37);this.ellipse(0,-41,15,6,'#9a8962','#d4bd8c',1);
      this.polygon([[-4,-45],[Math.sin(time*2)*2,-61],[-1,-50],[4,-44]],alone?'#d5b772':'#ead29c');this.glow(0,-48,alone?35:58,'#ddb981');
    }
    c.restore();
  }
  drawFallenActor(a){
    const c=this.ctx,sequence=this.e.s.sequence,step=sequence&&this.e.stagingPresentation?.()?.definition.steps[sequence.step];
    const falling=step?.type==='pose'&&step.actor===a.id&&step.pose==='fallen';
    let progress=falling?clamp(sequence.elapsed/(step.duration||.8),0,1):1;progress=progress*progress*(3-2*progress);
    const ownArt=a.name==='月眉儿'&&this.assets['mei-original'];
    const cell=a.npcCell??npcCellFor(a.name),atlas=cell!==null&&this.assets.npcs,height=atlas?126:124,width=height*(atlas?.75:384/1024),side=a.fallDirection===-1?-1:1;
    c.save();c.translate(a.x,a.y);this.ellipse(side*47*progress,3,24+37*progress,9,'#09202266');
    c.save();c.rotate(side*Math.PI*.485*progress);c.scale(1,1-.13*progress);c.filter=`saturate(${1-.55*progress}) brightness(${1-.2*progress})`;
    if(ownArt)c.drawImage(ownArt,0,0,1024,1536,-height/3,-height*.98,height*2/3,height);
    else if(atlas)c.drawImage(this.assets.npcs,(cell%4)*384,Math.floor(cell/4)*512,384,512,-width/2,-height*.93,width,height);
    else if(this.assets['characters-original'])c.drawImage(this.assets['characters-original'],clamp(a.sprite||0,0,3)*384,0,384,1024,-width/2,-height,width,height);
    c.restore();c.font=`14px ${FONT}`;c.textAlign='center';c.shadowColor='#091b22';c.shadowBlur=6;c.fillStyle='#c8c5bb';c.fillText(a.name,side*43*progress,-height-13+progress*(height-31));c.restore();
  }
  drawStagingStrike(){
    const sequence=this.e.s.sequence,definition=this.e.stagingPresentation?.()?.definition,step=sequence&&definition?.steps[sequence.step];
    if(step?.type==='wallImpact'){
      const actor=this.e.stagingActor?.(step.actor);if(!actor||actor.hidden)return;
      const progress=clamp(sequence.elapsed/(step.duration||.45),0,1),c=this.ctx,side=step.direction===-1?-1:1;
      c.save();c.translate(actor.x+side*26,actor.y-75);c.globalAlpha=Math.sin(progress*Math.PI)*.7;
      for(let i=0;i<7;i++){const angle=i*2.4,radius=5+progress*(9+i*2);this.ellipse(Math.cos(angle)*radius,Math.sin(angle)*radius+progress*12,2+i%3,1.8,'#b8b6a5');}
      c.restore();return;
    }
    if(step?.type!=='strike')return;
    const source=this.e.stagingActor?.(step.actor),target=this.e.stagingActor?.(step.target);if(!source||!target||source.hidden||target.hidden)return;
    const progress=clamp(sequence.elapsed/(step.duration||.6),0,1),strength=Math.sin(progress*Math.PI),c=this.ctx;
    const dx=target.x-source.x,dy=target.y-source.y,angle=Math.atan2(dy*.7,dx),radius=Math.max(60,Math.hypot(dx,dy)*.7);
    c.save();c.translate(source.x,source.y-67);c.rotate(angle);c.globalAlpha=strength;c.strokeStyle='#f1e2b5';c.shadowColor='#dfefdc';c.shadowBlur=15;c.lineWidth=4;c.lineCap='round';
    c.beginPath();c.ellipse(0,0,radius,32,0,-.9+progress*.65,.65+progress*.65);c.stroke();
    c.strokeStyle='#f8fff2';c.lineWidth=1.3;c.beginPath();c.moveTo(10,-23+progress*47);c.lineTo(dx?radius+12:radius,12-progress*18);c.stroke();c.restore();
  }
  drawPowerTransmission(){
    const seq=this.e.s.sequence;if(seq?.questId!=='g14'||seq.cues.valleyPowerTransfer!=='flowing')return;
    const elder=seq.actors.find(a=>a.id==='defense-meng'&&!a.hidden);if(!elder)return;
    const hero=this.e.s.hero,c=this.ctx,time=this.e.settings.motion?this.e.time:0;
    c.save();c.globalCompositeOperation='screen';c.strokeStyle='#d9c58b';c.lineWidth=2;c.globalAlpha=.45;
    c.beginPath();c.moveTo(elder.x,elder.y-45);c.quadraticCurveTo((elder.x+hero.x)/2,Math.min(elder.y,hero.y)-60,hero.x,hero.y-45);c.stroke();
    for(let i=0;i<8;i++){const t=(i/8+time*.38)%1,x=elder.x+(hero.x-elder.x)*t,y=elder.y+(hero.y-elder.y)*t-45-Math.sin(t*Math.PI)*25;this.ellipse(x,y,2.2,2.2,'#f9e8b9');}
    c.restore();
  }
  drawStagingMood(){
    const cues=this.e.stagingPresentation?.()?.cues;if(!cues)return;
    if(cues.evilNight||cues.shoreRest||cues.evilMorning){
      const c=this.ctx,dark=cues.evilNight==='dark'||cues.shoreRest==='asleep';c.save();c.fillStyle=dark?'rgba(8,16,34,.42)':cues.evilMorning?'rgba(229,191,116,.08)':'rgba(19,40,57,.07)';c.fillRect(0,0,W,H);c.restore();
    }
    if(!cues.chapterTime)return;
    const c=this.ctx,night=cues.chapterTime==='alone',sequence=this.e.s.sequence,definition=this.e.stagingPresentation().definition,step=sequence&&definition.steps[sequence.step],prior=sequence&&definition.steps[sequence.step-1];
    const entering=step?.type==='wait'&&prior?.type==='cue'&&prior.key==='chapterTime';
    const progress=entering?clamp(sequence.elapsed/(step.duration||1),0,1):1;
    c.save();c.fillStyle=night?`rgba(13,26,49,${.13+.24*progress})`:cues.chapterTime==='years'?`rgba(137,106,58,${.06+.14*progress})`:`rgba(104,99,87,${.08+.13*progress})`;c.fillRect(0,0,W,H);c.restore();
  }
  drawBat(a){
    const c=this.ctx,scale=a.boss?1.65:1,flap=Math.sin(this.e.time*13+a.x)*18;
    c.save();c.translate(a.x,a.y);this.ellipse(0,0,25*scale,8*scale,'#031e2659');
    c.translate(0,-52-(a.boss?25:0)+Math.sin(this.e.time*3+a.y)*6);c.scale(scale,scale);
    const membrane=a.flash>0?'#b5adb3':'#514656',outline=a.flash>0?'#eadacf':'#8b7784';
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      this.polygon([[8,-6],[30,-24-flap],[65,-5-flap*.7],[53,1],[48,15],[33,6],[26,22],[14,9]],membrane,outline,1.5);
      c.strokeStyle='#aa869160';c.lineWidth=1;c.beginPath();c.moveTo(8,-6);c.lineTo(48,15);c.moveTo(8,-6);c.lineTo(26,22);c.moveTo(8,-6);c.lineTo(65,-5-flap*.7);c.stroke();c.restore();
    }
    this.ellipse(0,1,12,20,a.flash>0?'#b6b2ae':'#302f3b','#8e7c80',1.2);
    this.polygon([[-11,-9],[-10,-31],[-1,-18],[8,-31],[12,-9]],'#34323e','#99888d',1);
    this.ellipse(-5,-12,2.3,2.3,'#e7b678');this.ellipse(5,-12,2.3,2.3,'#e7b678');
    c.restore();c.save();c.textAlign='center';c.font=`14px ${FONT}`;c.shadowColor='#10202a';c.shadowBlur=6;c.fillStyle=a.boss?'#f0c294':'#d7ccbb';
    const top=a.y-(a.boss?152:116);c.fillText(a.name,a.x,top);
    c.fillStyle='#142627dd';c.fillRect(a.x-28,top+8,56,4);c.fillStyle=a.boss?'#ce7c68':'#bda272';c.fillRect(a.x-28,top+8,56*a.hp/a.maxHp,4);c.restore();
  }
  drawActor(a,hero=false){
    if(a.hidden)return;
    const poseStep=this.e.s.sequence&&this.e.stagingDefinition()?.steps[this.e.s.sequence.step];
    if(a.renderAt&&a.pose==='stand'&&poseStep?.type==='pose'&&poseStep.actor===a.id){const t=clamp(this.e.s.sequence.elapsed/(poseStep.duration||1),0,1);a={...a,x:a.renderAt.x+(a.x-a.renderAt.x)*t,y:a.renderAt.y+(a.y-a.renderAt.y)*t};}
    if(a.pose==='fallen'){this.drawFallenActor(a);return;}
    if(a.pose==='sit'&&(hero||a.groundSeated)){this.drawGroundSeatedActor(a,hero);return;}
    if(!hero&&['ill','sit'].includes(a.pose)){this.drawRestingActor(a);return;}
    if(!hero&&a.hp!==undefined&&/蝙蝠/.test(a.name)){this.drawBat(a);return;}
    const npcCell=hero?null:(a.npcCell??npcCellFor(a.name)),useNpcAtlas=npcCell!==null&&this.assets.npcs;
    const kneeling=a.pose==='kneel',c=this.ctx,height=kneeling?94:a.boss?158:hero?142:useNpcAtlas?140:130,width=(hero?142:height)*384/1024;
    const bob=hero&&this.e.walkTime?Math.sin(this.e.walkTime)*2:Math.sin(this.e.time*1.5+a.x)*.5,lift=a.jumpHeight??(hero&&this.e.dashTime>0?Math.sin(this.e.dashTime/.6*Math.PI)*27:0);
    c.save();c.translate(a.x,a.y);this.ellipse(0,0,width*.67,9,'#02172066');
    if(hero){this.ellipse(0,0,29,10,null,'#c2e6ceaa',1.2);this.ellipse(0,0,34,13,null,'#a1d5bd35');}else if(a.ally)this.ellipse(0,1,23,7,null,'#71cbaa88',1.1);
    c.save();c.translate(0,-lift+bob);if(a.direction===-1)c.scale(-1,1);if(hero&&this.e.hitTime>0)c.rotate(Math.sin(this.e.hitTime*10)*.07);
    const sequence=this.e.s.sequence,step=sequence&&this.e.stagingPresentation?.()?.definition.steps[sequence.step];
    if(step?.type==='strike'&&(hero?step.actor==='hero':step.actor===a.id))c.rotate(Math.sin(clamp(sequence.elapsed/(step.duration||.6),0,1)*Math.PI)*.14);
    if(step?.type==='wallImpact'&&!hero&&step.actor===a.id)c.rotate(Math.sin(clamp(sequence.elapsed/(step.duration||.45),0,1)*Math.PI)*.2);
    if(a.flash>0)c.filter='brightness(1.8)';else if(!hero&&!a.ally&&this.e.q.friendly&&a.hp!==undefined)c.filter='saturate(.4) brightness(.8)';
    const sprite=hero?(this.e.q.playAs==='纳兰真'?1:0):clamp(a.sprite||0,0,3);
    if(a.name==='月眉儿'&&this.assets['mei-original'])c.drawImage(this.assets['mei-original'],0,0,1024,1536,-height/3,-height*.98,height*2/3,height);
    else if(useNpcAtlas){const tileWidth=height*.75,anchorY=[486,487,486,490,466,466,466,467][npcCell];c.drawImage(this.assets.npcs,(npcCell%4)*384,Math.floor(npcCell/4)*512,384,512,-tileWidth/2,-height*anchorY/512,tileWidth,height);}
    else if(this.assets['characters-original']){if(kneeling&&this.assets['hero-kneel-original']){const w=height*854/1360;c.drawImage(this.assets['hero-kneel-original'],64,96,854,1360,-w/2,-height,w,height);}else c.drawImage(this.assets['characters-original'],sprite*384,0,384,1024,-width/2,-height,width,height);}c.restore();
    // Original restrained pose cue for the escort scene, drawn over our own art.
    if(a.bound){c.save();c.translate(0,-lift+bob);c.strokeStyle='#493426';c.lineWidth=4.4;c.lineCap='round';
      for(const offset of [0,6]){c.beginPath();c.moveTo(-width*.34,-height*.54+offset);c.quadraticCurveTo(0,-height*.48+offset,width*.34,-height*.54+offset);c.stroke();}
      c.strokeStyle='#d0ab72';c.lineWidth=1.8;for(const offset of [0,6]){c.beginPath();c.moveTo(-width*.34,-height*.548+offset);c.quadraticCurveTo(0,-height*.488+offset,width*.34,-height*.548+offset);c.stroke();}
      c.beginPath();c.moveTo(-5,-height*.54);c.lineTo(5,-height*.47);c.moveTo(5,-height*.54);c.lineTo(-5,-height*.47);c.stroke();c.restore();}
    const crowded=(this.e.s.enemies.length+this.allies.length)>16,visibleLabel=hero||a.hp===undefined||!crowded||a.boss||this.labelledUnits?.has(a.id)||(!a.ally&&this.e.attackTarget?.id===a.id);
    if(visibleLabel){
    c.font=`15px ${FONT}`;c.textAlign='center';c.shadowColor='#001416';c.shadowBlur=7;c.shadowOffsetY=2;c.fillStyle=hero?'#f2e8c5':a.ally?'#b7e4c2':a.hp!==undefined?'#eed4bd':'#f1d898';c.fillText(hero?(this.e.q.playAs||'杨影枫'):(a.displayName||a.name),0,-height-12-lift);c.shadowBlur=0;c.shadowOffsetY=0;
    if(!hero&&a.hp!==undefined){c.fillStyle='#182524dd';c.fillRect(-29,-height-3,58,4);c.fillStyle=a.ally?'#73bc9d':a.boss?'#cb6a59':'#c79572';c.fillRect(-29,-height-3,58*clamp(a.hp/Math.max(1,a.maxHp),0,1),4);if(!a.ally&&(a.role==='ranged'||a.role==='brute')){c.font=`11px ${FONT}`;c.fillStyle='#f0c996';c.fillText(a.role==='ranged'?'远攻':'重击',0,-height-30);}}
    }
    if(a.main&&this.e.s.phase!=='battle'){c.font='24px serif';c.fillStyle='#f7df99';c.shadowColor='#e3c877';c.shadowBlur=10;c.fillText(this.e.s.phase==='talk'?'!':'?',0,-height-35+Math.sin(this.e.time*3)*4);}c.restore();
  }
  markerAppearance(m){
    if(m.appearance)return m.appearance;if(/墓/.test(m.name))return 'grave';if(/宝箱|木箱|药箱/.test(m.name)||m.kind==='chest')return 'chest';if(/草|野姜|野蒜|罂粟/.test(m.name))return 'herb';if(m.kind==='travel'||m.kind==='escape')return 'gate';if(/剑/.test(m.name))return 'sword';if(/出口|门/.test(m.name))return 'door';if(/痕|线索|足迹/.test(m.name))return 'trace';return m.kind==='search'?'scroll':'stele';
  }
  drawMarker(m){
    if(m.kind==='travel'||m.kind==='escape'){this.drawExit(m);return;}
    const p=this.scene.points.find(p=>p.id===m.id||`${this.e.s.map}:${p.id}`===m.id),appearance=this.markerAppearance({...p,...m});
    const opened=(this.e.s.opened||[]).includes(`${this.e.s.map}:${p?.id||m.id}`)||(this.e.s.opened||[]).includes(m.id);
    const size=appearance==='gate'?{w:125,h:105}:appearance==='grave'?{w:90,h:115}:{w:75,h:65};
    // A painted landmark already exists in the background; keep its interaction hint in place.
    if(!(p?.paintOnly||m.paintOnly||(m.main&&this.scene.objective.paintOnly)))this.drawProp({...p,...m,...size,kind:appearance,opened,label:appearance==='grave'?'杨熙烈之墓':appearance==='gate'?'去路':undefined});
    this.drawMarkerHint({...p,...m},opened);
  }
  drawMarkerHint(m,opened=false){
    const c=this.ctx,d=Math.hypot(m.x-this.e.s.hero.x,m.y-this.e.s.hero.y);c.save();c.textAlign='center';c.shadowColor='#061e23';c.shadowBlur=7;c.fillStyle=opened?'#b0b9aa':m.main?'#f5d58f':'#d2dbc0';c.font=`13px ${FONT}`;const labelY=m.main&&this.scene.objective.paintOnly?m.y-118:m.y-85;if(m.main||d<230)c.fillText(m.name,m.x,labelY);
    if(!opened&&(m.main||d<160)){c.fillStyle=m.main?'#f5d58f':'#b3d9c7';c.font=`11px ${FONT}`;c.fillText(d<140?'E · 查看':m.main?'主线':'可探索',m.x,labelY+17);}c.restore();
  }
  drawTelegraphs(){
    const c=this.ctx;for(const e of this.e.s.enemies.filter(e=>e.hp>0&&e.telegraph>0)){
      const z=e.telegraphZone;c.save();c.strokeStyle='#ff9a77';c.fillStyle='#df443a38';c.lineWidth=3;
      if(z?.kind==='line'){
        // The engine measures distance in (x, y*1.3) space. Match that capsule exactly.
        const x=z.x,y=z.y,tx=z.targetX??x+180,ty=z.targetY??y,dx=tx-x,dy=(ty-y)*1.3,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len/1.3,width=z.width||48;
        this.polygon([[x+nx*width,y+ny*width],[tx+nx*width,ty+ny*width],[tx-nx*width,ty-ny*width],[x-nx*width,y-ny*width]],'#df443a38','#ff9a77',2);
        this.ellipse(x,y,width,width/1.3,'#df443a25','#ff9a7788',1);this.ellipse(tx,ty,width,width/1.3,'#df443a25','#ff9a7788',1);
        c.setLineDash([9,7]);c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
      }else{const x=z?.x??e.x,y=z?.y??e.y,r=z?.radius??195;this.ellipse(x,y,r,z?r/1.3:r*.44,'#df443a38','#ff9a77',3);c.setLineDash([10,8]);this.ellipse(x,y,r*.65,z?r*.65/1.3:r*.29,null,'#ffbc8caa',1.5);}
      c.setLineDash([]);c.font=`14px ${FONT}`;c.fillStyle='#ffd2a8';c.textAlign='center';c.shadowColor='#321d1b';c.shadowBlur=6;c.fillText(z?.kind==='line'?'剑气将至 · 向侧面闪避':'蓄力重击 · 离开标记区域',e.x,e.y-184);c.restore();
    }
  }
  drawEffects(){
    const c=this.ctx;for(const f of this.e.effects){
      const p=1-f.life/f.total;c.save();c.translate(f.x,f.y);c.globalAlpha=(1-p)*.9;c.strokeStyle=f.color;c.fillStyle=f.color;c.shadowColor=f.color;c.shadowBlur=20;c.lineWidth=f.kind==='slash'?7:3;
      if(f.kind==='slash'||f.kind==='enemy'){c.rotate(f.angle||0);c.beginPath();c.ellipse(0,0,f.radius,f.radius*.65,0,-1.1+p*.8,1.2+p*.8);c.stroke();c.lineWidth=2;c.beginPath();c.ellipse(0,0,f.radius*.8,f.radius*.5,0,-.8+p*.8,1.3+p*.8);c.stroke();}
      else{const r=f.radius*(.25+p);this.ellipse(0,20,r,r*.46,null,f.color,3);this.ellipse(0,20,r*.8,r*.35,null,f.color);for(let i=0;i<18;i++){const a=i*Math.PI/9+p*2;c.globalAlpha=(1-p)*.8;c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r*.46-p*35,f.kind==='fire'?4:2,0,TAU);c.fill();}}c.restore();
    }
    for(const n of this.e.numbers){c.save();c.globalAlpha=Math.min(1,n.life*2);c.fillStyle=n.color;c.font='bold 24px Georgia,serif';c.textAlign='center';c.shadowColor='#112125';c.shadowBlur=4;c.fillText(n.text,n.x,n.y-(1.15-n.life)*45);c.restore();}
  }
  drawWeather(){
    const c=this.ctx,t=this.e.time,s=this.scene,a={...s.atmosphere};
    if(/雨/.test(this.e.q.title||''))a.weather='rain';if(/夜袭|夜探|雨夜|夜访/.test(this.e.q.title||''))a.light='night';
    if(a.light==='night'){c.fillStyle=a.indoor?'#061c321c':'#061c322e';c.fillRect(0,0,W,H);}else if(a.light==='dawn'){c.fillStyle='#d1b27d0a';c.fillRect(0,0,W,H);}
    if(!this.e.settings.motion)return;const count=this.e.settings.quality==='high'?44:18;
    if(a.weather==='rain'&&!a.indoor){c.strokeStyle='#bed7db55';c.lineWidth=1;for(let i=0;i<count*2;i++){const x=(i*137.5+t*135)%1600,y=(i*83+t*440)%1050;c.beginPath();c.moveTo(x,y);c.lineTo(x-9,y+27);c.stroke();}}
    else if(a.weather==='snow'&&!a.indoor){for(let i=0;i<count;i++){const x=(i*139+t*18+Math.sin(t+i)*18)%1600,y=(i*87+t*29)%1060;c.globalAlpha=.25+(i%4)*.13;this.ellipse(x,y,1.5+i%3,1.5+i%3,'#e8ecdf');}c.globalAlpha=1;}
    else if(a.weather==='mist'||s.kind==='cave'){c.globalAlpha=.07;for(let i=0;i<6;i++)this.ellipse((i*307+t*8)%1780-100,625+i*49,290,32,'#c3ddd0');c.globalAlpha=1;}
    else{for(let i=0;i<(a.indoor?8:count);i++){const x=(i*137.5+t*(i%3+1)*7)%1600,y=(i*81+t*9)%950;c.globalAlpha=.13+Math.sin(t+i)*.08;c.fillStyle=a.particles==='petals'?'#e4bfc4':s.kind==='shore'?'#c5ecd7':'#efd196';c.beginPath();c.ellipse(x,y,a.particles==='petals'?4:2.1,1.3,Math.sin(i+t),0,TAU);c.fill();}c.globalAlpha=1;}
  }
  draw(){
    this.camera();const c=this.ctx,s=this.scene,t=this.e.time;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.save();c.translate(this.cameraX,this.cameraY);c.scale(this.s,this.s);this.backgroundImage(c,W,H);this.drawStagingMood();drawForbiddenGate.call(this);
    if(this.e.chapter.tint&&!this.assets[s.art]){c.fillStyle=this.e.chapter.tint;c.fillRect(0,0,W,H);}this.drawRoads();s.props.filter(p=>['pool','rug'].includes(p.kind)).forEach(p=>this.drawProp(p));this.drawTelegraphs();
    if(this.e.target)this.ellipse(this.e.target.x,this.e.target.y,17+Math.sin(t*5)*3,7,null,'#ecd69aaa',1.5);
    if(this.e.meditating)for(let i=0;i<3;i++)this.ellipse(this.e.s.hero.x,this.e.s.hero.y,35+i*14+Math.sin(t*2)*4,12+i*5,null,'#bce5d866',2);
    const fighters=[...this.e.s.enemies,...this.allies].filter(a=>a.hp>0);
    this.labelledUnits=new Set(fighters.sort((a,b)=>Math.hypot(a.x-this.e.s.hero.x,a.y-this.e.s.hero.y)-Math.hypot(b.x-this.e.s.hero.x,b.y-this.e.s.hero.y)).slice(0,4).map(a=>a.id));
    const markers=this.e.markers,ids=new Set(markers.flatMap(m=>[m.id,m.id?.replace(`${this.e.s.map}:`,'')]));
    const objects=s.props.filter(p=>!['pool','rug'].includes(p.kind)).map(p=>({...p,render:'prop'}));
    for(const p of s.points){if(ids.has(p.id))continue;objects.push({...p,kind:p.appearance||p.kind,opened:(this.e.s.opened||[]).includes(`${this.e.s.map}:${p.id}`),render:'point'});}
    if(!s.hidePlayer)objects.push({...this.e.s.hero,...this.e.renderJump(),hero:true,render:'actor'});for(const m of markers)objects.push({...m,render:m.sprite!==null&&m.sprite!==undefined?'actor':'marker'});for(const e of this.e.s.enemies.filter(e=>e.hp>0))objects.push({...e,render:'actor'});for(const companion of this.e.companions)objects.push({...companion,render:'actor'});for(const ally of this.allies)if(ally.hp>0&&!ally.hidden)objects.push({...ally,ally:true,render:'actor'});
    const presentation=this.e.stagingPresentation?.();
    if(presentation)for(const prop of presentation.definition.props||[]){
      if(Object.hasOwn(prop,'sceneKey')&&prop.sceneKey!==(this.e.s.sequence?.sceneKey??null))continue;
      const actor=prop.actor==='hero'?this.e.s.hero:prop.actor?presentation.actors.find(a=>a.id===prop.actor):null;
      if(prop.actor&&(!actor||actor.hidden))continue;
      objects.push({...prop,...(actor?{x:actor.x,y:actor.y,direction:actor.direction,sortY:actor.y+2}:{}),render:'stagingProp',cues:presentation.cues,actors:presentation.actors,definition:presentation.definition});
    }
    objects.sort((a,b)=>(a.sortY??a.y)-(b.sortY??b.y)).forEach(o=>{if(o.render==='actor')this.drawActor(o,o.hero);else if(o.render==='marker')this.drawMarker(o);else if(o.render==='stagingProp')this.drawStagingProp(o);else{this.drawProp(o);if(o.render==='point')this.drawMarkerHint(o,o.opened);}});
    drawDreamAccessories.call(this);this.drawPowerTransmission();this.drawStagingStrike();drawForbiddenAction.call(this);this.drawEffects();this.drawWeather();drawDreamOverlay.call(this);c.restore();this.drawMini();
  }
  drawMini(){
    const c=this.mctx,size=180,s=this.scene;c.clearRect(0,0,size,size);this.backgroundImage(c,size,size);c.fillStyle='#072c2c88';c.fillRect(0,0,size,size);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#cfcc9c99';
    for(const road of s.paths){c.lineWidth=Math.max(1,road.width/W*size);c.beginPath();road.points.forEach(([x,y],i)=>i?c.lineTo(x/W*size,y/H*size):c.moveTo(x/W*size,y/H*size));c.stroke();}
    c.fillStyle='#193e3cd9';for(const [x1,y1,x2,y2] of s.obstacles)c.fillRect(x1/W*size,y1/H*size,(x2-x1)/W*size,(y2-y1)/H*size);
    const dot=(a,color,r=3)=>{c.beginPath();c.fillStyle=color;c.arc(a.x/W*size,a.y/H*size,r,0,TAU);c.fill();};
    s.points.filter(p=>!(this.e.s.opened||[]).includes(`${this.e.s.map}:${p.id}`)).forEach(p=>dot(p,p.kind==='chest'?'#d1b67d':'#a0bdb0',2));this.e.markers.forEach(m=>dot(m,m.main?'#f6d589':m.kind==='travel'?'#d2e2d0':'#a4dcd5',m.main?4:3));this.e.s.enemies.filter(e=>e.hp>0).forEach(e=>dot(e,'#f08874'));this.allies.filter(a=>a.hp>0&&!a.hidden).forEach(a=>dot(a,'#81d9af'));if(!s.hidePlayer){dot(this.e.s.hero,'#d1ffde',4);c.strokeStyle='#e2efc2aa';c.beginPath();c.arc(this.e.s.hero.x/W*size,this.e.s.hero.y/H*size,8,0,TAU);c.stroke();}
  }
}
