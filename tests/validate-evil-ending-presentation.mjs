import assert from 'node:assert/strict';
import {Renderer} from '../public/renderer-v3.mjs';
import {drawEvilEndingDetails,drawEvilCellGate} from '../public/evil-ending-renderer.mjs';
let checks=0;
function fixture(id='e14_poison',cues={}){
 const calls=[],ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]??((...args)=>calls.push({kind:k,args,color:t.fillStyle})),set:(t,k,v)=>(t[k]=v,true)});
 const state={map:'r_evil_final_room',phase:'staging',hero:{x:805,y:650,hp:100},enemies:[],sequence:null};
 const g={q:{id,map:state.map},s:state,settings:{quality:'high',motion:false},time:0,stagingPresentation:()=>({cues,definition:{steps:[]},actors:[]})};
 globalThis.devicePixelRatio=1;const art={'kerong-original':{id:'kerong'},'yang-child-original':{id:'child'},'characters-original':{id:'adults'},npcs:{id:'npc'},'hero-kneel-original':{id:'kneel'}};
 const r=new Renderer({clientWidth:1280,clientHeight:720,getContext:()=>ctx},{getContext:()=>ctx},g,art);return {r,g,calls};
}
{
 const {r,g,calls}=fixture('e14_family');const before=JSON.stringify(g.s);r.drawActor({id:'child',name:'杨纳康',sprite:0,child:true,x:1050,y:750,pose:'stand',direction:-1});
 const images=calls.filter(c=>c.kind==='drawImage');assert.equal(images.length,1);assert.equal(images[0].args[0].id,'child');assert.equal(images[0].args.at(-1),90);assert(calls.some(c=>c.kind==='fillText'&&c.args[0]==='杨纳康'));assert.equal(JSON.stringify(g.s),before);checks++;
}
{
 const {r,calls}=fixture();r.drawActor({x:805,y:650,pose:'ill'},true);const image=calls.find(c=>c.kind==='drawImage');assert.equal(image.args[0].id,'adults');assert.equal(image.args[4],600,'ill hero uses seated upper body, not standing or a bed quilt');assert(!calls.some(c=>c.kind==='fillText'&&c.args[0]==='卧病休养'));checks++;
}
for(const [id,cues,bowl,poison,time] of [
 ['e14_poison',{evilFinalSoup:'served',evilFinalPoison:'active'},true,true,null],
 ['e14_poison',{evilFinalSoup:'served',evilFinalPoison:'cleared'},true,false,null],
 ['e14_poison',{},false,false,null],
 ['e14_mercy',{evilFinalSoup:'served',evilFinalPoison:'cleared'},false,false,null],
 ['e14_recovery',{evilFinalMonths:'three'},false,false,'三个月后'],
 ['e14_family',{evilFinalYears:'five'},false,false,'五年以后'],
 ['gBad2',{evilFinalSoup:'served',evilFinalPoison:'active'},false,false,null],
 ]){
 const {r,g,calls}=fixture(id,cues),before=JSON.stringify(g.s);drawEvilEndingDetails.call(r);assert.equal(calls.some(c=>c.kind==='fillRect'&&c.color==='#49342a'),bowl);assert.equal(calls.some(c=>c.kind==='fillText'&&c.args[0]==='毒发'),poison);if(time)assert(calls.some(c=>c.kind==='fillText'&&c.args[0]===time));assert.equal(JSON.stringify(g.s),before);checks++;
}
{
 const {r,g,calls}=fixture('e14_poison',{evilFinalSoup:'served',evilFinalPoison:'active'});g.s.map='m49';drawEvilEndingDetails.call(r);assert.equal(calls.length,0,'details cannot follow the hero to a different map');checks++;
}
for(const opened of [false,true]){
 const {r,calls}=fixture('e13'),p={bounds:[945,500,1145,630],door:[965,610,1125,630],h:125,opened},before=JSON.stringify(p);drawEvilCellGate.call(r,p);assert.equal(calls.some(c=>c.kind==='fillRect'&&c.color==='#ac8d52'),!opened);assert(calls.some(c=>c.kind==='lineTo'));assert.equal(JSON.stringify(p),before);checks++;
}
{
 const {r,calls}=fixture('e14_letter');r.drawActor({id:'final-kerong',name:'可容',sprite:1,npcCell:null,x:960,y:620,pose:'stand'});const images=calls.filter(c=>c.kind==='drawImage');assert.equal(images.length,1);assert.equal(images[0].args[0].id,'kerong','disguised maid must not use the male villager atlas');checks++;
}
for(const [w,h] of [[1280,720],[1024,768]]){
 const {r,g}=fixture();r.canvas.clientWidth=w;r.canvas.clientHeight=h;r.resize();g.stagingFocus=()=>({x:930,y:575});for(let i=0;i<150;i++)r.camera();assert(685*r.s+r.cameraY<h-278,'serving table stays above the desktop dialogue at '+w+'x'+h);checks++;
}
console.log(JSON.stringify({result:'PASS',checks,note:'Real rendering calls on independent presentation fixtures; no source fidelity or browser claim.'}));
