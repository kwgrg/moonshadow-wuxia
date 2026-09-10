import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as core from '../public/runtime.mjs';
import {SOURCES} from '../public/campaign.mjs';
import {Renderer as ActualRenderer} from '../public/renderer-v3.mjs';
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
class Renderer{resize(){}draw(){}toWorld(x,y){return{x,y}}}
const raf=()=>0,timer=()=>0;
let source=fs.readFileSync(new URL('../public/journey.js',import.meta.url),'utf8').replace(/^import .+;$/gm,'');
source+='\nreturn {engine,updateUi,showCharacter,showBag,showShop,showJournal,showMap,showSaves,showSettings,showAbout,showHelp,showSide,showDialogue,nextDialogue,showChoice,closePanel,track};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const names=[...Object.keys(core),'SOURCES','Renderer','document','window','localStorage','Image','requestAnimationFrame','setTimeout','clearTimeout','setInterval','clearInterval','matchMedia','performance','location'];
const values=[...Object.values(core),SOURCES,Renderer,document,window,localStorage,Image,raf,timer,()=>{},timer,()=>{},()=>({matches:false}),{now:()=>0},{reload(){}}];
const ui=await new AsyncFunction(...names,source)(...values);
assert.equal(nodes.get('loading').hidden,false);assert.equal(ui.engine.q.id,'a01');
for(const show of [()=>ui.showCharacter(),()=>ui.showCharacter('equipment'),()=>ui.showCharacter('skills'),ui.showBag,ui.showJournal,()=>ui.showJournal('side'),()=>ui.showJournal('endings'),ui.showMap,()=>ui.showMap(true),ui.showSaves,ui.showSettings,ui.showAbout,ui.showHelp]){show();assert.equal(nodes.get('panel').open,true);ui.closePanel();assert.equal(ui.engine.paused,false);}
ui.engine.s.hero.x=ui.engine.npc.x;ui.engine.s.hero.y=ui.engine.npc.y;ui.track();assert.equal(nodes.get('dialogue').hidden,false);let steps=0;while(ui.engine.q.id==='a01'&&steps++<20)ui.nextDialogue();assert.equal(ui.engine.q.id,'a02');
ui.engine.travel(ui.engine.q.map);ui.showShop();assert.equal(nodes.get('panel').open,true);ui.closePanel();
for(const marker of ui.engine.markers.filter(m=>m.kind==='side')){ui.showSide(marker.id);ui.closePanel();}
globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;
let draws=0;const context=new Proxy({},{get:(target,prop)=>target[prop]??((...args)=>{if(['translate','scale','ellipse','arc','fillRect','clearRect','moveTo','lineTo'].includes(prop))for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),prop);if(prop==='drawImage'){assert.ok(args[0],'Image reference');draws++;for(const v of args.slice(1))assert.ok(Number.isFinite(v));}}),set:(target,key,value)=>(target[key]=value,true)});
const canvas={clientWidth:1440,clientHeight:900,getContext:()=>context};const assets=Object.fromEntries(['wudang','lake','town','forest','snow','characters'].map(k=>[k,{}]));
const renderEngine=new core.GameEngine();const r=new ActualRenderer(canvas,canvas,renderEngine,assets);
for(let i=0;i<core.QUESTS.length;i++){renderEngine.s.quest=i;renderEngine.s.map=renderEngine.q.map;renderEngine.s.phase='talk';r.draw();if(['battle','boss'].includes(renderEngine.q.type)){renderEngine.startBattle();r.draw();}if(renderEngine.q.type==='search'){renderEngine.s.phase='search';r.draw();}}
assert.ok(draws>133);console.log(JSON.stringify({result:'PASS',startup:true,menuScreens:13,dialogueProgression:true,rendererScenes:core.QUESTS.length,drawCalls:draws,note:'Non-browser runtime checks; visual browser QA and live WebMCP remain unverified'},null,2));
