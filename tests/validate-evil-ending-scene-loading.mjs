import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GameEngine,freshState,QUESTS} from '../public/runtime.mjs';
import {Renderer} from '../public/renderer-v3.mjs';
const source=fs.readFileSync(new URL('../public/journey.js',import.meta.url),'utf8');
const slice=(from,to)=>{const a=source.indexOf(from),b=source.indexOf(to,a);assert(a>=0&&b>a,from);return source.slice(a,b);};
const actual=[slice('function loadArt(','try{await prepareScene()}'),slice('async function loadStagingScene()','function prefs()'),slice('function sceneIntro()','function showDialogue('),slice('engine.onEvent=','function openPanel('),slice('function track()',"window.addEventListener('resize'")].join(String.fromCharCode(10));
const copy=x=>JSON.parse(JSON.stringify(x)),flush=()=>new Promise(resolve=>setImmediate(resolve));
const economy=g=>copy({coins:g.s.coins,kills:g.s.kills,exp:g.s.hero.exp,potions:g.s.potions,elixirs:g.s.elixirs,combatClaims:g.s.combatClaims});
function setup(){
 const state=freshState();state.quest=QUESTS.findIndex(q=>q.id==='e14_sleep');state.map=QUESTS[state.quest].map;
 Object.assign(state.flags,{route:'evil',evil:3,evilFinalOutcome:'alone',evilFinalCruel:true,evilFinalMercy:false,evilFinalBuried:true});
 const engine=new GameEngine(state),requests=[],notices=[],saved=[],nodes=new Map(),roomArt=engine.scene.art;
 const assets=Object.fromEntries(['characters-original','mei-original','hero-kneel-original','props','npcs',roomArt,engine.region.art].map(name=>[name,{name}]));
 class ImageMock{set src(url){this.name=url.split('/').at(-1).replace(/\.png$/,'');requests.push(this);}}
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},firstChild:{textContent:''},innerHTML:'',alt:''});return nodes.get(id);};
 const context={engine,assets,assetLoads:new Map(),Image:ImageMock,sceneLoadToken:0,sceneLoadFailed:false,deferChoicePresentation:false,QUESTS,
  $:node,document:{querySelector:()=>node('hero-name')},requestAnimationFrame:fn=>fn(),esc:String,
  save(){saved.push(copy({...engine.s,questId:engine.q.id}));return true;},updateUi(){},toast:text=>notices.push(text),notice(){},
  showDialogue(lines,done){engine.paused=false;done();},showDefeat(){throw Error('Unexpected defeat');},showStoryFailure(){throw Error('Unexpected story failure');},
 };
 vm.createContext(context);vm.runInContext(actual,context);return {engine,context,requests,notices,saved,assets,roomArt};
}
async function enterDreamThroughSleep(test){
 const {engine,context,requests}=test;assert.equal(engine.q.id,'e14_sleep');context.sceneIntro();await flush();assert.equal(engine.sceneLoading,false);
 for(let i=0;i<16000&&engine.q.id==='e14_sleep';i++){engine.tick(.05);if(i%20===0)await flush();}
 await flush();assert.equal(engine.q.id,'e14_dream');assert.equal(engine.s.flags.evilFinalSleep,true);assert.ok(engine.s.done.includes('e14_sleep'));assert.equal(engine.s.map,'r_evil_final_room');assert.equal(engine.scene.art,'evil-final-dream');assert.equal(engine.s.sequence,null,'quest changes the art before dream staging starts');
 assert.equal(engine.sceneLoading,true);assert.equal(engine.s.enemies.length,0);assert.equal(requests.filter(r=>r.name==='evil-final-dream').length,1,'same-map quest event requests dream image');
 const checkpoint=copy(engine.s),playTime=engine.s.playTime;for(let i=0;i<120;i++)engine.tick(.05);assert.equal(engine.s.playTime,playTime);assert.deepEqual(engine.s,checkpoint,'the next scene cannot run ahead of its missing image');assert.equal(engine.interact(),false);assert.equal(engine.cast(0),false);return requests.at(-1);
}
async function finishDreamPrelude(test){
 const {engine,assets}=test;assert.equal(engine.sceneLoading,false);assert.equal(engine.sceneLoadFailed,false);const before=economy(engine);
 for(let i=0;i<16000&&engine.s.phase!=='battle';i++){engine.tick(.05);if(i%20===0)await flush();}
 assert.equal(engine.q.id,'e14_dream');assert.equal(engine.s.phase,'battle');assert.equal(engine.s.enemies.length,4);assert.equal(engine.s.sequence,null);assert.equal(engine.s.map,'r_evil_final_room');assert.ok(!engine.s.visited.some(id=>id==='evilFinalDream'||id.startsWith('dream:')));assert.deepEqual(economy(engine),before);
 const render=Object.assign(Object.create(Renderer.prototype),{e:engine,assets}),drawn=[];render.backgroundImage({drawImage:(art)=>drawn.push(art),fillRect(){throw Error('Missing background');}},1536,1024);assert.equal(drawn[0],assets['evil-final-dream']);assert.notEqual(drawn[0],assets[test.roomArt],'natural four-enemy battle draws the dream image, not the bedroom fallback');
}
let naturalFlows=0,failureRetries=0;
{
 const test=setup(),request=await enterDreamThroughSleep(test);request.onload();await flush();await finishDreamPrelude(test);assert.equal(test.notices.some(x=>x.includes('暂未载入')),false);naturalFlows++;
}
{
 const test=setup(),request=await enterDreamThroughSleep(test),before=economy(test.engine);request.onerror();await flush();assert.equal(test.engine.sceneLoadFailed,true);assert.equal(test.engine.sceneLoading,true);assert.equal(test.assets['evil-final-dream'],undefined);assert.equal(test.requests.length,1,'a failed dream must not request or accept the bedroom fallback');assert.ok(test.notices.some(x=>x.includes('点击指引重试')));
 for(let i=0;i<120;i++)test.engine.tick(.05);assert.equal(test.engine.s.enemies.length,0);assert.equal(test.engine.s.phase,'talk');assert.deepEqual(economy(test.engine),before);
 test.context.track();await flush();assert.equal(test.requests.length,2);assert.equal(test.requests[1].name,'evil-final-dream');assert.equal(test.engine.sceneLoadFailed,false);assert.equal(test.engine.sceneLoading,true);test.requests[1].onload();await flush();await finishDreamPrelude(test);naturalFlows++;failureRetries++;
}
console.log(JSON.stringify({result:'PASS',naturalFlows,failureRetries,note:'Actual journey loader/event/retry functions and natural sleep-to-dream engine progression with controlled image completion; browser screenshot verification remains separate.'}));
