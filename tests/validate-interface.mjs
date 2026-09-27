import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as core from '../public/runtime.mjs';
import {SOURCES} from '../public/campaign.mjs';
import {Renderer as ActualRenderer,npcCellFor} from '../public/renderer-v3.mjs';
const nodes=new Map(),events={};
class Element{
 constructor(id=''){this.id=id;this.style={setProperty(){}};this.classList={add(){},remove(){}};this.dataset={};this.children=[];this.listeners={};this.open=false;this.hidden=false;this.tagName='BUTTON';}
 set innerHTML(value){this._html=value;for(const m of value.matchAll(/\bid="([^"]+)"/g))if(!nodes.has(m[1]))nodes.set(m[1],new Element(m[1]));}
 get innerHTML(){return this._html||'';}
 querySelector(q){if(q==='button')return this.children[0]||new Element();if(!this.childrenByQuery)this.childrenByQuery={};return this.childrenByQuery[q]??=new Element();}
 append(e){this.children.push(e);if(e.id)nodes.set(e.id,e)}prepend(e){this.children.unshift(e);if(e.id)nodes.set(e.id,e)}replaceChildren(){this.children=[]}focus(){}setAttribute(){}setPointerCapture(){}click(){this.onclick?.()}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}showModal(){this.open=true}close(){this.open=false;for(const fn of this.listeners.close||[])fn()}
}
for(const m of fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8').matchAll(/\bid="([^"]+)"/g))nodes.set(m[1],new Element(m[1]));
nodes.get('dialogue').hidden=true;const selectors=new Map();
const document={getElementById:id=>nodes.get(id)||null,querySelector:q=>{if(!selectors.has(q))selectors.set(q,new Element(q));return selectors.get(q)},querySelectorAll:q=>{
 if(q==='[data-slot]'){if(!selectors.has(q))selectors.set(q,Array.from({length:5},(_,i)=>{const n=new Element();n.dataset.slot=String(i);return n}));return selectors.get(q)}
 if(q==='[data-dir]')return ['up','down','left','right'].map(dir=>{const n=new Element();n.dataset.dir=dir;return n});return [];
},createElement:()=>new Element(),addEventListener(k,fn){events[k]=fn},hidden:false};
const local=new Map();const localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};
const window={addEventListener(k,fn){events[k]=fn},matchMedia:()=>({matches:false})};
class Image{set src(value){queueMicrotask(()=>this.onload())}}
class Renderer{constructor(_canvas,_mini,engine){this.e=engine;}resize(){}draw(){}toWorld(x,y){return{x,y}}}
Object.defineProperty(Renderer.prototype,'visibleEnemies',Object.getOwnPropertyDescriptor(ActualRenderer.prototype,'visibleEnemies'));
const raf=()=>0,timer=()=>0;
let source=fs.readFileSync(new URL('../public/journey.js',import.meta.url),'utf8').replace(/^import .+;$/gm,'');
source+='\nreturn {engine,updateUi,showCharacter,showBag,showShop,showJournal,showMap,showSaves,showSettings,showAbout,showHelp,showSide,showDialogue,nextDialogue,showChoice,closePanel,track};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const names=[...Object.keys(core),'SOURCES','Renderer','npcCellFor','document','window','localStorage','Image','requestAnimationFrame','setTimeout','clearTimeout','setInterval','clearInterval','matchMedia','performance','location'];
const values=[...Object.values(core),SOURCES,Renderer,npcCellFor,document,window,localStorage,Image,raf,timer,()=>{},timer,()=>{},()=>({matches:false}),{now:()=>0},{reload(){}}];
const ui=await new AsyncFunction(...names,source)(...values);
assert.equal(nodes.get('loading').hidden,false);assert.equal(ui.engine.q.id,'a01');
for(const show of [()=>ui.showCharacter(),()=>ui.showCharacter('equipment'),()=>ui.showCharacter('skills'),ui.showBag,ui.showJournal,()=>ui.showJournal('side'),()=>ui.showJournal('endings'),ui.showMap,()=>ui.showMap(true),ui.showSaves,ui.showSettings,ui.showAbout,ui.showHelp]){show();assert.equal(nodes.get('panel').open,true);ui.closePanel();assert.equal(ui.engine.paused,false);}
ui.engine.s.hero.x=ui.engine.npc.x;ui.engine.s.hero.y=ui.engine.npc.y;ui.track();let steps=0;while(ui.engine.q.id==='a01'&&steps++<1500){ui.engine.tick(.05);if(!nodes.get('dialogue').hidden){if(nodes.get('dialogue-next').hidden)nodes.get('start-normal')?.click();else ui.nextDialogue();}}assert.equal(ui.engine.q.id,'a02');
// Browser regression: an uncancelled Escape opens settings and then invokes
// the native dialog cancel default on the same key. Model that default here.
function escapeKey(repeat=false){
 const event={key:'Escape',repeat,target:{tagName:'CANVAS'},defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
 events.keydown(event);
 if(!event.defaultPrevented&&nodes.get('panel').open){
  const cancel={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
  for(const handler of nodes.get('panel').listeners.cancel||[])handler(cancel);
  if(!cancel.defaultPrevented)nodes.get('panel').close();
 }
 return event;
}
assert.equal(escapeKey().defaultPrevented,true,'opening Escape cancels its native close default');
assert.equal(nodes.get('panel').open,true);assert.equal(ui.engine.paused,true);
assert.match(nodes.get('panel-content').innerHTML,/江湖设置/);
const pausedState=JSON.stringify(ui.engine.s);for(let n=0;n<60;n++)ui.engine.tick(.05);
assert.equal(JSON.stringify(ui.engine.s),pausedState,'settings freeze the simulation');
escapeKey(true);assert.equal(nodes.get('panel').open,true,'holding the opening Escape cannot resume play');
events.keyup({key:'Escape'});assert.equal(escapeKey().defaultPrevented,false);
assert.equal(nodes.get('panel').open,false,'a second deliberate Escape closes settings');assert.equal(ui.engine.paused,false);
events.keyup({key:'Escape'});
ui.engine.travel(ui.engine.q.map);for(let i=0;i<3000&&ui.engine.s.map!==ui.engine.q.map;i++)ui.engine.tick(.05);ui.showShop();assert.equal(nodes.get('panel').open,true);ui.closePanel();
for(const marker of ui.engine.markers.filter(m=>m.kind==='side')){ui.showSide(marker.id);ui.closePanel();}
globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;
const gradient=(...coordinates)=>{
 for(const coordinate of coordinates)assert.ok(Number.isFinite(coordinate),'Gradient coordinate');
 return {addColorStop(offset,color){assert.ok(Number.isFinite(offset)&&offset>=0&&offset<=1,'Gradient color offset');assert.equal(typeof color,'string');}};
};
let draws=0;const context=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient},{get:(target,prop)=>target[prop]??((...args)=>{if(['translate','scale','ellipse','arc','fillRect','clearRect','moveTo','lineTo'].includes(prop))for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),prop);if(prop==='drawImage'){assert.ok(args[0],'Image reference');draws++;for(const v of args.slice(1))assert.ok(Number.isFinite(v));}}),set:(target,key,value)=>(target[key]=value,true)});
const canvas={clientWidth:1440,clientHeight:900,getContext:()=>context};const assets=Object.fromEntries(['lake-original','town-original','forest-original','characters-original','hero-kneel-original','mei-original','cliff','inn','temple','hall','island','cave','bedroom','props','npcs'].map(k=>[k,{}]));
const renderEngine=new core.GameEngine();const r=new ActualRenderer(canvas,canvas,renderEngine,assets);
for(let i=0;i<core.QUESTS.length;i++){
 // Each renderer fixture begins in its own valid scene, not at a previous
 // chapter's hero position or with another chapter's combat progress.
 renderEngine.s=core.freshState();renderEngine.s.quest=i;const q=renderEngine.q;
 renderEngine.s.map=q.map;renderEngine.s.flags.route=q.when?.route||'good';
 if(q.when?.flag)renderEngine.s.flags[q.when.flag]=true;
 for(const flag of q.requiredFlags||[])renderEngine.s.flags[flag]=true;
 for(const alternatives of q.requiredAnyFlags||[])renderEngine.s.flags[alternatives[0]]=true;
 Object.assign(renderEngine.s.hero,renderEngine.scene.spawn);renderEngine.s.phase='talk';r.draw();
 if(['battle','boss'].includes(q.type)){renderEngine.startBattle();r.draw();}
 if(q.type==='search'){renderEngine.s.phase='search';r.draw();}
}
assert.ok(draws>133);console.log(JSON.stringify({result:'PASS',startup:true,menuScreens:13,dialogueProgression:true,rendererScenes:core.QUESTS.length,drawCalls:draws,note:'Non-browser runtime checks; visual browser QA is recorded separately in docs/quality-review.md'},null,2));
